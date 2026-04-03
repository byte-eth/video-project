import { JwtModuleOptions } from '@nestjs/jwt';
import { accessSignOptions } from '@/config/jwt-tokens';

const access = accessSignOptions();

export const jwtConfig: JwtModuleOptions = {
  secret: access.secret as string,
  signOptions: {
    expiresIn: access.expiresIn,
  },
};
    