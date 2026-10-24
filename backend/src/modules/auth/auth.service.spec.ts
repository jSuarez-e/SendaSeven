/**
 * @sdd
 * [Objetivo]: Pruebas unitarias para AuthService validando la consulta de usuarios precargados (RN-01).
 * [I/O]: Simula UserEntity en repositorio TypeORM y evalua IAuthUserResponse.
 * [Edge Cases]: Usuario no encontrado (NotFoundException), evaluacion de hasVoted segun cantidad de votos previos.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { AuthService } from './auth.service.js';
import { UserEntity } from '../../entities/user.entity.js';

describe('AuthService', () => {
  let authService: AuthService;
  let mockUsersRepository: Record<string, ReturnType<typeof vi.fn>>;

  beforeEach(() => {
    mockUsersRepository = {
      findOne: vi.fn(),
      create: vi.fn((payload) => payload),
      save: vi.fn((payload) => Promise.resolve(payload)),
    };

    authService = new AuthService(
      mockUsersRepository as unknown as Repository<UserEntity>,
    );
  });

  it('debe lanzar NotFoundException si el usuario no existe en la base de datos (RN-01)', async () => {
    mockUsersRepository['findOne'].mockResolvedValue(null);

    await expect(
      authService.validateUserByDocument('00000000'),
    ).rejects.toThrow(NotFoundException);
  });

  it('debe retornar hasVoted=false si el usuario no tiene votos previos', async () => {
    mockUsersRepository['findOne'].mockResolvedValue({
      id: 'uuid-1',
      documentId: '1098765432',
      fullName: 'Carlos Santana',
      votes: [],
    });

    const response = await authService.validateUserByDocument('1098765432');

    expect(response.documentId).toBe('1098765432');
    expect(response.hasVoted).toBe(false);
    expect(response.votedRouteIds).toHaveLength(0);
  });

  it('debe retornar hasVoted=true si el usuario ya tiene 2 votos registrados', async () => {
    mockUsersRepository['findOne'].mockResolvedValue({
      id: 'uuid-1',
      documentId: '1098765432',
      fullName: 'Carlos Santana',
      votes: [{ routeId: 1 }, { routeId: 2 }],
    });

    const response = await authService.validateUserByDocument('1098765432');

    expect(response.hasVoted).toBe(true);
    expect(response.votedRouteIds).toEqual([1, 2]);
  });
});
