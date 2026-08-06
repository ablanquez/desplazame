// ⭐⭐⭐ TANDA 30 · LOS NÚMEROS CONGELADOS — que un número publicado no pueda
//     cambiar sin que nadie se entere.
//
//   node src/numeros-congelados.js                 # A · congela y compara
//   node src/numeros-congelados.js --contraprueba  # B · rompe el motor y ve el rojo
//
// ═════════════════════════════════════════════════════════════════════════════
// POR QUÉ EXISTE, con su caso — `docs/H1-AUDITORIA-GUARDIANES.md` (tanda 29)
// ═════════════════════════════════════════════════════════════════════════════
//   La auditoría de la tanda 29 rompió `sinNombrePorDefinicion()` desde fuera y
//   `exportar-nombre-simple.js` terminó **en código 0 con sus NUEVE cuadres en ✅**:
//
//      AZULES 56.864 ✅  ROJAS 38.093 ✅  VERDES 3.817 ✅  GRISES 0 ✅  suman 98.774 ✅
//
//   **Cero grises, y todo verde.** El reparto publicado en `docs/H1-VERDE.md`
//   —51.556 / 32.258 / 3.792 / 11.168— cambiaba entero y no saltaba nada.
//
//   ⇒ El motivo no es un descuido: **los cuadres de allí comprueban COHERENCIA, no
//     VALOR.** «el exportado coincide con lo que dice el redactor» y «las cuatro
//     categorías suman 98.774» son ciertas se muevan como se muevan los cuatro
//     números, porque el color LO DECIDE el redactor. Eso es la garantía, y el
//     propio fichero lo dice. Lo que faltaba era otra cosa: **un testigo que sepa
//     cuánto valían ayer.**
//
//   ⭐⭐ Y es la SÉPTIMA FORMA DE MENTIR que salió de aquella tanda: *la comprobación
//     distingue los extremos y no el medio.* Un exportador que revienta se caza
//     solo; uno que sigue exportando un reparto distinto, no.
//
// ═════════════════════════════════════════════════════════════════════════════
// ⚠️⚠️ UN NÚMERO CONGELADO ENVEJECE — CÓMO SE ACTUALIZA
// ═════════════════════════════════════════════════════════════════════════════
//   El día que algo cambie **a propósito** —una fuente nueva, un criterio nuevo,
//   un arreglo— este guardián se pondrá ROJO. **Eso no es un defecto: es el
//   objetivo.** Nadie puede cambiar un número publicado sin enterarse.
//
//   ⛔ ACTUALIZARLO ES UNA DECISIÓN, NO UN TRÁMITE. El orden, y no otro:
//     1 · **Entender por qué se movió.** Si no se sabe, no se toca: un rojo que no
//         se entiende es un hallazgo, no una molestia.
//     2 · **Publicar el número nuevo** en un documento de `docs/` que diga a qué
//         valor sustituye y por qué. Los informes se AÑADEN, no se reescriben.
//     3 · **Y ENTONCES** cambiar aquí el `valor`, y apuntar en `fuente` el
//         documento NUEVO.
//   ⛔ Cambiar el `valor` sin el paso 2 es borrar la historia y dejar el guardián
//     apuntando a un documento que ya no dice eso. Es peor que no tenerlo: parece
//     que vigila.
//
//   ⚠️ Y lo que este fichero NO puede comprobar de sí mismo: que `medir()` no lea
//     la `TABLA`. Si la leyera, saldría verde siempre. Se garantiza por
//     construcción —`medir()` no la menciona— y sobre todo **por `--contraprueba`,
//     que rompe el motor de verdad y mira si esto canta.** Una comprobación cuya
//     validez descansa en una frase es una opinión con formato de guardián (nº118).

'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');
const A = require('./alarma');
const D = require('./direccion');
const Mo = require('./modelo');
const Rel = require('./relato');
const PQ = require('./parques');
const EX = require('./exportar-nombre-simple');
const { construir, ZONA_TERMINO, CRUDO } = require('./ruta');

const SRC = __dirname;

// ═════════════════════════════════════════════════════════════════════════════
// ⭐⭐ LA TABLA — cada fila es UN NÚMERO PUBLICADO, con el documento que lo publica
//     y la afirmación que sostiene. Sin esas dos columnas, un número congelado es
//     una constante mágica.
// ═════════════════════════════════════════════════════════════════════════════
//   `dec` = decimales con los que se publicó, y con los que se compara. Sin `dec`
//   la comparación es de igualdad exacta (entero o cadena).
const TABLA = [
  // ── el dato de entrada: la identidad de todo lo demás ─────────────────────
  { id: 'dato.sello', valor: '2026-08-03T08:19:51Z',
    fuente: 'docs/H1-CIERRE.md §cabecera · docs/H1-GRAFO-CIUDAD.md §cabecera',
    sostiene: '⭐ TODOS los números de abajo son de ESTE dato. Si esto se mueve, se mueve todo lo demás y hay que leerlo antes que nada.' },

  // ── el grafo ──────────────────────────────────────────────────────────────
  { id: 'grafo.nodos', valor: 68649, fuente: 'docs/H1-GRAFO-CIUDAD.md §PLANARIZADO',
    sostiene: 'el tamaño del grafo de la ciudad' },
  { id: 'grafo.aristas', valor: 98774, fuente: 'docs/H1-GRAFO-CIUDAD.md §PLANARIZADO',
    sostiene: 'el denominador de casi todo lo que se publica del mapa' },
  { id: 'grafo.componentes', valor: 170, fuente: 'docs/H1-CIERRE.md §⚑',
    sostiene: 'que la red no se ha partido más de lo que se sabe' },
  { id: 'grafo.aristasAPie', valor: 94570, fuente: 'docs/H1-CIERRE.md §⚑',
    sostiene: 'lo transitable a pie — el grafo que de verdad usa el motor' },
  { id: 'grafo.vertices', valor: 378222, fuente: 'docs/H1-GRAFO-CIUDAD.md §D',
    sostiene: '«el dibujo es el grafo, sin simplificar»' },
  { id: 'grafo.km', valor: 6499.98, dec: 2, fuente: 'docs/H1-DONDE-FALTA-EL-NOMBRE.md §TOTAL',
    sostiene: 'los 6.500 km de red que se publican en todos los informes' },

  // ── ⭐⭐ EL REPARTO DEL MAPA — el que la tanda 29 demostró desnudo ──────────
  { id: 'mapa.azules', valor: 51493, fuente: 'docs/H1-ROJOS-CERRADOS.md §A1 (tanda 31) · antes docs/H1-VERDE.md §0',
    sostiene: '⭐ el reparto publicado del mapa — las líneas CON nombre' },
  { id: 'mapa.rojas', valor: 32310, fuente: 'docs/H1-ROJOS-CERRADOS.md §A1 (tanda 31) · antes docs/H1-VERDE.md §0',
    sostiene: '⭐ el reparto publicado del mapa — «el rojo que queda», sin explicación' },
  { id: 'mapa.verdes', valor: 3803, fuente: 'docs/H1-ROJOS-CERRADOS.md §A1 (tanda 31) · antes docs/H1-VERDE.md §0',
    sostiene: '⭐ el reparto publicado del mapa — las rojas explicadas por estar en zona verde' },
  { id: 'mapa.grises', valor: 11168, fuente: 'docs/H1-VERDE.md §0 y §5',
    sostiene: '⭐ el reparto publicado del mapa — las que no tienen nombre NI DEBEN' },
  { id: 'mapa.rojasMotor', valor: 36113, fuente: 'docs/H1-ROJOS-CERRADOS.md §A1 (tanda 31) · antes docs/H1-VERDE.md §0',
    sostiene: 'las líneas a las que EL MOTOR les ve falta de nombre (rojas + verdes)' },

  // ── ⭐ EL LISTÓN DE 1 ha — la tanda 29 lo encontró sin guardián ────────────
  //   ⭐⭐ La pareja es lo que congela la DECISIÓN: 3.803 con listón y 4.424 sin
  //     él. Congelar solo uno dejaría el corte suelto; con los dos, mover
  //     `MIN_AREA` mueve la distancia entre ellos y salta.
  { id: 'verde.sinListon', valor: 4424, fuente: 'docs/H1-ROJOS-CERRADOS.md §A1 (tanda 31) · antes docs/H1-VERDE.md §0',
    sostiene: '⭐ el listón de 1 ha: sin filtro entrarían 4.424 y con filtro entran 3.803' },
  { id: 'mapa.verdesKm', valor: 145.94, dec: 2, fuente: 'docs/H1-ROJOS-CERRADOS.md §A1 (tanda 31) · antes docs/H1-VERDE.md §0',
    sostiene: 'los metros de rojo explicados por zona verde' },

  // ── ⭐ POR QUÉ MANDA OSM Y NO LA CAPA MUNICIPAL ────────────────────────────
  //   ⭐⭐ El `0` de abajo es UN CERO PUBLICADO, y en este proyecto un cero se
  //     demuestra con un positivo de control (regla 2 de CLAUDE.md). El positivo
  //     va en la fila de encima: **la misma pregunta** —`.nombre`— saca 199 en una
  //     capa y 0 en la otra. Si el lector de la capa municipal se rompiera y dejara
  //     de traer nombres, el 199 seguiría ahí y el 0 no probaría nada; congelados
  //     los dos, el par no puede degenerar sin que salte.
  { id: 'verde.osmNombrados', valor: 199, fuente: 'docs/H1-VERDE.md §1 (razón 2)',
    sostiene: '⭐ «OSM es la única capa con nombre» — la razón por la que manda OSM' },
  { id: 'verde.municipalNombrados', valor: 0, fuente: 'docs/H1-VERDE.md §1 (razón 2)',
    sostiene: '⭐ el CERO de la otra mitad de esa razón — y su positivo de control es la fila de arriba' },
  { id: 'verde.municipalPolis', valor: 1235, fuente: 'docs/H1-VERDE.md §1 (nota del positivo de control)',
    sostiene: 'que la capa municipal SÍ se lee entera — el 0 de nombres no es un fichero vacío' },

  // ── ⭐ LOS PASOS SIN NOMBRE POR DEFINICIÓN — la tanda 26 ───────────────────
  { id: 'pasos.deOsm', valor: 1153, fuente: 'docs/H1-PARQUES.md §A2',
    sostiene: '«el nombre que trae OSM SE RESPETA en el dato: solo cambia el color»' },
  { id: 'pasos.deducidos', valor: 4155, fuente: 'docs/H1-PARQUES.md §A2',
    sostiene: '⭐⭐ los 4.155 nombres que les habíamos puesto NOSOTROS a pasos e isletas, y que se quitaron' },
  { id: 'mapa.azulesConPasos', valor: 56801, fuente: 'docs/H1-ROJOS-CERRADOS.md §A1 (tanda 31) · antes docs/H1-VERDE.md §0',
    sostiene: '⭐ el «antes» de la tanda 26 — el número que hacía falsa la versión de 53.078 (nº111)' },

  // ── ⭐⭐ EL NÚMERO QUE HABÍA CADUCADO, REPUBLICADO Y AHORA SÍ CONGELADO ─────
  //   La tanda 30 lo midió y lo dejó FUERA a propósito, escrito como «medido y no
  //   congelado»: el publicado (3.166, tanda 21) ya no valía, y congelar un número
  //   caducado clava un rojo permanente que en dos días deja de significar nada.
  //   ⇒ La tanda 31 lo republica con su reparto (`src/puertas-sin-calle.js`) y
  //     **entonces** entra aquí. Ése es el orden que manda la cabecera de este
  //     fichero: publicar primero, congelar después.
  { id: 'puertas.sinCalle', valor: 2669, fuente: 'docs/H1-ROJOS-CERRADOS.md §E (tanda 31) · antes 3.166 en docs/H1-NOMBRES-Y-PASOS.md §0',
    sostiene: '⭐⭐ las puertas de Zaragoza que cuelgan de una línea sin nombre — el número que mide el problema en la unidad que le importa a una persona' },

  // ── ⭐⭐⭐ EL UNIVERSO DEL BUSCADOR — republicado en la tanda 35 ─────────────
  //   Las tandas 32, 33 y 34 midieron sobre un universo INFLADO: 117 portales
  //   traían el centinela 99999 («BL0», «A1»…) y una sola vía estiraba su rango
  //   de 1 a 99999. **El 66,2 % de las 150.947 consultas «pedibles» no existía.**
  //   ⇒ `docs/H1-TOPE-ADELANTO.md` §0b los republica y aquí se congelan, que es el
  //     orden que manda la cabecera: publicar primero, congelar después.
  //   ⚠️ Y se congelan CINCO, no uno: el universo, lo que se contesta y lo que se
  //     ofrece de enfrente. Congelar solo el total dejaría suelto el reparto, que
  //     es donde estaba el daño.
  { id: 'buscador.sinNumero', valor: 117, fuente: 'docs/H1-TOPE-ADELANTO.md §B1 (tanda 35)',
    sostiene: '⭐⭐ EL POSITIVO DE CONTROL DEL CENTINELA: si el filtro dejara de filtrar esto sería 0 y todos los de abajo volverían a inflarse. Es la fila que hace que las otras cuatro signifiquen algo' },
  { id: 'buscador.pedibles', valor: 51065, fuente: 'docs/H1-TOPE-ADELANTO.md §0b (tanda 35) · antes 150.947 en docs/H1-ACERA-EQUIVOCADA.md §B3b',
    sostiene: '⭐ el denominador de TODO lo que publican las tandas 32 a 35 sobre el buscador' },
  { id: 'buscador.huecos', valor: 23184, fuente: 'docs/H1-TOPE-ADELANTO.md §0b (tanda 35) · antes 123.132',
    sostiene: 'los números que se pueden pedir y no existen' },
  { id: 'buscador.cambianAcera', valor: 16981, fuente: 'docs/H1-TOPE-ADELANTO.md §0b (tanda 35) · antes 66.973',
    sostiene: '⭐ el tamaño del fallo que Antonio encontró: los huecos que te mandaban a la acera de enfrente' },
  // ── ⚠️⚠️⚠️ EL ÚNICO NÚMERO DE ESTA TABLA QUE SE HA MOVIDO DOS VECES ────────
  //   **4.562 (tanda 33) → 6.421 (tanda 34) → 4.562 (tanda 36).** Y las dos veces
  //   lo movió el mismo listón, `RAZONABLE_M`:
  //     · la tanda 34 lo subió de 50 a 100 m porque el dial decía que entre 50 y
  //       100 las contestadas se multiplicaban por siete (4.562 → 31.411);
  //     · ⭐⭐⭐ **ese acantilado era el centinela 99999.** La tanda 35 lo apagó y el
  //       mismo dial, limpio, dio 4.562 → 6.421: **×1,4**. La razón para estar en
  //       100 no existía y la tanda 36 devuelve el listón a 50.
  //   ⇒ ⭐ Que vuelva EXACTAMENTE al 4.562 de la tanda 33 no es casualidad ni
  //     suerte: toda la contaminación del centinela vivía en la banda de 50 a 100 m,
  //     así que la fila de 50 nunca estuvo tocada. Es la comprobación más barata de
  //     que lo que se apagó era lo que se creía.
  //   ⚠️ Y lo que esta fila enseña de sí misma: **congelar preserva los errores con
  //     la misma fidelidad que las verdades.** El 6.421 estuvo congelado y verde, y
  //     era correcto —lo que estaba mal era la razón por la que se eligió el listón
  //     que lo produce—. Un número congelado protege del cambio silencioso, no de
  //     haber decidido sobre un artefacto.
  { id: 'buscador.contestadas', valor: 4562,
    fuente: 'docs/H1-LISTON-50.md §A1 (tanda 36) · antes 6.421 en docs/H1-TOPE-ADELANTO.md §A4 · antes 31.411 en el dial inflado de docs/H1-PARIDAD.md §C3',
    sostiene: '⭐⭐ lo que contesta el listón de la propia acera. ⚠️ Se ha movido DOS veces con él: 50 → 100 → 50. Antes de tocarlo, leer el bloque de arriba' },
];

// ═════════════════════════════════════════════════════════════════════════════
// ⭐ LA MEDIDA — ⛔ y aquí NO se menciona la TABLA ni una vez.
// ═════════════════════════════════════════════════════════════════════════════
//   ⛔ Y NO SE COPIA NINGUNA REGLA (ley 56): el reparto sale de
//   `EX.construirSalida()`, **la misma función que escribe el fichero del visor**,
//   y el resto pasa por `Rel.tramoDeArista()`, que es el redactor de las rutas.
//   Si esto reimplementara «¿tiene nombre?», sería un segundo camino desde el
//   mismo dato — que es la forma exacta del fallo nº68 y del nº107.
function medir(op = {}) {
  const M = {};
  const t = (etapa) => { if (op.traza) op.traza(etapa); };

  t('el grafo, el modelo y el mapa (`exportar-nombre-simple.js`)');
  const { g, tramoDe, nombreDeWay, idxVerde, salida } = EX.construirSalida();

  M['dato.sello'] = g.sello;
  // ⚠️ `g.contadores.nodos`, NO `g.nodos.length` — bitácora nº120. Son cosas
  //   distintas: el array lleva 68.787 y el contador dice 68.649, porque
  //   `planarizar.js:493` cuenta **los nodos que toca alguna arista**. Los 138 de
  //   diferencia no tienen ni una. El número publicado en la línea ⚑ de `ruta.js`
  //   es el del contador, y es el que hay que comparar: medir el otro daba un rojo
  //   de +138 que no era una deriva del proyecto, era el instrumento apuntando mal.
  M['grafo.nodos'] = g.contadores.nodos;
  M['grafo.aristas'] = g.aristas.length;
  M['grafo.componentes'] = g.comp.n;
  M['grafo.aristasAPie'] = g.aristasAPie;
  M['grafo.vertices'] = g.aristas.reduce((s, e) => s + e.pts.length, 0);
  M['grafo.km'] = g.aristas.reduce((s, e) => s + e.largo, 0) / 1000;

  const c = salida.contadores;
  M['mapa.azules'] = c.conNombre;
  M['mapa.rojas'] = c.sinNombre;
  M['mapa.verdes'] = c.enVerde;
  M['mapa.grises'] = c.noAplica;
  M['mapa.rojasMotor'] = c.sinNombre + c.enVerde;
  M['mapa.verdesKm'] = g.aristas
    .filter((e, i) => salida.aristas[i].n === 3)
    .reduce((s, e) => s + e.largo, 0) / 1000;

  // ── el listón, medido quitándolo ──────────────────────────────────────────
  t('el verde SIN el listón de 1 ha');
  const osmPolis = PQ.cargarOsm();
  const munPolis = PQ.cargarMunicipal();
  M['verde.osmNombrados'] = osmPolis.filter((P) => P.nombre).length;
  M['verde.municipalNombrados'] = munPolis.filter((P) => P.nombre).length;
  M['verde.municipalPolis'] = munPolis.length;

  const idxTodo = PQ.indexar(osmPolis);
  let sinListon = 0;
  for (const e of g.aristas) {
    if (EX.CATEGORIA(tramoDe(e)) !== 0) continue;         // solo las que el MOTOR llama rojas
    if (PQ.dentroDelVerde(idxTodo, e)) sinListon++;
  }
  M['verde.sinListon'] = sinListon;

  // ── los pasos: el «antes», calculado, no reconstruido (nº111) ─────────────
  t('el modelo CON nombre en los pasos — el «antes» de la tanda 26');
  const ctx = D.abrir(g, CRUDO);
  const portales = ctx.enganche.portales.filter((o) => o.enganchado);
  const antes = Mo.construirModelo(g, portales, { pasosConNombre: true });
  const trA = (e) => Rel.tramoDeArista(e, nombreDeWay, antes.modeloDeWay);

  let deOsm = 0, deducidos = 0, azulesAntes = 0;
  for (const e of g.aristas) {
    // ⚠️ El «antes» es de DOS categorías —tiene nombre o no lo tiene—, así que la
    //   pregunta es `.nombre`, no `CATEGORIA()`: el gris no existía todavía.
    //   Preguntar con `CATEGORIA()` devolvía 2 en cada paso y el «antes» salía
    //   idéntico al «ahora» (51.556), que es justo el número que NO puede ser
    //   (bitácora nº121). ⛔ Y sigue sin copiarse ninguna regla: quien contesta si
    //   hay nombre es el redactor.
    if (trA(e).nombre) azulesAntes++;
    if (!e.nombreNoAplica) continue;
    if (nombreDeWay(e.way)) deOsm++;
    else if (trA(e).nombre) deducidos++;
  }
  M['pasos.deOsm'] = deOsm;
  M['pasos.deducidos'] = deducidos;
  M['mapa.azulesConPasos'] = azulesAntes;

  // ⭐ TANDA 31 · ya NO es un `_`: se republicó en `src/puertas-sin-calle.js` con su
  //   reparto por tanda, así que pasa a estar congelado como cualquier otro.
  M['puertas.sinCalle'] = portales
    .filter((o) => o.arista != null && !tramoDe(g.aristas[o.arista]).nombre).length;
  // ── ⭐⭐ EL UNIVERSO DEL BUSCADOR (tanda 35) ────────────────────────────────
  //   ⛔ El barrido NO se copia aquí: se llama a `MP.barrer()`, que es la misma
  //     función que imprime `medir-paridad.js`. Dos caminos de código desde el
  //     mismo dato es la forma exacta de los fallos nº63, nº67 y nº107 — y esta
  //     tanda acaba de enseñar lo caro que sale que dos medidas se den la razón.
  //   ⭐ Y el índice se construye con `D.construirIndice`, que es donde el
  //     centinela se apaga: si se apagara en otro sitio, esto mediría otro mundo.
  t('el universo del buscador (`medir-paridad.barrer`)');
  {
    const MP = require('./medir-paridad');
    const Dir = require('./direccion');
    const Po = require('./portales');
    const vias = Po.cargarVias();
    const indice = Dir.construirIndice(Po.cargarPortales(), vias);
    const tipoDe = (l) => String((vias.get(l[0].codigoVia) || {}).tipoVia || '').toUpperCase().trim();
    const { G, sinNumeroEnIndice } = MP.barrer(indice, tipoDe);
    M['buscador.sinNumero'] = sinNumeroEnIndice;
    M['buscador.pedibles'] = G.rango;
    M['buscador.huecos'] = G.huecos;
    M['buscador.cambianAcera'] = G.cambiaAcera;
    M['buscador.contestadas'] = G.mismaAcera;
  }

  M['_nodosSinArista'] = g.nodos.length - g.contadores.nodos;
  M['_idxVerdePolis'] = idxVerde.polis.length;
  M['_polisSinListon'] = idxTodo.polis.length;
  return M;
}

// ═════════════════════════════════════════════════════════════════════════════
// ⭐ LA COMPARACIÓN — devuelve filas, NO toca la alarma.
// ═════════════════════════════════════════════════════════════════════════════
//   ⭐⭐ Que sea una función pura es lo que permite el positivo de control de §A3:
//   se le pasa una copia con un número movido y se exige que se ponga roja. Si
//   avisara a la alarma por su cuenta, ese control ensuciaría el proceso y no se
//   podría hacer. **Una comprobación que no se puede probar a sí misma no se prueba.**
const nf = (v, dec) => (typeof v === 'number'
  ? v.toLocaleString('es-ES', { minimumFractionDigits: dec || 0, maximumFractionDigits: dec || 0 })
  : String(v));

function comprobar(medido) {
  return TABLA.map((f) => {
    const salio = medido[f.id];
    let ok, dif = null;
    if (salio === undefined) ok = false;
    else if (f.dec != null) {
      ok = Number(salio).toFixed(f.dec) === Number(f.valor).toFixed(f.dec);
      dif = Number(salio) - Number(f.valor);
    } else if (typeof f.valor === 'number') {
      ok = salio === f.valor;
      dif = Number(salio) - f.valor;
    } else ok = salio === f.valor;

    // ⚠️ A3 · EL ROJO DICE QUÉ ESPERABA Y QUÉ SALIÓ. Un «falló» a secas obliga a
    //    reconstruir a mano lo que el guardián ya sabía.
    let texto = null;
    if (!ok) {
      texto = salio === undefined
        ? `${f.id}: NO SE HA MEDIDO — la tabla lo congela y \`medir()\` no lo devuelve`
        : `${f.id}: se publicó ${nf(f.valor, f.dec)} y ahora sale ${nf(salio, f.dec)}`
          + (dif != null && Number.isFinite(dif) ? `  (${dif > 0 ? '+' : ''}${nf(dif, f.dec)})` : '')
          + `  ⇒ ${f.fuente} · sostiene: ${f.sostiene}`;
    }
    return { ...f, salio, ok, dif, texto };
  });
}

module.exports = { TABLA, medir, comprobar, nf };

// ═════════════════════════════════════════════════════════════════════════════
// ⛔ EL BLOQUE CLI VA DESPUÉS DE `module.exports` — nº105 y nº109. Dos veces se ha
//    escrito al final en un fichero que cierra un ciclo, y las dos ha costado caro.
// ═════════════════════════════════════════════════════════════════════════════
if (require.main === module) {
  const log = console.log;
  const di = (k, v) => log(`   ${String(k).padEnd(52)} ${v}`);

  // ⭐⭐ LA CONTRAPRUEBA VA EN LA EJECUCIÓN NORMAL, no detrás de una bandera que
  //   nadie escribe. La batería (`probar-paradas.js`) corre los scripts a pelo: una
  //   contraprueba tras un `--flag` no la correría nunca, y **una comprobación que
  //   nadie ejecuta es una promesa, no una red.** Cuesta ~70 s de los ~93 del
  //   script; es lo que vale saber que la tabla mide algo.
  // ⛔ `CONG_HIJO` corta la recursión: los procesos que lanza la contraprueba son
  //   este mismo fichero, y sin el corte se llamarían sin fondo.
  const soloB = process.argv.includes('--contraprueba');
  const hijo = process.env.CONG_HIJO === '1';
  if (!soloB) congelar(log, di, Date.now());
  if (!hijo) contraprueba(log, di, Date.now());
}

function congelar(log, di, T0) {
  log('='.repeat(100));
  log('LOS NÚMEROS CONGELADOS — lo publicado contra lo que sale hoy');
  log('='.repeat(100));
  log('');
  log('   ⛔ Un número que nadie compara con nada NO está protegido, por muchos ✅ que');
  log('      tenga alrededor. La tanda 29 rompió `sinNombrePorDefinicion()` y el mapa');
  log('      salió con CERO grises y los nueve cuadres en verde.');

  const medido = medir({ traza: (e) => log('   … ' + e) });

  // ── A1/A2 · la tabla ──────────────────────────────────────────────────────
  log('');
  log('A · ⭐⭐ LA TABLA');
  log('');
  log('   ' + 'número'.padEnd(24) + 'publicado'.padStart(14) + 'hoy'.padStart(14) + '   ');
  const filas = comprobar(medido);
  for (const f of filas) {
    log('   ' + f.id.padEnd(24) + nf(f.valor, f.dec).padStart(14)
      + nf(f.salio === undefined ? '—' : f.salio, f.dec).padStart(14)
      + '   ' + (f.ok ? '✅' : '⛔'));
    if (!f.ok) log('      ⛔ ' + f.texto);
  }
  for (const f of filas) A.exige(f.ok, f.texto || `${f.id}: sin comparar`);

  // ── el vacío ──────────────────────────────────────────────────────────────
  //   ⭐⭐ «¿PUEDE ESTO PASAR SIN QUE NADA FUNCIONE?» — sí, de dos maneras, y las dos
  //     se cierran aquí: si la TABLA se quedara vacía, el bucle de arriba no
  //     compararía nada y saldría verde; si `medir()` dejara de devolver una clave,
  //     esa fila desaparecería sin ruido.
  log('');
  log('   ⭐ QUE ESTO NO PUEDA PASAR POR VACÍO');
  const medidas = Object.keys(medido).filter((k) => !k.startsWith('_'));
  const huerfanas = medidas.filter((k) => !TABLA.some((f) => f.id === k));
  di('números congelados en la TABLA', TABLA.length + (TABLA.length > 0 ? '   ✅' : '   ⛔ vacía'));
  di('números que `medir()` devuelve', medidas.length);
  di('⛔ medidos que NADIE congela (se perderían en silencio)', huerfanas.length
    + (huerfanas.length ? '   ⛔ ' + huerfanas.join(' ') : '   ✅'));
  A.exige(TABLA.length > 0, 'la tabla de números congelados está vacía: este guardián no compara nada');
  A.exige(medidas.length === TABLA.length,
    `\`medir()\` devuelve ${medidas.length} números y la tabla congela ${TABLA.length}: alguno no se está comparando`);
  A.exige(huerfanas.length === 0, 'hay números medidos que no están congelados: ' + huerfanas.join(' '));

  // ── A3 · ⭐⭐⭐ CADA FILA HA VISTO SU ROJO, HOY, EN ESTA EJECUCIÓN ───────────
  //   La tanda 29 censó 198 comprobaciones y solo 10 vieron su rojo alguna vez.
  //   Aquí no hace falta esperar a una tanda de auditoría: se le mueve el valor a
  //   CADA fila, una a una, y se exige que la comparación se ponga roja **y que el
  //   texto nombre la fila y los dos números**.
  log('');
  log('   ⭐⭐⭐ EL ROJO DE CADA FILA, VISTO — se le mueve el número a cada una, una a una');
  //   ⚠️ Contra una base SINTÉTICA (los propios valores congelados), no contra la
  //     medida de hoy. La primera versión usaba la medida real y **todas las filas
  //     salían ciegas** en cuanto había una deriva de verdad: contaba los rojos
  //     ajenos como suyos. ⇒ esto prueba EL COMPARADOR, y para eso la entrada tiene
  //     que ser limpia; que la MEDIDA sea de verdad lo prueba `--contraprueba`,
  //     que es otra cosa y va aparte.
  {
    const sintetica = {};
    for (const f of TABLA) sintetica[f.id] = f.valor;
    let ciegas = 0, mudas = 0, contagia = 0;
    for (const f of TABLA) {
      const copia = { ...sintetica };
      copia[f.id] = (typeof f.valor === 'number') ? Number(f.valor) + 1 : String(f.valor) + '-X';
      const r = comprobar(copia);
      const suya = r.find((x) => x.id === f.id);
      if (suya.ok) ciegas++;
      if (r.some((x) => x.id !== f.id && !x.ok)) contagia++;
      // el texto tiene que llevar el nombre, el publicado y el que salió (A3)
      const t = suya.texto || '';
      if (!(t.includes(f.id) && t.includes(nf(f.valor, f.dec)) && t.includes(nf(copia[f.id], f.dec)))) mudas++;
    }
    di('filas que NO se ponen rojas al moverles el número', ciegas + (ciegas ? '   ⛔' : '   ✅ las ' + TABLA.length + ', una a una'));
    di('⚠️ filas que arrastran a OTRA al moverlas (no separan)', contagia + (contagia ? '   ⛔' : '   ✅'));
    di('⚠️ rojos que no dicen qué esperaban y qué salió', mudas + (mudas ? '   ⛔' : '   ✅'));
    A.exige(ciegas === 0, `${ciegas} filas congeladas no se ponen rojas al cambiarles el valor: no vigilan nada`);
    A.exige(contagia === 0, `${contagia} filas ponen roja a otra al moverlas: las filas no son independientes`);
    A.exige(mudas === 0, `${mudas} rojos no nombran el número esperado y el obtenido (A3)`);
    // ⭐ y el NEGATIVO, escrito con la misma tinta que el positivo (nº116): con los
    //   valores publicados tal cual, la comparación NO puede inventarse un rojo.
    const limpio = comprobar(sintetica).filter((x) => !x.ok).length;
    di('⭐ y el control NEGATIVO: sin mover nada, ¿inventa rojos?', limpio === 0 ? '✅ ninguno' : '⛔ ' + limpio);
    A.exige(limpio === 0, 'la comparación saca rojos con los valores publicados sin tocar: se los inventa');
  }

  // ── lo que se mide y NO se congela, dicho ─────────────────────────────────
  log('');
  log('   ⚠️ MEDIDO Y **NO** CONGELADO — a propósito, y por eso va escrito');
  di('nodos del array que NO toca ninguna arista', medido._nodosSinArista);
  log('      ⚠️ `g.nodos` lleva ' + (medido['grafo.nodos'] + medido._nodosSinArista) + ' y el contador publicado dice '
    + medido['grafo.nodos'] + '. La diferencia');
  log('        no es una deriva: `planarizar.js:493` cuenta **los nodos que toca alguna arista**,');
  log('        y ésos no tocan ninguna. ⛔ No se toca nada — se apunta y se enseña.');
  di('polígonos verdes de OSM con listón / sin listón', `${medido._idxVerdePolis} / ${medido._polisSinListon}`);
  log('      ⚠️ No están publicados en ningún informe, así que no hay nada que congelar:');
  log('        lo que sostiene la decisión del listón es la pareja 3.792 / 4.405, y ésa sí está.');

  log('');
  log(A.cierre('NÚMEROS CONGELADOS'));
  di('tiempo total', ((Date.now() - T0) / 1000).toFixed(1) + ' s');
  log('');
  log('   ⚠️ Si esto sale ROJO, lee la cabecera del fichero antes de tocar la tabla:');
  log('      actualizar un número congelado ES UNA DECISIÓN, y va después de publicarlo.');
}

// ═════════════════════════════════════════════════════════════════════════════
// §B · ⭐⭐⭐ LA CONTRAPRUEBA — romper el motor y ver si esto canta
// ═════════════════════════════════════════════════════════════════════════════
//   ⛔ Sin esto, lo de arriba es una tabla bonita. «El instrumento arranca» no es
//     «el instrumento mide» (ley de la tanda 29, nº117).
//
//   ⭐ DOS ROTURAS DISTINTAS, no una — *una comprobación que caza un fallo concreto
//     puede ser ciega a los demás*:
//       R1 · EL COLAPSO   `sinNombrePorDefinicion()` → `return false`. Nadie es
//            «sin nombre por definición». Es la rotura exacta de la tanda 29, la
//            que salió en código 0 con nueve ✅.
//       R2 · LA DERIVA    se quita `traffic_island` de la lista. **674 aristas de
//            98.774: un 0,7 %.** Es la que de verdad importa, porque una deriva
//            pequeña es lo que un cuadre por construcción no puede ver jamás.
//
//   ⭐⭐ Y LAS TRES TRAMPAS QUE YA NOS HAN PILLADO, comprobadas antes de creerse nada:
//     1 · **¿la mutación OCURRE?** El preload apunta cuántas veces parcheó de
//         verdad. Cero parches = el resultado no dice nada (nº117: cinco de diez).
//     2 · **¿el proceso llega a ejecutar lo que se prueba?** El reloj, contra la
//         línea base del mismo script. 0,1 s contra 25 delató el preload roto.
//     3 · **¿el rojo es EL SUYO?** Se exige que el mensaje nombre las filas que
//         tienen que moverse, no que «salió en rojo».
//
//   ⚠️ El mecanismo de mutación está DUPLICADO con `src/auditoria-guardianes.js`.
//     No se ha unificado porque unificarlo obliga a tocar aquel fichero, que sale
//     en rojo a propósito y cuyos cinco rojos vivos se deciden en la tanda
//     siguiente. Queda anotado como cabo.
function contraprueba(log, di, T0) {
  log('='.repeat(100));
  log('B · LA CONTRAPRUEBA — se rompe el motor y se mira si el guardián canta');
  log('='.repeat(100));

  const PRE = fs.mkdtempSync(path.join(os.tmpdir(), 'desplazame-cong-'));
  const testigo = path.join(PRE, 'testigo.txt').split(path.sep).join('/');
  const preload = path.join(PRE, 'mut.js');
  // ⛔⛔ SOBRE EL FUENTE, NO SOBRE LOS EXPORTS (nº117): `planarizar.js` llama a
  //   `sinNombrePorDefinicion(t)` por nombre, así que parchear `exports` no muta nada.
  fs.writeFileSync(preload, `
    global.__MUT_VIVA = true;
    const fs = require('fs');
    const path = require('path');
    const Module = require('module');
    const CUAL = process.env.MUT_CUAL || '';
    const marca = (q) => { try { fs.appendFileSync(${JSON.stringify(testigo)}, q + '\\n'); } catch (e) {} };
    const CAMBIOS = {
      'colapso': ['planarizar.js',
        'function sinNombrePorDefinicion(t) {',
        'function sinNombrePorDefinicion(t) { return false;'],
      'deriva':  ['planarizar.js',
        "const FOOTWAY_SIN_NOMBRE = new Set(['traffic_island']);",
        'const FOOTWAY_SIN_NOMBRE = new Set([]);'],
    };
    const orig = Module._extensions['.js'];
    Module._extensions['.js'] = function (mod, filename) {
      const c = CAMBIOS[CUAL];
      if (c && path.basename(filename) === c[0]) {
        let src = fs.readFileSync(filename, 'utf8');
        if (src.includes(c[1])) { src = src.replace(c[1], c[2]); marca(CUAL); }
        else marca('PATRON-NO-ENCONTRADO');
        return mod._compile(src, filename);
      }
      return orig(mod, filename);
    };
  `);
  const precargar = `--require "${preload.split(path.sep).join('/')}"`;
  const correr = (env) => {
    const t0 = Date.now();
    const r = spawnSync(process.execPath, [path.join(SRC, 'numeros-congelados.js')],
      { encoding: 'utf8', timeout: 900000, env: { ...process.env, CONG_HIJO: '1', ...env } });
    return { codigo: r.status, salida: (r.stdout || '') + (r.stderr || ''), s: (Date.now() - t0) / 1000 };
  };
  const fallosDe = (s) => (s.match(/⛔ FALLO · [^\n]+/g) || []).map((x) => x.replace('⛔ FALLO · ', '').trim());

  // ── B0 · la palanca ───────────────────────────────────────────────────────
  log('');
  log('   B0 · ⭐ ¿ESTÁ CONECTADA LA PALANCA? — antes de fiarse de ningún rojo');
  {
    const r = spawnSync(process.execPath, ['-e', 'process.exit(global.__MUT_VIVA ? 0 : 9)'],
      { encoding: 'utf8', env: { ...process.env, NODE_OPTIONS: precargar } });
    di('   el precargado se carga de verdad', r.status === 0 ? '✅ sí' : '⛔ NO — nada de lo de abajo valdría');
    A.exige(r.status === 0, 'el precargado del mutador no se carga: la contraprueba entera sería falsa');
  }

  // ── B1 · la línea base ────────────────────────────────────────────────────
  log('');
  log('   B1 · ⭐ LA LÍNEA BASE — sin mutar. Si esto ya sale rojo, lo de abajo no prueba nada.');
  const base = correr({});
  di('   `numeros-congelados.js` sin tocar', `código ${base.codigo}  ${base.s.toFixed(1)} s  `
    + (base.codigo === 0 ? '✅ verde' : '⛔ ' + fallosDe(base.salida).length + ' rojo(s) vivo(s)'));
  for (const f of fallosDe(base.salida)) log('         · ' + f.slice(0, 96));
  A.exige(base.codigo === 0, 'la línea base ya sale en rojo: la contraprueba no distinguiría nada');
  // ⭐ y que el corte de recursión funcione, comprobado y no supuesto: el hijo NO
  //   puede haber corrido esta misma sección. Si lo hiciera, no habría fondo.
  const recursa = base.salida.includes('LA CONTRAPRUEBA — se rompe el motor');
  di('   ⭐ el hijo NO repite la contraprueba (corte `CONG_HIJO`)', recursa ? '⛔ RECURSA' : '✅');
  A.exige(!recursa, 'el corte de recursión no funciona: el hijo vuelve a lanzar la contraprueba');

  // ── B2 · las dos roturas ──────────────────────────────────────────────────
  const ROTURAS = [
    { cual: 'colapso', que: '`sinNombrePorDefinicion()` → `return false`',
      espera: ['mapa.grises', 'mapa.azules'],
      porque: 'la rotura EXACTA de la tanda 29: salió en código 0 con nueve ✅ y cero grises' },
    { cual: 'deriva', que: 'se quita `traffic_island` de la lista (674 aristas, 0,7 %)',
      espera: ['mapa.grises'],
      porque: '⭐ la deriva pequeña — lo que un cuadre por construcción no puede ver jamás' },
  ];
  log('');
  log('   B2 · ⭐⭐ LAS DOS ROTURAS');
  let cazadas = 0;
  for (const R of ROTURAS) {
    try { fs.rmSync(path.join(PRE, 'testigo.txt')); } catch (e) { /* no existía */ }
    const r = correr({ NODE_OPTIONS: precargar, MUT_CUAL: R.cual });
    let parches = 0, roto = false;
    try {
      const t = fs.readFileSync(path.join(PRE, 'testigo.txt'), 'utf8').trim().split(/\r?\n/).filter(Boolean);
      parches = t.length;
      roto = t.some((x) => x.includes('PATRON-NO-ENCONTRADO'));
    } catch (e) { parches = 0; }
    const rojos = fallosDe(r.salida);
    // ⭐ trampa 3: ¿es EL SUYO? el rojo tiene que nombrar las filas que se mueven
    const suyos = R.espera.filter((id) => rojos.some((x) => x.startsWith(id + ':')));
    // ⭐ trampa 2: el reloj, contra la base del mismo script
    const reloj = r.s >= base.s * 0.5;

    log('');
    log('   ⭐ ROTURA «' + R.cual + '» — ' + R.que);
    log('      ' + R.porque);
    di('   1 · ¿la mutación OCURRIÓ? (parches sobre el fuente)', parches
      + (roto ? '   ⛔⛔ EL PATRÓN A MUTAR YA NO EXISTE' : (parches > 0 ? '   ✅ sí' : '   ⛔⛔ NO OCURRIÓ — el resultado no dice nada')));
    di('   2 · ¿el reloj es el normal? (base ' + base.s.toFixed(1) + ' s)', r.s.toFixed(1) + ' s'
      + (reloj ? '   ✅' : '   ⛔ murió antes de medir'));
    di('   3 · ¿el guardián SALTA?', `código ${r.codigo}  ${rojos.length} rojo(s)`
      + (r.codigo !== 0 ? '   ✅ SÍ' : '   ⛔⛔ NO SALTA NADA'));
    di('   4 · ¿es SU rojo? (nombra ' + R.espera.join(', ') + ')',
      `${suyos.length} de ${R.espera.length}` + (suyos.length === R.espera.length ? '   ✅' : '   ⛔'));
    // ⛔ SIN la marca `⛔ FALLO ·` — `fallosDe()` ya la ha quitado, y tiene que
    //   seguir así: `probar-paradas.js` da por roto cualquier script cuya salida
    //   lleve la marca **y termine en 0**, que es justo lo que hace este. Si algún
    //   día se imprimieran los rojos del hijo tal cual, la batería entera se
    //   pondría roja por una comprobación que está funcionando bien.
    for (const x of rojos.slice(0, 6)) log('         ⛔ ' + x.slice(0, 110));

    A.exige(!roto, `la rotura «${R.cual}»: el patrón a mutar ya no existe en el fuente — el mutador está caduco`);
    A.exige(parches > 0, `la rotura «${R.cual}» NO llegó a ocurrir: su resultado no dice nada (nº117)`);
    A.exige(reloj, `la rotura «${R.cual}» acabó en ${r.s.toFixed(1)} s contra ${base.s.toFixed(1)} s de base: murió antes de medir (nº106)`);
    A.exige(r.codigo !== 0, `la rotura «${R.cual}» NO hace saltar al guardián: nace ciego`);
    A.exige(suyos.length === R.espera.length,
      `la rotura «${R.cual}» salta, pero no por lo suyo: se esperaba ver ${R.espera.join(', ')} y salieron ${rojos.length} rojos`);
    if (parches > 0 && reloj && r.codigo !== 0 && suyos.length === R.espera.length) cazadas++;
  }

  log('');
  di('⭐⭐ roturas CAZADAS', `${cazadas} de ${ROTURAS.length}`
    + (cazadas === ROTURAS.length ? '   ✅' : '   ⛔'));
  log('');
  log('   ⚠️ Lo que esto NO prueba: que la tabla cubra los números que importan. Prueba que');
  log('      las filas que hay se ponen rojas cuando el motor cambia. Cuántos números');
  log('      publicados siguen sin congelar está en el informe, y no es cero.');
  log('');
  log(A.cierre('LA CONTRAPRUEBA'));
  di('tiempo total', ((Date.now() - T0) / 1000).toFixed(1) + ' s');
  try { fs.rmSync(PRE, { recursive: true, force: true }); } catch (e) { /* da igual */ }
}
