/**
 * @sdd
 * [Objetivo]: Pruebas unitarias para el componente raiz App.
 * [I/O]: Configura TestBed con provideRouter y provideHttpClient y verifica la instanciacion correcta.
 * [Edge Cases]: Renderizado inicial del layout con Navbar y RouterOutlet.
 */
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { App } from './app.component';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideAnimationsAsync(),
      ],
    }).compileComponents();
  });

  it('debe crear exitosamente el componente raiz de la aplicacion', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });
});
