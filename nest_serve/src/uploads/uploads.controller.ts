import { Body, Controller, Post } from '@nestjs/common';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import type { JwtPayload } from '@/auth/types/jwt-payload.interface';
import { QiniuUploadTokenDto } from '@/uploads/dto/qiniu-upload-token.dto';
import { UploadsService } from '@/uploads/uploads.service';

@Controller('uploads')
export class UploadsController {
  constructor(private readonly uploadsService: UploadsService) {}

  @Post('qiniu/token')
  createQiniuToken(
    @CurrentUser() user: JwtPayload,
    @Body() body: QiniuUploadTokenDto,
  ) {
    return this.uploadsService.createQiniuUploadToken(Number(user.sub), {
      directory: body.directory,
      fileName: body.fileName,
    });
  }
}
