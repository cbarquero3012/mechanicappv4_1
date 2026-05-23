import { inject } from '@angular/core';
import { CanActivateFn, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const roleGuard: CanActivateFn = (route: ActivatedRouteSnapshot, state: RouterStateSnapshot) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const section = route.data?.['section'] as string | undefined;

  // No section specified means no role restriction beyond authentication
  if (!section) return true;

  if (authService.hasAccess(section)) {
    return true;
  }

  const slug =
    state.url.split('/').filter(Boolean)[0] ||
    localStorage.getItem('tenant_slug');
  router.navigate([slug ? `/${slug}/dashboard` : '/landing']);
  return false;
};
