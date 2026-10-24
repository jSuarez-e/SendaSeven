/**
 * @sdd
 * [Objetivo]: Servicio cliente HTTP para comunicacion con la API REST del backend (autenticacion, rutas y votos).
 * [I/O]: Expone login(documentId), getRoutes() y confirmVotes(documentId, routeIds).
 * [Edge Cases]: Manejo de errores de conexion, tipado estricto sin uso de any.
 */
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { IAuthUserResponse } from '@shared/models/user.interface';
import {
  IRouteDetailReport,
  IRoutePublicSummary,
} from '@shared/models/route.interface';
import {
  IVoteConfirmationResponse,
  IVoteSubmissionPayload,
} from '@shared/models/vote.interface';
import { IVotingQueueSummary } from '@shared/models/voting-queue.interface';
import { environment } from '../../../environments/environment';

/**
 * Servicio de integracion HTTP con los endpoints del backend.
 */
@Injectable({
  providedIn: 'root',
})
export class ApiService {
  /** Cliente HTTP inyectado. */
  private readonly httpClient = inject(HttpClient);

  /** URL base para la comunicacion con la API REST. */
  private readonly baseUrl = environment.apiUrl;

  /**
   * Autentica al usuario mediante su documento pre-cargado.
   * @param documentId Documento de identidad del usuario.
   * @returns Observable con IAuthUserResponse.
   */
  login(documentId: string): Observable<IAuthUserResponse> {
    return this.httpClient.post<IAuthUserResponse>(`${this.baseUrl}/auth/login`, {
      documentId,
    });
  }

  /**
   * Consulta el catalogo de rutas con la disponibilidad agregada anonima.
   * @returns Observable con el listado de IRoutePublicSummary.
   */
  getRoutes(): Observable<IRoutePublicSummary[]> {
    return this.httpClient.get<IRoutePublicSummary[]>(`${this.baseUrl}/routes`);
  }

  /**
   * Envia el lote atomico de 2 votos para confirmacion transaccional.
   * @param documentId Documento de identidad del votante.
   * @param routeIds Tupla de exactamente 2 IDs de ruta seleccionadas.
   * @returns Observable con IVoteConfirmationResponse.
   */
  confirmVotes(
    documentId: string,
    routeIds: [number, number],
  ): Observable<IVoteConfirmationResponse> {
    const payload: IVoteSubmissionPayload = {
      documentId,
      routeIds,
    };
    return this.httpClient.post<IVoteConfirmationResponse>(
      `${this.baseUrl}/votes`,
      payload,
    );
  }

  /**
   * Consulta el reporte detallado de personas inscritas a una ruta (exclusivo para administradores autorizados).
   * @param routeId Identificador de la ruta.
   * @param documentId Documento del usuario para validacion de lista blanca.
   * @returns Observable con IRouteDetailReport.
   */
  getRouteAttendees(
    routeId: number,
    documentId?: string,
  ): Observable<IRouteDetailReport> {
    const params = documentId ? `?documentId=${encodeURIComponent(documentId)}` : '';
    return this.httpClient.get<IRouteDetailReport>(
      `${this.baseUrl}/routes/${routeId}/attendees${params}`,
    );
  }

  /**
   * Consulta el estado general de la cola y orden de turnos para votacion.
   * @returns Observable con IVotingQueueSummary.
   */
  getQueueSummary(): Observable<IVotingQueueSummary> {
    return this.httpClient.get<IVotingQueueSummary>(`${this.baseUrl}/queue`);
  }

  /**
   * Solicita la generacion de un nuevo sorteo aleatorio entre los usuarios pendientes.
   * @returns Observable con el nuevo IVotingQueueSummary.
   */
  generateDraw(): Observable<IVotingQueueSummary> {
    return this.httpClient.post<IVotingQueueSummary>(
      `${this.baseUrl}/queue/draw`,
      {},
    );
  }
}
