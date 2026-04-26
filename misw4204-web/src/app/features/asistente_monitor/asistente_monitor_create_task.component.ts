import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { forkJoin } from 'rxjs';

import { AuthService } from '../../core/services/auth.service';
import type { CreateMonitorTaskBody, MonitorAssignment } from './asistente_monitor.models';
import { AsistenteMonitorService } from './asistente_monitor.service';

@Component({
  selector: 'app-asistente-monitor-create-task',
  imports: [ReactiveFormsModule],
  templateUrl: './asistente_monitor_create_task.component.html',
})
export class AsistenteMonitorCreateTaskComponent implements OnInit {
  private readonly api = inject(AsistenteMonitorService);
  private readonly auth = inject(AuthService);
  private readonly fb = inject(FormBuilder);

  readonly assignments = signal<MonitorAssignment[]>([]);
  readonly loadingAssignments = signal(true);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);
  readonly success = signal<string | null>(null);
  readonly selectedFiles = signal<File[]>([]);

  readonly createForm = this.fb.nonNullable.group({
    assignment_id: [0, [Validators.required, Validators.min(1)]],
    title: ['', [Validators.required, Validators.minLength(3)]],
    description: ['', [Validators.required, Validators.minLength(3)]],
    status: ['pending', [Validators.required]],
    week_start: ['', [Validators.required]],
    time_invested: [1, [Validators.required, Validators.min(1)]],
    observations: [''],
  });

  ngOnInit(): void {
    const user = this.auth.getCurrentUser();
    if (user == null) {
      this.loadingAssignments.set(false);
      this.error.set('No se encontró sesión activa.');
      return;
    }

    this.api.listAssignmentsByUser(user.id).subscribe({
      next: (list) => {
        const assignments = list ?? [];
        this.assignments.set(assignments);
        if (assignments.length > 0) {
          this.createForm.patchValue({ assignment_id: assignments[0].ID });
        }
        this.loadingAssignments.set(false);
      },
      error: (err: unknown) => {
        this.loadingAssignments.set(false);
        this.error.set(this.httpErr(err));
      },
    });
  }

  createTask(): void {
    this.error.set(null);
    this.success.set(null);
    if (this.createForm.invalid) {
      this.createForm.markAllAsTouched();
      return;
    }

    const raw = this.createForm.getRawValue();
    const payload: CreateMonitorTaskBody = {
      ...raw,
      assignment_id: Number(raw.assignment_id),
      time_invested: Number(raw.time_invested),
    };
    this.saving.set(true);
    this.api.createTask(payload).subscribe({
      next: (createdTask) => {
        const files = this.selectedFiles();
        if (files.length === 0) {
          this.finishCreateSuccess('Tarea creada correctamente.');
          return;
        }

        forkJoin(files.map((file) => this.api.uploadTaskAttachment(createdTask.id, file))).subscribe({
          next: () => {
            this.finishCreateSuccess(`Tarea creada y ${files.length} adjunto(s) cargado(s).`);
          },
          error: (err: unknown) => {
            this.saving.set(false);
            this.error.set(`La tarea se creó, pero falló la carga de adjuntos: ${this.httpErr(err)}`);
          },
        });
      },
      error: (err: unknown) => {
        this.saving.set(false);
        this.error.set(this.httpErr(err));
      },
    });
  }

  onFilesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.selectedFiles.set(Array.from(input.files ?? []));
  }

  private finishCreateSuccess(message: string): void {
    this.saving.set(false);
    this.success.set(message);
    this.selectedFiles.set([]);
    const firstAssignmentId: number = this.assignments()[0]?.ID ?? 0;
    this.createForm.reset({
      assignment_id: firstAssignmentId,
      title: '',
      description: '',
      status: 'pending',
      week_start: '',
      time_invested: 1,
      observations: '',
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
