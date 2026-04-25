import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, OnInit, signal } from '@angular/core';

import { AuthService } from '../../core/services/auth.service';
import { IsoDatePipe } from '../admin/iso-date.pipe';
import type { MonitorTask } from './asistente_monitor.models';
import { AsistenteMonitorService } from './asistente_monitor.service';

@Component({
  selector: 'app-asistente-monitor-tasks',
  imports: [IsoDatePipe],
  templateUrl: './asistente_monitor_tasks.component.html',
})
export class AsistenteMonitorTasksComponent implements OnInit {
  private readonly api = inject(AsistenteMonitorService);
  private readonly auth = inject(AuthService);

  readonly tasks = signal<MonitorTask[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);

  ngOnInit(): void {
    const user = this.auth.getCurrentUser();
    if (user == null) {
      this.loading.set(false);
      this.error.set('No se encontró sesión activa.');
      return;
    }

    this.api.listTasksByUser(user.id).subscribe({
      next: (list) => {
        this.tasks.set(list ?? []);
        this.loading.set(false);
      },
      error: (err: unknown) => {
        this.loading.set(false);
        this.error.set(this.httpErr(err));
      },
    });
  }

  private httpErr(err: unknown): string {
    if (err instanceof HttpErrorResponse) {
      const body = err.error as { error?: string } | undefined;
      return body?.error ?? err.message;
    }
    return 'Error de red';
  }
}
