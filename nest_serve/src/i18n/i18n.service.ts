import { Injectable } from '@nestjs/common';
import { EN_US } from '@/i18n/messages/en-US';
import { ZH_CN } from '@/i18n/messages/zh-CN';

const PACKS: Record<string, Record<string, string>> = {
  'zh-CN': ZH_CN,
  'en-US': EN_US,
};

@Injectable()
export class I18nService {
  translate(lang: string, key: string): string {
    const pack = PACKS[lang] ?? PACKS['zh-CN'];
    const fallback = PACKS['zh-CN'];
    return pack[key] ?? fallback[key] ?? key;
  }
}
