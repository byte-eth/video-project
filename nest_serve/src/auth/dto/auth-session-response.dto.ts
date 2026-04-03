import { Expose, Type } from 'class-transformer';

export class UserSummaryExposeDto {
  @Expose()
  id: number;

  @Expose()
  email: string;

  @Expose()
  username: string;

  @Expose()
  publicKey: string;
}

/** 登录 / 刷新 统一 data 形态（配合 ApiResponseInterceptor + @Expose） */
export class AuthSessionResponseDto {
  @Expose()
  access_token: string;

  @Expose()
  refresh_token: string;

  /** access_token 剩余有效秒数 */
  @Expose()
  expires_in: number;

  @Expose()
  @Type(() => UserSummaryExposeDto)
  user: UserSummaryExposeDto;
}
