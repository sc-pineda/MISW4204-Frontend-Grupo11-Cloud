import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, OnInit, signal } from '@angular/core';

import type { PlatformOverview } from './admin.models';
import { AdminApiService } from './admin-api.service';

@Component({
  selector: 'app-admin-overview',
  template: `
    <h1 class="h4 mb-3">Resumen de la plataforma</h1>
    @if (error()) {
      <div class="alert alert-danger">{{ error() }}</div>
    }
    @if (loading()) {
      <p class="text-muted">Cargando…</p>
    }
    @if (data(); as o) {
      <div class="row g-3">
        <div class="col-6 col-md-4 col-lg-2">
          <div class="card h-100"><div class="card-body text-center"><div class="fs-3">{{ o.users.length }}</div><div class="small text-muted">Usuarios</div></div></div>
        </div>
        <div class="col-6 col-md-4 col-lg-2">
          <div class="card h-100"><div class="card-body text-center"><div class="fs-3">{{ o.academic_periods.length }}</div><div class="small text-muted">Períodos</div></div></div>
        </div>
        <div class="col-6 col-md-4 col-lg-2">
          <div class="card h-100"><div class="card-body text-center"><div class="fs-3">{{ o.academic_spaces.length }}</div><div class="small text-muted">Espacios</div></div></div>
        </div>
        <div class="col-6 col-md-4 col-lg-2">
          <div class="card h-100"><div class="card-body text-center"><div class="fs-3">{{ o.assignments.length }}</div><div class="small text-muted">Vinculaciones</div></div></div>
        </div>
        <div class="col-6 col-md-4 col-lg-2">
          <div class="card h-100"><div class="card-body text-center"><div class="fs-3">{{ o.tasks.length }}</div><div class="small text-muted">Tareas</div></div></div>
        </div>
      </div>
    }
  `,
})
export class AdminOverviewComponent implements OnInit {
  private readonly api = inject(AdminApiService);

  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly data = signal<PlatformOverview | null>(null);

  ngOnInit(): void {
    this.api.getOverview().subscribe({
      next: (o) => {
        this.data.set(o);
        this.loading.set(false);
      },
      error: (err: unknown) => {
        this.loading.set(false);
        const msg =
          err instanceof HttpErrorResponse
            ? (err.error as { error?: string } | null)?.error ?? err.message
            : 'Error';
        this.error.set(msg);
      },
    });
  }
}
