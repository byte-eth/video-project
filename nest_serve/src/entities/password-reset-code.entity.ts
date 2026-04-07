import { Entity, Column, PrimaryGeneratedColumn, Index } from 'typeorm';

/** 表名显式指定，便于生产环境手写 DDL 与 TypeORM 一致 */
@Entity('password_reset_code')
@Index(['email'])
export class PasswordResetCode {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 255 })
  email: string;

  @Column({ length: 64 })
  codeHash: string;

  @Column({ type: 'datetime' })
  expiresAt: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;
}
