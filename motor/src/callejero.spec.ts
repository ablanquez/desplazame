/**
 * EL AUTOCOMPLETAR DE VÍAS: qué sugiere y en qué orden.
 *
 * ⚠️ **Este fichero nace el 27/08, y hasta hoy `buscar` no tenía ni una
 * prueba.** Es la capa de calles del autocompletar —la que rellena los dos
 * campos del formulario— y llevaba desde el principio sin guardián: su orden
 * podía cambiar entero sin que nada protestara. Se escribe al añadirle el foco,
 * que es cuando se ha mirado.
 */
import { test, before, describe } from 'node:test';
import assert from 'node:assert/strict';
import { cargarPortales, type PortalesEnMemoria } from './portales.ts';
import { cargarCallejero, buscar, MINIMO, LIMITE, type CallejeroEnMemoria } from './callejero.ts';

let portales: PortalesEnMemoria;
let callejero: CallejeroEnMemoria;

/**
 * ⭐ LOS DOS EXTREMOS DEL CASO, elegidos del dato y declarados aquí para que no
 * se muevan con el viento.
 *
 * · **CALLE MAYOR 2 de GARRAPINILLOS** (`Portales.107420`, `[-1.025553,
 *   41.683419]`), en el barrio rural del oeste.
 * · **CALLE MAYOR 1 del centro** (`Portales.104742`, `[-0.877335, 41.654165]`).
 *
 * Están a **12,3 km** el uno del otro, y las dos calles se llaman igual: es el
 * caso de TriMet en Portland —«direcciones ambiguas entre pueblos, ordenadas
 * por los pueblos más cercanos al foco»— con los nombres de aquí.
 */
const EN_GARRAPINILLOS = 'Portales.107420';
const EN_EL_CENTRO = 'Portales.104742';

/** Las diez que `buscar('mayor')` devolvía antes de que existiera el foco. */
const SIN_FOCO = [
  '6380', // CALLE FAUSTINO CASAMAYOR
  '18750', // CALLE LOS MAYORES DE ARAGÓN
  '34515', // CALLE MARÍA ZAYAS SOTOMAYOR
  '18600', // CALLE MAYOR
  '18620', // CALLE MAYOR [LA CARTUJA]
  '18630', // CALLE MAYOR [GARRAPINILLOS]
  '18640', // CALLE MAYOR [JUSLIBOL]
  '18680', // CALLE MAYOR [MONTAÑANA]
  '18660', // CALLE MAYOR [MIRALBUENO]
  '18720', // CALLE MAYOR [VILLARRAPA]
];

/** El punto de un portal, por su código. */
const puntoDe = (codigo: string): { lon: number; lat: number } => {
  const p = portales.donde.get(codigo)!;
  return { lon: p.lon, lat: p.lat };
};

describe('El callejero — el autocompletar de vías', () => {
  before(() => {
    portales = cargarPortales();
    callejero = cargarCallejero(portales);
  });

  test('desde MINIMO letras, y ni una menos', () => {
    assert.equal(MINIMO, 2);
    assert.deepEqual(buscar(callejero, 'm'), []);
    assert.ok(buscar(callejero, 'ma').length > 0);
  });

  test('busca por SUBCADENA, y las que EMPIEZAN por lo escrito van primero', () => {
    // «goya» está dentro de «AVENIDA DE GOYA» y de «PASEO DE GOYA», y ninguna
    // de las dos empieza por ahí: sin subcadena no saldría ninguna.
    const salen = buscar(callejero, 'goya');
    assert.ok(salen.length > 1);
    assert.ok(salen.every((v) => v.nombre.toLowerCase().includes('goya')));
  });

  test('nunca más de LIMITE', () => {
    assert.equal(LIMITE, 10);
    assert.equal(buscar(callejero, 'calle').length, 10);
  });

  test('⭐ SIN FOCO, el orden es exactamente el de siempre', () => {
    // El guardián de la promesa: añadir el foco no puede mover ni una fila
    // cuando no hay foco. Estas diez son las que devolvía el 26/08.
    assert.deepEqual(
      buscar(callejero, 'mayor').map((v) => v.codigo),
      SIN_FOCO,
    );
  });

  test('⭐ CON FOCO EN GARRAPINILLOS, su Calle Mayor va la PRIMERA', () => {
    const salen = buscar(callejero, 'mayor', puntoDe(EN_GARRAPINILLOS));
    assert.equal(salen[0]!.codigo, '18630', 'la de Garrapinillos no va primera');
    assert.equal(salen[0]!.nucleo, 'GARRAPINILLOS');
  });

  test('⭐ y el foco SUBE, no filtra: la del centro sigue en la lista', () => {
    // [DOC Pelias, autocomplete] «promociona los resultados cercanos a lo alto
    // de la lista, SIN dejar de mostrar los de más lejos». Un foco que
    // descartara convertiría una preferencia en un filtro, y quien busca la
    // Calle Mayor del centro desde Garrapinillos dejaría de encontrarla.
    const salen = buscar(callejero, 'mayor', puntoDe(EN_GARRAPINILLOS)).map((v) => v.codigo);
    assert.ok(salen.includes('18600'), `la del centro no está: ${salen.join(', ')}`);
    assert.ok(salen.indexOf('18600') > 0, 'la del centro no puede ir primera desde Garrapinillos');
  });

  test('⭐ EL REVERSO: desde el centro, la Calle Mayor del centro va primera', () => {
    const salen = buscar(callejero, 'mayor', puntoDe(EN_EL_CENTRO));
    assert.equal(salen[0]!.codigo, '18600');
    assert.equal(salen[0]!.nucleo, null, 'la del centro no lleva marcador de barrio');
    // La de Garrapinillos, en cambio, YA NO SALE — y no la descarta el foco:
    // ver la prueba de abajo.
    assert.equal(
      salen.map((v) => v.codigo).includes('18630'),
      false,
      'desde el centro no caben las diez más cercanas y además la de Garrapinillos',
    );
  });

  test('⚠️ el foco no filtra, pero EL TOPE SÍ CORTA, y son dos cosas distintas', () => {
    // ⚠️ Esto hay que decirlo entero. Con «mayor» casan **22 vías** y se
    // enseñan **diez**: con foco o sin él, doce se quedan fuera siempre. Lo que
    // el foco cambia es CUÁLES.
    //
    // · Sin foco, se caían las doce últimas por orden alfabético.
    // · Desde Garrapinillos, se caen las doce más lejanas — y la del centro
    //   aguanta, la décima, a 12.737 m.
    // · Desde el centro, la de Garrapinillos NO entra: hay nueve «mayor» más
    //   cerca. No la descarta el foco, la desplaza el tope.
    //
    // La doctrina —«promociona lo cercano SIN dejar de mostrar lo lejano»— se
    // cumple sobre la ordenación, que es donde el foco actúa. El tope es otra
    // regla, anterior y firmada, y con 22 candidatas alguien se queda fuera.
    let candidatas = 0;
    for (const i of callejero.sugeribles) {
      if (i.norma.includes('mayor')) candidatas++;
    }
    assert.equal(candidatas, 22);
    assert.equal(buscar(callejero, 'mayor').length, LIMITE);
    assert.equal(buscar(callejero, 'mayor', puntoDe(EN_EL_CENTRO)).length, LIMITE);

    // Y el corchete es lo que salva el caso cuando el tope aprieta: quien mira
    // «CALLE MAYOR [GARRAPINILLOS]» sabe cuál es aunque vaya la décima.
    const deGarrapinillos = buscar(callejero, 'mayor', puntoDe(EN_GARRAPINILLOS))[0]!;
    assert.equal(deGarrapinillos.nucleo, 'GARRAPINILLOS');
    assert.equal(deGarrapinillos.limpio, 'CALLE MAYOR');
  });

  test('⭐ el foco NO cambia QUÉ casa, solo en qué orden', () => {
    // La lista con foco y sin foco tiene que ser el mismo conjunto mientras
    // quepan todas: lo que el foco toca es el orden, no la pertenencia.
    const sin = buscar(callejero, 'garrapinillos').map((v) => v.codigo);
    const con = buscar(callejero, 'garrapinillos', puntoDe(EN_EL_CENTRO)).map((v) => v.codigo);
    assert.ok(sin.length < LIMITE, 'este caso necesita una consulta que no llene el tope');
    assert.deepEqual([...con].sort(), [...sin].sort());
  });

  test('⭐ un foco NO desempata por delante de la coincidencia', () => {
    // Igual que en sitios: las que EMPIEZAN por lo escrito van antes que las
    // que solo lo contienen, esté el foco donde esté. Estar al lado no
    // convierte una coincidencia peor en una mejor.
    //
    // ⚠️ El caso es «ronda» y no «mayor», y la razón importa: `norma` incluye
    // el TIPO de vía —«calle mayor»—, así que con «mayor» **ninguna empieza**
    // por lo escrito y las diez caen en el mismo grupo. La primera versión de
    // esta prueba usaba «mayor» con un `if` alrededor, y por eso **no
    // comprobaba nada**: la contraprueba puso el foco por delante de la
    // coincidencia y las 288 seguían verdes. Con «ronda» hay **siete que
    // empiezan y dos que contienen**, y el caso muerde.
    //
    // CAMINO RONDA (25890) es de las que solo contienen, y está en Casetas,
    // pegado a Villarrapa: se pone el foco ahí para que la cercanía tire de
    // ella hacia arriba, y aun así tiene que quedar por detrás de las siete.
    const salen = buscar(callejero, 'ronda', puntoDe(EN_GARRAPINILLOS));
    const empiezan = salen.filter((v) => v.nombre.toUpperCase().startsWith('RONDA'));
    const contienen = salen.filter((v) => !v.nombre.toUpperCase().startsWith('RONDA'));
    assert.ok(empiezan.length > 0, 'el caso necesita vías que EMPIECEN por lo escrito');
    assert.ok(contienen.length > 0, 'y otras que solo lo contengan');
    assert.ok(
      salen.indexOf(empiezan[empiezan.length - 1]!) < salen.indexOf(contienen[0]!),
      `una que solo contiene se ha colado: ${salen.map((v) => v.limpio).join(' | ')}`,
    );
  });

  test('⭐ UNA VÍA SE MIDE POR SU PORTAL MÁS CERCANO, no por el primero', () => {
    // ⚠️ Esta prueba también nació de la contraprueba: midiendo la vía por su
    // PRIMER portal en vez de por el más cercano, las 288 seguían verdes —
    // porque en las calles cortas los dos son casi el mismo punto.
    //
    // La CARRETERA AUTOVÍA DE LOGROÑO (16980) es el caso que lo rompe: sus 34
    // portales se reparten a lo largo de **16.966 m**, del `Portales.122251`
    // —en la ciudad— al `Portales.123510`, ya en el término de Casetas. Puesto
    // el foco junto al lejano, medirla por el primero la mandaría al fondo de
    // la lista estando literalmente al lado.
    const enElExtremo = puntoDe('Portales.123510');
    const salen = buscar(callejero, 'logroño', enElExtremo).map((v) => v.codigo);
    assert.ok(salen.includes('16980'), 'la autovía no sale con «logroño»');
    assert.equal(salen[0], '16980', `la autovía no va primera: ${salen.join(', ')}`);
  });
});

describe('El callejero — las vías SIN PORTAL, que entran el 27/08', () => {
  before(() => {
    portales = cargarPortales();
    callejero = cargarCallejero(portales);
  });

  test('⭐ LA PARTICIÓN CIERRA: 3.359 = 2.731 con portal + 619 por punto medio + 9 fuera', () => {
    // Los cuatro números y su suma. Contados sobre el dato, no escritos:
    //   node -e "…" sobre el callejero y los ejes → 628 sin portal, de las que
    //   619 tienen geometría usable en la capa municipal.
    assert.equal(callejero.vias, 3359);
    assert.equal(callejero.sugeribles.length, 3350);
    assert.equal(callejero.porPuntoMedio, 619);
    const conPortal = callejero.sugeribles.filter((i) => i.via.portales > 0).length;
    assert.equal(conPortal, 2731);
    assert.equal(conPortal + callejero.porPuntoMedio, callejero.sugeribles.length);

    // ⭐ Y LAS QUE SE QUEDAN FUERA, contadas y con su motivo separado — porque
    // son dos cosas distintas y una zona sin situar también es un dato.
    //
    // · 1 SIN EJE: la GLORIETA LAS BANDERAS (cod. 3410). No es un fallo de
    //   nadie: el callejero es una foto del 13/05/2026 y la capa de ejes del
    //   20/08, y entre las dos fechas una glorieta salió y otra entró. Está
    //   contado en la ficha § 1.15, y el reverso —un eje que el callejero no
    //   conoce, la GLORIETA POLICÍA NACIONAL— también.
    // · 8 CON LA MULTILÍNEA VACÍA: `DISEMINADO DISEMINADO <núcleo>`. La capa
    //   trae 18; las otras 10 sí tienen portales y entran por la puerta de
    //   siempre.
    assert.equal(callejero.sinEje, 1);
    assert.equal(callejero.sinGeometria, 8);
    assert.equal(callejero.vias - callejero.sugeribles.length, 9);
  });

  test('⭐ EL PUENTE DE PIEDRA se puede buscar, y hasta hoy no se podía', () => {
    // El caso que lo explica todo: el puente más conocido de la ciudad, cero
    // portales, y por eso invisible para el buscador desde que existe.
    const salen = buscar(callejero, 'puente de piedra');
    assert.equal(salen.length, 1);
    assert.equal(salen[0]!.codigo, '23125');
    assert.equal(salen[0]!.limpio, 'PUENTE DE PIEDRA');
    assert.equal(salen[0]!.portales, 0, 'si tuviera portales este caso no probaría nada');
    // Y tiene punto por el que resolverse: sin él no se sugeriría.
    assert.ok(callejero.puntoDeVia.has('23125'));
  });

  test('⭐ NINGUNA VÍA SUGERIBLE se queda sin punto, y ninguna sin portal se queda sin medio', () => {
    // El guardián de la promesa entera: «solo se sugiere lo cumplible». Si una
    // sola de las 3.350 no tuviera ni portal ni punto medio, `metrosALaVia`
    // devolvería Infinity y el comparador del foco haría `Infinity − Infinity`
    // = NaN. El orden se corrompería **sin ponerse rojo**: un comparador que
    // devuelve NaN no lanza, solo deja de ordenar.
    for (const { via } of callejero.sugeribles) {
      const tienePortales = (portales.porVia.get(via.codigo)?.length ?? 0) > 0;
      assert.equal(
        tienePortales || callejero.puntoDeVia.has(via.codigo),
        true,
        `${via.codigo} ${via.limpio} no tiene ni portal ni punto medio`,
      );
      assert.equal(via.portales > 0, tienePortales, `${via.codigo}: el recuento miente`);
    }
    // Y al revés: el índice de puntos medios NO guarda ninguna vía con portal.
    // Donde hay puertas manda la puerta.
    for (const codigo of callejero.puntoDeVia.keys()) {
      assert.equal(portales.porVia.has(codigo), false, `${codigo} tiene portales y también punto`);
    }
    assert.equal(callejero.puntoDeVia.size, callejero.porPuntoMedio);
  });

  test('⭐ SIN FOCO, «mayor» sigue dando EXACTAMENTE lo de ayer: ni una de las 619 casa', () => {
    // El guardián que el encargo pedía. No basta con que la lista de diez no se
    // mueva: hay que decir POR QUÉ no se mueve, porque si se moviera habría que
    // declarar el cambio. Y la razón es que con «mayor» no casa ni una de las
    // que entran hoy — las 22 candidatas siguen siendo las 22 de ayer.
    assert.deepEqual(
      buscar(callejero, 'mayor').map((v) => v.codigo),
      SIN_FOCO,
    );
    const nuevasQueCasan = callejero.sugeribles.filter(
      (i) => i.via.portales === 0 && i.norma.includes('mayor'),
    );
    assert.equal(nuevasQueCasan.length, 0, nuevasQueCasan.map((i) => i.via.limpio).join(' | '));
  });

  test('⭐ UNA VÍA SIN PORTAL SE ORDENA POR SU PUNTO MEDIO: la PLAZA CÉSAR AUGUSTO', () => {
    /**
     * El caso del foco, con los dos CÉSAR AUGUSTO de Zaragoza:
     *
     * · `7410` **AVENIDA** CÉSAR AUGUSTO, con 82 portales.
     * · `7420` **PLAZA** CÉSAR AUGUSTO, con **cero**, que entra hoy.
     *
     * Sin foco salen por orden alfabético y la AVENIDA va primera. Con el foco
     * en `Portales.100473` —CALLE 6, nº 22, a **22 m** del punto medio de la
     * plaza— tiene que subir la PLAZA, y para eso hay que medirla por su punto
     * medio: es lo único que tiene.
     *
     * ⚠️ Sin esa medida no bajaría un puesto: se iría al FINAL, porque una vía
     * sin portales estaría a distancia infinita de todo.
     */
    const sinFoco = buscar(callejero, 'cesar augusto').map((v) => v.codigo);
    assert.deepEqual(sinFoco, ['7410', '7420']);
    const conFoco = buscar(callejero, 'cesar augusto', puntoDe('Portales.100473')).map(
      (v) => v.codigo,
    );
    assert.deepEqual(conFoco, ['7420', '7410']);
  });

  test('⭐ y el foco sigue sin filtrar: la que se aleja BAJA, no desaparece', () => {
    // La doctrina de Pelias, comprobada también con las nuevas: puesta la mira
    // en el centro, el PUENTE DE PIEDRA sube a lo alto de «piedra» y las tres
    // calles lejanas siguen todas en la lista.
    const salen = buscar(callejero, 'piedra', puntoDe(EN_EL_CENTRO)).map((v) => v.codigo);
    assert.equal(salen[0], '23125', `el puente no va primero: ${salen.join(', ')}`);
    assert.equal(salen.length, buscar(callejero, 'piedra').length);
  });
});
