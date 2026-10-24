/**
 * @sdd
 * [Objetivo]: Componente raiz de la aplicacion Frontend en Angular Standalone integrando Navbar y RouterOutlet.
 * [I/O - Reusabilidad]: Exporta clase App con inyeccion de VotingStateService y enlace al navbar dumb.
 * [Edge Cases - UI]: OnPush ChangeDetection y renderizado adaptativo.
 */
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from './shared/components/navbar/navbar.component';
import { VotingStateService } from './core/services/voting-state.service';

/**
 * Componente principal de la aplicacion frontend.
 */
@Component({
  selector: 'app-root',
  imports: [RouterOutlet, NavbarComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {
  /** Servicio central de estado reactivo. */
  protected readonly state = inject(VotingStateService);
}
