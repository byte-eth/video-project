import type { Request } from 'express';

const UA_MAX = 1024;

/** 优先 X-Forwarded-For 首段；需在网关正确剥离客户端 IP 时配合 trust proxy 使用 */
export function resolveClientIp(req: Request): string | null {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.length > 0) {
    const first = forwarded.split(',')[0].trim();
    return first ? first.slice(0, 45) : null;
  }
  const raw = req.ip || req.socket?.remoteAddress;
  return raw ? String(raw).slice(0, 45) : null;
}

export function truncateUserAgent(ua: string | undefined): string | null {
  if (!ua?.trim()) return null;
  const t = ua.trim();
  return t.length <= UA_MAX ? t : t.slice(0, UA_MAX);
}
