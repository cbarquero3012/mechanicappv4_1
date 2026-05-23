import {
  Component,
  ChangeDetectionStrategy,
  inject,
  OnInit,
  ChangeDetectorRef,
} from '@angular/core';
import { Router } from '@angular/router';
import { TenantService } from '../../services/tenant.service';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { markDirty } from '../../utils/mark-dirty';

@Component({
  selector: 'app-demo-banner',
  standalone: true,
  imports: [TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (visible) {
      <div class="demo-banner" [class.expiring-soon]="daysRemaining <= 2">
        <div class="demo-banner-content">
          <span class="demo-badge">{{ 'demo.badge' | translate }}</span>
          <span class="demo-text">
            {{ 'demo.bannerText' | translate }}
            <strong
              >{{ daysRemaining }} {{ 'landing.days' | translate }}</strong
            >
            {{ 'demo.remaining' | translate }}
          </span>
        </div>
        <button class="btn-upgrade" (click)="onUpgrade()">
          🚀 {{ 'demo.upgrade' | translate }}
        </button>
      </div>
    }
  `,
  styles: `
    .demo-banner {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      padding: 0.6rem 1.25rem;
      background: linear-gradient(90deg, #1e40af, #7c3aed);
      color: #fff;
      font-size: 0.85rem;
      flex-wrap: wrap;
    }
    .demo-banner.expiring-soon {
      background: linear-gradient(90deg, #dc2626, #b91c1c);
      animation: pulse 2s ease-in-out infinite;
    }
    @keyframes pulse {
      0%,
      100% {
        opacity: 1;
      }
      50% {
        opacity: 0.85;
      }
    }
    .demo-banner-content {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }
    .demo-badge {
      background: rgba(255, 255, 255, 0.2);
      padding: 0.2rem 0.6rem;
      border-radius: 4px;
      font-weight: 600;
      font-size: 0.75rem;
      text-transform: uppercase;
    }
    .btn-upgrade {
      background: #fff;
      color: #1e40af;
      border: none;
      padding: 0.4rem 1rem;
      border-radius: 6px;
      font-weight: 600;
      cursor: pointer;
      font-size: 0.85rem;
      white-space: nowrap;
      transition: transform 0.1s;
    }
    .btn-upgrade:hover {
      transform: scale(1.05);
    }
  `,
})
export class DemoBannerComponent implements OnInit {
  private tenantService = inject(TenantService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  visible = false;
  daysRemaining = 0;

  ngOnInit() {
    // Check if there's a demo tenant slug stored in session/local storage
    const slug = localStorage.getItem('tenant_slug');
    if (slug) {
      this.tenantService.getDemoStatus(slug).subscribe({
        next: (status) => {
          if (!status.isExpired && status.daysRemaining > 0) {
            this.visible = true;
            this.daysRemaining = status.daysRemaining;
            this.cdr.markForCheck();
          }
        },
        error: () => {
          /* Not a demo tenant — hide banner */
        },
      });
    }
  }

  onUpgrade() {
    // Navigate to onboarding in upgrade mode — this calls /api/demo/upgrade
    // (not /api/subscription/onboard) to preserve the existing demo DB
    this.router.navigate(['/onboarding'], { queryParams: { mode: 'upgrade' } });
  }
}
