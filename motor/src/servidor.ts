/**
 * El motor de Desplázame.
 *
 * Carga el grafo y el callejero UNA vez al arrancar y los deja en memoria;
 * después abre el puerto. Sugiere vías, sirve los portales de cada una, dice
 * cuál es el más cercano a un punto, **calcula rutas andando de portal a
 * portal**, y declara en `/api/salud` con qué dato lo hace.
 *
 * **El puerto no abre hasta que todo está cargado.** Es la decisión declarada:
 * así no existe el instante en que el motor contesta a medio cargar, y la
 * guardia no puede darle verde a un motor incompleto.
 *
 * No se compila: Node 24 ejecuta TypeScript directamente borrando los tipos.
 */

import { createServer } from 'node:http';
import type { Salud } from '@desplazame/tipos';
import { cargarGrafo } from './grafo.ts';
import { buscar, cargarCallejero, LIMITE, MINIMO } from './callejero.ts';
import { cargarPortales, portalesDe } from './portales.ts';
import { cargarSitios, sugerirSitios } from './sitios.ts';
import { UMBRAL_DE_DESVIO_M } from './gacetero.ts';
import { portalCercano } from './cercano.ts';
import { cargarRed } from './red.ts';
import { cargarRejilla } from './proyeccion.ts';
import { cuadernoPara } from './ruta.ts';
import { calcularTrayecto, type Motor } from './trayecto.ts';
import { leerPeticion } from './peticion.ts';

/** Cuánto se acepta como cuerpo de una petición. Una ruta cabe de sobra. */
const CUERPO_MAXIMO = 4096;

/** El puerto del motor. La interfaz le habla por el proxy de `ng serve`. */
const PUERTO = 3000;

console.log('motor: cargando el grafo…');
const memoria = cargarGrafo();
console.log(
  `motor: grafo en memoria — ${memoria.aristas} aristas · ${memoria.nodos} nodos · ` +
    `${memoria.vertices} vértices`,
);
console.log(
  `motor: leído en ${memoria.leidoEnMs.toFixed(0)} ms · parseado en ` +
    `${memoria.parseadoEnMs.toFixed(0)} ms · listo en ${memoria.cargadoEnMs.toFixed(0)} ms`,
);

// Los portales van ANTES que el callejero: el callejero cuenta sobre ellos.
console.log('motor: cargando los portales…');
const portales = cargarPortales();
console.log(
  `motor: portales en memoria — ${portales.total} portales en ${portales.porVia.size} vías ` +
    `· ${portales.cargadoEnMs.toFixed(0)} ms`,
);

console.log('motor: cargando el callejero…');
const callejero = cargarCallejero(portales);
console.log(
  `motor: callejero en memoria — ${callejero.vias} vías, de las que ` +
    `${callejero.sugeribles.length} tienen portal y se sugieren ` +
    `(${callejero.portales} portales) · ${callejero.cargadoEnMs.toFixed(0)} ms`,
);

// La red va DESPUÉS del callejero porque necesita el grafo ya parseado, y
// antes de abrir el puerto por lo mismo que todo lo demás: nadie contesta a
// medio cargar.
console.log('motor: levantando la red de rutas…');
const red = cargarRed(memoria);
console.log(
  `motor: red en memoria — ${red.aristas.length} aristas andables · ${red.nodos} nodos ` +
    `· ${red.nombreDeWay.size} nombres de vía · ${red.cargadoEnMs.toFixed(0)} ms`,
);
const h = red.herencias;
console.log(
  `motor: herencia por vecindad — ${h.nombreHeredado.size} de ${h.mudos} ways mudos ` +
    `cogen el nombre municipal (${h.aristasHeredadas} aristas · ` +
    `${h.kmHeredados.toFixed(0)} km) · ${h.cargadoEnMs.toFixed(0)} ms`,
);
console.log(
  `motor: los que no — ${h.porMotivo['sin-eje']} sin eje cerca · ` +
    `${h.porMotivo['poca-cobertura']} poca cobertura · ${h.porMotivo.disputa} en disputa`,
);

console.log('motor: indexando la red para enganchar portales…');
const rejilla = cargarRejilla(red);
console.log(
  `motor: rejilla en memoria — ${rejilla.celdas.size} celdas · ` +
    `${rejilla.segArista.length} segmentos · ${rejilla.cargadoEnMs.toFixed(0)} ms`,
);

console.log('motor: cargando los sitios (destinos con nombre)…');
const sitios = cargarSitios(portales, callejero);
console.log(
  `motor: sitios en memoria — ${sitios.total} en total · ` +
    `${sitios.conCoordenada} en el indice · ${sitios.cargadoEnMs.toFixed(0)} ms`,
);
// ⭐ Y `excluidos` es la ultima columna: los que el fichero municipal trae y una
// firma deja fuera —el reparto entre dos categorias del producto, o una lista de
// admision (§ 1.20)—. Va en el log por lo mismo que los duplicados: la
// diferencia entre lo que trae el fichero y lo que hay en el indice tiene que
// poder leerse, no deducirse.
//
// ⭐ La regla B, dicha en voz alta al arrancar y AHORA POR CATEGORIA. Los que
// no tienen punto no se borran ni se editan: se cuentan aqui y no se sugieren
// jamas. Que la cifra salga en el log es lo que impide que un dia sean cuarenta
// sin que nadie lo note — y desglosada, lo que impide que las cuarenta sean
// todas de la misma categoria sin que se vea. Ver § 1.16, § 1.17 y § 1.18.
for (const c of sitios.porCategoria) {
  console.log(
    `motor:   ${c.categoria.padEnd(19)} ${String(c.total).padStart(3)} · ` +
      `${String(c.conCoordenada).padStart(3)} en el indice · ${c.sinCoordenada} sin coordenada · ` +
      `${c.corregidos} corregidos · ${c.rescatados} rescatados · ${c.invalidos} invalidas · ` +
      `${c.duplicados} duplicados · ${c.excluidos} excluidos`,
  );
}
console.log(
  `motor: ${sitios.sinCoordenada} sin coordenada en total, fuera del indice ` +
    '(sin coordenada no existe: no se pueden enrutar, asi que no se sugieren)',
);

// ⭐ LA CORRECCION MANUAL, la primera en decirse porque es la primera en
// aplicarse. Es lo que vuelve de la lista de confirmacion manual —lo que el
// proceso no supo arreglar y si supo quien conoce el terreno—, y sale con su
// FUENTE: un numero puesto a mano sin decir quien lo dice no vale nada.
if (sitios.corregidos.length > 0) {
  console.log(
    `motor: ${sitios.corregidos.length} ` +
      `${sitios.corregidos.length === 1 ? 'corregido' : 'corregidos'} a mano ` +
      '(lista de confirmacion manual, § 1.17)',
  );
  for (const c of sitios.corregidos) {
    console.log(`motor:   ${c.codigo.padEnd(20)} ${c.presentacion}`);
    console.log(
      `motor:   ${''.padEnd(20)} de [${c.lonMunicipal.toFixed(6)}, ${c.latMunicipal.toFixed(6)}] ` +
        `a [${c.lon.toFixed(6)}, ${c.lat.toFixed(6)}] — ${c.motivo}`,
    );
    console.log(`motor:   ${''.padEnd(20)} fuente: ${c.fuente}`);
  }
}

// ⭐ LA VALIDACION ESPACIAL, dicha entera. Mover una coordenada publicada es
// tocar el dato de cara al usuario, y eso no se hace en silencio: aqui salen
// los nueve, uno a uno, con de donde venian y a que portal se han ido. La
// misma lista esta en la ficha (§ 1.16 y § 1.17).
//
// 🔒 Lo que se escribe es la PRESENTACION —«Farmacia · calle»—, nunca el titulo
// del dato: en farmacias ese campo lleva el nombre del titular y el log es uno
// de los sitios por los que se dijo que no saldria.
console.log(
  `motor: ${sitios.rescatados.length} rescatados por callejero ` +
    `(coordenada a mas de ${UMBRAL_DE_DESVIO_M} m de la puerta que su propia direccion declara)`,
);
for (const r of [...sitios.rescatados].sort((a, b) => b.metros - a.metros)) {
  console.log(
    `motor:   ${r.codigo.padEnd(20)} ${String(Math.round(r.metros)).padStart(4)} m ` +
      `${r.porQue.padEnd(9)} ${r.presentacion.slice(0, 46).padEnd(47)}→ ${r.via} ${r.numero}`,
  );
}
if (sitios.invalidos.length > 0) {
  console.log(
    `motor: ${sitios.invalidos.length} con coordenada INVALIDA y sin direccion que case: ` +
      'fuera del indice, a confirmacion manual',
  );
  for (const i of sitios.invalidos) {
    console.log(
      `motor:   ${i.codigo.padEnd(20)} ${i.porQue.padEnd(9)} ` +
        `lon ${i.lon.toFixed(6)} lat ${i.lat.toFixed(6)}  ${i.presentacion}`,
    );
  }
}

/** Todo lo que hace falta para contestar una ruta, junto. */
const motor: Motor = {
  red,
  rejilla,
  portales,
  callejero,
  sitios,
  // El cuaderno del Dijkstra se reserva UNA vez y se reutiliza. El motor
  // atiende de uno en uno —`node:http` es de un solo hilo—, así que no hay dos
  // rutas escribiéndolo a la vez.
  cuaderno: cuadernoPara(red),
};

const usoMemoria = process.memoryUsage();
console.log(
  `motor: memoria del proceso — rss ${(usoMemoria.rss / 1048576).toFixed(0)} MB · ` +
    `heap ${(usoMemoria.heapUsed / 1048576).toFixed(0)} MB`,
);

/** Cuándo arrancó este proceso. La guardia lo compara con las fuentes. */
const ARRANCADO = new Date().toISOString();

/**
 * ⭐ EL FOCO de una peticion, resuelto: el punto del otro extremo.
 *
 * Vive aqui, en un solo sitio, porque lo usan **las dos capas** del
 * autocompletar —`/api/vias` y `/api/sitios`— y tienen que resolverlo igual.
 * Antes solo lo hacia la de sitios y estaba escrito dentro de su rama; al
 * ganarlo las vias (27/08) se saco fuera en vez de copiarlo, que es como se
 * separan dos cosas que deberian ser una.
 *
 * `foco` es UN CODIGO, no un par de coordenadas [DOC Pelias: `focus.point`]:
 * la pantalla no conoce coordenadas, el contrato le da codigos. Y un codigo que
 * no resuelve **no es un error**: se ignora y se contesta sin foco.
 */
const focoDe = (url: URL): { readonly lon: number; readonly lat: number } | null => {
  const codigo = url.searchParams.get('foco');
  if (!codigo) {
    return null;
  }
  const donde = portales.donde.get(codigo) ?? sitios.donde.get(codigo) ?? null;
  return donde ? { lon: donde.lon, lat: donde.lat } : null;
};

const servidor = createServer((peticion, respuesta) => {
  const json = (codigo: number, cuerpo: unknown): void => {
    respuesta.writeHead(codigo, { 'Content-Type': 'application/json; charset=utf-8' });
    respuesta.end(JSON.stringify(cuerpo));
  };

  const url = new URL(peticion.url ?? '/', `http://localhost:${PUERTO}`);

  if (peticion.method === 'GET' && url.pathname === '/api/salud') {
    const salud: Salud = {
      ok: true,
      pid: process.pid,
      arrancado: ARRANCADO,
      grafo: {
        nodos: memoria.nodos,
        aristas: memoria.aristas,
        vertices: memoria.vertices,
        cargadoEnMs: Math.round(memoria.cargadoEnMs),
      },
      red: {
        aristas: red.aristas.length,
        nodos: red.nodos,
        nombres: red.nombreDeWay.size,
        heredados: red.nombreHeredado.size,
        cerradas: [...red.cerradasPorTipo.values()].reduce((t, n) => t + n, 0),
        celdas: rejilla.celdas.size,
        cargadoEnMs: Math.round(red.cargadoEnMs + rejilla.cargadoEnMs),
      },
      callejero: {
        vias: callejero.vias,
        sugeribles: callejero.sugeribles.length,
        portales: callejero.portales,
        cargadoEnMs: Math.round(callejero.cargadoEnMs),
      },
      portales: {
        total: portales.total,
        vias: portales.porVia.size,
        cargadoEnMs: Math.round(portales.cargadoEnMs),
      },
    };
    json(200, salud);
    return;
  }

  if (peticion.method === 'GET' && url.pathname === '/api/vias') {
    // Sin `q`, o con menos de MINIMO letras, se devuelve lista vacía: es una
    // respuesta bien formada, no un error. Quien escribe todavía no ha dicho
    // bastante como para sugerirle nada.
    //
    // ⭐ Y `foco` (27/08), IGUAL que en `/api/sitios`: el codigo del otro
    // extremo ya resuelto —un portal o un sitio—, no un par de coordenadas,
    // porque la pantalla no conoce coordenadas. Con el, las vias cercanas suben
    // y **ninguna se descarta** [DOC Pelias, autocomplete]. Sin el, el orden de
    // siempre, al byte.
    //
    // Un `foco` que no resuelve se ignora y se contesta sin foco: es una
    // preferencia de ordenacion, no un dato de la consulta. Mismo trato que
    // alli, y por eso el codigo es el mismo.
    json(200, buscar(callejero, url.searchParams.get('q') ?? '', focoDe(url)));
    return;
  }

  if (peticion.method === 'GET' && url.pathname === '/api/sitios') {
    // La capa de SITIOS del autocompletar, aparte de la de vias [DOC Pelias:
    // `layers`]. Mismo trato que `/api/vias`: sin `q` bastante largo, lista
    // vacia — una respuesta bien formada, no un error.
    //
    // ⭐ Solo salen los que tienen coordenada. Los tres que no la traen no
    // estan en el indice y por aqui no pueden asomar.
    //
    // ⭐ `foco` es OPCIONAL y es UN CODIGO, no un par de coordenadas
    // [DOC Pelias: `focus.point`]. Va el codigo del otro extremo —un portal o
    // un sitio— porque la pantalla NO conoce coordenadas: el contrato le da
    // codigos y nada mas, y mandar un `lat,lon` obligaria a metersela en el
    // bolsillo solo para esto. Quien sabe convertir un codigo en un punto es
    // el motor, que ya lo hace para calcular la ruta.
    //
    // Un `foco` que no se resuelve NO es un error: se ignora y se contesta sin
    // foco. Es una preferencia de ordenacion, no un dato de la consulta, y una
    // lista bien ordenada de menos vale mas que un 400.
    const desde = focoDe(url);
    // ⭐ `capa` acota a UNA categoria [DOC Pelias: `layers`]. Es el buscador
    // por tipos del formulario, y va de PARAMETRO y no de endpoint nuevo: la
    // busqueda es la misma y lo unico que cambia es sobre que se busca.
    //
    // Se valida contra las categorias QUE HAY CARGADAS, no contra una lista
    // escrita aqui: asi el dia que entre una cuarta no hay dos sitios que
    // acordarse de tocar. Una capa que no existe se trata como «ninguna» y no
    // como error — mismo trato que un `foco` que no resuelve.
    const pedida = url.searchParams.get('capa');
    const capa = sitios.porCategoria.find((c) => c.tipo === pedida)?.tipo ?? null;
    json(
      200,
      sugerirSitios(
        sitios,
        url.searchParams.get('q') ?? '',
        desde,
        capa,
      ),
    );
    return;
  }

  if (peticion.method === 'GET' && url.pathname === '/api/portal-cercano') {
    // El barrido de los 46.150 cuesta 1 ms medido, así que no hay ni índice
    // espacial ni caché: se recorren todos en cada petición y se contesta.
    //
    // `Number('')` vale 0, que es una coordenada legítima en mitad del
    // Atlántico. Por eso el parámetro que falta se convierte a `NaN` a mano en
    // vez de dejarlo colar como cero.
    const numero = (nombre: string): number => {
      const crudo = url.searchParams.get(nombre);
      return crudo === null || crudo.trim() === '' ? Number.NaN : Number(crudo);
    };
    json(200, portalCercano(portales, callejero, numero('lat'), numero('lon')));
    return;
  }

  if (peticion.method === 'GET' && url.pathname === '/api/portales') {
    // Se devuelven TODOS los portales de la vía, no una página: la mediana es
    // 9 y el peor caso 1.469, que en este contrato son unos 66 KB. Una sola
    // petición al fijar la calle deja a la pantalla filtrando en local, sin
    // ida y vuelta por cada tecla. Sin `via`, o con una que no existe: lista
    // vacía, respuesta bien formada — como `/api/vias`.
    json(200, portalesDe(portales, url.searchParams.get('via') ?? ''));
    return;
  }

  if (peticion.method === 'POST' && url.pathname === '/api/ruta') {
    // El cuerpo se junta a trozos y con tope: sin él, una petición que no
    // acabara nunca dejaría al motor comiendo memoria.
    let cuerpo = '';
    let pasado = false;
    peticion.on('data', (trozo: Buffer) => {
      cuerpo += trozo.toString('utf8');
      if (cuerpo.length > CUERPO_MAXIMO) {
        pasado = true;
        peticion.destroy();
      }
    });
    peticion.on('end', () => {
      if (pasado) {
        return;
      }
      // Un cuerpo que no es JSON no es un error del servidor: es una petición
      // que no dice nada, y se contesta con el trayecto vacío que lo explica.
      let crudo: unknown = null;
      try {
        crudo = JSON.parse(cuerpo);
      } catch {
        crudo = null;
      }
      json(200, calcularTrayecto(motor, leerPeticion(crudo)));
    });
    return;
  }

  json(404, { error: `no hay nada en ${peticion.method} ${peticion.url}` });
});

servidor.listen(PUERTO, () => {
  console.log(`motor: escuchando en http://localhost:${PUERTO} (pid ${process.pid})`);
  console.log(`motor: /api/vias sugiere desde ${MINIMO} letras, hasta ${LIMITE} resultados`);
  console.log('motor: /api/portal-cercano barre los portales en memoria por haversine');
  console.log('motor: POST /api/ruta calcula andando, de portal a portal, por codigos');
  console.log(`motor: arrancado a las ${ARRANCADO}`);
});
