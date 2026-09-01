/**
 * ⭐ LOS CHIPS DE LAS 53 LÍNEAS, UNA A UNA. Y contra el dato de verdad.
 *
 * ⚠️ Estas jueces leen **el cocinado que sirve el motor**, no una lista escrita
 *    a mano: una tabla de colores en el spec envejecería sola, y el día que el
 *    feed cambiara un tono el juez seguiría aprobando el color de ayer.
 */
import { describe, expect, it } from 'vitest';
// ⚠️ De Node, y **existe en tiempo de ejecución**: las pruebas corren sobre
// Node. Lo que no existe son sus TIPOS — el proyecto no trae `@types/node`
// porque **las dependencias son CERO**. Mismo apaño que `manifiesto.spec.ts`.
// @ts-expect-error — sin @types/node, el compilador no conoce el módulo
import { readFileSync, existsSync } from 'node:fs';
import { NOCHE, BLANCO, NEGRO, esBuho, legiblePorContorno, llevaContorno, tonosDeChip } from './chip';
import { contraste, AA_TEXTO } from './contraste';

interface LineaCocinada {
  readonly corto: string;
  readonly color: string;
  readonly colorTexto: string;
}

/** `process` es de Node y tampoco está tipado aquí. Solo se usa `cwd()`. */
declare const process: { cwd(): string };

/**
 * El cocinado, buscado **subiendo hasta dar con él** — no calculado desde
 * `import.meta.url`, que en el empaquetado de las pruebas no es de esquema
 * `file:`. Mismo camino que `manifiesto.spec.ts`, y por la misma razón.
 */
const COCINADO = ((): string => {
  const suyo = '/app/data/nap_gtfs-ficha1176.cocinado.json';
  let d = process.cwd().replaceAll('\\', '/');
  for (let i = 0; i < 6; i++) {
    if (existsSync(d + suyo)) {
      return d + suyo;
    }
    d = d.slice(0, d.lastIndexOf('/'));
  }
  throw new Error('no encuentro el cocinado subiendo desde ' + process.cwd());
})();

const TODAS: readonly LineaCocinada[] = JSON.parse(readFileSync(COCINADO, 'utf-8')).lineas;
const DIURNAS = TODAS.filter((l) => !esBuho(l.corto));
const BUHOS = TODAS.filter((l) => esBuho(l.corto));

describe('⭐ EL CHIP DE UNA LÍNEA — heredado de ZetaBus', () => {
  it('el cocinado trae las 53 líneas, y siete son búhos', () => {
    expect(TODAS.length).toBe(53);
    expect(BUHOS.map((l) => l.corto).sort()).toEqual(['N1', 'N2', 'N3', 'N4', 'N5', 'N6', 'N7']);
    expect(DIURNAS.length).toBe(46);
  });

  /**
   * ⛔ EL ROJO, y sigue valiendo de contraprueba: **esto es lo que hacía la
   * pantalla hasta hoy**, que era obedecer al `route_text_color` del feed.
   */
  it('⛔ obedecer al feed deja 27 de 53 chips por debajo de AA', () => {
    const ilegibles = TODAS.filter((l) => contraste(l.color, l.colorTexto) < AA_TEXTO);
    expect(ilegibles.length).toBe(27);
    const peor = TODAS.reduce((a, b) =>
      contraste(a.color, a.colorTexto) <= contraste(b.color, b.colorTexto) ? a : b,
    );
    expect(peor.corto).toBe('33');
    expect(contraste(peor.color, peor.colorTexto)).toBeLessThan(2);
  });

  /**
   * ⭐ JUEZ 1 — LAS 46 DIURNAS, TODAS LEGIBLES Y CON SU COLOR INTACTO.
   *
   * La peor de todas es la **33** (`#C5CE00`, una lima): con blanco a pelo da
   * **1,72:1** y con el trazo negro pasa de sobra. Es el caso que obliga al
   * contorno, y por eso se compra aparte.
   */
  it('⭐ 1 · toda diurna lleva número BLANCO con contorno, y se lee', () => {
    for (const l of DIURNAS) {
      const { fondo, texto, buho } = tonosDeChip(l);
      expect(buho, l.corto).toBe(false);
      expect(texto.toUpperCase(), l.corto).toBe(BLANCO);
      expect(llevaContorno(texto), l.corto).toBe(true);
      // ⭐ Y el fondo es SU color, sin tocar: la identidad no se repinta.
      expect(fondo.toUpperCase(), l.corto).toBe(l.color.toUpperCase());
      const c = legiblePorContorno(fondo);
      expect(c, 'la línea ' + l.corto + ' sale a ' + c.toFixed(2)).toBeGreaterThanOrEqual(AA_TEXTO);
    }
  });

  it('⭐ 1b · la 33, que es la peor: blanco solo NO se lee; el trazo negro sí', () => {
    const l33 = TODAS.find((l) => l.corto === '33')!;
    expect(contraste(BLANCO, l33.color)).toBeLessThan(AA_TEXTO);
    expect(contraste(NEGRO, l33.color)).toBeGreaterThanOrEqual(AA_TEXTO);
    expect(tonosDeChip(l33).fondo.toUpperCase()).toBe(l33.color.toUpperCase());
  });

  it('⭐ 1c · EL SUELO del contorno: 4,58:1 para CUALQUIER color, no solo los 53', () => {
    // El peor fondo posible es donde blanco y negro empatan. Se busca, no se supone.
    const grises = Array.from({ length: 256 }, (_, v) => v.toString(16).padStart(2, '0').repeat(3));
    const peor = grises.map(legiblePorContorno).reduce((a, b) => Math.min(a, b));
    expect(peor).toBeGreaterThan(AA_TEXTO);
    expect(peor).toBeLessThan(4.7);
  });

  /**
   * ⭐ JUEZ 2 — LOS SIETE BÚHOS, sobre el azul noche.
   *
   * La peor es la **N4**, a 4,70:1 — pasa, pero con poco margen, y por eso la
   * red de ZetaBus se hereda entera: si un búho no llegara, su número cae a
   * blanco o negro por cálculo en vez de quedarse ilegible.
   */
  it('⭐ 2 · los siete búhos: fondo noche, número de SU línea, sin contorno', () => {
    expect(BUHOS.length).toBe(7);
    for (const l of BUHOS) {
      const { fondo, texto, buho } = tonosDeChip(l);
      expect(buho, l.corto).toBe(true);
      expect(fondo).toBe(NOCHE);
      expect(texto.toUpperCase(), l.corto).toBe(l.color.toUpperCase());
      expect(llevaContorno(texto), l.corto + ' no debe llevar contorno').toBe(false);
      expect(contraste(fondo, texto), l.corto).toBeGreaterThanOrEqual(AA_TEXTO);
    }
    // Y la peor es la N4, que es la que hay que mirar si el azul cambiara.
    const peor = BUHOS.reduce((a, b) => (contraste(NOCHE, a.color) <= contraste(NOCHE, b.color) ? a : b));
    expect(peor.corto).toBe('N4');
    expect(contraste(NOCHE, peor.color)).toBeGreaterThanOrEqual(AA_TEXTO);
  });

  it('⚠️ 2b · y la red del búho nunca devuelve algo por debajo de AA', () => {
    // Un búho inventado de un azul casi igual al fondo: su número cae a blanco.
    const invisible = tonosDeChip({ corto: 'N9', color: '1C1A45' });
    expect(invisible.texto).toBe(BLANCO);
    expect(contraste(invisible.fondo, invisible.texto)).toBeGreaterThanOrEqual(AA_TEXTO);
  });

  /**
   * ⭐ JUEZ 4 — NINGUNA DE LAS 53 CAMBIA SU `route_color`.
   *
   * Es la juez que impide arreglar el contraste por el camino fácil. Los colores
   * son la identidad de Avanza: quien conoce la ciudad reconoce su línea por el
   * tono, y repintarlo sería resolver un problema de accesibilidad rompiendo la
   * información que el color transporta.
   */
  it('⭐ 4 · el color de línea de las 53 llega intacto al chip', () => {
    for (const l of TODAS) {
      const esperado = esBuho(l.corto) ? NOCHE : l.color;
      expect(tonosDeChip(l).fondo.toUpperCase(), l.corto).toBe(esperado.toUpperCase());
    }
    // Y en el búho, el color de la línea no desaparece: pasa al número.
    for (const l of BUHOS) {
      expect(tonosDeChip(l).texto.toUpperCase(), l.corto).toBe(l.color.toUpperCase());
    }
  });
});
