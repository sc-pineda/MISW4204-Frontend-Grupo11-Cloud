import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { BootstrapUserService } from '../../../core/services/bootstrap-user.service';

@Component({
  selector: 'app-primer-admin',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './primer-admin.component.html',
  styleUrl: './primer-admin.component.scss',
})
export class PrimerAdminComponent {
  private readonly fb = inject(FormBuilder);
  private readonly bootstrap = inject(BootstrapUserService);
  private readonly router = inject(Router);

  readonly submitting = signal(false);
  readonly errorMessage = signal<string | null>(null);

  readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
  });

  onSubmit(): void {
    this.errorMessage.set(null);
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const { name, email, password } = this.form.getRawValue();
    this.submitting.set(true);
    this.bootstrap.createFirstAdministrator({ name: name.trim(), email, password }).subscribe({
      next: () => {
        this.submitting.set(false);
        void this.router.navigate(['/login'], { queryParams: { creado: '1' } });
      },
      error: (err: unknown) => {
        this.submitting.set(false);
        if (err instanceof HttpErrorResponse) {
          if (err.status === 401) {
            this.errorMessage.set(
              'Ya existe al menos un usuario en el sistema. Iniciá sesión con una cuenta de administrador.',
            );
            return;
          }
          if (err.status === 403) {
            this.errorMessage.set('No tenés permiso para esta operación.');
            return;
          }
          const msg = (err.error as { error?: string })?.error;
          this.errorMessage.set(msg ?? `No se pudo crear el usuario (${err.status}).`);
          return;
        }
        this.errorMessage.set('No se pudo conectar con el servidor.');
      },
    });
  }
}
