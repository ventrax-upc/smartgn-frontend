import { DOCUMENT } from '@angular/common';
import { Injectable, inject, signal } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

export type AppLanguage = 'en' | 'es';

export const APP_LANGUAGES: { code: AppLanguage; label: string }[] = [
  { code: 'en', label: 'English' },
  { code: 'es', label: 'Español' },
];

const STORAGE_KEY = 'smartgn-lang';

/*
  Owns the UI language. ngx-translate does the actual lookup; this service only
  picks the initial language (saved choice, then English), persists
  changes and keeps <html lang> in sync.
*/
@Injectable({ providedIn: 'root' })
export class LanguageService {
  private readonly translate = inject(TranslateService);
  private readonly document = inject(DOCUMENT);

  private readonly langSignal = signal<AppLanguage>('en');
  readonly lang = this.langSignal.asReadonly();

  constructor() {
    this.apply(this.readInitial());
  }

  set(lang: AppLanguage): void {
    this.apply(lang);
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch {
      // Storage can be blocked; the language still applies for this session.
    }
  }

  private readInitial(): AppLanguage {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === 'en' || stored === 'es') return stored;
    } catch {
      // Storage can be blocked.
    }
    return 'en';
  }

  private apply(lang: AppLanguage): void {
    this.langSignal.set(lang);
    this.translate.use(lang);
    this.document.documentElement.lang = lang;
  }
}
