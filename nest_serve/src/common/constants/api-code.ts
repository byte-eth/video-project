/** 对外统一业务码：仅 200 / 400 / 500 */
export const API_CODE = {
  OK: 200,
  /** 参数错误、业务失败、鉴权失败等 */
  CLIENT: 400,
  /** 服务内部未捕获异常等 */
  SERVER: 500,
} as const;
