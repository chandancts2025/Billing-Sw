import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';
import { AuthService } from '../auth/auth.service';

export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const auth = inject(AuthService);
  const token = auth.accessToken;
  const withCredentials = request.url.includes('/api/');
  const securedRequest = token
    ? request.clone({ withCredentials, setHeaders: { Authorization: `Bearer ${token}` } })
    : request.clone({ withCredentials });

  return next(securedRequest).pipe(
    catchError(error => {
      if (!(error instanceof HttpErrorResponse) || error.status !== 401 || request.url.includes('/auth/refresh')) {
        return throwError(() => error);
      }

      return auth.refresh().pipe(
        switchMap(() => {
          const refreshedToken = auth.accessToken;
          const retry = refreshedToken
            ? request.clone({ withCredentials, setHeaders: { Authorization: `Bearer ${refreshedToken}` } })
            : request.clone({ withCredentials });
          return next(retry);
        }),
        catchError(refreshError => {
          auth.logout();
          return throwError(() => refreshError);
        })
      );
    })
  );
};
