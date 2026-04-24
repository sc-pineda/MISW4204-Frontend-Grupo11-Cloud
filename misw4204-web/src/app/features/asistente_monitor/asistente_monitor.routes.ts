import { Routes } from '@angular/router';

import { AsistenteMonitorAssignmentsComponent } from './asistente_monitor_assignments.component';
import { AsistenteMonitorCreateTaskComponent } from './asistente_monitor_create_task.component';
import { AsistenteMonitorTasksComponent } from './asistente_monitor_tasks.component';

export const asistenteMonitorChildRoutes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'vinculaciones' },
  { path: 'vinculaciones', component: AsistenteMonitorAssignmentsComponent },
  { path: 'tareas', component: AsistenteMonitorTasksComponent },
  { path: 'nueva-tarea', component: AsistenteMonitorCreateTaskComponent },
];
