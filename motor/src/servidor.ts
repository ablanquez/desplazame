/**
 * El motor de Desplázame.
 *
 * Carga el grafo y el callejero UNA vez al arrancar y los deja en memoria;
 * después abre el puerto. Sugiere vías, sirve los portales de cada una, dice
 * cuál es el más cercano a un punto, **calcula rutas de portal a portal
 * andando, en bici, en patín y en BiZi**, y declara en `/api/salud` con qué
 * dato lo hace.
 *
 * ⭐ Y carga **DOS redes**: la del peatón y la de la rueda (29/08). No es
 * duplicación: son dos subgrafos distintos —la de la rueda tiene los carriles
 * bici y no tiene las aceras—, así que sus nodos son otros y cada una necesita
 * su rejilla y su cuaderno. El porqué entero, en `red-rueda.ts`.
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
import { cargarAparcabicis, ESTADOS_QUE_ENTRAN } from './aparcabicis.ts';
import { cargarBiZi, disponibilidadDeBiZi } from './bizi.ts';
import { cargarSitios, sugerirSitios } from './sitios.ts';
import { UMBRAL_DE_DESVIO_M, entornoDe } from './gacetero.ts';
import { portalCercano } from './cercano.ts';
import { cargarRed } from './red.ts';
import { cargarRedDeLaRueda } from './red-rueda.ts';
import { SENTIDOS_CORREGIDOS } from './sentidos-corregidos.ts';
import {
  FACTOR_DEL_EMPUJE,
  TIPOS_DE_RUTA,
  VELOCIDAD_EMPUJANDO_KMH,
  factorDelEmpuje,
  factorSegun,
} from './rueda.ts';
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
// ⭐ EL RECUENTO, PARTIDO EN DOS desde el 27/08. «Sugeribles» ya no quiere decir
// «con portal»: son las que tienen portal MÁS las que se resuelven por el punto
// medio de su geometría. Decir solo el total escondería justo lo que cambió.
console.log(
  `motor: callejero en memoria — ${callejero.vias} vías, de las que ` +
    `${callejero.sugeribles.length} se sugieren: ` +
    `${callejero.sugeribles.length - callejero.porPuntoMedio} con portal · ` +
    `${callejero.porPuntoMedio} por punto medio ` +
    `(${callejero.portales} portales) · ${callejero.cargadoEnMs.toFixed(0)} ms`,
);
// Y las que se quedan fuera, con su motivo. Una zona del dato que no se puede
// situar es un dato, no un silencio.
console.log(
  `motor: fuera del buscador — ${callejero.vias - callejero.sugeribles.length}: ` +
    `${callejero.sinEje} sin eje en la capa municipal · ` +
    `${callejero.sinGeometria} con la multilínea vacía (los DISEMINADO)`,
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

// ⭐ LA RED DE LA RUEDA (29/08). Va después de la del peatón porque le presta
// los cruces por *way* —nombre, tipo real y herencia municipal—, que no
// dependen de qué subgrafo se ruteé, y volver a construirlos sería releer 5 MB
// para llegar al mismo `Map`.
console.log('motor: levantando la red de la rueda…');
const entorno = entornoDe(portales);
const redRueda = cargarRedDeLaRueda(memoria, red, entorno);
const cuentas = redRueda.cuentas;
console.log(
  `motor: red de la rueda — ${redRueda.aristas.length} aristas · ` +
    `${redRueda.nodos} nodos · ${cuentas.km.toFixed(0)} km · ${redRueda.cargadoEnMs.toFixed(0)} ms`,
);
// El precio de la tabla de acceso, aislado: solo lo que la tabla quita de lo
// que iba a entrar, no lo que ya sobraba por `a` o por `c`.
console.log(
  `motor: la tabla de la rueda cierra — ` +
    [...redRueda.cerradasPorTipo]
      .sort((a, b) => b[1] - a[1])
      .map(([tipo, n]) => `${tipo} ${n}`)
      .join(' · '),
);
console.log(
  `motor:   sin fila en la tabla ${cuentas.sinFilaEnLaTabla} (tiene que ser 0) · ` +
    `cerradas solo por el veto de p=acera ${cuentas.cerradasSoloPorPerfil}`,
);
// ⭐ LOS NOMBRES DE LO QUE SOLO PISA LA RUEDA (30/08). La herencia de § 1.15 se
// cruzó siempre sobre las aristas del peatón, y su tabla cierra los carriles
// bici: los *ways* que solo existen aquí nunca pasaron por el cruce. Ahora sí,
// y esta línea dice a cuántos les ha servido.
const herenciaRueda = cuentas.herenciaDeLaRueda;
console.log(
  `motor: nombres propios de la rueda — ${herenciaRueda.mudos} ways mudos que el peatón no vio · ` +
    `${herenciaRueda.porMotivo.hereda} heredan (${cuentas.carrilesConNombre} son carril bici) · ` +
    `${herenciaRueda.aristasHeredadas} aristas · ${herenciaRueda.kmHeredados.toFixed(1)} km · ` +
    `${herenciaRueda.cargadoEnMs.toFixed(0)} ms`,
);
console.log(
  `motor:   los que callan: ${herenciaRueda.porMotivo.disputa} por disputa · ` +
    `${herenciaRueda['porMotivo']['poca-cobertura']} por poca cobertura · ` +
    `${herenciaRueda['porMotivo']['sin-eje']} sin eje cerca — narran «el carril bici» a secas, ` +
    'que es lo honesto donde el municipal no manda',
);
// ⭐ EL SENTIDO, con su procedencia. La rotonda va aparte porque no viene de
// ningún tag: es la implicación de `junction=roundabout`, y sin ella 1.390 de
// las 1.393 aristas de rotonda se recorrerían en los dos sentidos.
console.log(
  `motor: sentido único en ${redRueda.aristas.length - cuentas.sinSentido} aristas — ` +
    `${cuentas.sentidoPorTag} por el tag oneway · ${cuentas.sentidoAlReves} al revés (-1) · ` +
    `${cuentas.sentidoPorRotonda} por rotonda implícita · ` +
    `${cuentas.contraflujo} contraflujo abierto a la bici · ${cuentas.sinSentido} en los dos`,
);
// ⭐ LAS CORRECCIONES VERIFICADAS A MANO, una a una y con su fuente. Es lo
// único del sentido que no sale del fichero, así que es lo único que hay que
// poder leer entero cada vez que el motor arranca.
console.log(
  `motor:   y ${cuentas.sentidoCorregido} aristas por CORRECCIÓN verificada ` +
    `(${SENTIDOS_CORREGIDOS.length} ${SENTIDOS_CORREGIDOS.length === 1 ? 'way' : 'ways'} en la lista):`,
);
for (const c of SENTIDOS_CORREGIDOS) {
  console.log(`motor:     way ${c.way} · OSM dice ${c.osmDiceHoy} → ${c.correccion} · ${c.fecha}`);
  console.log(`motor:     ${c.motivo.replace(/\s+/g, ' ')}`);
  console.log(`motor:     fuente: ${c.fuente.replace(/\s+/g, ' ')}`);
}
// ⭐ EL TECHO LEGAL y SU FUENTE. El municipal manda donde habla y OSM rellena;
// lo que queda a oscuras rueda a la velocidad de crucero sola, sin techo
// inventado.
console.log(
  `motor: techo legal EXPRESO (la señal) — ${cuentas.limiteMunicipal} aristas por ` +
    `limite_vel municipal · ${cuentas.limiteOsm} por maxspeed de OSM` +
    (cuentas.maxspeedIlegible > 0 ? ` (${cuentas.maxspeedIlegible} con maxspeed ilegible)` : ''),
);
// ⭐ Y EL DEFECTO LEGAL del art. 50 RGC donde no hay señal, capa a capa. La
// última va aparte y con su marca: es la única [PROPIO-por-tipo], la que no
// sale de un atributo de la vía sino de lo que su tipo implica.
console.log(
  `motor:   y por DEFECTO del art. 50 RGC — ${cuentas.defectoPlataforma} a 20 ` +
    `(plataforma única) · ${cuentas.defectoUnCarril} a 30 (un carril por sentido, lanes) · ` +
    `${cuentas.defectoVariosCarriles} a 50 (dos o más, lanes) · ` +
    `${cuentas.defectoPorTipo} a 30 [PROPIO-por-tipo]`,
);
console.log(`motor:   siguen a oscuras ${cuentas.limiteAOscuras}, sin regla que aplicarles`);
const jer = redRueda.jerarquia;
console.log(
  `motor: jerarquía municipal — ${jer.tramos} tramos en ${jer.porVia.size} vías ` +
    `(${jer.tramosSinCodigo} sin código) · proyectada a ${jer.waysConJerarquia} de ` +
    `${jer.waysMirados} ways (${jer.waysSinVia} sin vía que casar · ` +
    `${jer.waysConViaSinJerarquia} en vía que MU1 no cubre) · ${jer.cargadoEnMs.toFixed(0)} ms`,
);
console.log(
  `motor: por modo — patín ${cuentas.accesoPatin} aristas de ${redRueda.aristas.length} · ` +
    `BiZi ${cuentas.enElTermino} dentro del término · ` +
    `preferencia al carril en ${cuentas.conFactor} con tráfico`,
);
// ⚠️ EL ESTADO DE LA RED DEL PATÍN, dicho entero en cada arranque. Su lista
// cerrada la parte en islas —la del peatón y la de la bici son conexas por
// construcción, la suya no—, y de lo que le cierra, la mayor parte **no es la
// ley: es que la jerarquía municipal no llega**. Las dos cifras son distintas
// y por eso van separadas.
console.log(
  `motor:   el patín no pisa ${redRueda.aristas.length - cuentas.accesoPatin}: ` +
    `${cuentas.patinSinJerarquia} sin jerarquía municipal que las evalúe · ` +
    `${cuentas.patinConJerarquiaQueNoCumple} con jerarquía que dice que no`,
);
console.log(
  `motor:   su red queda en ${cuentas.componentesDelPatin} trozos · ` +
    `el mayor tiene ${cuentas.nodosEnLaMayorDelPatin} de ${redRueda.nodos} nodos ` +
    `(${((cuentas.nodosEnLaMayorDelPatin / redRueda.nodos) * 100).toFixed(1)} %) · ` +
    `y ${cuentas.nodosSueltosDelPatin} nodos no tocan ninguna arista suya`,
);
console.log(
  `motor: pasos de peatones — ${cuentas.pasosEmpujando} se cruzan con el vehículo en la mano · ` +
    `${cuentas.pasosConContinuidad} dan continuidad ciclista y se ruedan (art. 54.4)`,
);
// ⭐ EL EMPUJE (30/08). Va aparte de los pasos de cebra a propósito: aquello es
// una celda del art. 54.4 y esto es la regla general del peatón [RGC 121.2],
// que abre lo peatonal ENTERO a quien lleva el vehículo en la mano. Se declara
// por tipo porque el día que la cifra salte habrá que saber de dónde.
console.log(
  `motor: EMPUJANDO — ${cuentas.empujando} aristas y ${cuentas.kmEmpujando.toFixed(1)} km que ` +
    `solo se pisan con el vehículo en la mano, a ${VELOCIDAD_EMPUJANDO_KMH} km/h ` +
    `(${[...cuentas.empujandoPorTipo].sort((a, b) => b[1] - a[1]).map(([t, n]) => `${t} ${n}`).join(' · ')})`,
);
console.log(
  `motor:   con factor ${FACTOR_DEL_EMPUJE.toFixed(2)} para que solo puedan ganar por TIEMPO, ` +
    `nunca por preferencia · no valen como puerta: una ruta no empieza ni acaba empujando`,
);
// ⭐ LOS TRES CALIBRADOS (30/08) y QUIÉN LLEVA CADA UNO. Se declara aquí
// porque es la única capa que el usuario elige, y porque el patín NO la elige:
// que eso salga en el arranque es lo que impide que un día se le enseñe el
// campo sin que nadie se acuerde de por qué no lo tenía.
for (const tipo of TIPOS_DE_RUTA) {
  const quien =
    tipo === 'tranquila'
      ? 'bici y BiZi si lo piden · SIEMPRE el patín [ORD 56.2.c: vía ciclista obligatoria]'
      : tipo === 'equilibrada'
        ? 'bici y BiZi por defecto — el calibrado firmado en la casilla 3'
        : 'bici y BiZi si lo piden';
  console.log(
    `motor: calibrado «${tipo}» — ` +
      ['primary', 'secondary', 'tertiary', 'cycleway']
        .map((v) => `${v} ${factorSegun(tipo, v).toFixed(2)}`)
        .join(' · ') +
      ` · empuje ${factorDelEmpuje(tipo).toFixed(2)} · ${quien}`,
  );
}
console.log('motor: indexando la red de la rueda para enganchar portales…');
const rejillaRueda = cargarRejilla(redRueda);
console.log(
  `motor: rejilla de la rueda — ${rejillaRueda.celdas.size} celdas · ` +
    `${rejillaRueda.segArista.length} segmentos · ${rejillaRueda.cargadoEnMs.toFixed(0)} ms`,
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

// ⭐ LOS APARCABICIS (30/08, casilla 5): dónde acaba una ruta de bici propia.
console.log('motor: cargando los aparcabicis…');
const aparcabicis = cargarAparcabicis(callejero, entorno);
console.log(
  `motor: aparcabicis — ${aparcabicis.entrantes.length} entrantes de ${aparcabicis.total} · ` +
    `${aparcabicis.anclajes} anclajes · ${aparcabicis.cargadoEnMs.toFixed(0)} ms`,
);
console.log(
  'motor:   por estado — ' +
    [...aparcabicis.porEstado]
      .sort((a, b) => b[1] - a[1])
      .map(([estado, n]) => `${estado} ${n}${ESTADOS_QUE_ENTRAN.has(estado) ? ' ✔' : ' ✘'}`)
      .join(' · '),
);
console.log(
  `motor:   nombran su vía con el callejero ${aparcabicis.conViaDelCallejero} ` +
    `(los demás, con el nombre_reducido del dato, que viene abreviado) · ` +
    `sin coordenada ${aparcabicis.sinCoordenada} · fuera del entorno ${aparcabicis.fueraDelEntorno}`,
);

// ⭐ LAS ESTACIONES BiZi (30/08, casilla 6): el INVENTARIO, que no caduca. La
// disponibilidad se pide en cada ruta y no se guarda: ver el manejador.
console.log('motor: cargando las estaciones BiZi…');
const bizi = cargarBiZi(entorno);
console.log(
  `motor: BiZi — ${bizi.estaciones.length} estaciones · ${bizi.anclajes} anclajes · ` +
    `sin coordenada ${bizi.sinCoordenada} · fuera del entorno ${bizi.fueraDelEntorno} · ` +
    `${bizi.cargadoEnMs.toFixed(0)} ms`,
);
console.log(
  'motor:   la disponibilidad NO se carga aquí: se pregunta a la API de la sede en cada ' +
    'ruta de BiZi [GBFS: station_status es dinámico], y si calla se rutea con el inventario ' +
    'y se avisa',
);

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
  redRueda,
  rejillaRueda,
  // El cuaderno de la rueda es OTRO, y tiene que serlo: sus arrays van
  // indexados por nodo, y la red de la rueda tiene sus propios nodos.
  cuadernoRueda: cuadernoPara(redRueda),
  aparcabicis,
  bizi,
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
 *
 * ⭐ Y las clases de codigo que resuelven son TRES desde el 27/08: un portal,
 * un sitio, o **una via sin portales** —que se situa por el punto medio de su
 * geometria—. Es la misma tabla que usa `POST /api/ruta` para resolver un
 * extremo, y tiene que serlo: el codigo del PUENTE DE PIEDRA elegido como
 * origen es el mismo que despues sirve de foco al otro campo, y si aqui no
 * resolviera, elegir un puente dejaria al campo contrario sin foco sin que nada
 * se pusiera rojo.
 */
const focoDe = (url: URL): { readonly lon: number; readonly lat: number } | null => {
  const codigo = url.searchParams.get('foco');
  if (!codigo) {
    return null;
  }
  const donde =
    portales.donde.get(codigo) ??
    sitios.donde.get(codigo) ??
    callejero.puntoDeVia.get(codigo) ??
    null;
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
        porPuntoMedio: callejero.porPuntoMedio,
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
      void (async () => {
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
        const leida = leerPeticion(crudo);
        // ⭐ LA CONSULTA VIVA, **en cada ruta de BiZi y solo ahí** (30/08).
        //
        // [DOC GBFS] `station_status` es el feed dinámico y se consume en vivo;
        // [DOC OTP] filtra las estaciones por disponibilidad en el momento de
        // planificar. Guardarla entre peticiones sería contestar con un número
        // que ya no es cierto — y el número es justo lo que se enseña.
        //
        // Va aquí y no dentro del motor a propósito: **el motor sigue siendo
        // síncrono**. Una ruta a pie no tiene por qué esperar a una red, y las
        // jueces pueden pasar una disponibilidad de mentira sin tocar internet.
        const vivo = leida?.modo === 'bizi' ? await disponibilidadDeBiZi() : null;
        json(200, calcularTrayecto(motor, leida, vivo));
      })();
    });
    return;
  }

  json(404, { error: `no hay nada en ${peticion.method} ${peticion.url}` });
});

servidor.listen(PUERTO, () => {
  console.log(`motor: escuchando en http://localhost:${PUERTO} (pid ${process.pid})`);
  console.log(
    `motor: /api/vias sugiere desde ${MINIMO} letras, hasta ${LIMITE} resultados, ` +
      'y una vía sin portales viaja con su propio código en las dos casillas',
  );
  console.log('motor: /api/portal-cercano barre los portales en memoria por haversine');
  console.log(
    'motor: POST /api/ruta calcula andando, bici, patin y bizi, de portal a portal, por codigos',
  );
  console.log(`motor: arrancado a las ${ARRANCADO}`);
});
