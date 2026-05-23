import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

/**
 * Handles slug-based login URLs (e.g., /my-company/login).
 * Stores the tenant slug in localStorage and redirects to the main login page.
 */
@Component({
  selector: 'app-tenant-login-redirect',
  standalone: true,
  template: `<p>Redirecting...</p>`,
})
export class TenantLoginRedirectComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  ngOnInit() {
    const slug = this.route.snapshot.paramMap.get('slug');
    if (slug) {
      localStorage.setItem('tenant_slug', slug);
    }
    this.router.navigate(['/login'], {
      queryParams: { tenant: slug },
    });
  }
}
