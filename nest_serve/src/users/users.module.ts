import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from '@/users/users.service';
import { UsersController } from '@/users/users.controller';
import { User } from '@/entities/user.entity';
import { JwtModule } from '@nestjs/jwt';
import { jwtConfig } from '@/config/jwt.config';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    JwtModule.register(jwtConfig),
  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}