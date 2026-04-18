import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, OnInit, signal } from '@angular/core';

import type { OverviewTask } from './admin.models';
import { AdminApiService } from './admin-api.service';
import { IsoDatePipe } from './iso-date.pipe';

@Component({
  selector: 'app-admin-tasks',
  imports: [IsoDatePipe],
  templateUrl: './admin-tasks.component.html',
})
export class AdminTasksComponent implements OnInit {
  private readonly api = inject(AdminApiService);

  readonly tasks = signal<OverviewTask[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);

  ngOnInit(): void {
    this.api.listTasks().subscribe({
      next: (list) => {
        this.tasks.set(list ?? []);
        this.loading.set(false);
      },
      error: (err: unknown) => {
        this.loading.set(false);
        this.error.set(
          err instanceof HttpErrorResponse ? (err.error as { error?: string })?.error ?? err.message : 'Error',
        );
      },
    });
  }
}
