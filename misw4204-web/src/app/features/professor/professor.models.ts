export interface AcademicPeriod {
  ID: number;
  Code: string;
  StartDate: string;
  EndDate: string;
  Status: string;
}

export interface ProfessorSpace {
  ID: number;
  Name: string;
  Type: string;
  AcademicPeriodID: number;
  ProfessorID: number;
  StartDate: string;
  EndDate: string;
  Observations?: string;
  Status: string;
  CreatedAt?: string;
  UpdatedAt?: string;
}

export interface CreateSpaceBody {
  name: string;
  type: 'course' | 'project';
  academic_period_id: number;
  start_date: string;
  end_date: string;
  observations?: string;
}

export interface AvailableUser {
  id: number;
  name: string;
  email: string;
  roles: string[];
}

export interface CreateAssignmentBody {
  user_id: number;
  role_in_assignment: 'monitor' | 'graduate_assistant';
  contracted_hours_per_week: number;
}

export interface AssignmentResponse {
  ID: number;
  UserID: number;
  AcademicSpaceID: number;
  ProfessorID: number;
  RoleInAssignment: string;
  ContractedHoursPerWeek: number;
  CreatedAt?: string;
  UpdatedAt?: string;
}

export interface ProfessorAssignment {
  ID: number;
  UserID: number;
  AcademicSpaceID: number;
  ProfessorID: number;
  RoleInAssignment: 'monitor' | 'graduate_assistant';
  ContractedHoursPerWeek: number;
  UserName: string;
  UserEmail: string;
  CreatedAt?: string;
  UpdatedAt?: string;
}

export interface ProfessorTask {
  id: number;
  title: string;
  description: string;
  observations?: string;
  status: string;
  week_start: string;
  is_late: boolean;
  time_invested: number;
  assignment_id: number;
  time_registered?: string;
}

export interface PdfReport {
  id: number;
  week_start: string;
  assignment_id: number;
  user_name: string;
  file_name: string;
  created_at: string;
  status: 'pending' | 'ready' | 'error';
}

export type ReportStatus = 'reported' | 'late' | 'no_report';

export interface DashboardRow {
  userId: number;
  userName: string;
  userEmail: string;
  assignmentId: number;
  spaceName: string;
  spaceType: string;
  role: 'monitor' | 'graduate_assistant';
  contractedHours: number;
  weekHours: number;
  reportStatus: ReportStatus;
  taskCount: number;
}
