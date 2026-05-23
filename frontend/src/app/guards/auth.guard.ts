import { inject } from '@angular/core';
import { CanActivateFn, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = (_route: ActivatedRouteSnapshot, state: RouterStateSnapshot) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isLoggedIn) {
    return true;
  }
  // Token missing or expired — redirect to login
  authService.logout();
  // Extract slug from the destination URL so deep-links work on fresh page loads
  const slug =
    state.url.split('/').filter(Boolean)[0] ||
    localStorage.getItem('tenant_slug');
  router.navigate([slug ? `/${slug}/login` : '/landing']);
  return false;
};
