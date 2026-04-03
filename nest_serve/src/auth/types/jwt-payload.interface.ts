export interface JwtPayload {
  sub: number;
  email: string;
  /** 签发时的快照；权限以库内数据或 introspect 为准 */
  username?: string;
  isVip?: boolean;
  typ?: 'access' | 'refresh';
  iat?: number;
  exp?: number;
}
