import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ProfessorVinculacionesComponent } from './professor-vinculaciones.component';
import { ProfessorApiService } from './professor-api.service';
import { ReactiveFormsModule } from '@angular/forms';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { of, throwError } from 'rxjs';
import type { ProfessorAssignment, ProfessorSpace, AvailableUser } from './professor.models';

describe('ProfessorVinculacionesComponent', () => {
  let component: ProfessorVinculacionesComponent;
  let fixture: ComponentFixture<ProfessorVinculacionesComponent>;
  let apiService: any;

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

  const mockUsers: AvailableUser[] = [
    { id: 1, name: 'Monitor 1', email: 'monitor@example.com', roles: ['monitor'] },
    { id: 2, name: 'Asistente 1', email: 'asistente@example.com', roles: ['asistente_graduado'] },
  ];

  beforeEach(async () => {
    const apiSpy = {
      getAssignments: vi.fn(),
      getSpaces: vi.fn(),
      getAssignableUsers: vi.fn(),
      createAssignment: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [ProfessorVinculacionesComponent, ReactiveFormsModule, HttpClientTestingModule],
      providers: [{ provide: ProfessorApiService, useValue: apiSpy }],
    }).compileComponents();

    apiService = TestBed.inject(ProfessorApiService) as any;
    fixture = TestBed.createComponent(ProfessorVinculacionesComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load assignments, spaces and users on init', () => {
    apiService.getAssignments.mockReturnValue(of(mockAssignments));
    apiService.getSpaces.mockReturnValue(of(mockSpaces));
    apiService.getAssignableUsers.mockReturnValue(of(mockUsers));

    component.ngOnInit();

    expect(component.assignments()).toEqual(mockAssignments);
    expect(component.spaces()).toEqual(mockSpaces);
    expect(component.users()).toEqual(mockUsers);
    expect(component.loading()).toBeFalsy();
  });

  it('should handle error when loading data', () => {
    apiService.getAssignments.mockReturnValue(of(mockAssignments));
    apiService.getSpaces.mockReturnValue(throwError(() => new Error('API Error')));
    apiService.getAssignableUsers.mockReturnValue(of(mockUsers));

    component.load();

    expect(component.loading()).toBeFalsy();
    expect(component.error()).toBeTruthy();
  });

  it('should handle missing assignments gracefully', () => {
    apiService.getAssignments.mockReturnValue(throwError(() => new Error('Error')));
    apiService.getSpaces.mockReturnValue(of(mockSpaces));
    apiService.getAssignableUsers.mockReturnValue(of(mockUsers));

    component.load();

    expect(component.assignments()).toEqual([]);
  });

  it('should open form with default values', () => {
    component.openForm();

    expect(component.showForm()).toBeTruthy();
    expect(component.form.get('role_in_assignment')?.value).toBe('monitor');
    expect(component.form.get('contracted_hours_per_week')?.value).toBe(4);
    expect(component.success()).toBeNull();
    expect(component.error()).toBeNull();
  });

  it('should cancel form', () => {
    component.showForm.set(true);
    component.cancel();

    expect(component.showForm()).toBeFalsy();
  });

  it('should not save invalid form', () => {
    component.form.patchValue({
      academic_space_id: 0,
      user_id: 0,
      role_in_assignment: 'monitor',
      contracted_hours_per_week: 4,
    });

    component.save();

    expect(component.saving()).toBeFalsy();
    expect(apiService.createAssignment).not.toHaveBeenCalled();
  });

  it('should validate contracted hours range', () => {
    component.form.patchValue({
      academic_space_id: 1,
      user_id: 1,
      contracted_hours_per_week: 30, // More than max of 22
    });

    expect(component.form.get('contracted_hours_per_week')?.hasError('max')).toBeTruthy();
  });

  it('should validate minimum contracted hours', () => {
    component.form.patchValue({
      academic_space_id: 1,
      user_id: 1,
      contracted_hours_per_week: 0, // Less than min of 1
    });

    expect(component.form.get('contracted_hours_per_week')?.hasError('min')).toBeTruthy();
  });

  it('should save valid form', () => {
    apiService.createAssignment.mockReturnValue(of({ id: 1, space_id: 1, user_id: 1 }));
    apiService.getAssignments.mockReturnValue(of(mockAssignments));
    apiService.getSpaces.mockReturnValue(of(mockSpaces));
    apiService.getAssignableUsers.mockReturnValue(of(mockUsers));

    component.form.patchValue({
      academic_space_id: 1,
      user_id: 1,
      role_in_assignment: 'monitor',
      contracted_hours_per_week: 10,
    });

    component.save();

    expect(apiService.createAssignment).toHaveBeenCalled();
  });

  it('should handle error when saving assignment', () => {
    apiService.createAssignment.mockReturnValue(throwError(() => new Error('API Error')));

    component.form.patchValue({
      academic_space_id: 1,
      user_id: 1,
      role_in_assignment: 'monitor',
      contracted_hours_per_week: 10,
    });

    component.save();

    expect(component.saving()).toBeFalsy();
    expect(component.error()).toBeTruthy();
  });

  it('should get space name by id', () => {
    apiService.getAssignments.mockReturnValue(of(mockAssignments));
    apiService.getSpaces.mockReturnValue(of(mockSpaces));
    apiService.getAssignableUsers.mockReturnValue(of(mockUsers));

    component.load();

    expect(component.spaceName(1)).toBe('Space 1');
  });

  it('should return space id when space not found', () => {
    apiService.getAssignments.mockReturnValue(of(mockAssignments));
    apiService.getSpaces.mockReturnValue(of(mockSpaces));
    apiService.getAssignableUsers.mockReturnValue(of(mockUsers));

    component.load();

    expect(component.spaceName(999)).toBe('#999');
  });

  it('should require academic_space_id', () => {
    component.form.patchValue({
      academic_space_id: 0,
    });

    expect(component.form.get('academic_space_id')?.hasError('required')).toBeFalsy(); // default is not "required" error
    expect(component.form.get('academic_space_id')?.hasError('min')).toBeTruthy();
  });

  it('should require user_id', () => {
    component.form.patchValue({
      user_id: 0,
    });

    expect(component.form.get('user_id')?.hasError('min')).toBeTruthy();
  });

  it('should require role_in_assignment', () => {
    component.form.patchValue({
      role_in_assignment: undefined,
    });

    expect(component.form.get('role_in_assignment')?.invalid).toBeTruthy();
  });

  it('should clear error on successful save', () => {
    component.error.set('Previous error');
    apiService.createAssignment.mockReturnValue(of({ id: 1, space_id: 1, user_id: 1 }));
    apiService.getAssignments.mockReturnValue(of(mockAssignments));
    apiService.getSpaces.mockReturnValue(of(mockSpaces));
    apiService.getAssignableUsers.mockReturnValue(of(mockUsers));

    component.form.patchValue({
      academic_space_id: 1,
      user_id: 1,
      role_in_assignment: 'monitor',
      contracted_hours_per_week: 10,
    });

    component.save();

    expect(component.error()).toBeNull();
  });
});
