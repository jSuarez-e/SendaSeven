/**
 * @sdd
 * [Objetivo]: DTO de validacion para el inicio de sesion y autenticacion por documento (RN-01).
 * [I/O]: documentId como string no vacio con longitud maxima de 30 caracteres.
 * [Edge Cases]: Rechaza payloads vacios o tipos no cadena.
 */
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

/**
 * Objeto de transferencia para inicio de sesion por documento.
 */
export class LoginDto {
  /**
   * Numero de documento de identidad del usuario precargado.
   * @example "1098765432"
   */
  @ApiProperty({
    description: 'Documento de identidad unico del usuario',
    example: '1098765432',
    maxLength: 30,
  })
  @IsString({ message: 'El documentId debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'El documentId no puede estar vacio' })
  @MaxLength(30, { message: 'El documentId no puede exceder 30 caracteres' })
  documentId: string;
}
