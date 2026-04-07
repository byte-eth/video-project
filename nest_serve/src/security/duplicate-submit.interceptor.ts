import {
  CallHandler,
  ExecutionContext,
  HttpStatus,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { createHash } from 'crypto';
import type { Request } from 'express';
import { Observable } from 'rxjs';
import { I18nBizError } from '@/common/exceptions/i18n-biz.error';
import { resolveClientIp } from '@/auth/client-request.util';
import { ConfigService } from '@nestjs/config';
import type { JwtPayload } from '@/auth/types/jwt-payload.interface';

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== 'object') {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(',')}]`;
  }
  const obj = value as Record<string, unknown>;
  const keys = Object.keys(obj).sort();
  return `{${keys.map(k => `${JSON.stringify(k)}:${stableStringify(obj[k])}`).join(',')}}`;
}

/**
 * 仅拦「极短时间内的完全相同的写请求」（典型双击/连点），适当宽松。
 *
 * 指纹：HTTP 方法 + 路径 + 规范化后的 JSON body + 客户端 IP + 当前用户 id（未登录为 anon）。
 * 窗口内再次出现相同指纹则拒绝；窗口默认 500ms，可用 DEDUPE_WINDOW_MS 调整；设为 0 关闭。
 * 跳过 /internal/*；存储在进程内存，多实例不共享。
 */
@Injectable()
export class DuplicateSubmitInterceptor implements NestInterceptor {
  private readonly fpUntil = new Map<string, number>();

  constructor(private readonly config: ConfigService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context.switchToHttp().getRequest<
      Request & { user?: JwtPayload }
    >();
    const method = req.method;
    if (method !== 'POST' && method !== 'PUT' && method !== 'PATCH') {
      return next.handle();
    }

    const rawPath = req.path || req.url?.split('?')[0] || '';
    if (rawPath.startsWith('/internal')) {
      return next.handle();
    }

    const windowMs = this.intEnv('DEDUPE_WINDOW_MS', 500);
    if (windowMs <= 0) {
      return next.handle();
    }

    const now = Date.now();
    this.prune(now);

    const bodyRaw = stableStringify(req.body);
    const ip = resolveClientIp(req) || 'unknown';
    const userKey = req.user?.sub != null ? String(req.user.sub) : 'anon';
    const fp = createHash('sha256')
      .update(`${method}\n${rawPath}\n${bodyRaw}\n${ip}\n${userKey}`)
      .digest('hex');

    const until = this.fpUntil.get(fp);
    if (until != null && until > now) {
      throw new I18nBizError('security.duplicateSubmit', HttpStatus.TOO_MANY_REQUESTS);
    }
    this.fpUntil.set(fp, now + windowMs);

    return next.handle();
  }

  private prune(now: number): void {
    if (this.fpUntil.size < 5000) return;
    for (const [k, t] of this.fpUntil) {
      if (t <= now) this.fpUntil.delete(k);
    }
  }

  private intEnv(name: string, fallback: number): number {
    const raw = this.config.get<string>(name);
    if (raw == null || raw === '') return fallback;
    const n = Number(raw);
    return Number.isFinite(n) ? n : fallback;
  }
}
