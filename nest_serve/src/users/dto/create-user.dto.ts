import { IsEmail, IsNotEmpty, MinLength, IsOptional, IsString } from 'class-validator';

export class CreateUserDto {
  @IsEmail()
  email: string;

  @IsNotEmpty()
  username: string;

  @IsNotEmpty()
  @MinLength(8)
  password: string;

  /**
   * 邀请人的邀请码（可选）
   */
  @IsOptional()
  @IsString()
  inviteCode?: string;
}
    