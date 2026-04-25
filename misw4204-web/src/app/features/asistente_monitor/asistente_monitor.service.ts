import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';

import type { CreateMonitorTaskBody, MonitorAssignment, MonitorTask } from './asistente_monitor.models';

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
}
