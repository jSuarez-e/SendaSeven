/**
 * @sdd
 * [Objetivo]: Controlador REST para la confirmacion atomica de votos (RN-04).
 * [I/O]: POST /api/votes con SubmitVoteDto retorna IVoteConfirmationResponse.
 * [Edge Cases]: Respuestas HTTP estandarizadas: 200/201 (Exito), 400 (Bad Request), 404 (Not Found), 409 (Conflict).
 */
import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { VotesService } from './votes.service.js';
import { SubmitVoteDto } from './dto/submit-vote.dto.js';
import { IVoteConfirmationResponse } from '../../../../shared/models/vote.interface.js';

/**
 * Controlador de emision de votos.
 */
@ApiTags('Votes')
@Controller('api/votes')
export class VotesController {
  /**
   * Inyeccion de dependencias.
   * @param votesService Servicio transaccional de votos.
   */
  constructor(private readonly votesService: VotesService) {}

  /**
   * Procesa la confirmacion atomica de los 2 votos por usuario (RN-04).
   * @param submitVoteDto Payload con documentId y routeIds.
   * @returns Resultado de la confirmacion de votos.
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Confirmar el lote unico de 2 rutas turisticas seleccionadas',
    description: 'Aplica bloqueo pesimista ordenado para prevenir condiciones de carrera y deadlocks (RN-03, RN-04, RN-05).',
  })
  @ApiResponse({
    status: 201,
    description: 'Votos confirmados y persistidos exitosamente.',
  })
  @ApiResponse({
    status: 400,
    description: 'Rutas duplicadas o exclusion mutua Villanueva / Barichara.',
  })
  @ApiResponse({
    status: 404,
    description: 'Usuario o ruta inexistente.',
  })
  @ApiResponse({
    status: 409,
    description: 'Cupo maximo alcanzado o usuario ya voto previamente.',
  })
  async submitVote(
    @Body() submitVoteDto: SubmitVoteDto,
  ): Promise<IVoteConfirmationResponse> {
    return await this.votesService.confirmVotes(submitVoteDto);
  }
}
