// ⭐⭐⭐ ¿PUEDE ESTA COPIA DEL REPOSITORIO EJECUTAR EL MOTOR?
//
// ═════════════════════════════════════════════════════════════════════════════
// POR QUÉ EXISTE
// ═════════════════════════════════════════════════════════════════════════════
//   `data/fuentes/` está gitignoreada entera, y a propósito: es el dato que el
//   motor CONSUME, se refresca, y un dato de producción versionado es un dato que
//   se pudre sin avisar. La consecuencia, dicha en voz alta por primera vez aquí:
//   **quien clone este repositorio no se queda sin dos ficheros. Se queda sin
//   ninguno.** Ni el OSM de 37 MB, ni los edificios, ni las zonas verdes, ni la
//   jerarquía viaria, ni el callejero.
//
//   ⛔ Y la salida fácil —un script que se baje su propio OSM— está descartada, y
//     no por pereza: **un clon que se descarga su OSM arranca y da OTROS números.
//     Eso es peor que no arrancar, porque parece que funciona.** OSM cambia a
//     diario; una réplica de Overpass es otra fuente (ley 21).
//
// ⭐ ⇒ Lo que se hace es esto: **si el clon no puede tener el dato, que al menos
//      SEPA que no lo tiene** — qué falta, con qué se pidió, y si lo que tiene es
//      EL MISMO fichero que produjo los números publicados.
//
// ═════════════════════════════════════════════════════════════════════════════
// ⚠️ LEY 35, CONTESTADA ANTES DE MIRAR NINGÚN RESULTADO
//    «¿puede este verificador decir `EL MISMO` sin serlo?»
// ═════════════════════════════════════════════════════════════════════════════
//   Podría, de tres maneras, y las tres están cerradas a propósito:
//
//   1. ⛔ **Si comparara solo el TAMAÑO.** Dos ficheros distintos del mismo tamaño
//      pasarían. ⇒ el veredicto lo decide la HUELLA (SHA-256), no los bytes. El
//      tamaño se enseña porque explica, no porque decida.
//   2. ⛔ **Si comparara solo el RECUENTO de features.** Una descarga de mañana
//      con los mismos 3.644 tramos pasaría, y no sería la misma. ⇒ ídem.
//   3. ⛔⛔ **Si la huella esperada se calculara aquí, en tiempo de ejecución.**
//      Sería comparar el fichero consigo mismo: verde siempre, por construcción,
//      que es el nº63 exacto. ⇒ **las huellas de abajo son literales congelados**,
//      medidos con `sha256sum` el 2026-08-07 sobre los ficheros con los que se
//      calcularon los números publicados. Si alguien las regenera desde el disco,
//      este verificador deja de valer y hay que decirlo aquí.
//
//   ⭐ Y la contraprueba de que eso no es palabrería: `--probar` le da al MISMO
//     comparador un fichero bueno, uno cambiado y uno ausente, y enseña los tres
//     veredictos. Sin los tres vistos, esto es una promesa (ley 62).
//
//   ⚠️ QUEDA UN AGUJERO, Y SE DICE: que las huellas sean las de los ficheros que
//     DE VERDAD produjeron los números publicados no lo demuestra este fichero —
//     yo las medí del mismo disco, y eso pasaría por construcción. Lo demuestra
//     otro, y por eso vale: `numeros-congelados.js` reproduce hoy los 26 números
//     publicados a partir de estos mismos ficheros. ⇒ si fueran otros, ese script
//     estaría en rojo. El día que deje de estarlo en verde, esta tabla caduca.
//
// ⛔⛔ CÓMO NACIÓ ESTE FICHERO, porque importa: en la primera escritura estas doce
//    huellas se pusieron **truncadas a 16 caracteres y rellenadas a mano hasta 64**.
//    Diez de las doce eran INVENTADAS. Habrían dado `OTRO` sobre datos correctos —
//    un rojo falso publicado, que es el que no caza nadie (ley 91). Lo cazó una
//    comprobación que compara cada literal con `sha256sum` del disco, y por eso
//    esa comprobación NO puede desaparecer de la bitácora. Ver `docs/BITACORA.md`.
//
//   node src/verificar-datos.js
//   node src/verificar-datos.js --probar     ← las tres pruebas del comparador

'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');
const A = require('./alarma');

const RAIZ = path.join(__dirname, '..');
const L = [];
const log = (s) => L.push(s);

// ═════════════════════════════════════════════════════════════════════════════
// LA TABLA · qué hace falta, dónde va, y cómo se pide
// ═════════════════════════════════════════════════════════════════════════════
// ⚠️ `consulta` sale de donde está ARCHIVADA, no de la memoria de nadie:
//    · los WFS, de la primera línea del `_cabeceras.txt` que se guardó al lado
//      de cada descarga (esos ficheros tampoco viajan, por eso se copia aquí);
//    · el OSM del grafo, de `docs/H1-PRIMER-GRAFO.md` §1, que la publica entera;
//    · el callejero, de `data/fuentes/2026-05-13_zgzradar_callejero_procedencia.txt`.
// ⛔ Y donde no consta, se dice `NO CONSTA` con el porqué. Inventar una consulta
//    plausible sería lo peor que puede hacer este fichero: alguien la ejecutaría.
const NECESARIOS = [
  {
    f: '2026-08-03_overpass_zaragoza-highway_geom-y-tags.json',
    bytes: 37416905,
    sha: '5516878f35b69d4e0fa4d96f3a1faf88e653fe064564d7ecc240be4705050d57',
    quien: 'ruta.js  ⇒ TODO el motor',
    consulta: '[out:json][timeout:900];\n'
      + 'area["name"="Zaragoza"]["admin_level"="8"]["boundary"="administrative"]->.a;\n'
      + 'way["highway"](area.a);\nout geom;\n'
      + 'POST https://overpass-api.de/api/interpreter   (la principal, NO una réplica)',
    numeros: 'el grafo entero: sello 2026-08-03T08:19:51Z · 68.649 nodos · 98.774 aristas · '
      + '94.570 a pie · 170 componentes · 6.499,98 km — y con él LAS SIETE RUTAS y todos los metros publicados',
  },
  {
    f: '2026-08-03_wfs_movilidad-MU1_jerarquia_viaria_completa.json',
    bytes: 2705406,
    sha: 'bd431718627a492adc0867536c9ddd1da82364ffc6468e40cecfd25654c56d6a',
    quien: 'municipal.js · cerrar-punto-ciego.js · asignar-bici.js · sin-vigilancia.js',
    consulta: 'GET https://idezar-sig.zaragoza.es/servicios/geoserver/wfs'
      + '?service=WFS&version=2.0.0&request=GetFeature'
      + '&typeNames=movilidad:MU1_jerarquia_viaria&outputFormat=application/json&srsName=EPSG:4326',
    numeros: 'los 3.644 tramos municipales · los 2.513 m que las siete rutas ganan por vía declarada '
      + '(2.469 con asignación propia) · el 5,4 % de cobertura de la muestra municipal',
  },
  {
    f: '2026-08-03_overpass_zaragoza-limite_geom.json',
    bytes: 171955,
    sha: '82b4b6789ff086ec642974fb14cf8ff611f0a8444d8206f6f711c651cf35ff07',
    quien: 'limite.js  ⇒ el recorte del término',
    consulta: 'NO CONSTA la consulta exacta — el `_cabeceras.txt` de esta descarga solo guardó la '
      + 'respuesta, no la petición (fue un POST a Overpass). El sello del dato sí consta: '
      + 'timestamp_osm_base 2026-08-03T10:49:51Z, dentro del propio fichero.',
    numeros: 'el límite del término municipal (2.989 km² de la ventana) y, con él, qué entra en el grafo',
  },
  {
    f: '2026-08-03_overpass_zaragoza-rios_geom-y-tags.json',
    bytes: 1234292,
    sha: '3c5bbfdd2deb22fe7742bb8de192b868e455ec9430ef513b88f6442176c3b479',
    quien: 'rios.js · verificar-rios.js',
    consulta: 'NO CONSTA la consulta exacta, por lo mismo que la anterior. '
      + 'Sello del dato: timestamp_osm_base 2026-08-03T10:37:31Z.',
    numeros: 'los cruces de río y las contrapruebas de `verificar-rios.js`',
  },
  {
    f: '2026-08-03_overpass_zaragoza-edificios-centro_geom.json',
    bytes: 12092790,
    sha: 'd3e01687d20fa97ac9faa9dee3ddb847a6a606b3a2bdeb7e5b6503d9b68dae6f',
    quien: 'condicionales.js · puerta.js · entrar-por-la-puerta.js',
    consulta: 'NO CONSTA la consulta exacta (POST a Overpass, solo se guardó la respuesta).',
    numeros: 'los 196 pasos condicionales · las 2.669 puertas sin calle · el ruteo a la puerta '
      + 'de las rutas 4 y 5',
  },
  {
    f: '2026-08-03_overpass_zaragoza-entrance-nodos.json',
    bytes: 642420,
    sha: '6ed23a4784c876238de50829843e3c8b5c02c0b2a35dd05c4347ff18745d4ab2',
    quien: 'entradas.js · es-puerta.js · entrar-por-la-puerta.js',
    consulta: 'POST https://overpass-api.de/api/interpreter   (intento 2; el 1 dio HTTP 504) '
      + '— endpoint archivado en el `_cabeceras.txt`; el cuerpo de la consulta NO CONSTA.',
    numeros: 'las entradas declaradas (`entrance=main`) que usan las rutas 4 y 5',
  },
  {
    f: '2026-08-04_wfs_movilidad-MU2_carriles_bici.json',
    bytes: 785975,
    sha: '65b356aa751fb4ec02c24dce43e8fbaf51ee350987c798142feabb6320ac3fd4',
    quien: 'asignar-bici.js · bici-inventario.js',
    consulta: 'GET https://idezar-sig.zaragoza.es/servicios/geoserver/wfs'
      + '?service=WFS&version=2.0.0&request=GetFeature'
      + '&typeNames=movilidad:MU2_carriles_bici&outputFormat=application/json&srsName=EPSG:4326',
    numeros: 'el carril bici de la ruta nº7 («sobre acera» en Academia General Militar) y el rojo '
      + 'declarado de San Juan de la Peña',
  },
  {
    f: '2026-08-04_wfs_idezar-carril_bizi_20250127.json',
    bytes: 585332,
    sha: '763b2bf51729915504fc8158a0d6598f9b9d41ec15efa41f8836ac6b3411be13',
    quien: 'bici-inventario.js',
    consulta: 'GET https://idezar-sig.zaragoza.es/servicios/geoserver/wfs'
      + '?service=WFS&version=2.0.0&request=GetFeature'
      + '&typeNames=idezar_base:carril_bizi_20250127&outputFormat=application/json&srsName=EPSG:4326',
    numeros: 'el inventario de carril bici que contrasta con MU2',
  },
  {
    f: '2026-08-05_wfs_idezar-ZonasVerdesPrincipales.json',
    bytes: 2212739,
    sha: '45fb124669ef54edb6a5b2853be5c6ee5a30c994a4db41584a4ad4e4a21bb80e',
    quien: 'parques.js',
    consulta: 'NO CONSTA la petición en el `_cabeceras.txt` (solo la respuesta). '
      + 'La capa se nombra en `parques.js`: `idezar_base:ZonasVerdesPrincipales_carto1000_2012`, '
      + 'y el `Content-Disposition` de la respuesta la confirma.',
    numeros: 'los 1.235 polígonos municipales verdes · el reparto verde del mapa (3.803 aristas, 145,94 km)',
  },
  {
    f: '2026-08-05_overpass_zaragoza-zonas-verdes.json',
    bytes: 3000293,
    sha: '7dedcc4e8a7c59d272be46ab21edc3d7c3e1528f9fa7e78a88549d0115e55d24',
    quien: 'parques.js',
    consulta: 'NO CONSTA la consulta exacta (POST a Overpass). '
      + 'Sello del dato: timestamp_osm_base 2026-08-05T09:44:50Z.',
    numeros: 'los 3.402 polígonos verdes de OSM y el listón de 1 ha (124 por encima)',
  },
  {
    f: '2026-05-13_zgzradar_callejero-portales-zaragoza.json',
    bytes: 10835605,
    sha: '3c391d60cf91362c984ec2ac2e302f7eec2ce35d94deb42f6e42b678aef7cfdc',
    quien: 'portales.js  ⇒ 29 ficheros de `src/` lo requieren',
    consulta: '⚠️ NO se pide a ningún servidor: lo GENERA OTRO PROYECTO (ZGZ RADAR REACT) desde '
      + '`urbanismo:Portales` del WFS de Urbanismo. Procedencia entera, con su licencia y con el '
      + 'desajuste de los metadatos de origen, en '
      + '`data/fuentes/2026-05-13_zgzradar_callejero_procedencia.txt`.',
    numeros: 'los 46.150 portales · 46.026 enganchados · los 117 sin número pedible · '
      + 'las 51.065 direcciones pedibles · las 4.562 contestadas · los 23.184 huecos · toda la paridad',
  },
  {
    f: '2026-05-13_zgzradar_callejero-vias-zaragoza.json',
    bytes: 1025210,
    sha: '9c7873679df0b94c7b27fa2f6cbaac84a0b610e64a06bfd725070df17d646ebc',
    quien: 'portales.js · donde-falta.js',
    consulta: '⚠️ Igual que el anterior: derivado de `urbanismo:Vias`. Ver el fichero de procedencia.',
    numeros: 'las 3.359 vías del callejero y el nombre con el que se contrasta OSM',
  },
];

// Los que SÍ viajan en el repositorio. Se enseñan igual: que un clon sepa qué
// tiene, no solo qué le falta.
const QUE_SI_VIAJAN = [
  ['data/exploracion/2026-08-02_idezar-geoserver_wfs-getcapabilities.xml', 'donde-falta.js'],
  ['data/exploracion/2026-08-02_osm_overpass_casco-highway.json', 'verificar.js · verificar-ciudad.js'],
  ['data/exploracion/2026-08-02_wfs_urbanismo-Vias_completa-4326.json', 'donde-falta.js'],
  ['data/pruebas/RUTAS-CONOCIDAS.md', 'tabla-rutas.js · rutas-antonio.js'],
  ['data/exploracion/2026-08-02_wfs_zona-*_MU1jv.json  (12)', 'sin-vigilancia.js'],
];

// ═════════════════════════════════════════════════════════════════════════════
// EL COMPARADOR — una sola función, y es la que se pone a prueba con `--probar`
// ═════════════════════════════════════════════════════════════════════════════
/**
 * Tres estados, y ninguno es el estado por defecto:
 *   `NO ESTÁ`   el fichero no existe
 *   `EL MISMO`  su SHA-256 coincide con el congelado
 *   `OTRO`      existe y su SHA-256 NO coincide
 * ⛔ El tamaño NO decide. Se devuelve para poder explicar, no para juzgar.
 */
function veredicto(ruta, shaEsperado) {
  if (!fs.existsSync(ruta)) return { v: 'NO ESTÁ', bytes: null, sha: null };
  const buf = fs.readFileSync(ruta);
  const sha = crypto.createHash('sha256').update(buf).digest('hex');
  return { v: sha === shaEsperado ? 'EL MISMO' : 'OTRO', bytes: buf.length, sha };
}

// ═════════════════════════════════════════════════════════════════════════════
// `--probar` · LAS TRES PRUEBAS DEL COMPARADOR
// ═════════════════════════════════════════════════════════════════════════════
// ⚠️ Va PRIMERO en el fichero y se ejecuta antes que nada cuando se pide, porque
//    un comparador sin probar no puede dar un veredicto sobre nada (la
//    contraprueba va antes que ningún número — es como se escribe aquí).
if (process.argv.includes('--probar')) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'desplazame-verificar-'));
  const bueno = path.join(dir, 'bueno.json');
  const CUERPO = Buffer.from('{"a":1,"b":[2,3],"c":"zaragoza"}\n');
  fs.writeFileSync(bueno, CUERPO);
  const SHA = crypto.createHash('sha256').update(CUERPO).digest('hex');

  // ⚠️ el cambiado altera UN byte y conserva EL TAMAÑO. Es la prueba de que el
  //    veredicto no lo decide el tamaño: si lo decidiera, éste saldría EL MISMO.
  const cambiado = path.join(dir, 'cambiado.json');
  const OTRO = Buffer.from(CUERPO); OTRO[OTRO.length - 3] = 'Z'.charCodeAt(0);
  fs.writeFileSync(cambiado, OTRO);
  const ausente = path.join(dir, 'no-existe.json');

  log('='.repeat(104));
  log('P · ⭐⭐ LAS TRES PRUEBAS DEL COMPARADOR — sin los tres vistos, esto no vale');
  log('');
  const r1 = veredicto(bueno, SHA);
  const r2 = veredicto(cambiado, SHA);
  const r3 = veredicto(ausente, SHA);
  log('   1 · el fichero BUENO                        ' + r1.v.padEnd(10)
    + (r1.v === 'EL MISMO' ? '✅' : '⛔ debería decir EL MISMO'));
  log('   2 · UN BYTE cambiado, MISMO TAMAÑO          ' + r2.v.padEnd(10)
    + (r2.v === 'OTRO' ? '✅' : '⛔ debería decir OTRO'));
  log('        (' + r2.bytes + ' bytes los dos ⇒ el tamaño no lo habría cazado)');
  log('   3 · el fichero AUSENTE                      ' + r3.v.padEnd(10)
    + (r3.v === 'NO ESTÁ' ? '✅' : '⛔ debería decir NO ESTÁ'));
  A.exige(r1.v === 'EL MISMO' && r2.v === 'OTRO' && r3.v === 'NO ESTÁ',
    `el comparador no da los tres veredictos: bueno=${r1.v} cambiado=${r2.v} ausente=${r3.v}`);
  log('');
  log('   ⭐ y que los tres sean DISTINTOS entre sí    '
    + (new Set([r1.v, r2.v, r3.v]).size === 3 ? '✅ tres estados, ninguno por defecto' : '⛔ colapsan'));
  A.exige(new Set([r1.v, r2.v, r3.v]).size === 3,
    'los tres casos no dan tres veredictos distintos: uno de los estados es el estado por defecto');
  fs.rmSync(dir, { recursive: true, force: true });
  log('');
}

// ═════════════════════════════════════════════════════════════════════════════
// EL INFORME
// ═════════════════════════════════════════════════════════════════════════════
log('='.repeat(104));
log('¿PUEDE ESTA COPIA EJECUTAR EL MOTOR? — el dato NO viaja en el repositorio');
log('='.repeat(104));
log('');
log('   ⛔ `data/fuentes/` está gitignoreada ENTERA, y es deliberado: es dato de producción,');
log('      se refresca, y versionarlo sería guardar para siempre algo que se pudre. ⇒ un clon');
log('      recién hecho NO trae ninguno de los ' + NECESARIOS.length + ' ficheros de abajo.');
log('   ⚠️ Y no hay script que los baje, también a propósito: un clon que se descarga su propio');
log('      OSM ARRANCA Y DA OTROS NÚMEROS, que es peor que no arrancar (ley 21).');
log('');

const filas = NECESARIOS.map((n) => {
  const ruta = path.join(RAIZ, 'data', 'fuentes', n.f);
  return { n, r: veredicto(ruta, n.sha) };
});

log('A · LO QUE HACE FALTA');
log('');
log('   ' + 'fichero'.padEnd(60) + 'bytes'.padStart(12) + '  veredicto');
log('   ' + '─'.repeat(99));
for (const { n, r } of filas) {
  const marca = r.v === 'EL MISMO' ? '✅' : r.v === 'OTRO' ? '⚠️' : '⛔';
  log('   ' + n.f.slice(0, 59).padEnd(60)
    + (r.bytes === null ? '—' : String(r.bytes)).padStart(12) + '  ' + marca + ' ' + r.v);
}
log('   ' + '─'.repeat(99));
const mismos = filas.filter((x) => x.r.v === 'EL MISMO').length;
const otros = filas.filter((x) => x.r.v === 'OTRO');
const faltan = filas.filter((x) => x.r.v === 'NO ESTÁ');
log('   ' + 'EL MISMO'.padEnd(60) + String(mismos).padStart(12));
log('   ' + '⚠️ OTRO'.padEnd(59) + String(otros.length).padStart(12));
log('   ' + '⛔ NO ESTÁ'.padEnd(59) + String(faltan.length).padStart(12));

log('');
log('B · LO QUE SÍ VIAJA EN EL REPOSITORIO');
log('');
for (const [f, quien] of QUE_SI_VIAJAN) {
  const p = path.join(RAIZ, f);
  const hay = f.includes('*')
    ? fs.readdirSync(path.join(RAIZ, path.dirname(f))).filter((x) => /MU1jv\.json$/.test(x)).length > 0
    : fs.existsSync(p);
  log('   ' + (hay ? '✅' : '⛔') + ' ' + f.slice(0, 62).padEnd(63) + quien);
}

// ── los que faltan, con su consulta ──────────────────────────────────────────
if (faltan.length) {
  log('');
  log('C · ⛔ LOS QUE FALTAN — con qué se pidió cada uno');
  for (const { n } of faltan) {
    log('');
    log('   ' + n.f);
    log('      lo usa   ' + n.quien);
    log('      consulta ' + n.consulta.split('\n').join('\n               '));
  }
}

// ── los que son OTRO, con lo que dejan de garantizar ─────────────────────────
if (otros.length) {
  log('');
  log('D · ⚠️⚠️ LOS QUE SON **OTRO** — y qué números concretos dejan de estar garantizados');
  log('');
  log('   ⛔ Esto NO dice «puede que difiera». Dice qué deja de valer, con nombre:');
  for (const { n, r } of otros) {
    log('');
    log('   ' + n.f);
    log('      esperado ' + n.sha.slice(0, 32) + '…   ' + n.bytes + ' bytes');
    log('      lo tuyo  ' + r.sha.slice(0, 32) + '…   ' + r.bytes + ' bytes');
    log('      ⇒ dejan de estar garantizados: ' + n.numeros);
  }
  log('');
  log('   ⭐ Y el mecanismo exhaustivo, que no es esta lista: `node src/numeros-congelados.js`');
  log('     compara los 26 números publicados contra lo que sale hoy, uno a uno, y le ha visto');
  log('     el rojo a los 26. Si tu dato es OTRO, ése es el que te dice CUÁLES se movieron.');
}

// ── el veredicto ─────────────────────────────────────────────────────────────
log('');
log('='.repeat(104));
if (faltan.length === 0 && otros.length === 0) {
  log('   ⇒ ✅ TIENES EL DATO CON EL QUE SE CALCULARON LOS NÚMEROS PUBLICADOS.');
  log('     Los ' + NECESARIOS.length + ' ficheros están y son EL MISMO. Lo que salga aquí es comparable con los informes.');
} else {
  if (faltan.length) {
    A.fallo(`faltan ${faltan.length} de ${NECESARIOS.length} ficheros de datos: el motor no puede construir el grafo`);
    log('   ⇒ ⛔ NO PUEDES EJECUTAR EL MOTOR. Falta' + (faltan.length === 1 ? '' : 'n') + ' '
      + faltan.length + ' fichero' + (faltan.length === 1 ? '' : 's') + '. Está'
      + (faltan.length === 1 ? '' : 'n') + ' en §C, con su consulta.');
  }
  if (otros.length) {
    A.fallo(`${otros.length} fichero(s) de datos NO son los que produjeron los números publicados`);
    log('   ⇒ ⚠️ TIENES OTRO DATO. Puedes ejecutar, pero los números NO son los de los informes.');
    log('     Los que dejan de estar garantizados están en §D, con nombre.');
  }
}
log('='.repeat(104));

console.log(L.join('\n'));
