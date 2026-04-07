import {
  Injectable,
  Logger,
  OnApplicationBootstrap,
} from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import {
  loginLogTableName,
  loginLogTableNameNextShanghaiMonth,
} from '@/auth/login-log-shard.util';

export type LoginLogInsertRow = {
  userId: number | null;
  emailNorm: string;
  success: boolean;
  failureReason: string | null;
  ip: string | null;
  userAgent: string | null;
};

/**
 * 登录日志按月物理分表 login_logs_YYYY_MM（按 Asia/Shanghai 自然月）。
 * 启动时预建当月与下月表；跨月首次写入若表不存在则自动补建。
 */
@Injectable()
export class LoginLogShardService implements OnApplicationBootstrap {
  private readonly logger = new Logger(LoginLogShardService.name);

  constructor(@InjectDataSource() private readonly ds: DataSource) {}

  /**
   * 在 OnModuleInit 阶段 DataSource 可能尚未连上库，建表会静默失败；
   * 放到 OnApplicationBootstrap 并在成功后打日志，便于在库里核对表名（login_logs_YYYY_MM）。
   */
  async onApplicationBootstrap(): Promise<void> {
    const current = loginLogTableName(new Date());
    const next = loginLogTableNameNextShanghaiMonth(new Date());
    try {
      await this.ensureTable(current);
      await this.ensureTable(next);
      this.logger.log(`登录日志分表已就绪: ${current}, ${next}`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      const stack = e instanceof Error ? e.stack : undefined;
      this.logger.error(
        `登录日志分表创建失败（将仅在首次写入失败时再试）: ${msg}`,
        stack,
      );
    }
  }

  private buildCreateTableSql(table: string): string {
    return (
      `CREATE TABLE IF NOT EXISTS \`${table}\` (` +
      '`id` int NOT NULL AUTO_INCREMENT,' +
      '`userId` int NULL,' +
      '`emailNorm` varchar(255) NOT NULL,' +
      '`success` tinyint NOT NULL DEFAULT 0,' +
      '`failureReason` varchar(32) NULL,' +
      '`ip` varchar(45) NULL,' +
      '`userAgent` text NULL,' +
      '`createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,' +
      'PRIMARY KEY (`id`),' +
      'KEY `idx_user_created` (`userId`,`createdAt`),' +
      'KEY `idx_email_created` (`emailNorm`,`createdAt`),' +
      'KEY `idx_created` (`createdAt`)' +
      ') ENGINE=InnoDB DEFAULT CHARSET=utf8mb4'
    );
  }

  async ensureTable(table: string): Promise<void> {
    await this.ds.query(this.buildCreateTableSql(table));
  }

  private isMissingTableError(err: unknown): boolean {
    const e = err as {
      code?: string;
      errno?: number;
      driverError?: { errno?: number; code?: string };
    };
    return (
      e.code === 'ER_NO_SUCH_TABLE' ||
      e.errno === 1146 ||
      e.driverError?.code === 'ER_NO_SUCH_TABLE' ||
      e.driverError?.errno === 1146
    );
  }

  async insert(row: LoginLogInsertRow): Promise<void> {
    const table = loginLogTableName(new Date());
    const sql =
      `INSERT INTO \`${table}\` ` +
      '(`userId`,`emailNorm`,`success`,`failureReason`,`ip`,`userAgent`) ' +
      'VALUES (?,?,?,?,?,?)';
    const params = [
      row.userId,
      row.emailNorm,
      row.success ? 1 : 0,
      row.failureReason,
      row.ip,
      row.userAgent,
    ];
    try {
      await this.ds.query(sql, params);
    } catch (e) {
      if (!this.isMissingTableError(e)) {
        throw e;
      }
      await this.ensureTable(table);
      await this.ds.query(sql, params);
    }
  }
}
