import type { Request } from 'express';

const SUPPORTED = new Set(['zh-CN', 'en-US']);
const DEFAULT_LANG = 'zh-CN';

/** 将 zh-cn / zh / en 等规范为 zh-CN | en-US */
function normalizeLangTag(raw: string | undefined): string | null {
  if (raw == null || !String(raw).trim())
    return null;
  const s = String(raw).trim();
  if (SUPPORTED.has(s))
    return s;
  const lower = s.toLowerCase().replace(/_/g, '-');
  if (lower === 'zh-cn' || lower === 'zh' || lower.startsWith('zh-'))
    return 'zh-CN';
  if (lower === 'en-us' || lower === 'en' || lower.startsWith('en-'))
    return 'en-US';
  return null;
}

/**
 * 优先 X-App-Language / X-App-Lang（与前端约定），其次 Accept-Language 首标签。
 * 大小写、zh-cn / en 等均会归一化。
 */
export function resolveRequestLang(req: Request): string {
  const rawExplicit =
    req.headers['x-app-language'] ?? req.headers['x-app-lang'];
  const explicit = Array.isArray(rawExplicit) ? rawExplicit[0] : rawExplicit;
  const fromExplicit = normalizeLangTag(explicit);
  if (fromExplicit)
    return fromExplicit;

  const accept = req.headers['accept-language'];
  if (accept) {
    const tag = accept.split(',')[0]?.trim().split(';')[0]?.trim();
    const fromAccept = normalizeLangTag(tag);
    if (fromAccept)
      return fromAccept;
  }

  return DEFAULT_LANG;
}
