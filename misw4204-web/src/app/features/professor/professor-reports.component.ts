import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, OnInit, signal } from '@angular/core';

import type { PdfReport } from './professor.models';
import { ProfessorApiService } from './professor-api.service';

function getMondayOf(date: Date): Date {
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const monday = new Date(date);
  monday.setDate(date.getDate() + diff);
  return monday;
}

function toIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function buildWeekOptions(count = 6): { label: string; value: string }[] {
  const options: { label: string; value: string }[] = [];
  const today = new Date();
  let monday = getMondayOf(today);
  for (let i = 0; i < count; i++) {
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    options.push({
      value: toIsoDate(monday),
      label: `${toIsoDate(monday)} — ${toIsoDate(sunday)}${i === 0 ? ' (semana actual)' : ''}`,
    });
    monday = new Date(monday);
    monday.setDate(monday.getDate() - 7);
  }
  return options;
}

@Component({
  selector: 'app-professor-reports',
  imports: [],
  templateUrl: './professor-reports.component.html',
})
export class ProfessorReportsComponent implements OnInit {
  private readonly api = inject(ProfessorApiService);

  readonly weekOptions = buildWeekOptions();
  readonly selectedWeek = signal(buildWeekOptions()[0].value);
  readonly loadingReports = signal(true);
  readonly generating = signal(false);
  readonly downloadingId = signal<number | null>(null);
  readonly reports = signal<PdfReport[]>([]);
  readonly error = signal<string | null>(null);
  readonly success = signal<string | null>(null);

  ngOnInit(): void {
    this.loadReports();
  }

  loadReports(): void {
    this.loadingReports.set(true);
    this.api.getReports().subscribe({
      next: (list) => {
        this.reports.set(list ?? []);
        this.loadingReports.set(false);
      },
      error: (err: unknown) => {
        this.loadingReports.set(false);
        this.error.set(this.httpErr(err));
      },
    });
  }

  private pollReports(attempt = 1): void {
    const maxAttempts = 3;
    const delayMs = 2000;

    this.api.getReports().subscribe({
      next: (list) => {
        this.reports.set(list ?? []);
        this.loadingReports.set(false);
        if (attempt < maxAttempts) {
          setTimeout(() => this.pollReports(attempt + 1), delayMs);
        }
      },
      error: (err: unknown) => {
        this.loadingReports.set(false);
        this.error.set(this.httpErr(err));
      },
    });
  }

  onWeekChange(value: string): void {
    this.selectedWeek.set(value);
  }

  generate(): void {
    this.generating.set(true);
    this.error.set(null);
    this.success.set(null);
    this.api.generateReports(this.selectedWeek()).subscribe({
      next: () => {
        this.generating.set(false);
        this.success.set('Solicitud encolada correctamente. La generación puede tardar unos segundos.');
        // Realiza un polling corto para reflejar reportes recién generados.
        this.loadingReports.set(true);
        setTimeout(() => this.pollReports(), 2000);
      },
      error: (err: unknown) => {
        this.generating.set(false);
        this.error.set(this.httpErr(err));
      },
    });
  }

  downloadReport(report: PdfReport): void {
    this.downloadingId.set(report.id);
    this.api.downloadReport(report.id).subscribe({
      next: (blob: Blob) => {
        this.downloadingId.set(null);
        const url = globalThis.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `reporte_${report.id}.pdf`;
        link.click();
        globalThis.URL.revokeObjectURL(url);
      },
      error: (err: unknown) => {
        this.downloadingId.set(null);
        this.error.set(this.httpErr(err));
      },
    });
  }

  shortDate(iso: string): string {
    return iso?.slice(0, 16).replace('T', ' ') ?? '—';
  }

  private httpErr(err: unknown): string {
    if (err instanceof HttpErrorResponse) {
      const body = err.error as { error?: string } | undefined;
      return body?.error ?? err.message;
    }
    return 'Error de red';
  }
}
