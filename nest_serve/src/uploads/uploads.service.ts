import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac } from 'crypto';
import * as path from 'path';
import * as qiniu from 'qiniu';

@Injectable()
export class UploadsService {
  constructor(private readonly configService: ConfigService) {}

  private readonly uploadTokenExpiresSeconds = 15 * 60;
  private readonly allowedDirectories = new Set(['assets', 'avatar', 'public']);

  private getEnvOrThrow(key: string): string {
    const value = this.configService.get<string>(key)?.trim();
    if (!value) {
      throw new InternalServerErrorException(`${key} is not configured`);
    }
    return value;
  }

  private getMaxFileSize(): number {
    const raw = this.configService.get<string>('QINIU_MAX_FILE_SIZE')?.trim();
    const parsed = raw ? Number(raw) : NaN;
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 10 * 1024 * 1024;
  }

  private getCdnDomain(): string | undefined {
    return this.configService.get<string>('QINIU_CDN_DOMAIN')?.trim() || undefined;
  }

  private parseBoolean(raw?: string): boolean {
    if (!raw)
      return false;
    const normalized = raw.trim().toLowerCase();
    return ['1', 'true', 'yes', 'on'].includes(normalized);
  }

  private isPrivateBucket(): boolean {
    return this.parseBoolean(
      this.configService.get<string>('QINIU_PRIVATE_BUCKET')
      || this.configService.get<string>('QINIU_IS_PRIVATE'),
    );
  }

  private getPrivateUrlExpiresSeconds(): number {
    const raw = this.configService.get<string>('QINIU_PRIVATE_URL_EXPIRES')?.trim();
    const parsed = raw ? Number(raw) : NaN;
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 3600;
  }

  private urlSafeBase64(input: Buffer): string {
    return input
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/g, '');
  }

  private signPrivateUrl(baseUrl: string): string {
    const accessKey = this.getEnvOrThrow('QINIU_ACCESS_KEY');
    const secretKey = this.getEnvOrThrow('QINIU_SECRET_KEY');
    const expiresAt = Math.floor(Date.now() / 1000) + this.getPrivateUrlExpiresSeconds();
    const separator = baseUrl.includes('?') ? '&' : '?';
    const urlToSign = `${baseUrl}${separator}e=${expiresAt}`;
    const digest = createHmac('sha1', secretKey).update(urlToSign).digest();
    const encodedDigest = this.urlSafeBase64(digest);
    return `${urlToSign}&token=${accessKey}:${encodedDigest}`;
  }

  resolvePublicFileUrl(rawValue?: string | null): string | null {
    const value = rawValue?.trim();
    if (!value)
      return null;

    const cdnDomain = this.getCdnDomain();
    const normalizedCdn = cdnDomain?.replace(/\/+$/, '');
    const isHttpUrl = /^https?:\/\//i.test(value);
    let baseUrl: string;

    if (isHttpUrl) {
      if (normalizedCdn && !value.startsWith(`${normalizedCdn}/`) && value !== normalizedCdn) {
        return value;
      }
      baseUrl = value;
    }
    else if (normalizedCdn) {
      baseUrl = `${normalizedCdn}/${value.replace(/^\/+/, '')}`;
    }
    else {
      return value;
    }

    if (!this.isPrivateBucket()) {
      return baseUrl;
    }
    return this.signPrivateUrl(baseUrl);
  }

  private buildObjectKey(
    userId: number,
    directory: string,
    fileName?: string,
  ): string {
    const ext = (fileName ? path.extname(fileName) : '').slice(0, 12);
    const random = Math.random().toString(36).slice(2, 10);
    return `${directory}/${userId}/${Date.now()}-${random}${ext}`;
  }

  createQiniuUploadToken(
    userId: number,
    options?: {
      directory?: string;
      fileName?: string;
    },
  ) {
    const accessKey = this.getEnvOrThrow('QINIU_ACCESS_KEY');
    const secretKey = this.getEnvOrThrow('QINIU_SECRET_KEY');
    const bucket = this.getEnvOrThrow('QINIU_BUCKET');
    const directory = options?.directory || 'avatar';
    if (!this.allowedDirectories.has(directory)) {
      throw new BadRequestException(
        'directory must be one of: assets, avatar, public',
      );
    }
    const maxFileSize = this.getMaxFileSize();

    const mac = new qiniu.auth.digest.Mac(accessKey, secretKey);
    const key = this.buildObjectKey(userId, directory, options?.fileName);
    const putPolicy = new qiniu.rs.PutPolicy({
      scope: `${bucket}:${key}`,
      expires: this.uploadTokenExpiresSeconds,
      fsizeLimit: maxFileSize,
      insertOnly: 1,
    });

    const uploadToken = putPolicy.uploadToken(mac);
    const uploadHost = this.configService
      .get<string>('QINIU_UPLOAD_HOST')
      ?.trim();
    const cdnDomain = this.getCdnDomain();
    const fileUrl = cdnDomain
      ? `${cdnDomain.replace(/\/+$/, '')}/${key}`
      : undefined;

    return {
      uploadToken,
      key,
      bucket,
      uploadHost,
      cdnDomain,
      fileUrl,
      expiresIn: this.uploadTokenExpiresSeconds,
      directory,
    };
  }
}
