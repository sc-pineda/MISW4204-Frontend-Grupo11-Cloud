import { inject } from '@angular/core';
import { Router, type CanActivateFn } from '@angular/router';

import { AuthService } from '../services/auth.service';

export const assistantMonitorRoleGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (auth.hasRole('monitor') || auth.hasRole('asistente_graduado')) {
    return true;
  }
  return router.parseUrl('/home');
};
