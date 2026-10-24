/**
 * @sdd
 * [Objetivo]: Configuracion de dependencias y proveedores globales de la aplicacion Angular Standalone.
 * [I/O]: Expone appConfig de tipo ApplicationConfig conteniendo enrutamiento, animaciones asincronas, cliente HTTP y listeners de error.
 * [Edge Cases]: Carga asincrona de animaciones para optimizar el First Contentful Paint.
 */
import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideAnimationsAsync(),
    provideHttpClient(withFetch()),
  ],
};
