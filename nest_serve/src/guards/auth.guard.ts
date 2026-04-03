import { CanActivate, ExecutionContext, HttpStatus, Injectable } from '@nestjs/common';
import { I18nBizError } from '@/common/exceptions/i18n-biz.error';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import {
  IS_PUBLIC_KEY,
  isAuthAnonymousPostPath,
} from '@/common/constants/public-route';
import { JwtPayload } from '@/auth/types/jwt-payload.interface';
import { accessSignOptions } from '@/config/jwt-tokens';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private jwtService: JwtService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request & { user?: JwtPayload }>();

    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const method = request.method;
    const path = request.path || request.url || '';
    if (method === 'POST' && isAuthAnonymousPostPath(path)) {
      return true;
    }

    const authHeader = request.headers.authorization;
    const token =
      authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : authHeader?.split(' ')[1];

    if (!token) {
      throw new I18nBizError('auth.pleaseLogin', HttpStatus.UNAUTHORIZED);
    }

    try {
      const payload = await this.jwtService.verifyAsync<JwtPayload>(token, {
        secret: accessSignOptions().secret as string,
      });
      if (payload.typ === 'refresh') {
        throw new I18nBizError('auth.credentialInvalid', HttpStatus.UNAUTHORIZED);
      }
      request.user = payload;
      return true;
    } catch (e) {
      if (e instanceof I18nBizError) {
        throw e;
      }
      throw new I18nBizError('auth.sessionExpired', HttpStatus.UNAUTHORIZED);
    }
  }
}