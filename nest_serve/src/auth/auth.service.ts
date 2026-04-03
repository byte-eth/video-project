import { HttpStatus, Injectable, NotFoundException } from '@nestjs/common';
import { I18nBizError } from '@/common/exceptions/i18n-biz.error';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { randomUUID } from 'crypto';
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

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    @InjectRepository(RefreshToken)
    private refreshRepo: Repository<RefreshToken>,
  ) {}

  async validateUser(email: string, password: string): Promise<User | null> {
    const user = await this.usersService.findOneByEmail(email);
    if (user && (await user.validatePassword(password))) {
      return user;
    }
    return null;
  }

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;
    const user = await this.validateUser(email, password);

    if (!user) {
      throw new I18nBizError('auth.invalidCredential', HttpStatus.BAD_REQUEST);
    }

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
