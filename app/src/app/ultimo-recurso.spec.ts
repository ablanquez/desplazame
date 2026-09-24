import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { ErrorHandler } from '@angular/core';
import { MARCA_DE_ULTIMO_RECURSO, TEXTO_DE_ULTIMO_RECURSO, UltimoRecurso } from './ultimo-recurso';

/**
 * ⭐ LA PANTALLA DE ÚLTIMO RECURSO, DISPARADA (B-3, 24/09).
 *
 * ── Por qué esta suite ES el hallazgo, y no solo su arreglo ─────────────────
 *
 * Lo que la auditoría reportó no fue «la pantalla está mal»: fue que **no se
 * encontró forma de disparar ninguna**. No había `ErrorHandler` propio ni ruta
 * de error, así que un fallo de arranque dejaba la misma página en blanco que
 * no tener JavaScript, y no había nada que probar. Estas juezas existen para
 * que eso deje de ser verdad: la pantalla se dispara aquí, de verdad, y se
 * compra la frase que sale.
 *
 * ⚠️ Y la juez 3 es la que impide que el remedio sea peor que la enfermedad:
 *    `ErrorHandler` recibe TODOS los errores, no solo los del arranque. Pintar
 *    la pantalla ante un tropiezo de una aplicación ya montada borraría una
 *    página que estaba funcionando.
 */
describe('⭐ LA PANTALLA DE ÚLTIMO RECURSO', () => {
  let consola: ReturnType<typeof vi.spyOn>;

  const deLaPantalla = () => document.querySelector(`[data-marca="${MARCA_DE_ULTIMO_RECURSO}"]`);

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [{ provide: ErrorHandler, useClass: UltimoRecurso }],
    });
    // El motivo técnico va a la consola a propósito; aquí se silencia para que
    // la salida de la suite no se llene de errores provocados.
    consola = vi.spyOn(console, 'error').mockImplementation(() => {});
    document.body.innerHTML = '';
  });

  afterEach(() => {
    consola.mockRestore();
    document.body.innerHTML = '';
  });

  /**
   * ⭐ JUEZ 1 — CON EL ARRANQUE CAÍDO, LA PANTALLA APARECE Y DICE LO QUE DICE.
   *
   * `<app-root>` vacío es exactamente la condición del fallo de arranque: el
   * elemento está en el HTML servido y Angular no llegó a meterle nada.
   */
  it('⭐ 1 · con <app-root> vacío, pinta el estado honesto con su texto', () => {
    document.body.innerHTML = '<app-root></app-root>';
    const manejador = TestBed.inject(ErrorHandler);

    manejador.handleError(new Error('el arranque ha reventado'));

    const pantalla = deLaPantalla();
    expect(pantalla, 'no se ha pintado ninguna pantalla de último recurso').not.toBeNull();
    expect(pantalla!.textContent?.trim()).toBe(TEXTO_DE_ULTIMO_RECURSO);
  });

  /**
   * ⭐ JUEZ 2 — Y SE ANUNCIA. Es lo único que queda en la página: quien no la ve
   * no tiene otra forma de enterarse de que ya no va a llegar nada más.
   */
  it('⭐ 2 · la pantalla es un `alert`, para que un lector la cante', () => {
    document.body.innerHTML = '<app-root></app-root>';
    TestBed.inject(ErrorHandler).handleError(new Error('reventón'));

    expect(deLaPantalla()!.getAttribute('role')).toBe('alert');
  });

  /**
   * ⭐ JUEZ 3 — CON LA APLICACIÓN VIVA, NO SE PINTA NADA. La que protege de que
   * el remedio sea peor que la enfermedad.
   */
  it('⭐ 3 · si la aplicación ya pinta, un error NO borra la página', () => {
    document.body.innerHTML = '<app-root><h1>Desplázame</h1></app-root>';
    TestBed.inject(ErrorHandler).handleError(new Error('un tropiezo de andar por casa'));

    expect(deLaPantalla(), 'ha pintado la pantalla de caída sobre una app viva').toBeNull();
    expect(document.querySelector('app-root h1')).not.toBeNull();
  });

  /** ⭐ JUEZ 4 — Dos errores seguidos no pintan dos pantallas. */
  it('⭐ 4 · dos errores seguidos dejan UNA sola pantalla', () => {
    document.body.innerHTML = '<app-root></app-root>';
    const manejador = TestBed.inject(ErrorHandler);
    manejador.handleError(new Error('uno'));
    manejador.handleError(new Error('y dos'));

    expect(document.querySelectorAll(`[data-marca="${MARCA_DE_ULTIMO_RECURSO}"]`).length).toBe(1);
  });

  /**
   * ⭐ JUEZ 5 — EL MOTIVO TÉCNICO NO SE PIERDE: SE MUEVE.
   *
   * A la consola, que es donde lo busca quien va a arreglarlo. Lo que no hace
   * es salir a la cara de quien solo quería buscar una ruta.
   */
  it('⭐ 5 · el error original se registra, y no se enseña', () => {
    document.body.innerHTML = '<app-root></app-root>';
    const fallo = new Error('TypeError: Failed to fetch');
    TestBed.inject(ErrorHandler).handleError(fallo);

    expect(consola).toHaveBeenCalledWith(fallo);
    expect(deLaPantalla()!.textContent).not.toContain('Failed to fetch');
  });
});
