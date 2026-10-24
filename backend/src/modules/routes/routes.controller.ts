/**
 * @sdd
 * [Objetivo]: Controlador REST para la consulta publica y anonima de rutas turisticas (RN-02, RN-06).
 * [I/O]: GET /api/routes expone IRoutePublicSummary[].
 * [Edge Cases]: Acceso publico sin requerir autenticacion previa.
 */
import { Controller, Get, Param, ParseIntPipe, Query } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { RoutesService } from './routes.service.js';
import {
  IRouteDetailReport,
  IRoutePublicSummary,
} from '../../../../shared/models/route.interface.js';

/**
 * Controlador de exposicion de rutas turisticas disponibles.
 */
@ApiTags('Routes')
@Controller('api/routes')
export class RoutesController {
  /**
   * Inyeccion de dependencias.
   * @param routesService Servicio de consulta de rutas.
   */
  constructor(private readonly routesService: RoutesService) {}

  /**
   * Endpoint de consulta publica y anonima de las rutas con sus cupos (0 a 7).
   * @returns Listado anonimo de rutas con disponibilidad.
   */
  @Get()
  @ApiOperation({
    summary: 'Consultar catalogo de rutas y disponibilidad anonima de cupos',
    description: 'Retorna el conteo agregado de cupos sin revelar identidades de los votantes (RN-06).',
  })
  @ApiResponse({
    status: 200,
    description: 'Catalogo de rutas obtenido exitosamente.',
  })
  async getRoutes(): Promise<IRoutePublicSummary[]> {
    return await this.routesService.findAllPublicSummaries();
  }

  /**
   * Endpoint protegido para consultar el listado de personas registradas en una ruta.
   * @param id Identificador numerico de la ruta.
   * @param documentId Documento del usuario solicitante para validacion de lista blanca.
   * @returns Reporte de asistentes con nombres y documentos.
   */
  @Get(':id/attendees')
  @ApiOperation({
    summary: 'Consultar personas registradas en una ruta especifica',
    description: 'Requiere que el documentId pertenezca a la lista blanca autorizada.',
  })
  @ApiResponse({
    status: 200,
    description: 'Listado de personas inscritas retornado exitosamente.',
  })
  @ApiResponse({
    status: 403,
    description: 'Acceso no autorizado para este documento.',
  })
  @ApiResponse({
    status: 404,
    description: 'Ruta no encontrada.',
  })
  async getRouteAttendees(
    @Param('id', ParseIntPipe) id: number,
    @Query('documentId') documentId?: string,
  ): Promise<IRouteDetailReport> {
    return await this.routesService.findRouteAttendees(id, documentId);
  }
}
