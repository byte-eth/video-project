import { NestFactory } from '@nestjs/core';
import { AppModule } from '@/app.module';
import { ValidationPipe } from '@nestjs/common';
import { ApiResponseInterceptor } from '@/interceptors/api-response.interceptor';
import { ConfigService } from '@nestjs/config';
import * as cookieParser from 'cookie-parser';
import * as helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import * as https from 'https';
import * as fs from 'fs';
import { join } from 'path';
import type { Express } from 'express';
import { sendRateLimitExceeded } from '@/security/rate-limit-response.util';

function intFromConfig(
  configService: ConfigService,
  key: string,
  fallback: number,
): number {
  const raw = configService.get<string>(key);
  if (raw == null || raw === '') return fallback;
  const n = Number(raw);
  return Number.isFinite(n) ? n : fallback;
}

function attachLayeredRateLimits(
  expressApp: Express,
  configService: ConfigService,
): void {
  const handler = (
    req: Parameters<typeof sendRateLimitExceeded>[0],
    res: Parameters<typeof sendRateLimitExceeded>[1],
  ): void => {
    sendRateLimitExceeded(req, res);
  };

  const loginWindow = intFromConfig(
    configService,
    'RATE_LIMIT_LOGIN_WINDOW_MS',
    15 * 60 * 1000,
  );
  const loginMax = intFromConfig(configService, 'RATE_LIMIT_LOGIN_MAX', 20);

  const registerWindow = intFromConfig(
    configService,
    'RATE_LIMIT_REGISTER_WINDOW_MS',
    60 * 60 * 1000,
  );
  const registerMax = intFromConfig(configService, 'RATE_LIMIT_REGISTER_MAX', 10);

  const forgotSendWindow = intFromConfig(
    configService,
    'RATE_LIMIT_FORGOT_SEND_WINDOW_MS',
    60 * 60 * 1000,
  );
  const forgotSendMax = intFromConfig(
    configService,
    'RATE_LIMIT_FORGOT_SEND_MAX',
    8,
  );

  const forgotResetWindow = intFromConfig(
    configService,
    'RATE_LIMIT_FORGOT_RESET_WINDOW_MS',
    60 * 60 * 1000,
  );
  const forgotResetMax = intFromConfig(
    configService,
    'RATE_LIMIT_FORGOT_RESET_MAX',
    20,
  );

  const refreshWindow = intFromConfig(
    configService,
    'RATE_LIMIT_REFRESH_WINDOW_MS',
    15 * 60 * 1000,
  );
  const refreshMax = intFromConfig(configService, 'RATE_LIMIT_REFRESH_MAX', 60);

  const globalWindow = intFromConfig(
    configService,
    'RATE_LIMIT_GLOBAL_WINDOW_MS',
    15 * 60 * 1000,
  );
  const globalMax = intFromConfig(configService, 'RATE_LIMIT_GLOBAL_MAX', 300);

  const skipOptions = (req: { method?: string }): boolean =>
    String(req.method || '').toUpperCase() === 'OPTIONS';

  expressApp.use(
    '/auth/login',
    rateLimit({
      windowMs: loginWindow,
      max: loginMax,
      standardHeaders: true,
      legacyHeaders: false,
      skip: skipOptions,
      handler,
    }),
  );
  expressApp.use(
    '/auth/register',
    rateLimit({
      windowMs: registerWindow,
      max: registerMax,
      standardHeaders: true,
      legacyHeaders: false,
      skip: skipOptions,
      handler,
    }),
  );
  expressApp.use(
    '/auth/forgot-password/send-code',
    rateLimit({
      windowMs: forgotSendWindow,
      max: forgotSendMax,
      standardHeaders: true,
      legacyHeaders: false,
      skip: skipOptions,
      handler,
    }),
  );
  expressApp.use(
    '/auth/forgot-password/reset',
    rateLimit({
      windowMs: forgotResetWindow,
      max: forgotResetMax,
      standardHeaders: true,
      legacyHeaders: false,
      skip: skipOptions,
      handler,
    }),
  );
  expressApp.use(
    '/auth/refresh',
    rateLimit({
      windowMs: refreshWindow,
      max: refreshMax,
      standardHeaders: true,
      legacyHeaders: false,
      skip: skipOptions,
      handler,
    }),
  );

  expressApp.use(
    rateLimit({
      windowMs: globalWindow,
      max: globalMax,
      standardHeaders: true,
      legacyHeaders: false,
      skip: (req) => {
        if (skipOptions(req)) return true;
        const p = req.path || '';
        return p.startsWith('/internal');
      },
      handler,
    }),
  );
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const expressApp = app.getHttpAdapter().getInstance() as Express;

  const trustProxy = configService.get<string>('TRUST_PROXY');
  if (trustProxy === '1' || trustProxy === 'true') {
    expressApp.set('trust proxy', 1);
  }

  // CORS配置（必须早于任何可能提前返回的中间件，如 rateLimit）
  app.enableCors({
    origin: true,
    credentials: true,
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'Accept-Language',
      'X-App-Language',
      'X-App-Lang',
      'X-Internal-Api-Key',
    ],
  });

  // @ts-ignore 安全中间件
  app.use(helmet());
  app.use(cookieParser());
  attachLayeredRateLimits(expressApp, configService);
  
  // 全局管道
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );
  
  app.useGlobalInterceptors(new ApiResponseInterceptor());
  
  // 启动应用
  if (process.env.NODE_ENV === 'production') {
    const httpsOptions = {
      key: fs.readFileSync(join(__dirname, '../secrets/private-key.pem')),
      cert: fs.readFileSync(join(__dirname, '../secrets/certificate.pem')),
    };
    
    const httpsApp = https.createServer(httpsOptions, app.getHttpAdapter().getInstance());
    await httpsApp.listen(configService.get('PORT') || 3006);
    console.log(`应用以HTTPS模式运行在端口 ${configService.get('PORT') || 3006}`);
  } else {
    await app.listen(configService.get('PORT') || 3006);
    console.log(`应用以HTTP模式运行在端口 ${configService.get('PORT') || 3006}`);
  }
}
bootstrap();
    