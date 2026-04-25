import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { catchError, forkJoin, of } from 'rxjs';

import { ProfessorApiService } from './professor-api.service';
import type { AvailableUser, CreateAssignmentBody, ProfessorAssignment, ProfessorSpace } from './professor.models';

@Component({
  selector: 'app-professor-vinculaciones',
  imports: [ReactiveFormsModule],
  templateUrl: './professor-vinculaciones.component.html',
})
export class ProfessorVinculacionesComponent implements OnInit {
  private readonly api = inject(ProfessorApiService);
  private readonly fb = inject(FormBuilder);

  readonly assignments = signal<ProfessorAssignment[]>([]);
  readonly spaces = signal<ProfessorSpace[]>([]);
  readonly users = signal<AvailableUser[]>([]);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly showForm = signal(false);
  readonly error = signal<string | null>(null);
  readonly success = signal<string | null>(null);

  readonly form = this.fb.nonNullable.group({
    academic_space_id: [0, [Validators.required, Validators.min(1)]],
    user_id: [0, [Validators.required, Validators.min(1)]],
    role_in_assignment: ['monitor' as 'monitor' | 'graduate_assistant', Validators.required],
    contracted_hours_per_week: [4, [Validators.required, Validators.min(1), Validators.max(22)]],
  });

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    forkJoin({
      assignments: this.api.getAssignments().pipe(catchError(() => of<ProfessorAssignment[]>([]))),
      spaces: this.api.getSpaces(),
      users: this.api.getAssignableUsers(),
    }).subscribe({
      next: ({ assignments, spaces, users }) => {
        this.assignments.set(assignments ?? []);
        this.spaces.set(spaces ?? []);
        this.users.set(users ?? []);
        this.loading.set(false);
      },
      error: (err: unknown) => {
        this.loading.set(false);
        this.error.set(this.httpErr(err));
      },
    });
  }

  openForm(): void {
    this.form.reset({ role_in_assignment: 'monitor', contracted_hours_per_week: 4 });
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
    const formValue = this.form.getRawValue();
    const body: CreateAssignmentBody = {
      user_id: Number(formValue.user_id),
      role_in_assignment: formValue.role_in_assignment,
      contracted_hours_per_week: Number(formValue.contracted_hours_per_week),
    };
    this.saving.set(true);
    this.error.set(null);
    this.api.createAssignment(Number(formValue.academic_space_id), body).subscribe({
      next: () => {
        this.saving.set(false);
        this.success.set('Vinculación creada correctamente.');
        this.showForm.set(false);
        this.load();
      },
      error: (err: unknown) => {
        this.saving.set(false);
        this.error.set(this.httpErr(err));
      },
    });
  }

  spaceName(spaceId: number): string {
    return this.spaces().find((s) => s.ID === spaceId)?.Name ?? `#${spaceId}`;
  }

  spaceType(spaceId: number): string {
    const t = this.spaces().find((s) => s.ID === spaceId)?.Type;
    if (t === 'course') return 'Curso';
    if (t === 'project') return 'Proyecto';
    return '';
  }

  roleLabel(role: string): string {
    return role === 'monitor' ? 'Monitor' : 'Asist. Graduado';
  }

  maxHoursHint(): string {
    const role = this.form.controls.role_in_assignment.value;
    return role === 'monitor'
      ? 'Máx. 12h/semana total entre todas las monitorías (hasta 3 simultáneas).'
      : 'Máx. 22h/semana como asistente graduado.';
  }

  private httpErr(err: unknown): string {
    if (err instanceof HttpErrorResponse) {
      const body = err.error as { error?: string } | undefined;
      return body?.error ?? err.message;
    }
    return 'Error de red';
  }
}
