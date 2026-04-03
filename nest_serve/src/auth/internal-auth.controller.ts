import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { Public } from '@/common/decorators/public.decorator';
import { InternalApiKeyGuard } from '@/guards/internal-api-key.guard';
import { AuthService } from '@/auth/auth.service';
import { IntrospectTokenDto } from '@/auth/dto/introspect-token.dto';
import { IntrospectTokenResponseDto } from '@/auth/dto/introspect-response.dto';

@Controller('internal/auth')
@Public()
@UseGuards(InternalApiKeyGuard)
export class InternalAuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * 仅内部调用：校验用户 access token，返回库内权威用户信息（含 isVip）。
   * 请求头：X-Internal-Api-Key
   */
  @Post('introspect')
  async introspect(@Body() body: IntrospectTokenDto) {
    const result = await this.authService.introspectAccessToken(body.token);
    return plainToInstance(IntrospectTokenResponseDto, result);
  }
}
