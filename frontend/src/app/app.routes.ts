/**
 * @sdd
 * [Objetivo]: Arbol de rutas de navegacion de la SPA Angular conectando las 3 pantallas y el guardia de autenticacion.
 * [I/O]: Exporta routes de tipo Routes para su consumo en appConfig.
 * [Edge Cases]: Proteccion de /votar mediante authGuard; redireccion por defecto y rutas no encontradas.
 */
import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { AuthAccessComponent } from './features/auth/auth-access.component';
import { VotingBoardComponent } from './features/voting/voting-board.component';
import { ResultsDashboardComponent } from './features/results/results-dashboard.component';
import { VotingQueueComponent } from './features/queue/voting-queue.component';

/**
 * Arreglo de rutas del enrutador principal de la aplicacion.
 */
export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'votar',
  },
  {
    path: 'acceso',
    component: AuthAccessComponent,
  },
  {
    path: 'votar',
    canActivate: [authGuard],
    component: VotingBoardComponent,
  },
  {
    path: 'resultados',
    component: ResultsDashboardComponent,
  },
  {
    path: 'sorteo',
    component: VotingQueueComponent,
  },
  {
    path: '**',
    redirectTo: 'acceso',
  },
];
