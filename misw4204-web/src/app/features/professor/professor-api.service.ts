import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';

import { map } from 'rxjs';

import type {
  AcademicPeriod,
  AssignmentResponse,
  AvailableUser,
  CreateAssignmentBody,
  CreateSpaceBody,
  PdfReport,
  ProfessorAssignment,
  ReportQueueResponse,
  ProfessorSpace,
  ProfessorTask,
} from './professor.models';

@Injectable({ providedIn: 'root' })
export class ProfessorApiService {
  private readonly http = inject(HttpClient);

  getAssignments() {
    return this.http.get<ProfessorAssignment[]>('/api/v1/userAssignments/profesor');
  }

  getTasksByWeek(weekStart: string) {
    return this.http.get<ProfessorTask[]>('/api/v1/professors/me/tasks', {
      params: { week_start: weekStart },
    });
  }

  getAssignmentTasks(assignmentId: number) {
    return this.http.get<ProfessorTask[]>(`/api/v1/professors/assignments/${assignmentId}/tasks`);
  }

  generateReports(weekStart: string) {
    return this.http.post<ReportQueueResponse>('/api/v1/reports/weekly', {
      week_start: weekStart,
    });
  }

  getReports() {
    return this.http.get<PdfReport[]>('/api/v1/reports');
  }

  downloadReport(reportId: number) {
    return this.http.get(`/api/v1/reports/${reportId}/download`, {
      responseType: 'blob',
    });
  }

  getReportDownloadUrl(reportId: number): string {
    return `/api/v1/reports/${reportId}/download`;
  }

  getSpaces() {
    return this.http.get<ProfessorSpace[]>('/api/v1/spaces');
  }

  createSpace(body: CreateSpaceBody) {
    return this.http.post<ProfessorSpace>('/api/v1/spaces', body);
  }

  closeSpace(id: number) {
    return this.http.patch<{ status: string }>(`/api/v1/spaces/${id}/close`, {});
  }

  getActivePeriods() {
    return this.http.get<AcademicPeriod[]>('/api/v1/periods');
  }

  getAssignableUsers() {
    return this.http
      .get<{ users: AvailableUser[] }>('/api/v1/users')
      .pipe(
        map((res) =>
          (res.users ?? []).filter(
            (u) => u.roles?.includes('monitor') || u.roles?.includes('asistente_graduado'),
          ),
        ),
      );
  }

  createAssignment(spaceId: number, body: CreateAssignmentBody) {
    return this.http.post<AssignmentResponse>(`/api/v1/spaces/${spaceId}/assignments`, body);
  }
}
