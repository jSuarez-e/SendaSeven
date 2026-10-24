/**
 * @sdd
 * [Objetivo]: Controlador REST para la autenticacion de usuarios mediante identificador preexistente (RN-01).
 * [I/O]: POST /api/auth/login con LoginDto retorna IAuthUserResponse.
 * [Edge Cases]: Cero auto-registro publico; usuarios desconocidos reciben 404.
 */
import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service.js';
import { LoginDto } from './dto/login.dto.js';
import { IAuthUserResponse } from '../../../../shared/models/user.interface.js';

/**
 * Controlador de autenticacion.
 */
@ApiTags('Auth')
@Controller('api/auth')
export class AuthController {
  /**
   * Inyeccion de dependencias.
   * @param authService Servicio de autenticacion.
   */
  constructor(private readonly authService: AuthService) {}

  /**
   * Autentica a un usuario verificando su identificador en el censo precargado (RN-01).
   * @param loginDto DTO con el documentId del usuario.
   * @returns Datos basicos del usuario y estado de votacion.
   */
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Autenticar usuario precargado por documento de identidad',
    description: 'Valida la existencia del documento en la tabla users y retorna si ya ha votado (RN-01).',
  })
  @ApiResponse({
    status: 200,
    description: 'Usuario validado exitosamente.',
  })
  @ApiResponse({
    status: 404,
    description: 'Documento no registrado en el censo.',
  })
  async login(@Body() loginDto: LoginDto): Promise<IAuthUserResponse> {
    return await this.authService.validateUserByDocument(loginDto.documentId);
  }
}
