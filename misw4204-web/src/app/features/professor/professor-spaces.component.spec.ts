import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ProfessorSpacesComponent } from './professor-spaces.component';
import { ProfessorApiService } from './professor-api.service';
import { ReactiveFormsModule } from '@angular/forms';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { of, throwError } from 'rxjs';
import type { ProfessorSpace, AcademicPeriod } from './professor.models';

describe('ProfessorSpacesComponent', () => {
    let component: ProfessorSpacesComponent;
    let fixture: ComponentFixture<ProfessorSpacesComponent>;
    let apiService: any;

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

    const mockPeriods: AcademicPeriod[] = [
        {
            ID: 1,
            Code: '2026-1',
            StartDate: '2026-01-01',
            EndDate: '2026-06-01',
            Status: 'active',
        },
    ];

    beforeEach(async () => {
        const apiSpy = {
            getSpaces: vi.fn(),
            getActivePeriods: vi.fn(),
            createSpace: vi.fn(),
            closeSpace: vi.fn(),
        };

        await TestBed.configureTestingModule({
            imports: [ProfessorSpacesComponent, ReactiveFormsModule, HttpClientTestingModule],
            providers: [{ provide: ProfessorApiService, useValue: apiSpy }],
        }).compileComponents();

        apiService = TestBed.inject(ProfessorApiService) as any;
        fixture = TestBed.createComponent(ProfessorSpacesComponent);
        component = fixture.componentInstance;
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should load spaces and periods on init', () => {
        apiService.getSpaces.mockReturnValue(of(mockSpaces));
        apiService.getActivePeriods.mockReturnValue(of(mockPeriods));

        component.ngOnInit();

        expect(component.spaces()).toEqual(mockSpaces);
        expect(component.periods()).toEqual(mockPeriods);
        expect(component.loadingSpaces()).toBeFalsy();
        expect(component.loadingPeriods()).toBeFalsy();
    });

    it('should filter active periods only', () => {
        const periodsWithInactive: AcademicPeriod[] = [
            {
                ID: 1,
                Code: '2026-1',
                StartDate: '2026-01-01',
                EndDate: '2026-06-01',
                Status: 'active',
            },
            {
                ID: 2,
                Code: '2025-2',
                StartDate: '2025-07-01',
                EndDate: '2025-12-01',
                Status: 'closed',
            },
        ];

        apiService.getSpaces.mockReturnValue(of(mockSpaces));
        apiService.getActivePeriods.mockReturnValue(of(periodsWithInactive));

        component.loadPeriods();

        expect(component.periods().length).toBe(1);
        expect(component.periods()[0].Status).toBe('active');
    });

    it('should handle error when loading spaces', () => {
        apiService.getSpaces.mockReturnValue(throwError(() => new Error('API Error')));

        component.loadSpaces();

        expect(component.loadingSpaces()).toBeFalsy();
        expect(component.spacesError()).toBeTruthy();
    });

    it('should handle error when loading periods', () => {
        apiService.getActivePeriods.mockReturnValue(throwError(() => new Error('API Error')));

        component.loadPeriods();

        expect(component.loadingPeriods()).toBeFalsy();
        expect(component.periodsError()).toBeTruthy();
    });

    it('should open form with reset values', () => {
        component.openForm();

        expect(component.showForm()).toBeTruthy();
        expect(component.form.get('type')?.value).toBe('course');
        expect(component.form.get('academic_period_id')?.value).toBe(0);
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
            name: '',
            type: 'course',
            academic_period_id: 0,
            start_date: '',
            end_date: '',
        });

        component.save();

        expect(component.saving()).toBeFalsy();
        expect(apiService.createSpace).not.toHaveBeenCalled();
    });

    it('should save valid form', () => {
        const mockSpace: ProfessorSpace = {
            ID: 2,
            Name: 'New Space',
            Type: 'course',
            Status: 'active',
            AcademicPeriodID: 1,
            ProfessorID: 1,
            StartDate: '2026-01-01',
            EndDate: '2026-06-01',
        };

        apiService.createSpace.mockReturnValue(of(mockSpace));
        apiService.getSpaces.mockReturnValue(of([...mockSpaces, mockSpace]));
        apiService.getActivePeriods.mockReturnValue(of(mockPeriods));

        component.form.patchValue({
            name: 'New Space',
            type: 'course',
            academic_period_id: 1,
            start_date: '2026-01-01',
            end_date: '2026-06-01',
            observations: '',
        });

        component.save();

        expect(apiService.createSpace).toHaveBeenCalled();
    });

    it('should close space', () => {
        apiService.closeSpace.mockReturnValue(of({ status: 'closed' }));
        apiService.getSpaces.mockReturnValue(of(mockSpaces));
        apiService.getActivePeriods.mockReturnValue(of(mockPeriods));

        component.closeSpace(1);

        expect(apiService.closeSpace).toHaveBeenCalledWith(1);
    });

    it('should get correct type label', () => {
        expect(component.typeLabel('course')).toBe('Curso');
        expect(component.typeLabel('project')).toBe('Proyecto');
    });

    it('should format date correctly', () => {
        const iso = '2026-01-01T10:30:00Z';
        expect(component.shortDate(iso)).toBe('2026-01-01');
    });

    it('should handle empty date', () => {
        expect(component.shortDate('')).toBe('—');
    });

    it('should load both spaces and periods with load method', () => {
        apiService.getSpaces.mockReturnValue(of(mockSpaces));
        apiService.getActivePeriods.mockReturnValue(of(mockPeriods));

        component.load();

        expect(apiService.getSpaces).toHaveBeenCalled();
        expect(apiService.getActivePeriods).toHaveBeenCalled();
    });
});
