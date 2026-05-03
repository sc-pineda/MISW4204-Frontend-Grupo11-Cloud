import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ProfessorAssignmentDetailComponent } from './professor-assignment-detail.component';
import { ProfessorApiService } from './professor-api.service';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { of, throwError } from 'rxjs';
import type { ProfessorAssignment, ProfessorTask } from './professor.models';

describe('ProfessorAssignmentDetailComponent', () => {
    let component: ProfessorAssignmentDetailComponent;
    let fixture: ComponentFixture<ProfessorAssignmentDetailComponent>;
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
        {
            id: 2,
            title: 'Task 2',
            description: 'Description',
            status: 'completed',
            assignment_id: 1,
            week_start: '2026-04-26',
            time_invested: 8,
            is_late: true,
        },
    ];

    beforeEach(async () => {
        const apiSpy = {
            getAssignments: vi.fn(),
            getAssignmentTasks: vi.fn(),
        };

        await TestBed.configureTestingModule({
            imports: [ProfessorAssignmentDetailComponent, HttpClientTestingModule, RouterTestingModule],
            providers: [{ provide: ProfessorApiService, useValue: apiSpy }],
        }).compileComponents();

        apiService = TestBed.inject(ProfessorApiService) as any;
        fixture = TestBed.createComponent(ProfessorAssignmentDetailComponent);
        component = fixture.componentInstance;
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should load assignment and tasks on init', () => {
        apiService.getAssignments.mockReturnValue(of(mockAssignments));
        apiService.getAssignmentTasks.mockReturnValue(of(mockTasks));

        component.load(1);

        expect(component.assignment()).toEqual(mockAssignments[0]);
        expect(component.tasks().length).toBe(2);
        expect(component.loading()).toBeFalsy();
    });

    it('should select the most recent week by default', () => {
        apiService.getAssignments.mockReturnValue(of(mockAssignments));
        apiService.getAssignmentTasks.mockReturnValue(of(mockTasks));

        component.load(1);

        expect(component.selectedWeek()).toBe('2026-05-03');
    });

    it('should compute week summaries correctly', () => {
        apiService.getAssignments.mockReturnValue(of(mockAssignments));
        apiService.getAssignmentTasks.mockReturnValue(of(mockTasks));

        component.load(1);

        const summaries = component.weekSummaries();
        expect(summaries.length).toBe(2);
        expect(summaries[0].weekStart).toBe('2026-05-03');
        expect(summaries[0].totalHours).toBe(10);
        expect(summaries[0].hasLate).toBeFalsy();
        expect(summaries[1].hasLate).toBeTruthy();
    });

    it('should filter tasks by selected week', () => {
        apiService.getAssignments.mockReturnValue(of(mockAssignments));
        apiService.getAssignmentTasks.mockReturnValue(of(mockTasks));

        component.load(1);
        component.selectWeek('2026-04-26');

        const filteredTasks = component.selectedWeekTasks();
        expect(filteredTasks.length).toBe(1);
        expect(filteredTasks[0].week_start).toBe('2026-04-26');
    });

    it('should change selected week', () => {
        apiService.getAssignments.mockReturnValue(of(mockAssignments));
        apiService.getAssignmentTasks.mockReturnValue(of(mockTasks));

        component.load(1);
        component.selectWeek('2026-04-26');

        expect(component.selectedWeek()).toBe('2026-04-26');
    });

    it('should handle missing assignment gracefully', () => {
        apiService.getAssignments.mockReturnValue(
            of([
                ...mockAssignments,
                {
                    ID: 999,
                    UserID: 999,
                    UserName: 'Other',
                    UserEmail: 'other@example.com',
                    AcademicSpaceID: 1,
                    ProfessorID: 1,
                    RoleInAssignment: 'monitor' as const,
                    ContractedHoursPerWeek: 10,
                },
            ]),
        );
        apiService.getAssignmentTasks.mockReturnValue(of(mockTasks));

        component.load(999);

        expect(component.assignment()).not.toBeNull();
    });

    it('should handle error on load', () => {
        apiService.getAssignments.mockReturnValue(throwError(() => new Error('API Error')));
        apiService.getAssignmentTasks.mockReturnValue(of([]));

        component.load(1);

        expect(component.loading()).toBeFalsy();
        expect(component.error()).toBeTruthy();
    });

    it('should get correct role label', () => {
        expect(component.roleLabel('monitor')).toBe('Monitor');
        expect(component.roleLabel('asistente_graduado')).toBe('Asistente Graduado');
    });

    it('should return empty array when no week selected', () => {
        component.selectedWeek.set(null);

        expect(component.selectedWeekTasks().length).toBe(0);
    });
});
