// ⭐⭐⭐ TANDA 3 · EL PUNTERO — que desde un número superado se llegue a quien lo
//     sustituyó, SIN reescribir el documento que lo publicó.
//
//   node src/superados.js            # A · el guardián, en las dos direcciones
//   node src/superados.js --marcar   # B · escribe/actualiza la cabecera de cada documento
//   node src/superados.js --probar   # C · la contraprueba: le enseña su rojo, doble
//
// ═════════════════════════════════════════════════════════════════════════════
// POR QUÉ EXISTE, con su medida
// ═════════════════════════════════════════════════════════════════════════════
//   El proyecto tiene una ley —«los informes se AÑADEN, no se reescriben»— y con
//   ella un puntero HACIA ATRÁS: el documento nuevo dice a quién corrige. Lo que
//   NO existía es el de adelante. Medido antes de escribir una línea de esto:
//
//     · desde el documento que publicó el número viejo se llega al que lo
//       republica en **0 de 4** pares comprobados;
//     · de los **71** scripts de `src/`, los que abren un documento de `docs/`
//       son **1**, y lee la BITÁCORA;
//     · los 26 congelados citan **38** rutas `docs/*.md` en su campo `fuente`.
//       Existen las 38. **Nadie abre ninguna.**
//
//   ⇒ El puntero hacia atrás es una CADENA DE TEXTO impecable que nadie sigue.
//     Ley 44 en su forma más cara: un ⛔ impreso es texto, y una referencia
//     impresa también.
//
//   ⭐ Y el caso que lo paga: `H1-NOMBRES-Y-PASOS.md` publica «3.166 puertas sin
//     calle». `H1-ROJOS-CERRADOS.md` §E1 lo republica en 2.669. Desde el primero
//     no se llega al segundo — `grep -c ROJOS-CERRADOS docs/H1-NOMBRES-Y-PASOS.md`
//     da **0**. La cadena es navegable solo en la dirección en la que nadie la lee.
//
// ═════════════════════════════════════════════════════════════════════════════
// ⛔⛔ MARCAR NO ES CORREGIR
// ═════════════════════════════════════════════════════════════════════════════
//   El cuerpo de un registro histórico **no se toca jamás**. Este fichero escribe
//   UN bloque acotado por dos comentarios HTML, y solo eso. Regenerarlo sustituye
//   el bloque entero, así que es idempotente y no se puede duplicar.
//   ⚠️ Lo que dice el cuerpo era verdad el día que se escribió. La cabecera no lo
//     desmiente: dice dónde seguir leyendo.
//
// ═════════════════════════════════════════════════════════════════════════════
// ⭐⭐ EL GUARDIÁN VIGILA EN LAS DOS DIRECCIONES, y esto es una decisión de Antonio
// ═════════════════════════════════════════════════════════════════════════════
//   D1 · un valor superado impreso en un documento cuya cabecera NO lo declara.
//   D2 · una cabecera que declara un par cuyo valor YA NO ESTÁ en el cuerpo.
//
//   ⛔ Con una sola dirección la cabecera se pudre por el otro lado sin que nadie
//     lo vea: alguien mueve una cifra del cuerpo y la cabecera se queda hablando
//     de un número que ahí ya no aparece. Es exactamente la forma de la ley 110
//     —un `✅` que sigue ahí— aplicada al propio remedio.
//
// ⚠️ LO QUE ESTO NO PUEDE COMPROBAR, dicho antes de que nadie lo suponga:
//   · que el par sea CIERTO. Que 3.166 se convirtiera en 2.669 lo decide el
//     proyecto, no este fichero. Aquí solo se garantiza que quien lea el viejo
//     encuentre el camino al nuevo.
//   · que el documento que republica siga diciendo lo que dice. Eso es el LATIDO
//     (`src/latido.js`), que es otra cosa y otro commit.

'use strict';
const fs = require('fs');
const path = require('path');
const A = require('./alarma');

const RAIZ = path.join(__dirname, '..');
const log = console.log;

// ═════════════════════════════════════════════════════════════════════════════
// ⭐⭐ LA TABLA — lo ÚNICO escrito a mano, porque es una decisión del proyecto
// ═════════════════════════════════════════════════════════════════════════════
// ⛔ Ley 105: dónde aparece cada valor NO se escribe aquí. Se busca. Escribirlo
//   a mano sería una lista que envejece sola, que es el fallo que esto arregla.
//
// Los campos:
//   viejo · nuevo   tal y como se escriben en los documentos (con su punto de
//                   millar y su coma decimal). Se buscan literalmente.
//   que             qué mide, en la unidad que le importa a una persona.
//   republicaEn     el documento que publica el valor nuevo. `null` = TODAVÍA NO
//                   SE HA REPUBLICADO, y la cabecera lo dirá así. ⛔ Un `null` no
//                   es un hueco que rellenar con lo que parezca: es un pendiente
//                   declarado.
//   desde           la fecha en que el valor nuevo se publicó (o se midió, si
//                   sigue pendiente).
//   contexto        ⭐⭐⭐ lo que la línea tiene que llevar ADEMÁS de la cifra.
//   propias/ajenas  ⭐⭐ el recuento CERRADO de líneas que casan la cifra: cuántas
//                   son este dato y cuántas son otro. Si mañana se mueven, rojo.
//
// ═════════════════════════════════════════════════════════════════════════════
// ⛔⛔ POR QUÉ HAY UN `contexto`, Y ES LA LECCIÓN MÁS CARA DE ESTE FICHERO
// ═════════════════════════════════════════════════════════════════════════════
//   La primera versión buscaba solo la cifra. Su guardián dio su rojo, su control
//   del buscador dio ✅ («3182» no cuenta, «-0.89182» no cuenta) y el generador
//   estaba listo. **Dos de las 41 apariciones de `182` eran otro número** —un
//   listón de 182 m y 182 portales de Movera— y **tres de las seis de `412`
//   también** —«412× el azar» dos veces, y un «412 (97,2 %)»—.
//
//   ⇒ **Una cifra no identifica un dato: lo identifica la cifra MÁS su contexto.**
//   ⚠️ Y lo que lo hace grave aquí, y no en un barrido cualquiera: este fichero
//     no LEE, **ESCRIBE**. El mismo barrido, con la misma precisión, es aceptable
//     auditando e inaceptable marcando. Habría publicado una afirmación falsa
//     dentro de un registro histórico — que es justo lo que «marcar no es
//     corregir» existe para impedir. Bitácora 172.
//
//   ⭐ `contexto: null` significa «la cifra es lo bastante rara como para
//     identificar el dato ella sola», y **no se cree por bonita**: el recuento
//     cerrado de abajo obliga a que alguien haya mirado las líneas una vez.
const PARES = [
  // ── el reparto del mapa · republicado en la tanda 31 ──────────────────────
  { viejo: '51.556', nuevo: '51.493', que: 'las líneas CON nombre del mapa',
    republicaEn: 'docs/H1-ROJOS-CERRADOS.md §0', desde: '2026-08-05',
    contexto: null, propias: 8, ajenas: 0 },
  { viejo: '32.258', nuevo: '32.310', que: 'las líneas rojas del mapa',
    republicaEn: 'docs/H1-ROJOS-CERRADOS.md §0', desde: '2026-08-05',
    contexto: null, propias: 7, ajenas: 0 },
  { viejo: '3.792', nuevo: '3.803', que: 'las rojas explicadas por zona verde',
    republicaEn: 'docs/H1-ROJOS-CERRADOS.md §0', desde: '2026-08-05',
    contexto: null, propias: 10, ajenas: 0 },
  { viejo: '4.405', nuevo: '4.424', que: 'las verdes SIN el listón de 1 ha',
    republicaEn: 'docs/H1-ROJOS-CERRADOS.md §0', desde: '2026-08-05',
    contexto: null, propias: 4, ajenas: 0 },
  { viejo: '145,34', nuevo: '145,94', que: 'los km de rojo explicados por zona verde',
    republicaEn: 'docs/H1-ROJOS-CERRADOS.md §0', desde: '2026-08-05',
    contexto: null, propias: 4, ajenas: 0 },
  { viejo: '56.864', nuevo: '56.801', que: 'las azules ANTES de la tanda 26',
    republicaEn: 'docs/H1-ROJOS-CERRADOS.md §0', desde: '2026-08-05',
    contexto: null, propias: 5, ajenas: 0 },
  { viejo: '53.078', nuevo: '56.801', que: 'las azules antes de la tanda 26 — la versión falsa (nº111)',
    republicaEn: 'docs/H1-ROJOS-CERRADOS.md §0', desde: '2026-08-05',
    contexto: null, propias: 0, ajenas: 0 },

  // ⭐ TANDA 5 · lo llevaba el bloque B en su tabla y esta tabla no lo tenía.
  { viejo: '36.050', nuevo: '36.113', que: 'las líneas a las que el motor les ve falta de nombre',
    republicaEn: 'docs/H1-ROJOS-CERRADOS.md §0', desde: '2026-08-05',
    contexto: null, propias: 4, ajenas: 0 },

  // ⭐⭐ TANDA 5 · Y ÉSTOS SON DE OTRA ESPECIE: no son una cifra de una tabla,
  //   son **la anotación de un comando** —`node src/numeros-congelados.js  # los
  //   21 congelados`— escrita en PRESENTE. Quien la lea hoy ejecuta y ve 26.
  //   ⛔ Es el superado más caro de todos: los demás hay que creérselos, éste el
  //     lector lo desmiente él solo en tres segundos.
  { viejo: '21 congelados', nuevo: '26 congelados', que: 'cuántos números vigila `numeros-congelados.js`',
    republicaEn: 'docs/H1-REPUBLICACIONES.md §B', desde: '2026-08-09',
    contexto: null, propias: 4, ajenas: 0 },
  { viejo: '21 números congelados', nuevo: '26 números congelados', que: 'cuántos números vigila `numeros-congelados.js`',
    republicaEn: 'docs/H1-REPUBLICACIONES.md §B', desde: '2026-08-09',
    contexto: null, propias: 2, ajenas: 0 },

  // ── las puertas sin calle · dos generaciones de valor viejo ───────────────
  { viejo: '11.742', nuevo: '2.669', que: 'las puertas que cuelgan de una línea sin nombre',
    republicaEn: 'docs/H1-ROJOS-CERRADOS.md §E1', desde: '2026-08-05',
    contexto: null, propias: 10, ajenas: 0 },
  { viejo: '3.166', nuevo: '2.669', que: 'las puertas que cuelgan de una línea sin nombre',
    republicaEn: 'docs/H1-ROJOS-CERRADOS.md §E1', desde: '2026-08-05',
    contexto: null, propias: 10, ajenas: 0 },

  // ── el universo del buscador · republicado en la tanda 35 ─────────────────
  { viejo: '150.947', nuevo: '51.065', que: 'las direcciones pedibles del buscador',
    republicaEn: 'docs/H1-TOPE-ADELANTO.md §B2', desde: '2026-08-06',
    contexto: null, propias: 1, ajenas: 0 },
  { viejo: '123.132', nuevo: '23.184', que: 'los huecos del buscador',
    republicaEn: 'docs/H1-TOPE-ADELANTO.md §B2', desde: '2026-08-06',
    contexto: null, propias: 1, ajenas: 0 },
  { viejo: '66.973', nuevo: '16.981', que: 'las consultas que cambian de acera',
    republicaEn: 'docs/H1-TOPE-ADELANTO.md §B2', desde: '2026-08-06',
    contexto: null, propias: 1, ajenas: 0 },
  { viejo: '31.411', nuevo: '4.562', que: 'las consultas contestadas — con el dial inflado',
    republicaEn: 'docs/H1-TOPE-ADELANTO.md §B2', desde: '2026-08-06',
    contexto: null, propias: 6, ajenas: 0 },
  { viejo: '6.421', nuevo: '4.562', que: 'las consultas contestadas — con el listón de 100 m',
    republicaEn: 'docs/H1-LISTON-50.md §D', desde: '2026-08-06',
    contexto: null, propias: 2, ajenas: 0 },
  { viejo: '2.982', nuevo: '2.138', que: 'las sugerencias BUENAS a ≤ 20 m (nº142)',
    republicaEn: 'docs/H1-TOPE-ADELANTO.md §A3', desde: '2026-08-06',
    contexto: null, propias: 2, ajenas: 0 },

  // ── ⚠️ LOS QUE TODAVÍA NO SE HAN REPUBLICADO ──────────────────────────────
  //   ⛔ No se inventa el documento. La cabecera dirá «republicación PENDIENTE»,
  //     que es la verdad y sigue siendo navegable: el lector sabe que ese número
  //     no vale y que nadie ha publicado el que vale.
  { viejo: '16,9', nuevo: '21,3', que: 'las veces el azar de los portales como testigos',
    republicaEn: 'docs/H1-REPUBLICACIONES.md §A2', desde: '2026-08-09',
    contexto: /azar/i, propias: 1, ajenas: 0 },

  // ⭐⭐ LOS DOS QUE OBLIGARON A INVENTAR EL `contexto`, y por eso su `ajenas` no
  //   es cero: son el positivo de control de que este recuento sabe decir que no.
  { viejo: '182', nuevo: '232', que: 'las líneas decorativas — un ⛔ impreso que no para nada',
    republicaEn: 'docs/auditoriafinal/B2-CONTRASTE-2026-08-07.md §B2·V3', desde: '2026-08-07',
    // ⛔ ajenas conocidas: el listón p99 de 182 m (H1-ACERA-EQUIVOCADA) y los 182
    //   portales de Movera (H1-DONDE-FALTA-EL-NOMBRE). No son este número.
    contexto: /decorativ|veredicto|proceso en rojo/i, propias: 9, ajenas: 2 },
  // ⭐⭐⭐ TANDA 4 · EL PRIMER PAR QUE NO ES UN NÚMERO PELADO, y el primero que
  //   no envejeció: **cambió de pregunta**. Los ~6 km/h eran la velocidad de
  //   Antonio, medidos bien; 5,0 es la que publica un buscador para cualquiera.
  //   ⛔ Por eso el `que` no dice «la velocidad»: dice de quién era.
  { viejo: '6 km/h', nuevo: '5,0 km/h', que: 'la velocidad con la que se calculan los tiempos — era la de UNA persona',
    republicaEn: 'docs/H1-VELOCIDAD-ESTANDAR.md §0', desde: '2026-08-08',
    contexto: null, propias: 9, ajenas: 0 },

  { viejo: '412', nuevo: '438', que: 'los metros sin nombre de la ruta nº6 (§A6)',
    republicaEn: 'docs/H1-REPUBLICACIONES.md §A1', desde: '2026-08-09',
    // ⭐ las tres propias son FILAS DE TABLA sin una sola palabra alrededor: lo que
    //   las identifica es empezar por la ruta 6. ⛔ ajenas: «412× el azar» (×2) y un
    //   «412 (97,2 %)» que es otra cosa entera.
    contexto: /^\s*\|?\s*6\s/, propias: 3, ajenas: 3 },
];

// ═════════════════════════════════════════════════════════════════════════════
// ⛔ DÓNDE **NO** SE EXIGE LA MARCA, y por qué
// ═════════════════════════════════════════════════════════════════════════════
//   · `docs/BITACORA.md` y `docs/auditoriafinal/*` SON el registro de la
//     corrección: ahí el valor viejo tiene que aparecer, y marcarlo sería
//     marcar la propia acta.
//   · el documento que REPUBLICA imprime el viejo al lado del nuevo por
//     definición («51.556 → 51.493»). Exigirle una cabecera sería pedirle que se
//     apunte a sí mismo.
//   · ⛔⛔ TANDA 4 · `data/pruebas/RUTAS-CONOCIDAS.md` **NO ES DE ESTE
//     REPOSITORIO: es de Antonio.** `modelo-rutas.js` lo declara desde la tanda
//     33 —*«no se toca»*—. Dice `~6 km/h` cuatro veces y **seguirá diciéndolo**.
//     ⚠️ Escribirle una cabecera generada sería tomar posesión de un documento
//       ajeno, y este mecanismo existe precisamente para no reescribir a nadie.
//     ⇒ se excluye del MARCADO, se dice aquí, y se reporta hacia arriba.
//   · ⭐ TANDA 5 · `docs/H1-REPUBLICACIONES.md` es EL ÍNDICE de todo esto: su
//     tabla lleva los 22 valores viejos al lado de los nuevos, que es su trabajo.
//     Es un acta, como la bitácora. Exigirle una cabecera sería pedirle que se
//     apunte a sí mismo 22 veces.
const esActa = (d) => /BITACORA\.md$|auditoriafinal\//.test(d)
  || /RUTAS-CONOCIDAS\.md$|H1-REPUBLICACIONES\.md$/.test(d.replace(/\\/g, '/'));

const INICIO = '<!-- SUPERADOS:INICIO — generado por src/superados.js · ⛔ no editar a mano -->';
const FIN = '<!-- SUPERADOS:FIN -->';

/** Todos los .md bajo docs/, más los dos de la raíz que publican cifras. */
function documentos() {
  const out = [];
  for (const f of fs.readdirSync(path.join(RAIZ, 'docs'))) if (f.endsWith('.md')) out.push('docs/' + f);
  for (const f of fs.readdirSync(path.join(RAIZ, 'docs/auditoriafinal'))) if (f.endsWith('.md')) out.push('docs/auditoriafinal/' + f);
  out.push('README.md', 'data/pruebas/RUTAS-CONOCIDAS.md');
  return out;
}

const leer = (d) => fs.readFileSync(path.join(RAIZ, d), 'utf8');

/**
 * El valor, buscado como CIFRA entera: ni dentro de otra ni pegado a un decimal.
 * ⚠️⚠️ TANDA 4 · LAS GUARDAS SON CONDICIONALES, y esto costó un rojo falso.
 *   Un par puede no ser un número pelado: `6 km/h` es un valor superado tan
 *   legítimo como `3.166`. Con la guarda de cola puesta siempre, `«a 6 km/h, la
 *   velocidad…»` NO casaba —detrás de la `h` hay una coma— y el barrido decía
 *   cero sobre un documento que lo dice cuatro veces.
 * ⇒ la guarda de cabeza solo si el valor EMPIEZA por dígito, la de cola solo si
 *   TERMINA en dígito. Fuera de eso, estorban.
 */
function reDe(v) {
  const cuerpo = v.replace(/[.]/g, '\\.').replace(/[/]/g, '\\/');
  const antes = /^\d/.test(v) ? '(?<![\\d.,])' : '';
  const despues = /\d$/.test(v) ? '(?![\\d.,])' : '';
  return new RegExp(antes + cuerpo + despues);
}

/** ⭐ El cuerpo = el documento SIN su cabecera generada. Se mide sobre él, nunca
 *  sobre el fichero entero: si no, la cabecera se confirmaría a sí misma. */
function cuerpoDe(txt) {
  const i = txt.indexOf(INICIO), j = txt.indexOf(FIN);
  if (i < 0 || j < 0) return txt;
  return txt.slice(0, i) + txt.slice(j + FIN.length);
}

/** Los pares que un documento DECLARA en su cabecera, leídos de la propia tabla. */
function declaradosEn(txt) {
  const i = txt.indexOf(INICIO), j = txt.indexOf(FIN);
  if (i < 0 || j < 0) return [];
  const bloque = txt.slice(i, j);
  const out = [];
  for (const m of bloque.matchAll(/^> \| `([^`]+)` \| \*\*([^*]+)\*\* \|/gm)) out.push({ viejo: m[1], nuevo: m[2] });
  return out;
}

/** Las líneas del cuerpo, con su número real: las de la cabecera generada se saltan. */
function lineasCuerpo(txt) {
  const out = [];
  let dentro = false;
  txt.split('\n').forEach((l, i) => {
    if (l.includes(INICIO)) { dentro = true; return; }
    if (l.includes(FIN)) { dentro = false; return; }
    if (!dentro) out.push({ ln: i + 1, l });
  });
  return out;
}

/**
 * ⭐⭐ EL ESCANEO — por cada par, qué líneas son SUYAS y cuáles son otra cosa.
 * ⛔ Se mide sobre el CUERPO, nunca sobre el fichero entero: si no, la cabecera
 *   se confirmaría a sí misma.
 * ⛔ El universo excluye las actas (bitácora y auditoría, donde el valor viejo
 *   TIENE que aparecer) y el documento que republica (imprime el viejo al lado
 *   del nuevo por definición: pedirle una cabecera es pedirle que se apunte a sí).
 */
function escanear() {
  const docs = documentos();
  const out = new Map();
  for (const p of PARES) {
    const re = reDe(p.viejo);
    const propias = [], ajenas = [];
    for (const d of docs) {
      if (esActa(d)) continue;
      if (p.republicaEn && p.republicaEn.startsWith(d.replace(/\\/g, '/'))) continue;
      for (const { ln, l } of lineasCuerpo(leer(d))) {
        if (!re.test(l)) continue;
        (p.contexto && !p.contexto.test(l) ? ajenas : propias).push({ d, ln, l: l.trim() });
      }
    }
    out.set(p, { propias, ajenas });
  }
  return out;
}

/** Dónde hay que poner la marca, DERIVADO del escaneo. ⛔ Nunca escrito a mano. */
function apariciones(esc) {
  const mapa = new Map();          // doc -> [par]
  for (const [p, { propias }] of esc) {
    for (const d of new Set(propias.map((x) => x.d))) {
      if (!mapa.has(d)) mapa.set(d, []);
      mapa.get(d).push(p);
    }
  }
  return mapa;
}

/** El bloque de cabecera de un documento, dado lo que le toca declarar. */
function bloque(pares) {
  const L = [INICIO];
  L.push('> ⚠️ **ESTE DOCUMENTO PUBLICA ' + pares.length + ' NÚMERO(S) SUPERADO(S).**');
  L.push('> El cuerpo **no se ha corregido**: era verdad el día que se escribió.');
  L.push('>');
  L.push('> | lo que dice aquí | hoy vale | dónde se republicó |');
  L.push('> |---|---|---|');
  for (const p of pares) {
    L.push('> | `' + p.viejo + '` | **' + p.nuevo + '** | '
      + (p.republicaEn ? '`' + p.republicaEn + '` · ' + p.desde
        : '⛔ **republicación PENDIENTE** · ' + p.desde) + ' |');
  }
  L.push('>');
  L.push('> <sub>' + [...new Set(pares.map((p) => p.que))].join(' · ') + '</sub>');
  L.push(FIN);
  return L.join('\n');
}

/** Escribe o actualiza la cabecera. Idempotente: sustituye el bloque entero. */
function marcar(d, pares) {
  const txt = leer(d);
  const i = txt.indexOf(INICIO), j = txt.indexOf(FIN);
  const nuevo = bloque(pares);
  let salida;
  if (i >= 0 && j >= 0) {
    salida = txt.slice(0, i) + nuevo + txt.slice(j + FIN.length);
  } else {
    // ⭐ debajo del título, no encima: el documento sigue abriendo por su nombre.
    const lineas = txt.split('\n');
    const k = lineas.findIndex((x) => /^# /.test(x));
    const pos = k >= 0 ? k + 1 : 0;
    lineas.splice(pos, 0, '', nuevo);
    salida = lineas.join('\n');
  }
  fs.writeFileSync(path.join(RAIZ, d), salida, 'utf8');
  return salida;
}

// ═════════════════════════════════════════════════════════════════════════════
// ⭐⭐ EL GUARDIÁN — las dos direcciones
// ═════════════════════════════════════════════════════════════════════════════
/** @returns {{d1: Array, d2: Array}} las dos listas de incumplimientos. */
function auditar(esc) {
  const mapa = apariciones(esc);
  const d1 = [], d2 = [];
  for (const [d, pares] of mapa) {
    const dec = declaradosEn(leer(d));
    for (const p of pares) {
      if (!dec.some((x) => x.viejo === p.viejo && x.nuevo === p.nuevo)) d1.push({ d, p });
    }
  }
  // D2 · lo que la cabecera declara y el cuerpo ya no dice
  for (const d of documentos()) {
    const txt = leer(d);
    const dec = declaradosEn(txt);
    if (!dec.length) continue;
    const cuerpo = cuerpoDe(txt);
    for (const x of dec) {
      if (!reDe(x.viejo).test(cuerpo)) d2.push({ d, x });
    }
  }
  return { d1, d2 };
}

/** Ley 109 · las vallas de código tienen que quedar PARES en todos los documentos. */
function vallas() {
  const malas = [];
  for (const d of documentos()) {
    const n = (leer(d).match(/^```/gm) || []).length;
    if (n % 2) malas.push({ d, n });
  }
  return malas;
}

// ═════════════════════════════════════════════════════════════════════════════
// C · LA CONTRAPRUEBA — ⛔ un guardián no está hecho hasta que se ha visto su rojo
// ═════════════════════════════════════════════════════════════════════════════
//   Y aquí hay que verlo DOS VECES, una por dirección. Se hace sobre COPIAS en el
//   directorio temporal: ⛔ no se toca el repositorio.
function probar() {
  const os = require('os');
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'superados-'));
  const copia = (d) => {
    const dest = path.join(tmp, d.replace(/[\\/]/g, '__'));
    fs.copyFileSync(path.join(RAIZ, d), dest);
    return dest;
  };
  log('');
  log('='.repeat(104));
  log('C · ⭐⭐ LA CONTRAPRUEBA — el rojo de las DOS direcciones, sobre copias');
  log('='.repeat(104));

  const mapa = apariciones(escanear());
  const [dPrueba, paresPrueba] = [...mapa][0] || [];
  if (!A.exige(dPrueba, 'no hay ningún documento con valores superados: la contraprueba no puede correr')) return;

  // ── C1 · positivo de control: el documento marcado como toca sale VERDE ────
  const marcado = bloque(paresPrueba);
  const original = leer(dPrueba);
  const conCabecera = original.includes(INICIO)
    ? original
    : (() => { const l = original.split('\n'); const k = l.findIndex((x) => /^# /.test(x));
      l.splice(k >= 0 ? k + 1 : 0, 0, '', marcado); return l.join('\n'); })();
  const decOk = declaradosEn(conCabecera);
  const c1 = paresPrueba.every((p) => decOk.some((x) => x.viejo === p.viejo));
  log('   C1 · positivo de control: bien marcado, la cabecera declara sus '
    + paresPrueba.length + ' par(es)   ' + (c1 ? '✅' : '⛔'));
  A.exige(c1, 'la cabecera generada no se puede volver a leer: el lector y el escritor no cuadran');

  // ── C2 · D1 en rojo: se le quita una fila a la cabecera ────────────────────
  const sinFila = conCabecera.replace(/^> \| `[^`]+` \| \*\*[^*]+\*\* \|.*$\n/m, '');
  const decMenos = declaradosEn(sinFila);
  const c2 = decMenos.length === decOk.length - 1
    && paresPrueba.some((p) => !decMenos.some((x) => x.viejo === p.viejo));
  log('   C2 · D1 — se borra una fila de la cabecera y el valor sigue en el cuerpo   '
    + (c2 ? '✅ el guardián lo echa de menos' : '⛔ NO LO VE'));
  A.exige(c2, 'D1 no detecta una cabecera incompleta');

  // ── C3 · D2 en rojo: se le mete una fila de un valor que el cuerpo no dice ──
  const inventado = '> | `77.777.777` | **0** | `docs/NO-EXISTE.md` · nunca |';
  const conMentira = conCabecera.replace(FIN, inventado + '\n' + FIN);
  const decMas = declaradosEn(conMentira);
  const cuerpo = cuerpoDe(conMentira);
  const c3 = decMas.some((x) => x.viejo === '77.777.777') && !reDe('77.777.777').test(cuerpo);
  log('   C3 · D2 — la cabecera declara un valor que el cuerpo NO dice           '
    + (c3 ? '✅ el guardián lo caza' : '⛔ NO LO VE'));
  A.exige(c3, 'D2 no detecta una cabecera que habla de un valor ausente');

  // ── C4 · idempotencia: marcar dos veces deja el fichero igual ──────────────
  const dest = copia(dPrueba);
  const rel = path.relative(RAIZ, dest);
  const una = conCabecera;
  const i = una.indexOf(INICIO), j = una.indexOf(FIN);
  const dos = una.slice(0, i) + bloque(paresPrueba) + una.slice(j + FIN.length);
  log('   C4 · idempotencia — marcar dos veces da el MISMO fichero              '
    + (una === dos ? '✅' : '⛔ SE DUPLICA'));
  A.exige(una === dos, 'marcar dos veces no da el mismo fichero: el bloque se duplicaría');
  fs.rmSync(tmp, { recursive: true, force: true });
  void rel;
}

// ═════════════════════════════════════════════════════════════════════════════
// LA SALIDA
// ═════════════════════════════════════════════════════════════════════════════
log('='.repeat(104));
log('SUPERADOS · EL PUNTERO HACIA DELANTE');
log('='.repeat(104));
log('   pares en la tabla                            ' + PARES.length);
log('   de ellos SIN republicar todavía              ' + PARES.filter((p) => !p.republicaEn).length);

const esc = escanear();
const mapa = apariciones(esc);
log('   documentos que imprimen algún valor superado ' + mapa.size);
log('   líneas que lo imprimen                       '
  + [...esc.values()].reduce((s, x) => s + x.propias.length, 0));

// ═════════════════════════════════════════════════════════════════════════════
// D3 · ⭐⭐ EL RECUENTO CERRADO — va PRIMERO, porque si esto no cuadra, marcar
//      sería escribir en un documento público a partir de un barrido que ya no
//      mide lo que medía.
// ═════════════════════════════════════════════════════════════════════════════
log('');
log('='.repeat(104));
log('D3 · ⭐⭐ ¿SIGUEN SIENDO LAS MISMAS LÍNEAS? — mundo cerrado, par a par');
log('='.repeat(104));
log('   ' + 'valor'.padStart(9) + 'propias'.padStart(12) + 'ajenas'.padStart(10) + '   contexto');
let d3 = 0;
for (const [p, { propias, ajenas }] of esc) {
  const ok = propias.length === p.propias && ajenas.length === p.ajenas;
  if (!ok) d3++;
  log('   ' + p.viejo.padStart(9)
    + (propias.length + ' de ' + p.propias).padStart(12)
    + (ajenas.length + ' de ' + p.ajenas).padStart(10)
    + '   ' + (p.contexto ? String(p.contexto) : '— la cifra sola').padEnd(38)
    + (ok ? '✅' : '⛔ SE HA MOVIDO'));
  if (!ok) for (const x of [...propias, ...ajenas]) log('        ' + (x.d.replace('docs/', '') + ':' + x.ln).padEnd(38) + x.l.slice(0, 56));
}
A.exige(d3 === 0, d3 + ' par(es) cuyo recuento de líneas ya no es el declarado: alguien tiene que MIRAR antes de marcar');

// ⭐ `--censar` · TODAS las líneas de TODOS los pares. Es la única forma honesta
//   de rellenar `propias`/`ajenas`: mirándolas. ⛔ No las cuenta por ti.
if (process.argv.includes('--censar')) {
  for (const [p, { propias, ajenas }] of esc) {
    log('');
    log('   ── ' + p.viejo + ' → ' + p.nuevo + '   (' + p.que + ')');
    for (const x of propias) log('      PROPIA ' + (x.d.replace('docs/', '') + ':' + x.ln).padEnd(36) + x.l.slice(0, 78));
    for (const x of ajenas) log('      ⛔ajena ' + (x.d.replace('docs/', '') + ':' + x.ln).padEnd(36) + x.l.slice(0, 78));
  }
}

// ⭐ LAS AJENAS, SIEMPRE A LA VISTA. ⛔ No se marcan y no se tocan: se nombran.
const ajenasTodas = [...esc].flatMap(([p, x]) => x.ajenas.map((a) => ({ p, a })));
log('');
log('   ⛔ LÍNEAS QUE LLEVAN LA CIFRA Y **NO SON ESE DATO** — no se marcan   ' + ajenasTodas.length);
for (const { p, a } of ajenasTodas) {
  log('      ' + p.viejo.padStart(7) + '  ' + (a.d.replace('docs/', '') + ':' + a.ln).padEnd(36) + a.l.slice(0, 52));
}

if (process.argv.includes('--marcar')) {
  A.exige(d3 === 0, 'no se marca nada con el recuento descuadrado');
  if (d3 === 0) {
    log('');
    log('B · ESCRIBIENDO LAS CABECERAS');
    for (const [d, pares] of mapa) {
      marcar(d, pares);
      log('   ' + d.padEnd(52) + pares.length + ' par(es)');
    }
  }
}

const { d1, d2 } = auditar(escanear());
log('');
log('='.repeat(104));
log('A · EL GUARDIÁN, EN LAS DOS DIRECCIONES');
log('='.repeat(104));
log('   D1 · valor superado impreso SIN que la cabecera lo declare   ' + d1.length);
for (const x of d1.slice(0, 40)) {
  log('      ' + x.d.replace('docs/', '').padEnd(46) + x.p.viejo.padStart(9) + ' → ' + x.p.nuevo);
}
if (d1.length > 40) log('      … y ' + (d1.length - 40) + ' más');
A.exige(d1.length === 0, d1.length + ' valor(es) superado(s) impreso(s) sin puntero hacia delante');

log('');
log('   D2 · la cabecera declara un par que el cuerpo YA NO dice      ' + d2.length);
for (const x of d2) log('      ' + x.d.replace('docs/', '').padEnd(46) + x.x.viejo.padStart(9) + ' → ' + x.x.nuevo);
A.exige(d2.length === 0, d2.length + ' par(es) declarado(s) en una cabecera cuyo cuerpo ya no los imprime');

const malas = vallas();
log('');
log('   ley 109 · documentos con las vallas ``` IMPARES               ' + malas.length);
for (const m of malas) log('      ' + m.d + '   ' + m.n);
A.exige(malas.length === 0, malas.length + ' documento(s) con las vallas de código impares: el renderizado se rompe');

if (process.argv.includes('--probar')) probar();

log('');
log(A.cierre('EL PUNTERO'));
