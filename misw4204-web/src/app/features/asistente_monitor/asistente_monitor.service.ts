import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { map } from 'rxjs';

import type {
  CreateMonitorTaskBody,
  MonitorAssignment,
  MonitorTask,
  MonitorTaskAttachment,
  UpdateMonitorTaskBody,
} from './asistente_monitor.models';

@Injectable({
  providedIn: 'root',
})
export class AsistenteMonitorService {
  private readonly http = inject(HttpClient);

  listAssignmentsByUser(userId: number) {
    return this.http.get<MonitorAssignment[]>(`/api/v1/assignments/me`);
  }

  listTasksByUser(userId: number) {
    return this.http.get<MonitorTask[]>(`/api/v1/tasks`);
  }

  createTask(body: CreateMonitorTaskBody) {
    return this.http.post<MonitorTask>('/api/v1/tasks', body);
  }
<<<<<<< HEAD

  updateTask(taskId: number, body: UpdateMonitorTaskBody) {
    return this.http.patch<MonitorTask>(`/api/v1/tasks/${taskId}`, body);
  }

  deleteTask(taskId: number) {
    return this.http.delete<void>(`/api/v1/tasks/${taskId}`);
  }

  uploadTaskAttachment(taskId: number, file: File) {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post(`/api/v1/tasks/${taskId}/attachments`, formData);
  }

  listTaskAttachments(taskId: number) {
    return this.http.get<unknown>(`/api/v1/tasks/${taskId}/attachments`).pipe(map((response) => this.normalizeAttachments(response)));
  }

  private normalizeAttachments(response: unknown): MonitorTaskAttachment[] {
    if (Array.isArray(response)) {
      return response.filter((entry): entry is MonitorTaskAttachment => this.isAttachment(entry));
    }

    if (this.isAttachment(response)) {
      return [response];
    }

    if (response != null && typeof response === 'object') {
      const payload = response as { attachments?: unknown; data?: unknown; items?: unknown };
      const candidates = payload.attachments ?? payload.data ?? payload.items;
      if (Array.isArray(candidates)) {
        return candidates.filter((entry): entry is MonitorTaskAttachment => this.isAttachment(entry));
      }
      if (this.isAttachment(candidates)) {
        return [candidates];
      }
    }

    return [];
  }

  private isAttachment(value: unknown): value is MonitorTaskAttachment {
    if (value == null || typeof value !== 'object') {
      return false;
    }
    const candidate = value as Partial<MonitorTaskAttachment>;
    return (
      typeof candidate.ID === 'number' &&
      typeof candidate.TaskID === 'number' &&
      typeof candidate.FileName === 'string' &&
      typeof candidate.ContentType === 'string' &&
      typeof candidate.StoragePath === 'string'
    );
  }
=======
>>>>>>> develop
}
