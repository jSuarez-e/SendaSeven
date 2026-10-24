/**
 * @sdd
 * [Objetivo]: Vista publica de resultados en vivo y monitoreo agregado de ocupacion de cupos (ResultsDashboardComponent).
 * [I/O]: Consume VotingStateService.routes(); expone el porcentaje de ocupacion y estado por ruta bajo privacidad por diseno (RN-06).
 * [Edge Cases]: Recarga manual de datos, renderizado accesible de barras de progreso y distincion de cupo lleno.
 */
import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog } from '@angular/material/dialog';
import { RouterLink } from '@angular/router';
import { VotingStateService } from '../../core/services/voting-state.service';
import { ReportExportService } from '../../core/services/report-export.service';
import { RouteAttendeesDialogComponent } from '../../shared/components/route-attendees-dialog/route-attendees-dialog.component';
import { IRoutePublicSummary } from '@shared/models/route.interface';

/**
 * Componente de visualizacion publica de resultados en vivo.
 */
@Component({
  selector: 'app-results-dashboard',
  imports: [
    MatCardModule,
    MatProgressBarModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    RouterLink,
  ],
  templateUrl: './results-dashboard.component.html',
  styleUrl: './results-dashboard.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResultsDashboardComponent implements OnInit {
  /** Servicio central de estado reactivo. */
  readonly state = inject(VotingStateService);

  /** Servicio de dialogos modales de Angular Material. */
  private readonly dialog = inject(MatDialog);

  /** Servicio para exportacion de reportes en Excel. */
  private readonly reportExportService = inject(ReportExportService);

  /** Bandera reactiva indicando si una exportacion a Excel esta en proceso. */
  readonly isExporting = signal<boolean>(false);

  /** Total acumulado de cupos ocupados entre todas las 12 rutas. */
  readonly totalOccupied = computed<number>(() => {
    return this.state
      .routes()
      .reduce((sum, route) => sum + route.occupiedSeats, 0);
  });

  /** Total maximo de cupos combinados (12 rutas * 7 = 84). */
  readonly totalCapacity = computed<number>(() => {
    return this.state
      .routes()
      .reduce((sum, route) => sum + route.maxCapacity, 0);
  });

  /**
   * Carga inicial de rutas al montar el componente.
   */
  async ngOnInit(): Promise<void> {
    await this.state.loadRoutes();
  }

  /**
   * Recarga manual de datos en vivo.
   */
  async onRefresh(): Promise<void> {
    await this.state.loadRoutes();
  }

  /**
   * Calcula el porcentaje de ocupacion de una ruta.
   * @param route Objeto IRoutePublicSummary.
   * @returns Porcentaje de 0 a 100.
   */
  calcProgressPercent(route: IRoutePublicSummary): number {
    return Math.min(100, (route.occupiedSeats / route.maxCapacity) * 100);
  }

  /**
   * Abre la ventana modal con el reporte de personas inscritas a una ruta especifica.
   * @param route Ruta seleccionada para la auditoria de inscritos.
   */
  async openAttendeesModal(route: IRoutePublicSummary): Promise<void> {
    if (!this.state.isAdmin()) {
      return;
    }

    const report = await this.state.loadRouteAttendees(route.id);
    if (!report) {
      return;
    }

    this.dialog.open(RouteAttendeesDialogComponent, {
      data: report,
      width: '640px',
      maxWidth: '95vw',
    });
  }

  /**
   * Exporta el consolidado de inscripciones a un libro de Excel (.xlsx) con dos hojas.
   */
  async onExportExcel(): Promise<void> {
    if (!this.state.isAdmin() || this.isExporting()) {
      return;
    }

    this.isExporting.set(true);
    try {
      const allReports = await this.state.loadAllRouteAttendees();
      if (allReports && allReports.length > 0) {
        await this.reportExportService.exportRoutesAndAttendees(allReports);
      }
    } finally {
      this.isExporting.set(false);
    }
  }
}
