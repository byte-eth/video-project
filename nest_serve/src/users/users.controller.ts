import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { UsersService } from '@/users/users.service';
import { AuthGuard } from '@/guards/auth.guard';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import type { JwtPayload } from '@/auth/types/jwt-payload.interface';

@Controller('users')
@UseGuards(AuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  /** 须放在 :id 之上，避免 me 被当成 id */
  @Get('me/invitations')
  async getMyInvitations(@CurrentUser() user: JwtPayload) {
    return this.usersService.getInvitationsSummary(Number(user.sub));
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.usersService.findOneById(+id);
  }
}
    