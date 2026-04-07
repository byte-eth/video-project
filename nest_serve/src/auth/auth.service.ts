import {
  HttpStatus,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { I18nBizError } from '@/common/exceptions/i18n-biz.error';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LoginLogShardService } from '@/auth/login-log-shard.service';
import { createHmac, randomInt, randomUUID } from 'crypto';
import { ConfigService } from '@nestjs/config';
import { plainToInstance } from 'class-transformer';
import { UsersService } from '@/users/users.service';
import { LoginDto } from '@/auth/dto/login.dto';
import { User } from '@/entities/user.entity';
import { JwtPayload } from '@/auth/types/jwt-payload.interface';
import { JwtRefreshPayload } from '@/auth/types/jwt-refresh-payload.interface';
import { RefreshToken } from '@/entities/refresh-token.entity';
import {
  accessSignOptions,
  refreshSignOptions,
  refreshVerifySecret,
} from '@/config/jwt-tokens';
import { AuthSessionResponseDto } from '@/auth/dto/auth-session-response.dto';
import { PasswordResetCode } from '@/entities/password-reset-code.entity';
import { MailService } from '@/auth/mail.service';
import { ForgotPasswordResetDto } from '@/auth/dto/forgot-password-reset.dto';

const FORGOT_CODE_TTL_MS = 10 * 60 * 1000;
const FORGOT_SEND_COOLDOWN_MS = 60 * 1000;

type LoginAuditContext = {
  ip: string | null;
  userAgent: string | null;
};

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly mailService: MailService,
    @InjectRepository(RefreshToken)
    private refreshRepo: Repository<RefreshToken>,
    @InjectRepository(PasswordResetCode)
    private readonly resetCodeRepo: Repository<PasswordResetCode>,
    private readonly loginLogShard: LoginLogShardService,
  ) {}

  async validateUser(email: string, password: string): Promise<User | null> {
    const user = await this.usersService.findOneByEmail(email);
    if (user && (await user.validatePassword(password))) {
      return user;
    }
    return null;
  }

  async login(loginDto: LoginDto, auditCtx?: LoginAuditContext) {
    const { email, password } = loginDto;
    const emailNorm = email.trim().toLowerCase();
    const user = await this.validateUser(email, password);

    if (!user) {
      const existing =
        await this.usersService.findOneByEmailNormalized(emailNorm);
      await this.safeInsertLoginLog({
        userId: existing ? existing.id : null,
        emailNorm,
        success: false,
        failureReason: existing ? 'bad_password' : 'unknown_account',
        ip: auditCtx?.ip ?? null,
        userAgent: auditCtx?.userAgent ?? null,
      });
      throw new I18nBizError('auth.invalidCredential', HttpStatus.BAD_REQUEST);
    }

    await this.safeInsertLoginLog({
      userId: user.id,
      emailNorm,
      success: true,
      failureReason: null,
      ip: auditCtx?.ip ?? null,
      userAgent: auditCtx?.userAgent ?? null,
    });

    const session = await this.issueTokensForUser(user);
    return plainToInstance(AuthSessionResponseDto, session);
  }

  async refresh(refreshToken: string) {
    let payload: JwtRefreshPayload;
    try {
      payload = await this.jwtService.verifyAsync<JwtRefreshPayload>(
        refreshToken,
        { secret: refreshVerifySecret() },
      );
    } catch {
      throw new I18nBizError('auth.refreshInvalid', HttpStatus.UNAUTHORIZED);
    }

    if (payload.typ !== 'refresh') {
      throw new I18nBizError('auth.refreshWrongType', HttpStatus.UNAUTHORIZED);
    }

    const row = await this.refreshRepo.findOne({
      where: { jti: payload.jti },
    });
    if (!row) {
      throw new I18nBizError('auth.refreshRevoked', HttpStatus.UNAUTHORIZED);
    }
    if (row.expiresAt.getTime() < Date.now()) {
      await this.refreshRepo.delete({ id: row.id });
      throw new I18nBizError('auth.refreshExpired', HttpStatus.UNAUTHORIZED);
    }

    let user: User;
    try {
      user = await this.usersService.findOneById(payload.sub);
    } catch (e) {
      if (e instanceof NotFoundException) {
        await this.refreshRepo.delete({ id: row.id });
        throw new I18nBizError('auth.userGone', HttpStatus.UNAUTHORIZED);
      }
      throw e;
    }

    await this.refreshRepo.delete({ id: row.id });

    const session = await this.issueTokensForUser(user);
    return plainToInstance(AuthSessionResponseDto, session);
  }

  async logout(refreshToken: string): Promise<void> {
    try {
      const payload = await this.jwtService.verifyAsync<JwtRefreshPayload>(
        refreshToken,
        { secret: refreshVerifySecret() },
      );
      if (payload.typ !== 'refresh') {
        return;
      }
      await this.refreshRepo.delete({ jti: payload.jti });
    } catch {
      /* 已过期或伪造的 token，登出仍视为成功 */
    }
  }

  async register(createUserDto: any) {
    return this.usersService.create(createUserDto);
  }

  private resetCodePepper(): string {
    return (
      this.configService.get<string>('RESET_CODE_PEPPER') ||
      this.configService.get<string>('JWT_SECRET') ||
      'dev-reset-code-pepper'
    );
  }

  private hashResetCode(emailNorm: string, code: string): string {
    return createHmac('sha256', this.resetCodePepper())
      .update(`${emailNorm}:${code}`)
      .digest('hex');
  }

  private genSixDigitCode(): string {
    return String(randomInt(0, 1_000_000)).padStart(6, '0');
  }

  /**
   * 未注册邮箱也返回成功，避免被用来枚举账号。
   */
  async forgotPasswordSend(emailRaw: string, lang: string): Promise<void> {
    if (!this.mailService.isConfigured()) {
      throw new I18nBizError(
        'auth.forgotSmtpNotConfigured',
        HttpStatus.BAD_REQUEST,
      );
    }
    const email = emailRaw.trim().toLowerCase();
    const user = await this.usersService.findOneByEmailNormalized(email);
    if (!user)
      return;

    const latest = await this.resetCodeRepo.findOne({
      where: { email },
      order: { id: 'DESC' },
    });
    if (
      latest &&
      Date.now() - new Date(latest.createdAt).getTime() < FORGOT_SEND_COOLDOWN_MS
    ) {
      throw new I18nBizError('auth.forgotCooldown', HttpStatus.BAD_REQUEST);
    }

    await this.resetCodeRepo.delete({ email });
    const code = this.genSixDigitCode();
    const codeHash = this.hashResetCode(email, code);
    await this.resetCodeRepo.save(
      this.resetCodeRepo.create({
        email,
        codeHash,
        expiresAt: new Date(Date.now() + FORGOT_CODE_TTL_MS),
      }),
    );

    try {
      await this.mailService.sendPasswordResetCode(user.email, code, lang);
    } catch {
      await this.resetCodeRepo.delete({ email });
      throw new I18nBizError('auth.forgotMailFailed', HttpStatus.BAD_REQUEST);
    }
  }

  async forgotPasswordReset(dto: ForgotPasswordResetDto): Promise<void> {
    const email = dto.email.trim().toLowerCase();
    const row = await this.resetCodeRepo.findOne({
      where: { email },
      order: { id: 'DESC' },
    });
    if (!row || row.expiresAt.getTime() < Date.now()) {
      throw new I18nBizError('auth.forgotCodeInvalid', HttpStatus.BAD_REQUEST);
    }
    if (this.hashResetCode(email, dto.code) !== row.codeHash) {
      throw new I18nBizError('auth.forgotCodeInvalid', HttpStatus.BAD_REQUEST);
    }
    const user = await this.usersService.findOneByEmailNormalized(email);
    if (!user) {
      await this.resetCodeRepo.delete({ email });
      throw new I18nBizError('auth.forgotCodeInvalid', HttpStatus.BAD_REQUEST);
    }
    await this.usersService.setPasswordPlain(user.id, dto.newPassword);
    await this.resetCodeRepo.delete({ email });
  }

  async getProfile(userId: number) {
    const user = await this.usersService.findOneById(userId);
    return {
      id: user.id,
      email: user.email,
      username: user.username,
      avatar: user.avatar,
      publicKey: user.publicKey,
      isVip: user.isVip,
      createdAt: user.createdAt,
      inviteCode: user.inviteCode,
    };
  }

  /**
   * 校验 access token 并返回数据库中的当前用户信息（内部服务 / 权威 isVip 用）。
   */
  async introspectAccessToken(accessToken: string) {
    let payload: JwtPayload;
    try {
      payload = await this.jwtService.verifyAsync<JwtPayload>(
        accessToken,
        { secret: accessSignOptions().secret as string },
      );
    } catch {
      return { valid: false as const, error: 'invalid_token' };
    }

    if (payload.typ === 'refresh') {
      return { valid: false as const, error: 'wrong_token_type' };
    }

    try {
      const user = await this.usersService.findOneById(payload.sub);
      return {
        valid: true as const,
        userId: user.id,
        email: user.email,
        username: user.username,
        isVip: user.isVip,
        token: {
          iat: payload.iat,
          exp: payload.exp,
        },
      };
    } catch (e) {
      if (e instanceof NotFoundException) {
        return { valid: false as const, error: 'user_not_found' };
      }
      throw e;
    }
  }

  private async safeInsertLoginLog(row: {
    userId: number | null;
    emailNorm: string;
    success: boolean;
    failureReason: string | null;
    ip: string | null;
    userAgent: string | null;
  }): Promise<void> {
    try {
      await this.loginLogShard.insert({
        userId: row.userId,
        emailNorm: row.emailNorm,
        success: row.success,
        failureReason: row.failureReason,
        ip: row.ip,
        userAgent: row.userAgent,
      });
    } catch (e) {
      this.logger.warn(
        `login log insert failed: ${e instanceof Error ? e.message : String(e)}`,
      );
    }
  }

  private async issueTokensForUser(user: User) {
    const jti = randomUUID();
    const accessPayload: JwtPayload = {
      sub: user.id,
      email: user.email,
      username: user.username,
      isVip: user.isVip,
      typ: 'access',
    };

    const access_token = this.jwtService.sign(accessPayload, accessSignOptions());
    const refresh_token = this.jwtService.sign(
      { sub: user.id, typ: 'refresh' as const, jti },
      refreshSignOptions(),
    );

    const accessDecoded = this.jwtService.decode(access_token) as {
      exp: number;
    };
    const refreshDecoded = this.jwtService.decode(refresh_token) as {
      exp: number;
    };
    const expires_in = accessDecoded.exp - Math.floor(Date.now() / 1000);

    await this.refreshRepo.save(
      this.refreshRepo.create({
        userId: user.id,
        jti,
        expiresAt: new Date(refreshDecoded.exp * 1000),
      }),
    );

    return {
      access_token,
      refresh_token,
      expires_in,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        avatar: user.avatar,
        publicKey: user.publicKey,
        inviteCode: user.inviteCode,
      },
    };
  }
}
