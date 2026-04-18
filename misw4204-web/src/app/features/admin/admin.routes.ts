import { Routes } from '@angular/router';

import { AdminAssignmentsComponent } from './admin-assignments.component';
import { AdminOverviewComponent } from './admin-overview.component';
import { AdminPeriodsComponent } from './admin-periods.component';
import { AdminSpacesComponent } from './admin-spaces.component';
import { AdminTasksComponent } from './admin-tasks.component';
import { AdminUsersComponent } from './admin-users.component';

export const adminChildRoutes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'resumen' },
  { path: 'resumen', component: AdminOverviewComponent },
  { path: 'usuarios', component: AdminUsersComponent },
  { path: 'periodos', component: AdminPeriodsComponent },
  { path: 'espacios', component: AdminSpacesComponent },
  { path: 'vinculaciones', component: AdminAssignmentsComponent },
  { path: 'tareas', component: AdminTasksComponent },
];
