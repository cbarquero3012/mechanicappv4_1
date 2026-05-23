import {
  Component,
  ChangeDetectionStrategy,
  DestroyRef,
  inject,
  OnInit,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Toast, ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-toast',
  imports: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (current) {
      <div class="modal-overlay" (click)="dismiss()">
        <div class="modal-dialog" (click)="$event.stopPropagation()">
          <div class="modal-icon">
            @switch (current.type) {
              @case ('error') {
                <span class="icon-circle icon-error">!</span>
              }
              @case ('success') {
                <span class="icon-circle icon-success">&#10003;</span>
              }
              @case ('warning') {
                <span class="icon-circle icon-warning">!</span>
              }
            }
          </div>
          <h3 class="modal-title">
            @switch (current.type) {
              @case ('error') {
                Alert
              }
              @case ('success') {
                Success
              }
              @case ('warning') {
                Warning
              }
            }
          </h3>
          <p class="modal-message">{{ current.message }}</p>
          <button
            class="modal-btn"
            [class]="'modal-btn btn-' + current.type"
            (click)="dismiss()"
          >
            OK
          </button>
        </div>
      </div>
    }
  `,
  styles: [
    `
      .modal-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.45);
        z-index: 99999;
        display: flex;
        align-items: center;
        justify-content: center;
        animation: fadeIn 0.2s ease-out;
      }
      .modal-dialog {
        background: #fff;
        border-radius: 16px;
        padding: 32px 36px 24px;
        max-width: 400px;
        width: 90%;
        text-align: center;
        box-shadow: 0 12px 40px rgba(0, 0, 0, 0.25);
        animation: scaleIn 0.25s ease-out;
      }
      .modal-icon {
        margin-bottom: 12px;
      }
      .icon-circle {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 56px;
        height: 56px;
        border-radius: 50%;
        font-size: 1.8rem;
        font-weight: bold;
        color: #fff;
      }
      .icon-error {
        background: #e74c3c;
      }
      .icon-success {
        background: #27ae60;
      }
      .icon-warning {
        background: #f39c12;
      }
      .modal-title {
        margin: 8px 0 6px;
        font-size: 1.25rem;
        font-weight: 700;
        color: #2c3e50;
      }
      .modal-message {
        margin: 0 0 20px;
        font-size: 0.95rem;
        color: #555;
        line-height: 1.5;
      }
      .modal-btn {
        display: inline-block;
        padding: 10px 40px;
        border: none;
        border-radius: 8px;
        font-size: 0.95rem;
        font-weight: 600;
        color: #fff;
        cursor: pointer;
        transition: opacity 0.2s;
      }
      .modal-btn:hover {
        opacity: 0.85;
      }
      .btn-error {
        background: #e74c3c;
      }
      .btn-success {
        background: #27ae60;
      }
      .btn-warning {
        background: #f39c12;
      }
      @keyframes fadeIn {
        from {
          opacity: 0;
        }
        to {
          opacity: 1;
        }
      }
      @keyframes scaleIn {
        from {
          transform: scale(0.85);
          opacity: 0;
        }
        to {
          transform: scale(1);
          opacity: 1;
        }
      }
    `,
  ],
})
export class ToastComponent implements OnInit {
  private destroyRef = inject(DestroyRef);
  current: Toast | null = null;
  private queue: Toast[] = [];

  constructor(private toastService: ToastService) {}

  ngOnInit(): void {
    this.toastService.toast$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((toast) => {
        if (this.current) {
          this.queue.push(toast);
        } else {
          this.current = toast;
        }
      });
  }

  dismiss(): void {
    if (this.queue.length > 0) {
      this.current = this.queue.shift()!;
    } else {
      this.current = null;
    }
  }
}
