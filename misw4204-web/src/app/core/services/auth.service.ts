import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { tap } from 'rxjs';

import type { AuthUser, LoginResponse } from '../models/auth.models';
import { TokenStorageService } from './token-storage.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly storage = inject(TokenStorageService);
  private readonly router = inject(Router);

  login(email: string, password: string) {
    return this.http.post<LoginResponse>('/api/v1/auth/login', { email, password }).pipe(
      tap((res) => {
        this.storage.setSession(res.token, res.user);
      }),
    );
  }

  logout(): void {
    this.storage.clear();
    void this.router.navigate(['/login']);
  }

  isLoggedIn(): boolean {
    return !!this.storage.getToken();
  }

  getCurrentUser(): AuthUser | null {
    return this.storage.getUser();
  }

  hasRole(role: string): boolean {
    const u = this.storage.getUser();
    return u?.roles?.includes(role) ?? false;
  }
}
