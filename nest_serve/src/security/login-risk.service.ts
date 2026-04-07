import { HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { I18nBizError } from '@/common/exceptions/i18n-biz.error';

type IpState = {
  failCount: number;
  blockedUntil: number;
};

/**
 * 按 IP 的简单登录风控：连续失败达阈值后短时封禁（进程内内存，多实例不共享）。
 */
@Injectable()
export class LoginRiskService {
  private readonly byIp = new Map<string, IpState>();

  constructor(private readonly config: ConfigService) {}

  assertLoginAllowed(ip: string | null): void {
    if (!ip?.trim()) return;
    const state = this.byIp.get(ip);
    if (!state) return;
    if (state.blockedUntil > Date.now()) {
      throw new I18nBizError('security.loginBlocked', HttpStatus.TOO_MANY_REQUESTS);
    }
  }

  onLoginFailure(ip: string | null): void {
    if (!ip?.trim()) return;
    const maxFail = this.intEnv('LOGIN_FAIL_MAX_PER_IP', 8);
    const blockMs = this.intEnv('LOGIN_FAIL_BLOCK_MS', 15 * 60 * 1000);
    const now = Date.now();
    const prev = this.byIp.get(ip) ?? { failCount: 0, blockedUntil: 0 };

    let failCount: number;
    if (prev.blockedUntil > now) {
      failCount = prev.failCount + 1;
    } else if (prev.blockedUntil > 0) {
      failCount = 1;
    } else {
      failCount = prev.failCount + 1;
    }

    let blockedUntil = 0;
    if (failCount >= maxFail) {
      blockedUntil = now + blockMs;
    }

    this.byIp.set(ip, { failCount, blockedUntil });
  }

  onLoginSuccess(ip: string | null): void {
    if (!ip?.trim()) return;
    this.byIp.delete(ip);
  }

  private intEnv(name: string, fallback: number): number {
    const raw = this.config.get<string>(name);
    if (raw == null || raw === '') return fallback;
    const n = Number(raw);
    return Number.isFinite(n) ? n : fallback;
  }
}
