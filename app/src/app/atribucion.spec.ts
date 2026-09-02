// ⚠️ Los dos de Node **existen en tiempo de ejecución** —las pruebas corren
// sobre Node— pero **no están tipados**: el proyecto no trae `@types/node`
// porque las dependencias son CERO. Es el mismo apaño, y por el mismo motivo,
// que el guardián del manifiesto (`manifiesto.spec.ts`).
// @ts-expect-error — sin @types/node, el compilador no conoce el módulo
import { readFileSync, existsSync } from 'node:fs';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Buscador } from './buscador';

/**
 * ⭐ EL GUARDIÁN DE LA ATRIBUCIÓN, y vigila LOS DOS EXTREMOS DE LA MISMA COSA.
 *
 * La atribución no es un párrafo de la documentación: es **una obligación con
 * dos caras**, y ninguna de las dos vale sola.
 *
 * · **En la pantalla** — porque es donde está quien mira, y porque un crédito
 *   que solo vive en un `.md` del repositorio no lo lee ni quien despliega la
 *   página. [Ley 37/2007, y el aviso legal de la sede de Zaragoza leído el
 *   01/09/2026] *«Debe citarse la fuente […] "Origen de los datos: Ayuntamiento
 *   de Zaragoza"»*. [ODbL, y el ejemplo canónico de Leaflet] la palabra
 *   *«colaboradores»* **no es opcional**.
 * · **En el notices** — con la ficha entera de cada fuente: licencia medida,
 *   fecha, campos y lo que trae de roto.
 *
 * Y se vigilan **juntos, en un solo fichero**, porque el fallo que se teme es
 * justo que se separen: alguien retoca la línea de la pantalla y el notices se
 * queda viejo, o al revés. Dos guardianes en dos ficheros no habrían visto la
 * grieta; éste no puede no verla.
 *
 * ⚠️ **Lo que este guardián NO puede medir es el CONTRASTE.** El CSS del
 *    componente no se aplica en jsdom —medido el 1/09, y está en la bitácora—,
 *    así que aquí `getComputedStyle` diría lo que le dé la gana. Esa mitad se
 *    mide en un navegador de verdad: `app/e2e/creditos.mjs`.
 */

/** `process` es de Node y tampoco está tipado aquí. Solo se usa `cwd()`. */
declare const process: { cwd(): string };

const RAIZ = ((): string => {
  // Subiendo hasta dar con el notices, igual que el guardián del manifiesto:
  // en el empaquetado de las pruebas `import.meta.url` no es de esquema
  // `file:`, así que calcular la raíz desde ahí no funciona.
  let d = process.cwd().split('\\').join('/');
  for (let i = 0; i < 6; i++) {
    if (existsSync(d + '/THIRD-PARTY-NOTICES.md')) return d + '/';
    d = d.slice(0, d.lastIndexOf('/'));
  }
  throw new Error('no encuentro THIRD-PARTY-NOTICES.md subiendo desde ' + process.cwd());
})();

const NOTICES: string = readFileSync(RAIZ + 'THIRD-PARTY-NOTICES.md', 'utf8');
const LEEME: string = readFileSync(RAIZ + 'README.md', 'utf8');

/** El texto de una ficha, de su encabezado al siguiente `### `. */
function ficha(numero: string): string {
  const desde = NOTICES.indexOf(`### ${numero} ·`);
  if (desde === -1) return '';
  const hasta = NOTICES.indexOf('\n### ', desde + 1);
  return NOTICES.slice(desde, hasta === -1 ? NOTICES.length : hasta);
}

describe('La atribución — la línea de la pantalla', () => {
  let http: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Buscador],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    // La línea de créditos no pide nada a nadie: si aquí apareciera una
    // petición, sería que se le ha colgado algo a la raíz — y la raíz está
    // fría desde el 22/08 (`app.spec.ts`).
    http.verify();
  });

  async function pie(): Promise<HTMLElement> {
    const fixture = TestBed.createComponent(Buscador);
    await fixture.whenStable();
    const raiz = fixture.nativeElement as HTMLElement;
    return raiz.querySelector('footer.creditos') as HTMLElement;
  }

  it('⭐ existe un pie de créditos, y es un `footer`', async () => {
    expect(await pie()).not.toBeNull();
  });

  /**
   * ⭐ LOS CUATRO TITULARES, y los cuatro por su nombre.
   *
   * No es una lista decorativa: cada uno está aquí porque su dato está en la
   * pantalla. Si mañana entra una quinta fuente y su titular no sube a esta
   * línea, esta prueba no lo verá —no puede—; lo que sí impide es que uno de
   * los cuatro que YA están se caiga sin que nadie se entere.
   */
  it('⭐ nombra a los CUATRO titulares del dato que se está enseñando', async () => {
    const texto = (await pie()).textContent ?? '';
    for (const titular of [
      'Avanza Zaragoza S.A.U.',
      'Punto de Acceso Nacional (MITMA)',
      'Ayuntamiento de Zaragoza',
      'colaboradores de OpenStreetMap',
    ]) {
      expect(texto).toContain(titular);
    }
  });

  /**
   * [ODbL 1.0, y el ejemplo canónico de Leaflet] La atribución de
   * OpenStreetMap **enlaza a la página de copyright**. Ya se cumple en el
   * control del mapa (`mapa.spec.ts`), y se vuelve a cumplir aquí: son dos
   * sitios distintos y el crédito del pie no hereda el del mapa.
   */
  it('la cartografía enlaza a la página de copyright de OpenStreetMap', async () => {
    const enlace = (await pie()).querySelector<HTMLAnchorElement>(
      'a[href*="openstreetmap.org/copyright"]',
    );
    expect(enlace).not.toBeNull();
    expect(enlace?.textContent).toContain('colaboradores');
  });

  /** [Ley 37/2007] El régimen del dato municipal se nombra donde se le cita. */
  it('cita la Ley 37/2007 junto al dato municipal', async () => {
    expect((await pie()).textContent).toContain('Ley 37/2007');
  });

  /**
   * ⭐ LA FÓRMULA DEL NAP, QUE ES LA ÚNICA DE LAS CUATRO QUE ESTÁ ESCRITA.
   *
   * OpenStreetMap pide una palabra y un enlace; el Ayuntamiento pide una
   * frase; Avanza no pide nada porque prohíbe. **El MITMS sí pide una fórmula
   * completa** [§ 1.7 del notices]: *«Powered by MITRAMS»* con enlace a
   * `transportes.gob.es`, la cita del ministerio como fuente, e **indicación
   * de si el dato es bruto o procesado**.
   *
   * ⚠️ Esta prueba nace de un incumplimiento real: § 1.7 declaraba la
   *    atribución *«colgada de la capa de trazados»* —la del visor, retirado
   *    el 22/08— y desde entonces **no estaba en ninguna pantalla**. La ficha
   *    decía «cumplida» y era mentira. Que lo diga una ficha no vuelve a
   *    bastar: lo tiene que decir el DOM.
   */
  it('⭐ cumple la fórmula del MITMS: «Powered by MITRAMS», enlace y bruto/procesado', async () => {
    const p = await pie();
    expect(p.textContent).toContain('Powered by MITRAMS');
    expect(p.querySelector('a[href*="transportes.gob.es"]')).not.toBeNull();
    expect(p.textContent).toContain('bruto y procesado');
  });
});

describe('La atribución — las fichas del notices y el recuento del README', () => {
  /**
   * ⭐ LA DECISIÓN DE ANTONIO, EN LAS DOS FICHAS DE AVANZA (1/09).
   *
   * Las dos nacieron el 31/08 con la pregunta abierta —el aviso legal prohíbe
   * la reutilización y aun así hay bytes suyos en los *fixtures*—, y § 1.24 lo
   * dejaba escrito: *«no se ha decidido en esta ficha»*. Ya está decidido, y lo
   * que esta prueba impide es que la decisión viva **solo en un commit**: tiene
   * que estar en la ficha, al lado del texto legal que la motivó.
   */
  it('⭐ § 1.24 y § 1.25 llevan la fila «Decisión (1/09)»', () => {
    for (const n of ['1.24', '1.25']) {
      expect(ficha(n)).toContain('**Decisión (1/09)**');
    }
  });

  /**
   * El aviso legal **transcrito**, no resumido: es lo que permite que quien lea
   * la ficha juzgue la decisión por su cuenta en vez de fiarse de ella.
   */
  it('§ 1.24 conserva el aviso legal de Avanza literal, con su fecha', () => {
    const f = ficha('1.24');
    expect(f).toContain('extracción y/o reutilización');
    expect(f).toContain('01/09/2026');
  });

  /**
   * ⭐ LA FICHA NUEVA: la fuente municipal del transporte urbano.
   *
   * Se sondeó el 1/09 y **no se usa**. Se ficha igual, y por eso: una
   * alternativa lícita que se midió y se descartó vale tanto como una fuente en
   * uso — el día que Avanza cierre la puerta, lo que decide es esta ficha.
   *
   * Los campos son los del modelo de § 1.23, que es la ficha canónica de una
   * fuente que se consulta y no se copia.
   */
  it('⭐ § 1.26 ficha la fuente municipal con todos los campos del modelo', () => {
    const f = ficha('1.26');
    expect(f).toContain('Autobús Urbano');
    for (const campo of [
      '**Qué es**',
      '**Titular**',
      '**Fuente**',
      '**Petición**',
      '**Sondeada**',
      '**Licencia**',
      '**Atribución exigida**',
      '**Campos**',
      '**¿Está en este repo?**',
    ]) {
      expect(f).toContain(campo);
    }
  });

  it('§ 1.26 dice que se sondeó y que NO se usa hoy', () => {
    const f = ficha('1.26');
    expect(f).toContain('Ley 37/2007');
    expect(f).toContain('NO SE USA HOY');
    expect(f).toContain('no se ha adoptado');
  });

  /**
   * ⭐ Y LA FICHA DEL GTFS DICE DÓNDE SE CUMPLE, Y ES UN SITIO QUE EXISTE.
   *
   * La fila «Dónde está cumplida» de § 1.7 apuntaba a la capa de trazados del
   * visor, que se fue el 22/08. Un puntero a un sitio borrado es peor que no
   * tener puntero: da por hecha una obligación legal que nadie cumple.
   */
  it('⭐ § 1.7 dice que la atribución del NAP se cumple en el pie, no en el visor', () => {
    const f = ficha('1.7');
    expect(f).toContain('pie de créditos');
    expect(f).not.toContain('| **Dónde está cumplida** | Colgada de la capa de trazados');
  });

  /**
   * ⭐ «El resto del dato» es SIEMPRE LA ÚLTIMA, y por eso se compra así.
   *
   * ⚠️ Esta juez nombraba el número —«se ha corrido a § 1.27»— y se puso roja el
   *    2/09 al entrar las cuatro fichas del coche, que la empujaron a la § 1.31.
   *    Estaba comprando la cosa equivocada: lo que importa de esa ficha no es
   *    qué número tiene, sino **que cierra la lista**. Renumerarla a mano cada
   *    vez que entra un dato era trabajo garantizado y un rojo garantizado.
   */
  it('⭐ «El resto del dato» cierra la lista, sea cual sea su número', () => {
    const fichas = [...NOTICES.matchAll(/^### (1\.\d+) · (.+)$/gm)].map((m) => ({
      n: Number(m[1]!.slice(2)),
      titulo: m[2]!,
    }));
    expect(fichas.length).toBeGreaterThan(0);
    expect(fichas[fichas.length - 1]!.titulo).toContain('El resto del dato');
    // Es UNA sola, la de cierre.
    expect(fichas.filter((x) => x.titulo.includes('El resto del dato')).length).toBe(1);
    // Y los números van seguidos: ni saltos ni repetidos.
    expect(fichas.map((x) => x.n)).toEqual(fichas.map((_, i) => i + 1));
  });

  /**
   * ⭐ EL RECUENTO DEL README CONTRA EL GREP DEL NOTICES.
   *
   * El propio README dice cómo se cuenta —`grep -c '^### 1\.'`— y hasta cuenta
   * su propia historia: *«este párrafo ha ido diciendo «quince»,
   * «veinticuatro»…»*, con la entrada nº5 de la bitácora detrás. Esto es esa
   * lección convertida en instrumento: **el número lo verifica una máquina**,
   * no la esperanza de que alguien vuelva a leer la portada.
   */
  it('⭐ el número de fichas que declara el README es el que hay', () => {
    const fichas = (NOTICES.match(/^### 1\./gm) ?? []).length;
    const dicho = /una ficha por conjunto, y hoy son (\d+)\*\*/.exec(LEEME);
    expect(dicho).not.toBeNull();
    expect(Number(dicho?.[1])).toBe(fichas);
  });

  /** La fila de Avanza del README lleva la decisión, no la pregunta abierta. */
  it('⭐ el README cuenta la decisión sobre Avanza y el pie de créditos', () => {
    expect(LEEME).toContain('Llegadas y recorrido operativo: Avanza Zaragoza S.A.U.');
    expect(LEEME).not.toContain('Con una excepción que se declara y no se ha decidido');
  });
});
