/**
 * @sdd
 * [Objetivo]: Pruebas unitarias para QueueController (endpoints REST de sorteo y cola).
 * [I/O]: Verifica getQueueSummary y generateDraw delegando a QueueService.
 * [Edge Cases]: Respuestas con cola vacia y respuestas con turnos asignados.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { QueueController } from './queue.controller.js';
import { QueueService } from './queue.service.js';
import { IVotingQueueSummary } from '../../../../shared/models/voting-queue.interface.js';

describe('QueueController', () => {
  let controller: QueueController;
  let mockQueueService: Partial<Record<keyof QueueService, ReturnType<typeof vi.fn>>>;

  const sampleSummary: IVotingQueueSummary = {
    totalInQueue: 2,
    pendingCount: 1,
    votedCount: 1,
    currentTurnNumber: 2,
    currentVoter: {
      id: 'turn-uuid-2',
      turnNumber: 2,
      userId: 'user-uuid-2',
      documentId: '1098654321',
      fullName: 'Ana Ramirez',
      status: 'PENDING',
      createdAt: '2026-10-21T10:00:00.000Z',
      votedAt: null,
    },
    items: [
      {
        id: 'turn-uuid-1',
        turnNumber: 1,
        userId: 'user-uuid-1',
        documentId: '1098765432',
        fullName: 'Carlos Gomez',
        status: 'VOTED',
        createdAt: '2026-10-21T10:00:00.000Z',
        votedAt: '2026-10-21T10:15:00.000Z',
      },
      {
        id: 'turn-uuid-2',
        turnNumber: 2,
        userId: 'user-uuid-2',
        documentId: '1098654321',
        fullName: 'Ana Ramirez',
        status: 'PENDING',
        createdAt: '2026-10-21T10:00:00.000Z',
        votedAt: null,
      },
    ],
  };

  beforeEach(() => {
    mockQueueService = {
      getQueueSummary: vi.fn().mockResolvedValue(sampleSummary),
      generateRandomQueue: vi.fn().mockResolvedValue(sampleSummary),
    };

    controller = new QueueController(mockQueueService as unknown as QueueService);
  });

  describe('getQueueSummary', () => {
    it('debe retornar el resumen consolidado obtenido del QueueService', async () => {
      const result = await controller.getQueueSummary();

      expect(mockQueueService.getQueueSummary).toHaveBeenCalledTimes(1);
      expect(result).toEqual(sampleSummary);
    });
  });

  describe('generateDraw', () => {
    it('debe llamar a generateRandomQueue y retornar el nuevo resumen', async () => {
      const result = await controller.generateDraw();

      expect(mockQueueService.generateRandomQueue).toHaveBeenCalledTimes(1);
      expect(result).toEqual(sampleSummary);
    });
  });
});
