import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { User } from '@/entities/user.entity';

type ReqWithDbUser = { dbUser?: User };

/** 需配合 `LoadCurrentUserInterceptor` 使用 */
export const CurrentDbUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): User | undefined => {
    return ctx.switchToHttp().getRequest<ReqWithDbUser>().dbUser;
  },
);
