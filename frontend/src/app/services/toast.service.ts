import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

export interface Toast {
  message: string;
  type: 'error' | 'success' | 'warning';
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  /** Subject is appropriate here since toasts are fire-and-forget events, not state */
  private toastSubject = new Subject<Toast>();
  toast$ = this.toastSubject.asObservable();

  show(message: string, type: Toast['type'] = 'error'): void {
    this.toastSubject.next({ message, type });
  }

  error(message: string): void {
    this.show(message, 'error');
  }

  success(message: string): void {
    this.show(message, 'success');
  }

  warning(message: string): void {
    this.show(message, 'warning');
  }
}
