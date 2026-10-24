/**
 * @sdd
 * [Objetivo]: DTO de validacion para la confirmacion transaccional del lote de 2 votos (RN-04).
 * [I/O]: documentId y routeIds (arreglo de exactamente 2 enteros positivos).
 * [Edge Cases]: Rechaza arreglos con menos o mas de 2 elementos, o valores no numericos.
 */
import { ApiProperty } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsInt,
  IsNotEmpty,
  IsPositive,
  IsString,
  MaxLength,
} from 'class-validator';
import { IVoteSubmissionPayload } from '../../../../../shared/models/vote.interface.js';

/**
 * Objeto de transferencia para envio de votacion.
 */
export class SubmitVoteDto implements IVoteSubmissionPayload {
  /**
   * Documento de identidad del usuario votante.
   * @example "1098765432"
   */
  @ApiProperty({
    description: 'Documento de identidad unico del votante',
    example: '1098765432',
    maxLength: 30,
  })
  @IsString({ message: 'El documentId debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'El documentId no puede estar vacio' })
  @MaxLength(30, { message: 'El documentId no puede exceder 30 caracteres' })
  documentId: string;

  /**
   * Arreglo con exactamente dos IDs de rutas seleccionadas.
   * @example [1, 5]
   */
  @ApiProperty({
    description: 'Tupla de exactamente 2 IDs numericos de rutas distintas',
    example: [1, 5],
    type: [Number],
  })
  @IsArray({ message: 'routeIds debe ser un arreglo de identificadores' })
  @ArrayMinSize(2, { message: 'Debe seleccionar exactamente 2 rutas' })
  @ArrayMaxSize(2, { message: 'No puede seleccionar mas de 2 rutas' })
  @IsInt({ each: true, message: 'Cada ID de ruta debe ser un numero entero' })
  @IsPositive({ each: true, message: 'Cada ID de ruta debe ser un entero positivo' })
  routeIds: [number, number];
}
