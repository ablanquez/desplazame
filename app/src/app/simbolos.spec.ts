// ⚠️ De Node, y **existe en tiempo de ejecución**: las pruebas corren sobre
// Node. Lo que no existe son sus TIPOS — el proyecto no trae `@types/node`
// porque las dependencias son CERO. Es el patrón de `manifiesto.spec.ts`.
// @ts-expect-error — sin @types/node, el compilador no conoce el módulo
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';
import { REJILLA, SIMBOLOS_48, SUFIJO, ficheroDe, trazadoPara, SIMBOLOS, Simbolo, type NombreDeSimbolo } from './simbolos';

/**
 * ⭐ EL PORTERO DE LA COPIA (10/09, punto 15 · tanda 4).
 *
 * El dibujo de cada símbolo vive en DOS sitios: el `.svg` original de
 * `app/simbolos/`, que es la procedencia con su sha256 y su licencia, y la
 * tabla de `simbolos.ts`, que es lo que se inyecta en línea para que el icono
 * herede el color del texto.
 *
 * ⚠️ **Dos copias del mismo dato es lo que en esta casa ya salió mal.**
 *    `contraste.ts` cuenta en su cabecera las cuatro copias de una fórmula de
 *    las que la cuarta no era igual, y no se notaba porque daba PARECIDO. Un
 *    `path` retocado en un solo lado daría igual de parecido: el icono se
 *    vería, sería casi el mismo, y la procedencia estaría mintiendo.
 *
 * Así que la copia tiene portero, y compara **carácter a carácter**.
 */
declare const process: { cwd(): string };

const RAIZ = ((): string => {
  let d = process.cwd().split('\\').join('/');
  for (let i = 0; i < 6; i++) {
    if (existsSync(d + '/app/simbolos')) return d + '/';
    d = d.slice(0, d.lastIndexOf('/'));
  }
  throw new Error('no encuentro app/simbolos subiendo desde ' + process.cwd());
})();

const CARPETA = RAIZ + 'app/simbolos/';

/** El `d` del único `<path>` de un fichero original. */
function trazadoDelFichero(nombre: string): string {
  const svg: string = readFileSync(CARPETA + nombre + '.svg', 'utf8');
  const d = / d="([^"]+)"/.exec(svg);
  if (!d) throw new Error('el svg de ' + nombre + ' no trae `d`');
  return d[1]!;
}

const NOMBRES = Object.keys(SIMBOLOS) as NombreDeSimbolo[];

describe('⭐ LOS SÍMBOLOS — la tabla dice lo que dicen los ficheros', () => {
  /**
   * ⭐ EL CENSO, EN LAS DOS DIRECCIONES.
   *
   * ⚠️ Una sola dirección no basta y es el error fácil: comprobar «cada entrada
   *    de la tabla tiene su fichero» deja pasar un `.svg` descargado que nadie
   *    usa —peso muerto con licencia—, y comprobar solo lo contrario deja pasar
   *    una entrada inventada a mano que no viene de ninguna parte.
   */
  it('⭐ hay tantos ficheros como entradas, y son los mismos nombres', () => {
    // ⭐ **ACTA DEL BARRIDO A `opsz20` (18/09).** Aquí se comparaba el nombre
    //    pelado del fichero con el nombre del símbolo, porque los treinta eran
    //    la misma instancia. Ya no: el catálogo guarda **de cada símbolo la
    //    instancia que se pinta**, y el fichero lleva el sufijo que lo dice.
    //    La jueza no se afloja — sigue comparando en las DOS direcciones—: lo
    //    que cambia es que el nombre esperado lo da `ficheroDe`.
    const enDisco = (readdirSync(CARPETA) as string[])
      .filter((f) => f.endsWith('.svg') && f !== 'route_48px.svg')
      .map((f) => f.slice(0, -4))
      .sort();
    expect(enDisco).toEqual(NOMBRES.map(ficheroDe).sort());
    expect(enDisco.length).toBeGreaterThan(0);
  });

  /**
   * ⭐ Y LA SEGUNDA INSTANCIA ÓPTICA, CENSADA IGUAL (17/09).
   *
   * ⚠️ El filtro `_48px` de la jueza de arriba es una excepción, y una
   *    excepción sin portero es un agujero: sin esta jueza, cualquier fichero
   *    acabado en `_48px.svg` podría caer en la carpeta y nadie lo miraría.
   *    Aquí se cuentan los que hay y se comparan con la tabla de 48.
   */
  it('⭐ la SEGUNDA instancia es solo la de quien se pinta a dos tamaños', () => {
    // ⚠️ `route` es el único: 24 en la barra de pestañas y 48 en el vacío del
    //    resultado. Todos los demás se pintan a un solo tamaño, y por eso les
    //    basta con su entrada del catálogo. Si mañana otro se pinta a dos, esta
    //    jueza obliga a declararlo en vez de dejarlo a medias.
    const sobrantes = (readdirSync(CARPETA) as string[]).filter(
      (f) => f.endsWith('.svg') && !NOMBRES.map(ficheroDe).includes(f.slice(0, -4)) && f !== 'route_48px.svg',
    );
    expect(sobrantes, 'ficheros que no son la instancia de nadie').toEqual([]);
    expect(Object.keys(SIMBOLOS_48)).toEqual(['route']);
  });

  it('⭐ el trazado de la tabla es EL MISMO que el del fichero, carácter a carácter', () => {
    // El fichero que toca a cada uno lo dice `ficheroDe`: el mismo mapa que usa
    // el código, para que no puedan separarse.
    const distintos = NOMBRES.filter((n) => SIMBOLOS[n] !== trazadoDelFichero(ficheroDe(n)));
    expect(distintos).toEqual([]);
    expect(SIMBOLOS_48.route).toBe(trazadoDelFichero('route_48px'));
  });

  /**
   * ⭐ Y NO SON EL MISMO DIBUJO ESCALADO, que es la razón de que existan.
   *
   * [DOC OFICIAL] el eje de tamaño óptico trae instancias propias para 20, 24,
   * 40 y 48. Si alguien «ahorrara» copiando aquí el trazado de 24, la tabla de
   * 48 dejaría de servir para nada y nadie se enteraría: se vería igual de
   * gordo que antes.
   */
  it('⭐ la instancia de 48 es OTRO dibujo, no el de 24 estirado', () => {
    expect(SIMBOLOS_48.route, 'la de 48 repite el trazado de 24').not.toBe(SIMBOLOS.route);
  });

  /**
   * ⭐ LA REGLA DEL EJE, JUZGADA EN LA FUNCIÓN QUE LA APLICA: la instancia
   * igual o la inmediatamente MENOR.
   */
  it('⭐ `trazadoPara` elige la instancia óptica por el lado', () => {
    // Por debajo de 48 manda la de 24, aunque exista la de 48.
    for (const lado of [14, 16, 18, 20, 24, 40, 47]) {
      expect(trazadoPara('route', lado), `lado ${lado}`).toBe(SIMBOLOS.route);
    }
    // De 48 en adelante, la de 48 — y por encima también: es la menor que hay.
    for (const lado of [48, 64]) {
      expect(trazadoPara('route', lado), `lado ${lado}`).toBe(SIMBOLOS_48.route);
    }
    // Y un símbolo que NO tiene instancia de 48 se queda con la que tiene.
    expect(trazadoPara('search', 48)).toBe(SIMBOLOS.search);
  });

  /**
   * La rejilla se escribe UNA vez en `simbolos.ts` en lugar de ocho veces, así
   * que hay que comprobar que los ocho ficheros la comparten de verdad: si uno
   * llegara con otra, se pintaría a la escala equivocada sin decir nada.
   */
  it('⭐ los ocho comparten la rejilla que el componente da por buena', () => {
    const otras = NOMBRES.filter((n) => {
      const svg: string = readFileSync(CARPETA + ficheroDe(n) + '.svg', 'utf8');
      return !svg.includes(`viewBox="${REJILLA}"`);
    });
    expect(otras).toEqual([]);
  });

  /** Un solo `<path>`: es lo que el componente inyecta, y todo lo demás se perdería. */
  it('⭐ cada fichero trae UN solo trazado — lo que el componente sabe pintar', () => {
    const conVarios = NOMBRES.filter((n) => {
      const svg: string = readFileSync(CARPETA + ficheroDe(n) + '.svg', 'utf8');
      return (svg.match(/<path/g) ?? []).length !== 1;
    });
    expect(conVarios).toEqual([]);
  });

  /** La licencia viaja con el dibujo, que es lo que la Apache 2.0 pide. */
  it('⭐ la licencia Apache 2.0 y la procedencia viajan al lado', () => {
    expect(existsSync(CARPETA + 'LICENCIA-APACHE-2.0.txt')).toBe(true);
    expect(existsSync(CARPETA + 'PROCEDENCIA.md')).toBe(true);
    const licencia: string = readFileSync(CARPETA + 'LICENCIA-APACHE-2.0.txt', 'utf8');
    expect(licencia).toContain('Apache License');
    expect(licencia).toContain('Version 2.0');
  });
});

@Component({
  imports: [Simbolo],
  template: `<app-simbolo nombre="my_location" [lado]="20" />
    <app-simbolo nombre="swap_vert" />`,
})
class Anfitrion {}

describe('⭐ EL COMPONENTE — pinta el trazado y no habla', () => {
  async function montar(): Promise<HTMLElement> {
    await TestBed.configureTestingModule({ imports: [Anfitrion] }).compileComponents();
    const fixture = TestBed.createComponent(Anfitrion);
    await fixture.whenStable();
    return fixture.nativeElement as HTMLElement;
  }

  it('⭐ pinta el trazado del símbolo pedido, no otro', async () => {
    const svgs = (await montar()).querySelectorAll('svg');
    expect(svgs.length).toBe(2);
    expect(svgs[0]!.querySelector('path')?.getAttribute('d')).toBe(SIMBOLOS['my_location']);
    expect(svgs[1]!.querySelector('path')?.getAttribute('d')).toBe(SIMBOLOS['swap_vert']);
  });

  /**
   * ⭐ Y NO SE ANUNCIA. Cada icono viaja con su etiqueta visible o dentro de un
   * control que ya trae `aria-label`; si además se cantara solo, el nombre se
   * diría dos veces. [DISEÑO: los emojis se van, el texto se queda.]
   */
  it('⭐ va `aria-hidden` y sin foco: el texto de al lado es quien habla', async () => {
    for (const svg of (await montar()).querySelectorAll('svg')) {
      expect(svg.getAttribute('aria-hidden')).toBe('true');
      expect(svg.getAttribute('focusable')).toBe('false');
    }
  });

  /** `currentColor` es lo que deja que el chip activo y el inactivo lo repinten. */
  it('⭐ se pinta con el color del texto que lo rodea', async () => {
    for (const svg of (await montar()).querySelectorAll('svg')) {
      expect(svg.getAttribute('fill')).toBe('currentColor');
    }
  });

  it('el lado por defecto es 20, y se puede pedir otro', async () => {
    const svgs = (await montar()).querySelectorAll('svg');
    expect(svgs[0]!.getAttribute('width')).toBe('20');
    expect(svgs[1]!.getAttribute('width')).toBe('20');
    expect(svgs[0]!.getAttribute('viewBox')).toBe(REJILLA);
  });
});
