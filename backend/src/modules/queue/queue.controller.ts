/**
 * @sdd
 * [Objetivo]: Controlador REST para la consulta y generacion del orden y sorteo aleatorio controlado de votacion.
 * [I/O]: GET /api/queue retorna IVotingQueueSummary; POST /api/queue/draw ejecuta el sorteo aleatorio y retorna el nuevo resumen.
 * [Edge Cases]: Preservacion de usuarios que ya votaron; barajado criptografico seguro para usuarios pendientes.
 */
import { Controller, Get, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { QueueService } from './queue.service.js';
import { IVotingQueueSummary } from '../../../../shared/models/voting-queue.interface.js';

/**
 * Controlador de exposicion y gestion de la cola y turnos de votacion.
 */
@ApiTags('Queue')
@Controller('api/queue')
export class QueueController {
  /**
   * Inyeccion de dependencias del servicio de cola.
   * @param queueService Servicio de gestion de turnos y sorteo.
   */
  constructor(private readonly queueService: QueueService) {}

  /**
   * Obtiene el estado actual de la cola de votacion y el participante en turno.
   * @returns Resumen de la cola de votacion con metricas y orden de participantes.
   */
  @Get()
  @ApiOperation({
    summary: 'Consultar estado consolidado de la cola de votacion',
    description:
      'Retorna las metricas de participacion, el votante activo en turno y el listado ordenado por turnos.',
  })
  @ApiResponse({
    status: 200,
    description: 'Estado de la cola de votacion obtenido exitosamente.',
  })
  async getQueueSummary(): Promise<IVotingQueueSummary> {
    return await this.queueService.getQueueSummary();
  }

  /**
   * Genera de forma aleatoria y controlada un nuevo sorteo entre los usuarios registrados que no han votado.
   * @returns Nuevo resumen de la cola con el orden sorteado asignado.
   */
  @Post('draw')
  @ApiOperation({
    summary: 'Ejecutar sorteo aleatorio controlado de turnos de votacion',
    description:
      'Baraja aleatoriamente los usuarios registrados sin votos completados, asignando turnos secuenciales.',
  })
  @ApiResponse({
    status: 200,
    description: 'Sorteo generado exitosamente.',
  })
  async generateDraw(): Promise<IVotingQueueSummary> {
    return await this.queueService.generateRandomQueue();
  }
}
