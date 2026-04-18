import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';

import type { AuthUser } from '../models/auth.models';

export interface CreateFirstAdminRequest {
  name: string;
  email: string;
  password: string;
}

@Injectable({ providedIn: 'root' })
export class BootstrapUserService {
  private readonly http = inject(HttpClient);

  /** Solo válido cuando la tabla `users` está vacía (sin Bearer). */
  createFirstAdministrator(body: CreateFirstAdminRequest) {
    return this.http.post<AuthUser>('/api/v1/users', {
      name: body.name,
      email: body.email.trim().toLowerCase(),
      password: body.password,
      roles: ['administrador'],
    });
  }
}
