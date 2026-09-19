// ⚠️ Módulos de Node: existen en tiempo de ejecución (las pruebas corren sobre
// Node) pero NO tienen tipos aquí — el proyecto no trae `@types/node` porque
// las dependencias son CERO. Misma costura que `construir.spec.ts`.
// @ts-expect-error — sin @types/node, el compilador no conoce el módulo
import { spawnSync } from 'node:child_process';
// @ts-expect-error — idem
import { cpSync, existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
// @ts-expect-error — idem
import { join } from 'node:path';
// @ts-expect-error — idem
import { tmpdir } from 'node:os';

/**
 * ⭐ LA INTRANET NO VIAJA — y esto lo comprueba SOBRE EL DIST CONSTRUIDO.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 *  El 19/09 Antonio firmó acceso **solo-local** para la intranet: el visor de
 *  capas y el panel de frescura no se despliegan. El mecanismo que lo cumple es
 *  el `fileReplacements` de `angular.json` [angular.dev · *Build
 *  environments*], que en `production` reemplaza `rutas-intranet.ts` por el
 *  vacío, y sin esos `loadComponent` los trozos **no se generan**.
 *
 *  ⚠️ **Un mecanismo no es una garantía.** El reemplazo se puede borrar de
 *     `angular.json` sin que nada chille; se puede construir con
 *     `--configuration local` por costumbre; puede entrar una importación
 *     estática desde la portada. En los tres casos la app pública seguiría
 *     funcionando igual de bien, el dist se empujaría —y el push ES el
 *     despliegue—, y la intranet estaría en internet sin que nadie lo supiera.
 *
 *  Así que lo que se compra aquí no es el mecanismo: es **el invariante**. Se
 *  abre el dist que hay en disco y se busca dentro.
 *
 *  La comprobación vive en `scripts/construir.mjs`, que es quien construye y
 *  quien firma la marca, para que la corra **siempre**: al construir (antes del
 *  swap, para que una build sucia no llegue a sustituir a la limpia) y en
 *  `npm run comprobar-dist`, que es el paso previo al commit. Aquí se comprueba
 *  que esa comprobación FUNCIONA.
 * ═══════════════════════════════════════════════════════════════════════════
 */

declare const process: {
  cwd(): string;
  execPath: string;
};

/**
 * ⚠️ Subiendo hasta dar con el manifiesto, como en `construir.spec.ts` y en
 *    `manifiesto.spec.ts`: en el empaquetado de las pruebas `import.meta.url`
 *    no es de esquema `file:`, y la lección ya está pagada.
 */
const RAIZ = ((): string => {
  let d = process.cwd().split('\\').join('/');
  for (let i = 0; i < 6; i++) {
    if (existsSync(d + '/datapackage.json')) return d + '/';
    d = d.slice(0, d.lastIndexOf('/'));
  }
  throw new Error('no encuentro datapackage.json subiendo desde ' + process.cwd());
})();

const GUION = RAIZ + 'app/scripts/construir.mjs';
const DIST_REAL = RAIZ + 'app/dist';
const SUBRUTA = join('desplazame', 'browser');

/** Corre `construir.mjs --comprobar` contra un dist cualquiera. */
function comprobar(dist: string): { codigo: number; texto: string } {
  const hijo = spawnSync(process.execPath, [GUION, '--comprobar', '--dist', dist], {
    encoding: 'utf8',
  });
  return { codigo: hijo.status ?? -1, texto: (hijo.stdout ?? '') + (hijo.stderr ?? '') };
}

/**
 * Una copia del dist de verdad, para poder sabotearla.
 *
 * ⚠️ **En copia, nunca sobre el bueno.** La ley de la casa: la contraprueba se
 *    hace sobre la prueba, y jamás se rompe el dist real para ver el rojo.
 */
function copiaDelDist(): string {
  const destino = mkdtempSync(join(tmpdir(), 'no-viaja-'));
  cpSync(DIST_REAL, join(destino, 'dist'), { recursive: true });
  return join(destino, 'dist');
}

describe('El dist de producción no lleva la intranet dentro', () => {
  const basura: string[] = [];

  afterAll(() => {
    for (const ruta of basura) rmSync(join(ruta, '..'), { recursive: true, force: true });
  });

  it('⭐ EL DIST DE VERDAD está limpio, y lo dice con todas las letras', () => {
    // Si esto se pone rojo, no se toca la jueza: se mira qué se ha colado.
    const { codigo, texto } = comprobar(DIST_REAL);
    expect(texto).toContain('sin rastro de intranet');
    expect(codigo).toBe(0);
  });

  it('⭐ NACE EN ROJO: un dist con el trozo del VISOR dentro no pasa', () => {
    const dist = copiaDelDist();
    basura.push(dist);
    // Un trozo perezoso cualquiera, con el selector que Angular deja escrito
    // en el paquete de un componente. Es el rastro que delata al visor.
    writeFileSync(
      join(dist, SUBRUTA, 'chunk-FALSO.js'),
      'export const x={selectors:[["app-visor"]]};\n',
    );

    const { codigo, texto } = comprobar(dist);
    expect(codigo).toBe(17);
    expect(texto).toContain('LA INTRANET SE HA COLADO');
    expect(texto).toContain('app-visor');
    expect(texto).toContain('chunk-FALSO.js');
  });

  it('⭐ y tampoco pasa con el trozo del PANEL, que se mudó con él', () => {
    const dist = copiaDelDist();
    basura.push(dist);
    writeFileSync(
      join(dist, SUBRUTA, 'chunk-PANEL-FALSO.js'),
      'export const p={selectors:[["app-panel"]]};\n',
    );

    const { codigo, texto } = comprobar(dist);
    expect(codigo).toBe(17);
    expect(texto).toContain('app-panel');
  });

  it('⭐ ni con el mapa de capas, que es donde está el peso de verdad', () => {
    const dist = copiaDelDist();
    basura.push(dist);
    writeFileSync(
      join(dist, SUBRUTA, 'chunk-MAPA-FALSO.js'),
      'export const m={selectors:[["app-mapa-de-capas"]]};\n',
    );

    expect(comprobar(dist).codigo).toBe(17);
  });

  it('⭐ Y NI UN BYTE DE DATO SIN PUBLICAR: 40,72 MiB que no se despliegan', () => {
    const dist = copiaDelDist();
    basura.push(dist);
    const carpeta = join(dist, SUBRUTA, 'data');
    mkdirSync(carpeta, { recursive: true });
    // El grafo del visor: 22,82 MiB él solo. Aquí basta con el nombre.
    writeFileSync(join(carpeta, 'grafo-visor.js'), 'window.GRAFO = {};\n');

    const { codigo, texto } = comprobar(dist);
    expect(codigo).toBe(17);
    expect(texto).toContain('dato que no debe publicarse');
    expect(texto).toContain('grafo-visor.js');
  });

  it('⭐ pero la ZBE SÍ viaja, que es pública y la pinta el buscador', () => {
    // El contraste: si la regla fuera «ninguna carpeta data», esta prueba
    // estaría roja y la de arriba verde por la razón equivocada.
    expect(existsSync(join(DIST_REAL, SUBRUTA, 'data', '2026-09-02_wfs_movilidad-MU1_ZBE.json'))).toBe(
      true,
    );
    expect(comprobar(DIST_REAL).codigo).toBe(0);
  });
});
