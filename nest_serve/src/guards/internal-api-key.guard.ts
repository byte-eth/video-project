import {
  CanActivate,
  ExecutionContext,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { I18nBizError } from '@/common/exceptions/i18n-biz.error';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { timingSafeEqual } from 'crypto';

@Injectable()
export class InternalApiKeyGuard implements CanActivate {
  constructor(private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const expected = this.configService.get<string>('INTERNAL_API_KEY');
    if (!expected?.length) {
      throw new I18nBizError('internal.notConfigured', HttpStatus.UNAUTHORIZED);
    }

    const req = context.switchToHttp().getRequest<Request>();
    const raw = req.headers['x-internal-api-key'];
    const key = Array.isArray(raw) ? raw[0] ?? '' : raw ?? '';

    const a = Buffer.from(key);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) {
      throw new I18nBizError('internal.invalidKey', HttpStatus.UNAUTHORIZED);
    }

    return true;
  }
}
