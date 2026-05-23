import { ChangeDetectorRef } from '@angular/core';
import { MonoTypeOperatorFunction, tap } from 'rxjs';

export function markDirty<T>(cdr: ChangeDetectorRef): MonoTypeOperatorFunction<T> {
  return tap({ next: () => cdr.markForCheck(), error: () => cdr.markForCheck() });
}
