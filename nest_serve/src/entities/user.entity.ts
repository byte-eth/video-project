import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  BeforeInsert,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import * as bcrypt from 'bcrypt';
import { IsEmail, IsNotEmpty } from 'class-validator';

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  @IsEmail()
  email: string;

  @Column()
  @IsNotEmpty()
  username: string;

  /** 头像地址（绝对 URL 或站内路径，可为空） */
  @Column({ type: 'text', nullable: true })
  avatar: string | null;

  @Column()
  @IsNotEmpty()
  password: string;

  @Column({ type: 'text', nullable: true })
  publicKey: string;

  @Column({ type: 'text', nullable: true })
  privateKey: string;

  @Column({ unique: true, length: 16 })
  inviteCode: string;

  @Column({ type: 'int', nullable: true })
  invitedByUserId: number | null;

  @ManyToOne(() => User, (user) => user.invitedUsers, { nullable: true })
  @JoinColumn({ name: 'invitedByUserId' })
  invitedBy?: User | null;

  @OneToMany(() => User, (user) => user.invitedBy)
  invitedUsers?: User[];

  @Column({ default: false })
  isVip: boolean;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @BeforeInsert()
  async hashPassword() {
    this.password = await bcrypt.hash(this.password, 10);
  }

  async validatePassword(password: string): Promise<boolean> {
    return bcrypt.compare(password, this.password);
  }
}
    