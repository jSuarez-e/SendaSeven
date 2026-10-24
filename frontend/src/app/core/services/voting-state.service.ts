/**
 * @sdd
 * [Objetivo]: Maquina de estados reactiva centralizada para la gestion de sesion, seleccion de rutas y confirmacion transaccional.
 * [I/O]: Expone senales de estado (currentUser, routes, selectedRouteIds, cardViewModels, canConfirm) y acciones (login, toggleRouteSelection, confirmVotes).
 * [Edge Cases]: Evaluacion reactiva inmediata de exclusion mutua Villanueva/Barichara, bloqueo por capacidad (7/7) y limite maximo de 2 selecciones.
 */
import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { ApiService } from './api.service';
import { Logger } from '../utils/logger';
import { IAuthUserResponse } from '@shared/models/user.interface';
import {
  IRouteCardViewModel,
  IRouteDetailReport,
  IRoutePublicSummary,
  RouteVisualStatus,
} from '@shared/models/route.interface';
import { ADMIN_DOCUMENTS_WHITELIST } from '@shared/constants/routes.constants';

/**
 * Servicio central de estado reactivo y logica de presentacion de votaciones.
 */
@Injectable({
  providedIn: 'root',
})
export class VotingStateService {
  /** Servicio cliente HTTP para conexion REST. */
  private readonly apiService = inject(ApiService);

  /** Enrutador para navegacion programatica. */
  private readonly router = inject(Router);

  /** Usuario actualmente autenticado o null. */
  readonly currentUser = signal<IAuthUserResponse | null>(null);

  /** Catalogo publico de rutas turisticas. */
  readonly routes = signal<IRoutePublicSummary[]>([]);

  /** Identificadores de las rutas seleccionadas en borrador. */
  readonly selectedRouteIds = signal<number[]>([]);

  /** Bandera de operacion asincrona en progreso. */
  readonly isLoading = signal<boolean>(false);

  /** Mensaje de error para retroalimentacion al usuario. */
  readonly errorMessage = signal<string | null>(null);

  /** Mensaje de exito para retroalimentacion al usuario. */
  readonly successMessage = signal<string | null>(null);

  /** Indica si hay un usuario autenticado en sesion. */
  readonly isAuthenticated = computed<boolean>(() => this.currentUser() !== null);

  /** Indica si el usuario autenticado ya ha emitido su voto. */
  readonly hasVoted = computed<boolean>(() => this.currentUser()?.hasVoted ?? false);

  /** Determina si el usuario actual posee permisos administrativos para ver asistentes. */
  readonly isAdmin = computed<boolean>(() => {
    const user = this.currentUser();
    if (!user) {
      return false;
    }
    return ADMIN_DOCUMENTS_WHITELIST.includes(user.documentId.trim());
  });

  /** Total de rutas seleccionadas en el borrador actual. */
  readonly selectedCount = computed<number>(() => this.selectedRouteIds().length);

  /** Determina si se cumplen las condiciones para habilitar la confirmacion del voto. */
  readonly canConfirm = computed<boolean>(
    () =>
      this.selectedRouteIds().length === 2 &&
      !this.hasVoted() &&
      !this.isLoading() &&
      this.isAuthenticated(),
  );

  /** Proyeccion de los objetos de ruta actualmente seleccionados en el borrador. */
  readonly selectedRoutes = computed<IRoutePublicSummary[]>(() => {
    const selectedIds = new Set(this.selectedRouteIds());
    return this.routes().filter((route) => selectedIds.has(route.id));
  });

  /**
   * Maquina de estados reactiva que proyecta en tiempo real el modelo de vista para las 12 tarjetas de ruta.
   */
  readonly cardViewModels = computed<IRouteCardViewModel[]>(() => {
    const allRoutes = this.routes();
    const currentVotedIds = new Set(this.currentUser()?.votedRouteIds ?? []);
    const selectedIds = this.selectedRouteIds();
    const selectedSet = new Set(selectedIds);
    const selectedRoutesList = allRoutes.filter((route) => selectedSet.has(route.id));

    return allRoutes.map((route) => {
      // 1. Ya votada por el usuario en esta o anterior sesion
      if (currentVotedIds.has(route.id)) {
        return this.buildCardViewModel(route, 'VOTED_BY_ME', null, null);
      }

      // 2. Seleccionada en borrador (Opcion 1 o 2)
      if (selectedSet.has(route.id)) {
        const index = selectedIds.indexOf(route.id);
        const selectionOrder = (index === 0 ? 1 : 2) as 1 | 2;
        return this.buildCardViewModel(route, 'SELECTED', selectionOrder, null);
      }

      // 3. Cupo lleno (7/7)
      if (route.occupiedSeats >= route.maxCapacity) {
        return this.buildCardViewModel(
          route,
          'LOCKED_FULL',
          null,
          `Cupo Lleno (${route.maxCapacity}/${route.maxCapacity})`,
        );
      }

      // 4. Bloqueada por exclusion mutua Villanueva / Barichara (RN-05)
      if (route.exclusivityGroup !== null) {
        const conflictingSelectedRoute = selectedRoutesList.find(
          (selected) =>
            selected.exclusivityGroup === route.exclusivityGroup &&
            selected.id !== route.id,
        );

        if (conflictingSelectedRoute) {
          return this.buildCardViewModel(
            route,
            'LOCKED_EXCLUSION',
            null,
            `Bloqueada por selección de ${conflictingSelectedRoute.name}`,
          );
        }
      }

      // 5. Limite de 2 selecciones alcanzado
      if (selectedIds.length >= 2) {
        return this.buildCardViewModel(
          route,
          'LOCKED_MAX_SELECTED',
          null,
          'Límite de 2 selecciones alcanzado',
        );
      }

      // 6. Disponible para seleccion
      return this.buildCardViewModel(route, 'AVAILABLE', null, null);
    });
  });

  /**
   * Helper puro para construir la proyeccion de vista IRouteCardViewModel.
   * @param route Ruta base.
   * @param visualStatus Estado visual resuelto.
   * @param selectionOrder Orden 1 o 2.
   * @param exclusionMessage Mensaje de bloqueo.
   * @returns IRouteCardViewModel proyectado.
   */
  private buildCardViewModel(
    route: IRoutePublicSummary,
    visualStatus: RouteVisualStatus,
    selectionOrder: 1 | 2 | null,
    exclusionMessage: string | null,
  ): IRouteCardViewModel {
    return {
      id: route.id,
      slug: route.slug,
      name: route.name,
      dayNumber: route.dayNumber,
      maxCapacity: route.maxCapacity,
      occupiedSeats: route.occupiedSeats,
      availableSeats: route.availableSeats,
      isAvailable: route.isAvailable,
      exclusivityGroup: route.exclusivityGroup,
      visualStatus,
      selectionOrder,
      exclusionMessage,
    };
  }

  /**
   * Inicia sesion validando el documento precargado y navega al tablero de votacion.
   * @param documentId Documento de identidad ingresado.
   * @returns true si la autenticacion fue exitosa.
   */
  async login(documentId: string): Promise<boolean> {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    try {
      const userResponse = await firstValueFrom(
        this.apiService.login(documentId.trim()),
      );
      this.currentUser.set(userResponse);
      await this.loadRoutes();
      this.isLoading.set(false);
      await this.router.navigate(['/votar']);
      return true;
    } catch (loginError: unknown) {
      Logger.error(loginError);
      this.errorMessage.set(
        'El documento ingresado no se encuentra registrado en el censo oficial.',
      );
      this.isLoading.set(false);
      return false;
    }
  }

  /**
   * Cierra la sesion del usuario y limpia las selecciones no confirmadas.
   */
  logout(): void {
    this.currentUser.set(null);
    this.selectedRouteIds.set([]);
    this.errorMessage.set(null);
    this.successMessage.set(null);
    void this.router.navigate(['/acceso']);
  }

  /**
   * Consulta el catalogo actualizado de rutas turisticas.
   */
  async loadRoutes(): Promise<void> {
    try {
      const routesList = await firstValueFrom(this.apiService.getRoutes());
      this.routes.set(routesList);
    } catch (loadError: unknown) {
      Logger.error(loadError);
      this.errorMessage.set('No se pudo cargar el catalogo de rutas.');
    }
  }

  /**
   * Alterna la seleccion de una ruta evaluando las restricciones de negocio.
   * @param routeId Identificador de la ruta a alternar.
   */
  toggleRouteSelection(routeId: number): void {
    if (this.hasVoted() || this.isLoading()) {
      return;
    }

    const currentSelected = this.selectedRouteIds();

    // Si ya esta seleccionada, desmarcarla
    if (currentSelected.includes(routeId)) {
      this.selectedRouteIds.set(
        currentSelected.filter((selectedId) => selectedId !== routeId),
      );
      return;
    }

    // Si ya hay 2 seleccionadas, no permitir mas
    if (currentSelected.length >= 2) {
      return;
    }

    // Verificar si la tarjeta esta bloqueada por alguna regla
    const targetCard = this.cardViewModels().find((card) => card.id === routeId);
    if (!targetCard || targetCard.visualStatus !== 'AVAILABLE') {
      return;
    }

    this.selectedRouteIds.set([...currentSelected, routeId]);
  }

  /**
   * Confirma atómicamente el lote de 2 votos del usuario en el backend.
   * @returns true si los votos fueron persistidos exitosamente.
   */
  async confirmVotes(): Promise<boolean> {
    const user = this.currentUser();
    const selectedIds = this.selectedRouteIds();

    if (!user || selectedIds.length !== 2) {
      return false;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    try {
      const confirmation = await firstValueFrom(
        this.apiService.confirmVotes(user.documentId, [
          selectedIds[0],
          selectedIds[1],
        ]),
      );

      this.currentUser.update((current) =>
        current
          ? {
              ...current,
              hasVoted: true,
              votedRouteIds: confirmation.votedRouteIds,
            }
          : null,
      );

      this.selectedRouteIds.set([]);
      this.successMessage.set('¡Tus 2 rutas han sido confirmadas exitosamente!');
      await this.loadRoutes();
      this.isLoading.set(false);
      return true;
    } catch (voteError: unknown) {
      Logger.error(voteError);
      this.errorMessage.set(
        'Ocurrio un conflicto al confirmar tus rutas. Es posible que los cupos se hayan agotado.',
      );
      await this.loadRoutes();
      this.isLoading.set(false);
      return false;
    }
  }

  /**
   * Obtiene el reporte detallado de asistentes registrados a una ruta especifica (requiere rol admin).
   * @param routeId Identificador de la ruta.
   * @returns Reporte detallado de la ruta con asistentes, o null si falla la autorizacion.
   */
  async loadRouteAttendees(routeId: number): Promise<IRouteDetailReport | null> {
    const user = this.currentUser();
    if (!user || !this.isAdmin()) {
      return null;
    }

    try {
      return await firstValueFrom(
        this.apiService.getRouteAttendees(routeId, user.documentId),
      );
    } catch (attendeesError: unknown) {
      Logger.error(attendeesError);
      return null;
    }
  }

  /**
   * Obtiene el reporte detallado consolidado de todas las rutas turísticas (requiere rol admin).
   * @returns Lista de reportes IRouteDetailReport o null si no está autorizado.
   */
  async loadAllRouteAttendees(): Promise<IRouteDetailReport[] | null> {
    const user = this.currentUser();
    if (!user || !this.isAdmin()) {
      return null;
    }

    try {
      const allRoutes = this.routes();
      return await Promise.all(
        allRoutes.map((route) =>
          firstValueFrom(this.apiService.getRouteAttendees(route.id, user.documentId)),
        ),
      );
    } catch (attendeesError: unknown) {
      Logger.error(attendeesError);
      return null;
    }
  }

  /**
   * Limpia mensajes informativos o de error.
   */
  clearMessages(): void {
    this.errorMessage.set(null);
    this.successMessage.set(null);
  }
}
