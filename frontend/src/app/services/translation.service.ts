import { Injectable, signal, computed } from '@angular/core';
import { EN } from '../i18n/en';
import { ES } from '../i18n/es';

export type Lang = 'en' | 'es';

const DICTIONARIES: Record<Lang, Record<string, string>> = {
  en: EN,
  es: ES,
};

@Injectable({
  providedIn: 'root',
})
export class TranslationService {
  private readonly STORAGE_KEY = 'mechanic_app_lang';

  /** Reactive signal for the current language */
  readonly currentLang = signal<Lang>(this.getSavedLang());

  /** Convenience alias — reads the signal */
  get lang(): Lang {
    return this.currentLang();
  }

  setLang(lang: Lang): void {
    this.currentLang.set(lang);
    localStorage.setItem(this.STORAGE_KEY, lang);
  }

  /** Translate a key, with optional interpolation params like {appName} */
  t(key: string, params?: Record<string, string | number>): string {
    const lang = this.currentLang();
    let value = DICTIONARIES[lang]?.[key] || DICTIONARIES['en']?.[key] || key;
    if (params) {
      Object.keys(params).forEach((p) => {
        value = value.replace(new RegExp(`\\{${p}\\}`, 'g'), String(params[p]));
      });
    }
    return value;
  }

  private getSavedLang(): Lang {
    const saved = localStorage.getItem(this.STORAGE_KEY) as Lang;
    return saved === 'en' ? 'en' : 'es';
  }
}
