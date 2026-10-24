/**
 * @sdd
 * [Objetivo]: Pruebas unitarias para ReportExportService validando la generacion correcta de las dos hojas de calculo de Excel.
 * [I/O]: Evalua buildRouteAndDateSheetRows, buildPersonSheetRows y exportRoutesAndAttendees con datos simulados de rutas.
 * [Edge Cases]: Agrupacion por documento de las dos rutas de un usuario, rutas con cupo lleno y rutas vacias sin inscritos.
 */
import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ReportExportService } from './report-export.service';
import { IRouteDetailReport } from '@shared/models/route.interface';

const mockToFile = vi.fn().mockResolvedValue(undefined);

// Mock del modulo write-excel-file/browser para evitar descargas en entorno de prueba
vi.mock('write-excel-file/browser', () => ({
  default: vi.fn().mockReturnValue({
    toFile: mockToFile,
  }),
}));

import writeXlsxFile, { type Sheet } from 'write-excel-file/browser';

describe('ReportExportService', () => {
  let service: ReportExportService;

  const sampleReports: IRouteDetailReport[] = [
    {
      routeId: 1,
      slug: 'giron',
      name: 'Girón',
      dayNumber: 4,
      maxCapacity: 7,
      occupiedSeats: 1,
      attendees: [
        {
          documentId: '1098633123',
          fullName: 'Carlos Santana',
          confirmedAt: '2026-10-21T14:00:00.000Z',
        },
      ],
    },
    {
      routeId: 2,
      slug: 'piedecuesta',
      name: 'Piedecuesta',
      dayNumber: 5,
      maxCapacity: 7,
      occupiedSeats: 0,
      attendees: [],
    },
    {
      routeId: 4,
      slug: 'villanueva',
      name: 'Villanueva',
      dayNumber: 7,
      maxCapacity: 7,
      occupiedSeats: 1,
      attendees: [
        {
          documentId: '1098633123',
          fullName: 'Carlos Santana',
          confirmedAt: '2026-10-21T14:00:00.000Z',
        },
      ],
    },
  ];

  /**
   * Interfaz auxiliar para inspeccion de celdas con valor en pruebas.
   */
  interface ICellWithValue {
    /** Valor asignado a la celda. */
    value: unknown;
  }

  /**
   * Helper para extraer el valor de una celda tipada CellObject o primitivo.
   * @param cell Objeto de celda o valor directo.
   * @returns Valor primitivo de la celda.
   */
  const getCellValue = (cell: unknown): unknown => {
    if (cell && typeof cell === 'object' && 'value' in cell) {
      return (cell as ICellWithValue).value;
    }
    return cell;
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockToFile.mockResolvedValue(undefined);
    vi.mocked(writeXlsxFile).mockReturnValue({
      toFile: mockToFile,
    } as unknown as ReturnType<typeof writeXlsxFile>);

    TestBed.configureTestingModule({
      providers: [ReportExportService],
    });
    service = TestBed.inject(ReportExportService);
  });

  it('debe estructurar correctamente la Hoja 1 (Por Fecha y Sitio) incluyendo rutas con y sin inscritos', () => {
    const rows = service.buildRouteAndDateSheetRows(sampleReports);

    // Fila 0 es el encabezado
    expect(getCellValue(rows[0][0])).toBe('Día');
    expect(getCellValue(rows[0][1])).toBe('Ruta / Sitio');

    // Fila 1: Girón con Carlos Santana
    expect(getCellValue(rows[1][0])).toBe('Día 4');
    expect(getCellValue(rows[1][1])).toBe('Girón');
    expect(getCellValue(rows[1][5])).toBe('1098633123');
    expect(getCellValue(rows[1][6])).toBe('Carlos Santana');

    // Fila 2: Piedecuesta (sin inscritos)
    expect(getCellValue(rows[2][0])).toBe('Día 5');
    expect(getCellValue(rows[2][1])).toBe('Piedecuesta');
    expect(getCellValue(rows[2][5])).toBe('(Sin inscritos)');
  });

  it('debe estructurar correctamente la Hoja 2 (Por Persona) consolidando las dos rutas por documento', () => {
    const rows = service.buildPersonSheetRows(sampleReports);

    // Fila 0 es el encabezado
    expect(getCellValue(rows[0][0])).toBe('Documento Identidad');
    expect(getCellValue(rows[0][1])).toBe('Nombre Completo');
    expect(getCellValue(rows[0][2])).toBe('Ruta 1 (Día y Sitio)');
    expect(getCellValue(rows[0][4])).toBe('Ruta 2 (Día y Sitio)');

    // Carlos Santana voto en 2 rutas: Girón (Día 4) y Villanueva (Día 7)
    expect(rows.length).toBe(2); // Header + 1 persona
    const personRow = rows[1];
    expect(getCellValue(personRow[0])).toBe('1098633123');
    expect(getCellValue(personRow[1])).toBe('Carlos Santana');
    expect(getCellValue(personRow[2])).toBe('Día 4 - Girón');
    expect(getCellValue(personRow[4])).toBe('Día 7 - Villanueva');
    expect(getCellValue(personRow[6])).toBe(2); // Total rutas
  });

  it('debe llamar a writeXlsxFile con las dos hojas y toFile con nombre descriptivo', async () => {
    await service.exportRoutesAndAttendees(sampleReports);

    expect(writeXlsxFile).toHaveBeenCalledTimes(1);
    const callArgs = vi.mocked(writeXlsxFile).mock.calls[0];
    const sheets = callArgs[0] as Sheet<Blob>[];

    expect(sheets).toHaveLength(2);
    expect(sheets[0].sheet).toBe('Por Fecha y Sitio');
    expect(sheets[1].sheet).toBe('Por Persona');

    expect(mockToFile).toHaveBeenCalledTimes(1);
    const fileNameArg = mockToFile.mock.calls[0][0] as string;
    expect(fileNameArg).toContain('Reporte_Inscripciones_SendaSeven_');
    expect(fileNameArg).toContain('.xlsx');
  });
});
