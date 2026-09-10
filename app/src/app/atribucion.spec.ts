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
import { Creditos } from './creditos';

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
   * ⭐ LO QUE SE QUEDA EN LA FRANJA, Y POR QUÉ SÓLO ESTO (10/09, remate 2).
   *
   * Los cuatro titulares vivían aquí desde el 1/09, en una línea corrida de
   * diez píxeles. Ahora viven en `/creditos`, y esta juez cambió de objeto: ya
   * no compra «están los cuatro», compra **la excepción**.
   *
   * ⚠️ Y la excepción no es una preferencia de diseño. [Ley 37/2007] obliga a
   *    citar la fuente y la fecha; no dice dónde, y el patrón normativo es el
   *    aviso legal accesible «de forma permanente, fácil y directa»
   *    [RD 1495/2011]. **La política de teselas de OpenStreetMap sí dice
   *    dónde**: su atribución tiene que verse claramente SOBRE EL MAPA, sin
   *    esconderla tras interfaz. Por eso ésa —y sólo ésa— no se mueve.
   *
   * ⚠️ Lo que esta juez NO puede ver es si se LEE: eso son píxeles, y los miden
   *    `app/e2e/esqueleto.mjs` (L6) y `app/e2e/creditos.mjs`.
   */
  it('⭐ la franja conserva la atribución de OpenStreetMap, que es la que no se puede ir', async () => {
    const p = await pie();
    const enlace = p.querySelector<HTMLAnchorElement>('a[href*="openstreetmap.org/copyright"]');
    expect(enlace).not.toBeNull();
    // [ODbL 1.0, y el ejemplo canónico de Leaflet] la palabra no es opcional.
    expect(enlace?.textContent).toContain('colaboradores');
    expect(p.textContent).toContain('Leaflet');
  });

  /**
   * ⭐ Y LLEVA HASTA EL RESTO. Sin este enlace, mover los titulares a otra
   * página no sería reorganizar un aviso legal: sería quitarlo.
   */
  it('⭐ y lleva a `/creditos`, que es donde está ahora el resto', async () => {
    expect((await pie()).querySelector('a[href="/creditos"]')).not.toBeNull();
  });

  /**
   * ⭐ LA CONTRAPRUEBA DE LA MUDANZA: lo que se fue, se fue DE VERDAD.
   *
   * Si los titulares siguieran también en el pie, las juezas de la página de
   * abajo darían verde igual y nadie sabría que la franja no se encogió. Ésta
   * compra la otra mitad del cambio.
   */
  it('⭐ y los otros tres titulares ya NO están en la franja', async () => {
    const texto = (await pie()).textContent ?? '';
    for (const titular of [
      'Avanza Zaragoza S.A.U.',
      'Punto de Acceso Nacional (MITMA)',
      'Ayuntamiento de Zaragoza',
    ]) {
      expect(texto).not.toContain(titular);
    }
  });
});

/**
 * ⭐ LA PÁGINA DE CRÉDITOS — donde vive ahora el aviso entero (10/09).
 *
 * Las mismas compras que hacía el pie, palabra por palabra, sobre la pantalla
 * nueva. **No se han relajado al mudarse**: si una fórmula legal se cumplía en
 * el pie y aquí no, la mudanza habría perdido una obligación por el camino, que
 * es exactamente el fallo del que nació la juez del MITMS (§ 1.7 declaraba
 * cumplida una atribución que no estaba en ninguna pantalla).
 */
describe('La atribución — la página de créditos', () => {
  async function pagina(): Promise<HTMLElement> {
    await TestBed.configureTestingModule({ imports: [Creditos] }).compileComponents();
    const fixture = TestBed.createComponent(Creditos);
    await fixture.whenStable();
    return fixture.nativeElement as HTMLElement;
  }

  it('⭐ nombra a los CUATRO titulares del dato que se está enseñando', async () => {
    const texto = (await pagina()).textContent ?? '';
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
   * ⭐ LA FÓRMULA LITERAL DEL AYUNTAMIENTO, que el pie no llegaba a escribir.
   *
   * [Aviso legal de la sede de Zaragoza, leído el 01/09/2026] *«Debe citarse la
   * fuente […] "Origen de los datos: Ayuntamiento de Zaragoza"»*. El pie decía
   * «Datos municipales: Ayuntamiento de Zaragoza (Ley 37/2007)», que cita al
   * titular pero no es su fórmula. Aquí cabe entera, y se escribe entera.
   */
  it('⭐ usa la fórmula literal del aviso legal del Ayuntamiento', async () => {
    expect((await pagina()).textContent).toContain('Origen de los datos: Ayuntamiento de Zaragoza');
  });

  /** [Ley 37/2007] El régimen del dato municipal se nombra donde se le cita. */
  it('cita la Ley 37/2007 junto al dato municipal', async () => {
    expect((await pagina()).textContent).toContain('Ley 37/2007');
  });

  /**
   * ⭐ LA FECHA, RESUELTA COMO PUNTERO. El aviso legal municipal exige
   * *«mencionar la fecha de la última actualización»*, y escribirla aquí a mano
   * sería tener dos verdades: la de esta página y la que el motor mide. La
   * obligación se cumple llevando al panel de frescura, que la calcula dato a
   * dato — y que el enlace exista es lo que hace que eso sea cierto.
   */
  it('⭐ resuelve la fecha de actualización como enlace al panel de frescura', async () => {
    const p = await pagina();
    expect(p.querySelector('a[href="/panel"]')).not.toBeNull();
    expect(p.textContent).toContain('fecha de actualización de cada dato');
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
   *    bastar: lo tiene que decir el DOM. Y al mudarse el aviso, esta juez se
   *    ha mudado con él en vez de darse por cumplida en el sitio viejo.
   */
  it('⭐ cumple la fórmula del MITMS: «Powered by MITRAMS», enlace y bruto/procesado', async () => {
    const p = await pagina();
    expect(p.textContent).toContain('Powered by MITRAMS');
    expect(p.querySelector('a[href*="transportes.gob.es"]')).not.toBeNull();
    expect(p.textContent).toContain('bruto y procesado');
  });

  /**
   * [ODbL 1.0, y el ejemplo canónico de Leaflet] La atribución de
   * OpenStreetMap **enlaza a la página de copyright**, y la palabra
   * «colaboradores» no es opcional. Se cumple en tres sitios distintos —el
   * control del mapa, la franja del pie y esta página— y ninguno hereda del
   * otro, así que los tres se compran por separado.
   */
  it('la cartografía enlaza a la página de copyright de OpenStreetMap', async () => {
    const enlace = (await pagina()).querySelector<HTMLAnchorElement>(
      'a[href*="openstreetmap.org/copyright"]',
    );
    expect(enlace).not.toBeNull();
    expect(enlace?.textContent).toContain('colaboradores');
  });

  /** La licencia de la tipografía viaja con la fuente, y la página lleva a ella. */
  it('⭐ la tipografía va con su licencia, y el enlace apunta al fichero que viaja', async () => {
    const p = await pagina();
    expect(p.textContent).toContain('SIL Open Font License');
    expect(p.querySelector('a[href="/fuentes/LICENCIA-OFL.txt"]')).not.toBeNull();
  });

  /**
   * ⭐ LA LÍNEA DE NO-RESPALDO.
   *
   * ⚠️ **Y ésta es la única frase de la página que NO estaba escrita antes en
   *    ninguna parte de este repositorio** — ni en el pie ni en el notices. Se
   *    escribe con las palabras del encargo del 10/09, que la declara condición
   *    del aviso legal del Ayuntamiento. Queda dicho aquí, al lado de la juez,
   *    para que quien la lea sepa que su fuente es ésa y no una medición
   *    nuestra: **transcribirla en su ficha con la fecha está PENDIENTE**.
   */
  it('⭐ dice que los titulares no respaldan esta aplicación', async () => {
    expect((await pagina()).textContent).toContain('no participan, patrocinan ni apoyan');
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
   *
   * ⚠️ **Y ha vuelto a mudarse el 10/09**: del pie del buscador a `/creditos`.
   *    Esta juez se puso ROJA con la mudanza —decía «pie de créditos» y la
   *    ficha ya no lo dice—, que es exactamente para lo que estaba puesta. Se
   *    actualiza al sitio nuevo, y el sitio nuevo lo compra el DOM en el
   *    `describe` de arriba: la ficha y la pantalla dicen lo mismo o alguna de
   *    las dos juezas cae.
   */
  it('⭐ § 1.7 dice que la atribución del NAP se cumple en /creditos, no en el visor', () => {
    const f = ficha('1.7');
    expect(f).toContain('/creditos');
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

  /**
   * ⭐ Y LA CRÓNICA DEL PÁRRAFO, QUE ES LA CIFRA QUE SE QUEDÓ FUERA (10/09).
   *
   * ⚠️ **La juez de arriba NO mentía, y conviene decirlo con precisión: su
   *    alcance era corto.** Lee la línea que dice leer —«una ficha por
   *    conjunto, y hoy son 37»— y compara 37 con 37, que es lo correcto. Lo que
   *    no alcanzaba es la OTRA cifra del mismo recuadro: la crónica
   *    —«este párrafo ha ido diciendo "quince", "veinticuatro"… y ahora treinta
   *    y cinco»—, que va **en letra** y en otra frase. Su regex pide dígitos, y
   *    ahí no hay dígitos.
   *
   * ⚠️ Y el chiste se cuenta solo: **ese párrafo existe para contar la nº5 de la
   *    bitácora** —una regla de releída vale lo que su alcance— y presumía de
   *    haberla resuelto con un guardián. El guardián resolvió la mitad, y la
   *    otra mitad se quedó vieja **dentro de la propia frase que denuncia que
   *    las cosas se quedan viejas**: la crónica se paró en «treinta y cinco»
   *    (5/09) y el notices siguió a 36 (6/09) y a 37 (7/09).
   *
   * Así que el alcance se amplía: TODA cifra de fichas del README queda
   * vigilada, la de dígitos y la de letra.
   */
  describe('⭐ la crónica del recuento, que iba en letra y por eso no se miraba', () => {
    /** Cardinales en letra, 0-99. Es lo que hace falta para leer la crónica. */
    const UNIDADES = [
      'cero', 'uno', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho',
      'nueve', 'diez', 'once', 'doce', 'trece', 'catorce', 'quince',
    ];
    const VEINTI: Record<string, number> = {
      veinte: 20, veintiuno: 21, veintidós: 22, veintitrés: 23, veinticuatro: 24,
      veinticinco: 25, veintiséis: 26, veintisiete: 27, veintiocho: 28, veintinueve: 29,
    };
    const DECENAS: Record<string, number> = {
      treinta: 30, cuarenta: 40, cincuenta: 50, sesenta: 60,
      setenta: 70, ochenta: 80, noventa: 90,
    };

    /** `«treinta y cuatro»` → 34. Devuelve `null` si no sabe leerlo. */
    function enCifra(texto: string): number | null {
      const t = texto.trim().toLowerCase();
      const i = UNIDADES.indexOf(t);
      if (i >= 0) return i;
      if (t in VEINTI) return VEINTI[t]!;
      if (t in DECENAS) return DECENAS[t]!;
      const compuesto = /^([a-záéíóúñ]+) y ([a-záéíóúñ]+)$/.exec(t);
      if (compuesto && compuesto[1]! in DECENAS) {
        const u = UNIDADES.indexOf(compuesto[2]!);
        if (u > 0 && u < 10) return DECENAS[compuesto[1]!]! + u;
      }
      return null;
    }

    /**
     * La serie que la crónica declara, en orden. El recuadro va en cita, así que
     * primero se aplana el `> ` de cada línea: la frase vive partida en dos.
     */
    function laSerie(): number[] {
      const plano = LEEME.replace(/\r?\n>?[ \t]*/g, ' ');
      const parrafo = /Este párrafo ha ido diciendo ([^*]+)\*\*/.exec(plano);
      expect(parrafo).not.toBeNull();
      const dicho = parrafo![1]!;
      const entrecomillados = [...dicho.matchAll(/«([^»]+)»/g)].map((m) => m[1]!);
      // El último no va entrecomillado: «… y ahora treinta y siete».
      const ahora = /y ahora ([a-záéíóúñ ]+?)\s*$/.exec(dicho.trim());
      expect(ahora).not.toBeNull();
      const serie = [...entrecomillados, ahora![1]!];
      // ⚠️ Si el lector no supiera leer una de ellas devolvería `null`, y una
      //    serie con huecos daría verde por comparar `undefined`. Se compra que
      //    las sabe leer TODAS antes de comparar nada.
      const cifras = serie.map(enCifra);
      expect(cifras.filter((x) => x === null).length).toBe(0);
      return cifras as number[];
    }

    it('⭐ la crónica acaba en el número de fichas que hay HOY', () => {
      const fichas = (NOTICES.match(/^### 1\./gm) ?? []).length;
      const serie = laSerie();
      expect(serie[serie.length - 1]).toBe(fichas);
    });

    /**
     * ⭐ Y ES UNA CRÓNICA, NO UNA CIFRA: se enmienda **añadiendo**, que es la ley
     * del documento que cuenta su propia historia. Una serie que dejara de
     * crecer sería alguien borrando lo que dijo antes.
     */
    it('⭐ y la crónica solo crece: se enmienda añadiendo, no borrando', () => {
      const serie = laSerie();
      expect(serie.length).toBeGreaterThan(1);
      for (let i = 1; i < serie.length; i++) {
        expect(serie[i]!).toBeGreaterThan(serie[i - 1]!);
      }
    });
  });

  /** La fila de Avanza del README lleva la decisión, no la pregunta abierta. */
  it('⭐ el README cuenta la decisión sobre Avanza y el pie de créditos', () => {
    expect(LEEME).toContain('Llegadas y recorrido operativo: Avanza Zaragoza S.A.U.');
    expect(LEEME).not.toContain('Con una excepción que se declara y no se ha decidido');
  });
});
