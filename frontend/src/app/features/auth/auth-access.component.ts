/**
 * @sdd
 * [Objetivo]: Vista inteligente de acceso para validar documento pre-cargado de votante (AuthAccessComponent).
 * [I/O]: Captura documentId del usuario, interactua con VotingStateService.login() y navega a /votar.
 * [Edge Cases]: Documento vacio, no registrado en censo (404), o estados de error de red.
 */
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { RouterLink } from '@angular/router';
import { VotingStateService } from '../../core/services/voting-state.service';

/**
 * Componente de vista para el acceso por documento.
 */
@Component({
  selector: 'app-auth-access',
  imports: [
    FormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    RouterLink,
  ],
  templateUrl: './auth-access.component.html',
  styleUrl: './auth-access.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuthAccessComponent {
  /** Servicio de estado de votacion inyectado. */
  protected readonly state = inject(VotingStateService);

  /** Documento de identidad enlazado al campo de entrada. */
  protected readonly documentIdInput = signal<string>('');

  /**
   * Ejecuta el inicio de sesion por documento.
   */
  async onSubmit(): Promise<void> {
    const doc = this.documentIdInput().trim();
    if (doc.length > 0) {
      await this.state.login(doc);
    }
  }
}
