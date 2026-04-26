import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { catchError, forkJoin, map, of } from 'rxjs';

import { AuthService } from '../../core/services/auth.service';
import { IsoDatePipe } from '../admin/iso-date.pipe';
import type { MonitorTask, MonitorTaskAttachment, UpdateMonitorTaskBody } from './asistente_monitor.models';
import { AsistenteMonitorService } from './asistente_monitor.service';

@Component({
  selector: 'app-asistente-monitor-tasks',
  imports: [IsoDatePipe, ReactiveFormsModule],
  templateUrl: './asistente_monitor_tasks.component.html',
})
export class AsistenteMonitorTasksComponent implements OnInit {
  private readonly api = inject(AsistenteMonitorService);
  private readonly auth = inject(AuthService);
  private readonly fb = inject(FormBuilder);

  readonly tasks = signal<MonitorTask[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly success = signal<string | null>(null);
  readonly editingTaskId = signal<number | null>(null);
  readonly savingTaskId = signal<number | null>(null);
  readonly deletingTaskId = signal<number | null>(null);
  readonly uploadingTaskId = signal<number | null>(null);
  readonly selectedFilesByTask = signal<Record<number, File[]>>({});
  readonly attachmentsByTask = signal<Record<number, MonitorTaskAttachment[]>>({});
  readonly loadingAttachmentsByTask = signal<Record<number, boolean>>({});
  readonly attachmentErrorsByTask = signal<Record<number, string | null>>({});

  readonly editForm = this.fb.nonNullable.group({
    title: ['', [Validators.required, Validators.minLength(3)]],
    description: ['', [Validators.required, Validators.minLength(3)]],
    status: ['pending', [Validators.required]],
    week_start: ['', [Validators.required]],
    time_invested: [1, [Validators.required, Validators.min(1)]],
    observations: [''],
  });

  ngOnInit(): void {
    this.loadTasks();
  }

  startEdit(task: MonitorTask): void {
    if (task.is_late) {
      this.error.set('Los reportes tardíos son inmutables y no pueden editarse.');
      return;
    }
    this.error.set(null);
    this.success.set(null);
    this.editingTaskId.set(task.id);
    this.editForm.reset({
      title: task.title,
      description: task.description,
      status: task.status,
      week_start: task.week_start,
      time_invested: task.time_invested,
      observations: task.observations ?? '',
    });
  }

  cancelEdit(): void {
    this.editingTaskId.set(null);
  }

  saveEdit(task: MonitorTask): void {
    this.error.set(null);
    this.success.set(null);
    if (task.is_late) {
      this.error.set('Los reportes tardíos son inmutables y no pueden editarse.');
      return;
    }
    if (this.editForm.invalid) {
      this.editForm.markAllAsTouched();
      return;
    }

    const raw = this.editForm.getRawValue();
    const payload: UpdateMonitorTaskBody = {
      ...raw,
      time_invested: Number(raw.time_invested),
    };

    this.savingTaskId.set(task.id);
    this.api.updateTask(task.id, payload).subscribe({
      next: (updated) => {
        this.tasks.update((list) => list.map((entry) => (entry.id === task.id ? updated : entry)));
        this.editingTaskId.set(null);
        this.savingTaskId.set(null);
        this.success.set('Tarea actualizada correctamente.');
      },
      error: (err: unknown) => {
        this.savingTaskId.set(null);
        this.error.set(this.httpErr(err));
      },
    });
  }

  deleteTask(task: MonitorTask): void {
    this.error.set(null);
    this.success.set(null);
    if (task.is_late) {
      this.error.set('Los reportes tardíos son inmutables y no pueden eliminarse.');
      return;
    }
    if (!window.confirm(`¿Eliminar la tarea #${task.id}? Esta acción no se puede deshacer.`)) {
      return;
    }

    this.deletingTaskId.set(task.id);
    this.api.deleteTask(task.id).subscribe({
      next: () => {
        this.tasks.update((list) => list.filter((entry) => entry.id !== task.id));
        if (this.editingTaskId() === task.id) {
          this.editingTaskId.set(null);
        }
        this.deletingTaskId.set(null);
        this.success.set('Tarea eliminada correctamente.');
      },
      error: (err: unknown) => {
        this.deletingTaskId.set(null);
        this.error.set(this.httpErr(err));
      },
    });
  }

  onTaskFilesSelected(taskId: number, event: Event): void {
    const input = event.target as HTMLInputElement;
    const selected = Array.from(input.files ?? []);
    this.selectedFilesByTask.update((current) => ({
      ...current,
      [taskId]: selected,
    }));
  }

  uploadTaskAttachments(task: MonitorTask, input: HTMLInputElement): void {
    this.error.set(null);
    this.success.set(null);
    if (task.is_late) {
      this.error.set('Los reportes tardíos son inmutables y no permiten adjuntar archivos.');
      return;
    }
    const files = this.selectedFilesByTask()[task.id] ?? [];
    if (files.length === 0) {
      this.error.set('Selecciona al menos un archivo para cargar.');
      return;
    }

    this.uploadingTaskId.set(task.id);
    forkJoin(files.map((file) => this.api.uploadTaskAttachment(task.id, file))).subscribe({
      next: () => {
        this.uploadingTaskId.set(null);
        this.selectedFilesByTask.update((current) => ({
          ...current,
          [task.id]: [],
        }));
        this.loadAttachmentsForTask(task.id);
        input.value = '';
        this.success.set(`Se cargaron ${files.length} adjunto(s) en la tarea #${task.id}.`);
      },
      error: (err: unknown) => {
        this.uploadingTaskId.set(null);
        this.error.set(this.httpErr(err));
      },
    });
  }

  taskSelectedFiles(taskId: number): File[] {
    return this.selectedFilesByTask()[taskId] ?? [];
  }

  taskAttachments(taskId: number): MonitorTaskAttachment[] {
    return this.attachmentsByTask()[taskId] ?? [];
  }

  isLoadingTaskAttachments(taskId: number): boolean {
    return this.loadingAttachmentsByTask()[taskId] ?? false;
  }

  taskAttachmentError(taskId: number): string | null {
    return this.attachmentErrorsByTask()[taskId] ?? null;
  }

  attachmentMimeType(attachment: MonitorTaskAttachment): string {
    if (attachment.StoragePath.includes('/')) {
      return attachment.StoragePath;
    }
    if (attachment.ContentType.includes('/')) {
      return attachment.ContentType;
    }
    return 'tipo desconocido';
  }

  private loadTasks(): void {
    const user = this.auth.getCurrentUser();
    if (user == null) {
      this.loading.set(false);
      this.error.set('No se encontró sesión activa.');
      return;
    }

    this.api.listTasksByUser(user.id).subscribe({
      next: (list) => {
        const tasks = list ?? [];
        this.tasks.set(tasks);
        this.loadAttachmentsForTasks(tasks);
        this.loading.set(false);
      },
      error: (err: unknown) => {
        this.loading.set(false);
        this.error.set(this.httpErr(err));
      },
    });
  }

  private loadAttachmentsForTasks(tasks: MonitorTask[]): void {
    if (tasks.length === 0) {
      this.attachmentsByTask.set({});
      this.loadingAttachmentsByTask.set({});
      this.attachmentErrorsByTask.set({});
      return;
    }

    const loadingState: Record<number, boolean> = {};
    const errorState: Record<number, string | null> = {};
    for (const task of tasks) {
      loadingState[task.id] = true;
      errorState[task.id] = null;
    }
    this.loadingAttachmentsByTask.set(loadingState);
    this.attachmentErrorsByTask.set(errorState);

    forkJoin(
      tasks.map((task) =>
        this.api.listTaskAttachments(task.id).pipe(
          map((attachments) => ({
            taskId: task.id,
            attachments,
            error: null as string | null,
          })),
          catchError((err: unknown) =>
            of({
              taskId: task.id,
              attachments: [] as MonitorTaskAttachment[],
              error: this.httpErr(err),
            }),
          ),
        ),
      ),
    ).subscribe((results) => {
      const attachmentsMap: Record<number, MonitorTaskAttachment[]> = {};
      const doneState: Record<number, boolean> = {};
      const errorsMap: Record<number, string | null> = {};
      for (const result of results) {
        attachmentsMap[result.taskId] = result.attachments;
        doneState[result.taskId] = false;
        errorsMap[result.taskId] = result.error;
      }
      this.attachmentsByTask.set(attachmentsMap);
      this.loadingAttachmentsByTask.set(doneState);
      this.attachmentErrorsByTask.set(errorsMap);
    });
  }

  private loadAttachmentsForTask(taskId: number): void {
    this.loadingAttachmentsByTask.update((current) => ({
      ...current,
      [taskId]: true,
    }));
    this.attachmentErrorsByTask.update((current) => ({
      ...current,
      [taskId]: null,
    }));
    this.api.listTaskAttachments(taskId).subscribe({
      next: (attachments) => {
        this.attachmentsByTask.update((current) => ({
          ...current,
          [taskId]: attachments ?? [],
        }));
        this.loadingAttachmentsByTask.update((current) => ({
          ...current,
          [taskId]: false,
        }));
      },
      error: (err: unknown) => {
        this.attachmentErrorsByTask.update((current) => ({
          ...current,
          [taskId]: this.httpErr(err),
        }));
        this.loadingAttachmentsByTask.update((current) => ({
          ...current,
          [taskId]: false,
        }));
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
