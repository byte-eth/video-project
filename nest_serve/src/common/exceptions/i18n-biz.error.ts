import { HttpStatus } from '@nestjs/common';

/**
 * 业务错误：携带 i18n 文案 key，由全局过滤器按请求语言翻译。
 * httpStatus 为 Nest 语义状态（如 401），对外仍会映射为 body.code 400/500。
 */
export class I18nBizError extends Error {
  constructor(
    public readonly i18nKey: string,
    public readonly httpStatus: number = HttpStatus.BAD_REQUEST,
  ) {
    super(i18nKey);
    this.name = 'I18nBizError';
  }
}
