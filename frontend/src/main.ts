/**
 * @sdd
 * [Objetivo]: Punto de entrada de la aplicacion Angular Standalone. Inicializa el bootstrap con appConfig y App component.
 * [I/O]: Inicia bootstrapApplication(App, appConfig). Retorna Promise<ApplicationRef>.
 * [Edge Cases]: Captura de excepciones en fase de arranque canalizadas mediante Logger centralizado.
 */
import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app.component';
import { Logger } from './app/core/utils/logger';

bootstrapApplication(App, appConfig)
  .catch((bootstrapError: unknown) => Logger.error(bootstrapError));
