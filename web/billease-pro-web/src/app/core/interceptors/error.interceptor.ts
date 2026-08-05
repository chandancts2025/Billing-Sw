import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { NotificationService } from '../services/notification.service';

export const errorInterceptor: HttpInterceptorFn = (request, next) => {
  const notifications = inject(NotificationService);
  return next(request).pipe(
    catchError(error => {
      if (error instanceof HttpErrorResponse && !request.url.includes('/auth/refresh')) {
        const message = typeof error.error === 'string'
          ? error.error
          : error.error?.message ?? error.message ?? 'Something went wrong.';
        notifications.error(message);
      }
      return throwError(() => error);
    })
  );
};
