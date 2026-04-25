import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';

import type { CreateMonitorTaskBody, MonitorAssignment, MonitorTask } from './asistente_monitor.models';
import { AsistenteMonitorService } from './asistente_monitor.service';

describe('AsistenteMonitorService', () => {
  let service: AsistenteMonitorService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), AsistenteMonitorService],
    });

    service = TestBed.inject(AsistenteMonitorService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('debe consultar las vinculaciones del usuario autenticado', () => {
    const mockAssignments: MonitorAssignment[] = [
      {
        ID: 1,
        UserID: 10,
        AcademicSpaceID: 50,
        ProfessorID: 3,
        RoleInAssignment: 'monitor',
        ContractedHoursPerWeek: 8,
      },
    ];

    service.listAssignmentsByUser(10).subscribe((res) => {
      expect(res).toEqual(mockAssignments);
    });

    const req = httpMock.expectOne('/api/v1/assignments/me');
    expect(req.request.method).toBe('GET');
    req.flush(mockAssignments);
  });

  it('debe consultar la lista de tareas del usuario autenticado', () => {
    const mockTasks: MonitorTask[] = [
      {
        id: 100,
        title: 'Actualizar reporte',
        description: 'Completar evidencias de la semana',
        status: 'pending',
        week_start: '2026-04-20',
        is_late: false,
        time_invested: 2,
        assignment_id: 1,
      },
    ];

    service.listTasksByUser(10).subscribe((res) => {
      expect(res).toEqual(mockTasks);
    });

    const req = httpMock.expectOne('/api/v1/tasks');
    expect(req.request.method).toBe('GET');
    req.flush(mockTasks);
  });

  it('debe crear una tarea enviando el payload correcto', () => {
    const body: CreateMonitorTaskBody = {
      title: 'Preparar laboratorio',
      description: 'Alistar guía y recursos',
      status: 'pending',
      week_start: '2026-04-20',
      time_invested: 3,
      assignment_id: 1,
      observations: 'Revisar con profesor',
    };

    const createdTask: MonitorTask = {
      id: 200,
      ...body,
      is_late: false,
    };

    service.createTask(body).subscribe((res) => {
      expect(res).toEqual(createdTask);
    });

    const req = httpMock.expectOne('/api/v1/tasks');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(body);
    req.flush(createdTask);
  });
});