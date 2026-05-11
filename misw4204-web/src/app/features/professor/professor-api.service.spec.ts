import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';

import type {
  AcademicPeriod,
  AssignmentResponse,
  AvailableUser,
  CreateAssignmentBody,
  CreateSpaceBody,
  PdfReport,
  ProfessorAssignment,
  ProfessorSpace,
  ProfessorTask,
  ReportQueueResponse,
} from './professor.models';
import { ProfessorApiService } from './professor-api.service';

describe('ProfessorApiService', () => {
  let service: ProfessorApiService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), ProfessorApiService],
    });

    service = TestBed.inject(ProfessorApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getAssignments', () => {
    it('should fetch assignments for professor', () => {
      const mockAssignments: ProfessorAssignment[] = [
        {
          ID: 1,
          UserID: 10,
          AcademicSpaceID: 5,
          ProfessorID: 3,
          RoleInAssignment: 'monitor',
          ContractedHoursPerWeek: 8,
          UserName: 'Ana López',
          UserEmail: 'ana@uni.edu',
        },
      ];

      service.getAssignments().subscribe((res) => {
        expect(res).toEqual(mockAssignments);
      });

      const req = httpMock.expectOne('/api/v1/professors/me/assignments');
      expect(req.request.method).toBe('GET');
      req.flush(mockAssignments);
    });
  });

  describe('getTasksByWeek', () => {
    it('should fetch tasks for a given week', () => {
      const weekStart = '2026-04-20';
      const mockTasks: ProfessorTask[] = [
        {
          id: 1,
          title: 'Revisar entregas',
          description: 'Revisar trabajos de la semana',
          status: 'pending',
          week_start: weekStart,
          is_late: false,
          time_invested: 2,
          assignment_id: 1,
        },
      ];

      service.getTasksByWeek(weekStart).subscribe((res) => {
        expect(res).toEqual(mockTasks);
      });

      const req = httpMock.expectOne(
        `/api/v1/professors/me/tasks?week_start=${weekStart}`,
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockTasks);
    });
  });

  describe('getAssignmentTasks', () => {
    it('should fetch tasks for a specific assignment', () => {
      const assignmentId = 7;
      const mockTasks: ProfessorTask[] = [
        {
          id: 10,
          title: 'Laboratorio',
          description: 'Preparar lab',
          status: 'in_progress',
          week_start: '2026-04-20',
          is_late: false,
          time_invested: 3,
          assignment_id: assignmentId,
        },
      ];

      service.getAssignmentTasks(assignmentId).subscribe((res) => {
        expect(res).toEqual(mockTasks);
      });

      const req = httpMock.expectOne(
        `/api/v1/professors/assignments/${assignmentId}/tasks`,
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockTasks);
    });
  });

  describe('generateReports', () => {
    it('should generate weekly reports', () => {
      const weekStart = '2026-04-20';
      const mockResponse: ReportQueueResponse = {
        request_id: 'abc-123',
        status: 'queued',
        message: 'Reports queued successfully',
      };

      service.generateReports(weekStart).subscribe((res) => {
        expect(res).toEqual(mockResponse);
      });

      const req = httpMock.expectOne('/api/v1/reports/weekly');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ week_start: weekStart });
      req.flush(mockResponse);
    });
  });

  describe('getReports', () => {
    it('should fetch all reports', () => {
      const mockReports: PdfReport[] = [
        {
          id: 1,
          professor_id: 3,
          assignment_id: 1,
          user_name: 'Ana López',
          user_email: 'ana@uni.edu',
          role: 'monitor',
          week_start: '2026-04-20',
          created_at: '2026-04-27T00:00:00Z',
          file_path: '/reports/1.pdf',
        },
      ];

      service.getReports().subscribe((res) => {
        expect(res).toEqual(mockReports);
      });

      const req = httpMock.expectOne('/api/v1/reports');
      expect(req.request.method).toBe('GET');
      req.flush(mockReports);
    });
  });

  describe('downloadReport', () => {
    it('should download a report as blob', () => {
      const reportId = 5;
      const mockBlob = new Blob(['pdf content'], { type: 'application/pdf' });

      service.downloadReport(reportId).subscribe((res) => {
        expect(res).toBeInstanceOf(Blob);
      });

      const req = httpMock.expectOne(`/api/v1/reports/${reportId}/download`);
      expect(req.request.method).toBe('GET');
      expect(req.request.responseType).toBe('blob');
      req.flush(mockBlob);
    });
  });

  describe('getReportDownloadUrl', () => {
    it('should return the correct download URL', () => {
      const reportId = 5;
      const url = service.getReportDownloadUrl(reportId);
      expect(url).toBe(`/api/v1/reports/${reportId}/download`);
    });
  });

  describe('getSpaces', () => {
    it('should fetch all spaces', () => {
      const mockSpaces: ProfessorSpace[] = [
        {
          ID: 1,
          Name: 'Ingeniería de Software',
          Type: 'course',
          AcademicPeriodID: 2,
          ProfessorID: 3,
          StartDate: '2026-01-15',
          EndDate: '2026-06-15',
          Status: 'active',
        },
      ];

      service.getSpaces().subscribe((res) => {
        expect(res).toEqual(mockSpaces);
      });

      const req = httpMock.expectOne('/api/v1/spaces');
      expect(req.request.method).toBe('GET');
      req.flush(mockSpaces);
    });
  });

  describe('createSpace', () => {
    it('should create a new space', () => {
      const body: CreateSpaceBody = {
        name: 'Proyecto de Grado',
        type: 'project',
        academic_period_id: 2,
        start_date: '2026-01-15',
        end_date: '2026-06-15',
        observations: 'Sin observaciones',
      };
      const mockSpace: ProfessorSpace = {
        ID: 10,
        Name: body.name,
        Type: body.type,
        AcademicPeriodID: body.academic_period_id,
        ProfessorID: 3,
        StartDate: body.start_date,
        EndDate: body.end_date,
        Status: 'active',
      };

      service.createSpace(body).subscribe((res) => {
        expect(res).toEqual(mockSpace);
      });

      const req = httpMock.expectOne('/api/v1/spaces');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(body);
      req.flush(mockSpace);
    });
  });

  describe('closeSpace', () => {
    it('should close a space', () => {
      const spaceId = 1;
      const mockResponse = { status: 'closed' };

      service.closeSpace(spaceId).subscribe((res) => {
        expect(res).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(`/api/v1/spaces/${spaceId}/close`);
      expect(req.request.method).toBe('PATCH');
      req.flush(mockResponse);
    });
  });

  describe('getActivePeriods', () => {
    it('should fetch active academic periods', () => {
      const mockPeriods: AcademicPeriod[] = [
        {
          ID: 1,
          Code: '2026-1',
          StartDate: '2026-01-15',
          EndDate: '2026-06-15',
          Status: 'active',
        },
      ];

      service.getActivePeriods().subscribe((res) => {
        expect(res).toEqual(mockPeriods);
      });

      const req = httpMock.expectOne('/api/v1/periods');
      expect(req.request.method).toBe('GET');
      req.flush(mockPeriods);
    });
  });

  describe('getAssignableUsers', () => {
    it('should fetch assignable users (monitors and asistentes_graduados)', () => {
      const allUsers: AvailableUser[] = [
        { id: 1, name: 'Carlos M', email: 'carlos@uni.edu', roles: ['monitor'] },
        { id: 2, name: 'Laura G', email: 'laura@uni.edu', roles: ['asistente_graduado'] },
        { id: 3, name: 'Pedro P', email: 'pedro@uni.edu', roles: ['profesor'] },
      ];

      service.getAssignableUsers().subscribe((res) => {
        expect(res.length).toBe(2);
        expect(res.map((u) => u.id)).toEqual([1, 2]);
      });

      const req = httpMock.expectOne('/api/v1/users');
      expect(req.request.method).toBe('GET');
      req.flush({ users: allUsers });
    });
  });

  describe('createAssignment', () => {
    it('should create a new assignment', () => {
      const spaceId = 5;
      const body: CreateAssignmentBody = {
        user_id: 10,
        role_in_assignment: 'monitor',
        contracted_hours_per_week: 8,
      };
      const mockResponse: AssignmentResponse = {
        ID: 99,
        UserID: 10,
        AcademicSpaceID: spaceId,
        ProfessorID: 3,
        RoleInAssignment: 'monitor',
        ContractedHoursPerWeek: 8,
      };

      service.createAssignment(spaceId, body).subscribe((res) => {
        expect(res).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(`/api/v1/spaces/${spaceId}/assignments`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(body);
      req.flush(mockResponse);
    });
  });
});
