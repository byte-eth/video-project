import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

export class QiniuUploadTokenDto {
  @IsOptional()
  @IsString()
  @IsIn(['assets', 'avatar', 'public'])
  directory?: 'assets' | 'avatar' | 'public';

  @IsOptional()
  @IsString()
  @MaxLength(128)
  fileName?: string;
}
