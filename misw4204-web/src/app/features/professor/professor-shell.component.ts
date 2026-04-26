import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-professor-shell',
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './professor-shell.component.html',
})
export class ProfessorShellComponent {
  readonly auth = inject(AuthService);
}
