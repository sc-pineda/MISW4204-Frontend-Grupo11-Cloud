import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';

import type { ProfessorAssignment, ProfessorTask } from './professor.models';
import { ProfessorApiService } from './professor-api.service';

interface WeekSummary {
  weekStart: string;
  totalHours: number;
  taskCount: number;
  hasLate: boolean;
  tasks: ProfessorTask[];
}

@Component({
  selector: 'app-professor-assignment-detail',
  imports: [RouterLink],
  templateUrl: './professor-assignment-detail.component.html',
})
export class ProfessorAssignmentDetailComponent implements OnInit {
  private readonly api = inject(ProfessorApiService);
  private readonly route = inject(ActivatedRoute);

  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly assignment = signal<ProfessorAssignment | null>(null);
  readonly tasks = signal<ProfessorTask[]>([]);
  readonly selectedWeek = signal<string | null>(null);

  readonly weekSummaries = computed<WeekSummary[]>(() => {
    const tasks = this.tasks();
    const weeks = [...new Set(tasks.map((t) => t.week_start))].sort((a, b) => b.localeCompare(a));
    return weeks.map((week) => {
      const weekTasks = tasks.filter((t) => t.week_start === week);
      return {
        weekStart: week,
        totalHours: weekTasks.reduce((s, t) => s + t.time_invested, 0),
        taskCount: weekTasks.length,
        hasLate: weekTasks.some((t) => t.is_late),
        tasks: weekTasks,
      };
    });
  });

  readonly selectedWeekTasks = computed<ProfessorTask[]>(() => {
    const week = this.selectedWeek();
    if (!week) return [];
    return this.tasks().filter((t) => t.week_start === week);
  });

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.load(id);
  }

  load(assignmentId: number): void {
    this.loading.set(true);
    this.error.set(null);
    forkJoin({
      assignments: this.api.getAssignments(),
      tasks: this.api.getAssignmentTasks(assignmentId),
    }).subscribe({
      next: ({ assignments, tasks }) => {
        const found = (assignments ?? []).find((a) => a.ID === assignmentId) ?? null;
        this.assignment.set(found);
        this.tasks.set(tasks ?? []);
        const sorted = [...(tasks ?? [])].sort((a, b) => b.week_start.localeCompare(a.week_start));
        this.selectedWeek.set(sorted[0]?.week_start ?? null);
        this.loading.set(false);
      },
      error: (err: unknown) => {
        this.loading.set(false);
        this.error.set(this.httpErr(err));
      },
    });
  }

  selectWeek(week: string): void {
    this.selectedWeek.set(week);
  }

  roleLabel(role: string): string {
    return role === 'monitor' ? 'Monitor' : 'Asistente Graduado';
  }

  private httpErr(err: unknown): string {
    if (err instanceof HttpErrorResponse) {
      const body = err.error as { error?: string } | undefined;
      return body?.error ?? err.message;
    }
    return 'Error de red';
  }
}
