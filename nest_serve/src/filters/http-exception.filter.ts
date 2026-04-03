import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { API_CODE } from '@/common/constants/api-code';
import { I18nBizError } from '@/common/exceptions/i18n-biz.error';
import { I18nService } from '@/i18n/i18n.service';
import { resolveRequestLang } from '@/i18n/request-lang.util';

/** 需要前端跳转登录的 i18n key（body.data.redirectLogin = true） */
const AUTH_REDIRECT_KEYS = new Set([
  'auth.pleaseLogin',
  'auth.credentialInvalid',
  'auth.sessionExpired',
  'auth.refreshInvalid',
  'auth.refreshWrongType',
  'auth.refreshRevoked',
  'auth.refreshExpired',
  'auth.userGone',
]);

function extractHttpExceptionMessage(exception: HttpException): string {
  const res = exception.getResponse();
  if (typeof res === 'string')
    return res;
  if (typeof res === 'object' && res !== null) {
    const body = res as Record<string, unknown>;
    const message = body.message;
    if (Array.isArray(message))
      return message.map(String).join('; ');
    if (typeof message === 'string')
      return message;
    if (body.error != null)
      return String(body.error);
  }
  return exception.message;
}

function mapHttpStatusToApiCode(status: number): typeof API_CODE.CLIENT | typeof API_CODE.SERVER {
  if (status >= HttpStatus.INTERNAL_SERVER_ERROR)
    return API_CODE.SERVER;
  if (status >= HttpStatus.BAD_REQUEST && status < HttpStatus.INTERNAL_SERVER_ERROR)
    return API_CODE.CLIENT;
  return API_CODE.SERVER;
}

/**
 * 兼容热更新/多副本下 instanceof 失效，或历史代码仍抛 HttpException 英文文案。
 */
function readI18nBizError(exception: unknown): { i18nKey: string, httpStatus: number } | null {
  if (exception instanceof I18nBizError) {
    return {
      i18nKey: exception.i18nKey,
      httpStatus: exception.httpStatus,
    };
  }
  if (
    exception !== null
    && typeof exception === 'object'
    && exception instanceof Error
    && (exception as Error).name === 'I18nBizError'
    && 'i18nKey' in exception
    && 'httpStatus' in exception
    && typeof (exception as { i18nKey: unknown }).i18nKey === 'string'
    && typeof (exception as { httpStatus: unknown }).httpStatus === 'number'
  ) {
    return {
      i18nKey: (exception as { i18nKey: string }).i18nKey,
      httpStatus: (exception as { httpStatus: number }).httpStatus,
    };
  }
  return null;
}

/** 旧版 Nest 抛出的固定英文，映射到 i18n key */
const LEGACY_HTTP_MSG_TO_I18N: Record<string, string> = {
  'Invalid credentials': 'auth.invalidCredential',
};

@Injectable()
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  constructor(private readonly i18n: I18nService) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const lang = resolveRequestLang(request);

    const i18nBiz = readI18nBizError(exception);
    if (i18nBiz) {
      const code = mapHttpStatusToApiCode(i18nBiz.httpStatus);
      let msg = this.i18n.translate(lang, i18nBiz.i18nKey);
      if (!msg || !String(msg).trim())
        msg = this.i18n.translate(lang, 'common.clientFallback');
      const data = AUTH_REDIRECT_KEYS.has(i18nBiz.i18nKey)
        ? { redirectLogin: true }
        : null;
      response.status(HttpStatus.OK).json({ code, data, msg });
      return;
    }

    let code: typeof API_CODE.CLIENT | typeof API_CODE.SERVER = API_CODE.SERVER;
    let msg = this.i18n.translate(lang, 'common.serverFallback');

    if (exception instanceof HttpException) {
      code = mapHttpStatusToApiCode(exception.getStatus());
      msg = extractHttpExceptionMessage(exception);
      const legacyKey = LEGACY_HTTP_MSG_TO_I18N[msg.trim()];
      if (legacyKey)
        msg = this.i18n.translate(lang, legacyKey);
    }
    else if (exception instanceof Error) {
      // eslint-disable-next-line no-console
      console.error(request.method, request.url, exception);
    }
    else {
      // eslint-disable-next-line no-console
      console.error(request.method, request.url, exception);
    }

    if (!msg || !String(msg).trim()) {
      msg = this.i18n.translate(
        lang,
        code === API_CODE.CLIENT ? 'common.clientFallback' : 'common.serverFallback',
      );
    }

    response.status(HttpStatus.OK).json({
      code,
      data: null,
      msg,
    });
  }
}
