import { JwtSignOptions } from '@nestjs/jwt';

export function accessSignOptions(): JwtSignOptions {
  return {
    secret: process.env.JWT_SECRET || 'your-secret-key',
    expiresIn: process.env.JWT_EXPIRES_IN || '15m',
  };
}

export function refreshSignOptions(): JwtSignOptions {
  return {
    secret:
      process.env.JWT_REFRESH_SECRET ||
      `${process.env.JWT_SECRET || 'your-secret-key'}-refresh`,
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  };
}

export function refreshVerifySecret(): string {
  return refreshSignOptions().secret as string;
}
