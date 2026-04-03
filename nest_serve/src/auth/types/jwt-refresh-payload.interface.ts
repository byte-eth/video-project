export interface JwtRefreshPayload {
  sub: number;
  typ: 'refresh';
  jti: string;
  iat?: number;
  exp?: number;
}
