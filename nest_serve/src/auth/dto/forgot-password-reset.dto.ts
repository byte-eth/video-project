import { IsEmail, IsNotEmpty, Matches, MinLength } from 'class-validator';

export class ForgotPasswordResetDto {
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @Matches(/^\d{6}$/, { message: 'code must be 6 digits' })
  code: string;

  @IsNotEmpty()
  @MinLength(8)
  newPassword: string;
}
