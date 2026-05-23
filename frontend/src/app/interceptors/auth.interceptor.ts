import { inject } from '@angular/core';
import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Always attach tenant slug header if available
  const tenantSlug = localStorage.getItem('tenant_slug');
  let modifiedReq = req;

  if (tenantSlug) {
    modifiedReq = req.clone({
      setHeaders: {
        'X-Tenant-Slug': tenantSlug,
      },
    });
  }

  // Don't attach token to login requests
  if (req.url.includes('/api/auth/login')) {
    return next(modifiedReq);
  }

  const token = authService.token;

  if (token) {
    modifiedReq = modifiedReq.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  return next(modifiedReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        // Token expired or invalid — force logout
        authService.logout();
        const slug = localStorage.getItem('tenant_slug');
        router.navigate([slug ? `/${slug}/login` : '/landing']);
      } else if (
        error.status === 403 &&
        error.error?.code === 'SUBSCRIPTION_REQUIRED'
      ) {
        const slug = localStorage.getItem('tenant_slug');
        router.navigate([slug ? `/${slug}/subscription` : '/landing']);
      }
      return throwError(() => error);
    }),
  );
};
