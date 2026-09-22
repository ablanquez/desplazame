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
import { describe, expect, it, beforeEach, afterEach } from 'vitest';
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
  /**
   * ⭐ **QUIEN TOCA UN GLOBAL LO DEJA COMO ESTABA** (22/09, la carrera del
   *    `data-theme`).
   *
   * El runner de la unidad corre con `isolate: false` —el builder de Angular lo
   *    fija así «to align with the Karma/Jasmine experience»—, y Vitest lo
   *    define como «Run tests in an isolated environment […] Disabling this
   *    option improves performance if your code doesn't rely on side effects».
   *    O sea: los ficheros que caen en el mismo worker **comparten el mismo
   *    `document` y el mismo `localStorage`**, uno detrás de otro.
   *
   * La fuga vino de `pintura.spec`: la prueba del nombre estable pulsaba el
   *    interruptor y no restauraba nada: dejaba `data-theme=dark` en el `<html>`
   *    real. La de debajo leía ese `dark` como «el de antes» y lo restauraba
   *    fielmente. Todo `mapa.spec` que cayera después en el mismo worker nacía
   *    en oscuro: los 7 rojos intermitentes. Reproducido a voluntad con un solo
   *    worker y `pintura.spec` delante de `mapa.spec`, y clavado con una sonda
   *    que fotografiaba el `<html>` heredado.
   *
   * Este bloque restauraba bien el atributo, pero **al final de cada
   *    prueba** —si una aserción fallaba antes, no se ejecutaba— y **nunca la
   *    clave guardada**, que se quedaba con lo último elegido. Por eso la
   *    restauración vive AQUÍ, en el teardown, y no al final de cada
   *    prueba: se ejecuta aunque una aserción falle a medias, y vale para
   *    cualquier prueba que se añada mañana al bloque. Vuelve al valor ANTERIOR
   *    —el atributo y la clave guardada—, no a uno fijo, y es idempotente.
   */
  let antes: string | null;
  let guardadoDeAntes: string | null;

  beforeEach(() => {
    antes = document.documentElement.getAttribute('data-theme');
    guardadoDeAntes = localStorage.getItem(LLAVE_DEL_TEMA);
    localStorage.removeItem(LLAVE_DEL_TEMA);
    TestBed.resetTestingModule();
  });

  afterEach(() => {
    if (antes === null) document.documentElement.removeAttribute('data-theme');
    else document.documentElement.setAttribute('data-theme', antes);
    if (guardadoDeAntes === null) localStorage.removeItem(LLAVE_DEL_TEMA);
    else localStorage.setItem(LLAVE_DEL_TEMA, guardadoDeAntes);
  });

  it('⭐ elegir pone el atributo en <html> Y guarda la elección', () => {
    const tema = TestBed.inject(Tema);
    tema.elegir(true);
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    expect(localStorage.getItem(LLAVE_DEL_TEMA)).toBe('dark');
    expect(tema.oscuro()).toBe(true);

    tema.elegir(false);
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
    expect(localStorage.getItem(LLAVE_DEL_TEMA)).toBe('light');
    expect(tema.oscuro()).toBe(false);
  });

  it('⭐ alternar va y vuelve', () => {
    const tema = TestBed.inject(Tema);
    tema.elegir(false);
    tema.alternar();
    expect(tema.oscuro()).toBe(true);
    tema.alternar();
    expect(tema.oscuro()).toBe(false);
  });

  /**
   * ⭐ LA ELECCIÓN SOBREVIVE A LA RECARGA, y aquí se comprueba de la única
   * forma honesta que cabe en una prueba de unidad: lo que `Tema` GUARDA es lo
   * que el guion del `index.html` LEE. Se escribe con el servicio y se lee con
   * el guion de verdad, no con una copia.
   */
  it('⭐ lo que guarda `Tema` es lo que el guion lee al recargar', () => {
    const tema = TestBed.inject(Tema);
    tema.elegir(true);
    const guardada = localStorage.getItem(LLAVE_DEL_TEMA) ?? undefined;
    expect(correrElGuion({ guardada, sistema: 'light' }).atributo).toBe('dark');
  });
});
