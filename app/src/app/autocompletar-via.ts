import { Component, computed, effect, input, model, signal } from '@angular/core';
import { httpResource } from '@angular/common/http';
import type { Sitio, Via } from '@desplazame/tipos';
import { IconoCapa, type Clase } from './iconos';

/**
 * Cómo se enseña una vía: el nombre limpio y, si es de un núcleo, su nombre.
 *
 * El núcleo va entre CORCHETES, no entre paréntesis, porque los paréntesis ya
 * son del dato: 38 vías los traen en su propio nombre —32 de ellas sugeribles—
 * («CALLE MALPICA ( A)»), y una es trampa pura —«CALLE HERRERÍN (JAIME
 * BALLESTEROS)»— donde el paréntesis NO es un núcleo. Dos signos, dos
 * significados: el paréntesis es del callejero, el corchete es nuestro.
 *
 * Es función suelta y **exportada**, no solo método del componente, porque el
 * padre la necesita: cuando «Mi ubicación» fija una vía por código tiene que
 * escribir en el campo exactamente el mismo texto que se habría escrito al
 * elegirla de la lista. Dos formas de pintar la misma vía serían dos verdades.
 */
export function comoSeVeLaVia(via: Via): string {
  return via.nucleo ? `${via.limpio} [${via.nucleo}]` : via.limpio;
}

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
 * Lo que se ENSEÑA es «NOMBRE LIMPIO [NÚCLEO]». El marcador críptico del dato
 * (`---CST`) no sale a pantalla, pero su significado sí — y hace falta: hay 52
 * nombres que se repiten entre la ciudad y los barrios rurales.
 */
/** Una opción de la lista: de la capa de calles o de la de sitios. */
interface Opcion {
  /**
   * De qué CAPA salió: calles o sitios. Son dos índices distintos [DOC Pelias:
   * `layers`], y es lo que dice el `data-capa` del `<li>`.
   */
  readonly capa: 'via' | 'sitio';
  /**
   * ⭐ Y QUÉ ES, que no es lo mismo. La capa de sitios trae tres clases —
   * farmacia, centro de salud, hospital— y cada una tiene su dibujo. Son dos
   * preguntas: «¿de qué índice salió?» y «¿qué es?».
   */
  readonly clase: Clase;
  readonly clave: string;
  readonly texto: string;
  /** La seña de la derecha: los portales de una vía, la categoría de un sitio. */
  readonly extra: string;
  readonly via?: Via;
  readonly sitio?: Sitio;
}

@Component({
  selector: 'app-autocompletar-via',
  imports: [IconoCapa],
  templateUrl: './autocompletar-via.html',
  styleUrl: './autocompletar-via.css',
})
export class AutocompletarVia {
  /** El `name` del campo, que es también su identificador para la etiqueta. */
  readonly campo = input.required<string>();
  readonly etiqueta = input.required<string>();

  /**
   * ⭐ EN QUÉ CAPA busca este campo. **Una sola**, desde el 24/08.
   *
   * `via` son las calles del callejero municipal; cualquier otro valor es una
   * categoría de sitio. [DOC Pelias] `layers` es exactamente esto —acotar la
   * búsqueda a una capa— y aquí lo elige quien mira, con el desplegable que
   * hay delante del cajetín.
   *
   * ⚠️ **La búsqueda mezclada murió aquí**, y fue decisión de Antonio tomada a
   * sabiendas. Hasta el 24/08 este campo pedía LAS DOS capas y las enseñaba
   * juntas; ahora pide una. Lo que se gana es que la lista no sorprenda —
   * quien dice «Farmacias» ve farmacias— y lo que se pierde es encontrar una
   * calle sin haber dicho que buscaba una calle. Está firmado.
   */
  readonly capa = input.required<Clase>();

  /**
   * ⭐ EL FOCO: el código del OTRO extremo, si ya está resuelto.
   *
   * [DOC Pelias] `focus.point` *«will prioritize results closer to the focus
   * point»*. Buscando el destino, el foco es el origen ya elegido: «la
   * farmacia» casi siempre quiere decir «la de al lado de donde estoy», y sin
   * foco la lista contesta por orden alfabético, que no es lo que nadie busca.
   *
   * Va **el código y no un punto**: esta pantalla no conoce coordenadas —el
   * contrato le da códigos— y quien sabe convertir uno en el otro es el motor.
   * `null` mientras el otro lado esté a medias, que es el caso al empezar.
   */
  readonly foco = input<string | null>(null);


  /**
   * El SITIO elegido, o `null`. Va **aparte de `seleccion`** a propósito: son
   * dos clases de destino y elegir uno apaga el otro, así que el padre puede
   * preguntar «¿qué han elegido?» sin desempaquetar una unión en la plantilla.
   */
  readonly sitio = model<Sitio | null>(null);

  /** Lo escrito. Doble sentido: la pantalla necesita saberlo para validar. */
  readonly texto = model('');

  /**
   * La vía elegida de la lista, o `null` si lo escrito no corresponde a
   * ninguna. Es lo que separa «escrito» de «elegido», y sin ella no hay código
   * de vía: escribir el nombre a mano no vale, porque el nombre no identifica
   * nada —hay 52 que se repiten entre la ciudad y los barrios rurales—.
   * Entrada nº4 de la bitácora.
   *
   * **Es `model()` y no `output()`, y esa es la pieza que sostiene el punto 6.**
   *
   * [DOC] La guía de Angular nombra el caso: *«Use model inputs when you want a
   * component to support two-way binding»*, con el ejemplo de los *«custom form
   * controls where the component needs to both receive a value and update
   * it»* — que es literalmente este campo. Los tipos instalados lo dicen igual:
   * *«A model signal is a writeable signal that can be exposed as an output»*
   * (`@angular/core`, `ModelSignal`, `@publicApi 19.0`).
   *
   * Con `output()` no había puerta: el padre solo podía escribir el texto, y un
   * texto sin código es el fallo de la entrada nº4 con otro disfraz. Medido
   * antes de tocar nada — la API pública del componente era `['constructor']`.
   */
  readonly seleccion = model<Via | null>(null);

  /**
   * Si el usuario ya salió del campo alguna vez. Antes de salir no se regaña.
   *
   * También `model()`: al invertir origen⇄destino, el estado a medias de cada
   * lado viaja con él —un borrador marcado sigue marcado al otro lado—, y quien
   * sabe que ha habido intercambio es el padre, no el campo.
   */
  readonly tocado = model(false);

  protected readonly abierto = signal(false);
  protected readonly activo = signal(-1);

  /** Hay texto pero no hay vía: un borrador, que se conserva pero no vale. */
  private readonly esBorrador = computed(
    () => this.texto().trim() !== '' && this.seleccion() === null && this.sitio() === null,
  );

  /**
   * Cuándo se ENSEÑA que no vale. Mientras se teclea no: sería regañar a mitad
   * de palabra. Se enseña al salir, y se apaga solo de dos maneras —eligiendo
   * de la lista, o dejando el campo vacío—, que son las dos que lo resuelven.
   */
  protected readonly marcado = computed(() => this.tocado() && this.esBorrador());

  /** Lo escrito, pero con la espera aplicada: es lo que dispara la petición. */
  private readonly consultaConEspera = signal('');

  /**
   * ⭐ LO QUE DE VERDAD SE PREGUNTA: la consulta con espera, **pero solo si
   * sigue siendo lo que hay escrito**.
   *
   * La espera y el texto van desacompasados 200 ms, y hasta el 24/08 eso no se
   * notaba porque la URL solo dependía del texto. Ahora depende también de la
   * CAPA, y la capa cambia sin espera: al pulsar el ⇅ —o al cambiar de tipo—
   * el campo se quedaba un instante con **el texto viejo bajo la capa nueva** y
   * salía a preguntar por él. Visto en una prueba:
   * `GET /api/vias?q=Farmacia · Avda. de Navarra, 65` — una calle que se llama
   * como una farmacia, que no existe y que nadie ha escrito.
   *
   * No era grave —200 ms después se corrige sola— pero es una pregunta que
   * nadie ha hecho, y en una lista abierta se vería un parpadeo de resultados
   * que no vienen de lo que se está escribiendo.
   */
  private readonly consulta = computed(() =>
    this.consultaConEspera() === this.texto() ? this.consultaConEspera() : '',
  );

  constructor() {
    let temporizador: ReturnType<typeof setTimeout> | undefined;
    effect((alLimpiar) => {
      const escrito = this.texto();
      clearTimeout(temporizador);
      temporizador = setTimeout(() => this.consultaConEspera.set(escrito), ESPERA_MS);
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
    // Y al revés: con una categoría de sitio, las VÍAS no se piden. Las dos
    // capas se excluyen desde el 24/08 — el campo busca en una, la que diga su
    // desplegable.
    if (this.capa() !== 'via' || q.length < MINIMO) {
      return undefined;
    }
    return `/api/vias?q=${encodeURIComponent(q)}`;
  });

  /**
   * La capa de sitios. **Solo se pide si el campo está en una categoría**:
   * devolver `undefined` en la URL es lo que le dice a `httpResource` que no
   * hay nada que pedir, y es lo que garantiza la pureza — no se pide y se
   * descarta, es que no se pide.
   */
  protected readonly sugerenciasSitios = httpResource<readonly Sitio[]>(() => {
    const q = this.consulta().trim();
    // Con `via` no se pide la capa de sitios **en absoluto**: no es que se pida
    // y se descarte, es que no se pide. Es lo que hace que la lista de una
    // dirección no pueda traer una farmacia ni por accidente.
    if (this.capa() === 'via' || q.length < MINIMO) {
      return undefined;
    }
    // El foco entra en la URL, así que **cambiarlo vuelve a pedir**: elegir el
    // origen reordena la lista del destino sin que haya que teclear otra vez.
    // Es lo que hace `httpResource` de serie —lee señales y se rehace—, y aquí
    // es justo lo que se quiere.
    const foco = this.foco();
    const capa = `&capa=${encodeURIComponent(this.capa())}`;
    return foco
      ? `/api/sitios?q=${encodeURIComponent(q)}${capa}&foco=${encodeURIComponent(foco)}`
      : `/api/sitios?q=${encodeURIComponent(q)}${capa}`;
  });

  /**
   * ⭐ UNA OPCIÓN de la lista, sea de la capa que sea.
   *
   * Las dos capas se enseñan en la misma lista porque quien escribe no piensa
   * en capas: piensa en «a dónde voy». Pero cada opción **dice de cuál es**, y
   * lo dice en un atributo y no solo en el texto — así la pantalla puede
   * pintarlas distinto y una prueba puede distinguirlas sin leer prosa.
   */
  protected readonly lista = computed<readonly Opcion[]>(() => {
    const vias: Opcion[] = (this.sugerencias.value() ?? []).map((via) => ({
      capa: 'via' as const,
      clase: 'via' as const,
      clave: via.codigo,
      texto: comoSeVeLaVia(via),
      // Los portales de la vía: la seña que ya distinguía una calle de otra.
      extra: String(via.portales),
      via,
    }));
    const sitios: Opcion[] = (this.sugerenciasSitios.value() ?? []).map((sitio) => ({
      capa: 'sitio' as const,
      clase: sitio.tipo,
      clave: sitio.codigo,
      // 🔒 `presentacion` y nada más: el título del dato lleva, en 274 de las
      // 313 farmacias, el nombre de la persona titular, y no sale del motor.
      texto: sitio.presentacion,
      extra: sitio.categoria,
      sitio,
    }));
    // Las calles primero: es lo que más se busca en un buscador de rutas, y
    // los sitios son la novedad, no el caso general.
    return [...vias, ...sitios];
  });

  /** Hay algo que enseñar en el desplegable: sugerencias, «buscando» o «nada». */
  protected readonly hayQueMostrar = computed(
    () => this.abierto() && this.consulta().trim().length >= MINIMO,
  );

  /** Lo mismo que usa el padre, para que el campo se lea igual siempre. */
  protected comoSeVe(via: Via): string {
    return comoSeVeLaVia(via);
  }

  protected alEscribir(valor: string): void {
    this.texto.set(valor);
    this.abierto.set(true);
    this.activo.set(-1);
    // Lo escrito a mano ya no corresponde a lo elegido antes: el código que
    // había fijado deja de valer, aunque solo se haya tocado una letra. Vale
    // para las dos capas.
    this.seleccion.set(null);
    this.sitio.set(null);
  }

  /**
   * Elegir una opción, de la capa que sea. **Elegir una apaga la otra**: no se
   * puede ir a la vez a una calle y a una farmacia, y dejar las dos puestas
   * sería dejar que el padre decidiera cuál vale.
   */
  protected elegir(opcion: Opcion): void {
    this.texto.set(opcion.texto);
    this.seleccion.set(opcion.via ?? null);
    this.sitio.set(opcion.sitio ?? null);
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
      const opcion = this.lista()[this.activo()];
      if (opcion) {
        this.elegir(opcion);
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
