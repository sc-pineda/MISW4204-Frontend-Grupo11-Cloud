import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import type { OverviewAssignment } from './admin.models';
import { AdminApiService, type PatchAssignmentBody } from './admin-api.service';

@Component({
  selector: 'app-admin-assignments',
  imports: [ReactiveFormsModule],
  templateUrl: './admin-assignments.component.html',
})
export class AdminAssignmentsComponent implements OnInit {
  private readonly api = inject(AdminApiService);
  private readonly fb = inject(FormBuilder);

  readonly assignments = signal<OverviewAssignment[]>([]);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);
  readonly success = signal<string | null>(null);
  readonly editingId = signal<number | null>(null);

  readonly editForm = this.fb.nonNullable.group({
    role_in_assignment: ['monitor' as PatchAssignmentBody['role_in_assignment'], [Validators.required]],
    contracted_hours_per_week: [8, [Validators.required, Validators.min(1)]],
  });

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.api.listAssignments().subscribe({
      next: (list) => {
        this.assignments.set(list ?? []);
        this.loading.set(false);
      },
      error: (err: unknown) => {
        this.loading.set(false);
        this.error.set(this.httpErr(err));
      },
    });
  }

  startEdit(a: OverviewAssignment): void {
    this.success.set(null);
    this.error.set(null);
    this.editingId.set(a.ID);
    this.editForm.patchValue({
      role_in_assignment: a.RoleInAssignment as PatchAssignmentBody['role_in_assignment'],
      contracted_hours_per_week: a.ContractedHoursPerWeek,
    });
  }

  cancelEdit(): void {
    this.editingId.set(null);
  }

  save(): void {
    const id = this.editingId();
    if (id == null || this.editForm.invalid) {
      this.editForm.markAllAsTouched();
      return;
    }
    this.saving.set(true);
    this.error.set(null);
    this.api.patchAssignment(id, this.editForm.getRawValue()).subscribe({
      next: () => {
        this.saving.set(false);
        this.success.set('Vinculación actualizada.');
        this.editingId.set(null);
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
