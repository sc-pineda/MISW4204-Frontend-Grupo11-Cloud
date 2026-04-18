/** Respuestas alineadas con el JSON del backend Go (campos exportados en PascalCase salvo donde el dominio define `json:"..."`). */

import type { AuthUser } from '../../core/models/auth.models';

export interface PlatformOverview {
  users: AuthUser[];
  academic_periods: OverviewPeriod[];
  academic_spaces: OverviewSpace[];
  assignments: OverviewAssignment[];
  tasks: OverviewTask[];
}

export interface OverviewPeriod {
  ID: number;
  Code: string;
  StartDate: string;
  EndDate: string;
  Status: string;
  CreatedAt?: string;
}

export interface OverviewSpace {
  ID: number;
  Name: string;
  Type: string;
  AcademicPeriodID: number;
  ProfessorID: number;
  StartDate: string;
  EndDate: string;
  Observations?: string;
  Status: string;
}

export interface OverviewAssignment {
  ID: number;
  UserID: number;
  AcademicSpaceID: number;
  ProfessorID: number;
  RoleInAssignment: string;
  ContractedHoursPerWeek: number;
  CreatedAt?: string;
  UpdatedAt?: string;
}

export interface OverviewTask {
  id: number;
  title: string;
  description: string;
  status: string;
  week_start: string;
  is_late: boolean;
  time_invested: number;
  assignment_id: number;
  time_registered?: string;
  observations?: string;
}

export interface UsersListResponse {
  users: AuthUser[];
}
