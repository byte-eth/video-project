import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { UsersService } from '@/users/users.service';
import { JwtPayload } from '@/auth/types/jwt-payload.interface';
import { User } from '@/entities/user.entity';

type ReqWithUser = {
  user?: JwtPayload;
  dbUser?: User;
};

/**
 * 在已通过 JWT 校验的请求上，再查库挂载 `request.dbUser`。
 * 按需 `@UseInterceptors(LoadCurrentUserInterceptor)`，避免全局限流库。
 */
@Injectable()
export class LoadCurrentUserInterceptor implements NestInterceptor {
  constructor(private readonly usersService: UsersService) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<unknown>> {
    const req = context.switchToHttp().getRequest<ReqWithUser>();
    const sub = req.user?.sub;
    if (sub != null) {
      try {
        req.dbUser = await this.usersService.findOneById(sub);
      } catch {
        req.dbUser = undefined;
      }
    }
    return next.handle();
  }
}
