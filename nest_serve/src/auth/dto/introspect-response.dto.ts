import { Expose, Type } from 'class-transformer';

export class IntrospectTokenMetaDto {
  @Expose()
  iat?: number;

  @Expose()
  exp?: number;
}

export class IntrospectTokenResponseDto {
  @Expose()
  valid: boolean;

  @Expose()
  error?: string;

  @Expose()
  userId?: number;

  @Expose()
  email?: string;

  @Expose()
  username?: string;

  @Expose()
  isVip?: boolean;

  @Expose()
  @Type(() => IntrospectTokenMetaDto)
  token?: IntrospectTokenMetaDto;
}
