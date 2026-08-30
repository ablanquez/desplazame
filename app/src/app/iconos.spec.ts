import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import type { Portal, Sitio, Trayecto, Via } from '@desplazame/tipos';
import { Buscador } from './buscador';
import {
  AZUL,
  MORADO,
  MOSTAZA,
  CAMINO_COLEGIO,
  CAMINO_GUARDERIA,
  CAMINO_UNIVERSIDAD,
  CAMINO_LIBRO,
  CAMINO_CHINCHETA,
  CAMINO_CRUZ,
  CAMINO_CUADRADO,
  CAMINO_H,
  COLOR_DESTINO,
  COLOR_NEUTRO,
  COLOR_ORIGEN,
  COLOR_SITIO,
} from './iconos';

/**
 * ⭐ LOS ICONOS DE CAPA en las tres casas donde se ven.
 *
 * 1. **Las sugerencias** del autocompletar, a la izquierda de cada línea.
 * 2. **Los marcadores del mapa**, en los dos extremos de la ruta.
 * 3. **El itinerario**, en las líneas de salida y de llegada.
 *
 * Lo que se vigila no es que «haya un dibujo»: es que el dibujo **diga la
 * verdad**. Una chincheta donde hay una farmacia, o el azul del origen en el
 * destino, es peor que no pintar nada — un icono se cree sin leerlo.
 *
 * Por eso las pruebas miran las cuatro cosas que un icono puede mentir por
 * separado: el `data-icono` que declara la capa, el `data-papel`, el `fill` y
 * **el camino del dibujo**. Los cuatro salen de sitios distintos del código, y
 * cualquiera de ellos puede desmentir a los otros tres sin que se note: la
 * forma se añadió el 23/08 al descubrir que `caminoDeCapa` podía devolver
 * siempre la chincheta con las pruebas en verde.
 */

const BURGOS: Via = {
  codigo: '5140',
  nombre: 'CALLE BURGOS',
  limpio: 'CALLE BURGOS',
  nucleo: null,
  tipo: 'CL',
  portales: 31,
};

const PORTALES_BURGOS: readonly Portal[] = [{ codigo: 'Portales.5140a', numero: '2' }];

const FARMACIA: Sitio = {
  codigo: 'Farmacias.8691',
  presentacion: 'Farmacia · Avda. de Navarra, 65',
  categoria: 'Farmacia',
  tipo: 'farmacia',
};

/** Un trayecto de mentira con geometría: lo que hace falta para los marcadores. */
const TRAYECTO: Trayecto = {
  modo: 'andando',
  metros: 120,
  segundos: 86,
  avisos: [],
  // Andando es un tramo y cubre la geometría entera: sus tres vértices.
  tramos: [{ comoSeVa: 'andando', desde: 0, hasta: 2, metros: 120, segundos: 86, hito: null }],
  geometria: [
    [41.6561, -0.8773],
    [41.6516, -0.879],
    [41.6425, -0.8865],
  ],
  pasos: [
    {
      giro: 'salida',
      texto: 'Sal de aquí y ve hacia el este',
      partes: [{ papel: 'texto', texto: 'Sal de aquí y ve hacia el este' }],
      metros: 120,
    },
    {
      giro: 'llegada',
      texto: 'Has llegado',
      partes: [{ papel: 'texto', texto: 'Has llegado' }],
      metros: 0,
    },
  ],
};

/** Uno con paso de enmedio: para comprobar que el icono va SOLO en las puntas. */
const TRES_PASOS: Trayecto = {
  ...TRAYECTO,
  pasos: [
    TRAYECTO.pasos[0]!,
    {
      giro: 'derecha',
      texto: 'Gira a la derecha',
      partes: [{ papel: 'texto', texto: 'Gira a la derecha' }],
      metros: 40,
    },
    TRAYECTO.pasos[1]!,
  ],
};

const CENTRO: Sitio = {
  codigo: 'CentrosSalud.9113',
  presentacion: 'Centro de Salud Actur Sur · C/ Gertrudis Gómez de Avellaneda, 3',
  categoria: 'Centro de salud',
  tipo: 'centro-salud',
};

const HOSPITAL: Sitio = {
  codigo: 'Hospitales.9040',
  presentacion: 'Hospital Universitario Miguel Servet · Avda. Isabel La Católica, 3',
  categoria: 'Hospital',
  tipo: 'hospital',
};

/** La biblioteca juez de la interfaz: la Cubit, que es la del motor. */
const BIBLIOTECA: Sitio = {
  codigo: 'Bibliotecas.4946',
  presentacion: 'Biblioteca para Jóvenes Cubit · C/ Mas de las Matas, 20',
  categoria: 'Biblioteca',
  tipo: 'biblioteca',
};

/**
 * Los tres jueces de educación (27/08). Ninguno de los tres está entre los
 * rescatados: lo que se mira aquí es el dibujo, y un sitio que además se mueve
 * mezclaría dos historias en la misma prueba.
 */
const COLEGIO: Sitio = {
  codigo: 'Colegios.591',
  presentacion: 'C.E.I.P. María Moliner · C/ Miraflores, 10',
  categoria: 'Colegio o instituto',
  tipo: 'colegio',
};

const GUARDERIA: Sitio = {
  codigo: 'Guarderias.8512',
  presentacion: 'C.E.I. Chicotes · C/ Balbino Orensanz, 55',
  categoria: 'Guardería',
  tipo: 'guarderia',
};

const UNIVERSIDAD: Sitio = {
  codigo: 'Universidades.8226',
  presentacion: 'Facultad de Veterinaria · C/ Miguel Servet, 177',
  categoria: 'Universidad',
  tipo: 'universidad',
};

const campoDe = (raiz: HTMLElement, n: string): HTMLInputElement =>
  raiz.querySelector<HTMLInputElement>(`input[name="${n}"]`)!;

describe('⭐ LOS ICONOS de capa, en las tres casas', () => {
  let http: HttpTestingController;
  let fixture: ReturnType<typeof TestBed.createComponent<Buscador>>;
  let raiz: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Buscador],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(Buscador);
    await fixture.whenStable();
    raiz = fixture.nativeElement as HTMLElement;
  });

  afterEach(() => {
    for (const r of http.match((q) => q.url.startsWith('/api/'))) r.flush([]);
    http.verify();
  });

  async function teclear(nombre: string, texto: string): Promise<void> {
    const campo = campoDe(raiz, nombre);
    campo.value = texto;
    campo.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    await new Promise((sigue) => setTimeout(sigue, 300));
    fixture.detectChanges();
  }

  async function contestar(vias: readonly Via[], sitios: readonly Sitio[]): Promise<void> {
    for (const r of http.match((q) => q.url.startsWith('/api/vias'))) r.flush(vias);
    for (const r of http.match((q) => q.url.startsWith('/api/sitios'))) r.flush(sitios);
    await new Promise((sigue) => setTimeout(sigue, 0));
    fixture.detectChanges();
  }

  function pulsar(campo: string, capa: string): void {
    raiz
      .querySelector<HTMLElement>(`[data-campo="${campo}"] .sugerencia[data-capa="${capa}"]`)!
      .dispatchEvent(new MouseEvent('mousedown'));
    fixture.detectChanges();
  }

  async function drenarEco(): Promise<void> {
    await new Promise((sigue) => setTimeout(sigue, 250));
    fixture.detectChanges();
    for (const r of http.match((q) => q.url.startsWith('/api/vias'))) r.flush([]);
    for (const r of http.match((q) => q.url.startsWith('/api/sitios'))) r.flush([]);
    fixture.detectChanges();
  }


  /**
   * ⭐ Pone el TIPO de un campo, que desde el 24/08 hay que decirlo antes de
   * buscar un sitio: el desplegable filtra el cajetín a una sola categoría y
   * la búsqueda mezclada murió (decisión de Antonio, firmada). Sin esto, el
   * campo pide vías y no llega a preguntar por sitios.
   */
  async function ponerTipo(campo: string, tipo: string): Promise<void> {
    const cual = campo.replace('calle', '');
    const select = raiz.querySelector<HTMLSelectElement>(`select[name="tipo${cual}"]`)!;
    select.value = tipo;
    select.dispatchEvent(new Event('change'));
    fixture.detectChanges();
    await new Promise((sigue) => setTimeout(sigue, 0));
    fixture.detectChanges();
  }

  async function elegirSitioEn(campo: string, sitio: Sitio = FARMACIA): Promise<void> {
    await ponerTipo(campo, sitio.tipo);
    await teclear(campo, 'navarra');
    await contestar([], [sitio]);
    pulsar(campo, 'sitio');
    await drenarEco();
  }

  async function elegirDireccionEn(campo: string, portal: string): Promise<void> {
    await teclear(campo, 'burgos');
    await contestar([BURGOS], []);
    pulsar(campo, 'via');
    await drenarEco();
    for (const r of http.match(`/api/portales?via=${BURGOS.codigo}`)) r.flush(PORTALES_BURGOS);
    await new Promise((sigue) => setTimeout(sigue, 0));
    fixture.detectChanges();
    const casilla = campoDe(raiz, portal);
    casilla.value = '2';
    casilla.dispatchEvent(new Event('input'));
    await new Promise((sigue) => setTimeout(sigue, 0));
    fixture.detectChanges();
    casilla
      .closest('app-selector-portal')!
      .querySelector<HTMLElement>('.portal')!
      .dispatchEvent(new MouseEvent('mousedown'));
    await new Promise((sigue) => setTimeout(sigue, 0));
    fixture.detectChanges();
  }

  /** Los iconos de un desplegable, en orden, con lo que dicen. */
  function iconosDe(campo: string): { icono: string; papel: string; color: string }[] {
    const lista = raiz.querySelectorAll<SVGElement>(
      `[data-campo="${campo}"] .sugerencia svg[data-icono]`,
    );
    return Array.from(lista).map((svg) => ({
      icono: svg.getAttribute('data-icono') ?? '',
      papel: svg.getAttribute('data-papel') ?? '',
      color: svg.querySelector('path')?.getAttribute('fill') ?? '',
    }));
  }

  // ── CASA 1: LAS SUGERENCIAS ────────────────────────────────────────────────

  it('⭐ cada sugerencia lleva su icono: chincheta la calle, cruz el sitio', async () => {
    // ⚠️ Esto era UNA lista con las dos capas dentro. Desde el buscador por
    // tipos (24/08) una lista es de una sola clase, así que se miran las dos
    // listas — que es lo que de verdad se ve ahora.
    //
    // El `data-icono` dice QUÉ ES y no de qué índice salió: decía «sitio»
    // hasta que hubo tres clases de sitio y dejó de identificar un dibujo.
    await teclear('calleDestino', 'navarra');
    await contestar([BURGOS], []);
    expect(iconosDe('calleDestino')).toEqual([
      { icono: 'via', papel: 'ninguno', color: COLOR_NEUTRO },
    ]);
    await drenarEco();

    await ponerTipo('calleDestino', 'farmacia');
    await teclear('calleDestino', 'navarra');
    await contestar([], [FARMACIA]);
    expect(iconosDe('calleDestino')).toEqual([
      { icono: 'farmacia', papel: 'ninguno', color: COLOR_SITIO },
    ]);
  });

  it('el icono va A LA IZQUIERDA del nombre, no detrás', async () => {
    // El sitio en la línea es la mitad del encargo: un icono detrás del texto
    // se lee DESPUÉS, y entonces no ahorra la lectura que venía a ahorrar.
    // Es orden del DOM, que es lo único que una prueba sin pintar puede ver.
    await ponerTipo('calleDestino', 'farmacia');
    await teclear('calleDestino', 'navarra');
    await contestar([], [FARMACIA]);

    const linea = raiz.querySelector<HTMLElement>('[data-campo="calleDestino"] .sugerencia')!;
    const hijos = Array.from(linea.children).map((e) => e.tagName.toLowerCase());
    expect(hijos[0]).toBe('app-icono-capa');
    expect(hijos.indexOf('app-icono-capa')).toBeLessThan(
      hijos.findIndex((t) => t === 'span'),
    );
  });

  it('⭐ la chincheta de una SUGERENCIA es NEUTRA en los dos campos', async () => {
    // Era la prueba de «azul en el origen, magenta en el destino», y la
    // doctrina la derogó: en la lista todavía no hay papel. Pintar de verde lo
    // que está en el campo de origen sería afirmar algo que no se sabe hasta
    // que se pulsa — y que deja de ser cierto en cuanto se usa el ⇅.
    for (const campo of ['calleOrigen', 'calleDestino']) {
      await teclear(campo, 'burgos');
      await contestar([BURGOS], []);
      expect(iconosDe(campo)).toEqual([
        { icono: 'via', papel: 'ninguno', color: COLOR_NEUTRO },
      ]);
      await drenarEco();
    }
  });

  it('⭐ LAS SIETE CLASES DE SITIO se dibujan distinto', async () => {
    // Es lo que la segunda tanda añade y lo que puede mentir: tres clases con
    // el mismo dibujo serían tres cosas que parecen la misma. Se miran las dos
    // señas a la vez —la forma y el color—, porque cada una sale de una tabla
    // distinta y cualquiera puede desmentir a la otra.
    // ⚠️ Las tres iban en una lista hasta el 24/08. Ya no caben juntas —una
    // lista es de una sola clase—, así que se miran una a una y se junta el
    // resultado: lo que se afirma sigue siendo lo mismo, que las tres se
    // dibujan distinto.
    const dibujos: unknown[] = [];
    for (const sitio of [FARMACIA, CENTRO, HOSPITAL, BIBLIOTECA, COLEGIO, GUARDERIA, UNIVERSIDAD]) {
      await ponerTipo('calleDestino', sitio.tipo);
      await teclear('calleDestino', 'salud');
      await contestar([], [sitio]);
      const svg = raiz.querySelector<SVGElement>('[data-campo="calleDestino"] .sugerencia svg')!;
      dibujos.push([
        svg.getAttribute('data-icono'),
        svg.querySelector('path')?.getAttribute('d'),
        svg.querySelector('path')?.getAttribute('fill'),
      ]);
      await drenarEco();
    }

    expect(dibujos).toEqual([
      ['farmacia', CAMINO_CRUZ, COLOR_SITIO],
      ['centro-salud', CAMINO_CRUZ, AZUL],
      ['hospital', CAMINO_CUADRADO, AZUL],
      // ⭐ La cuarta (25/08). Ni la forma ni el color se repiten: el libro
      // abierto es el glifo de biblioteca en osm-carto y en Maki, y el morado
      // es de la familia de cultura, que no es ninguna de las otras dos.
      ['biblioteca', CAMINO_LIBRO, MORADO],
      // ⭐ Y las tres de educación (27/08). Comparten COLOR —son una familia, y
      // el color va por familia— y no comparten FORMA con nadie, que es lo que
      // las distingue [#2787: la forma distingue, no solo el color]. Que las
      // tres lleven el mismo mostaza es lo que esta prueba afirma A PROPÓSITO:
      // si un día alguien le pone tres tonos, aquí se ve.
      ['colegio', CAMINO_COLEGIO, MOSTAZA],
      ['guarderia', CAMINO_GUARDERIA, MOSTAZA],
      ['universidad', CAMINO_UNIVERSIDAD, MOSTAZA],
    ]);

    // ⭐ Y las siete clases dan SEIS formas, no siete, y el número es la
    // doctrina escrita: **farmacia y centro de salud comparten la cruz** y las
    // separa el color —verde de farmacia, azul sanitario—, que es la única
    // pareja que lo hace. Las otras cinco formas no se repiten con nadie.
    // Contar aquí impide las dos averías simétricas: que una clase nueva copie
    // el camino de otra (bajaría de 6), y que alguien le dé una forma propia a
    // una de las dos cruces sin decirlo (subiría a 7).
    const formas = new Set(dibujos.map((d) => (d as string[])[1]));
    expect(formas.size).toBe(6);
  });

  it('⭐ y el HOSPITAL lleva su H blanca encima, que es la señal entera', async () => {
    // El único icono de dos piezas. Sin la H, un cuadrado azul no es la S-23:
    // es un cuadrado azul. Y la H tiene que ir BLANCA — es lo que la hace
    // legible sobre el azul.
    await ponerTipo('calleDestino', 'hospital');
    await teclear('calleDestino', 'salud');
    await contestar([], [HOSPITAL]);

    const svg = raiz.querySelector<SVGElement>('[data-campo="calleDestino"] .sugerencia svg')!;
    const caminos = Array.from(svg.querySelectorAll('path')).map((p) => [
      p.getAttribute('d'),
      p.getAttribute('fill'),
    ]);
    expect(caminos).toEqual([
      [CAMINO_CUADRADO, AZUL],
      [CAMINO_H, '#ffffff'],
    ]);
    // Y la cruz NO lleva nada encima: un solo camino.
    await drenarEco();
    await ponerTipo('calleOrigen', 'centro-salud');
    await teclear('calleOrigen', 'salud');
    await contestar([], [CENTRO]);
    const cruz = raiz.querySelector<SVGElement>('[data-campo="calleOrigen"] .sugerencia svg')!;
    expect(cruz.querySelectorAll('path').length).toBe(1);
  });

  it('⭐ EL LIBRO ABIERTO son DOS páginas y un lomo entre ellas', async () => {
    // [osm-carto symbols/amenity/library.svg · Maki icons/library.svg] En los
    // dos mapas de referencia el glifo de biblioteca es un libro abierto: dos
    // hojas simétricas que salen de un lomo central. La convención es ESA, no
    // el fichero, así que el camino está trazado aquí y no copiado.
    //
    // Lo que se comprueba es la simetría, que es lo que lo hace legible a 14 px:
    // el camino tiene DOS subcaminos —dos `M`— y el hueco del lomo queda en
    // medio. Un solo subcamino sería un libro cerrado, que es otro glifo.
    await ponerTipo('calleDestino', 'biblioteca');
    await teclear('calleDestino', 'cubit');
    await contestar([], [BIBLIOTECA]);

    const svg = raiz.querySelector<SVGElement>('[data-campo="calleDestino"] .sugerencia svg')!;
    const caminos = Array.from(svg.querySelectorAll('path'));
    // Una sola pieza, como la cruz: el lomo no se pinta, se deja sin pintar.
    expect(caminos.length).toBe(1);
    const d = caminos[0]!.getAttribute('d')!;
    expect(d.match(/M/g)?.length).toBe(2);
    expect(caminos[0]!.getAttribute('fill')).toBe(MORADO);
  });

  it('⭐ una biblioteca es MORADA en los dos papeles', async () => {
    await elegirSitioEn('calleOrigen', BIBLIOTECA);
    await elegirDireccionEn('calleDestino', 'portalDestino');
    expect(await generarYMirarElMapa()).toEqual([
      { icono: 'biblioteca', papel: 'origen', color: MORADO },
      { icono: 'via', papel: 'destino', color: COLOR_DESTINO },
    ]);
  });

  it('⭐ un hospital es AZUL en los dos papeles, como la farmacia es verde', async () => {
    // El papel pinta la chincheta, no la clase: un hospital no cambia de
    // identidad al cruzarlo con el ⇅.
    await elegirSitioEn('calleOrigen', HOSPITAL);
    await elegirDireccionEn('calleDestino', 'portalDestino');
    expect(await generarYMirarElMapa()).toEqual([
      { icono: 'hospital', papel: 'origen', color: AZUL },
      { icono: 'via', papel: 'destino', color: COLOR_DESTINO },
    ]);
  });

  it('⭐ LA DOCTRINA: verde el origen, rojo el destino [osm.org]', async () => {
    // La prueba que fija la convención, para que no vuelva a moverse por gusto.
    // El verde del origen y el de la farmacia son EL MISMO a sabiendas: lo que
    // los separa es la forma, no el color.
    expect(COLOR_ORIGEN).toBe('#1a7f37');
    expect(COLOR_DESTINO).toBe('#c1121f');
    expect(COLOR_SITIO).toBe(COLOR_ORIGEN);
    expect(COLOR_NEUTRO).not.toBe(COLOR_ORIGEN);
    expect(COLOR_NEUTRO).not.toBe(COLOR_DESTINO);
    // El azul sanitario, uno solo y distinto de los otros tres.
    expect(AZUL).toBe('#0d47a1');
    // Y el morado de cultura, distinto de los cuatro anteriores.
    expect(MORADO).toBe('#6a1b9a');
    expect(new Set([COLOR_ORIGEN, COLOR_DESTINO, COLOR_NEUTRO, AZUL, MORADO]).size).toBe(5);
  });

  it('la cruz de farmacia es VERDE en los dos campos: el papel no la cambia', async () => {
    await ponerTipo('calleOrigen', 'farmacia');
    await teclear('calleOrigen', 'navarra');
    await contestar([], [FARMACIA]);
    const enOrigen = iconosDe('calleOrigen');
    await drenarEco();

    await ponerTipo('calleDestino', 'farmacia');
    await teclear('calleDestino', 'navarra');
    await contestar([], [FARMACIA]);
    const enDestino = iconosDe('calleDestino');

    expect(enOrigen.map((i) => i.color)).toEqual([COLOR_SITIO]);
    expect(enDestino.map((i) => i.color)).toEqual([COLOR_SITIO]);
  });

  // ── CASA 2: LOS MARCADORES DEL MAPA ────────────────────────────────────────

  /** Genera la ruta con los dos lados ya puestos y devuelve los marcadores. */
  async function generarYMirarElMapa(): Promise<
    { icono: string; papel: string; color: string }[]
  > {
    raiz.querySelector<HTMLButtonElement>('.generar')!.click();
    fixture.detectChanges();
    http.expectOne('/api/ruta').flush(TRAYECTO);
    await new Promise((sigue) => setTimeout(sigue, 0));
    fixture.detectChanges();
    const marcas = raiz.querySelectorAll<SVGElement>('.leaflet-marker-icon svg[data-icono]');
    return Array.from(marcas).map((svg) => ({
      icono: svg.getAttribute('data-icono') ?? '',
      papel: svg.getAttribute('data-papel') ?? '',
      color: svg.querySelector('path')?.getAttribute('fill') ?? '',
    }));
  }

  it('⭐ el mapa pone DOS marcadores, uno por extremo, con su color', async () => {
    await elegirDireccionEn('calleOrigen', 'portalOrigen');
    await elegirDireccionEn('calleDestino', 'portalDestino');

    expect(await generarYMirarElMapa()).toEqual([
      { icono: 'via', papel: 'origen', color: COLOR_ORIGEN },
      { icono: 'via', papel: 'destino', color: COLOR_DESTINO },
    ]);
  });

  it('⭐ con una farmacia en el origen, el marcador es la cruz verde', async () => {
    await elegirSitioEn('calleOrigen');
    await elegirDireccionEn('calleDestino', 'portalDestino');

    expect(await generarYMirarElMapa()).toEqual([
      { icono: 'farmacia', papel: 'origen', color: COLOR_SITIO },
      { icono: 'via', papel: 'destino', color: COLOR_DESTINO },
    ]);
  });

  it('regenerar no acumula marcadores', async () => {
    await elegirDireccionEn('calleOrigen', 'portalOrigen');
    await elegirDireccionEn('calleDestino', 'portalDestino');

    expect((await generarYMirarElMapa()).length).toBe(2);
    expect((await generarYMirarElMapa()).length).toBe(2);
  });

  // ── CASA 3: EL ITINERARIO ──────────────────────────────────────────────────
  //
  // ⚠️ EL ITINERARIO SON DOS COSAS, y hasta el 23/08 aquí solo se miraba una.
  // Arriba va la CABECERA —`header.ruta`, dos líneas con «de dónde» y «a
  // dónde»—; debajo va LA LISTA DE PASOS, que es lo que se lee para andar. El
  // guardián de abajo apuntaba a `.ruta__origen`, que es la cabecera, y la dio
  // por buena: los pasos primero y último llevaban el ◉ y el ⚑ a secas. Un
  // volcado que miraba el mismo sitio equivocado confirmó al guardián, y dos
  // instrumentos apuntando al mismo error se dan la razón entre ellos.
  //
  // Por eso ahora hay dos pruebas y cada una dice EN SU NOMBRE dónde mira.

  it('la CABECERA lleva el icono de cada extremo', async () => {
    await elegirSitioEn('calleOrigen');
    await elegirDireccionEn('calleDestino', 'portalDestino');
    await generarYMirarElMapa();

    const salida = raiz.querySelector<SVGElement>('.ruta__origen svg[data-icono]');
    const llegada = raiz.querySelector<SVGElement>('.ruta__destino svg[data-icono]');

    expect(salida?.getAttribute('data-icono')).toBe('farmacia');
    expect(salida?.querySelector('path')?.getAttribute('fill')).toBe(COLOR_SITIO);
    expect(llegada?.getAttribute('data-icono')).toBe('via');
    expect(llegada?.querySelector('path')?.getAttribute('fill')).toBe(COLOR_DESTINO);
  });

  it('⭐ LOS PASOS primero y último llevan el icono de su extremo', async () => {
    // Es el defecto que Antonio vio en vivo: la cabecera lo tenía y los pasos
    // no. Se ancla por el GIRO y no por el índice, que es lo que significa: el
    // paso de `salida` es el del origen y el de `llegada`, el del destino. En
    // una ruta trivial —el mismo portal en los dos extremos— hay UN paso, de
    // `llegada`, y le toca el icono del destino: la lista sigue cuadrando.
    await elegirSitioEn('calleOrigen');
    await elegirDireccionEn('calleDestino', 'portalDestino');
    await generarYMirarElMapa();

    const pasos = raiz.querySelectorAll<HTMLElement>('.pasos__lista .paso');
    expect(pasos.length).toBe(2);

    const primero = pasos[0]!.querySelector<SVGElement>('svg[data-icono]');
    const ultimo = pasos[pasos.length - 1]!.querySelector<SVGElement>('svg[data-icono]');

    expect(primero?.getAttribute('data-icono')).toBe('farmacia');
    expect(primero?.getAttribute('data-papel')).toBe('origen');
    expect(ultimo?.getAttribute('data-icono')).toBe('via');
    expect(ultimo?.getAttribute('data-papel')).toBe('destino');
  });

  it('⭐ LA BIBLIOTECA en la casa 3: cabecera y pasos, con su libro', async () => {
    // La tercera casa con la clase nueva. Las otras dos pruebas del itinerario
    // usan una farmacia, y una tabla de dibujos mal puesta se vería solo con la
    // clase que no está probada aquí — que hasta hoy era esta.
    await elegirSitioEn('calleOrigen', BIBLIOTECA);
    await elegirDireccionEn('calleDestino', 'portalDestino');
    await generarYMirarElMapa();

    const cabecera = raiz.querySelector<SVGElement>('.ruta__origen svg[data-icono]');
    expect(cabecera?.getAttribute('data-icono')).toBe('biblioteca');
    expect(cabecera?.querySelector('path')?.getAttribute('d')).toBe(CAMINO_LIBRO);
    expect(cabecera?.querySelector('path')?.getAttribute('fill')).toBe(MORADO);

    const primero = raiz
      .querySelectorAll<HTMLElement>('.pasos__lista .paso')[0]!
      .querySelector<SVGElement>('svg[data-icono]');
    expect(primero?.getAttribute('data-icono')).toBe('biblioteca');
    expect(primero?.getAttribute('data-papel')).toBe('origen');
    expect(primero?.querySelector('path')?.getAttribute('d')).toBe(CAMINO_LIBRO);
  });

  it('⭐ y los pasos DE ENMEDIO no llevan icono: no son extremos', async () => {
    // Sin esto, «que los pasos lleven icono» se podría cumplir poniéndoselo a
    // todos, y entonces el icono dejaría de señalar las dos puntas.
    await elegirDireccionEn('calleOrigen', 'portalOrigen');
    await elegirDireccionEn('calleDestino', 'portalDestino');
    raiz.querySelector<HTMLButtonElement>('.generar')!.click();
    fixture.detectChanges();
    http.expectOne('/api/ruta').flush(TRES_PASOS);
    await new Promise((sigue) => setTimeout(sigue, 0));
    fixture.detectChanges();

    const conIcono = Array.from(
      raiz.querySelectorAll<HTMLElement>('.pasos__lista .paso'),
    ).map((li) => li.querySelector('svg[data-icono]') !== null);
    expect(conIcono).toEqual([true, false, true]);
  });

  it('⭐ la FORMA corresponde a la capa, no solo el color', async () => {
    // Sin esto, `caminoDeCapa` podía devolver siempre la chincheta y las
    // pruebas seguían verdes: miraban `data-icono` y el `fill`, que salen de
    // otro sitio. Un dibujo que no corresponde a lo que el atributo declara es
    // exactamente lo que nadie iba a ver.
    const caminos: unknown[] = [];
    for (const [tipo, quien] of [
      ['via', null],
      ['farmacia', FARMACIA],
    ] as const) {
      await ponerTipo('calleDestino', tipo);
      await teclear('calleDestino', 'navarra');
      await contestar(quien ? [] : [BURGOS], quien ? [quien] : []);
      const svg = raiz.querySelector<SVGElement>('[data-campo="calleDestino"] .sugerencia svg')!;
      caminos.push([svg.getAttribute('data-icono'), svg.querySelector('path')?.getAttribute('d')]);
      await drenarEco();
    }

    expect(caminos).toEqual([
      ['via', CAMINO_CHINCHETA],
      ['farmacia', CAMINO_CRUZ],
    ]);
  });

  it('⭐ la chincheta agarra por la PUNTA y la cruz por el centro', async () => {
    // El anclaje es lo único del marcador que se equivoca en silencio: una
    // chincheta centrada deja el punto real 16 px por encima de donde se ve la
    // punta. Leaflet lo aplica como margen negativo del elemento.
    await elegirSitioEn('calleOrigen');
    await elegirDireccionEn('calleDestino', 'portalDestino');
    await generarYMirarElMapa();

    const marcas = raiz.querySelectorAll<HTMLElement>('.leaflet-marker-icon');
    const margen = (e: HTMLElement) => `${e.style.marginLeft} ${e.style.marginTop}`;

    expect(marcas.length).toBe(2);
    // La cruz del origen: centrada, [16, 16].
    expect(margen(marcas[0]!)).toBe('-16px -16px');
    // La chincheta del destino: por la punta, [16, 32].
    expect(margen(marcas[1]!)).toBe('-16px -32px');
  });

  it('⭐ y el HOSPITAL también agarra por el centro, no por abajo', async () => {
    // Sin esto la fila `hospital` de la tabla de anclajes no la tocaba nadie:
    // la contraprueba la puso a `[16, 32]` y las 126 pruebas siguieron verdes.
    // Un cuadrado colgando de su borde inferior deja la señal 16 px por encima
    // del sitio que señala, que es el fallo silencioso de siempre.
    await elegirSitioEn('calleOrigen', HOSPITAL);
    await elegirDireccionEn('calleDestino', 'portalDestino');
    await generarYMirarElMapa();

    const marcas = raiz.querySelectorAll<HTMLElement>('.leaflet-marker-icon');
    expect(marcas[0]!.querySelector('svg')?.getAttribute('data-icono')).toBe('hospital');
    expect(`${marcas[0]!.style.marginLeft} ${marcas[0]!.style.marginTop}`).toBe('-16px -16px');
  });

  it('⭐ y la BIBLIOTECA también agarra por el centro', async () => {
    // La misma historia que el hospital, y la caza el mismo método: la
    // contraprueba puso la fila `biblioteca` de la tabla de anclajes a
    // `[16, 32]` y las 140 pruebas siguieron verdes. Cada clase nueva estrena
    // una fila que **nadie mira** hasta que se le escribe su guardián.
    await elegirSitioEn('calleOrigen', BIBLIOTECA);
    await elegirDireccionEn('calleDestino', 'portalDestino');
    await generarYMirarElMapa();

    const marcas = raiz.querySelectorAll<HTMLElement>('.leaflet-marker-icon');
    expect(marcas[0]!.querySelector('svg')?.getAttribute('data-icono')).toBe('biblioteca');
    expect(`${marcas[0]!.style.marginLeft} ${marcas[0]!.style.marginTop}`).toBe('-16px -16px');
  });

  // ⭐ Y LAS TRES FILAS NUEVAS de la tabla de anclajes, una prueba cada una.
  //
  // Es la tercera vez que se escriben estas pruebas y siempre por lo mismo: una
  // fila nueva **no la mira nadie** hasta que se le pone guardián. Le pasó a
  // `hospital` (24/08) y a `biblioteca` (25/08), con las 126 y las 140 pruebas
  // en verde mientras la fila estaba mal.
  //
  // ⚠️ Y van separadas, no en un bucle: cada una genera una ruta entera, y
  // encadenar tres en la misma prueba cancela las peticiones de la anterior
  // («Cannot flush a cancelled request»). Se intentó primero con el bucle.
  for (const sitio of [COLEGIO, GUARDERIA, UNIVERSIDAD]) {
    it(`⭐ y ${sitio.tipo.toUpperCase()} agarra por el centro, no por abajo`, async () => {
      await elegirSitioEn('calleOrigen', sitio);
      await elegirDireccionEn('calleDestino', 'portalDestino');
      await generarYMirarElMapa();

      const marcas = raiz.querySelectorAll<HTMLElement>('.leaflet-marker-icon');
      expect(marcas[0]!.querySelector('svg')?.getAttribute('data-icono')).toBe(sitio.tipo);
      expect(`${marcas[0]!.style.marginLeft} ${marcas[0]!.style.marginTop}`).toBe('-16px -16px');
    });
  }

  it('⭐ el MOSTAZA es el mismo en los dos papeles, y en las tres', async () => {
    // Un sitio lleva el color de su CLASE y el papel no lo toca: una guardería
    // es mostaza en el origen y en el destino, igual que la farmacia es verde y
    // el hospital azul. Con el ⇅ los extremos se cruzan y el dibujo no puede
    // cambiar de identidad por el camino.
    for (const campo of ['calleOrigen', 'calleDestino'] as const) {
      for (const sitio of [COLEGIO, GUARDERIA, UNIVERSIDAD]) {
        await ponerTipo(campo, sitio.tipo);
        await teclear(campo, 'moliner');
        await contestar([], [sitio]);
        const svg = raiz.querySelector<SVGElement>(`[data-campo="${campo}"] .sugerencia svg`)!;
        expect(svg.querySelector('path')?.getAttribute('fill'), `${sitio.tipo} en ${campo}`).toBe(
          MOSTAZA,
        );
        await drenarEco();
      }
    }
  });

  it('el itinerario NO pierde su flecha: el icono se suma, no sustituye', async () => {
    // La flecha dice el PAPEL —de dónde se sale, dónde se llega— y el icono
    // dice la CLASE. Con dos farmacias las dos cruces son iguales, así que sin
    // la flecha no quedaría nada que dijera cuál es cuál.
    await elegirDireccionEn('calleOrigen', 'portalOrigen');
    await elegirDireccionEn('calleDestino', 'portalDestino');
    await generarYMirarElMapa();

    expect(raiz.querySelector('.ruta__origen .ruta__marca')?.textContent?.trim()).toBe('◉');
    expect(raiz.querySelector('.ruta__destino .ruta__marca')?.textContent?.trim()).toBe('⚑');
  });
});
