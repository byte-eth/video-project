import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { instanceToPlain } from 'class-transformer';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { API_CODE } from '@/common/constants/api-code';

/** 业务成功码，与 HTTP 状态分离（HTTP 统一 200） */
export const API_CODE_OK = API_CODE.OK;

export interface ApiSuccessBody<T = unknown> {
  code: number;
  data: T;
  msg: string;
}

function serializeResponseBody(raw: unknown): unknown {
  if (raw == null)
    return raw;
  if (typeof raw !== 'object')
    return raw;
  if (Array.isArray(raw))
    return raw.map(item => serializeResponseBody(item));
  // 纯 POJO（如 service 里手动 return { id, ... }）直接透传，避免被裁成 {}
  if (Object.getPrototypeOf(raw) === Object.prototype)
    return raw;
  return instanceToPlain(raw, {
    excludeExtraneousValues: true,
  });
}

/**
 * 序列化（@Expose）并包装为 { code, data, msg }。
 */
@Injectable()
export class ApiResponseInterceptor implements NestInterceptor {
  intercept(_context: ExecutionContext, next: CallHandler): Observable<ApiSuccessBody> {
    return next.handle().pipe(
      map((raw) => {
        const serialized = serializeResponseBody(raw);
        return {
          code: API_CODE.OK,
          data: serialized === undefined ? null : serialized,
          msg: '',
        };
      }),
    );
  }
}
