/** 与 `@Public()` 使用同一 key，供 Guard 读取 */
export const IS_PUBLIC_KEY = 'isPublic';

/**
 * 不要求 access token 的 POST 路由（与 AuthController 一致）。
 * 作为元数据失效时的兜底，避免登录/注册被全局 JWT 守卫误拦。
 */
export const AUTH_POST_ANONYMOUS_SUFFIXES = [
  '/auth/login',
  '/auth/register',
  // '/auth/refresh',
  // '/auth/logout',
] as const;

export function isAuthAnonymousPostPath(rawPath: string): boolean {
  const path = rawPath.split('?')[0].replace(/\/+$/, '') || '/';
  return AUTH_POST_ANONYMOUS_SUFFIXES.some(
    suffix => path === suffix || path.endsWith(suffix),
  );
}
