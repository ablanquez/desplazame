/**
 * ⭐ EL DISTINTIVO AMBIENTAL DE UNA MATRÍCULA (3/09, punto 12 casilla 3-bis):
 * `GET /api/distintivo?matricula=0000XXX`.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 *  ⛔ **LA MATRÍCULA NO SE GUARDA Y NO SE ESCRIBE EN EL LOG. Nunca.**
 *
 *  Es un dato personal indirecto: identifica un vehículo y, por él, a alguien.
 *  Aquí entra por la URL, se valida, se usa para preguntar y se tira. El log
 *  cuenta **la consulta** —qué salió, cuánto tardó, por qué se quedó muda— y
 *  jamás **la matrícula**. Es la misma ley que el nonce de Avanza y las dos
 *  claves de `.env.local`, aplicada a lo de fuera en vez de a lo de dentro.
 *
 *  Y no hay caché: no porque no sirviera, sino porque cachear es guardar.
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * ── De dónde sale la respuesta, medido el 3/09 (sonda B) ────────────────────
 *
 * `https://sede.dgt.gob.es/es/vehiculos/informacion-de-vehiculos/distintivo-ambiental/index.html?matricula=…`
 * — un **GET**, sin captcha, sin token y sin sesión, que contesta en 0,45-1,0 s
 * la página entera (≈135 kB) con **una sola frase** dentro de un
 * `div.avisos_msg`. Sus cuatro formas, literales:
 *
 *   · *«El vehículo XXXX cumple con los requisitos para obtener el Distintivo
 *     Ambiental C.»* — y lo mismo con `B`, `ECO` y `0`.
 *   · *«Sin distintivo. Tu vehículo no cumple los requisitos para ser
 *     etiquetado como vehículo limpio.»*
 *   · *«No se ha encontrado ningún resultado para la matrícula introducida.»*
 *   · *«Formato de matrícula incorrecto…»* — que aquí **no se llega a ver**: el
 *     formato se valida antes de salir a la red.
 *
 * ⚠️ **Ni marca ni modelo.** No los trae la consulta ni los trae el fichero de
 *    microdatos de la DGT (14 columnas, medido). No se pueden enseñar porque no
 *    existen.
 *
 * ── Las condiciones, leídas ─────────────────────────────────────────────────
 *
 * [Aviso legal de la sede, `https://sede.dgt.gob.es/es/contenido/aviso-legal/`,
 * leído el 03/09/2026] **NO CONSTA** nada sobre consulta automatizada: ni la
 * prohíbe ni la permite. Lo que sí dice, en «Derechos sobre la Propiedad
 * intelectual», es que la reproducción debe ser **fiel, «sin manipular ni
 * alterar los contenidos»**, y **citando a la DGT como fuente**. Por eso la
 * respuesta viaja con el texto **tal cual lo dio la sede** y con `fuente: 'DGT'`
 * dentro; la pantalla lo enseña sin reescribirlo.
 */

import type { DistintivoConsultado } from '@desplazame/tipos';

/**
 * ⭐ LOS TRES FORMATOS QUE LA DGT ACEPTA, del `placeholder` de su propio
 * formulario: `0000XXX / XX0000XX / C0000XXX`.
 *
 * Se validan **antes de salir a la red**, y eso no es cortesía: una matrícula
 * mal escrita sería un viaje de ida y vuelta de un segundo a la sede para traer
 * un «formato incorrecto» que sabemos aquí sin preguntar.
 */
const FORMATOS: readonly RegExp[] = [
  /^\d{4}[A-Z]{3}$/,
  /^[A-Z]{2}\d{4}[A-Z]{2}$/,
  /^C\d{4}[A-Z]{3}$/,
];

export function esMatricula(cruda: string): boolean {
  return FORMATOS.some((f) => f.test(cruda));
}

/** Cómo se escribe una matrícula antes de mirarla: sin espacios ni guiones. */
export function normalizar(cruda: string): string {
  return cruda.trim().toUpperCase().replaceAll('-', '').replaceAll(' ', '');
}

export const CONSULTA =
  'https://sede.dgt.gob.es/es/vehiculos/informacion-de-vehiculos/distintivo-ambiental/index.html';

/** El tope y el reintento son los de la casa. Ver `avanza.ts`. */
export const ESPERA_MS = 4000;
export const BACKOFF_MS = 300;

/**
 * ⭐ LO QUE SE LEE DE LA PÁGINA, y **son DOS sitios, no uno**.
 *
 * ⛔ **Entrada nº32 de `docs/BITACORA.md`.** Esto solo miraba `avisos_msg`, y la
 *    sede lo usa **únicamente para los avisos** — sin distintivo, no encontrado,
 *    formato malo—. Cuando el vehículo SÍ tiene etiqueta, la frase vive en otro
 *    sitio y sin ninguna alerta:
 *
 *      con etiqueta  → `<div class="align-self-center text-success">`
 *                        `<p class="ms-3 my-auto">El vehículo <strong>…`
 *      los otros tres → `<div class="avisos_msg"> <div class="alert alert-…">`
 *                        `<p class="my-auto"><span…></span>&nbsp;&nbsp;…`
 *
 *    Medido el 3/09 bajando las cuatro respuestas. El caso bueno devolvía
 *    `mudo (parseo)` contra el motor vivo mientras las cuatro jueces estaban en
 *    verde, porque el *fixture* del caso bueno lo había compuesto yo con la
 *    forma del de al lado.
 *
 * Se saca con cortes de cadena y no con un analizador de HTML: la casa no tiene
 * dependencias. Si los dos anclajes fallan devuelve `null`, y la respuesta será
 * `mudo` con motivo `parseo` — que es de lo que hay que enterarse.
 */
export function fraseDeLaSede(html: string): string | null {
  for (const ancla of ['text-success', 'avisos_msg']) {
    const i = html.indexOf(ancla);
    if (i < 0) {
      continue;
    }
    const trozo = html.slice(i, i + 2000);
    const abre = trozo.indexOf('<p');
    const cierra = trozo.indexOf('</p>');
    if (abre < 0 || cierra < 0 || cierra < abre) {
      continue;
    }
    const limpio = sinEtiquetas(trozo.slice(trozo.indexOf('>', abre) + 1, cierra));
    if (limpio !== '') {
      return limpio;
    }
  }
  return null;
}

/** Quita etiquetas y devuelve las entidades a su letra. Sin dependencias. */
function sinEtiquetas(trozo: string): string {
  const texto = trozo.replace(/<[^>]*>/g, '');
  const entidades: Readonly<Record<string, string>> = {
    '&aacute;': 'á', '&eacute;': 'é', '&iacute;': 'í', '&oacute;': 'ó', '&uacute;': 'ú',
    '&ntilde;': 'ñ', '&Aacute;': 'Á', '&Eacute;': 'É', '&Iacute;': 'Í', '&Oacute;': 'Ó',
    '&Uacute;': 'Ú', '&Ntilde;': 'Ñ', '&nbsp;': ' ', '&amp;': '&', '&quot;': '"',
    '&uuml;': 'ü', '&#39;': "'",
  };
  let fuera = texto;
  for (const [entidad, letra] of Object.entries(entidades)) {
    fuera = fuera.replaceAll(entidad, letra);
  }
  return fuera.replace(/\s+/g, ' ').trim();
}

/**
 * ⭐ QUÉ DICE LA FRASE. **La clase sale del texto de la sede, no de una tabla
 * nuestra**, y por eso el texto viaja entero: quien lo lea ve lo que la DGT
 * dijo, palabra por palabra.
 */
export function leerLaFrase(frase: string): DistintivoConsultado {
  const cuando = new Date();
  const comun = { texto: frase, fuente: 'DGT' as const, cuando: cuando.toISOString() };
  const conEtiqueta = /Distintivo Ambiental (0|ECO|C|B)\b/.exec(frase);
  if (conEtiqueta) {
    return { ...comun, clase: 'etiqueta', distintivo: conEtiqueta[1] as '0' | 'ECO' | 'C' | 'B' };
  }
  if (frase.startsWith('Sin distintivo')) {
    return { ...comun, clase: 'sinDistintivo' };
  }
  if (frase.includes('No se ha encontrado')) {
    return { ...comun, clase: 'noExiste' };
  }
  // Contestó algo que no es ninguna de las tres: se dice tal cual y se marca
  // como mudo. Inventarle una clase sería decidir por la fuente.
  return { ...comun, clase: 'mudo' };
}

/** Un mudo con su motivo, para el log. **Sin la matrícula**, nunca. */
function mudo(motivo: string): DistintivoConsultado {
  console.log(`motor: distintivo — mudo (${motivo})`);
  return {
    clase: 'mudo',
    texto: 'La DGT no ha contestado. Elige tu distintivo a mano, o vuelve a intentarlo.',
    fuente: 'DGT',
    cuando: new Date().toISOString(),
  };
}

/**
 * ⭐ SINGLE-FLIGHT POR MATRÍCULA [request coalescing; `singleflight` de Go].
 *
 * Dos pulsaciones con la misma matrícula mientras la primera está en vuelo son
 * **una sola visita a la sede**. Y deduplica solo lo que está EN VUELO: en
 * cuanto la primera termina se suelta, así que una consulta posterior vuelve a
 * preguntar de verdad. Cachear sería guardar la matrícula, y eso no se hace.
 */
const enVuelo = new Map<string, Promise<DistintivoConsultado>>();

/** Cuántas consultas van, para el log. **Un contador, no una lista.** */
let consultas = 0;

export function consultasHechas(): number {
  return consultas;
}

/** Se inyecta para poder mentirle en las jueces, como el reloj del bus. */
export type Pedir = (url: string) => Promise<{ readonly ok: boolean; readonly status: number; readonly texto: string }>;

const porLaRed: Pedir = async (url) => {
  const r = await fetch(url, { signal: AbortSignal.timeout(ESPERA_MS) });
  return { ok: r.ok, status: r.status, texto: await r.text() };
};

/**
 * ⭐ LA CONSULTA, de punta a punta.
 *
 * `null` en la matrícula, vacía o con formato malo → `formato`, **sin salir a
 * la red**. Lo demás: una petición, un reintento con 300 ms de espera, y lo que
 * la sede diga.
 */
export async function atenderDistintivo(
  cruda: string | null,
  pedir: Pedir = porLaRed,
): Promise<{ readonly codigo: number; readonly cuerpo: DistintivoConsultado }> {
  const matricula = normalizar(cruda ?? '');
  if (!esMatricula(matricula)) {
    // ⚠️ Y el 400 NO lleva la matrícula ni en el cuerpo ni en el log: decir que
    //    el formato está mal no necesita repetir lo que se escribió.
    console.log('motor: distintivo — 400 (formato)');
    return {
      codigo: 400,
      cuerpo: {
        clase: 'formato',
        texto: 'Escribe la matrícula sin guiones ni espacios: 0000XXX, XX0000XX o C0000XXX.',
        fuente: 'DGT',
        cuando: new Date().toISOString(),
      },
    };
  }

  const yaVa = enVuelo.get(matricula);
  if (yaVa) {
    return { codigo: 200, cuerpo: await yaVa };
  }

  const vuelo = (async (): Promise<DistintivoConsultado> => {
    consultas++;
    const url = `${CONSULTA}?matricula=${encodeURIComponent(matricula)}`;
    for (let intento = 0; intento <= 1; intento++) {
      if (intento > 0) {
        await new Promise((sigue) => setTimeout(sigue, BACKOFF_MS));
      }
      try {
        const r = await pedir(url);
        if (!r.ok) {
          if (intento === 1) {
            return mudo(`http ${r.status}`);
          }
          continue;
        }
        const frase = fraseDeLaSede(r.texto);
        if (frase === null) {
          if (intento === 1) {
            return mudo(`parseo · ${r.texto.length} bytes`);
          }
          continue;
        }
        return leerLaFrase(frase);
      } catch (fallo) {
        if (intento === 1) {
          return mudo(fallo instanceof Error && fallo.name === 'TimeoutError' ? 'tope' : 'red');
        }
      }
    }
    return mudo('agotado');
  })().finally(() => {
    if (enVuelo.get(matricula) === vuelo) {
      enVuelo.delete(matricula);
    }
  });

  enVuelo.set(matricula, vuelo);
  return { codigo: 200, cuerpo: await vuelo };
}
