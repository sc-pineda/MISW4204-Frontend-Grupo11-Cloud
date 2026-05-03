import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ProfessorApiService } from './professor-api.service';
import type {
  ProfessorAssignment,
  ProfessorTask,
  ProfessorSpace,
  PdfReport,
  ReportQueueResponse,
  AcademicPeriod,
  CreateSpaceBody,
  CreateAssignmentBody,
} from './professor.models';

describe('ProfessorApiService', () => {
  let service: ProfessorApiService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ProfessorApiService],
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
          UserID: 1,
          UserName: 'Prof. Test',
          UserEmail: 'test@example.com',
          AcademicSpaceID: 1,
          ProfessorID: 1,
          RoleInAssignment: 'monitor',
          ContractedHoursPerWeek: 20,
        },
      ];

      service.getAssignments().subscribe((assignments) => {
        expect(assignments.length).toBe(1);
        expect(assignments[0].UserName).toBe('Prof. Test');
      });

      const req = httpMock.expectOne('/api/v1/userAssignments/profesor');
      expect(req.request.method).toBe('GET');
      req.flush(mockAssignments);
    });
  });

  describe('getTasksByWeek', () => {
    it('should fetch tasks for a given week', () => {
      const mockTasks: ProfessorTask[] = [
        {
          id: 1,
          title: 'Task 1',
          description: 'Description',
          status: 'completed',
          assignment_id: 1,
          week_start: '2026-05-03',
          time_invested: 10,
          is_late: false,
        },
      ];

      service.getTasksByWeek('2026-05-03').subscribe((tasks) => {
        expect(tasks.length).toBe(1);
        expect(tasks[0].time_invested).toBe(10);
      });

      const req = httpMock.expectOne((r) => r.url === '/api/v1/professors/me/tasks');
      expect(req.request.params.get('week_start')).toBe('2026-05-03');
      req.flush(mockTasks);
    });
  });

  describe('getAssignmentTasks', () => {
    it('should fetch tasks for a specific assignment', () => {
      const assignmentId = 1;
      const mockTasks: ProfessorTask[] = [
        {
          id: 1,
          title: 'Task 1',
          description: 'Description',
          status: 'completed',
          assignment_id: assignmentId,
          week_start: '2026-05-03',
          time_invested: 8,
          is_late: false,
        },
      ];

      service.getAssignmentTasks(assignmentId).subscribe((tasks) => {
        expect(tasks.length).toBe(1);
      });

      const req = httpMock.expectOne(`/api/v1/professors/assignments/${assignmentId}/tasks`);
      expect(req.request.method).toBe('GET');
      req.flush(mockTasks);
    });
  });

  describe('generateReports', () => {
    it('should generate weekly reports', () => {
      const mockResponse: ReportQueueResponse = {
        request_id: '1',
        status: 'queued',
        message: 'Report queued for generation',
      };

      service.generateReports('2026-05-03').subscribe((response) => {
        expect(response.status).toBe('queued');
      });

      const req = httpMock.expectOne('/api/v1/reports/weekly');
      expect(req.request.method).toBe('POST');
      expect(req.request.body.week_start).toBe('2026-05-03');
      req.flush(mockResponse);
    });
  });

  describe('getReports', () => {
    it('should fetch all reports', () => {
      const mockReports: PdfReport[] = [
        {
          id: 1,
          professor_id: 1,
          assignment_id: 1,
          user_name: 'Prof. Test',
          user_email: 'test@example.com',
          role: 'monitor',
          week_start: '2026-05-03',
          created_at: '2026-05-04T10:00:00Z',
          file_path: '/path/to/report.pdf',
        },
      ];

      service.getReports().subscribe((reports) => {
        expect(reports.length).toBe(1);
      });

      const req = httpMock.expectOne('/api/v1/reports');
      expect(req.request.method).toBe('GET');
      req.flush(mockReports);
    });
  });

  describe('downloadReport', () => {
    it('should download a report as blob', () => {
      const reportId = 1;
      const mockBlob = new Blob(['report data']);

      service.downloadReport(reportId).subscribe((blob) => {
        expect(blob).toBeTruthy();
      });

      const req = httpMock.expectOne(`/api/v1/reports/${reportId}/download`);
      expect(req.request.method).toBe('GET');
      expect(req.request.responseType).toBe('blob');
      req.flush(mockBlob);
    });
  });

  describe('getReportDownloadUrl', () => {
    it('should return the correct download URL', () => {
      const reportId = 1;
      const url = service.getReportDownloadUrl(reportId);
      expect(url).toBe(`/api/v1/reports/${reportId}/download`);
    });
  });

  describe('getSpaces', () => {
    it('should fetch all spaces', () => {
      const mockSpaces: ProfessorSpace[] = [
        {
          ID: 1,
          Name: 'Space 1',
          Type: 'course',
          Status: 'active',
          AcademicPeriodID: 1,
          ProfessorID: 1,
          StartDate: '2026-01-01',
          EndDate: '2026-06-01',
        },
      ];

      service.getSpaces().subscribe((spaces) => {
        expect(spaces.length).toBe(1);
        expect(spaces[0].Name).toBe('Space 1');
      });

      const req = httpMock.expectOne('/api/v1/spaces');
      expect(req.request.method).toBe('GET');
      req.flush(mockSpaces);
    });
  });

  describe('createSpace', () => {
    it('should create a new space', () => {
      const body: CreateSpaceBody = {
        name: 'New Space',
        type: 'course',
        academic_period_id: 1,
        start_date: '2026-01-01',
        end_date: '2026-06-01',
        observations: '',
      };

      const mockResponse: ProfessorSpace = {
        ID: 1,
        Name: body.name,
        Type: body.type,
        AcademicPeriodID: body.academic_period_id,
        ProfessorID: 1,
        StartDate: body.start_date,
        EndDate: body.end_date,
        Status: 'active',
        Observations: body.observations,
      };

      service.createSpace(body).subscribe((space) => {
        expect(space.ID).toBe(1);
      });

      const req = httpMock.expectOne('/api/v1/spaces');
      expect(req.request.method).toBe('POST');
      req.flush(mockResponse);
    });
  });

  describe('closeSpace', () => {
    it('should close a space', () => {
      const spaceId = 1;

      service.closeSpace(spaceId).subscribe((response) => {
        expect(response.status).toBe('closed');
      });

      const req = httpMock.expectOne(`/api/v1/spaces/${spaceId}/close`);
      expect(req.request.method).toBe('PATCH');
      req.flush({ status: 'closed' });
    });
  });

  describe('getActivePeriods', () => {
    it('should fetch active academic periods', () => {
      const mockPeriods: AcademicPeriod[] = [
        {
          ID: 1,
          Code: '2026-1',
          StartDate: '2026-01-01',
          EndDate: '2026-06-01',
          Status: 'active',
        },
      ];

      service.getActivePeriods().subscribe((periods) => {
        expect(periods.length).toBe(1);
      });

      const req = httpMock.expectOne('/api/v1/periods');
      expect(req.request.method).toBe('GET');
      req.flush(mockPeriods);
    });
  });

  describe('getAssignableUsers', () => {
    it('should fetch assignable users (monitors and asistentes_graduados)', () => {
      const mockResponse = {
        users: [
          { id: 1, name: 'Monitor 1', roles: ['monitor'] },
          { id: 2, name: 'Asistente 1', roles: ['asistente_graduado'] },
          { id: 3, name: 'Other User', roles: ['student'] },
        ],
      };

      service.getAssignableUsers().subscribe((users) => {
        expect(users.length).toBe(2);
        expect(users[0].name).toBe('Monitor 1');
        expect(users[1].name).toBe('Asistente 1');
      });

      const req = httpMock.expectOne('/api/v1/users');
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });
  });

  describe('createAssignment', () => {
    it('should create a new assignment', () => {
      const spaceId = 1;
      const body: CreateAssignmentBody = {
        user_id: 2,
        role_in_assignment: 'monitor',
        contracted_hours_per_week: 20,
      };

      const mockResponse = {
        ID: 1,
        UserID: 2,
        AcademicSpaceID: spaceId,
        ProfessorID: 1,
        RoleInAssignment: 'monitor',
        ContractedHoursPerWeek: 20,
      };

      service.createAssignment(spaceId, body).subscribe((response) => {
        expect(response.ID).toBe(1);
      });

      const req = httpMock.expectOne(`/api/v1/spaces/${spaceId}/assignments`);
      expect(req.request.method).toBe('POST');
      req.flush(mockResponse);
    });
  });
});
