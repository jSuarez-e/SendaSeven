/**
 * @sdd
 * [Objetivo]: Servicio de autenticacion y verificacion de usuarios preexistentes en censo cerrado (RN-01).
 * [I/O]: validateUserByDocument(documentId) retorna IAuthUserResponse.
 * [Edge Cases]: Rechaza usuarios no existentes (NotFoundException); calcula estado hasVoted.
 */
import {
  Injectable,
  NotFoundException,
  type OnApplicationBootstrap,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity } from '../../entities/user.entity.js';
import { IAuthUserResponse } from '../../../../shared/models/user.interface.js';
import { REQUIRED_VOTES_COUNT } from '../../../../shared/constants/routes.constants.js';

/**
 * Catalogo base de votantes para el censo oficial cerrado.
 */
const INITIAL_CENSUS_VOTERS = [
  { documentId: '1098700001', fullName: 'Andrea Carolina Rojas' },
  { documentId: '1098700002', fullName: 'Daniel Felipe Moreno' },
  { documentId: '1098700003', fullName: 'Valentina Castro Ruiz' },
  { documentId: '1098700004', fullName: 'Juan Camilo Ortiz' },
  { documentId: '1098700005', fullName: 'Maria Paula Hernandez' },
  { documentId: '1098700006', fullName: 'Santiago Andres Gomez' },
  { documentId: '1098700007', fullName: 'Laura Sofia Ramirez' },
  { documentId: '1098700008', fullName: 'Nicolas David Vargas' },
  { documentId: '1098700009', fullName: 'Gabriela Morales Pinto' },
  { documentId: '1098700010', fullName: 'Sebastian Torres Diaz' },
  { documentId: '1098700011', fullName: 'Daniela Romero Silva' },
  { documentId: '1098700012', fullName: 'Alejandro Mendoza Peña' },
  { documentId: '1098700013', fullName: 'Camila Andrea Gil' },
  { documentId: '1098700014', fullName: 'Mateo Alejandro Rios' },
  { documentId: '1098700015', fullName: 'Isabella Sanchez Vega' },
];

/**
 * Servicio de gestion de autenticacion de usuarios precargados.
 */
@Injectable()
export class AuthService implements OnApplicationBootstrap {
  /**
   * Inyeccion de dependencias del repositorio de usuarios.
   * @param usersRepository Repositorio de usuarios registrados.
   */
  constructor(
    @InjectRepository(UserEntity)
    private readonly usersRepository: Repository<UserEntity>,
  ) {}

  /**
   * Gancho de ciclo de vida que asegura el sembrado inicial del censo al levantar el backend.
   * @returns Promesa resuelta tras el sembrado.
   */
  async onApplicationBootstrap(): Promise<void> {
    await this.seedInitialCensus();
  }

  /**
   * Siembra de forma idempotente los votantes iniciales en el censo oficial.
   * @returns Promesa con la cantidad de votantes nuevos agregados.
   */
  async seedInitialCensus(): Promise<number> {
    let createdCount = 0;
    for (const voterItem of INITIAL_CENSUS_VOTERS) {
      const existingUser = await this.usersRepository.findOne({
        where: { documentId: voterItem.documentId },
      });

      if (!existingUser) {
        await this.registerPreloadedUser(
          voterItem.documentId,
          voterItem.fullName,
        );
        createdCount += 1;
      }
    }
    return createdCount;
  }

  /**
   * Valida la existencia de un usuario mediante su documento y retorna su estado de votacion (RN-01).
   * @param documentId Documento de identidad del usuario a verificar.
   * @returns IAuthUserResponse con estado de votos emitidos.
   * @throws NotFoundException Si el usuario no existe en la base de datos precargada.
   */
  async validateUserByDocument(documentId: string): Promise<IAuthUserResponse> {
    const trimmedDocumentId = documentId.trim();

    const user = await this.usersRepository.findOne({
      where: { documentId: trimmedDocumentId },
      relations: { votes: true },
    });

    if (!user) {
      throw new NotFoundException(
        'El documento ingresado no se encuentra registrado en el censo oficial de votantes.',
      );
    }

    const votedRouteIds = (user.votes ?? []).map((vote) => vote.routeId);
    const hasVoted = votedRouteIds.length >= REQUIRED_VOTES_COUNT;

    return {
      id: user.id,
      documentId: user.documentId,
      fullName: user.fullName,
      hasVoted,
      votedRouteIds,
    };
  }

  /**
   * Registra o asegura un usuario para propositos de administracion o pruebas controladas.
   * @param documentId Documento de identidad.
   * @param fullName Nombre completo del usuario.
   * @returns Entidad de usuario persistida.
   */
  async registerPreloadedUser(
    documentId: string,
    fullName: string,
  ): Promise<UserEntity> {
    const existingUser = await this.usersRepository.findOne({
      where: { documentId },
    });

    if (existingUser) {
      return existingUser;
    }

    const newUser = this.usersRepository.create({
      documentId,
      fullName,
    });

    return await this.usersRepository.save(newUser);
  }
}
