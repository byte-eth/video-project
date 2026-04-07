import { Module, MiddlewareConsumer } from '@nestjs/common';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthModule } from '@/auth/auth.module';
import { UsersModule } from '@/users/users.module';
import { jwtConfig } from '@/config/jwt.config';
import { csrfMiddleware } from '@/middleware/csrf.middleware';
import { AuthGuard } from '@/guards/auth.guard';
import { HttpExceptionFilter } from '@/filters/http-exception.filter';
import { I18nModule } from '@/i18n/i18n.module';
import { SecurityModule } from '@/security/security.module';
import { UploadsModule } from '@/uploads/uploads.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      // 先加载 .env，再加载 .env.secrets；后者同名变量覆盖前者（密钥建议只放 .env.secrets）
      envFilePath: ['.env', '.env.secrets'],
    }),
    I18nModule,
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'mysql',
        host: configService.get('DB_HOST'),
        port: configService.get('DB_PORT'),
        username: configService.get('DB_USERNAME'),
        password: configService.get('DB_PASSWORD'),
        database: configService.get('DB_NAME'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: process.env.NODE_ENV !== 'production',
        logging: process.env.NODE_ENV !== 'production',
      }),
      inject: [ConfigService],
    }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: () => jwtConfig,
      inject: [ConfigService],
    }),
    SecurityModule,
    AuthModule,
    UsersModule,
    UploadsModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
  ],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(csrfMiddleware)
      .exclude(
        'internal/(.*)',
        // { path: 'auth/login', method: RequestMethod.POST },
        // { path: 'auth/register', method: RequestMethod.POST },
      )
      .forRoutes('*');
  }
}
    