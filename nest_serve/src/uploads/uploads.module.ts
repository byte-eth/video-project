import { Module } from '@nestjs/common';
import { UploadsController } from '@/uploads/uploads.controller';
import { UploadsService } from '@/uploads/uploads.service';

@Module({
  controllers: [UploadsController],
  providers: [UploadsService],
  exports: [UploadsService],
})
export class UploadsModule {}
