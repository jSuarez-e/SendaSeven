/**
 * @sdd
 * [Objetivo]: Componente modal dumb/presentacional para visualizar el reporte detallado de personas inscritas por ruta turística (RouteAttendeesDialogComponent).
 * [I/O - Reusabilidad]: Inyección de datos mediante MAT_DIALOG_DATA (IRouteDetailReport). Cero servicios de dominio inyectados.
 * [Edge Cases - UI]: Lista vacía de asistentes (0 inscritos), formateo amigable de fechas y diseño responsive adaptativo.
 */
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import {
  MAT_DIALOG_DATA,
  MatDialogActions,
  MatDialogContent,
  MatDialogRef,
  MatDialogTitle,
} from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { IRouteDetailReport } from '@shared/models/route.interface';

/**
 * Componente modal presentacional para desplegar los asistentes de una ruta.
 */
@Component({
  selector: 'app-route-attendees-dialog',
  imports: [
    DatePipe,
    MatDialogTitle,
    MatDialogContent,
    MatDialogActions,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
  ],
  templateUrl: './route-attendees-dialog.component.html',
  styleUrl: './route-attendees-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RouteAttendeesDialogComponent {
  /** Reporte detallado de la ruta y sus asistentes inyectado vía MAT_DIALOG_DATA. */
  readonly report = inject<IRouteDetailReport>(MAT_DIALOG_DATA);

  /** Referencia del diálogo para control de cierre. */
  readonly dialogRef = inject(MatDialogRef<RouteAttendeesDialogComponent>);

  /** Columnas desplegadas en la tabla de asistentes. */
  readonly displayedColumns: string[] = ['index', 'documentId', 'fullName', 'confirmedAt'];

  /**
   * Cierra la ventana modal.
   */
  onClose(): void {
    this.dialogRef.close();
  }
}
