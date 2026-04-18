import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

import { TokenStorageService } from '../services/token-storage.service';

function isPostUsersUrl(url: string): boolean {
  return url === '/api/v1/users' || url.endsWith('/api/v1/users');
}

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const tokenStorage = inject(TokenStorageService);
  const router = inject(Router);

  const hadTokenBeforeRequest = !!tokenStorage.getToken();

  let authReq = req;
  if (!req.url.includes('/auth/login')) {
    const token = tokenStorage.getToken();
    if (token) {
      authReq = req.clone({
        setHeaders: { Authorization: `Bearer ${token}` },
      });
    }
  }

  return next(authReq).pipe(
    catchError((err: unknown) => {
      if (err instanceof HttpErrorResponse && err.status === 401 && !req.url.includes('/auth/login')) {
        // Alta del primer admin sin token: 401 = "ya hay usuarios". Dejar que la pantalla muestre el mensaje.
        const bootstrapPostUsersDenied =
          req.method === 'POST' && isPostUsersUrl(req.url) && !hadTokenBeforeRequest;
        if (!bootstrapPostUsersDenied) {
          tokenStorage.clear();
          void router.navigate(['/login']);
        }
      }
      return throwError(() => err);
    }),
  );
};
