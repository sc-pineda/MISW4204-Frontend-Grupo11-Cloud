import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { ProfessorApiService } from './professor-api.service';
import type { AcademicPeriod, CreateSpaceBody, ProfessorSpace } from './professor.models';

@Component({
  selector: 'app-professor-spaces',
  imports: [ReactiveFormsModule],
  templateUrl: './professor-spaces.component.html',
})
export class ProfessorSpacesComponent implements OnInit {
  private readonly api = inject(ProfessorApiService);
  private readonly fb = inject(FormBuilder);

  readonly spaces = signal<ProfessorSpace[]>([]);
  readonly periods = signal<AcademicPeriod[]>([]);
  readonly loadingSpaces = signal(true);
  readonly loadingPeriods = signal(true);
  readonly saving = signal(false);
  readonly showForm = signal(false);
  readonly spacesError = signal<string | null>(null);
  readonly periodsError = signal<string | null>(null);
  readonly error = signal<string | null>(null);
  readonly success = signal<string | null>(null);

  readonly closing = signal<number | null>(null);

  readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    type: ['course' as 'course' | 'project', Validators.required],
    academic_period_id: [0, [Validators.required, Validators.min(1)]],
    start_date: ['', Validators.required],
    end_date: ['', Validators.required],
    observations: [''],
  });

  ngOnInit(): void {
    this.loadSpaces();
    this.loadPeriods();
  }

  loadSpaces(): void {
    this.loadingSpaces.set(true);
    this.spacesError.set(null);
    this.api.getSpaces().subscribe({
      next: (list) => {
        this.spaces.set(list ?? []);
        this.loadingSpaces.set(false);
      },
      error: (err: unknown) => {
        this.loadingSpaces.set(false);
        this.spacesError.set(this.httpErr(err));
      },
    });
  }

  loadPeriods(): void {
    this.loadingPeriods.set(true);
    this.periodsError.set(null);
    this.api.getActivePeriods().subscribe({
      next: (list) => {
        this.periods.set((list ?? []).filter((p) => p.Status === 'active'));
        this.loadingPeriods.set(false);
      },
      error: (err: unknown) => {
        this.loadingPeriods.set(false);
        this.periodsError.set(this.httpErr(err));
      },
    });
  }

  load(): void {
    this.loadSpaces();
    this.loadPeriods();
  }

  openForm(): void {
    this.form.reset({ type: 'course', academic_period_id: 0 });
    this.success.set(null);
    this.error.set(null);
    this.showForm.set(true);
  }

  cancel(): void {
    this.showForm.set(false);
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.saving.set(true);
    this.error.set(null);
    const raw = this.form.getRawValue();
    const body: CreateSpaceBody = {
      name: raw.name,
      type: raw.type,
      academic_period_id: Number(raw.academic_period_id),
      start_date: raw.start_date,
      end_date: raw.end_date,
      observations: raw.observations,
    };
    this.api.createSpace(body).subscribe({
      next: () => {
        this.saving.set(false);
        this.success.set('Espacio creado correctamente.');
        this.showForm.set(false);
        this.load();
      },
      error: (err: unknown) => {
        this.saving.set(false);
        this.error.set(this.httpErr(err));
      },
    });
  }

  closeSpace(id: number): void {
    this.closing.set(id);
    this.error.set(null);
    this.api.closeSpace(id).subscribe({
      next: () => {
        this.closing.set(null);
        this.success.set('Espacio cerrado.');
        this.loadSpaces();
      },
      error: (err: unknown) => {
        this.closing.set(null);
        this.error.set(this.httpErr(err));
      },
    });
  }

  typeLabel(type: string): string {
    return type === 'course' ? 'Curso' : 'Proyecto';
  }

  shortDate(iso: string): string {
    return iso?.slice(0, 10) ?? '—';
  }

  private httpErr(err: unknown): string {
    if (err instanceof HttpErrorResponse) {
      const body = err.error as { error?: string } | undefined;
      return body?.error ?? err.message;
    }
    return 'Error de red';
  }
}
