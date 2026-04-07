import type { Request, Response } from 'express';
import { API_CODE } from '@/common/constants/api-code';
import { resolveRequestLang } from '@/i18n/request-lang.util';

const MSG: Record<string, string> = {
  'zh-CN': '请求过于频繁，请稍后再试',
  'en-US': 'Too many requests. Please try again later.',
};

/** Express rate-limit 自定义响应，与 HttpExceptionFilter 的 { code, data, msg } 形态一致 */
export function sendRateLimitExceeded(req: Request, res: Response): void {
  // 兜底：rateLimit 可能在 Nest CORS 之前提前返回，导致浏览器报“跨域”
  const origin = req.headers.origin;
  if (typeof origin === 'string' && origin.trim()) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader(
      'Access-Control-Allow-Headers',
      [
        'Content-Type',
        'Authorization',
        'Accept-Language',
        'X-App-Language',
        'X-App-Lang',
        'X-Internal-Api-Key',
      ].join(', '),
    );
    res.setHeader(
      'Access-Control-Allow-Methods',
      'GET,POST,PUT,PATCH,DELETE,OPTIONS',
    );
  }
  const lang = resolveRequestLang(req);
  const msg = MSG[lang] ?? MSG['zh-CN'];
  res.status(200).json({ code: API_CODE.CLIENT, data: null, msg });
}
