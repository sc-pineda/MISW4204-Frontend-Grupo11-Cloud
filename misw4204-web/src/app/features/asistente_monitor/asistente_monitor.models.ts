export interface MonitorAssignment {
  ID: number;
  UserID: number;
  AcademicSpaceID: number;
  ProfessorID: number;
  RoleInAssignment: string;
  ContractedHoursPerWeek: number;
  CreatedAt?: string;
  UpdatedAt?: string;
}

export interface MonitorTask {
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

export interface CreateMonitorTaskBody {
  title: string;
  description: string;
  status: string;
  week_start: string;
  time_invested: number;
  assignment_id: number;
  observations?: string;
}
