/**
 * @sdd
 * [Objetivo]: Componente dumb/presentacional de barra de navegacion superior para alternar entre Votar y Resultados.
 * [I/O - Reusabilidad]: Input: currentUser (IAuthUserResponse | null). Output: logout (emite void). No inyecta servicios de dominio.
 * [Edge Cases - UI]: Responsive con flexbox BEM; estados activo y logout condicional.
 */
import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { IAuthUserResponse } from '@shared/models/user.interface';

/**
 * Componente presentacional de barra de navegacion superior.
 */
@Component({
  selector: 'app-navbar',
  imports: [RouterLink, RouterLinkActive, MatToolbarModule, MatButtonModule, MatIconModule],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NavbarComponent {
  /** Usuario actualmente autenticado. */
  readonly currentUser = input<IAuthUserResponse | null>(null);

  /** Evento de solicitud de cierre de sesion. */
  readonly logout = output<void>();

  /** Inicial del nombre del usuario para el avatar. */
  readonly userInitial = computed(() => {
    const user = this.currentUser();
    if (!user || !user.fullName) {
      return '?';
    }
    return user.fullName.trim().charAt(0).toUpperCase();
  });

  /** Primer nombre del usuario para visualización compacta en móvil. */
  readonly userFirstName = computed(() => {
    const user = this.currentUser();
    if (!user || !user.fullName) {
      return '';
    }
    return user.fullName.trim().split(' ')[0];
  });

  /**
   * Dispara el evento de cierre de sesion.
   */
  onLogout(): void {
    this.logout.emit();
  }
}

