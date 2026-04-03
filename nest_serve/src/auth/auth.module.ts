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

@Module({
  imports: [
    UsersModule,
    TypeOrmModule.forFeature([RefreshToken]),
    JwtModule.register(jwtConfig),
  ],
  providers: [AuthService, InternalApiKeyGuard, LoadCurrentUserInterceptor],
  controllers: [AuthController, InternalAuthController],
  exports: [AuthService, LoadCurrentUserInterceptor],
})
export class AuthModule {}
    