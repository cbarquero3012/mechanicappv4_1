import { inject } from '@angular/core';
import { CanActivateFn, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { SubscriptionService } from '../services/subscription.service';
import { map, catchError, of } from 'rxjs';

export const subscriptionGuard: CanActivateFn = (_route: ActivatedRouteSnapshot, state: RouterStateSnapshot) => {
  const subService = inject(SubscriptionService);
  const router = inject(Router);

  // Extract slug from destination URL so deep-links work on fresh page loads
  const slug =
    state.url.split('/').filter(Boolean)[0] ||
    localStorage.getItem('tenant_slug');

  return subService.checkStatus().pipe(
    map((status) => {
      if (status.active) return true;
      // Don't redirect on HTTP/network errors — the authInterceptor handles auth failures.
      // Only block when the subscription is confirmed inactive (not an error condition).
      if (status.status === 'error') return true;
      router.navigate([slug ? `/${slug}/subscription` : '/landing']);
      return false;
    }),
    catchError(() => of(true)), // Fail open: auth errors are handled by authInterceptor
  );
};
