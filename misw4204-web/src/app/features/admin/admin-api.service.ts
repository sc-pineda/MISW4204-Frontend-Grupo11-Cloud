import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';

import type { AuthUser } from '../../core/models/auth.models';
import type {
  OverviewAssignment,
  OverviewPeriod,
  OverviewSpace,
  OverviewTask,
  PlatformOverview,
  UsersListResponse,
} from './admin.models';

export interface CreateUserBody {
  name: string;
  email: string;
  password: string;
  roles: string[];
}

export interface CreatePeriodBody {
  code: string;
  start_date: string;
  end_date: string;
}

export interface PatchAssignmentBody {
  role_in_assignment: 'monitor' | 'graduate_assistant';
  contracted_hours_per_week: number;
}

@Injectable({ providedIn: 'root' })
export class AdminApiService {
  private readonly http = inject(HttpClient);

  getOverview() {
    return this.http.get<PlatformOverview>('/api/v1/admin/overview');
  }

  listUsers() {
    return this.http.get<UsersListResponse>('/api/v1/users');
  }

  createUser(body: CreateUserBody) {
    return this.http.post<AuthUser>('/api/v1/users', body);
  }

  listPeriods() {
    return this.http.get<OverviewPeriod[]>('/api/v1/periods');
  }

  createPeriod(body: CreatePeriodBody) {
    return this.http.post<OverviewPeriod>('/api/v1/periods', body);
  }

  closePeriod(id: number) {
    return this.http.patch<{ status: string }>(`/api/v1/periods/${id}/close`, {});
  }

  listSpaces() {
    return this.http.get<OverviewSpace[]>('/api/v1/admin/spaces');
  }

  listAssignments() {
    return this.http.get<OverviewAssignment[]>('/api/v1/admin/assignments');
  }

  patchAssignment(id: number, body: PatchAssignmentBody) {
    return this.http.patch<OverviewAssignment>(`/api/v1/admin/assignments/${id}`, body);
  }

  listTasks() {
    return this.http.get<OverviewTask[]>('/api/v1/admin/tasks');
  }
}
