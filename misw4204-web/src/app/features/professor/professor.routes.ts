import { Routes } from '@angular/router';

import { ProfessorAssignmentDetailComponent } from './professor-assignment-detail.component';
import { ProfessorDashboardComponent } from './professor-dashboard.component';
import { ProfessorReportsComponent } from './professor-reports.component';
import { ProfessorSpacesComponent } from './professor-spaces.component';
import { ProfessorVinculacionesComponent } from './professor-vinculaciones.component';

export const professorRoutes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  { path: 'dashboard', component: ProfessorDashboardComponent },
  { path: 'espacios', component: ProfessorSpacesComponent },
  { path: 'vinculaciones', component: ProfessorVinculacionesComponent },
  { path: 'assignments/:id', component: ProfessorAssignmentDetailComponent },
  { path: 'reports', component: ProfessorReportsComponent },
];
