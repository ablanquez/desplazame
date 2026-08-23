import { Component, signal, inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';

/**
 * EL PANEL DE FRESCURA: si cada conjunto de datos está fresco o caduco.
 *
 * Lee `datapackage.json` —el manifiesto de la raíz del repositorio— y lo pinta.
 * **No calcula nada del dato ni lo descarga**: el manifiesto son 21 KB de
 * metadatos, y los conjuntos que describe se quedan donde están.
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
  readonly bytes: number;
  readonly hash: string;
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
export function estadoDe(r: Recurso, hoy: Date): Estado {
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
