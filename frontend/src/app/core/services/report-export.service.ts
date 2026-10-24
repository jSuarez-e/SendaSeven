/**
 * @sdd
 * [Objetivo]: Servicio de generacion y descarga de reportes Excel (.xlsx) estructurados en dos hojas: Por Fecha/Sitio y Por Persona (ReportExportService).
 * [I/O]: Metodo exportRoutesAndAttendees(reports: IRouteDetailReport[]). Genera y descarga archivo binario .xlsx en el navegador.
 * [Edge Cases]: Rutas sin asistentes, usuarios con 1 o 2 rutas registradas, formateo amigable de fechas y nombres de hojas validos en Excel.
 */
import { Injectable } from '@angular/core';
import writeXlsxFile, { type Cell, type CellObject, type Row, type Sheet } from 'write-excel-file/browser';
import { IRouteDetailReport } from '@shared/models/route.interface';

/**
 * Elemento de ruta registrado por una persona para reporte.
 */
interface IPersonRouteItem {
  /** Numero del dia del itinerario. */
  dayNumber: number;
  /** Nombre representativo del sitio o ruta. */
  routeName: string;
  /** Marca temporal ISO de confirmacion. */
  confirmedAt: string;
}

/**
 * Estructura de agrupacion para consolidar los registros por persona en la Hoja 2.
 */
interface IPersonRegistrationSummary {
  /** Documento de identidad del asistente. */
  documentId: string;
  /** Nombre completo del asistente. */
  fullName: string;
  /** Listado de rutas a las que se inscribio. */
  routes: IPersonRouteItem[];
}

/**
 * Servicio encargado de formatear y emitir el archivo Excel (.xlsx) para auditoria administrativa.
 */
@Injectable({
  providedIn: 'root',
})
export class ReportExportService {
  /**
   * Genera y descarga el archivo Excel con el desglose en dos hojas de calculo.
   * @param reports Listado de reportes detallados por ruta.
   * @returns Promesa resuelta tras iniciar la descarga en el navegador.
   */
  async exportRoutesAndAttendees(reports: IRouteDetailReport[]): Promise<void> {
    const sortedReports = [...reports].sort(
      (firstReport, secondReport) => firstReport.dayNumber - secondReport.dayNumber,
    );

    const sheet1Rows = this.buildRouteAndDateSheetRows(sortedReports);
    const sheet2Rows = this.buildPersonSheetRows(sortedReports);

    const sheet1: Sheet<Blob> = {
      sheet: 'Por Fecha y Sitio',
      columns: [
        { width: 12 },
        { width: 24 },
        { width: 12 },
        { width: 14 },
        { width: 18 },
        { width: 18 },
        { width: 32 },
        { width: 24 },
      ],
      data: sheet1Rows,
    };

    const sheet2: Sheet<Blob> = {
      sheet: 'Por Persona',
      columns: [
        { width: 18 },
        { width: 32 },
        { width: 28 },
        { width: 24 },
        { width: 28 },
        { width: 24 },
        { width: 16 },
      ],
      data: sheet2Rows,
    };

    const timestamp = new Date()
      .toISOString()
      .slice(0, 19)
      .replace(/[-:]/g, '')
      .replace('T', '_');

    await writeXlsxFile([sheet1, sheet2]).toFile(
      `Reporte_Inscripciones_SendaSeven_${timestamp}.xlsx`,
    );
  }

  /**
   * Construye las filas de datos para la Hoja 1: Por Fecha y Sitio.
   * @param reports Reportes de rutas ordenados por dia.
   * @returns Matriz de celdas para la primera hoja.
   */
  buildRouteAndDateSheetRows(reports: IRouteDetailReport[]): Row[] {
    const headerRow: CellObject[] = [
      { value: 'Día', fontWeight: 'bold', backgroundColor: '#1A237E', textColor: '#FFFFFF', align: 'center' },
      { value: 'Ruta / Sitio', fontWeight: 'bold', backgroundColor: '#1A237E', textColor: '#FFFFFF', align: 'left' },
      { value: 'Capacidad', fontWeight: 'bold', backgroundColor: '#1A237E', textColor: '#FFFFFF', align: 'center' },
      { value: 'Ocupación', fontWeight: 'bold', backgroundColor: '#1A237E', textColor: '#FFFFFF', align: 'center' },
      { value: 'Estado de Cupo', fontWeight: 'bold', backgroundColor: '#1A237E', textColor: '#FFFFFF', align: 'center' },
      { value: 'Documento Asistente', fontWeight: 'bold', backgroundColor: '#1A237E', textColor: '#FFFFFF', align: 'center' },
      { value: 'Nombre Asistente', fontWeight: 'bold', backgroundColor: '#1A237E', textColor: '#FFFFFF', align: 'left' },
      { value: 'Fecha de Confirmación', fontWeight: 'bold', backgroundColor: '#1A237E', textColor: '#FFFFFF', align: 'center' },
    ];

    const dataRows: Row[] = [];

    for (const report of reports) {
      const isFull = report.occupiedSeats >= report.maxCapacity;
      const statusText = isFull ? 'Cupo Completo' : 'Cupo Disponible';

      if (report.attendees.length === 0) {
        dataRows.push([
          { value: `Día ${report.dayNumber}`, align: 'center' },
          { value: report.name, align: 'left' },
          { value: report.maxCapacity, align: 'center' },
          { value: `${report.occupiedSeats} / ${report.maxCapacity}`, align: 'center' },
          { value: statusText, align: 'center', textColor: '#2E7D32' },
          { value: '(Sin inscritos)', align: 'center', textColor: '#757575' },
          { value: '-', align: 'center', textColor: '#757575' },
          { value: '-', align: 'center', textColor: '#757575' },
        ]);
      } else {
        for (const attendee of report.attendees) {
          dataRows.push([
            { value: `Día ${report.dayNumber}`, align: 'center' },
            { value: report.name, align: 'left' },
            { value: report.maxCapacity, align: 'center' },
            { value: `${report.occupiedSeats} / ${report.maxCapacity}`, align: 'center' },
            { value: statusText, align: 'center', textColor: isFull ? '#C62828' : '#2E7D32' },
            { value: attendee.documentId, align: 'center' },
            { value: attendee.fullName, align: 'left' },
            { value: this.formatIsoDate(attendee.confirmedAt), align: 'center' },
          ]);
        }
      }
    }

    return [headerRow, ...dataRows];
  }

  /**
   * Construye las filas de datos para la Hoja 2: Por Persona.
   * @param reports Reportes de rutas ordenados por dia.
   * @returns Matriz de celdas para la segunda hoja.
   */
  buildPersonSheetRows(reports: IRouteDetailReport[]): Row[] {
    const headerRow: CellObject[] = [
      { value: 'Documento Identidad', fontWeight: 'bold', backgroundColor: '#1A237E', textColor: '#FFFFFF', align: 'center' },
      { value: 'Nombre Completo', fontWeight: 'bold', backgroundColor: '#1A237E', textColor: '#FFFFFF', align: 'left' },
      { value: 'Ruta 1 (Día y Sitio)', fontWeight: 'bold', backgroundColor: '#1A237E', textColor: '#FFFFFF', align: 'left' },
      { value: 'Fecha Registro Ruta 1', fontWeight: 'bold', backgroundColor: '#1A237E', textColor: '#FFFFFF', align: 'center' },
      { value: 'Ruta 2 (Día y Sitio)', fontWeight: 'bold', backgroundColor: '#1A237E', textColor: '#FFFFFF', align: 'left' },
      { value: 'Fecha Registro Ruta 2', fontWeight: 'bold', backgroundColor: '#1A237E', textColor: '#FFFFFF', align: 'center' },
      { value: 'Total Rutas', fontWeight: 'bold', backgroundColor: '#1A237E', textColor: '#FFFFFF', align: 'center' },
    ];

    const sortedPersons = this.groupRegistrationsByPerson(reports);
    const dataRows: Row[] = [];

    if (sortedPersons.length === 0) {
      dataRows.push([
        { value: '(Sin registros de votantes)', align: 'center', textColor: '#757575' },
        { value: '-', align: 'center' },
        { value: '-', align: 'center' },
        { value: '-', align: 'center' },
        { value: '-', align: 'center' },
        { value: '-', align: 'center' },
        { value: 0, align: 'center' },
      ]);
    } else {
      for (const person of sortedPersons) {
        dataRows.push(this.buildPersonRow(person));
      }
    }

    return [headerRow, ...dataRows];
  }

  /**
   * Agrupa las inscripciones de todas las rutas por documento de usuario.
   * @param reports Reportes de rutas turísticas.
   * @returns Arreglo ordenado alfabéticamente por nombre de usuario.
   */
  private groupRegistrationsByPerson(
    reports: IRouteDetailReport[],
  ): IPersonRegistrationSummary[] {
    const personMap = new Map<string, IPersonRegistrationSummary>();

    for (const report of reports) {
      for (const attendee of report.attendees) {
        const routeItem: IPersonRouteItem = {
          dayNumber: report.dayNumber,
          routeName: report.name,
          confirmedAt: attendee.confirmedAt,
        };

        const existingPerson = personMap.get(attendee.documentId);
        if (existingPerson) {
          existingPerson.routes.push(routeItem);
        } else {
          personMap.set(attendee.documentId, {
            documentId: attendee.documentId,
            fullName: attendee.fullName,
            routes: [routeItem],
          });
        }
      }
    }

    return Array.from(personMap.values()).sort(
      (firstPerson, secondPerson) => firstPerson.fullName.localeCompare(secondPerson.fullName),
    );
  }

  /**
   * Construye una fila de celdas para un usuario agrupado.
   * @param person Registro consolidado de la persona.
   * @returns Fila de celdas para la hoja de personas.
   */
  private buildPersonRow(person: IPersonRegistrationSummary): Cell[] {
    const firstRoute = person.routes[0];
    const secondRoute = person.routes[1];

    const firstRouteDesc = firstRoute
      ? `Día ${firstRoute.dayNumber} - ${firstRoute.routeName}`
      : '-';
    const firstRouteDate = firstRoute
      ? this.formatIsoDate(firstRoute.confirmedAt)
      : '-';

    const secondRouteDesc = secondRoute
      ? `Día ${secondRoute.dayNumber} - ${secondRoute.routeName}`
      : 'Pendiente / No seleccionada';
    const secondRouteDate = secondRoute
      ? this.formatIsoDate(secondRoute.confirmedAt)
      : '-';

    return [
      { value: person.documentId, align: 'center' },
      { value: person.fullName, align: 'left' },
      { value: firstRouteDesc, align: 'left' },
      { value: firstRouteDate, align: 'center' },
      { value: secondRouteDesc, align: 'left' },
      { value: secondRouteDate, align: 'center' },
      { value: person.routes.length, align: 'center' },
    ];
  }

  /**
   * Formatea una cadena ISO a una representacion legible de fecha y hora local.
   * @param isoString Cadena ISO de fecha.
   * @returns Fecha formateada en estilo YYYY-MM-DD HH:mm.
   */
  private formatIsoDate(isoString: string): string {
    if (!isoString) {
      return '-';
    }
    const dateObj = new Date(isoString);
    if (isNaN(dateObj.getTime())) {
      return isoString;
    }

    const year = dateObj.getFullYear();
    const month = this.padZero(dateObj.getMonth() + 1);
    const day = this.padZero(dateObj.getDate());
    const hours = this.padZero(dateObj.getHours());
    const minutes = this.padZero(dateObj.getMinutes());

    return `${year}-${month}-${day} ${hours}:${minutes}`;
  }

  /**
   * Rellena con ceros a la izquierda para formateo numerico de fechas.
   * @param numericValue Valor numerico.
   * @returns Cadena con longitud minima de 2 digitos.
   */
  private padZero(numericValue: number): string {
    return numericValue.toString().padStart(2, '0');
  }
}
