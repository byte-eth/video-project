import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { UsersService } from '@/users/users.service';
import { AuthGuard } from '@/guards/auth.guard';

@Controller('users')
@UseGuards(AuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.usersService.findOneById(+id);
  }
}
    