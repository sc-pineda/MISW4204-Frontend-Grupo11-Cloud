import { inject } from '@angular/core';
import { Router, type CanActivateFn } from '@angular/router';

import { AuthService } from '../services/auth.service';

export const profesorRoleGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (auth.hasRole('profesor')) {
    return true;
  }
  return router.parseUrl('/home');
};
