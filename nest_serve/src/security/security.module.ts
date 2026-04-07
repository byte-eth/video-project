import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { DuplicateSubmitInterceptor } from '@/security/duplicate-submit.interceptor';
import { LoginRiskService } from '@/security/login-risk.service';

@Module({
  providers: [
    LoginRiskService,
    DuplicateSubmitInterceptor,
    {
      provide: APP_INTERCEPTOR,
      useClass: DuplicateSubmitInterceptor,
    },
  ],
  exports: [LoginRiskService],
})
export class SecurityModule {}
