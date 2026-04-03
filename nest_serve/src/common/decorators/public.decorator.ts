import { SetMetadata } from '@nestjs/common';
import { IS_PUBLIC_KEY } from '@/common/constants/public-route';

export { IS_PUBLIC_KEY };

/** 跳过全局 JWT 校验 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
