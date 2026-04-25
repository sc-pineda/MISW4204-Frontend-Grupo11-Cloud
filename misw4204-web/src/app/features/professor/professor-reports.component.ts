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
  return date.toISOString().split('T')[0];
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

  onWeekChange(value: string): void {
    this.selectedWeek.set(value);
  }

  generate(): void {
    this.generating.set(true);
    this.error.set(null);
    this.success.set(null);
    this.api.generateReports(this.selectedWeek()).subscribe({
      next: (res) => {
        this.generating.set(false);
        this.success.set(res.message ?? 'Proceso iniciado. Los reportes estarán disponibles en breve.');
        this.loadReports();
      },
      error: (err: unknown) => {
        this.generating.set(false);
        this.error.set(this.httpErr(err));
      },
    });
  }

  downloadUrl(report: PdfReport): string {
    return this.api.getReportDownloadUrl(report.id);
  }

  statusLabel(status: string): string {
    const map: Record<string, string> = { ready: 'Listo', pending: 'Procesando', error: 'Error' };
    return map[status] ?? status;
  }

  statusBadgeClass(status: string): string {
    if (status === 'ready') return 'bg-success';
    if (status === 'pending') return 'bg-warning text-dark';
    return 'bg-danger';
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
