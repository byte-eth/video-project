import { IsEmail, IsNotEmpty } from 'class-validator';

export class ForgotPasswordSendDto {
  @IsNotEmpty()
  @IsEmail()
  email: string;
}
