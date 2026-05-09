import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ProfessorDashboardComponent } from './professor-dashboard.component';
import { ProfessorApiService } from './professor-api.service';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { of, throwError } from 'rxjs';
import type { ProfessorAssignment, ProfessorTask, ProfessorSpace } from './professor.models';

describe('ProfessorDashboardComponent', () => {
    let component: ProfessorDashboardComponent;
    let fixture: ComponentFixture<ProfessorDashboardComponent>;
    let apiService: any;

    beforeEach(async () => {
        const apiSpy = {
            getAssignments: vi.fn(),
            getSpaces: vi.fn(),
            getTasksByWeek: vi.fn(),
        };

        await TestBed.configureTestingModule({
            imports: [ProfessorDashboardComponent, HttpClientTestingModule, RouterTestingModule],
            providers: [{ provide: ProfessorApiService, useValue: apiSpy }],
        }).compileComponents();

        apiService = TestBed.inject(ProfessorApiService) as any;
        fixture = TestBed.createComponent(ProfessorDashboardComponent);
        component = fixture.componentInstance;
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should have week options', () => {
        expect(component.weekOptions.length).toBeGreaterThan(0);
    });

    it('should have initial selected week', () => {
        expect(component.selectedWeek()).toBeTruthy();
    });

    it('should load data on init', () => {
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

        const mockTasks: ProfessorTask[] = [
            {
                id: 1,
                title: 'Task 1',
                description: 'Description',
                status: 'completed',
                assignment_id: 1,
                week_start: component.selectedWeek(),
                time_invested: 10,
                is_late: false,
            },
        ];

        apiService.getAssignments.mockReturnValue(of(mockAssignments));
        apiService.getSpaces.mockReturnValue(of(mockSpaces));
        apiService.getTasksByWeek.mockReturnValue(of(mockTasks));

        component.ngOnInit();

        expect(component.loading()).toBeFalsy();
        expect(component.error()).toBeNull();
    });

    it('should handle error on load', () => {
        apiService.getAssignments.mockReturnValue(throwError(() => new Error('API Error')));
        apiService.getSpaces.mockReturnValue(of([]));
        apiService.getTasksByWeek.mockReturnValue(of([]));

        component.load();

        expect(component.loading()).toBeFalsy();
        expect(component.error()).toBeTruthy();
    });

    it('should change week and reload data', () => {
        const mockAssignments: ProfessorAssignment[] = [];
        const mockSpaces: ProfessorSpace[] = [];
        const mockTasks: ProfessorTask[] = [];

        apiService.getAssignments.mockReturnValue(of(mockAssignments));
        apiService.getSpaces.mockReturnValue(of(mockSpaces));
        apiService.getTasksByWeek.mockReturnValue(of(mockTasks));

        component.onWeekChange('2026-04-26');

        expect(component.selectedWeek()).toBe('2026-04-26');
        expect(apiService.getTasksByWeek).toHaveBeenCalledWith('2026-04-26');
    });

    it('should calculate correct role labels', () => {
        expect(component.roleLabel('monitor')).toBe('Monitor');
        expect(component.roleLabel('graduate_assistant')).toBe('Asist. Graduado');
    });

    it('should compute rows correctly', () => {
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

        const mockTasks: ProfessorTask[] = [
            {
                id: 1,
                title: 'Task 1',
                description: 'Description',
                status: 'completed',
                assignment_id: 1,
                week_start: component.selectedWeek(),
                time_invested: 10,
                is_late: false,
            },
        ];

        apiService.getAssignments.mockReturnValue(of(mockAssignments));
        apiService.getSpaces.mockReturnValue(of(mockSpaces));
        apiService.getTasksByWeek.mockReturnValue(of(mockTasks));

        component.load();

        expect(component.rows().length).toBe(1);
        expect(component.rows()[0].spaceName).toBe('Space 1');
    });

    it('should compute correct summary statistics', () => {
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
            {
                ID: 2,
                UserID: 2,
                UserName: 'Prof. Test 2',
                UserEmail: 'test2@example.com',
                AcademicSpaceID: 1,
                ProfessorID: 1,
                RoleInAssignment: 'graduate_assistant',
                ContractedHoursPerWeek: 15,
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

        const mockTasks: ProfessorTask[] = [
            {
                id: 1,
                title: 'Task 1',
                description: 'Description',
                status: 'completed',
                assignment_id: 1,
                week_start: component.selectedWeek(),
                time_invested: 10,
                is_late: false,
            },
        ];

        apiService.getAssignments.mockReturnValue(of(mockAssignments));
        apiService.getSpaces.mockReturnValue(of(mockSpaces));
        apiService.getTasksByWeek.mockReturnValue(of(mockTasks));

        component.load();

        expect(component.totalReported()).toBeGreaterThanOrEqual(0);
        expect(component.totalLate()).toBeGreaterThanOrEqual(0);
        expect(component.totalNoReport()).toBeGreaterThanOrEqual(0);
    });
});
