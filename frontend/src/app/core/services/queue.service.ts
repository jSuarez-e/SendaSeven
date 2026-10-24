/**
 * @sdd
 * [Objetivo]: Servicio de estado reactivo basado en Angular Signals para la consulta y control del sorteo de votacion.
 * [I/O]: Expone senales summary, isLoading, error, currentVoter y acciones loadQueue() y generateDraw().
 * [Edge Cases]: Manejo de errores de conexion, sincronizacion con ApiService, estados vacios.
 */
import { Injectable, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ApiService } from './api.service';
import {
  IVotingQueueItem,
  IVotingQueueSummary,
} from '@shared/models/voting-queue.interface';

/**
 * Servicio encargado de la gestion y reactividad del orden de votacion sorteado.
 */
@Injectable({
  providedIn: 'root',
})
export class QueueService {
  /** Cliente de API REST inyectado. */
  private readonly apiService = inject(ApiService);

  /** Senal con el estado consolidado de la cola y sorteo. */
  readonly summary = signal<IVotingQueueSummary | null>(null);

  /** Senal indicadora de carga o sorteo en progreso. */
  readonly isLoading = signal<boolean>(false);

  /** Senal con mensaje de error en caso de fallo de operacion. */
  readonly error = signal<string | null>(null);

  /** Total de participantes en la cola. */
  readonly totalInQueue = computed(() => this.summary()?.totalInQueue ?? 0);

  /** Cantidad de participantes pendientes por votar. */
  readonly pendingCount = computed(() => this.summary()?.pendingCount ?? 0);

  /** Cantidad de participantes que ya completaron su votacion. */
  readonly votedCount = computed(() => this.summary()?.votedCount ?? 0);

  /** Datos del participante en turno actual. */
  readonly currentVoter = computed<IVotingQueueItem | null>(
    () => this.summary()?.currentVoter ?? null,
  );

  /** Numero de turno actualmente activo. */
  readonly currentTurnNumber = computed<number | null>(
    () => this.summary()?.currentTurnNumber ?? null,
  );

  /** Listado completo de turnos asignados en la cola. */
  readonly items = computed<IVotingQueueItem[]>(
    () => this.summary()?.items ?? [],
  );

  /**
   * Carga el estado actual de la cola de votacion desde la API.
   * @returns Promesa que se resuelve al finalizar la carga.
   */
  async loadQueue(): Promise<void> {
    this.isLoading.set(true);
    this.error.set(null);

    try {
      const queueSummary = await firstValueFrom(this.apiService.getQueueSummary());
      this.summary.set(queueSummary);
    } catch (fetchError: unknown) {
      const errorMessage =
        fetchError instanceof Error
          ? fetchError.message
          : 'Error al consultar la cola de votación.';
      this.error.set(errorMessage);
    } finally {
      this.isLoading.set(false);
    }
  }

  /**
   * Ejecuta la solicitud para generar un nuevo sorteo aleatorio controlado entre usuarios pendientes.
   * @returns Promesa que se resuelve tras procesar el sorteo.
   */
  async generateDraw(): Promise<void> {
    this.isLoading.set(true);
    this.error.set(null);

    try {
      const refreshedSummary = await firstValueFrom(this.apiService.generateDraw());
      this.summary.set(refreshedSummary);
    } catch (drawError: unknown) {
      const errorMessage =
        drawError instanceof Error
          ? drawError.message
          : 'Error al ejecutar el sorteo de votación.';
      this.error.set(errorMessage);
    } finally {
      this.isLoading.set(false);
    }
  }
}
