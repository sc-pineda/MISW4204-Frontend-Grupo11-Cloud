import { inject } from '@angular/core';
import { Router, type CanActivateFn } from '@angular/router';

import { TokenStorageService } from '../services/token-storage.service';


export const guestGuard: CanActivateFn = () => {
  const tokenStorage = inject(TokenStorageService);
  const router = inject(Router);
  if (tokenStorage.getToken()) {
    return router.parseUrl('/home');
  }
  return true;
};
