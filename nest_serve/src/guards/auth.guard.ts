import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
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

    const isPublic = this.reflector.getAllAndOverride<boolean>('isPublic', [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const authHeader = request.headers.authorization;
    const token =
      authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : authHeader?.split(' ')[1];

    if (!token) {
      throw new UnauthorizedException('Missing access token');
    }

    try {
      const payload = await this.jwtService.verifyAsync<JwtPayload>(token, {
        secret: accessSignOptions().secret as string,
      });
      if (payload.typ === 'refresh') {
        throw new UnauthorizedException('Use POST /auth/refresh for refresh tokens');
      }
      request.user = payload;
      return true;
    } catch (e) {
      if (e instanceof UnauthorizedException) {
        throw e;
      }
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}