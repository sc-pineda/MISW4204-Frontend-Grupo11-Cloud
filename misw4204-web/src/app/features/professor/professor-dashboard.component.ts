import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';

import type { DashboardRow, ProfessorAssignment, ProfessorTask, ReportStatus } from './professor.models';
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
  selector: 'app-professor-dashboard',
  imports: [RouterLink],
  templateUrl: './professor-dashboard.component.html',
})
export class ProfessorDashboardComponent implements OnInit {
  private readonly api = inject(ProfessorApiService);

  readonly weekOptions = buildWeekOptions();
  readonly selectedWeek = signal(buildWeekOptions()[0].value);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);

  private readonly assignments = signal<ProfessorAssignment[]>([]);
  private readonly spaces = signal<import('./professor.models').ProfessorSpace[]>([]);
  private readonly tasks = signal<ProfessorTask[]>([]);

  readonly rows = computed<DashboardRow[]>(() => {
    const assignments = this.assignments();
    const spaces = this.spaces();
    const tasks = this.tasks();
    const week = this.selectedWeek();

    return assignments.map((a) => {
      const space = spaces.find((s) => s.ID === a.AcademicSpaceID);
      const weekTasks = tasks.filter((t) => t.assignment_id === a.ID && t.week_start === week);
      const weekHours = weekTasks.reduce((sum, t) => sum + t.time_invested, 0);
      let reportStatus: ReportStatus = 'no_report';
      if (weekTasks.length > 0) {
        reportStatus = weekTasks.some((t) => t.is_late) ? 'late' : 'reported';
      }
      return {
        userId: a.UserID,
        userName: a.UserName,
        userEmail: a.UserEmail,
        assignmentId: a.ID,
        spaceName: space?.Name ?? `Espacio #${a.AcademicSpaceID}`,
        spaceType: space?.Type ?? '',
        role: a.RoleInAssignment,
        contractedHours: a.ContractedHoursPerWeek,
        weekHours,
        reportStatus,
        taskCount: weekTasks.length,
      };
    });
  });

  readonly totalReported = computed(() => this.rows().filter((r) => r.reportStatus === 'reported').length);
  readonly totalLate = computed(() => this.rows().filter((r) => r.reportStatus === 'late').length);
  readonly totalNoReport = computed(() => this.rows().filter((r) => r.reportStatus === 'no_report').length);

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    forkJoin({
      assignments: this.api.getAssignments(),
      spaces: this.api.getSpaces(),
      tasks: this.api.getTasksByWeek(this.selectedWeek()),
    }).subscribe({
      next: ({ assignments, spaces, tasks }) => {
        this.assignments.set(assignments ?? []);
        this.spaces.set(spaces ?? []);
        this.tasks.set(tasks ?? []);
        this.loading.set(false);
      },
      error: (err: unknown) => {
        this.loading.set(false);
        this.error.set(this.httpErr(err));
      },
    });
  }

  onWeekChange(value: string): void {
    this.selectedWeek.set(value);
    this.load();
  }

  roleLabel(role: string): string {
    return role === 'monitor' ? 'Monitor' : 'Asist. Graduado';
  }

  private httpErr(err: unknown): string {
    if (err instanceof HttpErrorResponse) {
      const body = err.error as { error?: string } | undefined;
      return body?.error ?? err.message;
    }
    return 'Error de red';
  }
}
