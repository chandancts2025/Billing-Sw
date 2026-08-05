import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { catchError, map, of } from 'rxjs';
import { AuthService } from '../auth/auth.service';

export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (auth.isAuthenticated()) return true;
  return auth.refresh().pipe(
    map(() => auth.isAuthenticated() || router.createUrlTree(['/auth/login'])),
    catchError(() => of(router.createUrlTree(['/auth/login'])))
  );
};

export const roleGuard: CanActivateFn = route => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const requiredRole = route.data['role'] as 'Operator' | 'Admin' | 'SuperAdmin' | undefined;
  return !requiredRole || auth.hasRoleAtLeast(requiredRole) || router.createUrlTree(['/pos']);
};
