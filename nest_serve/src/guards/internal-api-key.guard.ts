import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { timingSafeEqual } from 'crypto';

@Injectable()
export class InternalApiKeyGuard implements CanActivate {
  constructor(private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const expected = this.configService.get<string>('INTERNAL_API_KEY');
    if (!expected?.length) {
      throw new UnauthorizedException('Internal API is not configured');
    }

    const req = context.switchToHttp().getRequest<Request>();
    const raw = req.headers['x-internal-api-key'];
    const key = Array.isArray(raw) ? raw[0] ?? '' : raw ?? '';

    const a = Buffer.from(key);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) {
      throw new UnauthorizedException('Invalid internal API key');
    }

    return true;
  }
}
