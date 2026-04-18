import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import type { OverviewPeriod } from './admin.models';
import { AdminApiService } from './admin-api.service';
import { IsoDatePipe } from './iso-date.pipe';

@Component({
  selector: 'app-admin-periods',
  imports: [ReactiveFormsModule, IsoDatePipe],
  templateUrl: './admin-periods.component.html',
})
export class AdminPeriodsComponent implements OnInit {
  private readonly api = inject(AdminApiService);
  private readonly fb = inject(FormBuilder);

  readonly periods = signal<OverviewPeriod[]>([]);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly closing = signal<number | null>(null);
  readonly error = signal<string | null>(null);
  readonly success = signal<string | null>(null);

  readonly form = this.fb.nonNullable.group({
    code: ['', [Validators.required]],
    start_date: ['', [Validators.required]],
    end_date: ['', [Validators.required]],
  });

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.api.listPeriods().subscribe({
      next: (list) => {
        this.periods.set(list ?? []);
        this.loading.set(false);
      },
      error: (err: unknown) => {
        this.loading.set(false);
        this.error.set(this.httpErr(err));
      },
    });
  }

  create(): void {
    this.success.set(null);
    this.error.set(null);
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    this.saving.set(true);
    this.api.createPeriod({ code: v.code.trim(), start_date: v.start_date, end_date: v.end_date }).subscribe({
      next: () => {
        this.saving.set(false);
        this.success.set('Período creado.');
        this.form.reset({ code: '', start_date: '', end_date: '' });
        this.load();
      },
      error: (err: unknown) => {
        this.saving.set(false);
        this.error.set(this.httpErr(err));
      },
    });
  }

  close(id: number): void {
    this.error.set(null);
    this.success.set(null);
    this.closing.set(id);
    this.api.closePeriod(id).subscribe({
      next: () => {
        this.closing.set(null);
        this.success.set('Período cerrado.');
        this.load();
      },
      error: (err: unknown) => {
        this.closing.set(null);
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
