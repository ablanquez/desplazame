/**
 * ⭐ EL CONMUTADOR DE TEMA — LA PRIORIDAD, JUZGADA (16/09, tanda 6 · parte 3).
 *
 * [DISEÑO §35] «tema claro **por defecto sin media query** (fallback),
 * sobreescribir con `@media (prefers-color-scheme: dark)` **redefiniendo custom
 * properties en `:root`**, y override manual con atributo `data-theme`
 * persistido (localStorage) que gana sobre el media query».
 *
 * La prioridad de casa, entonces: **elección guardada > sistema > claro**.
 *
 * ── ⭐ POR QUÉ SE JUZGA EL GUION DEL `index.html` Y NO UNA COPIA ──────────────
 *
 * El anti-FOUC obliga a que la preferencia se lea **antes del primer pintado**,
 * y eso solo lo consigue un guion **inline y bloqueante** en el `<head>`, antes
 * de las hojas. Ese guion no puede importar nada —no hay módulos todavía—, así
 * que su código vive en el HTML y no en TypeScript.
 *
 * ⚠️ Un guion que vive en el HTML es un guion que **nadie compila y nadie
 *    prueba**: es el sitio perfecto para que se pudra. Por eso estas juezas lo
 *    **extraen del fichero servido y lo ejecutan** contra un documento y un
 *    almacenamiento de mentira, una combinación por caso. No se prueba una
 *    copia del guion: se prueba el guion.
 *
 * ⚠️ Y LA LLAVE DEL ALMACENAMIENTO SE ESCRIBE DOS VECES —en el HTML y en
 *    `tema.ts`—, porque el guion no puede importarla. Es el mismo riesgo que el
 *    `preload` de la letra, y lleva el mismo portero: una jueza que saca las dos
 *    y las compara. Si alguien renombra una, la elección deja de sobrevivir a la
 *    recarga y **no se nota mirando la pantalla**.
 */
import { describe, expect, it, beforeEach } from 'vitest';
// @ts-expect-error — sin @types/node, el compilador no conoce el módulo
import { existsSync, readFileSync } from 'node:fs';
import { TestBed } from '@angular/core/testing';
import { LLAVE_DEL_TEMA, Tema } from './tema';

declare const process: { cwd(): string };

const RAIZ = ((): string => {
  let d = process.cwd().split('\\').join('/');
  for (let i = 0; i < 6; i++) {
    if (existsSync(d + '/datapackage.json')) return d + '/';
    d = d.slice(0, d.lastIndexOf('/'));
  }
  throw new Error('no encuentro datapackage.json subiendo desde ' + process.cwd());
})();

const HTML = readFileSync(RAIZ + 'app/src/index.html', 'utf8') as string;

/** El primer `<script>` sin `src` del `<head>`, tal y como está escrito. */
const GUION = ((): string => {
  const cabeza = HTML.slice(0, HTML.indexOf('</head>'));
  const m = /<script(?![^>]*\ssrc=)[^>]*>([\s\S]*?)<\/script>/.exec(cabeza);
  return m?.[1] ?? '';
})();

/**
 * Ejecuta el guion del `index.html` contra un documento de mentira.
 *
 * Devuelve lo que el guion dejó puesto: el atributo del `<html>` —`null` si no
 * lo tocó— y las clases que añadió. El `localStorage` puede LANZAR a propósito:
 * es el modo privado, que es donde esto se rompe de verdad.
 */
function correrElGuion({
  guardada,
  sistema,
  almacenLanza = false,
}: {
  guardada?: string;
  sistema: 'dark' | 'light';
  almacenLanza?: boolean;
}): { atributo: string | null; clases: string[]; reventó: string | null } {
  const atributos = new Map<string, string>();
  const clases = new Set<string>();
  const raiz = {
    setAttribute: (n: string, v: string) => void atributos.set(n, v),
    getAttribute: (n: string) => atributos.get(n) ?? null,
    removeAttribute: (n: string) => void atributos.delete(n),
    classList: { add: (c: string) => void clases.add(c), remove: (c: string) => void clases.delete(c) },
  };
  const almacen = {
    getItem: (k: string): string | null => {
      if (almacenLanza) throw new DOMException('denegado', 'SecurityError');
      return k === LLAVE_DEL_TEMA ? (guardada ?? null) : null;
    },
  };
  const ventana = {
    matchMedia: (consulta: string) => ({
      matches: consulta.includes('dark') ? sistema === 'dark' : sistema === 'light',
      addEventListener: () => {},
    }),
  };
  let reventó: string | null = null;
  try {
    // ⚠️ Se le pasa TODO por parámetro y no por `globalThis`: así el guion no
    //    puede colarse a un almacenamiento de verdad ni dejar restos entre casos.
    new Function(
      'document',
      'localStorage',
      'window',
      'requestAnimationFrame',
      `"use strict"; ${GUION}`,
    )(
      { documentElement: raiz },
      almacen,
      ventana,
      // Las dos vueltas del rAF no se dan aquí: lo que se juzga es lo que el
      // guion deja PUESTO al arrancar, que es lo que ve el primer pintado.
      () => {},
    );
  } catch (e) {
    reventó = (e as Error).message;
  }
  return { atributo: raiz.getAttribute('data-theme'), clases: [...clases], reventó };
}

describe('⭐ (a) EL GUION ANTI-FOUC del index.html', () => {
  it('⭐ existe, y es inline: sin `src`, sin `defer` y sin `async`', () => {
    expect(GUION.trim().length, 'no hay guion inline en el <head>').toBeGreaterThan(0);
    const cabeza = HTML.slice(0, HTML.indexOf('</head>'));
    const etiqueta = /<script(?![^>]*\ssrc=)[^>]*>/.exec(cabeza)?.[0] ?? '';
    // Cualquiera de las dos palabras lo saca del camino crítico y devuelve el
    // flash: el guion tiene que bloquear, que es justo lo que aquí se quiere.
    expect(etiqueta).not.toContain('defer');
    expect(etiqueta).not.toContain('async');
  });

  /**
   * ⚠️ Si el guion cae DESPUÉS de una hoja, el navegador ya ha pintado con el
   *    tema equivocado: el flash existe aunque el guion sea perfecto.
   */
  it('⭐ va ANTES de la primera hoja de estilo del head', () => {
    const cabeza = HTML.slice(0, HTML.indexOf('</head>'));
    const guion = cabeza.search(/<script(?![^>]*\ssrc=)/);
    const hoja = cabeza.search(/<link[^>]*rel="stylesheet"|<style/);
    expect(guion, 'no encuentro el guion').toBeGreaterThanOrEqual(0);
    // Sin hojas propias en el head fuente vale igual: las mete el build DETRÁS.
    if (hoja >= 0) expect(guion).toBeLessThan(hoja);
  });

  /**
   * ⭐ LA LLAVE, ESCRITA DOS VECES Y COMPARADA. Ver la cabecera del fichero.
   */
  it('⭐ el guion y `tema.ts` usan EXACTAMENTE la misma llave', () => {
    expect(GUION).toContain(`'${LLAVE_DEL_TEMA}'`);
  });

  it('⭐ la elección guardada GANA al sistema — oscuro guardado, sistema claro', () => {
    expect(correrElGuion({ guardada: 'dark', sistema: 'light' }).atributo).toBe('dark');
  });

  /**
   * ⭐ Y EN EL OTRO SENTIDO, que es el que se olvida: quien elige claro con el
   * portátil en oscuro tiene que conseguir el claro. Es la nº43 vista desde el
   * guion.
   */
  it('⭐ la elección guardada gana también al revés — claro guardado, sistema oscuro', () => {
    expect(correrElGuion({ guardada: 'light', sistema: 'dark' }).atributo).toBe('light');
  });

  /**
   * ⭐ SIN ELECCIÓN GUARDADA EL GUION NO ESTAMPA NADA, y eso no es un olvido.
   *
   * ⚠️ Estampar aquí el tema del sistema sería **una segunda copia de la
   *    prioridad** —la que ya escribe `styles.css` en su capa 2— y encima
   *    mataría el sistema vivo: con el atributo puesto, la capa 2 no vuelve a
   *    mandar nunca y cambiar el SO con la pestaña abierta no haría nada.
   *    La capa 2 del CSS ES el respaldo del §35; el guion no lo repite.
   */
  it('⭐ sin elección guardada NO toca el atributo: manda la capa 2 del CSS', () => {
    expect(correrElGuion({ sistema: 'dark' }).atributo).toBeNull();
    expect(correrElGuion({ sistema: 'light' }).atributo).toBeNull();
  });

  it('un valor de basura en el almacén se ignora, no se estampa', () => {
    expect(correrElGuion({ guardada: 'azul', sistema: 'light' }).atributo).toBeNull();
  });

  /**
   * ⭐ EL MODO PRIVADO, que es donde esto se rompe de verdad: `localStorage`
   * **lanza** al tocarlo. Sin `try/catch` la excepción sube, el guion muere, y
   * con él se lleva la supresión de transiciones — en la página que menos ayuda
   * tiene para depurarse.
   */
  it('⭐ si el almacenamiento LANZA, el guion no revienta', () => {
    const r = correrElGuion({ sistema: 'dark', almacenLanza: true });
    expect(r.reventó, 'el guion ha subido la excepción del almacén').toBeNull();
  });

  /**
   * ⭐ LA TRAMPA DE LAS TRANSICIONES: las que animan el cambio de tema animan
   * también la PRIMERA aplicación, y eso se ve como un flash aunque el atributo
   * llegue a tiempo. Se suprimen al arrancar y se devuelven tras el primer
   * pintado (dos vueltas de `requestAnimationFrame`).
   */
  it('⭐ suprime las transiciones al arrancar, en todos los casos', () => {
    for (const caso of [
      { guardada: 'dark', sistema: 'light' as const },
      { sistema: 'dark' as const },
      { sistema: 'light' as const, almacenLanza: true },
    ]) {
      expect(correrElGuion(caso).clases, JSON.stringify(caso)).toContain('sin-transiciones');
    }
  });

  it('⭐ y las devuelve: el guion pide dos vueltas de requestAnimationFrame', () => {
    // Una sola vuelta corre ANTES del primer pintado y no sirve de nada.
    expect((GUION.match(/requestAnimationFrame/g) ?? []).length).toBeGreaterThanOrEqual(2);
    expect(GUION).toContain("remove('sin-transiciones')");
  });
});

describe('⭐ (b) EL SERVICIO `Tema` — el lado que ESCRIBE', () => {
  let antes: string | null;

  beforeEach(() => {
    antes = document.documentElement.getAttribute('data-theme');
    localStorage.removeItem(LLAVE_DEL_TEMA);
    TestBed.resetTestingModule();
  });

  const restaurar = (): void => {
    if (antes === null) document.documentElement.removeAttribute('data-theme');
    else document.documentElement.setAttribute('data-theme', antes);
    localStorage.removeItem(LLAVE_DEL_TEMA);
  };

  /**
   * ⭐ **ACTA DEL TERCER ESTADO (20/09).** Aquí había tres juezas escritas
   * contra `elegir(oscuro: boolean)` y `alternar()`, que eran la API de un
   * interruptor de dos posiciones. Compran lo mismo y mejor: la elección se
   * nombra —`'claro' | 'oscuro' | 'sistema'`— y el tercer valor tiene su propia
   * jueza, que es la que no existía y por la que se hace todo esto.
   */
  it('⭐ elegir `oscuro` y `claro` pone el atributo en <html> Y guarda la elección', () => {
    const tema = TestBed.inject(Tema);
    tema.elegir('oscuro');
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    expect(localStorage.getItem(LLAVE_DEL_TEMA)).toBe('dark');
    expect(tema.oscuro()).toBe(true);
    expect(tema.elegida()).toBe('oscuro');

    tema.elegir('claro');
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
    expect(localStorage.getItem(LLAVE_DEL_TEMA)).toBe('light');
    expect(tema.oscuro()).toBe(false);
    expect(tema.elegida()).toBe('claro');
    restaurar();
  });

  /**
   * ⭐ **LA JUEZA DEL TERCER ESTADO, Y LA RAZÓN DE LA TANDA.**
   *
   * ⚠️ «Sistema» **BORRA**, no escribe, y las dos mitades del borrado importan:
   *
   *    · sin **atributo**, la capa 2 de `styles.css` —`prefers-color-scheme`
   *      sobre `:root:not([data-theme])`— vuelve a mandar, que es el respaldo
   *      que el §35 firma. Con el atributo puesto no volvería a mandar nunca, y
   *      cambiar el SO con la pestaña abierta no haría nada;
   *    · sin **llave guardada**, el guion anti-FOUC del `index.html` no estampa
   *      nada en la siguiente carga y el sistema sigue mandando también ahí.
   *
   * Dejar una de las dos a medias es el fallo que no se ve: la pestaña seguiría
   * al aparato hasta que alguien recargara.
   */
  it('⭐ elegir `sistema` BORRA el atributo Y la llave: el mando vuelve al aparato', () => {
    const tema = TestBed.inject(Tema);
    tema.elegir('oscuro');
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    expect(localStorage.getItem(LLAVE_DEL_TEMA)).toBe('dark');

    tema.elegir('sistema');
    expect(document.documentElement.getAttribute('data-theme'), 'el atributo sigue puesto').toBeNull();
    expect(localStorage.getItem(LLAVE_DEL_TEMA), 'la llave sigue guardada').toBeNull();
    expect(tema.elegida()).toBe('sistema');
    restaurar();
  });

  /**
   * ⭐ Y HAY CAMINO DE VUELTA, que es lo que el interruptor no tenía: de
   * «sistema» a un tema fijo y otra vez a «sistema», tantas veces como se
   * quiera, y el almacén acaba como empezó.
   */
  it('⭐ se puede ir y volver: sistema → claro → sistema', () => {
    const tema = TestBed.inject(Tema);
    tema.elegir('sistema');
    expect(localStorage.getItem(LLAVE_DEL_TEMA)).toBeNull();
    tema.elegir('claro');
    expect(localStorage.getItem(LLAVE_DEL_TEMA)).toBe('light');
    tema.elegir('sistema');
    expect(localStorage.getItem(LLAVE_DEL_TEMA)).toBeNull();
    expect(document.documentElement.hasAttribute('data-theme')).toBe(false);
    restaurar();
  });

  /**
   * ⭐ LA ELECCIÓN DE PARTIDA SALE DEL ALMACÉN, y sin nada guardado es
   * «sistema» — no «claro». La diferencia no es de nombre: con «claro» de
   * partida, el grupo de radios enseñaría una opción que nadie ha pedido y que
   * además puede no ser la que se está pintando.
   */
  it('⭐ sin nada guardado, la elección de partida es `sistema`', () => {
    localStorage.removeItem(LLAVE_DEL_TEMA);
    document.documentElement.removeAttribute('data-theme');
    TestBed.resetTestingModule();
    expect(TestBed.inject(Tema).elegida()).toBe('sistema');
    restaurar();
  });

  it('⭐ y con algo guardado, la de partida es lo guardado', () => {
    localStorage.setItem(LLAVE_DEL_TEMA, 'dark');
    TestBed.resetTestingModule();
    expect(TestBed.inject(Tema).elegida()).toBe('oscuro');
    restaurar();
  });

  /**
   * ⭐ LA ELECCIÓN SOBREVIVE A LA RECARGA, y aquí se comprueba de la única
   * forma honesta que cabe en una prueba de unidad: lo que `Tema` GUARDA es lo
   * que el guion del `index.html` LEE. Se escribe con el servicio y se lee con
   * el guion de verdad, no con una copia.
   */
  it('⭐ lo que guarda `Tema` es lo que el guion lee al recargar', () => {
    const tema = TestBed.inject(Tema);
    tema.elegir('oscuro');
    const guardada = localStorage.getItem(LLAVE_DEL_TEMA) ?? undefined;
    expect(correrElGuion({ guardada, sistema: 'light' }).atributo).toBe('dark');
    restaurar();
  });

  /**
   * ⭐ Y EL OTRO LADO DEL MISMO CONTRATO: con «sistema» elegido no hay nada
   * guardado, así que el guion NO estampa y la capa 2 del CSS manda desde el
   * primer pintado. Es la rama sin-preferencia del anti-FOUC, comprada con lo
   * que el servicio deja de verdad en el almacén.
   */
  it('⭐ con `sistema` elegido, el guion no estampa nada al recargar', () => {
    const tema = TestBed.inject(Tema);
    tema.elegir('sistema');
    const guardada = localStorage.getItem(LLAVE_DEL_TEMA) ?? undefined;
    expect(guardada).toBeUndefined();
    expect(correrElGuion({ guardada, sistema: 'dark' }).atributo).toBeNull();
    expect(correrElGuion({ guardada, sistema: 'light' }).atributo).toBeNull();
    restaurar();
  });
});
