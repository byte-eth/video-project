import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '@/entities/user.entity';
import { CreateUserDto } from '@/users/dto/create-user.dto';
import { generateKeyPairSync } from 'crypto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  private async generateUniqueInviteCode(): Promise<string> {
    const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    // 简单 8 位码，避免易混淆字符
    const randomCode = () =>
      Array.from({ length: 8 })
        .map(
          () => alphabet[Math.floor(Math.random() * alphabet.length)],
        )
        .join('');

    // 循环直到生成唯一邀请码
    // 在用户量较小时碰撞概率极低
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const code = randomCode();
      const existing = await this.usersRepository.findOne({
        where: { inviteCode: code },
      });
      if (!existing) return code;
    }
  }

  async create(createUserDto: CreateUserDto): Promise<User> {
    // 生成RSA密钥对
    const { publicKey, privateKey } = generateKeyPairSync('rsa', {
      modulusLength: 2048,
      publicKeyEncoding: {
        type: 'spki',
        format: 'pem',
      },
      privateKeyEncoding: {
        type: 'pkcs8',
        format: 'pem',
      },
    });

    const { inviteCode: inviterCode, ...rest } = createUserDto;

    const user = this.usersRepository.create({
      ...rest,
      publicKey,
      privateKey,
    });

    user.inviteCode = await this.generateUniqueInviteCode();

    if (inviterCode) {
      const inviter = await this.usersRepository.findOne({
        where: { inviteCode: inviterCode },
      });
      if (inviter) {
        user.invitedByUserId = inviter.id;
      }
    }

    return this.usersRepository.save(user);
  }

  async findOneByEmail(email: string): Promise<User | undefined> {
    // @ts-ignore
    return this.usersRepository.findOne({ where: { email } });
  }

  /** 邮箱不区分大小写（用于找回密码等） */
  async findOneByEmailNormalized(email: string): Promise<User | undefined> {
    const e = email.trim().toLowerCase();
    const row = await this.usersRepository
      .createQueryBuilder('u')
      .where('LOWER(TRIM(u.email)) = :e', { e })
      .getOne();
    return row ?? undefined;
  }

  async findOneById(id: number): Promise<User> {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`User with id ${id} not found`);
    }
    return user;
  }

  /** 重置密码（不走 @BeforeInsert，直接写入 bcrypt 哈希） */
  async setPasswordPlain(userId: number, plainPassword: string): Promise<void> {
    const hash = await bcrypt.hash(plainPassword, 10);
    await this.usersRepository.update({ id: userId }, { password: hash });
  }

  /**
   * 当前用户作为邀请人时：被邀请注册用户列表 + 总人数（邀请统计）
   */
  async getInvitationsSummary(inviterId: number): Promise<{
    total: number;
    items: Array<{
      id: number;
      username: string;
      email: string;
      inviteCode: string;
      avatar: string | null;
      isVip: boolean;
      createdAt: string;
    }>;
  }> {
    const [rows, total] = await this.usersRepository.findAndCount({
      where: { invitedByUserId: inviterId },
      order: { createdAt: 'DESC' },
      select: {
        id: true,
        username: true,
        email: true,
        inviteCode: true,
        avatar: true,
        isVip: true,
        createdAt: true,
      },
    });

    return {
      total,
      items: rows.map((u) => ({
        id: u.id,
        username: u.username,
        email: u.email,
        inviteCode: u.inviteCode,
        avatar: u.avatar,
        isVip: u.isVip,
        createdAt:
          u.createdAt instanceof Date ? u.createdAt.toISOString() : String(u.createdAt),
      })),
    };
  }
}
    