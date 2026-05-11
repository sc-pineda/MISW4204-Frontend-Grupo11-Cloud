import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ProfessorReportsComponent } from './professor-reports.component';
import { ProfessorApiService } from './professor-api.service';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { of, throwError } from 'rxjs';
import type { PdfReport, ReportQueueResponse } from './professor.models';

describe('ProfessorReportsComponent', () => {
    let component: ProfessorReportsComponent;
    let fixture: ComponentFixture<ProfessorReportsComponent>;
    let apiService: any;

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
            file_path: '/path/to/report1.pdf',
        },
        {
            id: 2,
            professor_id: 1,
            assignment_id: 1,
            user_name: 'Prof. Test 2',
            user_email: 'test2@example.com',
            role: 'monitor',
            week_start: '2026-04-26',
            created_at: '2026-04-27T10:00:00Z',
            file_path: '/path/to/report2.pdf',
        },
    ];

    beforeEach(async () => {
        const apiSpy = {
            getReports: vi.fn(),
            generateReports: vi.fn(),
            downloadReport: vi.fn(),
        };

        await TestBed.configureTestingModule({
            imports: [ProfessorReportsComponent, HttpClientTestingModule],
            providers: [{ provide: ProfessorApiService, useValue: apiSpy }],
        }).compileComponents();

        apiService = TestBed.inject(ProfessorApiService) as any;
        fixture = TestBed.createComponent(ProfessorReportsComponent);
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

    it('should load reports on init', () => {
        apiService.getReports.mockReturnValue(of(mockReports));

        component.ngOnInit();

        expect(component.reports()).toEqual(mockReports);
        expect(component.loadingReports()).toBeFalsy();
    });

    it('should handle error when loading reports', () => {
        apiService.getReports.mockReturnValue(throwError(() => new Error('API Error')));

        component.loadReports();

        expect(component.loadingReports()).toBeFalsy();
        expect(component.error()).toBeTruthy();
    });

    it('should change selected week', () => {
        const newWeek = '2026-04-26';
        component.onWeekChange(newWeek);

        expect(component.selectedWeek()).toBe(newWeek);
    });

    it('should generate reports successfully', () => {
        vi.useFakeTimers();
        const mockResponse: ReportQueueResponse = {
            request_id: '1',
            status: 'queued',
            message: 'Report generation queued',
        };

        apiService.generateReports.mockReturnValue(of(mockResponse));
        apiService.getReports.mockReturnValue(of(mockReports));

        component.generate();

        expect(component.generating()).toBeFalsy();
        expect(component.success()).toBeTruthy();

        vi.advanceTimersByTime(2000);

        expect(apiService.getReports).toHaveBeenCalled();
        vi.useRealTimers();
    });

    it('should handle error when generating reports', () => {
        apiService.generateReports.mockReturnValue(throwError(() => new Error('API Error')));

        component.generate();

        expect(component.generating()).toBeFalsy();
        expect(component.error()).toBeTruthy();
    });

    it('should download report', () => {
        const mockBlob = new Blob(['report data']);
        const report = mockReports[0];

        apiService.downloadReport.mockReturnValue(of(mockBlob));

        vi.spyOn(globalThis.URL, 'createObjectURL').mockReturnValue('blob:mock');
        vi.spyOn(globalThis.URL, 'revokeObjectURL').mockImplementation(() => {});

        component.downloadReport(report);

        expect(apiService.downloadReport).toHaveBeenCalledWith(report.id);
        expect(component.downloadingId()).toBeNull();
    });

    it('should handle error when downloading report', () => {
        const report = mockReports[0];
        apiService.downloadReport.mockReturnValue(throwError(() => new Error('Download Error')));

        component.downloadReport(report);

        expect(component.downloadingId()).toBeNull();
        expect(component.error()).toBeTruthy();
    });

    it('should format date correctly', () => {
        const iso = '2026-05-04T10:30:00Z';
        const formatted = component.shortDate(iso);
        expect(formatted).toContain('2026-05-04');
    });

    it('should handle empty date', () => {
        expect(component.shortDate('')).toBe('—');
    });

    it('should set downloading state during download', () => {
        const mockBlob = new Blob(['report data']);
        const report = mockReports[0];

        apiService.downloadReport.mockImplementation(() => {
            component.downloadingId.set(report.id);
            return of(mockBlob);
        });

        vi.spyOn(globalThis.URL, 'createObjectURL').mockReturnValue('blob:mock');
        vi.spyOn(globalThis.URL, 'revokeObjectURL').mockImplementation(() => {});

        component.downloadReport(report);

        expect(component.downloadingId()).toBeNull();
    });

    it('should clear error on generate', () => {
        component.error.set('Previous error');
        const mockResponse: ReportQueueResponse = {
            request_id: '1',
            status: 'queued',
            message: 'Report generation queued',
        };

        apiService.generateReports.mockReturnValue(of(mockResponse));
        apiService.getReports.mockReturnValue(of(mockReports));

        component.generate();

        expect(component.error()).toBeNull();
    });
});
