import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, OnInit, signal } from '@angular/core';

import type { OverviewSpace } from './admin.models';
import { AdminApiService } from './admin-api.service';
import { IsoDatePipe } from './iso-date.pipe';

@Component({
  selector: 'app-admin-spaces',
  imports: [IsoDatePipe],
  templateUrl: './admin-spaces.component.html',
})
export class AdminSpacesComponent implements OnInit {
  private readonly api = inject(AdminApiService);

  readonly spaces = signal<OverviewSpace[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);

  ngOnInit(): void {
    this.api.listSpaces().subscribe({
      next: (list) => {
        this.spaces.set(list ?? []);
        this.loading.set(false);
      },
      error: (err: unknown) => {
        this.loading.set(false);
        this.error.set(err instanceof HttpErrorResponse ? (err.error as { error?: string })?.error ?? err.message : 'Error');
      },
    });
  }
}
