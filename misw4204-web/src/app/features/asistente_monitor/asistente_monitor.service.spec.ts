import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';

import type {
  CreateMonitorTaskBody,
  MonitorAssignment,
  MonitorTask,
  MonitorTaskAttachment,
  UpdateMonitorTaskBody,
} from './asistente_monitor.models';
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

  it('debe actualizar una tarea existente', () => {
    const body: UpdateMonitorTaskBody = {
      title: 'Actualizar reporte final',
      description: 'Se ajustaron observaciones',
      status: 'in_progress',
      week_start: '2026-04-20',
      time_invested: 4,
      observations: 'Aprobado por profesor',
    };

    service.updateTask(100, body).subscribe((res) => {
      expect(res.title).toBe(body.title);
      expect(res.time_invested).toBe(4);
    });

    const req = httpMock.expectOne('/api/v1/tasks/100');
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual(body);
    req.flush({
      id: 100,
      assignment_id: 1,
      is_late: false,
      ...body,
    } satisfies MonitorTask);
  });

  it('debe eliminar una tarea existente', () => {
    service.deleteTask(77).subscribe((res) => {
      expect(res).toBeNull();
    });

    const req = httpMock.expectOne('/api/v1/tasks/77');
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });

  it('debe cargar adjuntos de una tarea en FormData', () => {
    const file = new File(['contenido'], 'evidencia.txt', { type: 'text/plain' });

    service.uploadTaskAttachment(10, file).subscribe();

    const req = httpMock.expectOne('/api/v1/tasks/10/attachments');
    expect(req.request.method).toBe('POST');
    expect(req.request.body instanceof FormData).toBe(true);
    const sentFile = (req.request.body as FormData).get('file');
    expect(sentFile).toBe(file);
    req.flush({ ok: true });
  });

  it('debe consultar los adjuntos de una tarea', () => {
    const attachments: MonitorTaskAttachment[] = [
      {
        ID: 1,
        TaskID: 2,
        FileName: 'ext2165e.pdf',
        ContentType: 'uploads\\1775795648539642700_ext2165e.pdf',
        StoragePath: 'application/pdf',
      },
    ];

    service.listTaskAttachments(2).subscribe((res) => {
      expect(res).toEqual(attachments);
    });

    const req = httpMock.expectOne('/api/v1/tasks/2/attachments');
    expect(req.request.method).toBe('GET');
    req.flush(attachments);
  });

  it('debe normalizar respuesta de adjunto único como lista', () => {
    const attachment: MonitorTaskAttachment = {
      ID: 2,
      TaskID: 9,
      FileName: 'evidencia.pdf',
      ContentType: 'uploads\\evidencia.pdf',
      StoragePath: 'application/pdf',
    };

    service.listTaskAttachments(9).subscribe((res) => {
      expect(res).toEqual([attachment]);
    });

    const req = httpMock.expectOne('/api/v1/tasks/9/attachments');
    expect(req.request.method).toBe('GET');
    req.flush(attachment);
  });

  it('debe normalizar respuesta envuelta en data como lista', () => {
    const attachment: MonitorTaskAttachment = {
      ID: 3,
      TaskID: 9,
      FileName: 'guia.docx',
      ContentType: 'uploads\\guia.docx',
      StoragePath: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    };

    service.listTaskAttachments(9).subscribe((res) => {
      expect(res).toEqual([attachment]);
    });

    const req = httpMock.expectOne('/api/v1/tasks/9/attachments');
    expect(req.request.method).toBe('GET');
    req.flush({ data: [attachment] });
  });
});