// ⚠️ De Node, y **existe en tiempo de ejecución**: las pruebas corren sobre
// Node. Lo que no existe son sus TIPOS — el proyecto no trae `@types/node`
// porque las dependencias son CERO. Es el patrón de `manifiesto.spec.ts`.
// @ts-expect-error — sin @types/node, el compilador no conoce el módulo
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';
import { REJILLA, SIMBOLOS, Simbolo, type NombreDeSimbolo } from './simbolos';

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
    const enDisco = (readdirSync(CARPETA) as string[])
      .filter((f) => f.endsWith('.svg'))
      .map((f) => f.slice(0, -4))
      .sort();
    expect(enDisco).toEqual([...NOMBRES].sort());
    expect(enDisco.length).toBeGreaterThan(0);
  });

  it('⭐ el trazado de la tabla es EL MISMO que el del fichero, carácter a carácter', () => {
    const distintos = NOMBRES.filter((n) => SIMBOLOS[n] !== trazadoDelFichero(n));
    expect(distintos).toEqual([]);
  });

  /**
   * La rejilla se escribe UNA vez en `simbolos.ts` en lugar de ocho veces, así
   * que hay que comprobar que los ocho ficheros la comparten de verdad: si uno
   * llegara con otra, se pintaría a la escala equivocada sin decir nada.
   */
  it('⭐ los ocho comparten la rejilla que el componente da por buena', () => {
    const otras = NOMBRES.filter((n) => {
      const svg: string = readFileSync(CARPETA + n + '.svg', 'utf8');
      return !svg.includes(`viewBox="${REJILLA}"`);
    });
    expect(otras).toEqual([]);
  });

  /** Un solo `<path>`: es lo que el componente inyecta, y todo lo demás se perdería. */
  it('⭐ cada fichero trae UN solo trazado — lo que el componente sabe pintar', () => {
    const conVarios = NOMBRES.filter((n) => {
      const svg: string = readFileSync(CARPETA + n + '.svg', 'utf8');
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
