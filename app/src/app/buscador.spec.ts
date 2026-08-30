import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
  type TestRequest,
} from '@angular/common/http/testing';
import type {
  Giro,
  TipoDeRuta,
  ParteDelPaso,
  Paso,
  Portal,
  PortalCercano,
  Trayecto,
  Via,
} from '@desplazame/tipos';
import { Buscador } from './buscador';

/**
 * Devuelve las opciones de MODO que están marcadas como activas.
 *
 * ⚠️ Se busca dentro de `fieldset.modos:not(.rutas)` desde el 30/08: el
 * selector de ruta usa el mismo vestido —es el mismo patrón— y por tanto la
 * misma clase `.modo--activo`. Preguntando por la clase a secas, esta función
 * devolvía «Bici privada, Equilibrada» y la juez de la exclusión se ponía roja
 * sin que nada estuviera mal.
 */
function modosActivos(raiz: HTMLElement): string[] {
  return Array.from(
    raiz.querySelectorAll<HTMLElement>('fieldset.modos:not(.rutas) .modo--activo'),
  ).map((b) => b.textContent?.trim() ?? '');
}

/**
 * ⭐ Los seis `input type="radio"` del grupo, en el orden del DOM.
 *
 * **Se buscan por lo que SON, no por su clase**: el encargo del 30/08 pide la
 * semántica de grupo de radios, y una prueba que preguntara por `.modo` daría
 * verde igual con seis `<button>` disfrazados. Aquí se pregunta por
 * `input[type=radio][name=modo]`, que es lo único que le da al navegador la
 * conducta del patrón — una parada de tabulador para el grupo, flechas dentro
 * y exclusión sin una línea de JavaScript.
 */
function radiosDeModo(raiz: HTMLElement): HTMLInputElement[] {
  return Array.from(raiz.querySelectorAll<HTMLInputElement>('input[type="radio"][name="modo"]'));
}

/**
 * ⭐ Y el que CUENTA las peticiones de ruta, drenándolas con lo que toque.
 *
 * Existe porque desde el 30/08 «Generar» en bici dispara **tres** —la precarga
 * del trío— y en los demás modos una. Las pruebas que solo querían una ruta no
 * tienen por qué saberlo, pero sí tienen que dejar el `HttpTestingController`
 * limpio o `verify()` las cazaría a todas.
 */
function drenarRutas(
  /**
   * ⚠️ **Las peticiones YA CASADAS, no el controlador.** `http.match()` las
   * consume: llamarlo dos veces devuelve cero la segunda, y las rutas se
   * quedan sin contestar sin que nada se ponga rojo — la prueba sigue, no hay
   * resultado que pintar, y el fallo aparece tres aserciones más abajo
   * diciendo otra cosa. Se pasa la lista para que no haya dos.
   */
  peticiones: readonly TestRequest[],
  respuesta: (ruta?: TipoDeRuta) => Trayecto,
): void {
  for (const p of peticiones) {
    p.flush(respuesta((p.request.body as { ruta?: TipoDeRuta }).ruta));
  }
}

/** Pulsa una opción del selector por su etiqueta, como quien hace clic. */
function elegirModo(fixture: any, etiqueta: string): void {
  const raiz = fixture.nativeElement as HTMLElement;
  const radio = radiosDeModo(raiz).find(
    (r) => r.closest('.modo')?.textContent?.trim() === etiqueta,
  );
  if (!radio) {
    throw new Error(
      `no hay ninguna opción de modo que se lea «${etiqueta}». Las que hay: ` +
        radiosDeModo(raiz)
          .map((r) => `«${r.closest('.modo')?.textContent?.trim()}»`)
          .join(', '),
    );
  }
  radio.click();
  fixture.detectChanges();
}

/** Escribe en un campo como lo haría una persona: valor + evento de entrada. */
function escribir(raiz: HTMLElement, nombre: string, valor: string): void {
  const campo = raiz.querySelector<HTMLInputElement>(`input[name="${nombre}"]`)!;
  campo.value = valor;
  campo.dispatchEvent(new Event('input'));
}

function botonGenerar(raiz: HTMLElement): HTMLButtonElement {
  return raiz.querySelector<HTMLButtonElement>('.generar')!;
}

function botonInvertir(raiz: HTMLElement): HTMLButtonElement {
  return raiz.querySelector<HTMLButtonElement>('.invertir')!;
}

function botonUbicacion(raiz: HTMLElement): HTMLButtonElement {
  return raiz.querySelector<HTMLButtonElement>('.ubicacion')!;
}

/** El aviso ámbar de la ubicación, si lo hay. */
function avisoUbicacion(raiz: HTMLElement): string | null {
  return raiz.querySelector('.aviso-ubicacion')?.textContent?.trim() ?? null;
}

/** El `<input>` de un campo, por su nombre. */
function campoDe(raiz: HTMLElement, nombre: string): HTMLInputElement {
  return raiz.querySelector<HTMLInputElement>(`input[name="${nombre}"]`)!;
}

/** Lo que se lee en un campo. */
function valor(raiz: HTMLElement, nombre: string): string {
  return campoDe(raiz, nombre).value;
}

const BURGOS: Via = {
  codigo: '5140',
  nombre: 'CALLE BURGOS',
  limpio: 'CALLE BURGOS',
  nucleo: null,
  tipo: 'CL',
  portales: 31,
};

const GOYA: Via = {
  codigo: '1900',
  nombre: 'AVENIDA GOYA',
  limpio: 'AVENIDA GOYA',
  nucleo: null,
  tipo: 'AV',
  portales: 120,
};

/**
 * ⭐ Y UNA VÍA SIN NINGÚN PORTAL (27/08).
 *
 * El PUENTE DE PIEDRA es el caso real y el que lo explica solo: el puente más
 * conocido de la ciudad, **cero portales** —un puente no tiene puertas— y por
 * eso invisible para el buscador desde que existe. Desde hoy el motor lo
 * resuelve por el punto medio de su geometría, y lo que aquí se comprueba es lo
 * que la PANTALLA hace con un `portales: 0`.
 */
const PUENTE: Via = {
  codigo: '23125',
  nombre: 'PUENTE DE PIEDRA',
  limpio: 'PUENTE DE PIEDRA',
  nucleo: null,
  tipo: 'PT',
  portales: 0,
};

/** Los portales que sirve el motor fingido para cada una. */
const PORTALES_BURGOS: readonly Portal[] = [
  { codigo: 'Portales.5140a', numero: '2' },
  { codigo: 'Portales.5140b', numero: '4' },
];

const PORTALES_GOYA: readonly Portal[] = [
  { codigo: 'Portales.1900a', numero: '45' },
  { codigo: 'Portales.1900b', numero: '47' },
];

/** Cómo se ve una vía en la lista: igual que la pinta el autocompletar. */
function comoSeVe(via: Via): string {
  return via.nucleo ? `${via.limpio} [${via.nucleo}]` : via.limpio;
}

// ── EL MOTOR DE RUTAS, FINGIDO Y DICHO ──────────────────────────────────────
//
// Aquí no hay motor: hay `HttpTestingController`, el mismo con el que ya se
// fingen las vías y los portales. Lo que estas pruebas miran es lo que la
// PANTALLA hace — qué pide, y qué enseña con lo que le contestan—; que el
// cálculo sea correcto lo prueban las 44 del motor, y el juez último es el ojo
// de Antonio sobre el mapa.

/**
 * Un trayecto con LA FORMA de uno real.
 *
 * Los cuatro pasos, sus giros y sus metros están calcados de una respuesta de
 * verdad de `POST /api/ruta` —CALLE ALFONSO I 10 → PASEO INDEPENDENCIA 3, 342 m
 * en cuatro pasos—, con los nombres cambiados a las dos vías que finge esta
 * prueba. La geometría va recortada a tres vértices: la de verdad trae 40 y lo
 * que se comprueba aquí es que llegue al mapa, no cuántos son.
 */
/**
 * Arma un paso como lo arma el motor: el texto se DERIVA de las partes, nunca
 * se escribe aparte. Si se escribiera aparte, estas pruebas podrían pasar con
 * un texto y unas partes que no cuadran, que es justo lo que el contrato
 * promete que no ocurre.
 */
function paso(giro: Giro, metros: number, ...partes: ParteDelPaso[]): Paso {
  return { giro, metros, partes, texto: partes.map((parte) => parte.texto).join('') };
}
const accion = (texto: string): ParteDelPaso => ({ papel: 'accion', texto });
const via = (texto: string): ParteDelPaso => ({ papel: 'via', texto });
const llano = (texto: string): ParteDelPaso => ({ papel: 'texto', texto });

const TRAYECTO: Trayecto = {
  modo: 'andando',
  pasos: [
    paso(
      'salida',
      91,
      accion('Sal de'),
      llano(' '),
      via('Calle Burgos 2'),
      llano(' y dirígete hacia el suroeste'),
      llano(' por '),
      via('Calle de Burgos'),
    ),
    // Un tramo narrado por su tipo: «la acera» NO se marca como vía.
    paso('izquierda', 150, accion('Gira a la izquierda'), llano(' hacia '), llano('la acera')),
    paso(
      'ligera-derecha',
      96,
      accion('Gira ligeramente a la derecha'),
      llano(' hacia '),
      via('Avenida de Goya'),
    ),
    paso('llegada', 0, via('Avenida Goya 45'), llano(' está a la izquierda')),
  ],
  geometria: [
    [41.6561, -0.8773],
    [41.6516, -0.879],
    [41.6425, -0.8865],
  ],
  avisos: [],
  metros: 342,
  segundos: 246,
};

/**
 * Lo que contesta el motor cuando la dirección está en una isla del grafo. El
 * texto es el suyo, literal: son las 581 puertas de las catorce vías aisladas.
 */
const SIN_RUTA: Trayecto = {
  modo: 'andando',
  pasos: [],
  geometria: [],
  avisos: [
    {
      texto:
        'URBANIZACIÓN PEÑA ZORONGO 5 no tiene ninguna calle andable cerca en ' +
        'nuestro mapa: desde ahí no podemos calcular una ruta.',
    },
  ],
  metros: 0,
  segundos: 0,
};

/**
 * ⭐ LOS DOS TRAYECTOS DE LA JUEZ 4, para mirarla desde la pantalla.
 *
 * Son el caso `Portales.120344 → Portales.110047` de `rueda.spec.ts`: la bici
 * cruza la Avenida de Madrid en **1.565 m** y el patín la rodea en **1.972**,
 * porque dos de los cuatro tramos tienen dos carriles por sentido y ahí no es
 * vía pacificada [ORD art. 15.2.a.ii]. Los metros son los del motor de verdad;
 * los pasos van recortados a lo que la prueba mira — que la calle salga en una
 * ruta y no en la otra.
 *
 * Aquí estaba `MODO_SIN_ATENDER`, lo que el motor contestaba a `modo: 'coche'`.
 * Se ha borrado con su prueba: desde el 30/08 el coche no llega a preguntar.
 */
const POR_LA_AVENIDA_DE_MADRID: Trayecto = {
  modo: 'bici',
  pasos: [
    paso('salida', 380, accion('Sal de'), llano(' '), via('Calle Burgos 2')),
    paso('derecha', 1185, accion('Gira a la derecha'), llano(' hacia '), via('Avenida de Madrid')),
    paso('llegada', 0, via('Avenida Goya 45'), llano(' está a la izquierda')),
  ],
  geometria: [
    [41.6561, -0.8973],
    [41.6555, -0.9051],
  ],
  avisos: [],
  metros: 1565,
  segundos: 313,
};

const RODEANDO_LA_AVENIDA_DE_MADRID: Trayecto = {
  modo: 'patin',
  pasos: [
    paso('salida', 380, accion('Sal de'), llano(' '), via('Calle Burgos 2')),
    paso('derecha', 812, accion('Gira a la derecha'), llano(' hacia '), via('Calle de Terminillo')),
    paso('izquierda', 780, accion('Gira a la izquierda'), llano(' hacia '), via('Calle Unceta')),
    paso('llegada', 0, via('Avenida Goya 45'), llano(' está a la izquierda')),
  ],
  geometria: [
    [41.6561, -0.8973],
    [41.6501, -0.9051],
  ],
  avisos: [],
  metros: 1972,
  segundos: 394,
};

/**
 * ⭐ TODOS los giros del contrato, en el orden en que están declarados.
 *
 * Eran diez y **son once desde el 30/08**: el hito `aparca` entró con el remate
 * del aparcabicis. La lista se escribe a mano a propósito: si el contrato
 * creciera y esta lista no, la juez de las flechas dejaría de cubrir el giro
 * nuevo sin que nada se pusiera rojo.
 */
const TODOS_LOS_GIROS: readonly Giro[] = [
  'salida',
  'recto',
  'ligera-derecha',
  'derecha',
  'cerrada-derecha',
  'media-vuelta',
  'cerrada-izquierda',
  'izquierda',
  'ligera-izquierda',
  'aparca',
  'llegada',
];

/** Un trayecto de mentira que usa TODOS los giros, uno por paso. */
const TRAYECTO_DE_LOS_DIEZ: Trayecto = {
  ...TRAYECTO,
  pasos: TODOS_LOS_GIROS.map((giro): Paso =>
    paso(giro, 10, accion('paso'), llano(' de '), via(giro)),
  ),
};

/**
 * ⭐ UNA RUTA CON REMATE, de tres tramos (30/08).
 *
 * Es la forma que el motor devuelve desde la casilla 5: se rueda hasta el
 * aparcabicis, se aparca, y se anda el resto. Los números son los de la ruta
 * real `COLOSO 2 → LEOPOLDO ROMEO 27` en bici, medida en Chrome el 30/08.
 *
 * ⚠️ Lo que esta pantalla tiene que saber leer de aquí es que **hay dos pasos
 * de `salida` y solo uno es el origen**.
 */
const VIAJE_CON_REMATE: Trayecto = {
  modo: 'bici',
  pasos: [
    paso('salida', 28, accion('Sal de'), llano(' '), via('Calle El Coloso 2'), llano(' y dirígete hacia el este')),
    paso('derecha', 510, accion('Gira a la derecha'), llano(' hacia '), via('Avenida Academia General Militar')),
    paso('recto', 1200, accion('Continúa'), llano(' hacia el carril bici de '), via('Avenida San Juan de la Peña')),
    paso('aparca', 0, accion('Aparca'), llano(' en el aparcabicis de '), via('Calle Monasterio de la Rábida'), llano(' — 5 anclajes')),
    paso('salida', 52, accion('Sigue a pie'), llano(' hacia el sur por '), via('Calle Monasterio de la Rábida')),
    paso('llegada', 0, via('Calle Leopoldo Romeo 27'), llano(' está a la izquierda')),
  ],
  geometria: [
    [41.6661, -0.8773],
    [41.6461, -0.8673],
  ],
  avisos: [],
  metros: 4587,
  segundos: 970,
};

/** Rellena los cuatro campos por el camino de una persona, y deja listo el botón. */
async function direccionEntera(fixture: any, http: HttpTestingController): Promise<void> {
  await elegirCalle(fixture, http, 'calleOrigen', 'burgos', BURGOS, PORTALES_BURGOS);
  await elegirPortal(fixture, http, 'portalOrigen', '2');
  await elegirCalle(fixture, http, 'calleDestino', 'goya', GOYA, PORTALES_GOYA);
  await elegirPortal(fixture, http, 'portalDestino', '45');
  await fixture.whenStable();
}

/**
 * Los pasos que se leen en pantalla, cada uno con su flecha y sus metros.
 *
 * Las tres piezas se juntan con un espacio AQUÍ, y no lo hay en el DOM: quien
 * las separa en pantalla es el `gap` de la caja flexible, no un carácter. Leer
 * el `textContent` del `<li>` daría «↰Gira a la izquierda150 m», que es lo que
 * hay, y no dice nada de si se ve bien.
 */
function pasosEnPantalla(raiz: HTMLElement): string[] {
  return Array.from(raiz.querySelectorAll<HTMLElement>('.paso')).map((p) =>
    Array.from(p.querySelectorAll<HTMLElement>('span'))
      .map((s) => s.textContent?.trim() ?? '')
      // Los huecos NO cuentan. Un `<span>` sin texto —la columna del icono de
      // capa, que solo se llena en las dos puntas— metía un espacio de más al
      // unir, y esto compara LO QUE SE LEE. Lo que se lee no cambió.
      .filter((t) => t !== '')
      .join(' ')
      .trim(),
  );
}

/** Las flechas, solo las flechas. */
function flechasEnPantalla(raiz: HTMLElement): string[] {
  return Array.from(raiz.querySelectorAll<HTMLElement>('.paso__flecha')).map(
    (f) => f.textContent?.trim() ?? '',
  );
}

/** Los avisos ámbar del resultado, si los hay. */
function avisosDeRuta(raiz: HTMLElement): string[] {
  return Array.from(raiz.querySelectorAll<HTMLElement>('.aviso-ruta')).map(
    (a) => a.textContent?.trim() ?? '',
  );
}

/**
 * Elige una calle **por el gesto de una persona**: escribe, espera a que el
 * campo pregunte al motor, y pulsa la sugerencia.
 *
 * El atajo —escribir el texto y ya— es justamente lo que estas pruebas hacían
 * antes, y por eso el fallo de la entrada nº4 de la bitácora vivió con las 18
 * en verde. Rellenar por el atajo no cubre el campo: lo fija.
 */
async function elegirCalle(
  fixture: any,
  http: HttpTestingController,
  nombre: string,
  escrito: string,
  via: Via,
  /**
   * Los portales que el motor sirve para esa vía — o **`null` si la vía no
   * tiene ninguno** (27/08). No es lo mismo que una lista vacía: con `null` la
   * casilla del Nº **no llega a existir**, así que nadie pide `/api/portales` y
   * esperarla colgaría la prueba.
   */
  portales: readonly Portal[] | null,
): Promise<void> {
  const raiz = fixture.nativeElement as HTMLElement;
  const campo = raiz.querySelector<HTMLInputElement>(`input[name="${nombre}"]`)!;
  campo.value = escrito;
  campo.dispatchEvent(new Event('input'));
  fixture.detectChanges();
  // La espera del componente antes de preguntar. Sin temporizadores falsos:
  // congelan el planificador de Angular (ver `autocompletar-via.spec.ts`).
  await new Promise((sigue) => setTimeout(sigue, 300));
  fixture.detectChanges();

  // ⭐ La URL lleva `&foco=…` cuando el OTRO lado ya está resuelto (27/08), así
  // que se casa por el principio y no por la cadena entera.
  http
    .expectOne((r) => r.url.startsWith(`/api/vias?q=${encodeURIComponent(escrito)}`))
    .flush([via]);
  // ⭐ Desde el 23/08 el DESTINO pide también la capa de sitios. Se drena aquí
  // vacía: estas pruebas miran las calles, y una capa sin contestar deja la
  // aplicación inestable para siempre (`whenStable()` no vuelve). El origen no
  // la pide, así que `match` no encuentra nada y no pasa nada.
  for (const cap of http.match((r) => r.url.startsWith('/api/sitios'))) {
    cap.flush([]);
  }
  // ⚠️ `asentar` y no `whenStable()` (27/08). Con el OTRO lado ya resuelto, al
  // teclear en este el campo contrario también se mueve —comparten foco— y deja
  // una petición viva que `whenStable()` esperaría para siempre. Medido: la
  // prueba del vaivén se colgaba **exactamente aquí**, en su quinto paso.
  await asentar(fixture, http);

  // Hay DOS autocompletar en la pantalla: se pulsa la sugerencia del que toca.
  //
  // Y OJO con no poner un `whenStable()` aquí: elegir la calle despierta al
  // selector de portales, que pide los suyos al instante. `whenStable()`
  // esperaría esa petición, y quien la resuelve es esta misma función unas
  // líneas más abajo. Abrazo mortal — el mismo de `autocompletar-via.spec.ts`,
  // que ha vuelto a morder en cuanto ha habido dos peticiones encadenadas.
  const suyo = campo.closest('app-autocompletar-via')!;
  suyo.querySelector<HTMLElement>('.sugerencia')!.dispatchEvent(new MouseEvent('mousedown'));
  fixture.detectChanges();

  // EL ECO. Elegir cambia el texto del campo, y ese cambio vuelve a disparar la
  // consulta 200 ms después aunque el campo ya esté resuelto y no haya nada que
  // buscar. Es comportamiento de HOY, ajeno al fallo que arregla este encargo:
  // queda REPORTADO, no tocado. Se drena aquí para que `verify()` no lo cuente
  // como una petición perdida.
  await new Promise((sigue) => setTimeout(sigue, 250));
  fixture.detectChanges();
  for (const eco of http.match((r) =>
    r.url.startsWith(`/api/vias?q=${encodeURIComponent(comoSeVe(via))}`),
  )) {
    eco.flush([via]);
  }
  for (const cap of http.match((r) => r.url.startsWith('/api/sitios'))) {
    cap.flush([]);
  }

  // Y fijar la calle despierta a SU selector de portales, que pide los suyos —
  // salvo que no haya casilla que despertar, que es el caso de las vías sin
  // portal. Ahí lo que se comprueba es que NADIE pregunte: `verify()` no cubre
  // este hueco, porque una petición que no se hace no deja rastro.
  if (portales) {
    http.expectOne(`/api/portales?via=${via.codigo}`).flush(portales);
  } else {
    expect(http.match((r) => r.url.startsWith('/api/portales'))).toEqual([]);
  }
  await asentar(fixture, http);
}

/**
 * ⭐ ESPERA A QUE LA PANTALLA SE ASIENTE, DRENANDO EL VAIVÉN DEL FOCO (27/08).
 *
 * Sustituye al `whenStable()` de los dos ayudantes, y hace falta por una razón
 * concreta: **`whenStable()` se bloquea con una petición HTTP viva**, y desde
 * hoy siempre hay una a punto de nacer. El foco es el otro extremo, la capa de
 * vías ya lo usa, y por tanto resolver un lado —o **dejar de tenerlo resuelto**,
 * que cambiar una calle tira su portal— hace que el campo contrario vuelva a
 * preguntar 200 ms después. Esa petición nace fuera de todo `detectChanges()`
 * que se haya hecho antes, y `whenStable()` se queda esperándola para siempre.
 *
 * Así que se espera **a plazos cortos**, drenando lo que aparezca entre uno y
 * otro. Solo las dos capas del autocompletar: si aquí se colara una petición de
 * PORTALES, `verify()` tiene que seguir protestando.
 */
async function asentar(fixture: any, http: HttpTestingController): Promise<void> {
  // Sale en cuanto pasan DOS vueltas seguidas sin nada que drenar. Dos y no
  // una: la petición del foco nace 200 ms después de la última interacción, y
  // una sola vuelta vacía puede ser simplemente que todavía no ha nacido.
  let vacias = 0;
  for (let vuelta = 0; vuelta < 8 && vacias < 2; vuelta++) {
    await new Promise((sigue) => setTimeout(sigue, 120));
    fixture.detectChanges();
    const pendientes = http.match(
      (r) => r.url.startsWith('/api/vias') || r.url.startsWith('/api/sitios'),
    );
    vacias = pendientes.length === 0 ? vacias + 1 : 0;
    for (const p of pendientes) {
      p.flush([]);
    }
  }
}

/** Elige un portal de la lista del campo que toca, como lo haría una persona. */
async function elegirPortal(
  fixture: any,
  http: HttpTestingController,
  nombre: string,
  numero: string,
): Promise<void> {
  const raiz = fixture.nativeElement as HTMLElement;
  const campo = raiz.querySelector<HTMLInputElement>(`input[name="${nombre}"]`)!;
  campo.dispatchEvent(new Event('focus'));
  fixture.detectChanges();

  const suyo = campo.closest('app-selector-portal')!;
  const opcion = Array.from(suyo.querySelectorAll<HTMLElement>('.portal')).find(
    (o) => o.textContent?.trim() === numero,
  );
  if (!opcion) {
    throw new Error(`no está el portal ${numero} en ${nombre}`);
  }
  opcion.dispatchEvent(new MouseEvent('mousedown'));
  // ⭐ Elegir un portal DESPIERTA AL OTRO CAMPO desde el 23/08: su código pasa
  // a ser el foco de las sugerencias del lado contrario, y eso cambia la URL
  // del recurso, que vuelve a pedir al instante [Pelias focus.point]. Sin
  // drenarla, el `whenStable()` de la línea siguiente espera a una petición que
  // nadie va a contestar y la prueba muere de tiempo. Es el abrazo mortal de
  // siempre, estrenando disfraz.
  //
  // Solo `/api/sitios`: si aquí se colara una de vías o de portales, `verify()`
  // tiene que seguir protestando.
  //
  // El `detectChanges()` va ANTES del drenaje y no es adorno: la petición del
  // foco no existe todavía al soltar el ratón. Nace cuando corre el efecto del
  // recurso, y el efecto corre en la detección de cambios — medido con una
  // sonda: sin esta línea, la lista de pendientes sale VACÍA aquí y la
  // petición aparece dentro del `whenStable()`, que es justo donde ya no se
  // puede contestar.
  fixture.detectChanges();
  for (const cap of http.match((r) => r.url.startsWith('/api/sitios'))) {
    cap.flush([]);
  }
  await asentar(fixture, http);
}

/**
 * Drena lo que dispara mover los campos POR CÓDIGO, sin teclado de por medio.
 *
 * Son dos cosas, las dos comportamiento de hoy y ninguna del encargo:
 *  1. cambiar la vía de un campo despierta a su selector de portales, que pide
 *     los de la vía nueva — al instante;
 *  2. EL ECO: cambiar el texto de una calle vuelve a disparar la consulta 200 ms
 *     después aunque el campo ya esté resuelto. Está reportado desde el punto 4
 *     y sigue sin tocarse.
 *
 * Se drena para que `verify()` no las cuente como peticiones perdidas.
 */
async function drenar(fixture: any, http: HttpTestingController): Promise<void> {
  await new Promise((sigue) => setTimeout(sigue, 250));
  fixture.detectChanges();
  for (const pendiente of http.match(() => true)) {
    // ⭐ Las CANCELADAS no se contestan: contestarlas revienta. Desde el foco
    // (23/08) una misma señal puede cambiar dos veces seguidas —el ⇅ mueve los
    // dos lados— y `httpResource` aborta la petición vieja al recalcular la
    // URL. `match()` las sigue devolviendo, pero ya no esperan respuesta.
    if (!pendiente.cancelled) {
      pendiente.flush([]);
    }
  }
  await fixture.whenStable();
}

// La geolocalizacion, FINGIDA Y DICHA.
//
// jsdom NO trae la Geolocation API: `navigator.geolocation` es `undefined`.
// Asi que aqui no se prueba el GPS —eso no se puede probar desde una prueba, y
// el juez es el portatil de Antonio—. Lo que si es real, y es lo que miran
// estas pruebas, es que se le PIDE al navegador y que se hace con cada una de
// las respuestas que la doc dice que puede dar.

/** Lo que hara el `getCurrentPosition` fingido en la prueba que toque. */
let respondeGeo: (exito: PositionCallback, fallo: PositionErrorCallback) => void;

/** Las opciones con las que se le llamo, para poder mirarlas. */
let opcionesGeo: PositionOptions | undefined;

function fingirGeolocalizacion(): void {
  respondeGeo = () => {
    throw new Error('la prueba no ha dicho que contesta la geolocalizacion');
  };
  opcionesGeo = undefined;
  Object.defineProperty(navigator, 'geolocation', {
    configurable: true,
    value: {
      getCurrentPosition: (
        exito: PositionCallback,
        fallo: PositionErrorCallback,
        opciones?: PositionOptions,
      ) => {
        opcionesGeo = opciones;
        respondeGeo(exito, fallo);
      },
    },
  });
}

/** Una posicion como la que da el navegador, con su radio de confianza. */
function posicion(lat: number, lon: number, precision: number): GeolocationPosition {
  return {
    coords: { latitude: lat, longitude: lon, accuracy: precision },
    timestamp: 0,
  } as unknown as GeolocationPosition;
}

/** [DOC MDN] Los tres codigos de `GeolocationPositionError`. */
function falloGeo(codigo: number): GeolocationPositionError {
  return { code: codigo, message: '' } as GeolocationPositionError;
}

/** El punto del Pilar. */
const PILAR: readonly [number, number] = [41.6564, -0.8779];

/** Lo que contestaria el motor para ese punto. */
const CERCA: PortalCercano = {
  via: BURGOS,
  portal: { codigo: 'Portales.5140a', numero: '2' },
  metros: 42,
};

/**
 * ⭐ Los tres `input type="radio"` del selector de RUTA, en el orden del DOM.
 *
 * Se buscan por lo que son, igual que los del modo: el patrón es el mismo
 * —grupo de radios, tres opciones dentro del rango 2-5— y una prueba que
 * preguntara por la clase daría verde con tres botones disfrazados.
 */
function radiosDeRuta(raiz: HTMLElement): HTMLInputElement[] {
  return Array.from(raiz.querySelectorAll<HTMLInputElement>('input[type="radio"][name="ruta"]'));
}

/** Lo que se lee en cada opción de ruta. */
function etiquetasDeRuta(raiz: HTMLElement): string[] {
  return Array.from(raiz.querySelectorAll<HTMLElement>('.ruta-opcion')).map(
    (r) => r.textContent?.trim() ?? '',
  );
}

/** Pulsa una opción de ruta por su etiqueta, como quien hace clic. */
function elegirRuta(fixture: any, etiqueta: string): void {
  const raiz = fixture.nativeElement as HTMLElement;
  const radio = radiosDeRuta(raiz).find(
    (r) => r.closest('.ruta-opcion')?.textContent?.trim() === etiqueta,
  );
  if (!radio) {
    throw new Error(
      `no hay ninguna opción de ruta que se lea «${etiqueta}». Las que hay: ` +
        etiquetasDeRuta(raiz)
          .map((e) => `«${e}»`)
          .join(', ') || '(ninguna)',
    );
  }
  radio.click();
  fixture.detectChanges();
}

/**
 * ⭐ EL TRÍO DE LA JUEZ 5, con los metros del motor de verdad.
 *
 * Son las tres rutas de `Portales.120344 → Portales.110047` medidas el 30/08 —
 * la juez 1 de `tipos-de-ruta.spec.ts`—: rápida 1.554 m por la `primary`,
 * equilibrada 1.565, tranquila 1.710 esquivando la avenida. Los pasos van
 * recortados a lo que la prueba mira: que lo pintado cambie al cambiar el radio
 * y que sea el que toca.
 */
const TRIO: Readonly<Record<TipoDeRuta, Trayecto>> = {
  rapida: {
    modo: 'bici',
    pasos: [
      paso('salida', 380, accion('Sal de'), llano(' '), via('Calle Burgos 2')),
      paso('derecha', 1174, accion('Gira a la derecha'), llano(' hacia '), via('Avenida de Madrid')),
      paso('llegada', 0, via('Avenida Goya 45'), llano(' está a la izquierda')),
    ],
    geometria: [
      [41.6561, -0.8973],
      [41.6555, -0.9051],
    ],
    avisos: [],
    metros: 1554,
    segundos: 342,
  },
  equilibrada: {
    modo: 'bici',
    pasos: [
      paso('salida', 380, accion('Sal de'), llano(' '), via('Calle Burgos 2')),
      paso('derecha', 1105, accion('Gira a la derecha'), llano(' hacia '), via('Avenida de Madrid')),
      // ⭐ El tramo que la separa de la rápida, y no es de adorno: la medida
      // dice que la equilibrada cambia 40 m de `primary` por 86 de `tertiary`.
      // Va como GENÉRICO —«la calzada»— y no con nombre de calle: no se ha
      // medido cuál es, y ponerle uno sería inventarlo.
      paso('izquierda', 80, accion('Gira a la izquierda'), llano(' hacia '), llano('la calzada')),
      paso('llegada', 0, via('Avenida Goya 45'), llano(' está a la izquierda')),
    ],
    geometria: [
      [41.6561, -0.8973],
      [41.6556, -0.9051],
    ],
    avisos: [],
    metros: 1565,
    segundos: 344,
  },
  tranquila: {
    modo: 'bici',
    pasos: [
      paso('salida', 380, accion('Sal de'), llano(' '), via('Calle Burgos 2')),
      paso('derecha', 950, accion('Gira a la derecha'), llano(' hacia '), via('Calle de Terminillo')),
      paso('izquierda', 380, accion('Gira a la izquierda'), llano(' hacia '), via('Calle Unceta')),
      paso('llegada', 0, via('Avenida Goya 45'), llano(' está a la izquierda')),
    ],
    geometria: [
      [41.6561, -0.8973],
      [41.6501, -0.9051],
    ],
    avisos: [],
    metros: 1710,
    segundos: 372,
  },
};

describe('Buscador', () => {
  let http: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Buscador],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
    http = TestBed.inject(HttpTestingController);
    fingirGeolocalizacion();
  });

  afterEach(() => {
    // ⭐ La capa de SITIOS se drena antes de verificar, y solo ella.
    //
    // Desde el 23/08 los DOS campos de calle ofrecen también sitios, así que
    // cualquier prueba que teclee en uno dispara una petición que a ella no le
    // importa. Estas pruebas son de calles y portales; que la capa de sitios
    // pida lo que debe lo vigilan las de `destino-sitio.spec.ts`.
    //
    // ⚠️ **Y desde el 27/08, también `/api/vias`.** Es el mismo motivo que hizo
    // entrar a sitios, con la otra capa: **la de vías ya depende del foco**, y
    // el foco es el otro extremo. Resolver un lado —o dejar de tenerlo
    // resuelto: cambiar una calle tira su portal— hace que el campo contrario
    // vuelva a preguntar 200 ms después, fuera del alcance de la prueba.
    //
    // Lo que se pierde es real y se compensa: `verify()` deja de vigilar las
    // peticiones de vías, así que **que el foco viaje** se comprueba en un
    // guardián propio, más abajo. Las de PORTALES siguen sin drenarse aquí: en
    // esas `verify()` sigue trabajando.
    for (const cap of http.match(
      (r) => r.url.startsWith('/api/sitios') || r.url.startsWith('/api/vias'),
    )) {
      cap.flush([]);
    }
    http.verify();
  });

  it('se crea', () => {
    const fixture = TestBed.createComponent(Buscador);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('pinta el nombre del proyecto', async () => {
    const fixture = TestBed.createComponent(Buscador);
    await fixture.whenStable();
    const raiz = fixture.nativeElement as HTMLElement;
    expect(raiz.querySelector('h1')?.textContent).toContain('Desplázame');
  });

  /**
   * ⚠️ **Se buscan los `input` que NO son del selector** desde el 30/08.
   *
   * Hasta hoy bastaba con enumerar todos los `<input>` de la pantalla, porque
   * los únicos que había eran los cuatro campos: el selector de modo eran
   * `<button>`. Al pasarlo a grupo de radios entraron seis `<input>` más, y
   * esta prueba se puso roja diciendo que había diez campos.
   *
   * No es un ajuste para que pase: lo que vigila —**los campos del formulario
   * son cuatro, estos, y en este orden**— sigue vigilado igual. Lo que cambia
   * es que ahora hay que decir cuáles son campos, y los del grupo se cuentan
   * en su propia juez, que exige exactamente seis.
   */
  it('tiene los cuatro campos: calle y portal de origen y de destino', async () => {
    const fixture = TestBed.createComponent(Buscador);
    await fixture.whenStable();
    const raiz = fixture.nativeElement as HTMLElement;
    const nombres = Array.from(raiz.querySelectorAll<HTMLInputElement>('input'))
      .filter((i) => i.type !== 'radio')
      .map((i) => i.name);
    expect(nombres).toEqual([
      'calleOrigen',
      'portalOrigen',
      'calleDestino',
      'portalDestino',
    ]);
  });

  // ── EL SELECTOR A SEIS MODOS (30/08) ──────────────────────────────────────
  //
  // Hasta hoy eran cuatro `<button aria-pressed>`, y «Bici / Patinete» mandaba
  // `bici` para los dos. Desde la casilla 3 el motor distingue tres ruedas con
  // tres tablas legales distintas, así que un patinetero que pulsara ahí
  // recibía una ruta de bici — legal para la bici por el art. 56.2.c de la
  // Ordenanza, **ilegal para él** en cuanto la calle pasa de 30 [ORD art.
  // 56.3.a-g, sobre el límite del art. 50 RGC]. Estas jueces son la muralla de
  // que eso no vuelva.

  it('el selector es un grupo de radios nativo, no seis botones sueltos', async () => {
    const fixture = TestBed.createComponent(Buscador);
    await fixture.whenStable();
    const raiz = fixture.nativeElement as HTMLElement;

    // El envoltorio del patrón: `fieldset` + `legend`. Ya estaba, y se queda.
    const grupo = raiz.querySelector<HTMLFieldSetElement>('fieldset.modos')!;
    expect(grupo).not.toBeNull();
    expect(grupo.querySelector('legend')?.textContent?.trim()).toBe('Cómo');

    // ⭐ Y lo que NO estaba: seis radios de verdad, con el mismo `name`. Ese
    // nombre compartido es TODO el mecanismo — es lo que hace que el navegador
    // dé una sola parada de tabulador al grupo, mueva con las flechas y
    // desmarque el anterior sin que nadie se lo pida.
    const radios = radiosDeModo(raiz);
    expect(radios.length).toBe(6);
    expect(new Set(radios.map((r) => r.name)).size).toBe(1);

    // Ninguno lleva `tabindex` puesto a mano: eso rompería la parada única.
    for (const r of radios) {
      expect(r.hasAttribute('tabindex')).toBe(false);
    }

    // Exactamente uno marcado, siempre. Es la exclusión, y la da el navegador.
    expect(radios.filter((r) => r.checked).length).toBe(1);

    // Y no queda ni un `<button class="modo">` del control viejo.
    expect(raiz.querySelectorAll('button.modo').length).toBe(0);
  });

  /**
   * Las seis etiquetas EXACTAS y en el orden firmado por Antonio el 28/08.
   *
   * El orden no es alfabético ni por velocidad: es el del encargo, y lo que
   * ordena es el reparto legal — primero lo que no lleva vehículo, luego el
   * colectivo, luego las tres ruedas (cada una con su tabla de acceso), y el
   * coche al final.
   */
  it('tiene los seis modos, con las etiquetas y el orden firmados', async () => {
    const fixture = TestBed.createComponent(Buscador);
    await fixture.whenStable();
    const raiz = fixture.nativeElement as HTMLElement;

    const etiquetas = Array.from(raiz.querySelectorAll<HTMLElement>('.modo')).map(
      (m) => m.textContent?.trim() ?? '',
    );
    expect(etiquetas).toEqual([
      'Andando',
      'Bus / Tranvía',
      'Bici privada',
      'Patín (VMP)',
      'BiZi',
      'Coche',
    ]);
  });

  it('andando viene marcado al cargar, y es el único', async () => {
    const fixture = TestBed.createComponent(Buscador);
    await fixture.whenStable();
    const raiz = fixture.nativeElement as HTMLElement;

    expect(modosActivos(raiz)).toEqual(['Andando']);
    const marcados = radiosDeModo(raiz).filter((r) => r.checked);
    expect(marcados.length).toBe(1);
    expect(marcados[0].value).toBe('andando');
  });

  it('los modos son excluyentes: elegir uno apaga el anterior', async () => {
    const fixture = TestBed.createComponent(Buscador);
    await fixture.whenStable();
    const raiz = fixture.nativeElement as HTMLElement;

    elegirModo(fixture, 'Bici privada');
    await fixture.whenStable();

    expect(modosActivos(raiz)).toEqual(['Bici privada']);
    const marcados = radiosDeModo(raiz).filter((r) => r.checked);
    expect(marcados.length).toBe(1);
    expect(marcados[0].value).toBe('bici');
  });

  it('con campos vacíos el botón está bloqueado y no pinta nada', async () => {
    const fixture = TestBed.createComponent(Buscador);
    await fixture.whenStable();
    const raiz = fixture.nativeElement as HTMLElement;

    expect(botonGenerar(raiz).disabled).toBe(true);

    botonGenerar(raiz).click();
    await fixture.whenStable();

    expect(raiz.querySelector('.pasos__lista')).toBeNull();
    expect(raiz.querySelector('.pasos__vacio')).not.toBeNull();
  });

  /**
   * EL FALLO DE LA ENTRADA Nº4. Este cuerpo es, letra por letra, el de la
   * prueba que daba verde con el fallo vivo — con la expectativa al revés:
   * escribir texto en las dos calles NO es haberlas elegido.
   */
  it('escribir las calles sin elegirlas de la lista NO desbloquea «Generar»', async () => {
    const fixture = TestBed.createComponent(Buscador);
    await fixture.whenStable();
    const raiz = fixture.nativeElement as HTMLElement;

    escribir(raiz, 'calleOrigen', 'Don Jaime I');
    escribir(raiz, 'calleDestino', 'Avenida de Goya');
    await fixture.whenStable();

    expect(botonGenerar(raiz).disabled).toBe(true);

    botonGenerar(raiz).click();
    await fixture.whenStable();

    expect(raiz.querySelector('.pasos__lista')).toBeNull();
    expect(raiz.querySelector('.pasos__vacio')).not.toBeNull();
  });

  /**
   * Y el portal ya ni siquiera se deja teclear: sin vía fijada el campo está
   * deshabilitado, así que el camino por el que se colaba un `99999` está
   * cerrado de raíz, no vigilado.
   */
  it('sin calle elegida, los dos campos de portal están deshabilitados', async () => {
    const fixture = TestBed.createComponent(Buscador);
    await fixture.whenStable();
    const raiz = fixture.nativeElement as HTMLElement;

    escribir(raiz, 'calleOrigen', 'Don Jaime I');
    await fixture.whenStable();

    for (const nombre of ['portalOrigen', 'portalDestino']) {
      const campo = raiz.querySelector<HTMLInputElement>(`input[name="${nombre}"]`)!;
      expect(campo.disabled).toBe(true);
      expect(campo.placeholder).toBe('Elige antes la calle');
    }
  });

  it('con la calle elegida pero SIN portal, «Generar» sigue bloqueado', async () => {
    const fixture = TestBed.createComponent(Buscador);
    await fixture.whenStable();
    const raiz = fixture.nativeElement as HTMLElement;

    await elegirCalle(fixture, http, 'calleOrigen', 'burgos', BURGOS, PORTALES_BURGOS);
    await elegirCalle(fixture, http, 'calleDestino', 'goya', GOYA, PORTALES_GOYA);
    await fixture.whenStable();

    // Las dos vías tienen código; ningún portal lo tiene. Faltan dos de cuatro.
    expect(botonGenerar(raiz).disabled).toBe(true);
  });

  /**
   * Cambiar la calle después de haber elegido portal vuelve a bloquear: el
   * portal de la calle vieja no vale para la nueva.
   */
  it('cambiar una calle tira su portal y vuelve a bloquear «Generar»', async () => {
    const fixture = TestBed.createComponent(Buscador);
    await fixture.whenStable();
    const raiz = fixture.nativeElement as HTMLElement;

    await elegirCalle(fixture, http, 'calleOrigen', 'burgos', BURGOS, PORTALES_BURGOS);
    await elegirPortal(fixture, http, 'portalOrigen', '2');
    await elegirCalle(fixture, http, 'calleDestino', 'goya', GOYA, PORTALES_GOYA);
    await elegirPortal(fixture, http, 'portalDestino', '45');
    await asentar(fixture, http);
    expect(botonGenerar(raiz).disabled).toBe(false);

    // Se cambia la calle de origen por otra: su portal deja de valer.
    await elegirCalle(fixture, http, 'calleOrigen', 'goya', GOYA, PORTALES_GOYA);
    // ⚠️ `asentar` y no `whenStable()`: esta prueba es la única que hace el
    // vaivén completo —resolver los dos lados y luego DESHACER uno—, y al
    // deshacerlo el destino **pierde el foco** y vuelve a preguntar. Un
    // `whenStable()` se quedaría esperando esa petición para siempre.
    await asentar(fixture, http);

    expect(botonGenerar(raiz).disabled).toBe(true);
    expect(raiz.querySelector<HTMLInputElement>('input[name="portalOrigen"]')!.value).toBe('');
    // ⏱️ Esta prueba hace CINCO interacciones completas —dos calles, dos
    // portales y un cambio de calle— y desde el 27/08 cada una espera además al
    // vaivén del foco. Con los 5 s de por defecto no le da tiempo, y alargar el
    // plazo es más honesto que quitarle pasos: lo que prueba es justo la
    // secuencia larga.
  }, 20000);

  it('con tres de los cuatro códigos, el botón sigue bloqueado', async () => {
    const fixture = TestBed.createComponent(Buscador);
    await fixture.whenStable();
    const raiz = fixture.nativeElement as HTMLElement;

    await elegirCalle(fixture, http, 'calleOrigen', 'burgos', BURGOS, PORTALES_BURGOS);
    await elegirPortal(fixture, http, 'portalOrigen', '2');
    await elegirCalle(fixture, http, 'calleDestino', 'goya', GOYA, PORTALES_GOYA);
    await fixture.whenStable();

    expect(botonGenerar(raiz).disabled).toBe(true);
  });

  // ── LA RUTA DE VERDAD ─────────────────────────────────────────────────────
  //
  // Estas ocho sustituyen a las dos que fijaban la respuesta inventada del
  // punto 2. No es que se hayan borrado dos pruebas: es que lo que fijaban
  // —«genera los tres pasos de prueba», «el modo elegido se muestra»— ya no
  // existe, y lo que hay en su sitio es una llamada al motor. El ajuste se dice
  // aquí para que no parezca que la cobertura se ha encogido.

  /**
   * ⭐ LO PRIMERO, Y LO QUE MÁS IMPORTA: se piden los CUATRO CÓDIGOS.
   *
   * Es la ley de la entrada nº4 llegando al final del tubo. El formulario lleva
   * desde el punto 4 negándose a desbloquear con texto; si la petición
   * mandara los nombres, todo aquel cuidado no habría servido de nada.
   */
  it('«Generar» pide la ruta al motor con los cuatro códigos y el modo', async () => {
    const fixture = TestBed.createComponent(Buscador);
    await fixture.whenStable();
    const raiz = fixture.nativeElement as HTMLElement;

    await direccionEntera(fixture, http);
    expect(botonGenerar(raiz).disabled).toBe(false);

    botonGenerar(raiz).click();
    fixture.detectChanges();

    const peticion = http.expectOne('/api/ruta');
    expect(peticion.request.method).toBe('POST');
    expect(peticion.request.body).toEqual({
      origen: { via: '5140', portal: 'Portales.5140a' },
      destino: { via: '1900', portal: 'Portales.1900a' },
      modo: 'andando',
    });

    peticion.flush(TRAYECTO);
    await fixture.whenStable();
  });

  it('los pasos del motor se listan con su flecha y sus metros', async () => {
    const fixture = TestBed.createComponent(Buscador);
    await fixture.whenStable();
    const raiz = fixture.nativeElement as HTMLElement;

    await direccionEntera(fixture, http);
    botonGenerar(raiz).click();
    fixture.detectChanges();
    http.expectOne('/api/ruta').flush(TRAYECTO);
    await fixture.whenStable();

    expect(pasosEnPantalla(raiz)).toEqual([
      '◉ Sal de Calle Burgos 2 y dirígete hacia el suroeste por Calle de Burgos 91 m',
      '↰ Gira a la izquierda hacia la acera 150 m',
      '↗ Gira ligeramente a la derecha hacia Avenida de Goya 96 m',
      '⚑ Avenida Goya 45 está a la izquierda',
    ]);
    // El paso de llegada no abre tramo: 0 metros no se escriben.
    expect(pasosEnPantalla(raiz)[3]).not.toContain('0 m');
    expect(raiz.querySelector('.pasos__vacio')).toBeNull();
  });

  it('⭐ pone en NEGRITA la acción y el nombre de la vía, y nada más', async () => {
    // Es el formato de la captura de Google: lo que hay que hacer y por dónde,
    // destacados; el pegamento de la frase, no.
    const fixture = TestBed.createComponent(Buscador);
    await fixture.whenStable();
    const raiz = fixture.nativeElement as HTMLElement;
    await direccionEntera(fixture, http);
    botonGenerar(raiz).click();
    fixture.detectChanges();
    http.expectOne('/api/ruta').flush(TRAYECTO);
    await fixture.whenStable();

    const negritas = (k: number): string[] =>
      Array.from(
        raiz.querySelectorAll<HTMLElement>('.paso')[k]!.querySelectorAll('strong'),
      ).map((f) => f.textContent ?? '');

    expect(negritas(0)).toEqual(['Sal de', 'Calle Burgos 2', 'Calle de Burgos']);
    expect(negritas(2)).toEqual(['Gira ligeramente a la derecha', 'Avenida de Goya']);
    expect(negritas(3)).toEqual(['Avenida Goya 45']);
  });

  it('⭐ un tramo que se narra por su TIPO no se pone en negrita', async () => {
    // «la acera» no es un nombre de calle, y destacarla lo haría parecer uno.
    const fixture = TestBed.createComponent(Buscador);
    await fixture.whenStable();
    const raiz = fixture.nativeElement as HTMLElement;
    await direccionEntera(fixture, http);
    botonGenerar(raiz).click();
    fixture.detectChanges();
    http.expectOne('/api/ruta').flush(TRAYECTO);
    await fixture.whenStable();

    const segundo = raiz.querySelectorAll<HTMLElement>('.paso')[1]!;
    expect(Array.from(segundo.querySelectorAll<HTMLElement>('strong')).map((f) => f.textContent)).toEqual([
      'Gira a la izquierda',
    ]);
    // Y el texto entero se sigue leyendo igual.
    expect(segundo.querySelector('.paso__texto')!.textContent).toBe(
      'Gira a la izquierda hacia la acera',
    );
  });

  it('⭐ el texto que se lee es EXACTAMENTE la unión de las partes', async () => {
    const fixture = TestBed.createComponent(Buscador);
    await fixture.whenStable();
    const raiz = fixture.nativeElement as HTMLElement;
    await direccionEntera(fixture, http);
    botonGenerar(raiz).click();
    fixture.detectChanges();
    http.expectOne('/api/ruta').flush(TRAYECTO);
    await fixture.whenStable();

    const pintados = Array.from(
      raiz.querySelectorAll<HTMLElement>('.paso__texto'),
    ).map((t) => t.textContent);
    expect(pintados).toEqual(TRAYECTO.pasos.map((p) => p.texto));
  });

  /**
   * Los diez giros del contrato tienen flecha, y son diez flechas DISTINTAS.
   *
   * La segunda mitad es la que de verdad vigila: un mapeo con dos giros
   * apuntando al mismo glifo se lee igual de bien y miente igual de bien.
   */
  it('TODOS los giros del contrato tienen su flecha, y ninguna se repite', async () => {
    const fixture = TestBed.createComponent(Buscador);
    await fixture.whenStable();
    const raiz = fixture.nativeElement as HTMLElement;

    await direccionEntera(fixture, http);
    botonGenerar(raiz).click();
    fixture.detectChanges();
    http.expectOne('/api/ruta').flush(TRAYECTO_DE_LOS_DIEZ);
    await fixture.whenStable();

    const flechas = flechasEnPantalla(raiz);
    expect(flechas.length).toBe(TODOS_LOS_GIROS.length);
    expect(flechas.every((f) => f !== '')).toBe(true);
    expect(new Set(flechas).size).toBe(TODOS_LOS_GIROS.length);
    // Y son once desde el 30/08: el hito entró con el remate del aparcabicis.
    expect(TODOS_LOS_GIROS.length).toBe(11);
  });

  /**
   * ⭐ EL ORIGEN Y EL DESTINO SE PINTAN UNA VEZ, EN LAS PUNTAS DE VERDAD.
   *
   * ⚠️ **Esta juez sale de un fallo visto en Chrome el 30/08.** La chincheta se
   * anclaba al giro `salida` —«es lo que significa»—, y era cierto mientras un
   * viaje era una ruta. Desde que la bici remata en el aparcabicis hay **dos
   * pasos de `salida`**, y la chincheta verde salía dos veces: en la puerta de
   * casa y al bajarse de la bici. Decía «aquí empiezas» una vez de más.
   *
   * El origen es el PRIMER paso y el destino el ÚLTIMO. Eso sí es lo que
   * significa, y es lo que esta juez fija.
   */
  it('⭐ en un viaje con remate la chincheta de origen sale UNA vez', async () => {
    const fixture = TestBed.createComponent(Buscador);
    await fixture.whenStable();
    const raiz = fixture.nativeElement as HTMLElement;

    await direccionEntera(fixture, http);
    elegirModo(fixture, 'Bici privada');
    botonGenerar(raiz).click();
    fixture.detectChanges();
    drenarRutas(http.match('/api/ruta'), () => VIAJE_CON_REMATE);
    await fixture.whenStable();

    const capas = Array.from(raiz.querySelectorAll('.pasos__lista .paso__capa'));
    expect(capas.length).toBe(VIAJE_CON_REMATE.pasos.length);
    const conIcono = capas.filter((c) => c.querySelector('app-icono-capa') !== null);
    expect(conIcono.length).toBe(2);
    // Y son la primera y la última, no dos cualesquiera.
    expect(capas.indexOf(conIcono[0]!)).toBe(0);
    expect(capas.indexOf(conIcono[1]!)).toBe(capas.length - 1);

    // De paso: el hito se lee entero, y NO lleva metros — no abre tramo.
    const textos = Array.from(raiz.querySelectorAll('.paso__texto')).map((p) =>
      (p.textContent ?? '').replace(/\s+/g, ' ').trim(),
    );
    expect(textos).toContain('Aparca en el aparcabicis de Calle Monasterio de la Rábida — 5 anclajes');
    const k = VIAJE_CON_REMATE.pasos.findIndex((p) => p.giro === 'aparca');
    expect(raiz.querySelectorAll('.paso')[k]!.querySelector('.paso__metros')).toBeNull();
  });

  it('la cabecera dice de dónde a dónde, cuánto, y el tiempo COMO DERIVADO', async () => {
    const fixture = TestBed.createComponent(Buscador);
    await fixture.whenStable();
    const raiz = fixture.nativeElement as HTMLElement;

    await direccionEntera(fixture, http);
    botonGenerar(raiz).click();
    fixture.detectChanges();
    http.expectOne('/api/ruta').flush(TRAYECTO);
    await fixture.whenStable();

    expect(raiz.querySelector('.ruta__origen')?.textContent).toContain('CALLE BURGOS 2');
    expect(raiz.querySelector('.ruta__destino')?.textContent).toContain('AVENIDA GOYA 45');
    expect(raiz.querySelector('.ruta__metros')?.textContent).toContain('342 m');

    // 246 s son 4,1 min. Y lo que NO puede faltar es de dónde sale ese número:
    // no está medido, es una división. Si algún día se enseña como una promesa
    // —«4 min»— esta prueba se pone roja.
    const duracion = raiz.querySelector('.ruta__duracion')?.textContent ?? '';
    expect(duracion).toContain('4 min');
    expect(duracion).toContain('5 km/h');
  });

  it('la geometría del motor llega al mapa, y regenerar retira la anterior', async () => {
    const fixture = TestBed.createComponent(Buscador);
    await fixture.whenStable();
    const raiz = fixture.nativeElement as HTMLElement;

    expect(raiz.querySelectorAll('path.leaflet-interactive').length).toBe(0);

    await direccionEntera(fixture, http);
    botonGenerar(raiz).click();
    fixture.detectChanges();
    http.expectOne('/api/ruta').flush(TRAYECTO);
    await fixture.whenStable();

    expect(raiz.querySelectorAll('path.leaflet-interactive').length).toBe(1);

    // Segunda generación: una línea, no dos.
    botonGenerar(raiz).click();
    fixture.detectChanges();
    http.expectOne('/api/ruta').flush(TRAYECTO);
    await fixture.whenStable();

    expect(raiz.querySelectorAll('path.leaflet-interactive').length).toBe(1);

    // Y una que NO trae geometría —una isla— deja el mapa limpio, no con la
    // línea de la ruta anterior colgada debajo de un aviso que dice que no hay.
    botonGenerar(raiz).click();
    fixture.detectChanges();
    http.expectOne('/api/ruta').flush(SIN_RUTA);
    await fixture.whenStable();

    expect(raiz.querySelectorAll('path.leaflet-interactive').length).toBe(0);
  });

  it('mientras se genera, el botón lo dice y no se deja repulsar', async () => {
    const fixture = TestBed.createComponent(Buscador);
    await fixture.whenStable();
    const raiz = fixture.nativeElement as HTMLElement;

    await direccionEntera(fixture, http);
    botonGenerar(raiz).click();
    fixture.detectChanges();

    expect(botonGenerar(raiz).disabled).toBe(true);
    expect(botonGenerar(raiz).textContent).toContain('Generando');

    // Y repulsarlo no manda una segunda petición.
    botonGenerar(raiz).click();
    fixture.detectChanges();

    http.expectOne('/api/ruta').flush(TRAYECTO);
    await fixture.whenStable();

    expect(botonGenerar(raiz).disabled).toBe(false);
    expect(botonGenerar(raiz).textContent).toContain('Generar ruta');
  });

  it('el aviso del motor se enseña en ámbar, y no se lista ningún paso', async () => {
    const fixture = TestBed.createComponent(Buscador);
    await fixture.whenStable();
    const raiz = fixture.nativeElement as HTMLElement;

    await direccionEntera(fixture, http);
    botonGenerar(raiz).click();
    fixture.detectChanges();
    http.expectOne('/api/ruta').flush(SIN_RUTA);
    await fixture.whenStable();

    expect(avisosDeRuta(raiz)[0]).toContain('PEÑA ZORONGO');
    expect(avisosDeRuta(raiz)[0]).toContain('no tiene ninguna calle andable cerca');
    expect(raiz.querySelectorAll('.paso').length).toBe(0);
    expect(raiz.querySelector('.ruta__metros')).toBeNull();
  });

  // ── EL CABLEADO: CADA RUEDA MANDA SU MODO (30/08) ─────────────────────────

  /**
   * ⭐ EL JUEZ DEL PATÍN, y **nace contra el cableado viejo**.
   *
   * Hasta el 30/08 el botón se leía «Bici / Patinete» y mandaba `bici` para los
   * dos. El motor lleva desde la casilla 3 distinguiendo las tres ruedas, así
   * que lo que llegaba al patinetero era la ruta de la bici: la misma que en la
   * juez 4 del motor le hace pisar 63 m de la Avenida de Madrid con dos
   * carriles por sentido, donde el art. 56.3 no le deja estar.
   *
   * Esta prueba se escribió ANTES de tocar el selector y falló diciendo que no
   * había ninguna opción que se leyera «Patín (VMP)»; el único camino que le
   * quedaba a un patinetero era el botón de la bici, y ese mandaba `bici`.
   */
  it('⭐ el patín manda «patin», no «bici»', async () => {
    const fixture = TestBed.createComponent(Buscador);
    await fixture.whenStable();
    const raiz = fixture.nativeElement as HTMLElement;

    elegirModo(fixture, 'Patín (VMP)');
    await direccionEntera(fixture, http);
    botonGenerar(raiz).click();
    fixture.detectChanges();

    const peticion = http.expectOne('/api/ruta');
    expect((peticion.request.body as { modo: string }).modo).toBe('patin');

    peticion.flush({ ...TRAYECTO, modo: 'patin' });
    await fixture.whenStable();
    expect(raiz.querySelector('.pasos__modo')?.textContent).toContain('Patín (VMP)');
  });

  // ── EL SELECTOR DE RUTA (30/08) ───────────────────────────────────────────
  //
  // Tres maneras de llegar al mismo sitio [DOC CycleStreets], y **solo para la
  // bici y la BiZi**: el patín no elige porque su vía ciclista es obligatoria
  // [ORD art. 56.2.c], y andando, bus y coche no tienen ruta que calibrar.

  /**
   * ⭐ JUEZ 4 — EL CAMPO SOLO EXISTE DONDE SE USA.
   *
   * Es el revelado condicional de [DOC GOV.UK], el mismo patrón que el número
   * de portal: **no está apagado, no está**. Un grupo de radios deshabilitado
   * en andando ocuparía sitio y se leería como «esto podrías tocarlo», y no
   * podría; y enseñárselo al patín sería ofrecerle desobedecer la Ordenanza.
   */
  it('⭐ el selector de ruta solo existe en bici y BiZi', async () => {
    const fixture = TestBed.createComponent(Buscador);
    await fixture.whenStable();
    const raiz = fixture.nativeElement as HTMLElement;

    // Al cargar el modo es andando: el campo no está.
    expect(raiz.querySelector('.rutas')).toBeNull();
    expect(radiosDeRuta(raiz).length).toBe(0);

    elegirModo(fixture, 'Bici privada');
    await fixture.whenStable();
    expect(raiz.querySelector('.rutas')).not.toBeNull();
    expect(etiquetasDeRuta(raiz)).toEqual(['Rápida', 'Equilibrada', 'Tranquila']);
    expect(radiosDeRuta(raiz).filter((r) => r.checked).map((r) => r.value)).toEqual([
      'equilibrada',
    ]);

    elegirModo(fixture, 'BiZi');
    await fixture.whenStable();
    expect(radiosDeRuta(raiz).length).toBe(3);

    // Y en el patín NO: su vía ciclista es obligatoria, no una preferencia.
    elegirModo(fixture, 'Patín (VMP)');
    await fixture.whenStable();
    expect(raiz.querySelector('.rutas')).toBeNull();

    elegirModo(fixture, 'Coche');
    await fixture.whenStable();
    expect(raiz.querySelector('.rutas')).toBeNull();
  });

  /**
   * ⭐ JUEZ 5 — LA PRECARGA: tres peticiones al Generar, cero al cambiar.
   *
   * Es el patrón del planificador de [DOC CycleStreets]: los tres tipos **del
   * mismo viaje**, y el usuario salta entre ellos sin replanificar. Que se
   * traiga con tres peticiones en paralelo es traducción nuestra y se declara:
   * a ~20 ms por Dijkstra, las tres salen por el precio de esperar una.
   *
   * La juez CUENTA las peticiones, que es la única manera de probar que no hay
   * una escondida:
   *
   * - «Generar» en bici → **3**, una por tipo, con su `ruta` en el cuerpo;
   * - cambiar el radio → **0**, y lo pintado cambia;
   * - tocar un extremo → el trío deja de valer, y cambiar el radio ya no
   *   repinta: hay que volver a Generar.
   */
  it('⭐ Generar en bici trae las TRES rutas, y cambiar el radio no pide nada', async () => {
    const fixture = TestBed.createComponent(Buscador);
    await fixture.whenStable();
    const raiz = fixture.nativeElement as HTMLElement;

    elegirModo(fixture, 'Bici privada');
    await direccionEntera(fixture, http);
    botonGenerar(raiz).click();
    fixture.detectChanges();

    // TRES peticiones, una por tipo, y cada una dice cuál es.
    const peticiones = http.match('/api/ruta');
    expect(peticiones.length).toBe(3);
    const pedidos = peticiones.map((p) => (p.request.body as { ruta: string }).ruta);
    expect([...pedidos].sort()).toEqual(['equilibrada', 'rapida', 'tranquila']);
    for (const p of peticiones) {
      expect((p.request.body as { modo: string }).modo).toBe('bici');
    }

    // Contestan las tres, cada una con sus metros.
    for (const p of peticiones) {
      const cual = (p.request.body as { ruta: TipoDeRuta }).ruta;
      p.flush(TRIO[cual]);
    }
    await fixture.whenStable();

    // Se pinta la equilibrada, que es la marcada: cuatro pasos y la avenida.
    expect(raiz.querySelector('.ruta__metros')?.textContent).toContain('1,6 km');
    expect(raiz.querySelectorAll('.paso').length).toBe(4);
    expect(pasosEnPantalla(raiz).join(' | ')).toContain('Avenida de Madrid');

    // ⭐ Y AHORA EL GESTO QUE COMPRA ESTE ENCARGO: cambiar el radio no pide.
    elegirRuta(fixture, 'Tranquila');
    await fixture.whenStable();
    http.expectNone('/api/ruta');
    expect(raiz.querySelector('.ruta__metros')?.textContent).toContain('1,7 km');
    expect(pasosEnPantalla(raiz).join(' | ')).toContain('Calle de Terminillo');
    expect(pasosEnPantalla(raiz).join(' | ')).not.toContain('Avenida de Madrid');

    // ⚠️ Y la rápida se distingue por sus PASOS, no por sus metros: 1.554 y
    // 1.565 se leen los dos «1,6 km». Es verdad de la pantalla y conviene
    // saberla — el rótulo redondea a la décima de kilómetro, así que dos rutas
    // separadas por 11 m dicen lo mismo. Lo que las separa se ve en el camino.
    elegirRuta(fixture, 'Rápida');
    await fixture.whenStable();
    http.expectNone('/api/ruta');
    expect(raiz.querySelector('.ruta__metros')?.textContent).toContain('1,6 km');
    expect(raiz.querySelectorAll('.paso').length).toBe(3);
    expect(pasosEnPantalla(raiz).join(' | ')).toContain('Avenida de Madrid');
  });

  /**
   * ⭐ JUEZ 5 bis — EL TRÍO CADUCA CUANDO CAMBIA LA PREGUNTA.
   *
   * Tres rutas traídas para una pregunta no valen para otra. Si al cambiarla el
   * radio siguiera repintando de lo guardado, la pantalla enseñaría la ruta de
   * una dirección con el nombre de otra —o la de una bici bajo el rótulo de una
   * BiZi—, que es exactamente la clase de mentira que el mapa lleva evitando
   * desde el punto 7. Al cambiar la pregunta, el trío se tira y hace falta
   * Generar.
   *
   * La huella de la pregunta son **los dos extremos y el modo**, y aquí se
   * cambia el modo —que el encargo nombra entre los tres— porque es el gesto
   * que esta suite puede hacer limpio: el desplegable de portales filtra por lo
   * tecleado, así que pedirle otro número al mismo campo exige reescribirlo
   * entero y la prueba mediría el autocompletar en vez del trío.
   */
  it('⭐ cambiar la pregunta caduca el trío: el radio ya no repinta', async () => {
    const fixture = TestBed.createComponent(Buscador);
    await fixture.whenStable();
    const raiz = fixture.nativeElement as HTMLElement;

    elegirModo(fixture, 'Bici privada');
    await direccionEntera(fixture, http);
    botonGenerar(raiz).click();
    fixture.detectChanges();
    for (const p of http.match('/api/ruta')) {
      p.flush(TRIO[(p.request.body as { ruta: TipoDeRuta }).ruta]);
    }
    await fixture.whenStable();
    expect(raiz.querySelectorAll('.paso').length).toBe(4);

    // Se cambia el modo a BiZi: la pregunta ya es otra, y las tres guardadas
    // son de una bici privada.
    elegirModo(fixture, 'BiZi');
    await fixture.whenStable();

    // El radio ya no repinta de lo guardado: lo de la pantalla no se mueve.
    elegirRuta(fixture, 'Tranquila');
    await fixture.whenStable();
    http.expectNone('/api/ruta');
    // Sigue la equilibrada en pantalla: sus cuatro pasos y su avenida.
    expect(raiz.querySelectorAll('.paso').length).toBe(4);
    expect(pasosEnPantalla(raiz).join(' | ')).toContain('Avenida de Madrid');
  });

  /**
   * En los demás modos, UNA petición como siempre: la precarga es de la bici y
   * la BiZi, que son las que eligen. Pedir tres rutas de andando sería gastar
   * dos Dijkstra para tirarlos.
   */
  it('en andando se pide UNA ruta, no tres', async () => {
    const fixture = TestBed.createComponent(Buscador);
    await fixture.whenStable();
    const raiz = fixture.nativeElement as HTMLElement;

    await direccionEntera(fixture, http);
    botonGenerar(raiz).click();
    fixture.detectChanges();

    const peticiones = http.match('/api/ruta');
    expect(peticiones.length).toBe(1);
    expect((peticiones[0].request.body as { ruta?: string }).ruta).toBeUndefined();
    peticiones[0].flush(TRAYECTO);
    await fixture.whenStable();
  });

  /** Y el patín tampoco: no elige, así que una sola. */
  it('en patín se pide UNA ruta: no elige', async () => {
    const fixture = TestBed.createComponent(Buscador);
    await fixture.whenStable();
    const raiz = fixture.nativeElement as HTMLElement;

    elegirModo(fixture, 'Patín (VMP)');
    await direccionEntera(fixture, http);
    botonGenerar(raiz).click();
    fixture.detectChanges();

    const peticiones = http.match('/api/ruta');
    expect(peticiones.length).toBe(1);
    expect((peticiones[0].request.body as { ruta?: string }).ruta).toBeUndefined();
    peticiones[0].flush({ ...TRAYECTO, modo: 'patin' });
    await fixture.whenStable();
  });

  /**
   * ⭐ EL RÓTULO DICE LA VELOCIDAD, **y la dice como lo que es** (30/08).
   *
   * Andando hay una sola velocidad y los minutos son exactamente
   * `metros / 5 km/h`: se escribe «a 5 km/h» y punto.
   *
   * Sobre ruedas **no hay una sola**: el techo legal de cada vía recorta la del
   * modo, los tramos que se cruzan con el vehículo en la mano van a 5, y desde
   * el remate del aparcabicis el viaje **acaba andando**. Por eso el empuje
   * quitó la coletilla entera por la mañana; la casilla 5 la devuelve **con la
   * palabra que la hace verdad**: es la velocidad DE CRUCERO, no la media.
   *
   * La juez exige las dos cosas a la vez —que el número esté y que la palabra
   * esté—, porque una sin la otra es justo lo que se quería evitar: «~4 min a
   * 18 km/h» sobre una ruta que acaba a pie vuelve a ser falso.
   */
  it('⭐ el rótulo dice el crucero por modo, y andando dice su velocidad exacta', async () => {
    const fixture = TestBed.createComponent(Buscador);
    await fixture.whenStable();
    const raiz = fixture.nativeElement as HTMLElement;

    await direccionEntera(fixture, http);
    botonGenerar(raiz).click();
    fixture.detectChanges();
    http.expectOne('/api/ruta').flush(TRAYECTO);
    await fixture.whenStable();
    const aPie = raiz.querySelector('.ruta__duracion')?.textContent ?? '';
    expect(aPie).toContain('a 5 km/h');
    // Andando no lleva «de crucero»: ahí la cuenta es entera y no hay matiz.
    expect(aPie).not.toContain('crucero');

    elegirModo(fixture, 'Patín (VMP)');
    botonGenerar(raiz).click();
    fixture.detectChanges();
    http.expectOne('/api/ruta').flush({ ...TRAYECTO, modo: 'patin' });
    await fixture.whenStable();

    const duracion = raiz.querySelector('.ruta__duracion')?.textContent ?? '';
    expect(duracion).toContain('min');
    expect(duracion).toContain('18 km/h');
    expect(duracion).toContain('de crucero');
    expect(duracion).not.toContain('a 5 km/h');
  });

  /**
   * ⭐ Y LA BiZi DICE SU VELOCIDAD, que es OTRA (20, no 18).
   *
   * Sin esta juez, una tabla que devolviera la misma cadena para los tres modos
   * de rueda daría verde con la de arriba. Las velocidades por modo se firmaron
   * el 29/08 y son 18 bici · 20 BiZi · 18 patín.
   */
  it('⭐ la BiZi dice 20 km/h y la bici privada 18', async () => {
    const fixture = TestBed.createComponent(Buscador);
    await fixture.whenStable();
    const raiz = fixture.nativeElement as HTMLElement;
    await direccionEntera(fixture, http);

    elegirModo(fixture, 'Bici privada');
    botonGenerar(raiz).click();
    fixture.detectChanges();
    drenarRutas(http.match('/api/ruta'), () => ({ ...TRAYECTO, modo: 'bici' }));
    await fixture.whenStable();
    expect(raiz.querySelector('.ruta__duracion')?.textContent).toContain('18 km/h');

    elegirModo(fixture, 'BiZi');
    botonGenerar(raiz).click();
    fixture.detectChanges();
    drenarRutas(http.match('/api/ruta'), () => ({ ...TRAYECTO, modo: 'bizi' }));
    await fixture.whenStable();
    expect(raiz.querySelector('.ruta__duracion')?.textContent).toContain('20 km/h');
  });

  it('la bici privada manda «bici»', async () => {
    const fixture = TestBed.createComponent(Buscador);
    await fixture.whenStable();
    const raiz = fixture.nativeElement as HTMLElement;

    elegirModo(fixture, 'Bici privada');
    await direccionEntera(fixture, http);
    botonGenerar(raiz).click();
    fixture.detectChanges();

    // ⭐ TRES desde el 30/08: la bici y la BiZi precargan el trío. Lo que esta
    // juez mira es el MODO, y las tres tienen que decir el mismo.
    const peticiones = http.match('/api/ruta');
    expect(peticiones.length).toBe(3);
    for (const p of peticiones) {
      expect((p.request.body as { modo: string }).modo).toBe('bici');
    }
    drenarRutas(peticiones, () => ({ ...TRAYECTO, modo: 'bici' }));
    await fixture.whenStable();
  });

  it('la BiZi manda «bizi»', async () => {
    const fixture = TestBed.createComponent(Buscador);
    await fixture.whenStable();
    const raiz = fixture.nativeElement as HTMLElement;

    elegirModo(fixture, 'BiZi');
    await direccionEntera(fixture, http);
    botonGenerar(raiz).click();
    fixture.detectChanges();

    // ⭐ TRES desde el 30/08: la bici y la BiZi precargan el trío. Lo que esta
    // juez mira es el MODO, y las tres tienen que decir el mismo.
    const peticiones = http.match('/api/ruta');
    expect(peticiones.length).toBe(3);
    for (const p of peticiones) {
      expect((p.request.body as { modo: string }).modo).toBe('bizi');
    }
    drenarRutas(peticiones, () => ({ ...TRAYECTO, modo: 'bizi' }));
    await fixture.whenStable();
  });

  /**
   * ⭐ BUS Y COCHE NO LLAMAN AL MOTOR, y lo dicen ellos.
   *
   * Hasta hoy sí llamaban, y el motor contestaba con su aviso —«Todavía no
   * calculamos rutas en modo «coche». Solo andando, bici, patin, bizi.»—. Se
   * enseñaba tal cual, y era honesto.
   *
   * Lo que cambia es **quién lo dice**, y por dos razones medidas:
   *
   * 1. Con el motor caído, ese viaje no contestaba «todavía no hacemos coche»
   *    sino «No se pudo preguntar al motor», que es falso: el coche no
   *    dependería del motor ni estando arrancado.
   * 2. El aviso del motor enumera su lista interna —`andando, bici, patin,
   *    bizi`, con los identificadores del contrato— y esos no son las palabras
   *    de la pantalla, que dice «Bici privada» y «Patín (VMP)».
   *
   * Lo que NO cambia es la forma de lo que se pinta: sigue siendo un `Trayecto`
   * con su modo, cero pasos y un aviso ámbar. Bus llega con el punto 10 del
   * plan y coche con el 11; ese día la fila pierde su `todavia` y empieza a
   * viajar como las demás.
   */
  it('el bus no llama a /api/ruta: lo dice la pantalla', async () => {
    const fixture = TestBed.createComponent(Buscador);
    await fixture.whenStable();
    const raiz = fixture.nativeElement as HTMLElement;

    elegirModo(fixture, 'Bus / Tranvía');
    await direccionEntera(fixture, http);
    botonGenerar(raiz).click();
    fixture.detectChanges();
    await fixture.whenStable();

    // NI UNA petición. `expectNone` es la aserción de verdad de esta juez.
    http.expectNone('/api/ruta');

    expect(raiz.querySelector('.pasos__modo')?.textContent).toContain('Bus / Tranvía');
    expect(avisosDeRuta(raiz)[0]).toContain('Todavía no calculamos rutas en bus ni tranvía');
    expect(raiz.querySelectorAll('.paso').length).toBe(0);
    // Y no se cuela la línea de metros de una ruta que no existe.
    expect(raiz.querySelector('.ruta__metros')).toBeNull();
  });

  it('el coche no llama a /api/ruta: lo dice la pantalla', async () => {
    const fixture = TestBed.createComponent(Buscador);
    await fixture.whenStable();
    const raiz = fixture.nativeElement as HTMLElement;

    elegirModo(fixture, 'Coche');
    await direccionEntera(fixture, http);
    botonGenerar(raiz).click();
    fixture.detectChanges();
    await fixture.whenStable();

    http.expectNone('/api/ruta');
    expect(raiz.querySelector('.pasos__modo')?.textContent).toContain('Coche');
    expect(avisosDeRuta(raiz)[0]).toContain('Todavía no calculamos rutas en coche');
    expect(raiz.querySelectorAll('.paso').length).toBe(0);
  });

  /**
   * ⭐ LA JUEZ 4 DEL MOTOR, VISTA DESDE LA PANTALLA.
   *
   * El selector no vale nada si el modo viaja pero no cambia lo que se pinta.
   * Aquí van **los mismos dos extremos** —los de la juez 4 de `rueda.spec.ts`,
   * `Portales.120344 → Portales.110047`— con sus dos respuestas reales: la bici
   * cruza la Avenida de Madrid en 1.565 m y el patín la rodea en 1.972.
   *
   * Lo que prueba es que la pantalla no arrastra el resultado anterior: se
   * cambia SOLO el modo, con los cuatro códigos intactos, y lo que se lee
   * debajo es lo otro — otros metros y otra calle en los pasos.
   *
   * Los números salen del motor de verdad; aquí el motor está fingido y lo
   * único que se mira es el tubo. La cuenta la vigila la juez 4.
   */
  it('a extremos iguales, cambiar de modo cambia la ruta que se lee', async () => {
    const fixture = TestBed.createComponent(Buscador);
    await fixture.whenStable();
    const raiz = fixture.nativeElement as HTMLElement;

    await direccionEntera(fixture, http);

    elegirModo(fixture, 'Bici privada');
    botonGenerar(raiz).click();
    fixture.detectChanges();
    // La bici precarga el trío: son tres, y las tres con el mismo cuerpo salvo
    // el tipo de ruta. Se contesta a las tres la misma, que aquí no se mira.
    const enBici = http.match('/api/ruta');
    expect(enBici.length).toBe(3);
    for (const p of enBici) {
      expect((p.request.body as { modo: string }).modo).toBe('bici');
    }
    drenarRutas(enBici, () => POR_LA_AVENIDA_DE_MADRID);
    await fixture.whenStable();

    expect(raiz.querySelector('.ruta__metros')?.textContent).toContain('1,6 km');
    expect(pasosEnPantalla(raiz).join(' | ')).toContain('Avenida de Madrid');

    // El MISMO origen y el MISMO destino. Solo cambia la rueda.
    elegirModo(fixture, 'Patín (VMP)');
    botonGenerar(raiz).click();
    fixture.detectChanges();
    const enPatin = http.expectOne('/api/ruta');
    // El patín no elige ruta: su cuerpo es el de la bici sin `ruta` y con su modo.
    const cuerpoBici = enBici[0].request.body as Record<string, unknown>;
    expect(enPatin.request.body).toEqual({
      origen: cuerpoBici['origen'],
      destino: cuerpoBici['destino'],
      modo: 'patin',
    });
    enPatin.flush(RODEANDO_LA_AVENIDA_DE_MADRID);
    await fixture.whenStable();

    expect(raiz.querySelector('.ruta__metros')?.textContent).toContain('2,0 km');
    expect(pasosEnPantalla(raiz).join(' | ')).not.toContain('Avenida de Madrid');
  });

  it('si el motor no contesta, la ruta lo dice en ámbar y no pinta nada', async () => {
    const fixture = TestBed.createComponent(Buscador);
    await fixture.whenStable();
    const raiz = fixture.nativeElement as HTMLElement;

    await direccionEntera(fixture, http);
    botonGenerar(raiz).click();
    fixture.detectChanges();

    http
      .expectOne('/api/ruta')
      .error(new ProgressEvent('error'), { status: 0, statusText: 'sin conexión' });
    await fixture.whenStable();

    expect(avisosDeRuta(raiz)[0]).toContain('No se pudo preguntar al motor');
    expect(raiz.querySelectorAll('.paso').length).toBe(0);
    expect(botonGenerar(raiz).disabled).toBe(false);
    expect(raiz.querySelectorAll('path.leaflet-interactive').length).toBe(0);
  });

  /**
   * ⭐ EL ENTIERRO. La respuesta inventada del punto 2 no puede volver por la
   * puerta de atrás: ni su aviso, ni sus frases, ni su trazado.
   */
  it('no queda rastro de la respuesta inventada: ni aviso, ni frases, ni trazado', async () => {
    const fixture = TestBed.createComponent(Buscador);
    await fixture.whenStable();
    const raiz = fixture.nativeElement as HTMLElement;

    await direccionEntera(fixture, http);
    botonGenerar(raiz).click();
    fixture.detectChanges();
    http.expectOne('/api/ruta').flush(TRAYECTO);
    await fixture.whenStable();

    expect(raiz.querySelector('.aviso-prueba')).toBeNull();
    const todo = raiz.textContent ?? '';
    expect(todo).not.toContain('DATOS DE PRUEBA');
    expect(todo).not.toContain('parada de prueba');
    expect(todo).not.toContain('línea de prueba');
  });

  // ── ⇅ INVERTIR ────────────────────────────────────────────────────────────

  it('⇅ invertir intercambia los cuatro campos, CÓDIGOS incluidos', async () => {
    const fixture = TestBed.createComponent(Buscador);
    await fixture.whenStable();
    const raiz = fixture.nativeElement as HTMLElement;

    await elegirCalle(fixture, http, 'calleOrigen', 'burgos', BURGOS, PORTALES_BURGOS);
    await elegirPortal(fixture, http, 'portalOrigen', '2');
    await elegirCalle(fixture, http, 'calleDestino', 'goya', GOYA, PORTALES_GOYA);
    await elegirPortal(fixture, http, 'portalDestino', '45');
    await fixture.whenStable();
    expect(botonGenerar(raiz).disabled).toBe(false);

    botonInvertir(raiz).click();
    fixture.detectChanges();

    expect(valor(raiz, 'calleOrigen')).toBe('AVENIDA GOYA');
    expect(valor(raiz, 'portalOrigen')).toBe('45');
    expect(valor(raiz, 'calleDestino')).toBe('CALLE BURGOS');
    expect(valor(raiz, 'portalDestino')).toBe('2');

    // Y con ellos los CÓDIGOS: «Generar» sigue desbloqueado.
    //
    // Aquí es donde se ve por qué la regla «cambiar de calle tira el portal»
    // tuvo que subir al padre. Si siguiera dentro del selector de portal, la
    // vía nueva de cada lado dispararía el tirón y los dos portales acabarían
    // vacíos: invertir se deshacía a sí mismo.
    expect(botonGenerar(raiz).disabled).toBe(false);

    await drenar(fixture, http);
  });

  it('⇅ invertir con un lado a medias: el borrador viaja tal cual', async () => {
    const fixture = TestBed.createComponent(Buscador);
    await fixture.whenStable();
    const raiz = fixture.nativeElement as HTMLElement;

    // Origen a medias: escrito, no elegido, y salido del campo — borrador.
    escribir(raiz, 'calleOrigen', 'burgos');
    fixture.detectChanges();
    await new Promise((sigue) => setTimeout(sigue, 300));
    fixture.detectChanges();
    http.expectOne('/api/vias?q=burgos').flush([BURGOS]);
    // Desde el 23/08 el origen pide también la capa de sitios: sin drenarla,
    // `whenStable()` no vuelve. Se contesta vacía porque esta prueba mira el
    // borrador de una CALLE.
    for (const cap of http.match((r) => r.url.startsWith('/api/sitios'))) {
      cap.flush([]);
    }
    await fixture.whenStable();
    campoDe(raiz, 'calleOrigen').dispatchEvent(new Event('blur'));
    fixture.detectChanges();
    await new Promise((sigue) => setTimeout(sigue, 250));
    fixture.detectChanges();
    expect(campoDe(raiz, 'calleOrigen').getAttribute('aria-invalid')).toBe('true');

    // Destino entero.
    await elegirCalle(fixture, http, 'calleDestino', 'goya', GOYA, PORTALES_GOYA);
    await elegirPortal(fixture, http, 'portalDestino', '45');
    await fixture.whenStable();

    botonInvertir(raiz).click();
    fixture.detectChanges();

    // El borrador ha cruzado, y cruza MARCADO: el estado a medias viaja entero.
    expect(valor(raiz, 'calleDestino')).toBe('burgos');
    expect(campoDe(raiz, 'calleDestino').getAttribute('aria-invalid')).toBe('true');

    // Y el lado bueno llega limpio al otro extremo.
    expect(valor(raiz, 'calleOrigen')).toBe('AVENIDA GOYA');
    expect(campoDe(raiz, 'calleOrigen').getAttribute('aria-invalid')).toBeNull();
    expect(valor(raiz, 'portalOrigen')).toBe('45');

    // Sigue faltando media dirección, así que sigue bloqueado.
    expect(botonGenerar(raiz).disabled).toBe(true);

    await drenar(fixture, http);
  });

  // ── MI UBICACIÓN ──────────────────────────────────────────────────────────

  it('«Mi ubicación» rellena calle y portal POR CÓDIGO, como si se hubieran elegido', async () => {
    const fixture = TestBed.createComponent(Buscador);
    await fixture.whenStable();
    const raiz = fixture.nativeElement as HTMLElement;

    // El destino se pone a mano, para que solo falte el origen.
    await elegirCalle(fixture, http, 'calleDestino', 'goya', GOYA, PORTALES_GOYA);
    await elegirPortal(fixture, http, 'portalDestino', '45');
    await fixture.whenStable();
    expect(botonGenerar(raiz).disabled).toBe(true);

    respondeGeo = (exito) => exito(posicion(PILAR[0], PILAR[1], 20));
    botonUbicacion(raiz).click();
    fixture.detectChanges();

    // Mientras se espera al motor, el botón no se deja pulsar otra vez.
    expect(botonUbicacion(raiz).disabled).toBe(true);

    http.expectOne(`/api/portal-cercano?lat=${PILAR[0]}&lon=${PILAR[1]}`).flush(CERCA);
    fixture.detectChanges();

    expect(valor(raiz, 'calleOrigen')).toBe('CALLE BURGOS');
    expect(valor(raiz, 'portalOrigen')).toBe('2');
    expect(avisoUbicacion(raiz)).toBeNull();
    expect(botonUbicacion(raiz).disabled).toBe(false);

    // Y lo que prueba que hay CÓDIGO detrás y no solo texto: el botón se
    // desbloquea. Con el texto puesto y el código vacío seguiría bloqueado —
    // que es exactamente el fallo de la entrada nº4.
    expect(botonGenerar(raiz).disabled).toBe(false);

    await drenar(fixture, http);
  });

  it('pide la posición con las TRES opciones declaradas', async () => {
    const fixture = TestBed.createComponent(Buscador);
    await fixture.whenStable();
    const raiz = fixture.nativeElement as HTMLElement;

    respondeGeo = (exito) => exito(posicion(PILAR[0], PILAR[1], 20));
    botonUbicacion(raiz).click();
    fixture.detectChanges();
    http.expectOne(`/api/portal-cercano?lat=${PILAR[0]}&lon=${PILAR[1]}`).flush(CERCA);

    expect(opcionesGeo).toEqual({
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0,
    });

    await drenar(fixture, http);
  });

  it('con la precisión mala NI PREGUNTA al motor, y dice cuántos metros son', async () => {
    const fixture = TestBed.createComponent(Buscador);
    await fixture.whenStable();
    const raiz = fixture.nativeElement as HTMLElement;

    // 1.200 m de radio: un posicionamiento por IP, no un GPS.
    respondeGeo = (exito) => exito(posicion(PILAR[0], PILAR[1], 1200));
    botonUbicacion(raiz).click();
    fixture.detectChanges();

    expect(avisoUbicacion(raiz)).toContain('1200 metros');
    expect(valor(raiz, 'calleOrigen')).toBe('');
    // El umbral se mira ANTES de preguntar: no se molesta al motor en balde.
    http.expectNone(() => true);
  });

  it('con el portal demasiado lejos NO toca los campos y dice a cuántos está', async () => {
    const fixture = TestBed.createComponent(Buscador);
    await fixture.whenStable();
    const raiz = fixture.nativeElement as HTMLElement;

    respondeGeo = (exito) => exito(posicion(PILAR[0], PILAR[1], 20));
    botonUbicacion(raiz).click();
    fixture.detectChanges();

    // 676 m es lo que mide Puerto Venecia, que está DENTRO de Zaragoza. Por eso
    // el mensaje NO puede decir «no estás en Zaragoza»: lo estaría diciendo
    // estando en Zaragoza. Habla de la distancia, que es lo que sí sabemos.
    http
      .expectOne(`/api/portal-cercano?lat=${PILAR[0]}&lon=${PILAR[1]}`)
      .flush({ ...CERCA, metros: 676 } satisfies PortalCercano);
    fixture.detectChanges();

    expect(avisoUbicacion(raiz)).toContain('676 metros');
    expect(avisoUbicacion(raiz)).not.toContain('Zaragoza');
    expect(valor(raiz, 'calleOrigen')).toBe('');
    expect(valor(raiz, 'portalOrigen')).toBe('');
    expect(botonGenerar(raiz).disabled).toBe(true);
  });

  it('los TRES fallos de la API tienen su mensaje, y ninguno toca los campos', async () => {
    const esperados: ReadonlyArray<readonly [number, string]> = [
      [1, 'Sin permiso de ubicación'],
      [2, 'no ha podido averiguar dónde estás'],
      [3, 'Se ha tardado demasiado'],
    ];

    for (const [codigo, trozo] of esperados) {
      const fixture = TestBed.createComponent(Buscador);
      await fixture.whenStable();
      const raiz = fixture.nativeElement as HTMLElement;

      respondeGeo = (_exito, fallo) => fallo(falloGeo(codigo));
      botonUbicacion(raiz).click();
      fixture.detectChanges();

      expect(avisoUbicacion(raiz)).toContain(trozo);
      expect(valor(raiz, 'calleOrigen')).toBe('');
      expect(botonUbicacion(raiz).disabled).toBe(false);
      http.expectNone(() => true);
    }
  });

  it('un aviso viejo se borra al volver a pulsar: no se queda mintiendo', async () => {
    const fixture = TestBed.createComponent(Buscador);
    await fixture.whenStable();
    const raiz = fixture.nativeElement as HTMLElement;

    respondeGeo = (_exito, fallo) => fallo(falloGeo(3));
    botonUbicacion(raiz).click();
    fixture.detectChanges();
    expect(avisoUbicacion(raiz)).toContain('Se ha tardado demasiado');

    respondeGeo = (exito) => exito(posicion(PILAR[0], PILAR[1], 20));
    botonUbicacion(raiz).click();
    fixture.detectChanges();
    http.expectOne(`/api/portal-cercano?lat=${PILAR[0]}&lon=${PILAR[1]}`).flush(CERCA);
    fixture.detectChanges();

    expect(avisoUbicacion(raiz)).toBeNull();
    expect(valor(raiz, 'calleOrigen')).toBe('CALLE BURGOS');

    await drenar(fixture, http);
  });

  it('lo que rellena «Mi ubicación» se puede INVERTIR: así se pone como destino', async () => {
    const fixture = TestBed.createComponent(Buscador);
    await fixture.whenStable();
    const raiz = fixture.nativeElement as HTMLElement;

    respondeGeo = (exito) => exito(posicion(PILAR[0], PILAR[1], 20));
    botonUbicacion(raiz).click();
    fixture.detectChanges();
    http.expectOne(`/api/portal-cercano?lat=${PILAR[0]}&lon=${PILAR[1]}`).flush(CERCA);
    fixture.detectChanges();

    botonInvertir(raiz).click();
    fixture.detectChanges();

    expect(valor(raiz, 'calleOrigen')).toBe('');
    expect(valor(raiz, 'calleDestino')).toBe('CALLE BURGOS');
    expect(valor(raiz, 'portalDestino')).toBe('2');

    await drenar(fixture, http);
  });

  // Las tres ramas que no salen de la API sino del camino: sin contexto
  // seguro, con el motor caído, y con el motor diciendo que no sabe. No están
  // en los cinco mensajes que se aprobaron, pero existen, y un botón que no
  // hace nada y no dice por qué es peor que no tener botón.

  it('sin la API de geolocalización lo DICE, y dice que hace falta https', async () => {
    Object.defineProperty(navigator, 'geolocation', {
      configurable: true,
      value: undefined,
    });

    const fixture = TestBed.createComponent(Buscador);
    await fixture.whenStable();
    const raiz = fixture.nativeElement as HTMLElement;

    botonUbicacion(raiz).click();
    fixture.detectChanges();

    expect(avisoUbicacion(raiz)).toContain('conexión segura (https)');
    expect(botonUbicacion(raiz).disabled).toBe(false);
    http.expectNone(() => true);
  });

  /**
   * La que más se parece a un navegador de verdad.
   *
   * El GPS NO contesta dentro del click: tarda. Y cuando contesta, lo hace
   * desde una devolución de llamada que no es un evento de Angular. Aquí eso
   * se finge con un temporizador, y **a propósito no se llama a
   * `detectChanges()` en ningún momento**: si el aviso aparece, es porque
   * escribir la señal ya pide el repintado por su cuenta. Esta aplicación no
   * lleva zone.js —no hay `polyfills` en `angular.json`—, así que eso no se
   * puede dar por hecho: o se mira, o no consta.
   */
  it('la respuesta que llega TARDE repinta igual, sin empujar la pantalla a mano', async () => {
    const fixture = TestBed.createComponent(Buscador);
    await fixture.whenStable();
    const raiz = fixture.nativeElement as HTMLElement;

    respondeGeo = (_exito, fallo) => {
      setTimeout(() => fallo(falloGeo(1)), 0);
    };
    botonUbicacion(raiz).click();

    await new Promise((sigue) => setTimeout(sigue, 30));
    await fixture.whenStable();

    expect(avisoUbicacion(raiz)).toContain('Sin permiso de ubicación');
    http.expectNone(() => true);
  });

  it('si el motor no contesta, lo dice igual que los demás campos', async () => {
    const fixture = TestBed.createComponent(Buscador);
    await fixture.whenStable();
    const raiz = fixture.nativeElement as HTMLElement;

    respondeGeo = (exito) => exito(posicion(PILAR[0], PILAR[1], 20));
    botonUbicacion(raiz).click();
    fixture.detectChanges();

    http
      .expectOne(`/api/portal-cercano?lat=${PILAR[0]}&lon=${PILAR[1]}`)
      .error(new ProgressEvent('error'), { status: 0, statusText: 'sin conexión' });
    fixture.detectChanges();

    expect(avisoUbicacion(raiz)).toContain('No se pudo preguntar al motor');
    expect(botonUbicacion(raiz).disabled).toBe(false);
    expect(valor(raiz, 'calleOrigen')).toBe('');
  });

  it('si el motor contesta que NO SABE, no se rellena media dirección', async () => {
    const fixture = TestBed.createComponent(Buscador);
    await fixture.whenStable();
    const raiz = fixture.nativeElement as HTMLElement;

    respondeGeo = (exito) => exito(posicion(PILAR[0], PILAR[1], 20));
    botonUbicacion(raiz).click();
    fixture.detectChanges();

    http.expectOne(`/api/portal-cercano?lat=${PILAR[0]}&lon=${PILAR[1]}`).flush(null);
    fixture.detectChanges();

    expect(avisoUbicacion(raiz)).toContain('No hemos podido situarte');
    expect(valor(raiz, 'calleOrigen')).toBe('');
    expect(botonGenerar(raiz).disabled).toBe(true);
  });

  // ── ⭐ LAS VÍAS SIN PORTAL (27/08) ────────────────────────────────────────

  it('⭐ una vía SIN PORTALES no enseña la casilla del Nº: no está, no está apagada', async () => {
    // [DOC GOV.UK: conditional reveal] Es el mismo patrón que ya rige para los
    // sitios, y el mismo argumento: un campo deshabilitado sigue en la página,
    // ocupa su hueco y se lee como «esto habría que rellenarlo». Al PUENTE DE
    // PIEDRA no hay número que pedirle.
    const fixture = TestBed.createComponent(Buscador);
    await fixture.whenStable();
    const raiz = fixture.nativeElement as HTMLElement;

    // Antes de elegir nada la casilla SÍ está —apagada, diciendo «Elige antes
    // la calle»—, y eso no cambia: quitarla mientras se escribe haría
    // desaparecer media pantalla a cada tecla.
    expect(raiz.querySelector('input[name="portalOrigen"]')).not.toBeNull();

    await elegirCalle(fixture, http, 'calleOrigen', 'puente', PUENTE, null);

    expect(raiz.querySelector('input[name="portalOrigen"]')).toBeNull();
    // Y el otro lado, que no ha elegido nada, conserva la suya: la regla es del
    // lado que eligió, no de la pantalla entera.
    expect(raiz.querySelector('input[name="portalDestino"]')).not.toBeNull();
  });

  it('⭐ «Generar ruta» queda legal con la vía sola, y viaja SU CÓDIGO en las dos casillas', async () => {
    const fixture = TestBed.createComponent(Buscador);
    await fixture.whenStable();
    const raiz = fixture.nativeElement as HTMLElement;

    await elegirCalle(fixture, http, 'calleOrigen', 'puente', PUENTE, null);
    // Con un solo lado todavía no: la regla de los dos extremos no se afloja.
    expect(botonGenerar(raiz).disabled).toBe(true);

    await elegirCalle(fixture, http, 'calleDestino', 'goya', GOYA, PORTALES_GOYA);
    await elegirPortal(fixture, http, 'portalDestino', '45');
    await asentar(fixture, http);

    expect(botonGenerar(raiz).disabled).toBe(false);
    botonGenerar(raiz).click();
    fixture.detectChanges();

    // ⭐ EL CUERPO, que es lo que este encargo decide. El contrato no se ha
    // movido —`PeticionDeRuta` sigue pidiendo `via` y `portal`— y la pantalla no
    // compone ningún código: manda dos veces el único que le dieron al elegir de
    // la lista.
    const peticion = http.expectOne('/api/ruta');
    expect(peticion.request.body).toEqual({
      origen: { via: '23125', portal: '23125' },
      destino: { via: '1900', portal: 'Portales.1900a' },
      modo: 'andando',
    });
    peticion.flush(TRAYECTO);
    await asentar(fixture, http);
  });

  it('⭐ la cabecera del resultado lee la vía sola, sin un número inventado', async () => {
    const fixture = TestBed.createComponent(Buscador);
    await fixture.whenStable();
    const raiz = fixture.nativeElement as HTMLElement;

    await elegirCalle(fixture, http, 'calleOrigen', 'puente', PUENTE, null);
    await elegirCalle(fixture, http, 'calleDestino', 'goya', GOYA, PORTALES_GOYA);
    await elegirPortal(fixture, http, 'portalDestino', '45');
    await asentar(fixture, http);

    botonGenerar(raiz).click();
    fixture.detectChanges();
    http.expectOne('/api/ruta').flush(TRAYECTO);
    await asentar(fixture, http);

    const origen = raiz.querySelector('.ruta__origen')!.textContent!.trim();
    expect(origen).toContain('PUENTE DE PIEDRA');
    // Y NO se le cuelga un número detrás: no hay ninguno que decir.
    expect(/PUENTE DE PIEDRA\s+\d/.test(origen)).toBe(false);
    expect(raiz.querySelector('.ruta__destino')!.textContent).toContain('AVENIDA GOYA 45');
  });

  it('⭐ una vía sin portal sirve de FOCO al otro campo, igual que un portal', async () => {
    // Es lo que hace que esto no sea un caso aparte: un lado con el PUENTE DE
    // PIEDRA elegido **está entero**, no a medias, así que ordena la lista del
    // campo contrario como lo haría cualquier extremo resuelto.
    const fixture = TestBed.createComponent(Buscador);
    await fixture.whenStable();
    const raiz = fixture.nativeElement as HTMLElement;

    await elegirCalle(fixture, http, 'calleOrigen', 'puente', PUENTE, null);

    escribir(raiz, 'calleDestino', 'goya');
    fixture.detectChanges();
    await new Promise((sigue) => setTimeout(sigue, 300));
    fixture.detectChanges();

    const pedidas = http.match((r) => r.url.startsWith('/api/vias?q=goya'));
    expect(pedidas.length).toBe(1);
    expect(pedidas[0]!.request.url).toContain('foco=23125');
    pedidas[0]!.flush([GOYA]);
    await asentar(fixture, http);
  });

  it('⭐ el ⇅ la cruza como a cualquiera: el hueco del Nº se va con ella', async () => {
    const fixture = TestBed.createComponent(Buscador);
    await fixture.whenStable();
    const raiz = fixture.nativeElement as HTMLElement;

    await elegirCalle(fixture, http, 'calleOrigen', 'puente', PUENTE, null);
    await elegirCalle(fixture, http, 'calleDestino', 'goya', GOYA, PORTALES_GOYA);
    await elegirPortal(fixture, http, 'portalDestino', '45');
    await asentar(fixture, http);

    expect(raiz.querySelector('input[name="portalOrigen"]')).toBeNull();
    expect(valor(raiz, 'portalDestino')).toBe('45');

    botonInvertir(raiz).click();
    fixture.detectChanges();

    // El hueco viaja con su lado: ahora el que no tiene número es el destino.
    expect(raiz.querySelector('input[name="portalDestino"]')).toBeNull();
    expect(valor(raiz, 'calleDestino')).toBe('PUENTE DE PIEDRA');
    expect(valor(raiz, 'calleOrigen')).toBe('AVENIDA GOYA');
    // Y el portal de la que sí lo tiene cruza con ella, sin perderse.
    expect(valor(raiz, 'portalOrigen')).toBe('45');
    // El botón sigue legal: invertir no rompe lo que ya estaba entero.
    expect(botonGenerar(raiz).disabled).toBe(false);

    // Al invertir, el selector de portales del ORIGEN nace y pide los suyos.
    for (const p of http.match((r) => r.url.startsWith('/api/portales'))) {
      p.flush(PORTALES_GOYA);
    }
    await asentar(fixture, http);
  });
});
