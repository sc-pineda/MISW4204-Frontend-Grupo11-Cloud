import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-home',
  imports: [RouterLink],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent {
  private readonly auth = inject(AuthService);

  readonly user = computed(() => this.auth.getCurrentUser());
  readonly isAdmin = computed(() => this.auth.hasRole('administrador'));
  readonly isProfessor = computed(() => this.auth.hasRole('profesor'));
  readonly isMonitor = computed(() => this.auth.hasRole('monitor'));
  readonly isAssistant = computed(() => this.auth.hasRole('asistente_graduado'));

  logout(): void {
    this.auth.logout();
  }
}
