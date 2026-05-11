import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { of, throwError } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { vi } from 'vitest';

import { ProfessorSpacesComponent } from './professor-spaces.component';
import { ProfessorApiService } from './professor-api.service';
import type { AcademicPeriod, ProfessorSpace } from './professor.models';

describe('ProfessorSpacesComponent', () => {
  let component: ProfessorSpacesComponent;
  let fixture: ComponentFixture<ProfessorSpacesComponent>;
  let apiSpy: {
    getSpaces: ReturnType<typeof vi.fn>;
    getActivePeriods: ReturnType<typeof vi.fn>;
    createSpace: ReturnType<typeof vi.fn>;
    closeSpace: ReturnType<typeof vi.fn>;
  };

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

  const mockPeriods: AcademicPeriod[] = [
    { ID: 1, Code: '2026-1', StartDate: '2026-01-15', EndDate: '2026-06-15', Status: 'active' },
    { ID: 2, Code: '2025-2', StartDate: '2025-07-15', EndDate: '2025-12-15', Status: 'inactive' },
  ];

  beforeEach(async () => {
    apiSpy = {
      getSpaces: vi.fn().mockReturnValue(of(mockSpaces)),
      getActivePeriods: vi.fn().mockReturnValue(of(mockPeriods)),
      createSpace: vi.fn().mockReturnValue(of(mockSpaces[0])),
      closeSpace: vi.fn().mockReturnValue(of({ status: 'closed' })),
    };

    await TestBed.configureTestingModule({
      imports: [ProfessorSpacesComponent, ReactiveFormsModule],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: ProfessorApiService, useValue: apiSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ProfessorSpacesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load spaces and periods on init', () => {
    expect(apiSpy.getSpaces).toHaveBeenCalled();
    expect(apiSpy.getActivePeriods).toHaveBeenCalled();
    expect(component.spaces()).toEqual(mockSpaces);
    expect(component.loadingSpaces()).toBe(false);
    expect(component.loadingPeriods()).toBe(false);
  });

  it('should filter active periods only', () => {
    const activePeriods = component.periods();
    expect(activePeriods.length).toBe(1);
    expect(activePeriods[0].Status).toBe('active');
  });

  it('should handle error when loading spaces', () => {
    const error = new HttpErrorResponse({ error: { error: 'Not found' }, status: 404 });
    apiSpy.getSpaces.mockReturnValue(throwError(() => error));

    component.loadSpaces();

    expect(component.spacesError()).toBe('Not found');
    expect(component.loadingSpaces()).toBe(false);
  });

  it('should handle error when loading periods', () => {
    const error = new HttpErrorResponse({ error: { error: 'Server error' }, status: 500 });
    apiSpy.getActivePeriods.mockReturnValue(throwError(() => error));

    component.loadPeriods();

    expect(component.periodsError()).toBe('Server error');
    expect(component.loadingPeriods()).toBe(false);
  });

  it('should open form with reset values', () => {
    component.openForm();

    expect(component.showForm()).toBe(true);
    expect(component.form.value.type).toBe('course');
    expect(component.form.value.academic_period_id).toBe(0);
    expect(component.success()).toBeNull();
    expect(component.error()).toBeNull();
  });

  it('should cancel form', () => {
    component.openForm();
    component.cancel();

    expect(component.showForm()).toBe(false);
  });

  it('should not save invalid form', () => {
    component.openForm();
    component.form.controls.name.setValue('');

    component.save();

    expect(apiSpy.createSpace).not.toHaveBeenCalled();
    expect(component.form.touched).toBe(true);
  });

  it('should save valid form', () => {
    component.openForm();
    component.form.setValue({
      name: 'Nuevo espacio',
      type: 'course',
      academic_period_id: 1,
      start_date: '2026-01-15',
      end_date: '2026-06-15',
      observations: '',
    });

    component.save();

    expect(apiSpy.createSpace).toHaveBeenCalled();
    expect(component.showForm()).toBe(false);
    expect(component.success()).toBe('Espacio creado correctamente.');
  });

  it('should close space', () => {
    component.closeSpace(1);

    expect(apiSpy.closeSpace).toHaveBeenCalledWith(1);
    expect(component.closing()).toBeNull();
    expect(component.success()).toBe('Espacio cerrado.');
  });

  it('should get correct type label', () => {
    expect(component.typeLabel('course')).toBe('Curso');
    expect(component.typeLabel('project')).toBe('Proyecto');
  });

  it('should format date correctly', () => {
    expect(component.shortDate('2026-01-15T00:00:00Z')).toBe('2026-01-15');
  });

  it('should handle empty date', () => {
    expect(component.shortDate(null as unknown as string)).toBe('—');
  });

  it('should load both spaces and periods with load method', () => {
    apiSpy.getSpaces.mockClear();
    apiSpy.getActivePeriods.mockClear();

    component.load();

    expect(apiSpy.getSpaces).toHaveBeenCalled();
    expect(apiSpy.getActivePeriods).toHaveBeenCalled();
  });
});
