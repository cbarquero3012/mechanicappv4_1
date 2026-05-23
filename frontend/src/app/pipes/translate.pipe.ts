import {
  Pipe,
  PipeTransform,
  inject,
  ChangeDetectorRef,
  DestroyRef,
} from '@angular/core';
import { effect } from '@angular/core';
import { TranslationService } from '../services/translation.service';

@Pipe({
  name: 'translate',
  pure: false,
})
export class TranslatePipe implements PipeTransform {
  private translationService = inject(TranslationService);
  private cdr = inject(ChangeDetectorRef);

  private lastKey = '';
  private lastParams: Record<string, string | number> | undefined;
  private lastValue = '';

  constructor() {
    effect(() => {
      // Reading the signal registers this effect as a dependency
      this.translationService.currentLang();
      if (this.lastKey) {
        this.lastValue = this.translationService.t(
          this.lastKey,
          this.lastParams,
        );
        this.cdr.markForCheck();
      }
    });
  }

  transform(key: string, params?: Record<string, string | number>): string {
    if (key !== this.lastKey || params !== this.lastParams) {
      this.lastKey = key;
      this.lastParams = params;
      this.lastValue = this.translationService.t(key, params);
    }
    return this.lastValue;
  }
}
