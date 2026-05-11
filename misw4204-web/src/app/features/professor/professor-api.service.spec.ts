<<<<<<< HEAD
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
=======
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
>>>>>>> develop

describe('ProfessorApiService', () => {
  let service: ProfessorApiService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
<<<<<<< HEAD
      providers: [provideHttpClient(), provideHttpClientTesting(), ProfessorApiService],
    });

=======
      imports: [HttpClientTestingModule],
      providers: [ProfessorApiService],
    });
>>>>>>> develop
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
<<<<<<< HEAD
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
=======
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
>>>>>>> develop
      expect(req.request.method).toBe('GET');
      req.flush(mockAssignments);
    });
  });

  describe('getTasksByWeek', () => {
    it('should fetch tasks for a given week', () => {
<<<<<<< HEAD
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
=======
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
>>>>>>> develop
      req.flush(mockTasks);
    });
  });

  describe('getAssignmentTasks', () => {
    it('should fetch tasks for a specific assignment', () => {
<<<<<<< HEAD
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
=======
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
>>>>>>> develop
      expect(req.request.method).toBe('GET');
      req.flush(mockTasks);
    });
  });

  describe('generateReports', () => {
    it('should generate weekly reports', () => {
<<<<<<< HEAD
      const weekStart = '2026-04-20';
      const mockResponse: ReportQueueResponse = {
        request_id: 'abc-123',
        status: 'queued',
        message: 'Reports queued successfully',
      };

      service.generateReports(weekStart).subscribe((res) => {
        expect(res).toEqual(mockResponse);
=======
      const mockResponse: ReportQueueResponse = {
        request_id: '1',
        status: 'queued',
        message: 'Report queued for generation',
      };

      service.generateReports('2026-05-03').subscribe((response) => {
        expect(response.status).toBe('queued');
>>>>>>> develop
      });

      const req = httpMock.expectOne('/api/v1/reports/weekly');
      expect(req.request.method).toBe('POST');
<<<<<<< HEAD
      expect(req.request.body).toEqual({ week_start: weekStart });
=======
      expect(req.request.body.week_start).toBe('2026-05-03');
>>>>>>> develop
      req.flush(mockResponse);
    });
  });

  describe('getReports', () => {
    it('should fetch all reports', () => {
      const mockReports: PdfReport[] = [
        {
          id: 1,
<<<<<<< HEAD
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
=======
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
>>>>>>> develop
      });

      const req = httpMock.expectOne('/api/v1/reports');
      expect(req.request.method).toBe('GET');
      req.flush(mockReports);
    });
  });

  describe('downloadReport', () => {
    it('should download a report as blob', () => {
<<<<<<< HEAD
      const reportId = 5;
      const mockBlob = new Blob(['pdf content'], { type: 'application/pdf' });

      service.downloadReport(reportId).subscribe((res) => {
        expect(res).toBeInstanceOf(Blob);
=======
      const reportId = 1;
      const mockBlob = new Blob(['report data']);

      service.downloadReport(reportId).subscribe((blob) => {
        expect(blob).toBeTruthy();
>>>>>>> develop
      });

      const req = httpMock.expectOne(`/api/v1/reports/${reportId}/download`);
      expect(req.request.method).toBe('GET');
      expect(req.request.responseType).toBe('blob');
      req.flush(mockBlob);
    });
  });

  describe('getReportDownloadUrl', () => {
    it('should return the correct download URL', () => {
<<<<<<< HEAD
      const reportId = 5;
=======
      const reportId = 1;
>>>>>>> develop
      const url = service.getReportDownloadUrl(reportId);
      expect(url).toBe(`/api/v1/reports/${reportId}/download`);
    });
  });

  describe('getSpaces', () => {
    it('should fetch all spaces', () => {
      const mockSpaces: ProfessorSpace[] = [
        {
          ID: 1,
<<<<<<< HEAD
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
=======
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
>>>>>>> develop
      });

      const req = httpMock.expectOne('/api/v1/spaces');
      expect(req.request.method).toBe('GET');
      req.flush(mockSpaces);
    });
  });

  describe('createSpace', () => {
    it('should create a new space', () => {
      const body: CreateSpaceBody = {
<<<<<<< HEAD
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
=======
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
>>>>>>> develop
      });

      const req = httpMock.expectOne('/api/v1/spaces');
      expect(req.request.method).toBe('POST');
<<<<<<< HEAD
      expect(req.request.body).toEqual(body);
      req.flush(mockSpace);
=======
      req.flush(mockResponse);
>>>>>>> develop
    });
  });

  describe('closeSpace', () => {
    it('should close a space', () => {
      const spaceId = 1;
<<<<<<< HEAD
      const mockResponse = { status: 'closed' };

      service.closeSpace(spaceId).subscribe((res) => {
        expect(res).toEqual(mockResponse);
=======

      service.closeSpace(spaceId).subscribe((response) => {
        expect(response.status).toBe('closed');
>>>>>>> develop
      });

      const req = httpMock.expectOne(`/api/v1/spaces/${spaceId}/close`);
      expect(req.request.method).toBe('PATCH');
<<<<<<< HEAD
      req.flush(mockResponse);
=======
      req.flush({ status: 'closed' });
>>>>>>> develop
    });
  });

  describe('getActivePeriods', () => {
    it('should fetch active academic periods', () => {
      const mockPeriods: AcademicPeriod[] = [
        {
          ID: 1,
          Code: '2026-1',
<<<<<<< HEAD
          StartDate: '2026-01-15',
          EndDate: '2026-06-15',
=======
          StartDate: '2026-01-01',
          EndDate: '2026-06-01',
>>>>>>> develop
          Status: 'active',
        },
      ];

<<<<<<< HEAD
      service.getActivePeriods().subscribe((res) => {
        expect(res).toEqual(mockPeriods);
=======
      service.getActivePeriods().subscribe((periods) => {
        expect(periods.length).toBe(1);
>>>>>>> develop
      });

      const req = httpMock.expectOne('/api/v1/periods');
      expect(req.request.method).toBe('GET');
      req.flush(mockPeriods);
    });
  });

  describe('getAssignableUsers', () => {
    it('should fetch assignable users (monitors and asistentes_graduados)', () => {
<<<<<<< HEAD
      const allUsers: AvailableUser[] = [
        { id: 1, name: 'Carlos M', email: 'carlos@uni.edu', roles: ['monitor'] },
        { id: 2, name: 'Laura G', email: 'laura@uni.edu', roles: ['asistente_graduado'] },
        { id: 3, name: 'Pedro P', email: 'pedro@uni.edu', roles: ['profesor'] },
      ];

      service.getAssignableUsers().subscribe((res) => {
        expect(res.length).toBe(2);
        expect(res.map((u) => u.id)).toEqual([1, 2]);
=======
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
>>>>>>> develop
      });

      const req = httpMock.expectOne('/api/v1/users');
      expect(req.request.method).toBe('GET');
<<<<<<< HEAD
      req.flush({ users: allUsers });
=======
      req.flush(mockResponse);
>>>>>>> develop
    });
  });

  describe('createAssignment', () => {
    it('should create a new assignment', () => {
<<<<<<< HEAD
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
=======
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
>>>>>>> develop
      });

      const req = httpMock.expectOne(`/api/v1/spaces/${spaceId}/assignments`);
      expect(req.request.method).toBe('POST');
<<<<<<< HEAD
      expect(req.request.body).toEqual(body);
=======
>>>>>>> develop
      req.flush(mockResponse);
    });
  });
});
