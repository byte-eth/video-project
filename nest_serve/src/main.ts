import { NestFactory } from '@nestjs/core';
import { AppModule } from '@/app.module';
import { ValidationPipe } from '@nestjs/common';
import { SerializeInterceptor } from '@/interceptors/serialize.interceptor';
import { HttpExceptionFilter } from '@/filters/http-exception.filter';
import { ConfigService } from '@nestjs/config';
import * as cookieParser from 'cookie-parser';
import * as helmet from 'helmet';
import * as rateLimit from 'express-rate-limit';
import * as https from 'https';
import * as fs from 'fs';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  
  // @ts-ignore 安全中间件
  app.use(helmet());
  app.use(cookieParser());
  app.use(
    // @ts-ignore
    rateLimit({
      windowMs: 15 * 60 * 1000, // 15分钟
      max: 100, // 限制每IP每15分钟最多100次请求
    }),
  );
  
  // 全局管道
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );
  
  // 全局拦截器
  app.useGlobalInterceptors(new SerializeInterceptor());
  
  // 全局异常过滤器
  app.useGlobalFilters(new HttpExceptionFilter());
  
  // CORS配置
  app.enableCors({
    origin: true,
    credentials: true,
  });
  
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
    