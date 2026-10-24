/**
 * @sdd
 * [Objetivo]: Guardian funcional de navegacion que protege el acceso al tablero de votacion (/votar) requiriendo sesion activa.
 * [I/O]: CanActivateFn verifica isAuthenticated() en VotingStateService.
 * [Edge Cases]: Redirige a /acceso si el usuario no ha ingresado su documento.
 */
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { VotingStateService } from '../services/voting-state.service';

/**
 * Guardian de ruta que restringe el acceso a usuarios no autenticados.
 * @returns true si el usuario inicio sesion, o redireccion a /acceso.
 */
export const authGuard: CanActivateFn = () => {
  const stateService = inject(VotingStateService);
  const router = inject(Router);

  if (stateService.isAuthenticated()) {
    return true;
  }

  void router.navigate(['/acceso']);
  return false;
};
