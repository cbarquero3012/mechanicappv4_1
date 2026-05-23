import {
  Component,
  DestroyRef,
  inject,
  ChangeDetectionStrategy,
  OnInit,
  ChangeDetectorRef,
  ViewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AppSettingsService } from '../../services/app-settings.service';
import { CleanupService, CleanupStatus } from '../../services/cleanup.service';
import { AppSettings } from '../../models/app-settings';
import { TranslationService } from '../../services/translation.service';
import { ToastService } from '../../services/toast.service';
import { LocalDatePipe } from '../../pipes/local-date.pipe';
import { FormsModule, NgForm } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { markDirty } from '../../utils/mark-dirty';

@Component({
  selector: 'app-settings',
  imports: [FormsModule, RouterModule, LocalDatePipe, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="module-page">
      <div class="page-header">
        <h1>&#9881; {{ 'settings.title' | translate }}</h1>
        <p>{{ 'settings.subtitle' | translate }}</p>
      </div>

      @if (settings) {
        <form
          (ngSubmit)="onSave()"
          #settingsForm="ngForm"
          class="inventory-form"
        >
          <!-- Branding Section -->
          <h3 class="section-title">{{ 'settings.branding' | translate }}</h3>
          <div class="form-row">
            <div class="form-group">
              <label for="appName"
                >{{ 'settings.appName' | translate }} *</label
              >
              <input
                id="appName"
                type="text"
                [(ngModel)]="settings.appName"
                name="appName"
                required
                [placeholder]="'settings.appNamePlaceholder' | translate"
              />
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>{{ 'settings.logo' | translate }}</label>
              <div class="upload-area">
                <div class="preview-box">
                  <img
                    [src]="settings.logoUrl || '/assets/logo.svg'"
                    alt="Logo"
                    class="brand-preview"
                  />
                </div>
                <input
                  type="file"
                  accept="image/*"
                  (change)="onFileSelect($event, 'logo')"
                  class="file-input"
                />
                <small class="field-hint">{{
                  'settings.logoHint' | translate
                }}</small>
              </div>
            </div>
            <div class="form-group">
              <label>{{ 'settings.favicon' | translate }}</label>
              <div class="upload-area">
                <div class="preview-box">
                  <img
                    [src]="settings.faviconUrl || '/assets/favicon.svg'"
                    alt="Favicon"
                    class="brand-preview favicon-preview"
                  />
                </div>
                <input
                  type="file"
                  accept="image/*,.ico"
                  (change)="onFileSelect($event, 'favicon')"
                  class="file-input"
                />
                <small class="field-hint">{{
                  'settings.faviconHint' | translate
                }}</small>
              </div>
            </div>
          </div>
          <!-- Contact Section -->
          <h3 class="section-title">{{ 'settings.contact' | translate }}</h3>
          <div class="form-row">
            <div class="form-group">
              <label for="phone">{{ 'settings.phone' | translate }}</label>
              <input
                id="phone"
                type="text"
                [(ngModel)]="settings.phone"
                name="phone"
                [placeholder]="'settings.phonePlaceholder' | translate"
              />
            </div>
            <div class="form-group">
              <label for="whatsapp">{{
                'settings.whatsapp' | translate
              }}</label>
              <input
                id="whatsapp"
                type="text"
                [(ngModel)]="settings.whatsAppPhone"
                name="whatsAppPhone"
                [placeholder]="'settings.whatsappPlaceholder' | translate"
              />
              <small class="field-hint">{{
                'settings.whatsappHint' | translate
              }}</small>
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label for="email">{{ 'settings.email' | translate }}</label>
              <input
                id="email"
                type="email"
                [(ngModel)]="settings.email"
                name="email"
                [placeholder]="'settings.emailPlaceholder' | translate"
              />
            </div>
            <div class="form-group full-width">
              <label for="address">{{ 'settings.address' | translate }}</label>
              <input
                id="address"
                type="text"
                [(ngModel)]="settings.address"
                name="address"
                [placeholder]="'settings.addressPlaceholder' | translate"
              />
            </div>
          </div>
          <!-- Localization Section -->
          <h3 class="section-title">{{ 'settings.localization' | translate }}</h3>
          <div class="form-row">
            <div class="form-group">
              <label for="timezone">{{ 'settings.timezone' | translate }}</label>
              <select id="timezone" [(ngModel)]="settings.timezone" name="timezone">
                <option value="UTC">UTC</option>
                <option value="America/Costa_Rica">America/Costa_Rica (Costa Rica)</option>
                <option value="America/Guatemala">America/Guatemala (Guatemala)</option>
                <option value="America/El_Salvador">America/El_Salvador (El Salvador)</option>
                <option value="America/Tegucigalpa">America/Tegucigalpa (Honduras)</option>
                <option value="America/Managua">America/Managua (Nicaragua)</option>
                <option value="America/Panama">America/Panama (Panamá)</option>
                <option value="America/Belize">America/Belize (Belize)</option>
                <option value="America/Mexico_City">America/Mexico_City (México)</option>
                <option value="America/New_York">America/New_York (Eastern US)</option>
                <option value="America/Chicago">America/Chicago (Central US)</option>
                <option value="America/Denver">America/Denver (Mountain US)</option>
                <option value="America/Los_Angeles">America/Los_Angeles (Pacific US)</option>
                <option value="America/Toronto">America/Toronto (Canada East)</option>
                <option value="America/Havana">America/Havana (Cuba)</option>
                <option value="America/Santo_Domingo">America/Santo_Domingo (Dominican Republic)</option>
                <option value="America/Puerto_Rico">America/Puerto_Rico (Puerto Rico)</option>
                <option value="America/Jamaica">America/Jamaica (Jamaica)</option>
                <option value="America/Port-au-Prince">America/Port-au-Prince (Haiti)</option>
                <option value="America/Port_of_Spain">America/Port_of_Spain (Trinidad)</option>
                <option value="America/Bogota">America/Bogota (Colombia)</option>
                <option value="America/Caracas">America/Caracas (Venezuela)</option>
                <option value="America/Guayaquil">America/Guayaquil (Ecuador)</option>
                <option value="America/Lima">America/Lima (Perú)</option>
                <option value="America/La_Paz">America/La_Paz (Bolivia)</option>
                <option value="America/Santiago">America/Santiago (Chile)</option>
                <option value="America/Sao_Paulo">America/Sao_Paulo (Brasil)</option>
                <option value="America/Argentina/Buenos_Aires">America/Argentina/Buenos_Aires (Argentina)</option>
                <option value="America/Montevideo">America/Montevideo (Uruguay)</option>
                <option value="America/Asuncion">America/Asuncion (Paraguay)</option>
                <option value="America/Guyana">America/Guyana (Guyana)</option>
                <option value="America/Paramaribo">America/Paramaribo (Suriname)</option>
                <option value="Europe/Madrid">Europe/Madrid (Spain)</option>
                <option value="Europe/Lisbon">Europe/Lisbon (Portugal)</option>
                <option value="Europe/Paris">Europe/Paris (France)</option>
                <option value="Europe/Berlin">Europe/Berlin (Germany)</option>
                <option value="Europe/Rome">Europe/Rome (Italy)</option>
                <option value="Europe/London">Europe/London (UK)</option>
              </select>
              <small class="field-hint">{{ 'settings.timezoneHint' | translate }}</small>
            </div>
          </div>
          <button
            type="submit"
            class="btn btn-primary"
            [disabled]="!settingsForm.valid || saving"
          >
            {{
              saving
                ? ('common.saving' | translate)
                : ('common.save' | translate)
            }}
          </button>
        </form>
      }

      <!-- Photo Cleanup Section -->
      <div class="section-card" style="margin-top: 24px;">
        <h3 class="section-title">{{ 'cleanup.title' | translate }}</h3>
        <p class="section-desc">{{ 'cleanup.description' | translate }}</p>

        @if (cleanupStatus) {
          <div class="cleanup-status">
            <div class="status-row">
              <span
                ><strong>{{ 'cleanup.totalPhotos' | translate }}:</strong>
                {{ cleanupStatus.totalPhotos }}</span
              >
              @if (cleanupStatus.lastRun) {
                <span>
                  <strong>{{ 'cleanup.lastRun' | translate }}:</strong>
                  {{ cleanupStatus.lastRun | localDate: 'medium' }}
                </span>
              }
              @if (cleanupStatus.lastUser) {
                <span>
                  <strong>{{ 'cleanup.lastUser' | translate }}:</strong>
                  {{ cleanupStatus.lastUser }}
                </span>
              }
            </div>
          </div>
        }

        <div class="cleanup-form">
          <div class="form-group" style="max-width: 200px;">
            <label for="cleanupDays">{{
              'cleanup.olderThan' | translate
            }}</label>
            <input
              id="cleanupDays"
              type="number"
              [(ngModel)]="cleanupDays"
              min="1"
              max="365"
              placeholder="30"
            />
            <small class="field-hint">{{
              'cleanup.daysHint' | translate
            }}</small>
          </div>
          <button
            class="btn btn-danger"
            (click)="runCleanup()"
            [disabled]="cleaning || cleanupDays < 1"
            style="align-self: flex-end;"
          >
            {{
              cleaning
                ? ('cleanup.running' | translate)
                : ('cleanup.runNow' | translate)
            }}
          </button>
        </div>

        @if (cleanupResult) {
          <div class="success-message">
            {{ cleanupResult }}
          </div>
        }
        @if (cleanupError) {
          <div class="error-message">{{ cleanupError }}</div>
        }
      </div>

      @if (successMsg) {
        <div class="success-message">{{ successMsg }}</div>
      }
      @if (errorMsg) {
        <div class="error-message">{{ errorMsg }}</div>
      }
    </div>
  `,
  styles: [
    `
      .section-title {
        margin: 24px 0 12px;
        font-size: 1.05rem;
        border-bottom: 2px solid #0d6efd;
        padding-bottom: 6px;
        color: #0d6efd;
      }
      .upload-area {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }
      .preview-box {
        border: 1px dashed #ccc;
        border-radius: 8px;
        padding: 12px;
        text-align: center;
        background: #fafbfc;
      }
      .brand-preview {
        max-height: 80px;
        max-width: 200px;
        object-fit: contain;
      }
      .favicon-preview {
        max-height: 48px;
        max-width: 48px;
      }
      .file-input {
        font-size: 0.9rem;
      }
      .section-card {
        background: var(--card-bg, #fff);
        border: 1px solid var(--border, #dee2e6);
        border-radius: 8px;
        padding: 16px;
      }
      .section-desc {
        color: #6c757d;
        font-size: 0.9rem;
        margin-bottom: 16px;
      }
      .cleanup-status {
        background: #f8f9fa;
        border-radius: 6px;
        padding: 12px;
        margin-bottom: 16px;
      }
      .status-row {
        display: flex;
        gap: 24px;
        flex-wrap: wrap;
        font-size: 0.9rem;
      }
      .cleanup-form {
        display: flex;
        gap: 16px;
        align-items: flex-start;
        flex-wrap: wrap;
      }
      .btn-danger {
        background: #dc3545;
        color: #fff;
        border: none;
        padding: 8px 20px;
        border-radius: 6px;
        cursor: pointer;
      }
      .btn-danger:hover {
        background: #c82333;
      }
      .btn-danger:disabled {
        background: #e4606d;
        cursor: not-allowed;
      }
    `,
  ],
})
export class SettingsComponent implements OnInit {
  private destroyRef = inject(DestroyRef);
  private cdr = inject(ChangeDetectorRef);
  @ViewChild('settingsForm') settingsForm!: NgForm;
  settings!: AppSettings;
  saving = false;
  successMsg = '';
  errorMsg = '';

  // Cleanup
  cleanupDays = 30;
  cleaning = false;
  cleanupResult = '';
  cleanupError = '';
  cleanupStatus: CleanupStatus | null = null;

  constructor(
    private settingsService: AppSettingsService,
    private cleanupService: CleanupService,
    public ts: TranslationService,
    private toast: ToastService,
  ) {}

  ngOnInit(): void {
    this.settingsService
      .load()
      .pipe(takeUntilDestroyed(this.destroyRef), markDirty(this.cdr))
      .subscribe({
        next: (s) => {
          this.settings = { ...s };
          if (s.photoCleanupDays && s.photoCleanupDays > 0) {
            this.cleanupDays = s.photoCleanupDays;
          }
        },
        error: () =>
          (this.settings = {
            appName: 'Mechanic App',
            logoUrl: '/assets/logo.svg',
            faviconUrl: '/assets/favicon.svg',
          }),
      });
    this.loadCleanupStatus();
  }

  loadCleanupStatus(): void {
    this.cleanupService
      .getStatus()
      .pipe(takeUntilDestroyed(this.destroyRef), markDirty(this.cdr))
      .subscribe((s) => (this.cleanupStatus = s));
  }

  runCleanup(): void {
    if (this.cleanupDays < 1) return;
    this.cleaning = true;
    this.cleanupResult = '';
    this.cleanupError = '';
    this.cleanupService
      .runPhotoCleanup(this.cleanupDays)
      .pipe(takeUntilDestroyed(this.destroyRef), markDirty(this.cdr))
      .subscribe({
        next: (res) => {
          this.cleaning = false;
          this.cleanupResult = res.message;
          this.loadCleanupStatus();
          setTimeout(() => (this.cleanupResult = ''), 5000);
        },
        error: () => {
          this.cleaning = false;
          this.cleanupError = this.ts.t('cleanup.error');
          setTimeout(() => (this.cleanupError = ''), 3000);
        },
      });
  }

  onFileSelect(event: Event, type: 'logo' | 'favicon'): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;
    const file = input.files[0];

    this.settingsService
      .uploadImage(file, type)
      .pipe(takeUntilDestroyed(this.destroyRef), markDirty(this.cdr))
      .subscribe({
        next: (res) => {
          if (type === 'logo') {
            this.settings.logoUrl = res.url;
          } else {
            this.settings.faviconUrl = res.url;
          }
        },
        error: () => {
          this.errorMsg = this.ts.t('settings.uploadError');
          setTimeout(() => (this.errorMsg = ''), 3000);
        },
      });
  }

  onSave(): void {
    if (this.settingsForm?.invalid) {
      this.toast.error(this.ts.t('common.fieldsRequired'));
      return;
    }
    this.saving = true;
    this.errorMsg = '';
    this.settingsService
      .save(this.settings)
      .pipe(takeUntilDestroyed(this.destroyRef), markDirty(this.cdr))
      .subscribe({
        next: () => {
          this.saving = false;
          this.successMsg = this.ts.t('settings.saved');
          setTimeout(() => (this.successMsg = ''), 3000);
        },
        error: () => {
          this.saving = false;
          this.errorMsg = this.ts.t('settings.saveError');
        },
      });
  }
}
