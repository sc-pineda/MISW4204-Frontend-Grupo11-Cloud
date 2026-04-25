import { Routes } from '@angular/router';

import { adminRoleGuard } from './core/guards/admin-role.guard';
import { assistantMonitorRoleGuard } from './core/guards/assistant-monitor-role.guard';
import { authGuard } from './core/guards/auth.guard';
import { guestGuard } from './core/guards/guest.guard';
import { adminChildRoutes } from './features/admin/admin.routes';
import { AdminShellComponent } from './features/admin/admin-shell.component';
import { asistenteMonitorChildRoutes } from './features/asistente_monitor/asistente_monitor.routes';
import { AsistenteMonitorComponent } from './features/asistente_monitor/asistente_monitor.component';
import { LoginComponent } from './features/auth/login/login.component';
import { PrimerAdminComponent } from './features/auth/primer-admin/primer-admin.component';
import { HomeComponent } from './features/home/home.component';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'home' },
  { path: 'login', canActivate: [guestGuard], component: LoginComponent },
  { path: 'primer-admin', canActivate: [guestGuard], component: PrimerAdminComponent },
  { path: 'home', canActivate: [authGuard], component: HomeComponent },
  {
    path: 'admin',
    canActivate: [authGuard, adminRoleGuard],
    component: AdminShellComponent,
    children: adminChildRoutes,
  },
  {
    path: 'asistente-monitor',
    canActivate: [authGuard, assistantMonitorRoleGuard],
    component: AsistenteMonitorComponent,
    children: asistenteMonitorChildRoutes,
  },
  { path: '**', redirectTo: 'home' },
];
