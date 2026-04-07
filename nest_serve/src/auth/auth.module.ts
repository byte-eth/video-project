import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthService } from '@/auth/auth.service';
import { AuthController } from '@/auth/auth.controller';
import { InternalAuthController } from '@/auth/internal-auth.controller';
import { UsersModule } from '@/users/users.module';
import { JwtModule } from '@nestjs/jwt';
import { jwtConfig } from '@/config/jwt.config';
import { InternalApiKeyGuard } from '@/guards/internal-api-key.guard';
import { LoadCurrentUserInterceptor } from '@/common/interceptors/load-current-user.interceptor';
import { RefreshToken } from '@/entities/refresh-token.entity';
import { PasswordResetCode } from '@/entities/password-reset-code.entity';
import { LoginLogShardService } from '@/auth/login-log-shard.service';
import { MailService } from '@/auth/mail.service';

@Module({
  imports: [
    UsersModule,
    TypeOrmModule.forFeature([RefreshToken, PasswordResetCode]),
    JwtModule.register(jwtConfig),
  ],
  providers: [
    AuthService,
    LoginLogShardService,
    MailService,
    InternalApiKeyGuard,
    LoadCurrentUserInterceptor,
  ],
  controllers: [AuthController, InternalAuthController],
  exports: [AuthService, LoadCurrentUserInterceptor],
})
export class AuthModule {}
    