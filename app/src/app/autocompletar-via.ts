import { Component, computed, effect, input, model, output, signal } from '@angular/core';
import { httpResource } from '@angular/common/http';
import type { Via } from '@desplazame/tipos';

/** Lo mismo que exige el motor: con una letra casaría media ciudad. */
const MINIMO = 2;

/** Espera antes de preguntar, para no lanzar una petición por tecla. */
const ESPERA_MS = 200;

/**
 * El campo de calle con su desplegable de sugerencias.
 *
 * Es componente propio —y no dos copias en la pantalla— porque tiene estado y
 * ciclo de vida suyos: lo escrito, la petición en vuelo, si está abierto y
 * cuál está resaltada. Es la frontera que se declaró en el punto 2.
 *
 * [DOC] Angular 22 da `httpResource` de serie para esto: *«makes a reactive
 * HTTP request and exposes the request status and response value as a
 * WritableResource»*, y cuando la señal de la que depende cambia **cancela la
 * petición anterior si sigue pendiente**. Está marcado `@publicApi 22.0` en la
 * versión instalada. No hace falta ninguna librería de autocompletar.
 *
 * [PROPIO] La espera de 200 ms antes de preguntar no la da el framework:
 * `httpResource` dispara en cuanto cambia la señal. Se debe a que el motor
 * está a un proxy de distancia y no hace falta preguntarle por cada tecla.
 *
 * Lo que se ENSEÑA es «NOMBRE LIMPIO (NÚCLEO)». El marcador críptico del dato
 * (`---CST`) no sale a pantalla, pero su significado sí — y hace falta: hay 52
 * nombres que se repiten entre la ciudad y los barrios rurales.
 */
@Component({
  selector: 'app-autocompletar-via',
  templateUrl: './autocompletar-via.html',
  styleUrl: './autocompletar-via.css',
})
export class AutocompletarVia {
  /** El `name` del campo, que es también su identificador para la etiqueta. */
  readonly campo = input.required<string>();
  readonly etiqueta = input.required<string>();

  /** Lo escrito. Doble sentido: la pantalla necesita saberlo para validar. */
  readonly texto = model('');

  /** La vía elegida, o null si lo escrito no corresponde a ninguna. */
  readonly seleccion = output<Via | null>();

  protected readonly abierto = signal(false);
  protected readonly activo = signal(-1);

  /**
   * La vía que se eligió de la lista, si se eligió alguna. Es lo que separa
   * «escrito» de «elegido», y sin ella no hay código de vía: escribir el
   * nombre a mano no vale, porque el nombre no identifica nada —hay 52 que se
   * repiten entre la ciudad y los barrios rurales—. Entrada nº4 de la bitácora.
   */
  private readonly elegida = signal<Via | null>(null);

  /** Si el usuario ya salió del campo alguna vez. Antes de salir no se regaña. */
  private readonly tocado = signal(false);

  /** Hay texto pero no hay vía: un borrador, que se conserva pero no vale. */
  private readonly esBorrador = computed(
    () => this.texto().trim() !== '' && this.elegida() === null,
  );

  /**
   * Cuándo se ENSEÑA que no vale. Mientras se teclea no: sería regañar a mitad
   * de palabra. Se enseña al salir, y se apaga solo de dos maneras —eligiendo
   * de la lista, o dejando el campo vacío—, que son las dos que lo resuelven.
   */
  protected readonly marcado = computed(() => this.tocado() && this.esBorrador());

  /** Lo escrito, pero con la espera aplicada: es lo que dispara la petición. */
  private readonly consulta = signal('');

  constructor() {
    let temporizador: ReturnType<typeof setTimeout> | undefined;
    effect((alLimpiar) => {
      const escrito = this.texto();
      clearTimeout(temporizador);
      temporizador = setTimeout(() => this.consulta.set(escrito), ESPERA_MS);
      alLimpiar(() => clearTimeout(temporizador));
    });
  }

  /**
   * Las sugerencias. Devolver `undefined` en la URL es lo que le dice a
   * `httpResource` que no hay nada que pedir: así con menos de dos letras no
   * se molesta al motor.
   */
  protected readonly sugerencias = httpResource<readonly Via[]>(() => {
    const q = this.consulta().trim();
    return q.length < MINIMO ? undefined : `/api/vias?q=${encodeURIComponent(q)}`;
  });

  protected readonly lista = computed<readonly Via[]>(() => this.sugerencias.value() ?? []);

  /** Hay algo que enseñar en el desplegable: sugerencias, «buscando» o «nada». */
  protected readonly hayQueMostrar = computed(
    () => this.abierto() && this.consulta().trim().length >= MINIMO,
  );

  /** Cómo se enseña una vía: el nombre limpio y, si es de un núcleo, su nombre. */
  protected comoSeVe(via: Via): string {
    return via.nucleo ? `${via.limpio} (${via.nucleo})` : via.limpio;
  }

  protected alEscribir(valor: string): void {
    this.texto.set(valor);
    this.abierto.set(true);
    this.activo.set(-1);
    // Lo escrito a mano ya no corresponde a la vía elegida antes: el código
    // que había fijado deja de valer, aunque solo se haya tocado una letra.
    this.elegida.set(null);
    this.seleccion.emit(null);
  }

  protected elegir(via: Via): void {
    this.elegida.set(via);
    this.texto.set(this.comoSeVe(via));
    this.seleccion.emit(via);
    this.abierto.set(false);
    this.activo.set(-1);
  }

  protected alTeclear(evento: KeyboardEvent): void {
    const total = this.lista().length;
    if (evento.key === 'Escape') {
      this.abierto.set(false);
      this.activo.set(-1);
      return;
    }
    if (evento.key === 'ArrowDown' && total > 0) {
      evento.preventDefault();
      this.abierto.set(true);
      this.activo.set((this.activo() + 1) % total);
      return;
    }
    if (evento.key === 'ArrowUp' && total > 0) {
      evento.preventDefault();
      this.activo.set((this.activo() - 1 + total) % total);
      return;
    }
    if (evento.key === 'Enter' && this.activo() >= 0) {
      evento.preventDefault();
      const via = this.lista()[this.activo()];
      if (via) {
        this.elegir(via);
      }
    }
  }

  /**
   * Al salir del campo se cierra, pero con margen para que el click cuente.
   *
   * Salir es también el momento en que el campo se moja: si hay texto y no hay
   * vía elegida, se queda como borrador MARCADO. No se borra lo que escribió
   * el usuario —tirarle la escritura por no haber pulsado la lista es peor que
   * el fallo—, pero tampoco cuenta como relleno.
   */
  protected alSalir(): void {
    this.tocado.set(true);
    setTimeout(() => this.abierto.set(false), 150);
  }
}
