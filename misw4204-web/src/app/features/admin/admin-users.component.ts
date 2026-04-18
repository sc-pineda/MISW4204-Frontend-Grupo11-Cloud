import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import type { AuthUser } from '../../core/models/auth.models';
import { AdminApiService } from './admin-api.service';

@Component({
  selector: 'app-admin-users',
  imports: [ReactiveFormsModule],
  templateUrl: './admin-users.component.html',
})
export class AdminUsersComponent implements OnInit {
  private readonly api = inject(AdminApiService);
  private readonly fb = inject(FormBuilder);

  readonly users = signal<AuthUser[]>([]);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);
  readonly success = signal<string | null>(null);

  readonly createForm = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    administrador: [false],
    profesor: [false],
    monitor: [false],
    asistente_graduado: [false],
  });

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.api.listUsers().subscribe({
      next: (res) => {
        this.users.set(res.users ?? []);
        this.loading.set(false);
      },
      error: (err: unknown) => {
        this.loading.set(false);
        this.error.set(this.httpErr(err));
      },
    });
  }

  selectedRoles(): string[] {
    const f = this.createForm.getRawValue();
    const roles: string[] = [];
    if (f.administrador) roles.push('administrador');
    if (f.profesor) roles.push('profesor');
    if (f.monitor) roles.push('monitor');
    if (f.asistente_graduado) roles.push('asistente_graduado');
    return roles;
  }

  createUser(): void {
    this.success.set(null);
    this.error.set(null);
    const roles = this.selectedRoles();
    if (roles.length === 0) {
      this.error.set('Seleccioná al menos un rol.');
      return;
    }
    if (this.createForm.invalid) {
      this.createForm.markAllAsTouched();
      return;
    }
    const { name, email, password } = this.createForm.getRawValue();
    this.saving.set(true);
    this.api
      .createUser({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
        roles,
      })
      .subscribe({
        next: () => {
          this.saving.set(false);
          this.success.set('Usuario creado.');
          this.createForm.reset({
            name: '',
            email: '',
            password: '',
            administrador: false,
            profesor: false,
            monitor: false,
            asistente_graduado: false,
          });
          this.load();
        },
        error: (err: unknown) => {
          this.saving.set(false);
          this.error.set(this.httpErr(err));
        },
      });
  }

  private httpErr(err: unknown): string {
    if (err instanceof HttpErrorResponse) {
      const body = err.error as { error?: string } | undefined;
      return body?.error ?? err.message;
    }
    return 'Error de red';
  }
}
