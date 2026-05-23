import { Pipe, PipeTransform, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { AppSettingsService } from '../services/app-settings.service';

/**
 * A date pipe that automatically applies the shop's configured timezone
 * (from AppSettings.Timezone, e.g. "America/Costa_Rica").
 *
 * Usage: {{ someDate | localDate }}
 *        {{ someDate | localDate:'short' }}
 *        {{ someDate | localDate:'MM/dd/yyyy HH:mm' }}
 *
 * Falls back to the system/UTC timezone when AppSettings hasn't loaded yet.
 */
@Pipe({
  name: 'localDate',
  standalone: true,
  pure: false, // re-evaluates when settings signal changes
})
export class LocalDatePipe implements PipeTransform {
  private appSettings = inject(AppSettingsService);
  private datePipe = new DatePipe('en-US');

  transform(
    value: Date | string | number | null | undefined,
    format: string = 'mediumDate',
    locale?: string,
  ): string | null {
    if (value == null) return null;
    const tz = this.appSettings.timezone;
    return this.datePipe.transform(value, format, tz, locale) ?? null;
  }
}
