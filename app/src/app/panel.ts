import { Component, signal, inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import type { SaludFeed } from '@desplazame/tipos';

/**
 * EL PANEL DE FRESCURA: si cada conjunto de datos está fresco o caduco.
 *
 * Lee `datapackage.json` —el manifiesto de la raíz del repositorio— y lo pinta.
 * **No calcula nada del dato ni lo descarga**: el manifiesto son solo metadatos,
 * y los conjuntos que describe se quedan donde están.
 *
 * ⚠️ Aquí ponía **«21 KB»** y el 8/09 eran **44**, camino de 60 con las filas
 *    nuevas. La cifra se va en vez de actualizarse: un tamaño escrito a mano en
 *    un comentario envejece cada vez que el manifiesto crece, y no es un dato
 *    que nadie necesite para entender esto. Es la lección de la nº39 aplicada
 *    en pequeño —**la cifra que nadie vigila, fuera**—.
 *
 * ⭐ **La portada NI SE ENTERA.** Abrir la raíz sigue sin pedir un solo byte de
 * datos —lo vigila el guardián invertido de `app.spec.ts`, nacido el 22/08— y
 * este componente **se carga y pide su manifiesto solo al entrar en `/panel`**.
 * Por eso la ruta lo trae con `loadComponent` y no con `component`: así ni su
 * código viaja en el paquete de la portada.
 *
 * [DOC Frictionless Data — Data Package v1] El manifiesto es un descriptor
 * estándar; sus `resources[]` traen `path`, `hash`, `bytes`, `licenses` y
 * `sources`. [DOC DCAT] La frescura usa sus términos: `accrualPeriodicity` con
 * vocabulario controlado y `modified`. Lo que va en castellano es NUESTRO y
 * está donde el estándar calla.
 */

/** Un conjunto, tal y como el manifiesto lo declara. */
export interface Recurso {
  readonly name: string;
  readonly path: string;
  readonly title: string;
  /** [Data Package v1] OPCIONALES: lo que el cron renueva no tiene huella estable. */
  readonly bytes?: number;
  readonly hash?: string;
  /** Qué fecha declara **el dato** de sí mismo. Se omite si no declara ninguna. */
  readonly modified?: string;
  readonly modifiedFuente?: string;
  /** Cuándo se descargó. Propiedad nuestra: el estándar no la tiene. */
  readonly descargadoEl?: string;
  /** [DCAT] Cada cuánto se refresca en origen. Solo si hay fuente. */
  readonly accrualPeriodicity?: string;
  readonly periodicidadFuente?: string;
  /** Cuándo deja de ser válido. Solo si hay fuente. */
  readonly caducaEl?: string;
  readonly caducidadFuente?: string;
  /** Cada cuánto se consulta una fuente VIVA (las que no se copian). */
  readonly cadencia?: string;
  readonly cadenciaFuente?: string;
}

export type Color = 'rojo' | 'ambar' | 'verde' | 'gris';

export interface Estado {
  readonly color: Color;
  readonly texto: string;
  /** La regla que ha decidido el color, y de dónde sale. Vacío si no hay. */
  readonly regla: string;
  readonly fuente: string;
}

/** [DCAT] El término del vocabulario europeo de frecuencias para «mensual». */
export const MENSUAL = 'http://publications.europa.eu/resource/authority/frequency/MONTHLY';

const DIA = 24 * 60 * 60 * 1000;

/**
 * ⭐ EL SEMÁFORO, y la regla que lo gobierna: **solo hay color donde hay una
 * regla con fuente**.
 *
 * Tres colores se computan y uno se declara:
 *
 * - 🔴 **rojo** — el conjunto declara una fecha de caducidad y ya pasó. El día
 *   de la caducidad todavía cuenta como válido: «vale hasta el 5 de octubre»
 *   incluye el 5 de octubre.
 * - 🟡 **ámbar** — el conjunto declara cada cuánto se refresca en origen y la
 *   copia que tenemos es más vieja que ese plazo. No es que esté mal: es que ya
 *   puede haber otra.
 * - 🟢 **verde** — hay regla y se cumple.
 * - ⚪ **gris** — **NO CONSTA**. No hay regla con fuente, o la hay pero falta la
 *   fecha contra la que medirla.
 *
 * ⭐ **El gris no es un fallo.** Es la verdad sobre ese conjunto y la lista de
 * deberes: dice qué conjuntos no tienen todavía una política de caducidad que
 * alguien haya publicado. Inventar un umbral «razonable» para pintarlo de
 * colores sería cambiar información por decoración.
 *
 * `hoy` entra por parámetro para que las pruebas puedan pararse en el borde
 * exacto de cada regla en vez de depender de qué día se ejecuten.
 */
/**
 * ⭐ ¿ES UNA FUENTE VIVA? Lo dice su `path`.
 *
 * [Data Package v1, literal] el `path` «puede ser una URL http completamente
 * cualificada o una ruta POSIX relativa». Un recurso remoto es de primera clase
 * en el estándar, y aquí es **una fuente que se consulta y no se copia**: las
 * llegadas al poste, la ruta operativa, el BiZi, YeGo, el cuadro del festivo y
 * la DGT. Tenían ficha en el notices y ninguna fila aquí.
 *
 * ⚠️ Y también cuenta `/api/…`: la fila del feed servido se le pregunta **al
 *    motor**, no a una fuente de fuera, y tampoco describe un fichero de este
 *    repositorio. Lo que define a una viva no es de quién es, es que **no hay
 *    copia que envejezca**: por eso ni tiene descarga que fechar ni huella.
 */
export const esViva = (r: Recurso): boolean => /^(https?:\/\/|\/api\/)/.test(r.path);

export function estadoDe(r: Recurso, hoy: Date): Estado {
  // ⭐ UNA FUENTE VIVA NO SE MIDE CON EL SEMÁFORO DE UN FICHERO.
  //
  // No tiene copia que envejezca, así que «¿cuántos días tiene tu descarga?» no
  // significa nada sobre ella. Lo que sí significa es CADA CUÁNTO se pregunta,
  // y eso es lo que se enseña: gris informativo, con la cadencia y su fuente.
  // No es «NO CONSTA» — constar, consta; lo que no hay es fichero.
  if (esViva(r)) {
    return {
      color: 'gris',
      texto: r.cadencia ? `se consulta · ${r.cadencia}` : 'se consulta en vivo',
      regla: 'se consulta en vivo; no se copia a este repositorio',
      fuente: r.cadenciaFuente ?? '',
    };
  }

  // ── La caducidad manda: lo caducado es rojo aunque su refresco vaya al día ──
  if (r.caducaEl && r.caducidadFuente) {
    const fin = Date.parse(r.caducaEl + 'T23:59:59Z');
    if (Number.isFinite(fin)) {
      const dias = Math.round((fin - hoy.getTime()) / DIA);
      return fin < hoy.getTime()
        ? { color: 'rojo', texto: `caducó el ${r.caducaEl}`, regla: `caduca el ${r.caducaEl}`, fuente: r.caducidadFuente }
        : { color: 'verde', texto: `vale hasta el ${r.caducaEl} (${dias} d)`, regla: `caduca el ${r.caducaEl}`, fuente: r.caducidadFuente };
    }
  }

  // ── La periodicidad: hace falta contra qué medirla ────────────────────────
  if (r.accrualPeriodicity === MENSUAL && r.periodicidadFuente) {
    if (!r.descargadoEl) {
      return {
        color: 'gris',
        texto: 'NO CONSTA',
        regla: 'se refresca cada mes en origen',
        fuente: r.periodicidadFuente + ' — pero no consta cuándo se descargó esta copia',
      };
    }
    const desde = Date.parse(r.descargadoEl);
    const limite = new Date(desde);
    limite.setUTCMonth(limite.getUTCMonth() + 1);
    const dias = Math.round((hoy.getTime() - desde) / DIA);
    return limite.getTime() < hoy.getTime()
      ? { color: 'ambar', texto: `la copia tiene ${dias} días`, regla: 'se refresca cada mes en origen', fuente: r.periodicidadFuente }
      : { color: 'verde', texto: `la copia tiene ${dias} días`, regla: 'se refresca cada mes en origen', fuente: r.periodicidadFuente };
  }

  // ── Sin regla con fuente no hay color, y se dice ──────────────────────────
  return { color: 'gris', texto: 'NO CONSTA', regla: '', fuente: '' };
}

/**
 * ⭐ LA FILA DEL FEED QUE SE ESTÁ SIRVIENDO — la que el manifiesto no puede dar.
 *
 * ── ⚠️ Por qué existe ───────────────────────────────────────────────────────
 *
 * El manifiesto declara la caducidad de la **semilla** del repositorio
 * (`app/data/2026-08-10_nap_gtfs-ficha1176.zip`) y el motor sirve el **vivo**,
 * que el cron renueva cada noche. Hoy coinciden —mismo sha256, medido el
 * 8/09— pero eran **dos verdades para la misma pregunta**: en cuanto entrara un
 * feed nuevo, el panel habría seguido enseñando la fecha vieja, con 200 y sin
 * ruido.
 *
 * Esta fila sale de `/api/salud`, o sea del zip que de verdad se está
 * sirviendo, y con el mismo umbral que el motor grita al arrancar
 * [MobilityData GTFS Validator: caducar en ≤7 días es aviso].
 *
 * ⚠️ **No lleva `hash` ni `bytes`**, y es lo correcto: no describe un fichero
 *    del repositorio, describe lo que hay cargado en un proceso ahora mismo.
 */
export function filaDelFeedServido(f: SaludFeed): Fila {
  const color: Color = f.estado === 'caducado' ? 'rojo' : f.estado === 'aviso' ? 'ambar' : 'verde';
  const dia = /^(\d{4})(\d{2})(\d{2})$/.exec(f.vence);
  const cuando = dia ? `${dia[3]}/${dia[2]}/${dia[1]}` : 'NO CONSTA';
  return {
    r: {
      name: 'feed-servido',
      path: '/api/salud',
      title: 'El GTFS que el motor está sirviendo AHORA (lo pregunta al motor, no al manifiesto)',
      modified: f.sello,
      modifiedFuente: '`feed_version` del zip servido, leído por el motor al arrancar',
      cadencia: 'lo renueva el cron cada noche',
      cadenciaFuente: 'GET /api/salud → feed · el mismo umbral que el arranque grita',
    },
    e: {
      color,
      texto:
        f.estado === 'caducado'
          ? `caducó el ${cuando}`
          : f.estado === 'aviso'
            ? `vence el ${cuando} — dentro del umbral de aviso`
            : `vale hasta el ${cuando}`,
      regla: 'caduca el día que dice su `feed_end_date`; aviso a 7 días',
      fuente: 'MobilityData GTFS Validator, y el feed_info del zip SERVIDO',
    },
  };
}

/** Una fila ya resuelta: el conjunto y su estado. */
export interface Fila {
  readonly r: Recurso;
  readonly e: Estado;
}

@Component({
  selector: 'app-panel',
  templateUrl: './panel.html',
  styleUrl: './panel.css',
})
export class Panel {
  private readonly doc = inject(DOCUMENT);

  readonly filas = signal<readonly Fila[] | null>(null);
  readonly fallo = signal<string | null>(null);
  /** El día contra el que se ha calculado el semáforo, dicho a la vista. */
  readonly hoy = new Date();

  constructor() {
    // El manifiesto se pide AQUÍ y solo aquí: es lo que mantiene la portada a
    // cero peticiones de datos. Va por `fetch` y no por HttpClient porque es un
    // fichero estático servido junto a la aplicación, no una llamada a la API.
    const base = this.doc.baseURI.endsWith('/') ? this.doc.baseURI : this.doc.baseURI + '/';
    void fetch(base + 'datapackage.json')
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error('HTTP ' + r.status))))
      .then((p: { resources: Recurso[] }) => {
        this.filas.set(p.resources.map((r) => ({ r, e: estadoDe(r, this.hoy) })));
      })
      .catch((e: unknown) => this.fallo.set(String(e)));

    // ⭐ Y LA FILA VIVA DEL FEED, que el manifiesto NO puede dar (8/09).
    //
    // El manifiesto declara la caducidad de la SEMILLA del repositorio; el motor
    // sirve el VIVO, que el cron renueva cada noche. Eran dos verdades para la
    // misma pregunta, y tras una renovación esta página habría seguido
    // enseñando la fecha vieja con 200 y sin ruido. Ver `filaDelFeedServido`.
    //
    // ⚠️ **Si el motor no contesta, no pasa nada**: la tabla estática se pinta
    //    igual y esta fila simplemente no está. Un panel que se cae entero
    //    porque una fuente viva calla sería peor que el problema que resuelve —
    //    y por eso el fallo NO va a `this.fallo`, que es el del manifiesto.
    void fetch(base + 'api/salud')
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error('HTTP ' + r.status))))
      .then((s: { feed?: SaludFeed }) => {
        if (!s.feed) return;
        this.filas.update((f) => [filaDelFeedServido(s.feed!), ...(f ?? [])]);
      })
      .catch(() => {
        // Silencio a propósito: es una fuente viva y su ausencia no es un fallo
        // del manifiesto. Se nota porque la fila no está.
      });
  }

  /**
   * ¿Esta fila es una fuente VIVA? La plantilla la pinta distinto: no tiene
   * descarga que fechar ni huella que enseñar, y su `modified` es un SELLO
   * —`20260623_AUZSA_Y_TRANVIA`—, no una fecha que se pueda cortar al día.
   */
  esViva(r: Recurso): boolean {
    return esViva(r);
  }

  /** La fecha, cortada al día: en una tabla la hora no aporta. */
  soloElDia(iso: string | undefined): string {
    return iso ? iso.slice(0, 10) : '';
  }

  /** Cuántos hay de cada color, para el resumen de arriba. */
  cuantos(color: Color): number {
    return (this.filas() ?? []).filter((f) => f.e.color === color).length;
  }
}
