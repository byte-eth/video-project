import { Controller, Post, Body, Get, Req } from '@nestjs/common';
import type { Request } from 'express';
import { AuthService } from '@/auth/auth.service';
import { LoginDto } from '@/auth/dto/login.dto';
import { RefreshTokenDto } from '@/auth/dto/refresh-token.dto';
import { CreateUserDto } from '@/users/dto/create-user.dto';
import { ForgotPasswordSendDto } from '@/auth/dto/forgot-password-send.dto';
import { ForgotPasswordResetDto } from '@/auth/dto/forgot-password-reset.dto';
import { Public } from '@/common/decorators/public.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { JwtPayload } from '@/auth/types/jwt-payload.interface';
import { resolveRequestLang } from '@/i18n/request-lang.util';
import {
  resolveClientIp,
  truncateUserAgent,
} from '@/auth/client-request.util';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('login')
  async login(@Body() loginDto: LoginDto, @Req() req: Request) {
    return this.authService.login(loginDto, {
      ip: resolveClientIp(req),
      userAgent: truncateUserAgent(req.headers['user-agent']),
    });
  }

  @Public()
  @Post('refresh')
  async refresh(@Body() body: RefreshTokenDto) {
    return this.authService.refresh(body.refresh_token);
  }

  @Public()
  @Post('logout')
  async logout(@Body() body: RefreshTokenDto) {
    await this.authService.logout(body.refresh_token);
  }

  @Public()
  @Post('register')
  async register(@Body() createUserDto: CreateUserDto) {
    return this.authService.register(createUserDto);
  }

  @Public()
  @Post('forgot-password/send-code')
  async forgotPasswordSend(
    @Body() body: ForgotPasswordSendDto,
    @Req() req: Request,
  ) {
    const lang = resolveRequestLang(req);
    await this.authService.forgotPasswordSend(body.email, lang);
    return { ok: true };
  }

  @Public()
  @Post('forgot-password/reset')
  async forgotPasswordReset(@Body() body: ForgotPasswordResetDto) {
    await this.authService.forgotPasswordReset(body);
    return { ok: true };
  }

  @Get('profile')
  async getCurrentUserProfile(@CurrentUser() user: JwtPayload) {
    return this.authService.getProfile(user.sub);
  }
}