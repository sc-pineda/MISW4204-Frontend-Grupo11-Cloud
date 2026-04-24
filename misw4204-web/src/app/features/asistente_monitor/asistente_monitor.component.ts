import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-asistente_monitor',
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './asistente_monitor.component.html',
  styleUrl: './asistente_monitor.component.css'
})
export class AsistenteMonitorComponent {
  readonly auth = inject(AuthService);
}
