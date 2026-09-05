import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
  type TestRequest,
} from '@angular/common/http/testing';
import type {
  EstacionViva,
  Giro,
  Modo,
  PosteVivo,
  TipoDeRuta,
  ParteDelPaso,
  Paso,
  Portal,
  PortalCercano,
  Trayecto,
  Via,
} from '@desplazame/tipos';
import { Buscador, CUANDO_SE_DICE_QUE_TARDA_MS } from './buscador';

/**
 * Devuelve las opciones de MODO que están marcadas como activas.
 *
 * ⚠️ Se busca dentro de `fieldset.modos.familias` desde el 30/08: el selector
 * de ruta usa el mismo vestido —es el mismo patrón— y por tanto la misma clase
 * `.modo--activo`. Preguntando por la clase a secas, esta función devolvía
 * «Bici privada, Equilibrada» y la juez de la exclusión se ponía roja sin que
 * nada estuviera mal.
 *
 * ⚠️ **Y desde el 2/09 hay una TERCERA fila con el mismo vestido**: la de
 * «Privada / Pública BiZi». El filtro pasa de excluir a la de rutas
 * (`:not(.rutas)`) a NOMBRAR la que se quiere (`.familias`) — excluir obliga a
 * acordarse de cada fila nueva; nombrar, no.
 */
function modosActivos(raiz: HTMLElement): string[] {
  return Array.from(
    raiz.querySelectorAll<HTMLElement>('fieldset.modos.familias .modo--activo'),
  ).map((b) => b.textContent?.trim() ?? '');
}

/** Lo mismo, en la segunda fila: qué bici está marcada. */
function bicisActivas(raiz: HTMLElement): string[] {
  return Array.from(
    raiz.querySelectorAll<HTMLElement>('fieldset.modos.bicis .modo--activo'),
  ).map((b) => b.textContent?.trim() ?? '');
}

/**
 * ⭐ Los cinco `input type="radio"` de la PRIMERA fila, en el orden del DOM.
 *
 * **Se buscan por lo que SON, no por su clase**: el encargo del 30/08 pide la
 * semántica de grupo de radios, y una prueba que preguntara por `.modo` daría
 * verde igual con `<button>` disfrazados. Aquí se pregunta por
 * `input[type=radio][name=familia]`, que es lo único que le da al navegador la
 * conducta del patrón — una parada de tabulador para el grupo, flechas dentro
 * y exclusión sin una línea de JavaScript.
 *
 * ⚠️ El `name` es `familia` desde el 2/09, no `modo`: la primera fila ya no
 *    pregunta el modo, pregunta la familia. Los dos modos de la bici viven en
 *    la segunda, con su propio `name`.
 */
function radiosDeFamilia(raiz: HTMLElement): HTMLInputElement[] {
  return Array.from(raiz.querySelectorAll<HTMLInputElement>('input[type="radio"][name="familia"]'));
}

/**
 * Los de la SEGUNDA fila. **Solo existen con Bici elegida**: el revelado
 * condicional quita el grupo entero, no lo apaga, así que aquí la lista vacía
 * es una respuesta y no un fallo.
 */
function radiosDeBici(raiz: HTMLElement): HTMLInputElement[] {
  return Array.from(raiz.querySelectorAll<HTMLInputElement>('input[type="radio"][name="bici"]'));
}

/**
 * Los de la segunda fila de la MOTO. **Solo existen con Moto elegida**, igual
 * que los de la bici: el revelado condicional quita el grupo entero.
 */
function radiosDeMoto(raiz: HTMLElement): HTMLInputElement[] {
  return Array.from(raiz.querySelectorAll<HTMLInputElement>('input[type="radio"][name="moto"]'));
}

/**
 * Los radios de «¿Dónde quieres aparcar?». **Solo existen con Coche elegido**:
 * el revelado condicional quita el grupo entero, así que la lista vacía es una
 * respuesta y no un fallo.
 */
function radiosDeAparcamiento(raiz: HTMLElement): HTMLInputElement[] {
  return Array.from(
    raiz.querySelectorAll<HTMLInputElement>('input[type="radio"][name="aparcamiento"]'),
  );
}

/** Los de «¿Tienes autorización…?». Solo existen con [Sin etiqueta] marcada. */
function radiosDeAutorizacion(raiz: HTMLElement): HTMLInputElement[] {
  return Array.from(
    raiz.querySelectorAll<HTMLInputElement>('input[type="radio"][name="autorizacion"]'),
  );
}

/** Y los de «¿Distintivo ambiental?», con la misma ley. */
function radiosDeDistintivo(raiz: HTMLElement): HTMLInputElement[] {
  return Array.from(
    raiz.querySelectorAll<HTMLInputElement>('input[type="radio"][name="distintivo"]'),
  );
}

/** Pulsa una opción de un grupo por su `value`, y falla diciendo qué había. */
function pulsar(fixture: any, radios: HTMLInputElement[], valor: string): void {
  const suyo = radios.find((r) => r.value === valor);
  if (!suyo) {
    throw new Error(
      `no hay ninguna opción «${valor}». Las que hay: ${radios.map((r) => r.value).join(', ')}` +
        ' (si está vacío, el grupo no se ha revelado)',
    );
  }
  suyo.click();
  fixture.detectChanges();
}

/**
 * ⭐ EL COLOR DE CADA TRAMO PINTADO, y **solo las líneas de encima**.
 *
 * Cada tramo se pinta con DOS polilíneas desde el 1/09 —su ribete debajo y su
 * color encima—, así que contar `path.leaflet-interactive` no cuenta tramos.
 * Es el mismo `encima` que `mapa.spec.ts` usa para lo mismo, y aquí hace falta
 * porque la traza roja de la ZBE es **la mitad de lo que compra la juez 6**: el
 * hito dice dónde se aparca y el color dice por dónde se ha pasado.
 */
function coloresDeLosTramos(raiz: HTMLElement): (string | null)[] {
  return Array.from(raiz.querySelectorAll<SVGPathElement>('path.leaflet-interactive'))
    .filter((_, i) => i % 2 === 1)
    .map((p) => p.getAttribute('stroke'));
}

/** El cuerpo de la ÚLTIMA petición de ruta que se hizo. */
function cuerpoDeLaRuta(peticiones: readonly TestRequest[]): Record<string, unknown> {
  return peticiones[peticiones.length - 1]!.request.body as Record<string, unknown>;
}

/** El texto de la nota ámbar de cada paso, por el índice del paso que la lleva. */
function notasPorPaso(raiz: HTMLElement): ReadonlyMap<number, string> {
  const notas = new Map<number, string>();
  Array.from(raiz.querySelectorAll<HTMLElement>('.paso')).forEach((li, i) => {
    const nota = li.querySelector<HTMLElement>('.paso__nota');
    if (nota) {
      notas.set(i, (nota.textContent ?? '').replace(/\s+/g, ' ').replace('⚠ ', '').trim());
    }
  });
  return notas;
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

/**
 * ⭐ Deja el selector en el modo que se le pida, **pulsando** — una fila o dos.
 *
 * Toma el `Modo` del contrato y no una etiqueta, que es lo que estas jueces
 * quieren decir de verdad: «ponte en bizi», no «pulsa el botón que pone BiZi».
 * Desde el 2/09 esas dos frases ya no son la misma, porque para llegar a `bizi`
 * hay que pulsar **dos** cosas — la familia y luego la opción—, y ninguna de
 * las cuarenta jueces que llaman aquí tiene por qué saberlo.
 *
 * Lo que sí hace es pulsar de verdad, las dos veces: nadie toca la señal por
 * dentro. Si el revelado condicional dejara de revelar, esto explota con el
 * nombre de lo que buscaba, que es lo que se quiere.
 */
function elegirModo(fixture: any, modo: Modo): void {
  const raiz = fixture.nativeElement as HTMLElement;
  // ⭐ Dos familias tienen segunda fila: la bici —privada y BiZi— y, desde el
  //    4/09, la moto —privada y YeGo—. Las demás son un solo modo.
  const familia = modo === 'bizi' ? 'bici' : modo === 'yego' ? 'moto' : modo;

  const suyo = radiosDeFamilia(raiz).find((r) => r.value === familia);
  if (!suyo) {
    throw new Error(
      `no hay ninguna familia «${familia}». Las que hay: ` +
        radiosDeFamilia(raiz)
          .map((r) => r.value)
          .join(', '),
    );
  }
  // ⚠️ Un radio YA marcado no dispara `change` al pulsarlo, y eso es justo lo
  //    que se quiere: venir de `bizi` y pedir `bici` no debe reiniciar la
  //    familia, solo cambiar de opción dentro de ella.
  suyo.click();
  fixture.detectChanges();

  if (familia !== 'bici' && familia !== 'moto') {
    return;
  }
  const segunda = familia === 'bici' ? radiosDeBici(raiz) : radiosDeMoto(raiz);
  const cual = segunda.find((r) => r.value === modo);
  if (!cual) {
    throw new Error(
      `elegida la familia ${familia}, no aparece la opción «${modo}». Las que hay: ` +
        segunda.map((r) => r.value).join(', ') +
        ' (si está vacío, la segunda fila no se ha revelado)',
    );
  }
  cual.click();
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

/** El botón de la sugerencia cruzada, si está. Vive junto al hito 🅿. */
function botonSugerir(raiz: HTMLElement): HTMLButtonElement | null {
  return raiz.querySelector<HTMLButtonElement>('.sugerencia__boton');
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
  tramos: [{ comoSeVa: 'andando', desde: 0, hasta: 1, metros: 342, segundos: 246, hito: null }],
};

/**
 * Lo que contesta el motor cuando la dirección está en una isla del grafo. El
 * texto es el suyo, literal: son las 581 puertas de las catorce vías aisladas.
 */
const SIN_RUTA: Trayecto = {
  modo: 'andando',
  // Sin ruta no hay geometría, y sin geometría no hay tramos.
  tramos: [],
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
  tramos: [{ comoSeVa: 'rodando', desde: 0, hasta: 1, metros: 1565, segundos: 313, hito: null }],
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
  tramos: [{ comoSeVa: 'rodando', desde: 0, hasta: 1, metros: 1972, segundos: 394, hito: null }],
};

/**
 * ⭐ TODOS los giros del contrato, en el orden en que están declarados.
 *
 * Eran diez y **son doce desde el 30/08**: los dos hitos —`aparca` con el
 * remate del aparcabicis y `coge` con el modo BiZi—. La lista se escribe a mano
 * a propósito: si el contrato creciera y esta lista no, la juez de las flechas
 * dejaría de cubrir el giro nuevo sin que nada se pusiera rojo.
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
  'coge',
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
    // ⭐ El vértice de la costura: aquí está el aparcabicis, y aquí va su icono.
    [41.6472, -0.8647],
    [41.6461, -0.8673],
  ],
  avisos: [],
  metros: 4587,
  segundos: 970,
  // ⭐ Los dos tramos del remate, con el hito donde muere el que se rueda.
  // Los metros son los del caso real: 4.535 rodando y 52 andando.
  tramos: [
    { comoSeVa: 'rodando', desde: 0, hasta: 1, metros: 4535, segundos: 933, hito: 'aparca' },
    { comoSeVa: 'andando', desde: 1, hasta: 2, metros: 52, segundos: 37, hito: null },
  ],
};

/**
 * ⭐ UN VIAJE EN BiZi de tres tramos, con sus DOS hitos (30/08).
 *
 * Es la forma que el motor devuelve desde la casilla 6: se anda hasta una
 * estación que tenga bicis, se pedalea hasta otra que tenga anclajes libres, y
 * se anda el resto. Los textos son los de la ruta real `COLOSO 2 → LEOPOLDO
 * ROMEO 27` leída en Chrome el 30/08 a las 12:57, con el dato vivo dentro.
 */
const VIAJE_EN_BIZI: Trayecto = {
  modo: 'bizi',
  pasos: [
    paso('salida', 30, accion('Sal de'), llano(' '), via('Calle El Coloso 2'), llano(' y dirígete hacia el este')),
    paso('izquierda', 97, accion('Gira a la izquierda'), llano(' hacia '), via('Avenida de la Academia General Militar')),
    paso('coge', 0, accion('Coge'), llano(' una bici en la estación '), via('Tauromaquia'), llano(' — 11 bicis disponibles a las 12:57')),
    paso('salida', 610, accion('Pedalea'), llano(' hacia el sur por '), via('Avenida Academia General Militar')),
    paso('recto', 1200, accion('Continúa'), llano(' hacia el carril bici de '), via('Avenida San Juan de la Peña')),
    paso('aparca', 0, accion('Deja'), llano(' la bici en la estación '), via('Mrio. Siresa: Dr. Iranzo'), llano(' — 16 anclajes libres a las 12:57')),
    paso('salida', 64, accion('Sigue a pie'), llano(' hacia el oeste por '), via('Calle Monasterio de Siresa')),
    paso('llegada', 0, via('Calle Leopoldo Romeo 27'), llano(' está a la izquierda')),
  ],
  geometria: [
    [41.6661, -0.8773],
    // La estación donde se coge la bici.
    [41.6826, -0.8712],
    // Y la estación donde se deja.
    [41.6476, -0.8641],
    [41.6461, -0.8673],
  ],
  avisos: [],
  metros: 4800,
  segundos: 1020,
  // ⭐ Los tres tramos del viaje, con sus dos hitos. Las cifras son las de la
  // ruta real: 127 m andando, 4.513 pedaleando y 160 andando.
  tramos: [
    { comoSeVa: 'andando', desde: 0, hasta: 1, metros: 127, segundos: 91, hito: 'coge' },
    { comoSeVa: 'rodando', desde: 1, hasta: 2, metros: 4513, segundos: 813, hito: 'aparca' },
    { comoSeVa: 'andando', desde: 2, hasta: 3, metros: 160, segundos: 116, hito: null },
  ],
};

/**
 * ⭐ EL MISMO VIAJE EN BiZi, PERO CON LA API DE LA SEDE CALLADA (30/08).
 *
 * Es la respuesta **real** de ese día: la sede contestaba `200 OK` con
 * `Content-Length: 0` —cuerpo vacío— y el plan D-G saltó como está firmado:
 * la ruta sale con el inventario, los hitos van **sin número y sin hora**, y un
 * aviso dice que la disponibilidad no está verificada.
 *
 * ⚠️ **Lo que hace legales unos hitos pelados es ese aviso.** Sin él, la
 * pantalla estaría diciendo «coge una bici aquí» sin decir que no sabe si hay
 * ninguna. Por eso este fixture existe: para que haya algo que se ponga rojo si
 * el aviso deja de pintarse. Ver la entrada del 30/08 de `docs/BITACORA.md`.
 */
const VIAJE_EN_BIZI_A_CIEGAS: Trayecto = {
  ...VIAJE_EN_BIZI,
  pasos: VIAJE_EN_BIZI.pasos.map((p) =>
    p.giro === 'coge'
      ? paso('coge', 0, accion('Coge'), llano(' una bici en la estación '), via('Tauromaquia'))
      : p.giro === 'aparca'
        ? paso('aparca', 0, accion('Deja'), llano(' la bici en la estación '), via('Mrio. Siresa: Dr. Iranzo'))
        : p,
  ),
  avisos: [
    { texto: 'No hemos podido preguntar cuántas bicis hay ahora mismo: disponibilidad no verificada.' },
  ],
};

/**
 * ⭐ UN VIAJE EN BUS con el aviso de que la línea no está pasando (31/08).
 *
 * Es el caso del ojo —`COLOSO 2 → LEOPOLDO ROMEO 27`, línea 29— con la
 * respuesta **medida** del poste 1203 a las 13:16: `maquinas` con solo la
 * parada y `tablatiempos` vacío. Ni un bus viniendo.
 *
 * ⚠️ Fíjate en lo que eso produce: la ruta sale entera y el hito **conserva su
 * estimación** —«~7 min de espera»—, porque el horario publicado sigue siendo
 * lo mejor que se sabe. Lo que hace legal esa estimación es el aviso, y el
 * aviso **nombra su poste**: por eso puede ir al lado de SU hito y no de otro.
 */
const LINEA_29_APP = {
  id: '29',
  corto: '29',
  largo: 'Camino de Las Torres - San Gregorio',
  color: 'F5C100',
  colorTexto: '000000',
  modo: 'bus' as const,
};
const LINEA_35_APP = {
  id: '35',
  corto: '35',
  largo: 'Actur - Parque Venecia',
  color: '445C9F',
  colorTexto: 'FFFFFF',
  modo: 'bus' as const,
};
const LINEA_22_APP = {
  id: '22',
  corto: '22',
  largo: 'Parque Goya - Vadorrey',
  color: '008A92',
  colorTexto: 'FFFFFF',
  modo: 'bus' as const,
};

const VIAJE_EN_BUS_SIN_LA_29: Trayecto = {
  modo: 'bus',
  pasos: [
    paso('salida', 30, accion('Sal de'), llano(' '), via('Calle El Coloso 2'), llano(' y dirígete hacia el este')),
    paso('recto', 448, accion('Continúa'), llano(' por '), via('Avenida de la Academia General Militar')),
    paso('sube', 0, accion('Sube'), llano(' a la línea '), via('29'), llano(' en el poste '), via('Bernardo Ramazzini / Maz'), llano(' — ~7 min de espera')),
    paso('baja', 0, accion('Baja'), llano(' en el poste '), via('Miguel Servet N.º 28')),
    paso('llegada', 0, via('Calle Leopoldo Romeo 27'), llano(' está a la izquierda')),
  ],
  geometria: [
    [41.6661, -0.8773],
    // El poste donde se sube.
    [41.6826, -0.8712],
    // Y el poste donde se baja.
    [41.6476, -0.8641],
    [41.6461, -0.8673],
  ],
  avisos: [
    {
      texto:
        'Avanza no anuncia ningún próximo de la línea 29 en el poste Bernardo Ramazzini / Maz ' +
        'ahora mismo — la espera sale del horario publicado.',
    },
  ],
  metros: 6320,
  segundos: 3106,
  tramos: [
    { comoSeVa: 'andando', desde: 0, hasta: 1, metros: 478, segundos: 344, hito: 'sube' },
    {
      comoSeVa: 'montado',
      desde: 1,
      hasta: 2,
      metros: 4956,
      segundos: 2124,
      hito: 'baja',
      linea: {
        id: '29',
        corto: '29',
        largo: 'Camino de Las Torres - San Gregorio',
        color: 'F5C100',
        colorTexto: '000000',
        modo: 'bus',
      },
    },
    { comoSeVa: 'andando', desde: 2, hasta: 3, metros: 886, segundos: 638, hito: null },
  ],
};

/**
 * ⭐ EL MISMO VIAJE, con **a quién preguntar** en el paso de subir (1/09).
 *
 * Es lo que el motor manda desde que el Generar dejó de consultar todos los
 * postes: el número de poste de Avanza y la línea, como DATO. El poste 1203 es
 * el de verdad —Bernardo Ramazzini / Maz—, el mismo del caso del ojo.
 */
const VIAJE_EN_BUS_CON_BOTON: Trayecto = {
  ...VIAJE_EN_BUS_SIN_LA_29,
  avisos: [],
  pasos: VIAJE_EN_BUS_SIN_LA_29.pasos.map((x) =>
    x.giro === 'sube' ? { ...x, aQuienPreguntar: { poste: 1203, linea: '29' } } : x,
  ),
};

/**
 * ⭐ Y EL TRANVÍA, que **no lleva a quién preguntar**.
 *
 * Su `stop_code` es `1312` y no un `PAnnnnn`: Avanza no cubre esos postes. El
 * motor no manda `aQuienPreguntar`, y sin eso no puede haber botón — uno que
 * al pulsarlo solo pudiera decir «no lo sé» promete un dato que no existe.
 */
const VIAJE_EN_TRANVIA: Trayecto = {
  ...VIAJE_EN_BUS_SIN_LA_29,
  avisos: [],
  pasos: VIAJE_EN_BUS_SIN_LA_29.pasos.map((x) =>
    x.giro === 'sube'
      ? paso(
          'sube',
          0,
          accion('Sube'),
          llano(' a la línea '),
          via('L1'),
          llano(' en el poste '),
          via('1312 · Plaza España'),
        )
      : x,
  ),
};

/** Lo que contesta `GET /api/poste-vivo` cuando la línea sí está. */
const LLEGA: PosteVivo = { clase: 'llega', texto: 'próximo en 4 min (dato de las 15:45)' };

/**
 * ⭐ EL VIAJE EN BiZi CON SUS DOS BOTONES (2/09).
 *
 * Los números son los de la estación de verdad: **Tauromaquia es la 42** al
 * coger y **Mrio. Siresa: Dr. Iranzo la 87** al dejar. Y cada hito pide **lo
 * suyo**: bicis donde se coge, anclajes donde se deja. Que sean dos preguntas
 * distintas es el filtro de [DOC OTP] llevado al botón — una estación llena no
 * sirve para devolver y una vacía no sirve para coger.
 */
const VIAJE_EN_BIZI_CON_BOTONES: Trayecto = {
  ...VIAJE_EN_BIZI,
  pasos: VIAJE_EN_BIZI.pasos.map((p) =>
    p.giro === 'coge'
      ? { ...p, aQueEstacion: { estacion: 42, pide: 'bicis' as const } }
      : p.giro === 'aparca'
        ? { ...p, aQueEstacion: { estacion: 87, pide: 'anclajes' as const } }
        : p,
  ),
};

/** Lo que contesta `GET /api/estacion-viva` con dato. */
const HAY_BICIS: EstacionViva = { clase: 'hay', texto: '8 bicis disponibles a las 11:56' };

/**
 * ⭐ EL VIAJE EN BUS CON EL MINUTO VIVO DEL GENERAR (2/09).
 *
 * Es la forma que el motor manda desde hoy: **la frase dice la frecuencia** y
 * el minuto viaja aparte, en `vivo`, que es lo que llena la región. Antes el
 * minuto estaba en los dos sitios, y solo uno de ellos se podía refrescar.
 */
const VIAJE_EN_BUS_CON_MINUTO_VIVO: Trayecto = {
  ...VIAJE_EN_BUS_CON_BOTON,
  pasos: VIAJE_EN_BUS_CON_BOTON.pasos.map((x) =>
    x.giro === 'sube' ? { ...x, vivo: LLEGA } : x,
  ),
};

/**
 * ⭐ UN VIAJE EN BUS CON DESVÍO, con el texto que el motor escribe (31/08).
 *
 * La 29 va hoy desviada de verdad —medido contra `get_stops_list`—: no para en
 * tres postes del Coso y para provisionalmente en otros dos. El aviso lo compone
 * el motor entero; la pantalla no recompone nada.
 */
const VIAJE_EN_BUS_DESVIADO: Trayecto = {
  ...VIAJE_EN_BUS_SIN_LA_29,
  avisos: [
    {
      texto:
        'La línea 29 va hoy desviada: no para en Don Jaime I / Plaza De La Seo, Coso N.º 80, ' +
        'Plaza San Miguel: para provisionalmente en P. Echegaray Y Caballero N.º 112, ' +
        'Asalto / Centro De Historias.',
    },
  ],
};

/**
 * ⭐ DOS VEHÍCULOS Y LOS DOS DESVIADOS, con la trampa dentro (31/08).
 *
 * Es el caso del ojo tal como salió hoy: **29 + 22**, y las dos líneas van
 * desviadas. ⚠️ Y la trampa es real, no inventada: **el aviso de la 29 nombra
 * «Asalto / Centro De Historias» como parada provisional, y ese poste es justo
 * donde se sube a la 22**. Si la regla del sitio se mira antes que la de la
 * línea, el hito de la 22 se queda con el aviso de la 29.
 */
const VIAJE_EN_BUS_DOS_DESVIADAS: Trayecto = {
  modo: 'bus',
  pasos: [
    paso('salida', 30, accion('Sal de'), llano(' '), via('Calle El Coloso 2')),
    paso('sube', 0, accion('Sube'), llano(' a la línea '), via('29'), llano(' en el poste '), via('Av. Academia General Militar N.º 37'), llano(' — frecuencia teórica: cada 8 min')),
    paso('baja', 0, accion('Baja'), llano(' en el poste '), via('Asalto / Centro De Historias')),
    paso('sube', 0, accion('Sube'), llano(' a la línea '), via('22'), llano(' en el poste '), via('Asalto / Centro De Historias'), llano(' — ~7 min de espera')),
    paso('baja', 0, accion('Baja'), llano(' en el poste '), via('Av. Compromiso De Caspe N.º 48')),
    paso('llegada', 0, via('Calle Leopoldo Romeo 27'), llano(' está a la izquierda')),
  ],
  geometria: [
    [41.6661, -0.8773],
    [41.6826, -0.8712],
    [41.6557, -0.875],
    [41.6476, -0.8641],
    [41.6461, -0.8673],
  ],
  avisos: [
    {
      texto:
        'La línea 22 va hoy desviada: no para en Plaza Aragón N.º 1, Plaza De España: ' +
        'para provisionalmente en P. De La Constitución / Patio De La Infanta, ' +
        'P. De La Mina / Centro De Mayores.',
    },
    {
      texto:
        'La línea 29 va hoy desviada: no para en Don Jaime I / Plaza De La Seo, Coso N.º 80, ' +
        'Plaza San Miguel: para provisionalmente en P. Echegaray Y Caballero N.º 112, ' +
        'Asalto / Centro De Historias.',
    },
  ],
  metros: 6130,
  segundos: 2532,
  tramos: [
    { comoSeVa: 'andando', desde: 0, hasta: 1, metros: 60, segundos: 43, hito: 'sube' },
    { comoSeVa: 'montado', desde: 1, hasta: 2, metros: 4851, segundos: 1800, hito: 'baja', linea: LINEA_29_APP },
    { comoSeVa: 'andando', desde: 2, hasta: 2, metros: 0, segundos: 120, hito: 'sube' },
    { comoSeVa: 'montado', desde: 2, hasta: 3, metros: 931, segundos: 500, hito: 'baja', linea: LINEA_22_APP },
    { comoSeVa: 'andando', desde: 3, hasta: 4, metros: 288, segundos: 69, hito: null },
  ],
};

/**
 * ⭐ EL CASO DE LA CAPTURA: transbordo en el mismo poste y una línea NO desviada
 * subiendo en un poste que otra desviada nombra (31/08).
 *
 * `COLOSO 2 → OVIEDO 5` sale en **35 + 31**. La **35 va desviada** y la **31
 * no**; y el aviso de la 35 nombra `Av. Francisco De Goya N.º 83` entre sus
 * paradas provisionales — que es **justo donde se sube a la 31**.
 *
 * ⚠️ Es la trampa que reabrió la entrada del 31/08: con la regla del sitio
 * abierta a los desvíos, la subida a la 31 se quedaba con el aviso de la 35.
 */
const LINEA_31_APP = {
  id: '31',
  corto: '31',
  largo: 'Parque Goya - Rosales del Canal',
  color: '95C11F',
  colorTexto: '000000',
  modo: 'bus' as const,
};

const VIAJE_CON_TRANSBORDO_Y_DESVIO: Trayecto = {
  modo: 'bus',
  pasos: [
    paso('salida', 30, accion('Sal de'), llano(' '), via('Calle El Coloso 2')),
    paso('sube', 0, accion('Sube'), llano(' a la línea '), via('35'), llano(' en el poste '), via('Av. Academia General Militar N.º 37'), llano(' — 12 paradas — frecuencia teórica: cada 10 min')),
    paso('transborda', 0, llano('En el poste '), via('Av. Francisco De Goya N.º 83'), accion(', transborda'), llano(' de la línea '), via('35'), llano(' a la línea '), via('31'), llano(' — 16 paradas — frecuencia teórica de la 31: cada 14 min')),
    paso('baja', 0, accion('Baja'), llano(' en el poste '), via('Villa De Ansó / Avenida De América')),
    paso('llegada', 0, via('Calle Oviedo 5'), llano(' está a la izquierda')),
  ],
  geometria: [
    [41.6817, -0.8715],
    [41.6553, -0.8862],
    [41.6357, -0.8878],
    [41.6266, -0.8863],
  ],
  avisos: [
    {
      texto:
        'La línea 35 va hoy desviada: no para en Av. De Valencia N.º 8, Av. De Valencia N.º 38: ' +
        'para provisionalmente en Av. Francisco De Goya N.º 83, Av. Francisco De Goya N.º 59.',
    },
  ],
  metros: 8267,
  segundos: 3613,
  tramos: [
    { comoSeVa: 'andando', desde: 0, hasta: 1, metros: 60, segundos: 43, hito: 'sube' },
    { comoSeVa: 'montado', desde: 1, hasta: 2, metros: 5320, segundos: 2400, hito: 'sube', linea: LINEA_35_APP },
    { comoSeVa: 'montado', desde: 2, hasta: 3, metros: 2680, segundos: 1021, hito: 'baja', linea: LINEA_31_APP },
    { comoSeVa: 'andando', desde: 3, hasta: 3, metros: 207, segundos: 149, hito: null },
  ],
};

/**
 * ⭐ Y una ruta de BICI con su aviso: el destino sin aparcabicis cerca.
 *
 * El otro caso de la misma clase — desde las casillas 5 y 6, un trayecto puede
 * traer **ruta Y aviso a la vez**, y hasta entonces no podía.
 */
const SIN_APARCABICIS_CERCA: Trayecto = {
  ...POR_LA_AVENIDA_DE_MADRID,
  avisos: [
    {
      texto:
        'El aparcabicis más cercano a CALLE SAN MARCOS [TORRECILLA DE VALMADRID] 2 está a ' +
        '11.641 m, más de los 500 que tiene sentido andar: la ruta llega hasta la puerta.',
    },
  ],
};

/** Rellena los cuatro campos por el camino de una persona, y deja listo el botón. */
/**
 * ⭐ EL VIAJE EN COCHE QUE REMATA EN UN APARCAMIENTO PÚBLICO (casilla 2-bis).
 *
 * Los textos y las cifras son **los del motor vivo**, leídos por HTTP el 3/09
 * (`pid` del log = `pid` que contesta): `PEDRO LAPUYADE 3 → CALLE ABEN AIRE 33`
 * con `puedeEntrarEnLaZbe: false` da 4.834 m en dos tramos, rodando 4.538 y
 * andando 296.
 *
 * ⚠️ **El aviso lleva `paso: 2`, y el 2 NO ES UN HITO.** Es lo que esta casilla
 *    compra: hasta hoy la nota solo podía colgarse de un hito, porque el reparto
 *    se hacía leyendo el texto y solo los hitos nombran sitios. El motor sabe
 *    por qué paso se entra en la zona desde la casilla 1b y lo dice en
 *    `Aviso.paso`; la pantalla ya no lo adivina.
 */
const VIAJE_EN_COCHE_CON_REMATE: Trayecto = {
  modo: 'coche',
  pasos: [
    paso('salida', 240, accion('Sal de'), llano(' '), via('Calle Pedro Lapuyade 3'), llano(' y dirígete hacia el noroeste')),
    paso('derecha', 780, accion('Gira a la derecha'), llano(' hacia '), via('Avenida de Goya')),
    paso('recto', 3518, accion('Continúa'), llano(' por '), via('Paseo de la Independencia')),
    paso('aparca', 0, accion('Aparca'), llano(' en el aparcamiento público '), via('Plaza del Pilar - Juzgados'), llano(' — la ZBE permite el acceso a aparcamientos públicos conectados, con registro municipal')),
    paso('salida', 296, accion('Sal andando'), llano(' hacia el este por '), via('Calle Don Jaime I')),
    paso('llegada', 0, via('Calle Aben Aire 33'), llano(' está a la derecha')),
  ],
  geometria: [
    [41.6404, -0.8965],
    // El vértice donde muere lo que se conduce: ahí está el aparcamiento.
    [41.6572, -0.8811],
    [41.6576, -0.8831],
  ],
  avisos: [
    {
      texto:
        'Tu destino queda dentro de la Zona de Bajas Emisiones. Sin distintivo solo se puede ' +
        'entrar con autorización (residentes, plaza de garaje, PMR, o acceso a aparcamiento ' +
        'público conectado — con registro municipal). Esta ruta remata en el aparcamiento ' +
        'público Plaza del Pilar - Juzgados.',
      paso: 2,
    },
  ],
  metros: 4834,
  segundos: 644,
  tramos: [
    { comoSeVa: 'rodando', desde: 0, hasta: 1, metros: 4538, segundos: 431, hito: 'aparca' },
    { comoSeVa: 'andando', desde: 1, hasta: 2, metros: 296, segundos: 213, hito: null },
  ],
};

/**
 * ⭐ LOS DOS VIAJES DE BORDILLO, azul y naranja (4/09).
 *
 * Los textos y las cifras son **los del motor vivo**, leídos por HTTP el 4/09
 * (`pid` del log 22032 = `pid` que contesta): el mismo par de siempre, `PEDRO
 * LAPUYADE 3 → CALLE ABEN AIRE 33`, con `aparcamiento: 'azul'` da **3.381 m /
 * 578 s** y remata en `Calle San Blas`, y con `'naranja'` da **3.388 / 478** y
 * remata en `Calle Mosen Pedro Dosset`. Los tres tramos y sus cifras son los que
 * el motor manda; la geometría se reduce a sus esquinas, como en el viaje del
 * aparcamiento público de aquí arriba — la pantalla no mide vértices.
 *
 * ⚠️ **Los dos rematan en sitios DISTINTOS y con frases distintas**, y eso es lo
 *    que la sugerencia cruzada tiene que enseñar: pulsar el botón no repinta lo
 *    mismo con otro nombre, trae otro viaje.
 */
const VIAJE_APARCANDO_EN_AZUL: Trayecto = {
  modo: 'coche',
  pasos: [
    paso('salida', 240, accion('Sal de'), llano(' '), via('Calle Pedro Lapuyade 3'), llano(' y dirígete hacia el noroeste')),
    paso('recto', 2821, accion('Continúa'), llano(' por '), via('Paseo de la Independencia')),
    paso('aparca', 0, accion('Aparca'), llano(' en '), via('Calle San Blas'), llano(': zona azul (rotación)')),
    paso('salida', 320, accion('Sal andando'), llano(' hacia el este por '), via('Calle Don Jaime I')),
    paso('llegada', 0, via('Calle Aben Aire 33'), llano(' está a la derecha')),
  ],
  geometria: [
    [41.6404, -0.8965],
    [41.6549, -0.8829],
    [41.6572, -0.8811],
    [41.6576, -0.8831],
  ],
  avisos: [],
  metros: 3381,
  segundos: 578,
  tramos: [
    { comoSeVa: 'rodando', desde: 0, hasta: 1, metros: 2782, segundos: 304, hito: null, zbe: false },
    { comoSeVa: 'rodando', desde: 1, hasta: 2, metros: 279, segundos: 44, hito: 'aparca', zbe: true },
    { comoSeVa: 'andando', desde: 2, hasta: 3, metros: 320, segundos: 230, hito: null },
  ],
};

const VIAJE_APARCANDO_EN_NARANJA: Trayecto = {
  modo: 'coche',
  pasos: [
    paso('salida', 240, accion('Sal de'), llano(' '), via('Calle Pedro Lapuyade 3'), llano(' y dirígete hacia el noroeste')),
    paso('recto', 3008, accion('Continúa'), llano(' por '), via('Paseo de la Independencia')),
    paso('aparca', 0, accion('Aparca'), llano(' en '), via('Calle Mosen Pedro Dosset'), llano(': zona naranja (residentes)')),
    paso('salida', 140, accion('Sal andando'), llano(' hacia el este por '), via('Calle Don Jaime I')),
    paso('llegada', 0, via('Calle Aben Aire 33'), llano(' está a la derecha')),
  ],
  geometria: [
    [41.6404, -0.8965],
    [41.6549, -0.8829],
    [41.6581, -0.8797],
    [41.6576, -0.8831],
  ],
  avisos: [],
  metros: 3388,
  segundos: 478,
  tramos: [
    { comoSeVa: 'rodando', desde: 0, hasta: 1, metros: 2782, segundos: 304, hito: null, zbe: false },
    { comoSeVa: 'rodando', desde: 1, hasta: 2, metros: 466, segundos: 73, hito: 'aparca', zbe: true },
    { comoSeVa: 'andando', desde: 2, hasta: 3, metros: 140, segundos: 101, hito: null },
  ],
};

/** El mismo viaje pudiendo entrar: se entra, y el aviso es el de la norma. */
const VIAJE_EN_COCHE_POR_LA_ZBE: Trayecto = {
  modo: 'coche',
  pasos: [
    paso('salida', 240, accion('Sal de'), llano(' '), via('Calle Pedro Lapuyade 3'), llano(' y dirígete hacia el noroeste')),
    paso('recto', 3146, accion('Continúa'), llano(' por '), via('Paseo de la Independencia')),
    paso('llegada', 0, via('Calle Aben Aire 33'), llano(' está a la derecha')),
  ],
  geometria: [
    [41.6404, -0.8965],
    [41.6576, -0.8831],
  ],
  avisos: [
    {
      texto:
        'La ruta atraviesa la Zona de Bajas Emisiones: de lunes a viernes de 8:00 a 20:00 los ' +
        'vehículos sin distintivo necesitan autorización; B, C, ECO y CERO circulan libres',
      paso: 1,
    },
  ],
  metros: 3386,
  segundos: 423,
  tramos: [{ comoSeVa: 'rodando', desde: 0, hasta: 1, metros: 3386, segundos: 423, hito: null }],
};

/** Y uno que no la pisa: sin aviso ninguno. */
const VIAJE_EN_COCHE_LEJOS: Trayecto = {
  modo: 'coche',
  pasos: [
    paso('salida', 240, accion('Sal de'), llano(' '), via('Calle Pedro Lapuyade 3'), llano(' y dirígete hacia el oeste')),
    paso('llegada', 0, via('Camino de en Medio 120'), llano(' está a la izquierda')),
  ],
  geometria: [
    [41.6404, -0.8965],
    [41.6501, -0.9401],
  ],
  avisos: [],
  metros: 4241,
  segundos: 512,
  tramos: [{ comoSeVa: 'rodando', desde: 0, hasta: 1, metros: 4241, segundos: 512, hito: null }],
};

/**
 * ⭐ EL VIAJE EN MOTO DEL CASO DEL OJO, **medido por HTTP** (4/09, casilla 3).
 *
 * Ni una cifra ni una frase están escritas a mano: salen del motor vivo —`pid`
 * del log 17908 = `pid` que contesta— pidiéndole el par de siempre, `CALLE PEDRO
 * LAPUYADE 3 → CALLE ABEN AIRE 33` con `modo: 'moto'` y sin contestar nada más:
 * **3.513 m · 525 s · 17 pasos · 261 vértices**, tres tramos —2.782 rodando
 * fuera, 592 rodando dentro, 139 andando— y el remate en `MU2_motos.1876`.
 *
 * Lo que se abrevia y por qué, dicho para que nadie lo confunda con inventar:
 *
 * · **Los pasos son 6 de los 17**, y los seis van con sus `partes` VERBATIM —el
 *   de salida, el que lleva el aviso, el previo al hito, el hito, el de salir
 *   andando y el de llegada—. Los once giros intermedios no dicen nada que esta
 *   pantalla no pruebe ya con otros viajes.
 * · **`Aviso.paso` sigue apuntando al paso que le toca**: en el viaje entero es
 *   el 9 —«Gira a la derecha hacia Calle San Blas»—, y aquí ese mismo paso es
 *   el 1. Se mueve el índice porque se mueve el paso, no porque se elija otro.
 * · **La geometría se reduce a sus cuatro costuras** —el arranque, el vértice
 *   206 donde se entra en la zona, el 240 donde está el aparcamoto y el 260 del
 *   final—, que es el mismo trato que reciben los dos viajes de bordillo. La
 *   pantalla no mide vértices; lo que mira es **de dónde a dónde va cada tramo**
 *   y de qué color sale.
 *
 * ⚠️ El `zbe: true` del segundo tramo no es adorno: es lo que hace que la traza
 *    salga roja, y es exactamente lo que la juez 6 compra. **El dato ya venía**
 *    —la moto hereda la ZBE entera del coche—, así que aquí no hay nada nuevo
 *    que el motor tenga que aprender: solo que la pantalla lo deje pasar.
 */
const VIAJE_EN_MOTO: Trayecto = {
  modo: 'moto',
  pasos: [
    paso('salida', 50, accion('Sal de'), llano(' '), via('Calle Pedro Lapuyade 3'), llano(' y dirígete hacia el noroeste'), llano(' por '), via('Calle de Pedro Lapuyade')),
    paso('derecha', 380, accion('Gira a la derecha'), llano(' hacia '), via('Calle San Blas')),
    paso('izquierda', 64, accion('Gira a la izquierda'), llano(' hacia '), via('Calle de Predicadores')),
    paso('aparca', 0, accion('Aparca'), llano(' en el aparcamiento de motos de '), via('Predicadores 28'), llano(' (sin coste)')),
    paso('salida', 64, accion('Sal andando'), llano(' hacia el este'), llano(' por '), via('Calle de Predicadores')),
    paso('llegada', 0, via('Calle Aben Aire 33'), llano(' está a la derecha')),
  ],
  geometria: [
    [41.636197, -0.884024],
    [41.6568254, -0.8888968],
    [41.65739909, -0.88439588],
    [41.65758, -0.883141],
  ],
  avisos: [
    {
      texto:
        'La ruta atraviesa la Zona de Bajas Emisiones: de lunes a viernes de 8:00 a 20:00 los ' +
        'vehículos sin distintivo necesitan autorización; B, C, ECO y CERO circulan libres',
      paso: 1,
    },
  ],
  metros: 3513,
  segundos: 525,
  tramos: [
    { comoSeVa: 'rodando', desde: 0, hasta: 1, metros: 2782, segundos: 304, hito: null, zbe: false },
    { comoSeVa: 'rodando', desde: 1, hasta: 2, metros: 592, segundos: 120, hito: 'aparca', zbe: true },
    { comoSeVa: 'andando', desde: 2, hasta: 3, metros: 139, segundos: 101, hito: null },
  ],
};

/**
 * ⭐ EL VIAJE EN YeGo, **medido por HTTP contra el motor y YeGo vivos** (5/09).
 *
 * `pid` del log 11856 = `pid` que contesta. El par de siempre, `CALLE PEDRO
 * LAPUYADE 3 → CALLE ABEN AIRE 33` con `modo: 'yego'`: **3.895 m · 863 s · 19
 * pasos · 305 vértices**, cinco tramos —uno andando y cuatro rodando, porque la
 * Zona de Bajas Emisiones parte lo conducido— y la moto que ganó tenía **45 km
 * de autonomía**. El feed decía **135 libres**.
 *
 * Se abrevia igual que el de la moto privada y con las mismas reglas: los pasos
 * que quedan van con sus `partes` VERBATIM, `Aviso.paso` sigue apuntando al paso
 * que le toca, y la geometría se reduce a sus costuras. Lo que la pantalla mira
 * es de dónde a dónde va cada tramo y de qué color sale.
 *
 * ⛔ Y el `bike_id` **no aparece**, porque el motor no lo manda: es el único
 *    campo que el operador rota por privacidad, y a quien busca una ruta no le
 *    dice nada. Lo que se enseña es la autonomía.
 */
const VIAJE_EN_YEGO: Trayecto = {
  modo: 'yego',
  pasos: [
    paso('salida', 38, accion('Sal de'), llano(' '), via('Calle Pedro Lapuyade 3'), llano(' y dirígete hacia el noroeste'), llano(' por '), via('Calle de Pedro Lapuyade')),
    paso('derecha', 48, accion('Gira a la derecha'), llano(' hacia '), via('Paseo Cuéllar')),
    paso('coge', 0, accion('Coge'), llano(' la moto de YeGo '), via('(45 km de autonomía)')),
    paso('salida', 120, accion('Arranca'), llano(' hacia el noreste'), llano(' por '), via('Calle de Uncastillo')),
    paso('recto', 472, accion('Continúa'), llano(' por '), via('Paseo de la Independencia')),
    paso('aparca', 0, accion('Deja la moto'), llano(' en '), via('CALLE ABEN AIRE 33'), llano(', donde esté permitido aparcar')),
  ],
  geometria: [
    [41.636197, -0.884024],
    [41.639508, -0.88057],
    [41.6512, -0.8846],
    [41.6549, -0.8829],
    [41.6562, -0.8818],
    [41.65758, -0.883141],
  ],
  avisos: [
    { texto: 'Motos de YeGo: 135 libres, datos de hace menos de 1 min.' },
    {
      texto:
        'La ruta atraviesa la Zona de Bajas Emisiones: de lunes a viernes de 8:00 a 20:00 los ' +
        'vehículos sin distintivo necesitan autorización; B, C, ECO y CERO circulan libres',
      paso: 4,
    },
  ],
  metros: 3895,
  segundos: 863,
  tramos: [
    { comoSeVa: 'andando', desde: 0, hasta: 1, metros: 562, segundos: 405, hito: 'coge' },
    { comoSeVa: 'rodando', desde: 1, hasta: 2, metros: 2092, segundos: 267, hito: null, zbe: false },
    { comoSeVa: 'rodando', desde: 2, hasta: 3, metros: 472, segundos: 45, hito: null, zbe: true },
    { comoSeVa: 'rodando', desde: 3, hasta: 4, metros: 165, segundos: 27, hito: null, zbe: false },
    { comoSeVa: 'rodando', desde: 4, hasta: 5, metros: 604, segundos: 119, hito: 'aparca', zbe: true },
  ],
};

/**
 * La capa de la ZBE tal y como la sirve el WFS: dos fases, `[lon, lat]`. Aquí
 * va recortada a cuatro vértices por fase — lo que se compra es el reparto, no
 * la geometría, que ya tiene su juez en `mapa.spec.ts` contra el fichero real.
 */
const LA_FASE_1 = {
  type: 'FeatureCollection',
  features: [
    {
      properties: { fase: 'FASE 1' },
      geometry: {
        type: 'MultiPolygon',
        coordinates: [
          [
            [
              [-0.8893, 41.6587],
              [-0.8734, 41.6551],
              [-0.8771, 41.6509],
              [-0.8893, 41.6587],
            ],
          ],
        ],
      },
    },
    {
      properties: { fase: 'FASE 2' },
      geometry: { type: 'MultiPolygon', coordinates: [[[[-0.8923, 41.6592], [-0.8717, 41.6544], [-0.8700, 41.6490], [-0.8923, 41.6592]]]] },
    },
  ],
};

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

/**
 * El aviso ámbar **de la pantalla**: que el motor no contesta, o que un modo
 * todavía no se calcula.
 *
 * ⚠️ Desde el 2/09 esto ya NO trae los avisos del motor. Aquéllos viven en el
 *    resumen único de arriba y se leen con `resumenEnPantalla`. Son dos cosas
 *    distintas y por eso se leen aparte: uno lo escribe la pantalla porque no
 *    ha podido preguntar; los otros los escribe el motor sobre el viaje.
 */
function avisosDeRuta(raiz: HTMLElement): string[] {
  return Array.from(raiz.querySelectorAll<HTMLElement>('.aviso-ruta')).map(
    (a) => a.textContent?.trim() ?? '',
  );
}

/**
 * ⭐ LAS LÍNEAS DEL RESUMEN ÚNICO (2/09), en el orden en el que se leen.
 *
 * [GOV.UK · error summary] una caja arriba con una línea por aviso. Lo que cada
 * línea dice es el **hecho**; el detalle vive junto al hito, a un enlace.
 */
function resumenEnPantalla(raiz: HTMLElement): string[] {
  return Array.from(raiz.querySelectorAll<HTMLElement>('.resumen__linea')).map((l) =>
    (l.textContent ?? '').replace(/\s+/g, ' ').trim(),
  );
}

/** A qué paso lleva cada línea del resumen, por su `href`. `null` si no enlaza. */
function adondeLlevaElResumen(raiz: HTMLElement): (string | null)[] {
  return Array.from(raiz.querySelectorAll<HTMLElement>('.resumen__linea')).map(
    (l) => l.querySelector<HTMLAnchorElement>('a')?.getAttribute('href') ?? null,
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
    tramos: [
      { comoSeVa: 'rodando', desde: 0, hasta: 1, metros: 1554, segundos: 342, hito: null },
    ],
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
    tramos: [
      { comoSeVa: 'rodando', desde: 0, hasta: 1, metros: 1565, segundos: 344, hito: null },
    ],
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
    tramos: [
      { comoSeVa: 'rodando', desde: 0, hasta: 1, metros: 1710, segundos: 372, hito: null },
    ],
  },
};

describe('Buscador', () => {
  let http: HttpTestingController;

  /**
   * ⭐ SE TRAGA LA CAPA DE LA ZBE que elegir un vehículo de motor dispara.
   *
   * ⚠️ **No es cosmética de la prueba, y esto se midió.** Elegir «Coche» o
   *    «Moto» pide `MU1_ZBE` —2,9 kB, una sola vez por componente—. Una juez que
   *    no la conteste la deja en vuelo, y al desmontar el `TestBed` la petición
   *    se resuelve sola **con el cuerpo vacío**: `traerLaZona` hace entonces
   *    `capa.features.find` sobre un `undefined` y revienta **después** de que
   *    la juez haya terminado. El resultado es un «unhandled error» que no
   *    tumba a nadie, no dice de qué juez viene, y se acumula.
   *
   *    Medido el 4/09 con la suite entera: **16 de esos**, de las jueces del
   *    coche que entraban en la familia sin atender la capa. Con esto, **0**.
   *
   * ⚠️ Y es una `t`ragada, no un `expectOne`: hay jueces que entran en el coche
   *    dos veces y la capa **solo se pide una** —`traerLaZona` se guarda de
   *    repetirse—, así que exigir exactamente una petición se pondría rojo por
   *    el motivo equivocado. Cero peticiones casadas es una respuesta válida.
   */
  const tragarLaZona = (): void => {
    for (const p of http.match((r) => r.url.includes('MU1_ZBE'))) {
      p.flush(LA_FASE_1);
    }
  };

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
    //
    // ⚠️ **Y desde el 3/09, la capa de la ZBE.** Elegir «Coche» la pide una
    // vez —es el polígono que el mapa pinta—, y a las cuarenta jueces que
    // solo querían cambiar de modo eso no les importa. Que se pida **una
    // sola vez y solo con coche** lo vigila su propia juez, que no drena.
    for (const cap of http.match(
      (r) =>
        r.url.startsWith('/api/sitios') ||
        r.url.startsWith('/api/vias') ||
        r.url.includes('MU1_ZBE'),
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

  it('la primera fila es un grupo de radios nativo, no seis botones sueltos', async () => {
    const fixture = TestBed.createComponent(Buscador);
    await fixture.whenStable();
    const raiz = fixture.nativeElement as HTMLElement;

    // El envoltorio del patrón: `fieldset` + `legend`. Ya estaba, y se queda.
    const grupo = raiz.querySelector<HTMLFieldSetElement>('fieldset.modos.familias')!;
    expect(grupo).not.toBeNull();
    expect(grupo.querySelector('legend')?.textContent?.trim()).toBe('Cómo');

    // ⭐ Y lo que NO estaba: radios de verdad, con el mismo `name`. Ese nombre
    // compartido es TODO el mecanismo — es lo que hace que el navegador dé una
    // sola parada de tabulador al grupo, mueva con las flechas y desmarque el
    // anterior sin que nadie se lo pida.
    //
    // ⚠️ **SEIS desde el 4/09**, y el número tiene historia: eran seis hasta el
    //    2/09, bajaron a cinco porque [DOC sistemas de diseño · control
    //    segmentado] el rango del patrón es de 2 a 5 opciones con etiqueta, y
    //    vuelven a seis con la moto (punto 13, casilla 3). **Esta línea se puso
    //    roja sola al entrar la moto**, que es exactamente para lo que está: el
    //    día que alguien meta la séptima, se entera aquí antes que en la calle.
    const radios = radiosDeFamilia(raiz);
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
   * colectivo, luego las ruedas (cada una con su tabla de acceso), y los dos
   * vehículos de motor al final.
   *
   * ⚠️ **«Bici privada» y «BiZi» han dejado de estar aquí** (2/09): son la
   *    misma familia y bajan a la segunda fila. Lo que queda en su sitio es
   *    «Bici», entre el bus y el patín — el orden legal no se ha movido.
   *
   * ⭐ **Y «Moto» entra el 4/09, entre el patín y el coche** (punto 13, casilla
   *    3): es el primer vehículo de motor, y el coche sigue cerrando la fila.
   *    Esta juez se puso roja sola al entrar, con las seis contra las cinco.
   */
  it('la primera fila tiene las seis familias, con las etiquetas y el orden firmados', async () => {
    const fixture = TestBed.createComponent(Buscador);
    await fixture.whenStable();
    const raiz = fixture.nativeElement as HTMLElement;

    const etiquetas = Array.from(
      raiz.querySelectorAll<HTMLElement>('fieldset.modos.familias .modo'),
    ).map((m) => m.textContent?.trim() ?? '');
    expect(etiquetas).toEqual([
      'Andando',
      'Bus / Tranvía',
      'Bici',
      'Patín (VMP)',
      'Moto',
      'Coche',
    ]);
  });

  it('andando viene marcado al cargar, y es el único', async () => {
    const fixture = TestBed.createComponent(Buscador);
    await fixture.whenStable();
    const raiz = fixture.nativeElement as HTMLElement;

    expect(modosActivos(raiz)).toEqual(['Andando']);
    const marcados = radiosDeFamilia(raiz).filter((r) => r.checked);
    expect(marcados.length).toBe(1);
    expect(marcados[0].value).toBe('andando');
  });

  it('las familias son excluyentes: elegir una apaga la anterior', async () => {
    const fixture = TestBed.createComponent(Buscador);
    await fixture.whenStable();
    const raiz = fixture.nativeElement as HTMLElement;

    elegirModo(fixture, 'bici');
    await fixture.whenStable();

    expect(modosActivos(raiz)).toEqual(['Bici']);
    const marcados = radiosDeFamilia(raiz).filter((r) => r.checked);
    expect(marcados.length).toBe(1);
    expect(marcados[0].value).toBe('bici');
  });

  // ── LA BICI EN DOS FILAS (2/09, punto 11) ─────────────────────────────────
  //
  // El revelado condicional [DOC GOV.UK] es el mismo patrón del número de
  // portal y de «¿Qué ruta prefieres?», y lo que promete es fuerte: **lo que
  // no aplica NO ESTÁ**, no está apagado. Un grupo deshabilitado seguiría en
  // la página, ocuparía su hueco y se leería como «esto podrías tocarlo».

  it('⭐ la segunda fila NO existe con andando, bus, patín ni coche', async () => {
    const fixture = TestBed.createComponent(Buscador);
    await fixture.whenStable();
    const raiz = fixture.nativeElement as HTMLElement;

    for (const modo of ['andando', 'bus', 'patin', 'coche'] as const) {
      elegirModo(fixture, modo);
      // El coche pide la capa de la ZBE al entrar: se atiende. Ver `tragarLaZona`.
      tragarLaZona();
      await fixture.whenStable();
      expect(raiz.querySelector('fieldset.modos.bicis')).toBeNull();
      // Y no es que esté escondida: no hay ni un radio suyo en el documento.
      expect(radiosDeBici(raiz).length).toBe(0);
    }
  });

  it('⭐ elegir Bici revela la segunda fila, con Privada marcada por defecto', async () => {
    const fixture = TestBed.createComponent(Buscador);
    await fixture.whenStable();
    const raiz = fixture.nativeElement as HTMLElement;

    expect(raiz.querySelector('fieldset.modos.bicis')).toBeNull();

    // Se pulsa la familia y NADA MÁS: lo que se compra es el defecto.
    radiosDeFamilia(raiz).find((r) => r.value === 'bici')!.click();
    fixture.detectChanges();
    await fixture.whenStable();

    const fila = raiz.querySelector<HTMLFieldSetElement>('fieldset.modos.bicis')!;
    expect(fila).not.toBeNull();
    expect(fila.querySelector('legend')?.textContent?.trim()).toBe('¿Qué bici?');

    const etiquetas = Array.from(fila.querySelectorAll<HTMLElement>('.modo')).map(
      (m) => m.textContent?.trim() ?? '',
    );
    expect(etiquetas).toEqual(['Privada', 'Pública BiZi']);
    expect(bicisActivas(raiz)).toEqual(['Privada']);
  });

  /**
   * ⭐ El grupo de la segunda fila es SUYO, y esto es lo que más se puede
   * romper sin que se note: si compartiera `name` con la primera, el navegador
   * trataría las siete opciones como **un solo grupo**, marcar «Privada»
   * desmarcaría «Bici» y el reparto en dos preguntas se vendría abajo dejando
   * la pantalla con dos radios marcados y ninguno mandando lo que dice.
   */
  it('⭐ la segunda fila es su propio grupo de radios, con su propio `name`', async () => {
    const fixture = TestBed.createComponent(Buscador);
    await fixture.whenStable();
    const raiz = fixture.nativeElement as HTMLElement;

    elegirModo(fixture, 'bici');
    await fixture.whenStable();

    const suyos = radiosDeBici(raiz);
    expect(suyos.length).toBe(2);
    expect(new Set(suyos.map((r) => r.name)).size).toBe(1);
    expect(suyos[0].name).not.toBe(radiosDeFamilia(raiz)[0].name);

    // El teclado, igual que en la primera fila: ni un `tabindex` a mano, y
    // exactamente uno marcado.
    for (const r of suyos) {
      expect(r.hasAttribute('tabindex')).toBe(false);
    }
    expect(suyos.filter((r) => r.checked).length).toBe(1);

    // Y la primera fila SIGUE con su único marcado: son dos grupos, no uno.
    expect(radiosDeFamilia(raiz).filter((r) => r.checked).length).toBe(1);
    expect(radiosDeFamilia(raiz).find((r) => r.checked)?.value).toBe('bici');
  });

  /**
   * ⭐ Y los `value` de la segunda fila **son los del contrato**: `bici` y
   * `bizi`, los mismos que viajan en el cuerpo de `/api/ruta`. No hay tabla de
   * traducción en medio, y esta juez es la que impide que la haya.
   */
  it('⭐ los dos radios de la bici llevan los ids del contrato, no etiquetas', async () => {
    const fixture = TestBed.createComponent(Buscador);
    await fixture.whenStable();
    const raiz = fixture.nativeElement as HTMLElement;

    elegirModo(fixture, 'bici');
    await fixture.whenStable();

    expect(radiosDeBici(raiz).map((r) => r.value)).toEqual(['bici', 'bizi']);
  });

  /**
   * ⭐ Pulsar «Pública BiZi» cambia el modo **sin tocar la familia**, y volver
   * a «Privada» lo devuelve. Es el ir y venir dentro de la familia, que es lo
   * único que la segunda fila existe para hacer.
   */
  it('⭐ dentro de la bici se va y se vuelve, y la familia no se mueve', async () => {
    const fixture = TestBed.createComponent(Buscador);
    await fixture.whenStable();
    const raiz = fixture.nativeElement as HTMLElement;

    elegirModo(fixture, 'bici');
    await fixture.whenStable();

    radiosDeBici(raiz).find((r) => r.value === 'bizi')!.click();
    fixture.detectChanges();
    await fixture.whenStable();
    expect(bicisActivas(raiz)).toEqual(['Pública BiZi']);
    expect(modosActivos(raiz)).toEqual(['Bici']);

    radiosDeBici(raiz).find((r) => r.value === 'bici')!.click();
    fixture.detectChanges();
    await fixture.whenStable();
    expect(bicisActivas(raiz)).toEqual(['Privada']);
    expect(modosActivos(raiz)).toEqual(['Bici']);
  });

  /**
   * ⭐ SALIR DE LA BICI Y VOLVER ENTRA OTRA VEZ POR PRIVADA — **y no es un
   * olvido: es la consecuencia de que el estado sea UNO.**
   *
   * ⚠️ Esta juez nació al revés. Se escribió comprando que volver de Andando
   *    devolvía a «Pública BiZi» —que es lo que haría un control con memoria— y
   *    **se puso roja**: `expected [ 'Privada' ] to deeply equal [ 'Pública
   *    BiZi' ]`. El código tenía razón y la juez no.
   *
   *    Recordarlo exigiría una segunda señal —«la última bici elegida»— viva
   *    mientras el modo dice `andando`. Eso es justo lo que `familia` evita
   *    siendo un `computed`: dos verdades que hay que mantener de acuerdo, y
   *    una pantalla que el día que se desincronizaran enseñaría un botón
   *    marcado y mandaría otro modo. El encargo dice «Privada por defecto»; se
   *    aplica CADA VEZ que se entra, que es lo único que no puede mentir.
   *
   * Lo que sí se conserva es la elección **mientras se está dentro**, y eso lo
   * da el radio nativo: un radio ya marcado no dispara `change`, así que volver
   * a pulsar «Bici» estando en BiZi no mueve nada. Se compra abajo.
   */
  it('⭐ salir de la bici y volver entra otra vez por Privada', async () => {
    const fixture = TestBed.createComponent(Buscador);
    await fixture.whenStable();
    const raiz = fixture.nativeElement as HTMLElement;

    elegirModo(fixture, 'bizi');
    await fixture.whenStable();
    expect(bicisActivas(raiz)).toEqual(['Pública BiZi']);

    elegirModo(fixture, 'andando');
    await fixture.whenStable();
    expect(radiosDeBici(raiz).length).toBe(0);

    radiosDeFamilia(raiz).find((r) => r.value === 'bici')!.click();
    fixture.detectChanges();
    await fixture.whenStable();
    expect(bicisActivas(raiz)).toEqual(['Privada']);
  });

  /**
   * ⭐ Y estando DENTRO, repulsar «Bici» no te devuelve a Privada.
   *
   * Es la otra mitad de la de arriba, y la que hace que la de arriba no sea un
   * defecto: lo que se pierde al salir de la familia no se pierde por tocar el
   * botón padre. Lo da el radio nativo, no una línea de la casa — por eso se
   * compra: el día que alguien cambie los radios por `<button>`, esto se pone
   * rojo y dice que se ha perdido una conducta que nadie había escrito.
   */
  it('⭐ repulsar «Bici» estando en Pública BiZi no la devuelve a Privada', async () => {
    const fixture = TestBed.createComponent(Buscador);
    await fixture.whenStable();
    const raiz = fixture.nativeElement as HTMLElement;

    elegirModo(fixture, 'bizi');
    await fixture.whenStable();
    expect(bicisActivas(raiz)).toEqual(['Pública BiZi']);

    radiosDeFamilia(raiz).find((r) => r.value === 'bici')!.click();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(bicisActivas(raiz)).toEqual(['Pública BiZi']);
    expect(modosActivos(raiz)).toEqual(['Bici']);
  });

  /**
   * ⭐ LAS TRES RUTAS SIGUEN, y con las DOS bicis.
   *
   * Es la juez de que la fila nueva no se ha comido a la de siempre: quien
   * elige bici —privada o pública— sigue pudiendo pedir rápida, equilibrada o
   * tranquila, y quien no, sigue sin verlas.
   */
  it('⭐ las tres rutas siguen apareciendo con Privada y con Pública BiZi', async () => {
    const fixture = TestBed.createComponent(Buscador);
    await fixture.whenStable();
    const raiz = fixture.nativeElement as HTMLElement;

    const rutas = () =>
      Array.from(raiz.querySelectorAll<HTMLElement>('fieldset.modos.rutas .modo')).map(
        (m) => m.textContent?.trim() ?? '',
      );

    expect(rutas()).toEqual([]);

    elegirModo(fixture, 'bici');
    await fixture.whenStable();
    expect(rutas()).toEqual(['Rápida', 'Equilibrada', 'Tranquila']);

    elegirModo(fixture, 'bizi');
    await fixture.whenStable();
    expect(rutas()).toEqual(['Rápida', 'Equilibrada', 'Tranquila']);

    elegirModo(fixture, 'patin');
    await fixture.whenStable();
    expect(rutas()).toEqual([]);
  });

  // ══ LOS BOTONES DE LA BiZi (2/09, punto 11 casilla 2) ═══════════════════
  //
  // El patrón «Próximo bus» calcado, y la anatomía se compra una sola vez
  // porque es **un solo bloque de plantilla**: lo que aquí se juzga es lo que
  // cambia entre las dos fuentes — la etiqueta y a quién se le pregunta.

  it('⭐ el hito de COGER lleva «Bicis ahora» y el de DEJAR «Anclajes ahora»', async () => {
    const fixture = TestBed.createComponent(Buscador);
    await fixture.whenStable();
    const raiz = fixture.nativeElement as HTMLElement;
    await direccionEntera(fixture, http);

    elegirModo(fixture, 'bizi');
    botonGenerar(raiz).click();
    fixture.detectChanges();
    drenarRutas(http.match('/api/ruta'), () => VIAJE_EN_BIZI_CON_BOTONES);
    await fixture.whenStable();

    const botones = Array.from(raiz.querySelectorAll<HTMLElement>('.vivo__boton'));
    expect(botones.map((b) => b.textContent?.trim())).toEqual(['Bicis ahora', 'Anclajes ahora']);

    // Y cada uno está en SU paso: el de bicis donde se coge, el de anclajes
    // donde se deja. Cruzarlos preguntaría anclajes para saber si hay bici.
    const conBoton = Array.from(raiz.querySelectorAll('.paso'))
      .filter((li) => li.querySelector('.vivo__boton') !== null)
      .map((li) => (li.querySelector('.paso__texto')?.textContent ?? '').replace(/\s+/g, ' ').trim());
    expect(conBoton[0]).toContain('Coge una bici');
    expect(conBoton[1]).toContain('Deja la bici');
  });

  /**
   * ⭐ Y CADA BOTÓN PIDE LO SUYO, con el número de SU estación.
   *
   * Es la juez que impide el fallo silencioso: dos botones que preguntaran a la
   * misma estación, o los dos por bicis, darían dos números creíbles y uno
   * estaría contestando otra pregunta.
   */
  it('⭐ cada botón pide su estación y su cosa a /api/estacion-viva', async () => {
    const fixture = TestBed.createComponent(Buscador);
    await fixture.whenStable();
    const raiz = fixture.nativeElement as HTMLElement;
    await direccionEntera(fixture, http);

    elegirModo(fixture, 'bizi');
    botonGenerar(raiz).click();
    fixture.detectChanges();
    drenarRutas(http.match('/api/ruta'), () => VIAJE_EN_BIZI_CON_BOTONES);
    await fixture.whenStable();

    const botones = Array.from(raiz.querySelectorAll<HTMLElement>('.vivo__boton'));

    botones[0]!.click();
    fixture.detectChanges();
    const deBicis = http.expectOne((r) => r.url === '/api/estacion-viva');
    expect(deBicis.request.params.get('estacion')).toBe('42');
    expect(deBicis.request.params.get('pide')).toBe('bicis');
    deBicis.flush(HAY_BICIS);
    await fixture.whenStable();

    botones[1]!.click();
    fixture.detectChanges();
    const deAnclajes = http.expectOne((r) => r.url === '/api/estacion-viva');
    expect(deAnclajes.request.params.get('estacion')).toBe('87');
    expect(deAnclajes.request.params.get('pide')).toBe('anclajes');
    deAnclajes.flush({ clase: 'hay', texto: '12 anclajes libres a las 11:56' });
    await fixture.whenStable();

    // Y cada respuesta cae en SU región, no las dos en la primera.
    const regiones = Array.from(raiz.querySelectorAll<HTMLElement>('.vivo__estado')).map((r) =>
      (r.textContent ?? '').trim(),
    );
    expect(regiones).toEqual(['8 bicis disponibles a las 11:56', '12 anclajes libres a las 11:56']);
  });

  /**
   * ⭐ DOS PULSACIONES SON DOS CONSULTAS — la regla del BiZi, en la pantalla.
   *
   * Frescura por petición y nunca caché: un «8 bicis» de hace cuarenta segundos
   * es peor que no tenerlo, porque parece de ahora. Y lo que se compra aquí es
   * lo que se ve: **el número cambia**.
   */
  it('⭐ dos pulsaciones son DOS consultas, y la región se queda con la última', async () => {
    const fixture = TestBed.createComponent(Buscador);
    await fixture.whenStable();
    const raiz = fixture.nativeElement as HTMLElement;
    await direccionEntera(fixture, http);

    elegirModo(fixture, 'bizi');
    botonGenerar(raiz).click();
    fixture.detectChanges();
    drenarRutas(http.match('/api/ruta'), () => VIAJE_EN_BIZI_CON_BOTONES);
    await fixture.whenStable();

    const boton = raiz.querySelector<HTMLElement>('.vivo__boton')!;

    boton.click();
    fixture.detectChanges();
    http.expectOne((r) => r.url === '/api/estacion-viva').flush(HAY_BICIS);
    await fixture.whenStable();
    expect(raiz.querySelector('.vivo__estado')?.textContent?.trim()).toBe(
      '8 bicis disponibles a las 11:56',
    );

    boton.click();
    fixture.detectChanges();
    http
      .expectOne((r) => r.url === '/api/estacion-viva')
      .flush({ clase: 'hay', texto: '5 bicis disponibles a las 11:59' });
    await fixture.whenStable();
    expect(raiz.querySelector('.vivo__estado')?.textContent?.trim()).toBe(
      '5 bicis disponibles a las 11:59',
    );
  });

  // ══ EL RESUMEN ÚNICO (2/09, punto 11 casilla 3) ═════════════════════════

  /**
   * ⭐ UNA CAJA CON N LÍNEAS, Y CADA UNA ENLAZA A SU PASO.
   *
   * [GOV.UK · error summary] el patrón entero en una juez: **una** caja, tantas
   * líneas como avisos, y cada línea con su enlace al sitio donde vive el
   * detalle. Con dos líneas desviadas, dos enlaces **distintos**.
   */
  it('⭐ los avisos salen en UNA caja, con una línea por aviso que enlaza a su paso', async () => {
    const fixture = TestBed.createComponent(Buscador);
    await fixture.whenStable();
    const raiz = fixture.nativeElement as HTMLElement;
    await direccionEntera(fixture, http);

    elegirModo(fixture, 'bus');
    botonGenerar(raiz).click();
    fixture.detectChanges();
    drenarRutas(http.match('/api/ruta'), () => VIAJE_EN_BUS_DOS_DESVIADAS);
    await fixture.whenStable();

    // UNA caja, no dos.
    expect(raiz.querySelectorAll('.resumen').length).toBe(1);
    expect(raiz.querySelector('.resumen__titulo')?.textContent?.trim()).toBe(
      'Avisos de este viaje:',
    );

    // DOS líneas, una por aviso, y con el hecho de cada una.
    const lineas = resumenEnPantalla(raiz);
    expect(lineas.length).toBe(2);
    expect(lineas[0]).toMatch(/^La línea 22 va hoy desviada/);
    expect(lineas[1]).toMatch(/^La línea 29 va hoy desviada/);

    // Y DOS enlaces distintos, cada uno al paso que lleva su nota.
    const adonde = adondeLlevaElResumen(raiz);
    expect(adonde.length).toBe(2);
    expect(adonde[0]).not.toBe(adonde[1]);
    for (const href of adonde) {
      expect(href).toMatch(/^#paso-\d+$/);
      const destino = raiz.querySelector(`#${href!.slice(1)}`);
      expect(destino).not.toBeNull();
      // ⭐ El destino EXISTE y es enfocable por programa [GOV.UK]: sin esto la
      //    página baja pero el foco se queda arriba.
      expect(destino!.getAttribute('tabindex')).toBe('-1');
      expect(destino!.querySelector('.paso__nota')).not.toBeNull();
    }
  });

  // ══ EL MINUTO, UNA SOLA VEZ (2/09, punto 11 casilla 4) ══════════════════

  /**
   * ⭐ EL MINUTO VIVO SE DICE **UNA** VEZ, y en la región.
   *
   * Hasta hoy se decía dos: la frase del paso lo llevaba dentro y la región lo
   * repetía tres palabras más a la derecha. Y la mitad de arriba **no se podía
   * refrescar**: al pulsar, la región decía «próximo en 2 min» y el paso seguía
   * diciendo «próximo en 5», con la misma pinta de nuevo.
   */
  it('⭐ el minuto vivo está en la región y NO en la frase del paso', async () => {
    const fixture = TestBed.createComponent(Buscador);
    await fixture.whenStable();
    const raiz = fixture.nativeElement as HTMLElement;
    await direccionEntera(fixture, http);

    elegirModo(fixture, 'bus');
    botonGenerar(raiz).click();
    fixture.detectChanges();
    drenarRutas(http.match('/api/ruta'), () => VIAJE_EN_BUS_CON_MINUTO_VIVO);
    await fixture.whenStable();

    const conBoton = Array.from(raiz.querySelectorAll('.paso')).find(
      (li) => li.querySelector('.vivo__boton') !== null,
    )!;
    const frase = (conBoton.querySelector('.paso__texto')?.textContent ?? '').trim();
    const region = (conBoton.querySelector('.vivo__estado')?.textContent ?? '').trim();

    expect(region).toBe('próximo en 4 min (dato de las 15:45)');
    expect(frase).not.toContain('próximo en');
    // ⚠️ Que la frase diga la FRECUENCIA en su lugar lo compra el motor
    //    (`viaje-bus.spec.ts`), que es quien la compone. Aquí lo que se juzga es
    //    la pantalla: que el minuto no esté dos veces.

    // Y en toda la pantalla, el minuto aparece UNA vez.
    const veces = ((raiz.textContent ?? '').match(/próximo en 4 min/g) ?? []).length;
    expect(veces).toBe(1);
  });

  /**
   * ⭐ Y AL REFRESCAR, CAMBIA DONDE ESTÁ — que es la razón de haberlo movido.
   */
  it('⭐ pulsar refresca el minuto en la región, y no deja otro viejo detrás', async () => {
    const fixture = TestBed.createComponent(Buscador);
    await fixture.whenStable();
    const raiz = fixture.nativeElement as HTMLElement;
    await direccionEntera(fixture, http);

    elegirModo(fixture, 'bus');
    botonGenerar(raiz).click();
    fixture.detectChanges();
    drenarRutas(http.match('/api/ruta'), () => VIAJE_EN_BUS_CON_MINUTO_VIVO);
    await fixture.whenStable();

    raiz.querySelector<HTMLElement>('.vivo__boton')!.click();
    fixture.detectChanges();
    http
      .expectOne((r) => r.url === '/api/poste-vivo')
      .flush({ clase: 'llega', texto: 'próximo en 2 min (dato de las 15:49)' });
    await fixture.whenStable();

    expect(raiz.querySelector('.vivo__estado')?.textContent?.trim()).toBe(
      'próximo en 2 min (dato de las 15:49)',
    );
    // ⭐ Y EL VIEJO NO SE HA QUEDADO EN NINGÚN SITIO. Es lo que pasaba antes:
    //    dos minutos distintos del mismo autobús, uno al lado del otro.
    expect(raiz.textContent).not.toContain('próximo en 4 min');
  });

  /**
   * ⭐ LA MURALLA: andando, bus y patín viajan **AL BYTE** como antes del 2/09.
   *
   * El encargo de la casilla 1 del punto 11 es *«solo pantalla, el motor NO se
   * toca»*, y esto es lo que compra esa frase. Repartir la botonera en dos
   * filas es maquetación; el día que se colara en el cuerpo de `/api/ruta` —una
   * `familia`, un `ruta` de más donde no lo había, un `modo` con otro nombre—
   * dejaría de serlo, y el motor tendría que enterarse de cómo está repartida
   * una fila de botones.
   *
   * Se compra el cuerpo ENTERO —claves y valores—, no solo `modo`: lo que se
   * teme no es que `modo` cambie (eso lo cazan veinte jueces), sino que
   * aparezca **una clave nueva** que nadie mire.
   */
  it('⭐ LA MURALLA · andando, bus y patín mandan el mismo cuerpo que antes, al byte', async () => {
    const fixture = TestBed.createComponent(Buscador);
    await fixture.whenStable();
    const raiz = fixture.nativeElement as HTMLElement;

    await direccionEntera(fixture, http);

    for (const modo of ['andando', 'bus', 'patin'] as const) {
      elegirModo(fixture, modo);
      await fixture.whenStable();

      botonGenerar(raiz).click();
      fixture.detectChanges();

      // UNA petición, no tres: la precarga del trío es de la bici y solo de
      // la bici. Que aquí hubiera tres sería el motor pagando por la fila
      // nueva.
      const peticiones = http.match('/api/ruta');
      expect(peticiones.length).toBe(1);

      const cuerpo = peticiones[0].request.body as Record<string, unknown>;
      expect(Object.keys(cuerpo).sort()).toEqual(['destino', 'modo', 'origen']);
      expect(cuerpo['modo']).toBe(modo);
      expect(cuerpo['origen']).toEqual({ via: '5140', portal: 'Portales.5140a' });
      expect(cuerpo['destino']).toEqual({ via: '1900', portal: 'Portales.1900a' });

      peticiones[0].flush(TRAYECTO);
      await fixture.whenStable();
    }
  });

  /**
   * ⭐ Y LAS DOS BICIS SÍ MANDAN LO SUYO, cada una la suya, por la segunda fila.
   *
   * Es el reverso exacto de la muralla: lo que la primera fila NO puede tocar,
   * la segunda tiene que decidirlo. Se pulsa el radio de la segunda fila
   * directamente —no el ayudante— para que lo que se compre sea **ese clic**.
   */
  it('⭐ Privada manda `bici` y Pública BiZi manda `bizi`, con sus tres rutas', async () => {
    const fixture = TestBed.createComponent(Buscador);
    await fixture.whenStable();
    const raiz = fixture.nativeElement as HTMLElement;

    await direccionEntera(fixture, http);
    radiosDeFamilia(raiz).find((r) => r.value === 'bici')!.click();
    fixture.detectChanges();
    await fixture.whenStable();

    for (const esperado of ['bici', 'bizi'] as const) {
      radiosDeBici(raiz).find((r) => r.value === esperado)!.click();
      fixture.detectChanges();
      await fixture.whenStable();

      botonGenerar(raiz).click();
      fixture.detectChanges();

      // Tres, que es la precarga del trío de siempre, y las tres con el mismo
      // modo y una ruta cada una.
      const peticiones = http.match('/api/ruta');
      expect(peticiones.length).toBe(3);
      for (const p of peticiones) {
        const cuerpo = p.request.body as Record<string, unknown>;
        expect(Object.keys(cuerpo).sort()).toEqual(['destino', 'modo', 'origen', 'ruta']);
        expect(cuerpo['modo']).toBe(esperado);
      }
      expect(peticiones.map((p) => (p.request.body as { ruta: string }).ruta).sort()).toEqual([
        'equilibrada',
        'rapida',
        'tranquila',
      ]);

      drenarRutas(peticiones, () => TRAYECTO);
      await fixture.whenStable();
    }
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
    // Y son doce desde el 30/08: los dos hitos, el del remate y el de la BiZi.
    expect(TODOS_LOS_GIROS.length).toBe(12);
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
    elegirModo(fixture, 'bici');
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

  /**
   * ⭐ LOS DOS HITOS DE LA BiZi SE LEEN ENTEROS, con su cifra y su hora.
   *
   * Un viaje en BiZi tiene TRES pasos de `salida` —uno por tramo— y sigue
   * teniendo **una sola chincheta de origen**. Y los dos hitos llevan lo que el
   * motor midió: el nombre de la estación, cuántas bicis o anclajes había, y la
   * hora del dato de ESA estación [GBFS: `last_reported` va por estación].
   */
  it('⭐ el viaje en BiZi enseña sus dos hitos y una sola chincheta', async () => {
    const fixture = TestBed.createComponent(Buscador);
    await fixture.whenStable();
    const raiz = fixture.nativeElement as HTMLElement;

    await direccionEntera(fixture, http);
    elegirModo(fixture, 'bizi');
    botonGenerar(raiz).click();
    fixture.detectChanges();
    drenarRutas(http.match('/api/ruta'), () => VIAJE_EN_BIZI);
    await fixture.whenStable();

    const salidas = VIAJE_EN_BIZI.pasos.filter((p) => p.giro === 'salida').length;
    expect(salidas).toBe(3);
    const capas = Array.from(raiz.querySelectorAll('.pasos__lista .paso__capa'));
    const conIcono = capas.filter((c) => c.querySelector('app-icono-capa') !== null);
    expect(conIcono.length).toBe(2);
    expect(capas.indexOf(conIcono[0]!)).toBe(0);
    expect(capas.indexOf(conIcono[1]!)).toBe(capas.length - 1);

    const textos = Array.from(raiz.querySelectorAll('.paso__texto')).map((p) =>
      (p.textContent ?? '').replace(/\s+/g, ' ').trim(),
    );
    expect(textos).toContain('Coge una bici en la estación Tauromaquia — 11 bicis disponibles a las 12:57');
    expect(textos).toContain('Deja la bici en la estación Mrio. Siresa: Dr. Iranzo — 16 anclajes libres a las 12:57');
    // Ninguno de los dos abre tramo, así que ninguno lleva metros.
    for (const giro of ['coge', 'aparca'] as const) {
      const k = VIAJE_EN_BIZI.pasos.findIndex((p) => p.giro === giro);
      expect(raiz.querySelectorAll('.paso')[k]!.querySelector('.paso__metros')).toBeNull();
    }
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

    // ⚠️ DOS TRAZOS POR TRAMO desde el 1/09 —el ribete y la línea—, y este
    // trayecto tiene uno solo. Lo que esta juez compra no cambia: que la
    // geometría llega, que regenerar NO acumula y que sin ruta el mapa queda a
    // cero. Ver `ribeteDe` en `mapa.ts`.
    expect(raiz.querySelectorAll('path.leaflet-interactive').length).toBe(2);

    // Segunda generación: el mismo tramo, no el doble.
    botonGenerar(raiz).click();
    fixture.detectChanges();
    http.expectOne('/api/ruta').flush(TRAYECTO);
    await fixture.whenStable();

    expect(raiz.querySelectorAll('path.leaflet-interactive').length).toBe(2);

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

    expect(resumenEnPantalla(raiz)[0]).toContain('PEÑA ZORONGO');
    expect(resumenEnPantalla(raiz)[0]).toContain('no tiene ninguna calle andable cerca');
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

    elegirModo(fixture, 'patin');
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

    elegirModo(fixture, 'bici');
    await fixture.whenStable();
    expect(raiz.querySelector('.rutas')).not.toBeNull();
    expect(etiquetasDeRuta(raiz)).toEqual(['Rápida', 'Equilibrada', 'Tranquila']);
    expect(radiosDeRuta(raiz).filter((r) => r.checked).map((r) => r.value)).toEqual([
      'equilibrada',
    ]);

    elegirModo(fixture, 'bizi');
    await fixture.whenStable();
    expect(radiosDeRuta(raiz).length).toBe(3);

    // Y en el patín NO: su vía ciclista es obligatoria, no una preferencia.
    elegirModo(fixture, 'patin');
    await fixture.whenStable();
    expect(raiz.querySelector('.rutas')).toBeNull();

    elegirModo(fixture, 'coche');
    tragarLaZona();
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

    elegirModo(fixture, 'bici');
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

    elegirModo(fixture, 'bici');
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
    elegirModo(fixture, 'bizi');
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

    elegirModo(fixture, 'patin');
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

    elegirModo(fixture, 'patin');
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
   * ⭐ UN AVISO QUE CONVIVE CON UNA RUTA TAMBIÉN SE ENSEÑA (30/08).
   *
   * ⚠️ **Esta juez sale de una zona sin vigilar, cazada con una mutación.**
   * Hasta las casillas 5 y 6, un trayecto tenía ruta **o** tenía aviso, nunca
   * las dos cosas: las tres pruebas de aviso que había —la del motor sin ruta,
   * el bus y el coche— compran todas el caso de `pasos: []`. Desde el remate
   * del aparcabicis y el modo BiZi **conviven**, y nadie lo vigilaba: poniendo
   * el bloque de avisos dentro de un `@if (pasos.length === 0)`, **las 175
   * pruebas seguían en verde** y el aviso del plan D-G desaparecía de la
   * pantalla sin que nada lo dijera.
   *
   * Lo que se perdía no es un adorno: **es lo único que hace legales unos hitos
   * sin número**. «Coge una bici en la estación Tauromaquia» sin decir cuántas
   * hay ni que no se ha podido preguntar es prometer lo que no se sabe.
   *
   * Los dos casos de esta clase, en la misma juez porque es el mismo hueco: el
   * D-G del BiZi y el «no hay aparcabicis cerca» de la bici.
   */
  /**
   * ⭐ EL DOBLE SITIO: el aviso arriba **Y** al lado de cada hito (30/08).
   *
   * ── La doctrina ─────────────────────────────────────────────────────────
   *
   * [GOV.UK, *error summary* + *error message*] cuando hay un problema se
   * enseñan **los dos**: el resumen en lo alto de la página **y** el mensaje
   * **al lado de cada respuesta afectada**, con **el mismo texto** en los dos
   * sitios. Y la razón de la mitad de abajo, con sus palabras: *«general
   * errors are not helpful»* — un mensaje general **no tiene sentido fuera de
   * contexto**.
   *
   * ── El caso que lo pedía es literal ─────────────────────────────────────
   *
   * Antonio leyó «Coge una bici en la estación Tauromaquia» **quince pasos
   * por debajo** del banner ámbar. El banner estaba —eso ya lo compra la juez
   * de aquí abajo, del 30/08 por la mañana— pero el hito, ahí solo, promete un
   * sitio donde coger una bici sin decir que no se sabe si queda alguna. El
   * resumen no viaja con el paso; la nota sí.
   *
   * ⚠️ **El banner NO se quita**: es el resumen del patrón, no un duplicado
   * que sobre. El patrón son las dos cosas o no es el patrón.
   */
  it('⭐ 1 · con el D-G, los DOS hitos llevan la nota al lado', async () => {
    const fixture = TestBed.createComponent(Buscador);
    await fixture.whenStable();
    const raiz = fixture.nativeElement as HTMLElement;
    await direccionEntera(fixture, http);

    elegirModo(fixture, 'bizi');
    botonGenerar(raiz).click();
    fixture.detectChanges();
    drenarRutas(http.match('/api/ruta'), () => VIAJE_EN_BIZI_A_CIEGAS);
    await fixture.whenStable();

    // Los pasos que son hito, por su icono: coger y dejar.
    const conNota = Array.from(raiz.querySelectorAll('.paso'))
      .filter((li) => li.querySelector('.paso__nota') !== null)
      .map((li) => (li.querySelector('.paso__texto')?.textContent ?? '').replace(/\s+/g, ' ').trim());

    expect(conNota).toEqual([
      'Coge una bici en la estación Tauromaquia',
      'Deja la bici en la estación Mrio. Siresa: Dr. Iranzo',
    ]);
    // Y solo esos dos: ni el paso de salida ni los de girar llevan nota.
    expect(raiz.querySelectorAll('.paso__nota').length).toBe(2);
  });

  /**
   * ⭐ 2 · CON LA API VIVA NO CAMBIA NADA: ni banner ni notas.
   *
   * La no-regresión del caso bueno. Cuando la sede contesta, los hitos traen
   * su número y su hora, y **no hay nada que avisar** — poner la nota entonces
   * sería alarmar sin motivo.
   */
  it('⭐ 2 · con la API viva no hay ni banner ni nota', async () => {
    const fixture = TestBed.createComponent(Buscador);
    await fixture.whenStable();
    const raiz = fixture.nativeElement as HTMLElement;
    await direccionEntera(fixture, http);

    elegirModo(fixture, 'bizi');
    botonGenerar(raiz).click();
    fixture.detectChanges();
    drenarRutas(http.match('/api/ruta'), () => VIAJE_EN_BIZI);
    await fixture.whenStable();

    expect(raiz.querySelectorAll('.paso').length).toBeGreaterThan(0);
    expect(raiz.querySelectorAll('.paso__nota').length).toBe(0);
    // Y sin avisos no hay caja: el resumen no existe vacío.
    expect(raiz.querySelector('.resumen')).toBeNull();
    expect(raiz.querySelectorAll('.aviso-ruta').length).toBe(0);
  });

  /**
   * ⭐ 3 · EL RESUMEN DE ARRIBA SIGUE ESTANDO.
   *
   * ⚠️ La juez que impide «arreglarlo» quitando el banner y dejando solo las
   * notas. [GOV.UK] el resumen existe porque es **lo primero que se lee** y lo
   * que recibe el foco; las notas son el contexto. Quitar cualquiera de los
   * dos rompe el patrón.
   */
  it('⭐ 3 · con el D-G el banner de arriba NO se quita', async () => {
    const fixture = TestBed.createComponent(Buscador);
    await fixture.whenStable();
    const raiz = fixture.nativeElement as HTMLElement;
    await direccionEntera(fixture, http);

    elegirModo(fixture, 'bizi');
    botonGenerar(raiz).click();
    fixture.detectChanges();
    drenarRutas(http.match('/api/ruta'), () => VIAJE_EN_BIZI_A_CIEGAS);
    await fixture.whenStable();

    expect(resumenEnPantalla(raiz)).toContain(
      'No hemos podido preguntar cuántas bicis hay ahora mismo: disponibilidad no verificada.',
    );
    // Y las notas también, que es la otra mitad: los DOS sitios.
    expect(raiz.querySelectorAll('.paso__nota').length).toBe(2);
  });

  /**
   * ⭐ 4 · EL MISMO TEXTO EN LOS DOS SITIOS, comprado literal.
   *
   * [GOV.UK] *«use the same wording»*: el resumen y el mensaje de al lado
   * dicen **lo mismo**. Dos redacciones distintas para el mismo problema
   * obligan a leer dos veces para descubrir que hablan de una sola cosa.
   *
   * Por eso la nota **no reescribe** el aviso: se lo copia. Lo que el motor
   * escribe una vez sale igual en los dos sitios, y si el motor cambia esas
   * palabras cambian las dos a la vez sin tocar nada aquí.
   */
  it('⭐ 4 · el texto de la nota es EL MISMO que el del banner', async () => {
    const fixture = TestBed.createComponent(Buscador);
    await fixture.whenStable();
    const raiz = fixture.nativeElement as HTMLElement;
    await direccionEntera(fixture, http);

    elegirModo(fixture, 'bizi');
    botonGenerar(raiz).click();
    fixture.detectChanges();
    drenarRutas(http.match('/api/ruta'), () => VIAJE_EN_BIZI_A_CIEGAS);
    await fixture.whenStable();

    const banner = resumenEnPantalla(raiz)[0]!;
    const notas = Array.from(raiz.querySelectorAll('.paso__nota')).map((n) =>
      (n.textContent ?? '').replace(/\s+/g, ' ').trim(),
    );
    expect(notas.length).toBe(2);
    for (const nota of notas) {
      // El ⚠ es del vestido, no del mensaje: se descuenta y lo que queda
      // tiene que ser el banner palabra por palabra.
      expect(nota.replace(/^⚠\s*/, '')).toBe(banner);
    }
  });

  /**
   * ⭐ 5 · LA NOTA LLEVA EL ⚠, no solo el ámbar.
   *
   * [GOV.UK *warning text*] el componente es **icono + texto**, y sus criterios
   * de aceptación piden ≥4,5:1 de contraste. Y es nuestro 1.4.1 de siempre: el
   * color no puede ser lo único que avise. Aquí el ⚠ va `aria-hidden` porque
   * el texto ya dice lo que pasa — el icono es para el ojo, no para el oído.
   */
  it('⭐ 5 · la nota avisa con el ⚠ además del color', async () => {
    const fixture = TestBed.createComponent(Buscador);
    await fixture.whenStable();
    const raiz = fixture.nativeElement as HTMLElement;
    await direccionEntera(fixture, http);

    elegirModo(fixture, 'bizi');
    botonGenerar(raiz).click();
    fixture.detectChanges();
    drenarRutas(http.match('/api/ruta'), () => VIAJE_EN_BIZI_A_CIEGAS);
    await fixture.whenStable();

    const notas = Array.from(raiz.querySelectorAll('.paso__nota'));
    expect(notas.length).toBe(2);
    for (const nota of notas) {
      const icono = nota.querySelector('[aria-hidden="true"]');
      expect(icono?.textContent?.trim()).toBe('⚠');
    }
  });

  /**
   * ⭐ 6 · EN BUS, LA NOTA VA AL LADO DEL HITO DE SUBIR — **y solo ahí**.
   *
   * El mismo patrón del BiZi con un requisito de más: aquí los avisos **son de
   * un poste concreto**. Un viaje con transbordo tiene dos hitos de subida, y
   * poner el mismo aviso en los dos diría que ninguna de las dos líneas está
   * pasando cuando puede que sea solo una. [GOV.UK] *«general errors are not
   * helpful»* — la nota tiene que ser de lo que la nota habla.
   *
   * La regla, y va escrita porque es la que sostiene esto: **un aviso vale para
   * el hito cuyo sitio nombra**; y uno que no nombra el sitio de ningún hito
   * —como el D-G del BiZi— vale para todos.
   */
  it('⭐ 6 · en bus, la nota va al lado del hito de SUBIR y solo ahí', async () => {
    const fixture = TestBed.createComponent(Buscador);
    await fixture.whenStable();
    const raiz = fixture.nativeElement as HTMLElement;
    await direccionEntera(fixture, http);

    elegirModo(fixture, 'bus');
    botonGenerar(raiz).click();
    fixture.detectChanges();
    drenarRutas(http.match('/api/ruta'), () => VIAJE_EN_BUS_SIN_LA_29);
    await fixture.whenStable();

    const conNota = Array.from(raiz.querySelectorAll('.paso'))
      .filter((li) => li.querySelector('.paso__nota') !== null)
      .map((li) => (li.querySelector('.paso__texto')?.textContent ?? '').replace(/\s+/g, ' ').trim());

    expect(conNota).toEqual([
      'Sube a la línea 29 en el poste Bernardo Ramazzini / Maz — ~7 min de espera',
    ]);
    // Ni el de bajar, ni el de salir, ni el de llegar.
    expect(raiz.querySelectorAll('.paso__nota').length).toBe(1);
  });

  /**
   * ⭐ 7 · Y EL BANNER SIGUE ARRIBA, con **el mismo texto**.
   *
   * [GOV.UK] el resumen y el mensaje de al lado dicen lo mismo: *«use the same
   * wording»*. La nota no reescribe el aviso del motor, se lo copia.
   */
  it('⭐ 7 · en bus, el banner y la nota dicen exactamente lo mismo', async () => {
    const fixture = TestBed.createComponent(Buscador);
    await fixture.whenStable();
    const raiz = fixture.nativeElement as HTMLElement;
    await direccionEntera(fixture, http);

    elegirModo(fixture, 'bus');
    botonGenerar(raiz).click();
    fixture.detectChanges();
    drenarRutas(http.match('/api/ruta'), () => VIAJE_EN_BUS_SIN_LA_29);
    await fixture.whenStable();

    const banner = resumenEnPantalla(raiz)[0]!;
    // ⚠️ [GTFS-Realtime] una entidad ausente del feed en vivo es «sin
    // información en tiempo real», NO «sin servicio». El banner dice lo medido.
    expect(banner).toContain('Avanza no anuncia ningún próximo de la línea 29');
    expect(banner).not.toContain('prestando servicio');
    const nota = (raiz.querySelector('.paso__nota')?.textContent ?? '')
      .replace(/\s+/g, ' ')
      .trim();
    expect(nota.replace(/^⚠\s*/, '')).toBe(banner);
  });

  /**
   * ⭐ 8 · EL CHIP DE LA LÍNEA: número, color del feed y texto del feed.
   *
   * [WCAG 1.4.1, *Use of Color*] el color **nunca solo**: el chip lleva el
   * número dentro, así que quien no distinga el amarillo de la 29 del verde del
   * tranvía sigue leyendo «29». El color es reconocimiento, no información.
   *
   * ⭐ **EL FONDO SALE DEL FEED Y NO SE TOCA** —`route_color`—: la 29 es amarilla
   * porque el operador dice que lo es, y repintarla sería romper la identidad
   * para salvar el texto. En el feed va sin almohadilla (`F5C100`), y quien la
   * pone es la pantalla.
   *
   * ⚠️ **El `route_text_color`, en cambio, ya NO se obedece (1/09).** El feed
   * pinta el número de la 29 en negro y el de las demás en blanco porque alguien
   * lo decidió línea a línea, y medido sobre el cocinado eso dejaba **27 de 53
   * chips por debajo de 4,5:1** —la 33 a 1,72:1—. La regla ahora es de marca y
   * viene de ZetaBus: **toda diurna lleva el número blanco con un contorno
   * negro**, que es lo que lo hace legible sobre cualquier tono sin tocar el
   * fondo. Ver `src/app/chip.ts`.
   *
   * Va en **los dos sitios** que la casilla pide: la leyenda del viaje, que
   * responde a «¿en qué me monto?» de un vistazo, y el paso de subida, que es
   * donde se hace.
   */
  it('⭐ 8 · el chip lleva el número, el color del feed y el blanco con contorno', async () => {
    const fixture = TestBed.createComponent(Buscador);
    await fixture.whenStable();
    const raiz = fixture.nativeElement as HTMLElement;
    await direccionEntera(fixture, http);

    elegirModo(fixture, 'bus');
    botonGenerar(raiz).click();
    fixture.detectChanges();
    drenarRutas(http.match('/api/ruta'), () => VIAJE_EN_BUS_SIN_LA_29);
    await fixture.whenStable();

    const chips = Array.from(raiz.querySelectorAll<HTMLElement>('.chip-linea'));
    expect(chips.length).toBe(2);
    for (const chip of chips) {
      // El número, que es lo que se lee sin depender del color.
      expect(chip.textContent?.trim()).toBe('29');
      // ⭐ El fondo, el del feed, con su almohadilla puesta aquí. INTACTO.
      expect(chip.style.backgroundColor).toBe('rgb(245, 193, 0)');
      // ⭐ Y el número BLANCO con contorno — no el negro que manda el feed.
      expect(chip.style.color).toBe('rgb(255, 255, 255)');
      expect(chip.classList.contains('chip-linea--contorno')).toBe(true);
    }
    // Uno en la leyenda de la cabecera y otro en el paso de subir.
    expect(raiz.querySelectorAll('.ruta .chip-linea').length).toBe(1);
    const subida = Array.from(raiz.querySelectorAll('.paso')).find((li) =>
      /Sube a la línea/.test(li.textContent ?? ''),
    );
    expect(subida?.querySelector('.chip-linea')).not.toBeNull();
  });

  /**
   * ⭐ 9 · EL INDICADOR DE ESPERA: aparece si tarda, y solo si tarda.
   *
   * [Nielsen Norman Group] *«para retrasos de más de 1 segundo hay que indicar
   * que el sistema está trabajando; más aún si el tiempo es variable»*. Y aquí
   * lo es: el Generar en bus paga una consulta a Avanza que tarda entre nada y
   * tres segundos, y a veces no contesta.
   *
   * Las dos mitades, y la segunda es la que importa: **con respuesta rápida no
   * aparece**. Un indicador que siempre está no informa de nada y parpadea en
   * cada ruta a pie, que se calcula en 20 ms.
   */
  it('⭐ 9 · el indicador aparece si la respuesta tarda más de un segundo', async () => {
    const fixture = TestBed.createComponent(Buscador);
    await fixture.whenStable();
    const raiz = fixture.nativeElement as HTMLElement;
    await direccionEntera(fixture, http);

    elegirModo(fixture, 'bus');
    botonGenerar(raiz).click();
    fixture.detectChanges();

    // Todavía no ha pasado un segundo: no hay nada que anunciar.
    expect(raiz.querySelector('.esperando')).toBeNull();

    // La respuesta se hace esperar de verdad — sin relojes de mentira.
    const peticiones = http.match('/api/ruta');
    await new Promise((r) => setTimeout(r, 1100));
    fixture.detectChanges();
    const aviso = raiz.querySelector('.esperando');
    expect(aviso).not.toBeNull();
    // [WAI-ARIA] `status` es una región viva de cortesía: se anuncia sin
    // interrumpir. Sin rol, un lector de pantalla no se entera de que apareció.
    expect(aviso?.getAttribute('role')).toBe('status');
    expect(aviso?.textContent).toContain('Avanza');

    // Y al llegar la respuesta se retira.
    drenarRutas(peticiones, () => VIAJE_EN_BUS_SIN_LA_29);
    await fixture.whenStable();
    expect(raiz.querySelector('.esperando')).toBeNull();
    expect(raiz.querySelectorAll('.paso').length).toBe(5);
  }, 10000);

  /**
   * ⭐ 10 · Y CON RESPUESTA RÁPIDA, NI SE ASOMA.
   *
   * La otra mitad de la 9, y la que caza un indicador que se enciende siempre.
   *
   * ⚠️ **Y la primera versión de esta juez no la cazaba.** Contestaba la
   * petición en el mismo tick en que se pulsaba, así que el reloj —aunque
   * fuera de 0 ms— se cancelaba antes de que le tocara correr: con
   * `MS_ANTES_DE_AVISAR = 0` la juez seguía en verde. Se descubrió en la
   * contraprueba, mutando esa constante a cero. Ahora se **espera de verdad**
   * un rato que ninguna ruta a pie tarda —200 ms, y el motor resuelve en 20—
   * y se mira ANTES de contestar: si el aviso hubiera salido, estaría ahí.
   */
  it('⭐ 10 · con respuesta rápida el indicador no aparece nunca', async () => {
    const fixture = TestBed.createComponent(Buscador);
    await fixture.whenStable();
    const raiz = fixture.nativeElement as HTMLElement;
    await direccionEntera(fixture, http);

    botonGenerar(raiz).click();
    fixture.detectChanges();

    // Diez veces lo que tarda una ruta a pie, y todavía por debajo del segundo.
    const peticiones = http.match('/api/ruta');
    await new Promise((r) => setTimeout(r, 200));
    fixture.detectChanges();
    expect(raiz.querySelector('.esperando')).toBeNull();

    drenarRutas(peticiones, () => POR_LA_AVENIDA_DE_MADRID);
    await fixture.whenStable();
    expect(raiz.querySelector('.esperando')).toBeNull();
    expect(raiz.querySelectorAll('.paso').length).toBeGreaterThan(0);
  });

  /**
   * ⭐ 11 · EL DESVÍO, EN EL DOBLE SITIO — y pegado a SU línea.
   *
   * [GOV.UK] resumen arriba **y** mensaje junto a lo afectado, con el mismo
   * texto. Y aquí lo afectado no se reconoce por el sitio —el aviso habla de las
   * paradas que **no** se hacen, que por definición no son este hito—: se
   * reconoce por **la línea**, que en el paso de subir va en negrita.
   *
   * Es la nota más importante de las tres: las otras dos dicen *cuándo* pasa el
   * autobús, y ésta *por dónde*. Sin ella alguien se planta en una parada por la
   * que hoy no pasa nadie.
   */
  it('⭐ 11 · el aviso de desvío va arriba y junto al hito de su línea', async () => {
    const fixture = TestBed.createComponent(Buscador);
    await fixture.whenStable();
    const raiz = fixture.nativeElement as HTMLElement;
    await direccionEntera(fixture, http);

    elegirModo(fixture, 'bus');
    botonGenerar(raiz).click();
    fixture.detectChanges();
    drenarRutas(http.match('/api/ruta'), () => VIAJE_EN_BUS_DESVIADO);
    await fixture.whenStable();

    // ⭐ ARRIBA, EL HECHO Y SOLO EL HECHO (2/09). La lista de postes se quedó
    //    junto al hito: repetirla en el resumen sería el mismo texto dos veces,
    //    y era justo lo que hacía que cuatro desvíos llenaran la pantalla.
    const resumen = resumenEnPantalla(raiz);
    expect(resumen.length).toBe(1);
    expect(resumen[0]).toBe('La línea 29 va hoy desviada.');
    expect(resumen[0]).not.toContain('no para en Don Jaime I / Plaza De La Seo');

    // Y la nota, junto al hito de subir a la 29 — y solo ahí, con la lista.
    const conNota = Array.from(raiz.querySelectorAll('.paso'))
      .filter((li) => li.querySelector('.paso__nota') !== null)
      .map((li) => (li.querySelector('.paso__texto')?.textContent ?? '').replace(/\s+/g, ' ').trim());
    expect(conNota).toEqual([
      'Sube a la línea 29 en el poste Bernardo Ramazzini / Maz — ~7 min de espera',
    ]);
    const nota = (raiz.querySelector('.paso__nota')?.textContent ?? '').replace(/\s+/g, ' ').trim();
    expect(nota).toContain('no para en Don Jaime I / Plaza De La Seo');
    expect(nota).toContain('para provisionalmente en P. Echegaray');

    // ⭐ Y EL ENLACE DEL RESUMEN LLEVA A ESE PASO, no a otro.
    const paso = Array.from(raiz.querySelectorAll('.paso')).findIndex(
      (li) => li.querySelector('.paso__nota') !== null,
    );
    expect(adondeLlevaElResumen(raiz)).toEqual([`#paso-${paso}`]);
  });

  /**
   * ⭐ 12 · CON DOS LÍNEAS DESVIADAS, CADA NOTA ES LA SUYA.
   *
   * ⚠️ **Esta juez nace de un fallo que la 11 dejó pasar**, y el porqué está en
   * su fixture: tenía un vehículo y un aviso, así que la pregunta que falla
   * —¿cuál de los dos avisos le toca a cada hito?— no se le llegaba a hacer.
   * En Chrome, las dos notas decían lo de la 29. Ver la entrada del 31/08 de
   * `docs/BITACORA.md`.
   *
   * La trampa va DENTRO del caso: el aviso de la 29 nombra
   * `Asalto / Centro De Historias` como parada provisional, y ese poste es
   * justo donde se sube a la 22. Con las dos reglas al revés —el sitio antes
   * que la línea— el hito de la 22 se queda con el desvío de la 29.
   */
  it('⭐ 12 · con dos líneas desviadas, cada hito lleva el aviso de SU línea', async () => {
    const fixture = TestBed.createComponent(Buscador);
    await fixture.whenStable();
    const raiz = fixture.nativeElement as HTMLElement;
    await direccionEntera(fixture, http);

    elegirModo(fixture, 'bus');
    botonGenerar(raiz).click();
    fixture.detectChanges();
    drenarRutas(http.match('/api/ruta'), () => VIAJE_EN_BUS_DOS_DESVIADAS);
    await fixture.whenStable();

    // Las dos líneas del resumen, con las dos líneas de bus.
    const banners = Array.from(raiz.querySelectorAll('.resumen__linea')).map((a) =>
      (a.textContent ?? '').trim(),
    );
    expect(banners.length).toBe(2);
    expect(banners.some((b) => b.startsWith('La línea 22'))).toBe(true);
    expect(banners.some((b) => b.startsWith('La línea 29'))).toBe(true);

    // ⭐ Y CADA NOTA, LA DE SU LÍNEA. Dos hitos de subida, dos notas distintas.
    const notas = Array.from(raiz.querySelectorAll('.paso'))
      .filter((li) => li.querySelector('.paso__nota') !== null)
      .map((li) => ({
        paso: (li.querySelector('.paso__texto')?.textContent ?? '').replace(/\s+/g, ' ').trim(),
        nota: (li.querySelector('.paso__nota')?.textContent ?? '').replace(/\s+/g, ' ').replace(/^⚠\s*/, '').trim(),
      }));
    expect(notas.length).toBe(2);
    expect(notas[0]!.paso).toContain('Sube a la línea 29');
    expect(notas[0]!.nota).toMatch(/^La línea 29 va hoy desviada/);
    expect(notas[1]!.paso).toContain('Sube a la línea 22');
    expect(notas[1]!.nota).toMatch(/^La línea 22 va hoy desviada/);
    // Y no son la misma: es justo lo que fallaba.
    expect(notas[0]!.nota).not.toBe(notas[1]!.nota);
  });

  /**
   * ⭐ 13 · EL TRANSBORDO EN EL MISMO POSTE: un paso y **dos chips**.
   *
   * [Referencia GTFS, `transfers.txt`] el transbordo es un elemento de primera
   * clase entre dos rutas en una parada. En pantalla eso es **una línea de
   * indicaciones**, no tres — y los dos chips dicen con el color lo que el texto
   * dice con palabras: de la 35 a la 31.
   */
  it('⭐ 13 · el transbordo sale en un paso, con los dos chips', async () => {
    const fixture = TestBed.createComponent(Buscador);
    await fixture.whenStable();
    const raiz = fixture.nativeElement as HTMLElement;
    await direccionEntera(fixture, http);

    elegirModo(fixture, 'bus');
    botonGenerar(raiz).click();
    fixture.detectChanges();
    drenarRutas(http.match('/api/ruta'), () => VIAJE_CON_TRANSBORDO_Y_DESVIO);
    await fixture.whenStable();

    const pasos = Array.from(raiz.querySelectorAll('.paso'));
    expect(pasos.length).toBe(5);

    const elTransbordo = pasos.find((li) => /transborda/.test(li.textContent ?? ''))!;
    expect(elTransbordo).toBeTruthy();
    expect((elTransbordo.querySelector('.paso__texto')?.textContent ?? '').replace(/\s+/g, ' ').trim()).toBe(
      'En el poste Av. Francisco De Goya N.º 83, transborda de la línea 35 a la línea 31 ' +
        '— 16 paradas — frecuencia teórica de la 31: cada 14 min',
    );

    // ⭐ LOS DOS CHIPS, en orden: de la que se deja a la que se coge.
    const chips = Array.from(elTransbordo.querySelectorAll<HTMLElement>('.chip-linea'));
    expect(chips.map((c) => c.textContent?.trim())).toEqual(['35', '31']);
    expect(chips[0]!.style.backgroundColor).toBe('rgb(68, 92, 159)');
    expect(chips[1]!.style.backgroundColor).toBe('rgb(149, 193, 31)');

    // Y no hay ni «Baja» de por medio ni el paso del portal repetido.
    expect(raiz.textContent).not.toContain('es el mismo portal del que sales');
    expect(pasos.filter((li) => /^Baja/.test((li.querySelector('.paso__texto')?.textContent ?? '').trim())).length).toBe(1);
  });

  /**
   * ⭐ 14 · EL AVISO DE DESVÍO SOLO VA CON SU LÍNEA — **la reapertura**.
   *
   * ⚠️ Esta es la juez que faltaba el 31/08 por la mañana, y su ausencia dejó
   * cerrar la entrada en falso. La 12 traía dos líneas **las dos desviadas**, así
   * que la regla de la línea casaba siempre y la del sitio no se llegaba a
   * mirar. Aquí la **31 NO va desviada** y sube en el poste que la **35** nombra
   * entre sus provisionales: si la regla del sitio siguiera abierta a los
   * desvíos, el transbordo se comería el aviso de la 35.
   *
   * Un desvío explica una **línea**, no un poste.
   */
  it('⭐ 14 · una línea no desviada no hereda el aviso de la que nombra su poste', async () => {
    const fixture = TestBed.createComponent(Buscador);
    await fixture.whenStable();
    const raiz = fixture.nativeElement as HTMLElement;
    await direccionEntera(fixture, http);

    elegirModo(fixture, 'bus');
    botonGenerar(raiz).click();
    fixture.detectChanges();
    drenarRutas(http.match('/api/ruta'), () => VIAJE_CON_TRANSBORDO_Y_DESVIO);
    await fixture.whenStable();

    // El resumen sigue arriba: los DOS sitios [GOV.UK, doble sitio].
    const banners = resumenEnPantalla(raiz);
    expect(banners.length).toBe(1);
    expect(banners[0]).toContain('La línea 35 va hoy desviada');

    // ⭐ Y UNA SOLA NOTA, la de la subida a la 35. El transbordo a la 31 no
    // lleva ninguna, aunque su poste salga nombrado en el aviso de la 35.
    const conNota = Array.from(raiz.querySelectorAll('.paso'))
      .filter((li) => li.querySelector('.paso__nota') !== null)
      .map((li) => (li.querySelector('.paso__texto')?.textContent ?? '').replace(/\s+/g, ' ').trim());
    expect(conNota.length).toBe(1);
    expect(conNota[0]).toContain('Sube a la línea 35');
    expect(conNota[0]).not.toContain('transborda');
  });

  /**
   * ⭐ ¿ESTO SE VE? La pregunta es por el PÍXEL, no por el atributo.
   *
   * ⚠️ `elemento.hidden === true` dice que el atributo está puesto, y eso NO es
   * que esté escondido: `[hidden] { display: none }` es una regla del navegador
   * como cualquier otra, y una regla de la hoja del componente con la misma
   * especificidad la pisa por ir después. Pasó el 31/08 y las tres jueces de
   * abajo dieron verde con la lista entera a la vista. Ver `docs/BITACORA.md`.
   */
  const seVe = (e: HTMLElement): boolean => getComputedStyle(e).display !== 'none';

  /**
   * ⭐ 15 · EL DESVÍO EN DOS NIVELES: **el hecho siempre, la lista a un botón**.
   *
   * [GOV.UK, *progressive disclosure*] contenido oculto al cargar que se
   * muestra al activar su disparador. Y sus dos límites, que son los que fijan
   * dónde va el corte: *«no ocultes información importante que deba estar
   * presente siempre»* y *«úsalo cuando el detalle solo beneficie a un grupo
   * pequeño»*.
   *
   * El HECHO —«la 35 va hoy desviada»— es lo importante: quien no lo lea se
   * planta en una parada por la que hoy no pasa nadie. La LISTA de los ocho
   * postes solo le hace falta a quien vaya a alguno de ellos.
   */
  it('⭐ 15 · el hecho del desvío se ve siempre; la lista, no hasta pulsar', async () => {
    const fixture = TestBed.createComponent(Buscador);
    await fixture.whenStable();
    const raiz = fixture.nativeElement as HTMLElement;
    await direccionEntera(fixture, http);

    elegirModo(fixture, 'bus');
    botonGenerar(raiz).click();
    fixture.detectChanges();
    drenarRutas(http.match('/api/ruta'), () => VIAJE_CON_TRANSBORDO_Y_DESVIO);
    await fixture.whenStable();

    // ⚠️ **En el HITO, no arriba** (2/09). El resumen dejó de llevar el doble
    //    nivel: dice el hecho y enlaza. El detalle vive en un solo sitio, que
    //    es el que está pegado a lo que explica.
    const banner = raiz.querySelector<HTMLElement>('.paso__nota')!;
    // ⭐ EL HECHO, en un elemento que NO está oculto.
    const hecho = banner.querySelector<HTMLElement>('.aviso-ruta__hecho')!;
    expect(hecho).toBeTruthy();
    expect(seVe(hecho)).toBe(true);
    expect(hecho.textContent?.trim()).toBe('La línea 35 va hoy desviada.');

    // ⭐ Y LA LISTA, oculta al cargar — y sin el hecho dentro, que si no
    // esconderlo detrás del botón pasaría por aquí sin que nadie se enterara.
    const cuerpo = banner.querySelector<HTMLElement>('.detalles__cuerpo')!;
    expect(cuerpo).toBeTruthy();
    expect(seVe(cuerpo)).toBe(false);
    expect(cuerpo.textContent).not.toContain('va hoy desviada');
    expect(cuerpo.textContent?.replace(/\s+/g, ' ').trim()).toBe(
      'no para en Av. De Valencia N.º 8, Av. De Valencia N.º 38; ' +
        'para provisionalmente en Av. Francisco De Goya N.º 83, Av. Francisco De Goya N.º 59.',
    );

    // ⚠️ Y UN AVISO QUE NO ES DE DESVÍO NO SE PARTE: el D-G del BiZi es una
    // sola frase corta, y meterle un botón sería esconder lo único que dice.
    const c = fixture.componentInstance as unknown as {
      dosNiveles(t: string): { readonly hecho: string; readonly detalle: string | null };
    };
    expect(c.dosNiveles('Las bicis se han pedido a la sede: disponibilidad no verificada.').detalle).toBeNull();

    // ⭐ Y EL POSTE CON DOS PUNTOS EN EL NOMBRE, que existe y es del feed:
    // `Av. Del Cierzo / Av: Cañones De Zaragoza` —una errata de `Av.` que va
    // en el dato—. Si el corte fuera «por el primer `: `», partiría aquí.
    const conTrampa = c.dosNiveles(
      'La línea 42 va hoy desviada: no para en Av. Del Cierzo / Av: Cañones De Zaragoza.',
    );
    expect(conTrampa.hecho).toBe('La línea 42 va hoy desviada.');
    expect(conTrampa.detalle).toBe('no para en Av. Del Cierzo / Av: Cañones De Zaragoza.');
  });

  /**
   * ⭐ 16 · EL DISPARADOR ES UN BOTÓN, y dice si está abierto.
   *
   * [GOV.UK / sistema de diseño de la Comisión Europea, *expandable*] la
   * anatomía es **botón + indicador de estado + contenedor inicialmente
   * oculto**, y tiene que funcionar con el teclado y anunciarse al lector.
   *
   * ⚠️ Por eso NO es un *tooltip* por hover: no existe como componente en
   * ninguna de las dos guías, no se puede abrir con el tabulador y no expone
   * estado ninguno. Un `<button>` nativo trae lo primero de balde —entra en el
   * orden de tabulación y se activa con Enter y con Espacio sin escribir una
   * línea—, y `aria-expanded` es lo segundo.
   */
  it('⭐ 16 · el botón se alcanza con el tabulador, dice su estado y alterna', async () => {
    const fixture = TestBed.createComponent(Buscador);
    await fixture.whenStable();
    const raiz = fixture.nativeElement as HTMLElement;
    await direccionEntera(fixture, http);

    elegirModo(fixture, 'bus');
    botonGenerar(raiz).click();
    fixture.detectChanges();
    drenarRutas(http.match('/api/ruta'), () => VIAJE_CON_TRANSBORDO_Y_DESVIO);
    await fixture.whenStable();

    // El único disparador que queda, y está donde tiene que estar: en el hito.
    const banner = raiz.querySelector<HTMLElement>('.paso__nota')!;
    const boton = banner.querySelector<HTMLElement>('.detalles')!;
    const cuerpo = banner.querySelector<HTMLElement>('.detalles__cuerpo')!;

    // ⭐ UN BOTÓN DE VERDAD: eso es lo que lo hace operable con el teclado.
    expect(boton.tagName).toBe('BUTTON');
    expect(boton.getAttribute('type')).toBe('button');
    expect(boton.tabIndex).toBe(0);
    expect(boton.textContent?.trim()).toBe('detalles');

    // ⭐ EL ESTADO, expuesto, y apuntando a lo que abre.
    expect(boton.getAttribute('aria-expanded')).toBe('false');
    expect(cuerpo.id).toBeTruthy();
    expect(boton.getAttribute('aria-controls')).toBe(cuerpo.id);

    // ⭐ Y ALTERNA en los dos sentidos.
    boton.click();
    fixture.detectChanges();
    expect(boton.getAttribute('aria-expanded')).toBe('true');
    expect(seVe(cuerpo)).toBe(true);

    boton.click();
    fixture.detectChanges();
    expect(boton.getAttribute('aria-expanded')).toBe('false');
    expect(seVe(cuerpo)).toBe(false);
  });

  /**
   * ⭐ 17 · EL DETALLE VIVE EN **UN SOLO SITIO**, y es el hito.
   *
   * ⚠️ Esta juez decía lo contrario hasta el 2/09 —«el doble nivel vive en los
   *    dos sitios»— y era verdad mientras arriba había una caja por aviso, cada
   *    una con su botón «detalles». Con el resumen único [GOV.UK · error
   *    summary] arriba va **el hecho y un enlace**, y el detalle se queda abajo:
   *    dos disparadores para la misma lista eran dos sitios donde abrirla y dos
   *    estados que mantener de acuerdo.
   *
   * Lo que se compra ahora es justo eso: que arriba NO haya disparador, y que
   * el de abajo funcione solo.
   */
  it('⭐ 17 · el detalle está SOLO junto al hito: arriba no hay botón', async () => {
    const fixture = TestBed.createComponent(Buscador);
    await fixture.whenStable();
    const raiz = fixture.nativeElement as HTMLElement;
    await direccionEntera(fixture, http);

    elegirModo(fixture, 'bus');
    botonGenerar(raiz).click();
    fixture.detectChanges();
    drenarRutas(http.match('/api/ruta'), () => VIAJE_CON_TRANSBORDO_Y_DESVIO);
    await fixture.whenStable();

    const nota = raiz.querySelector<HTMLElement>('.paso__nota')!;
    expect(nota).toBeTruthy();
    const suHecho = nota.querySelector<HTMLElement>('.aviso-ruta__hecho')!;
    const suBoton = nota.querySelector<HTMLElement>('.detalles')!;
    const suCuerpo = nota.querySelector<HTMLElement>('.detalles__cuerpo')!;
    expect(suHecho.textContent?.trim()).toBe('La línea 35 va hoy desviada.');
    expect(suBoton.tagName).toBe('BUTTON');
    expect(seVe(suCuerpo)).toBe(false);

    // ⭐ ARRIBA NO HAY NI BOTÓN NI CUERPO: el resumen no despliega nada.
    const resumen = raiz.querySelector<HTMLElement>('.resumen')!;
    expect(resumen).toBeTruthy();
    expect(resumen.querySelector('.detalles')).toBeNull();
    expect(resumen.querySelector('.detalles__cuerpo')).toBeNull();

    // ⭐ Y hay UN solo disparador en toda la pantalla, el del hito.
    expect(raiz.querySelectorAll('.detalles').length).toBe(1);

    // El de abajo abre y cierra lo suyo.
    suBoton.click();
    fixture.detectChanges();
    expect(seVe(suCuerpo)).toBe(true);
    suBoton.click();
    fixture.detectChanges();
    expect(seVe(suCuerpo)).toBe(false);
  });

  it('⭐ el aviso se enseña TAMBIÉN cuando la ruta sale', async () => {
    const fixture = TestBed.createComponent(Buscador);
    await fixture.whenStable();
    const raiz = fixture.nativeElement as HTMLElement;
    await direccionEntera(fixture, http);

    // ── El D-G del BiZi: hay ruta, hay hitos, y hay que decir que se va a ciegas.
    elegirModo(fixture, 'bizi');
    botonGenerar(raiz).click();
    fixture.detectChanges();
    drenarRutas(http.match('/api/ruta'), () => VIAJE_EN_BIZI_A_CIEGAS);
    await fixture.whenStable();

    const avisos = () => resumenEnPantalla(raiz);
    expect(raiz.querySelectorAll('.paso').length).toBeGreaterThan(0);
    expect(avisos()).toContain(
      'No hemos podido preguntar cuántas bicis hay ahora mismo: disponibilidad no verificada.',
    );
    // Y los hitos, pelados: es lo que el aviso está explicando.
    const textos = Array.from(raiz.querySelectorAll('.paso__texto')).map((p) =>
      (p.textContent ?? '').replace(/\s+/g, ' ').trim(),
    );
    expect(textos).toContain('Coge una bici en la estación Tauromaquia');

    // ── Y el otro de la misma clase: la bici sin aparcabicis cerca.
    elegirModo(fixture, 'bici');
    botonGenerar(raiz).click();
    fixture.detectChanges();
    drenarRutas(http.match('/api/ruta'), () => SIN_APARCABICIS_CERCA);
    await fixture.whenStable();

    expect(raiz.querySelectorAll('.paso').length).toBeGreaterThan(0);
    expect(avisos().join(' ')).toContain('la ruta llega hasta la puerta');
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

    elegirModo(fixture, 'bici');
    botonGenerar(raiz).click();
    fixture.detectChanges();
    drenarRutas(http.match('/api/ruta'), () => ({ ...TRAYECTO, modo: 'bici' }));
    await fixture.whenStable();
    expect(raiz.querySelector('.ruta__duracion')?.textContent).toContain('18 km/h');

    elegirModo(fixture, 'bizi');
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

    elegirModo(fixture, 'bici');
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

    elegirModo(fixture, 'bizi');
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
   * ⭐ EL BUS YA LLAMA AL MOTOR — el punto 10 aterrizó (31/08).
   *
   * ⚠️ **Esta juez decía lo contrario hasta hoy**, y la que decía lo contrario
   * llevaba escrito el día en que dejaría de valer: *«Bus llega con el punto 10
   * del plan y coche con el 11; ese día la fila pierde su `todavia` y empieza a
   * viajar como las demás.»* El bus llegó —casilla 3b, y la 3c le enchufó el
   * dato vivo—, así que la fila ha perdido su `todavia`.
   *
   * ⚠️ **Y el coche tampoco, desde el 3/09**: el punto 12 aterrizó —casillas 1a,
   * 1b y 2— y su fila perdió el `todavia` igual que la del bus. La juez que
   * compraba el corte está justo debajo, dada la vuelta. Lo que se compra aquí
   * sigue siendo que el corte era de cada uno por su lado y no un interruptor
   * de los dos: el bus dejó de cortarse el 31/08 y el coche tres días después.
   */
  it('⭐ el bus YA llama a /api/ruta: el punto 10 aterrizó', async () => {
    const fixture = TestBed.createComponent(Buscador);
    await fixture.whenStable();
    const raiz = fixture.nativeElement as HTMLElement;

    elegirModo(fixture, 'bus');
    await direccionEntera(fixture, http);
    botonGenerar(raiz).click();
    fixture.detectChanges();
    drenarRutas(http.match('/api/ruta'), () => VIAJE_EN_BUS_SIN_LA_29);
    await fixture.whenStable();

    expect(raiz.querySelector('.pasos__modo')?.textContent).toContain('Bus / Tranvía');
    // Y lo que se pinta es lo que el motor contestó, no un «todavía no».
    expect(raiz.querySelectorAll('.paso').length).toBe(5);
    // El bus ya viaja: lo que hay arriba son los avisos del motor sobre el
    // viaje, no un «todavía no» de la pantalla.
    expect(avisosDeRuta(raiz)).toEqual([]);
  });

  /**
   * ⭐ EL COCHE YA LLAMA AL MOTOR — el punto 12 aterrizó (3/09).
   *
   * ⚠️ **Esta juez decía lo contrario hasta hoy**, y la que lo decía llevaba
   * escrito el día en que dejaría de valer: *«coche llega con el punto 11; ese
   * día la fila pierde su `todavia` y empieza a viajar como las demás»*. Llegó
   * con el 12 —la 1a cocinó la red, la 1b hizo el viaje y la 2 el remate—, así
   * que ya no hay ningún modo con `todavia`: los seis viajan.
   *
   * Lo que se compra es que **lo que se pinta es lo que el motor contestó**, y
   * no una frase escrita en la pantalla.
   */
  it('⭐ el coche YA llama a /api/ruta: el punto 12 aterrizó', async () => {
    const fixture = TestBed.createComponent(Buscador);
    await fixture.whenStable();
    const raiz = fixture.nativeElement as HTMLElement;

    elegirModo(fixture, 'coche');
    tragarLaZona();
    await direccionEntera(fixture, http);
    botonGenerar(raiz).click();
    fixture.detectChanges();
    const peticiones = http.match('/api/ruta');
    expect(peticiones.length).toBe(1);
    expect((peticiones[0]!.request.body as { modo: string }).modo).toBe('coche');
    drenarRutas(peticiones, () => VIAJE_EN_COCHE_LEJOS);
    await fixture.whenStable();

    expect(raiz.querySelector('.pasos__modo')?.textContent).toContain('Coche');
    // Y lo que hay debajo son SUS pasos, no un «todavía no».
    expect(raiz.querySelectorAll('.paso').length).toBe(2);
    expect(resumenEnPantalla(raiz)).toEqual([]);
    expect(avisosDeRuta(raiz)).toEqual([]);
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

    elegirModo(fixture, 'bici');
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
    elegirModo(fixture, 'patin');
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

  // ══ EL BOTÓN «PRÓXIMO BUS» Y SU REGIÓN DE ESTADO (1/09) ═══════════════════
  //
  // El Generar pregunta a Avanza por un solo poste —el primero—, así que lo de
  // los demás se pide **a petición**: una acción iniciada por quien mira. Eso
  // arrastra la anatomía accesible entera, y es lo que estas cinco compran.

  /** Deja la pantalla con el viaje en bus pintado y devuelve su raíz. */
  async function conElViajeEnBus(fixture: any, t: Trayecto): Promise<HTMLElement> {
    const raiz = fixture.nativeElement as HTMLElement;
    await direccionEntera(fixture, http);
    elegirModo(fixture, 'bus');
    botonGenerar(raiz).click();
    fixture.detectChanges();
    drenarRutas(http.match('/api/ruta'), () => t);
    await fixture.whenStable();
    return raiz;
  }

  const botonVivo = (raiz: HTMLElement): HTMLButtonElement =>
    raiz.querySelector<HTMLButtonElement>('.vivo__boton')!;
  const regionVivo = (raiz: HTMLElement): HTMLElement =>
    raiz.querySelector<HTMLElement>('.vivo__estado')!;

  /**
   * ⭐ 18 · LA REGIÓN EXISTE **ANTES** DE PULSAR.
   *
   * [WCAG 4.1.3 Status Messages] un mensaje de estado tiene que poder anunciarse
   * sin robar el foco, y para eso la región viva tiene que estar **en el DOM
   * antes de la actualización**: si se crea al mismo tiempo que su contenido, el
   * lector de pantalla no tiene nada que estuviera observando y no anuncia nada.
   *
   * Es la misma mecánica del `hidden` del desvío —el contenedor existe cerrado—
   * y por la misma razón: `aria-controls` y `aria-live` necesitan un elemento
   * que exista, no uno que aparecerá.
   */
  it('⭐ 18 · la región de estado existe antes de pulsar, y el botón la señala', async () => {
    const fixture = TestBed.createComponent(Buscador);
    await fixture.whenStable();
    const raiz = await conElViajeEnBus(fixture, VIAJE_EN_BUS_CON_BOTON);

    const boton = botonVivo(raiz);
    const region = regionVivo(raiz);
    expect(boton).not.toBeNull();
    expect(region).not.toBeNull();
    expect(region.getAttribute('role')).toBe('status');
    // ⚠️ **Y `display` distinto de `none`, que es lo que de verdad se compra.**
    //    `querySelector` encuentra el elemento igual esté pintado o no, y con eso
    //    esta juez estuvo verde mientras `.vivo__estado:empty { display: none }`
    //    dejaba la región vacía **fuera del árbol de accesibilidad** — medido en
    //    Chrome: dos `role=status` con la región vacía, tres al darle texto. Una
    //    región que entra en el árbol a la vez que su contenido no se anuncia,
    //    que es justo lo que 4.1.3 prohíbe. Ver la entrada del 1/09 en
    //    `docs/BITACORA.md`, y su hermana del 31/08 sobre `hidden`.
    //
    // ⚠️ **Y esa mitad NO se puede comprar aquí**, medido: jsdom no aplica el
    //    CSS del componente, asi que un `getComputedStyle(region).display`
    //    puesto en esta juez sale `block` con la regla mala dentro — lo probé y
    //    la juez siguió verde. Vive donde hay pixeles: la juez 7 de
    //    `app/e2e/proximo-bus.mjs`. Aqui se compra lo que aqui se puede ver.
    expect(region.textContent).toBe('');
    // Y el botón dice CUÁL abre, por su id: sin esto, con dos subidas no se
    // sabría de cuál habla el anuncio.
    expect(boton.getAttribute('aria-controls')).toBe(region.id);
    expect(region.id).not.toBe('');

    // Al pulsar, la región se llena con el texto que el motor compone.
    boton.click();
    fixture.detectChanges();
    const pedida = http.expectOne((r) => r.url === '/api/poste-vivo');
    expect(pedida.request.method).toBe('GET');
    expect(pedida.request.params.get('poste')).toBe('1203');
    expect(pedida.request.params.get('linea')).toBe('29');
    pedida.flush(LLEGA);
    await fixture.whenStable();

    expect(regionVivo(raiz).textContent).toContain('próximo en 4 min (dato de las 15:45)');
  });

  /**
   * ⭐ 19 · DURANTE LA CARGA: `aria-busy`, el botón **enfocable**, y un clic de
   * más que no dispara nada.
   *
   * [MDN `aria-busy`] mientras vale `true` la región no se anuncia a medias; al
   * pasar a `false` se anuncia el resultado, una vez.
   *
   * ⚠️ **Y el botón NO se deshabilita.** Un `disabled` lo saca del orden de
   *    tabulación, y quien navega con teclado pierde el sitio donde estaba
   *    justo cuando acaba de pulsar. Es la variante «loading button» de siempre:
   *    el botón sigue ahí, sigue enfocable, y los clics de más **se interceptan
   *    en vuelo** — que es lo que aquí se compra contando peticiones.
   */
  it('⭐ 19 · durante la carga: aria-busy, botón enfocable y sin consulta doble', async () => {
    const fixture = TestBed.createComponent(Buscador);
    await fixture.whenStable();
    const raiz = await conElViajeEnBus(fixture, VIAJE_EN_BUS_CON_BOTON);

    expect(regionVivo(raiz).getAttribute('aria-busy')).toBe('false');

    botonVivo(raiz).click();
    fixture.detectChanges();

    expect(regionVivo(raiz).getAttribute('aria-busy')).toBe('true');
    expect(botonVivo(raiz).disabled).toBe(false);
    expect(botonVivo(raiz).hasAttribute('disabled')).toBe(false);

    // El clic de más, en vuelo: no sale una segunda petición.
    botonVivo(raiz).click();
    fixture.detectChanges();
    const enVuelo = http.match((r) => r.url === '/api/poste-vivo');
    expect(enVuelo.length).toBe(1);

    enVuelo[0].flush(LLEGA);
    await fixture.whenStable();
    expect(regionVivo(raiz).getAttribute('aria-busy')).toBe('false');

    // Y al terminar vuelve a disparar: pulsar otra vez es preguntar otra vez.
    // ⚠️ **Nada se guarda** — es la regla del BiZi: un minuto de hace cuarenta
    //    segundos se lee como si fuera de ahora, y por eso es peor que no tenerlo.
    botonVivo(raiz).click();
    fixture.detectChanges();
    const segunda = http.match((r) => r.url === '/api/poste-vivo');
    expect(segunda.length).toBe(1);
    segunda[0].flush({ clase: 'ausente', texto: 'Avanza no anuncia ningún próximo…' });
    await fixture.whenStable();
    expect(regionVivo(raiz).textContent).toContain('Avanza no anuncia');
  });

  /**
   * ⭐ 20 · EN EL TRANVÍA NO HAY BOTÓN.
   *
   * Sin `aQuienPreguntar` no hay a quién preguntar, y un botón que solo pudiera
   * contestar «no lo sé» promete un dato que no existe. El motor no manda el
   * campo y la pantalla no pinta el botón: una sola decisión, tomada donde se
   * sabe qué postes cubre Avanza.
   */
  it('⭐ 20 · en tranvía no se pinta el botón ni su región', async () => {
    const fixture = TestBed.createComponent(Buscador);
    await fixture.whenStable();
    const raiz = await conElViajeEnBus(fixture, VIAJE_EN_TRANVIA);

    expect(raiz.querySelector('.paso')).not.toBeNull();
    expect(raiz.querySelectorAll('.vivo__boton').length).toBe(0);
    expect(raiz.querySelectorAll('.vivo__estado').length).toBe(0);
  });

  /**
   * ⭐ 21 · EL INDICADOR APARECE SI TARDA, y no si contesta rápido.
   *
   * [NN/g] por debajo de un segundo la respuesta se siente inmediata y no hace
   * falta decir nada; **por encima de uno hay que indicar que se está
   * trabajando**, o la pantalla parece rota. Avanza tarda entre 0 y 8 s
   * medidos, así que los dos casos ocurren de verdad.
   *
   * ⚠️ El indicador va `aria-hidden`: es el estado intermedio que la región,
   *    ocupada, no anuncia. Decirlo dos veces sería anunciar el trámite.
   */
  it('⭐ 21 · el indicador sale con respuesta lenta y no con rápida', async () => {
    const fixture = TestBed.createComponent(Buscador);
    await fixture.whenStable();
    const raiz = await conElViajeEnBus(fixture, VIAJE_EN_BUS_CON_BOTON);

    // 1 · RÁPIDA: se contesta enseguida, y no se llega a decir nada.
    botonVivo(raiz).click();
    fixture.detectChanges();
    expect(raiz.querySelector('.vivo__tarda')).toBeNull();
    http.expectOne((r) => r.url === '/api/poste-vivo').flush(LLEGA);
    await fixture.whenStable();
    expect(raiz.querySelector('.vivo__tarda')).toBeNull();

    // 2 · LENTA: pasa el segundo con la respuesta sin llegar.
    //
    // ⚠️ **Con el reloj de VERDAD, y cuesta 1,1 s de prueba.** Los relojes
    //    falsos de Vitest congelan también los `setTimeout` con los que Angular
    //    programa su detección de cambios, y la juez moría en «timed out» sin
    //    llegar a mirar nada. Se paga el segundo y se mide el umbral real, que
    //    además es lo que se quiere comprar: que sea ESE umbral y no otro.
    botonVivo(raiz).click();
    fixture.detectChanges();
    const enVuelo = http.expectOne((r) => r.url === '/api/poste-vivo');
    await new Promise((sigue) => setTimeout(sigue, CUANDO_SE_DICE_QUE_TARDA_MS + 150));
    fixture.detectChanges();

    const tarda = raiz.querySelector('.vivo__tarda');
    expect(tarda).not.toBeNull();
    expect(tarda!.getAttribute('aria-hidden')).toBe('true');

    // Y cuando llega, el indicador se va.
    enVuelo.flush(LLEGA);
    await fixture.whenStable();
    expect(raiz.querySelector('.vivo__tarda')).toBeNull();
    expect(regionVivo(raiz).textContent).toContain('próximo en 4 min');
  });

  /**
   * ⭐ 22 · LA REGIÓN **NACE CON EL DATO** que el Generar ya trajo.
   *
   * Del primer poste sí se preguntó en el Generar, y ese dato viaja en el paso.
   * Nacer vacía obligaría a pulsar para ver algo que ya se sabe — y peor: la
   * primera pulsación no parecería cambiar nada.
   */
  it('⭐ 22 · la región nace con lo que el Generar ya trajo del primer poste', async () => {
    const fixture = TestBed.createComponent(Buscador);
    await fixture.whenStable();
    const conElVivo: Trayecto = {
      ...VIAJE_EN_BUS_CON_BOTON,
      pasos: VIAJE_EN_BUS_CON_BOTON.pasos.map((x) =>
        x.giro === 'sube' ? { ...x, vivo: LLEGA } : x,
      ),
    };
    const raiz = await conElViajeEnBus(fixture, conElVivo);

    expect(regionVivo(raiz).textContent).toContain('próximo en 4 min (dato de las 15:45)');
    // Y sin haber pulsado nada: el Generar no vuelve a preguntar por su cuenta.
    http.expectNone((r) => r.url === '/api/poste-vivo');
  });


  /**
   * ═════════════════════════════════════════════════════════════════════════
   *  LA PANTALLA DEL COCHE (3/09, punto 12 casilla 3)
   * ═════════════════════════════════════════════════════════════════════════
   */

  /**
   * ⭐ JUEZ 1 — ELEGIR COCHE REVELA DOS PREGUNTAS, y los demás modos ninguna.
   *
   * Es el cuarto sitio donde vive el mismo patrón [DOC GOV.UK, revelado
   * condicional] —el número de portal, «¿Qué ruta prefieres?», «¿Qué bici?» y
   * esto—, y el argumento es el de siempre: lo que no aplica **no está**, no
   * está en gris. Dos grupos de radios colgando bajo «Andando» ocuparían su
   * hueco y se leerían como «esto podrías tocarlo».
   */
  it('⭐ 1 · el coche revela las dos preguntas, y los otros modos no', async () => {
    const fixture = TestBed.createComponent(Buscador);
    await fixture.whenStable();
    const raiz = fixture.nativeElement as HTMLElement;

    for (const modo of ['andando', 'bus', 'bici', 'bizi', 'patin'] as const) {
      elegirModo(fixture, modo);
      expect(radiosDeAparcamiento(raiz).length).toBe(0);
      expect(radiosDeDistintivo(raiz).length).toBe(0);
    }

    elegirModo(fixture, 'coche');
    tragarLaZona();
    expect(radiosDeAparcamiento(raiz).map((r) => r.value)).toEqual([
      'azul',
      'naranja',
      'discapacitado',
      'gratuito',
    ]);
    expect(radiosDeDistintivo(raiz).map((r) => r.value)).toEqual([
      'cero',
      'eco',
      'c',
      'b',
      'sin',
      'nolose',
    ]);
    // Y las dos preguntas son GRUPOS DE VERDAD: `fieldset` con su leyenda, que
    // es lo que le da al navegador la conducta del patrón y al lector el nombre
    // de la pregunta.
    expect(raiz.querySelector('fieldset.aparcamientos legend')?.textContent).toContain(
      '¿Dónde quieres aparcar?',
    );
    expect(raiz.querySelector('fieldset.distintivos legend')?.textContent).toContain(
      '¿Distintivo ambiental?',
    );

    // Y al salirse del coche desaparecen otra vez.
    elegirModo(fixture, 'andando');
    expect(radiosDeAparcamiento(raiz).length).toBe(0);
    expect(radiosDeDistintivo(raiz).length).toBe(0);
  });

  /**
   * ⭐ JUEZ 2 — CADA RESPUESTA MANDA LO SUYO, y **nada viene preseleccionado**.
   *
   * [GOV.UK] en una pregunta no se preinfluye: marcar «Sin etiqueta» de
   * antemano le diría al motor que el coche de quien pregunta no puede entrar
   * en la ZBE sin que nadie lo haya dicho, y marcar «Zona azul» le pondría un
   * remate que no ha pedido. Sin tocar nada, **los dos parámetros se omiten** y
   * lo que sale es el viaje de la casilla 1b.
   *
   * Y «No lo sé» **no es un `false`**: es la ausencia del parámetro, que es la
   * conducta de siempre —el motor avisa y no veta—. Traducirlo a `false` sería
   * decidir por quien no ha querido decidir.
   */
  it('⭐ 2 · cada etiqueta y cada parking mandan lo suyo; nada preseleccionado', async () => {
    const fixture = TestBed.createComponent(Buscador);
    await fixture.whenStable();
    const raiz = fixture.nativeElement as HTMLElement;

    elegirModo(fixture, 'coche');
    tragarLaZona();
    await direccionEntera(fixture, http);

    // Nada marcado al llegar.
    expect(radiosDeAparcamiento(raiz).filter((r) => r.checked).length).toBe(0);
    expect(radiosDeDistintivo(raiz).filter((r) => r.checked).length).toBe(0);

    // Y sin tocar nada, los dos parámetros NO viajan.
    botonGenerar(raiz).click();
    fixture.detectChanges();
    const pelada = http.match('/api/ruta');
    expect(Object.keys(cuerpoDeLaRuta(pelada)).sort()).toEqual(['destino', 'modo', 'origen']);
    drenarRutas(pelada, () => VIAJE_EN_COCHE_LEJOS);
    await fixture.whenStable();

    // Las seis etiquetas, una a una, con lo que cada una significa.
    const loQueManda: readonly (readonly [string, boolean | undefined])[] = [
      ['cero', true],
      ['eco', true],
      ['c', true],
      ['b', true],
      ['sin', false],
      ['nolose', undefined],
    ];
    for (const [etiqueta, espera] of loQueManda) {
      pulsar(fixture, radiosDeDistintivo(raiz), etiqueta);
      botonGenerar(raiz).click();
      fixture.detectChanges();
      const peticiones = http.match('/api/ruta');
      const cuerpo = cuerpoDeLaRuta(peticiones);
      expect(cuerpo['puedeEntrarEnLaZbe']).toBe(espera);
      if (espera === undefined) {
        expect('puedeEntrarEnLaZbe' in cuerpo).toBe(false);
      }
      drenarRutas(peticiones, () => VIAJE_EN_COCHE_LEJOS);
      await fixture.whenStable();
    }

    // Y los cuatro tipos de aparcamiento, que viajan tal cual: sus ids SON los
    // del contrato, no una traducción.
    for (const tipo of ['azul', 'naranja', 'discapacitado', 'gratuito'] as const) {
      pulsar(fixture, radiosDeAparcamiento(raiz), tipo);
      botonGenerar(raiz).click();
      fixture.detectChanges();
      const peticiones = http.match('/api/ruta');
      expect(cuerpoDeLaRuta(peticiones)['aparcamiento']).toBe(tipo);
      drenarRutas(peticiones, () => VIAJE_EN_COCHE_LEJOS);
      await fixture.whenStable();
    }
  });

  /**
   * ⭐ JUEZ 3 — EL REMATE, PINTADO: el hito y el aviso **en su paso**.
   *
   * El aviso del motor viene con `paso: 2`, y el 2 **no es un hito**. Hasta hoy
   * la nota solo se colgaba de un hito porque el reparto se hacía leyendo el
   * texto del aviso y buscando el sitio que nombra — y un paso de «Continúa por
   * el Paseo de la Independencia» no nombra nada. Con `Aviso.paso` no hay nada
   * que adivinar.
   */
  it('⭐ 3 · el destino dentro de la zona pinta el remate y el aviso en su paso', async () => {
    const fixture = TestBed.createComponent(Buscador);
    await fixture.whenStable();
    const raiz = fixture.nativeElement as HTMLElement;

    elegirModo(fixture, 'coche');
    tragarLaZona();
    await direccionEntera(fixture, http);
    pulsar(fixture, radiosDeDistintivo(raiz), 'sin');
    botonGenerar(raiz).click();
    fixture.detectChanges();
    drenarRutas(http.match('/api/ruta'), () => VIAJE_EN_COCHE_CON_REMATE);
    await fixture.whenStable();

    // El hito, con su frase del motor y su icono, como el de la bici.
    const hito = Array.from(raiz.querySelectorAll<HTMLElement>('.paso')).find((li) =>
      (li.querySelector('.paso__texto')?.textContent ?? '').startsWith('Aparca'),
    );
    expect(hito).toBeTruthy();
    expect((hito!.querySelector('.paso__texto')?.textContent ?? '').replace(/\s+/g, ' ')).toContain(
      'Aparca en el aparcamiento público Plaza del Pilar - Juzgados',
    );
    expect(hito!.querySelector('.paso__flecha')?.textContent?.trim()).not.toBe('');

    // ⭐ Y LA NOTA VA EN EL PASO 2, que es el que dice `Aviso.paso`.
    const notas = notasPorPaso(raiz);
    expect([...notas.keys()]).toEqual([2]);
    expect(notas.get(2)).toContain('Tu destino queda dentro de la Zona de Bajas Emisiones');

    // Y arriba, el resumen enlaza a ese mismo paso.
    expect(resumenEnPantalla(raiz)[0]).toContain('Esta ruta remata en el aparcamiento público');
    expect(adondeLlevaElResumen(raiz)).toEqual(['#paso-2']);
  });

  /**
   * ⭐ JUEZ 4 — EL AVISO POSITIVO: solo con etiqueta buena **Y** ruta que pisa.
   *
   * [FAQ de la sede] *«B, C, ECO o CERO: libre acceso, circulación y
   * estacionamiento sin necesidad de registrarse»*. Decírselo a quien ha dicho
   * que tiene una de las cuatro es contestar su pregunta; decírselo a quien va
   * por Miralbueno es ruido sobre una zona que no va a ver.
   */
  it('⭐ 4 · el aviso positivo, solo con etiqueta buena y ruta que pisa la zona', async () => {
    const fixture = TestBed.createComponent(Buscador);
    await fixture.whenStable();
    const raiz = fixture.nativeElement as HTMLElement;

    elegirModo(fixture, 'coche');
    tragarLaZona();
    await direccionEntera(fixture, http);

    // (a) etiqueta buena + ruta que pisa → sale.
    pulsar(fixture, radiosDeDistintivo(raiz), 'b');
    botonGenerar(raiz).click();
    fixture.detectChanges();
    drenarRutas(http.match('/api/ruta'), () => VIAJE_EN_COCHE_POR_LA_ZBE);
    await fixture.whenStable();
    expect(resumenEnPantalla(raiz).join(' | ')).toContain(
      'Tu distintivo B circula libre por la ZBE, sin registro',
    );

    // (b) la misma etiqueta, ruta que NO pisa → no sale.
    botonGenerar(raiz).click();
    fixture.detectChanges();
    drenarRutas(http.match('/api/ruta'), () => VIAJE_EN_COCHE_LEJOS);
    await fixture.whenStable();
    expect(resumenEnPantalla(raiz).join(' | ')).not.toContain('circula libre por la ZBE');

    // (c) ruta que pisa, pero SIN etiqueta buena → tampoco.
    pulsar(fixture, radiosDeDistintivo(raiz), 'nolose');
    botonGenerar(raiz).click();
    fixture.detectChanges();
    drenarRutas(http.match('/api/ruta'), () => VIAJE_EN_COCHE_POR_LA_ZBE);
    await fixture.whenStable();
    expect(resumenEnPantalla(raiz).join(' | ')).not.toContain('circula libre por la ZBE');
    // Y lo que sí sale es el aviso del motor, que informa de la norma.
    expect(resumenEnPantalla(raiz)[0]).toContain('La ruta atraviesa la Zona de Bajas Emisiones');
  });

  /**
   * ⚠️ **AQUÍ VIVÍA LA JUEZ 5 DE LA CASILLA 3, Y SE HA IDO CON SU TEMA** (3/09).
   *
   * Compraba el enlace «Consulta tu etiqueta en la DGT» que colgaba de la
   * pregunta del distintivo: que existiera solo con coche, que saliera en
   * pestaña nueva y que su URL fuera la medida —la de manual contesta 200 con
   * una página «Page Not Found»—.
   *
   * El enlace sobró en cuanto **la consulta entró en casa** (`cdc49d8`): el
   * botón «Consultar distintivo» hace aquí, sin salir de la pantalla, lo mismo
   * que aquel enlace mandaba a hacer fuera. Una juez de algo que ya no existe
   * es una juez que solo puede ponerse roja el día que alguien limpie, así que
   * se retira con lo que vigilaba.
   *
   * **Lo que NO se ha ido es la cita a la DGT**: la región de estado dice
   * «Fuente: DGT» con su hora, y eso es la atribución que su aviso legal exige
   * —reproducción fiel y cita de la fuente—. La compra la juez 6.
   */

  /**
   * ⭐ JUEZ 7 — LA MURALLA: las dos preguntas nuevas no se le cuelan a nadie.
   *
   * Ni al cuerpo de la petición de los otros cinco modos —que sigue siendo
   * `origen`, `destino`, `modo` y, en los que eligen, `ruta`— ni a la pantalla.
   */
  it('⭐ 7 · los otros cinco modos mandan lo mismo que mandaban', async () => {
    const fixture = TestBed.createComponent(Buscador);
    await fixture.whenStable();
    const raiz = fixture.nativeElement as HTMLElement;

    // Se contesta la pregunta del coche PRIMERO, para que se note si se filtra.
    elegirModo(fixture, 'coche');
    tragarLaZona();
    await direccionEntera(fixture, http);
    pulsar(fixture, radiosDeDistintivo(raiz), 'sin');
    pulsar(fixture, radiosDeAparcamiento(raiz), 'azul');
    botonGenerar(raiz).click();
    fixture.detectChanges();
    drenarRutas(http.match('/api/ruta'), () => VIAJE_EN_COCHE_CON_REMATE);
    await fixture.whenStable();

    for (const modo of ['andando', 'bus', 'patin'] as const) {
      elegirModo(fixture, modo);
      botonGenerar(raiz).click();
      fixture.detectChanges();
      const peticiones = http.match('/api/ruta');
      expect(Object.keys(cuerpoDeLaRuta(peticiones)).sort()).toEqual([
        'destino',
        'modo',
        'origen',
      ]);
      drenarRutas(peticiones, () => ({ ...TRAYECTO, modo }));
      await fixture.whenStable();
    }

    for (const modo of ['bici', 'bizi'] as const) {
      elegirModo(fixture, modo);
      botonGenerar(raiz).click();
      fixture.detectChanges();
      const peticiones = http.match('/api/ruta');
      expect(Object.keys(cuerpoDeLaRuta(peticiones)).sort()).toEqual([
        'destino',
        'modo',
        'origen',
        'ruta',
      ]);
      drenarRutas(peticiones, () => ({ ...TRAYECTO, modo }));
      await fixture.whenStable();
    }
  });

  /**
   * ⭐ JUEZ 1 (pantalla) — LA ZONA SOLO LLEGA AL MAPA CON COCHE.
   *
   * Y se pide **una sola vez**: es un fichero estático de 2,9 kB, el mismo con
   * el que el motor marca las aristas (§ 1.30). Volver a pedirlo cada vez que
   * se toca el selector sería tráfico por nada.
   */
  it('⭐ 1 · el polígono de la zona se baja con coche, una vez, y no llega a los demás', async () => {
    const fixture = TestBed.createComponent(Buscador);
    await fixture.whenStable();
    const raiz = fixture.nativeElement as HTMLElement;

    // Al arrancar en andando, nadie pide la capa.
    http.expectNone((r) => r.url.includes('MU1_ZBE'));
    expect(raiz.querySelectorAll('.leaflet-zbe-pane path').length).toBe(0);

    elegirModo(fixture, 'coche');
    const capa = http.expectOne((r) => r.url.includes('MU1_ZBE'));
    expect(capa.request.method).toBe('GET');
    capa.flush(LA_FASE_1);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(raiz.querySelectorAll('.leaflet-zbe-pane path').length).toBe(1);

    // Al salirse del coche, el polígono se va — pero no se vuelve a pedir.
    elegirModo(fixture, 'andando');
    fixture.detectChanges();
    await fixture.whenStable();
    expect(raiz.querySelectorAll('.leaflet-zbe-pane path').length).toBe(0);

    elegirModo(fixture, 'coche');
    fixture.detectChanges();
    await fixture.whenStable();
    http.expectNone((r) => r.url.includes('MU1_ZBE'));
    expect(raiz.querySelectorAll('.leaflet-zbe-pane path').length).toBe(1);
  });

  /**
   * ⭐ JUEZ 4 — LA PREGUNTA DE LA AUTORIZACIÓN, solo con [Sin etiqueta].
   *
   * Es el quinto revelado condicional de esta pantalla [GOV.UK], y el que más
   * se justifica: **solo tiene sentido para quien no tiene distintivo**. A quien
   * ha dicho que lleva una B preguntarle si está registrado sería ofrecerle un
   * trámite que no necesita — [§ 1.32] *«Si su vehículo tiene derecho a
   * distintivo ambiental, NO NECESITA Y NO PUEDE OBTENER autorización
   * registral»*, literal.
   *
   * Y el motor sigue siendo binario: de los catorce casos del trámite, lo único
   * que puede preguntar es si se puede entrar o no.
   */
  it('⭐ 4 · la autorización se pregunta solo sin etiqueta, y manda lo suyo', async () => {
    const fixture = TestBed.createComponent(Buscador);
    await fixture.whenStable();
    const raiz = fixture.nativeElement as HTMLElement;

    elegirModo(fixture, 'coche');
    tragarLaZona();
    await direccionEntera(fixture, http);

    // Sin contestar el distintivo, la pregunta no está.
    expect(radiosDeAutorizacion(raiz).length).toBe(0);

    // Ni con una etiqueta buena: quien la tiene no puede registrarse.
    for (const etiqueta of ['cero', 'eco', 'c', 'b'] as const) {
      pulsar(fixture, radiosDeDistintivo(raiz), etiqueta);
      expect(radiosDeAutorizacion(raiz).length).toBe(0);
    }

    // Con «No lo sé» tampoco: no se sabe si hace falta.
    pulsar(fixture, radiosDeDistintivo(raiz), 'nolose');
    expect(radiosDeAutorizacion(raiz).length).toBe(0);

    // ⭐ Y con «Sin etiqueta», sí — y sin nada marcado.
    pulsar(fixture, radiosDeDistintivo(raiz), 'sin');
    expect(radiosDeAutorizacion(raiz).map((r) => r.value)).toEqual(['si', 'no']);
    expect(radiosDeAutorizacion(raiz).filter((r) => r.checked).length).toBe(0);
    expect(raiz.querySelector('fieldset.autorizaciones legend')?.textContent).toContain(
      '¿Tienes autorización registrada en la ZBE?',
    );

    // Sin contestarla, lo que viaja es lo que «Sin etiqueta» ya decía: false.
    botonGenerar(raiz).click();
    fixture.detectChanges();
    const sinContestar = http.match('/api/ruta');
    expect(cuerpoDeLaRuta(sinContestar)['puedeEntrarEnLaZbe']).toBe(false);
    drenarRutas(sinContestar, () => VIAJE_EN_COCHE_LEJOS);
    await fixture.whenStable();

    // «No» dice lo mismo, y «Sí» lo contrario.
    for (const [respuesta, espera] of [['no', false], ['si', true]] as const) {
      pulsar(fixture, radiosDeAutorizacion(raiz), respuesta);
      botonGenerar(raiz).click();
      fixture.detectChanges();
      const peticiones = http.match('/api/ruta');
      expect(cuerpoDeLaRuta(peticiones)['puedeEntrarEnLaZbe']).toBe(espera);
      drenarRutas(peticiones, () => VIAJE_EN_COCHE_POR_LA_ZBE);
      await fixture.whenStable();
    }

    // ⭐ Y con «Sí» y una ruta que pisa la zona, se dice por qué se entra.
    expect(resumenEnPantalla(raiz).join(' | ')).toContain(
      'Entras con tu autorización registrada en la ZBE',
    );

    // Al cambiar a una etiqueta buena, la pregunta se va y su respuesta no manda.
    pulsar(fixture, radiosDeDistintivo(raiz), 'b');
    expect(radiosDeAutorizacion(raiz).length).toBe(0);
    botonGenerar(raiz).click();
    fixture.detectChanges();
    const conB = http.match('/api/ruta');
    expect(cuerpoDeLaRuta(conB)['puedeEntrarEnLaZbe']).toBe(true);
    drenarRutas(conB, () => VIAJE_EN_COCHE_POR_LA_ZBE);
    await fixture.whenStable();
  });

  /**
   * ⭐ LOS DOS TEXTOS QUE LA DGT MANDA, **enteros y medidos** (4/09).
   *
   * No están escritos a mano: salen de pasarle a `atenderDistintivo` los dos
   * cuerpos de la sede que `motor/src/distintivo.spec.ts` guarda —los mismos que
   * se bajaron verbatim el 3/09— y copiar lo que devolvió. Se usan **enteros**
   * porque lo que esta juez compra es justamente que la segunda mitad NO llega a
   * la pantalla: con el texto recortado, la aserción no valdría nada.
   *
   * ⚠️ Esa segunda mitad —*«Pulsa en la imagen del distintivo…»*— es una
   *    instrucción de la web de la DGT, no un dato del vehículo. Aquí no hay
   *    imagen que pulsar. Lo que sí se queda es la cita de la fuente, que es lo
   *    que su aviso legal exige.
   */
  const LA_DGT_CON_UNA_C =
    'El vehículo 0000BBM cumple con los requisitos para obtener el Distintivo ' +
    'Ambiental C. Pulsa en la imagen del distintivo para conocer la información ' +
    'contenida en la etiqueta y los vehículos que tienen derecho a su obtención.';
  const LA_DGT_SIN_DISTINTIVO =
    'Sin distintivo. Tu vehículo no cumple los requisitos para ser etiquetado ' +
    'como vehículo limpio.';

  /**
   * ⭐ JUEZ 6 — LA PANTALLA MARCA EL RADIO SEGÚN LA RESPUESTA, y no lo toca
   * cuando la DGT no sabe.
   *
   * Con etiqueta o sin ella, la respuesta **contesta la pregunta que hay en
   * pantalla**: dejarla sin marcar obligaría a contestarla dos veces. Con
   * `noExiste` o `mudo` no se toca nada — marcar cualquier cosa sería decidir
   * por quien pregunta— y el selector manual se queda donde estaba.
   */
  it('⭐ 6 · la matrícula marca el distintivo, y con mudo no toca nada', async () => {
    const fixture = TestBed.createComponent(Buscador);
    await fixture.whenStable();
    const raiz = fixture.nativeElement as HTMLElement;
    elegirModo(fixture, 'coche');
    tragarLaZona();

    const campo = raiz.querySelector<HTMLInputElement>('input[name="matricula"]')!;
    const boton = raiz.querySelector<HTMLButtonElement>('.matricula__boton')!;
    const region = raiz.querySelector<HTMLElement>('.matricula__estado')!;
    // La región existe ANTES de la respuesta: es lo que la hace anunciable.
    expect(region.getAttribute('role')).toBe('status');
    expect(boton.getAttribute('aria-controls')).toBe(region.id);

    const escribir = (v: string): void => {
      campo.value = v;
      campo.dispatchEvent(new Event('input'));
      fixture.detectChanges();
    };
    const contesta = (cuerpo: object): void => {
      http.expectOne((r) => r.url === '/api/distintivo').flush(cuerpo);
      fixture.detectChanges();
    };

    // (a) Con etiqueta: se marca su radio y se dice, citando a la DGT.
    escribir('0000BBM');
    boton.click();
    fixture.detectChanges();
    expect(region.getAttribute('aria-busy')).toBe('true');
    const conC = http.expectOne((r) => r.url === '/api/distintivo');
    expect(conC.request.params.get('matricula')).toBe('0000BBM');
    conC.flush({
      clase: 'etiqueta',
      distintivo: 'C',
      texto: LA_DGT_CON_UNA_C,
      fuente: 'DGT',
      cuando: new Date('2026-09-04T14:53:00').toISOString(),
    });
    fixture.detectChanges();
    await fixture.whenStable();
    expect(radiosDeDistintivo(raiz).filter((r) => r.checked).map((r) => r.value)).toEqual(['c']);
    // ⭐ LA FRASE ES NUESTRA Y ES CORTA (4/09): la letra y la cita, nada más.
    expect(region.textContent?.trim()).toBe('Distintivo ambiental C (Fuente: DGT, 14:53)');
    // ⭐ Y la prosa de la sede **no se pinta**: manda a pulsar una imagen que
    //    aquí no existe. Es instrucción de SU página, no dato del vehículo.
    expect(region.textContent).not.toContain('Pulsa en la imagen');
    expect(region.textContent).not.toContain('tienen derecho a su obtención');
    // La atribución, en cambio, se queda: es lo que su aviso legal exige.
    expect(region.textContent).toContain('Fuente: DGT');
    expect(region.getAttribute('aria-busy')).toBe('false');

    // (b) Sin distintivo: marca «sin», y con él aparece su pregunta.
    escribir('0000BBC');
    boton.click();
    fixture.detectChanges();
    contesta({
      clase: 'sinDistintivo',
      texto: LA_DGT_SIN_DISTINTIVO,
      fuente: 'DGT',
      cuando: new Date('2026-09-04T14:53:00').toISOString(),
    });
    await fixture.whenStable();
    expect(radiosDeDistintivo(raiz).filter((r) => r.checked).map((r) => r.value)).toEqual(['sin']);
    expect(radiosDeAutorizacion(raiz).length).toBe(2);
    // Y su frase, también nuestra y también corta.
    expect(region.textContent?.trim()).toBe('Sin distintivo ambiental (Fuente: DGT, 14:53)');
    expect(region.textContent).not.toContain('vehículo limpio');

    // (c) No existe: NO se toca el selector, y se dice lo que la DGT dijo.
    escribir('0000BBB');
    boton.click();
    fixture.detectChanges();
    contesta({
      clase: 'noExiste',
      texto: 'No se ha encontrado ningún resultado para la matrícula introducida.',
      fuente: 'DGT',
      cuando: new Date().toISOString(),
    });
    await fixture.whenStable();
    expect(radiosDeDistintivo(raiz).filter((r) => r.checked).map((r) => r.value)).toEqual(['sin']);
    // ⭐ Y aquí el texto SÍ se pinta entero, porque no hay letra que decir: lo
    //    único que hay que contar es lo que pasó. Ver `loDeLaDgtEnPalabras`.
    expect(region.textContent?.trim()).toBe(
      'No se ha encontrado ningún resultado para la matrícula introducida.',
    );

    // (d) Mudo: tampoco, y el texto manda a elegir a mano.
    escribir('0002BGP');
    boton.click();
    fixture.detectChanges();
    contesta({
      clase: 'mudo',
      texto: 'La DGT no ha contestado. Elige tu distintivo a mano, o vuelve a intentarlo.',
      fuente: 'DGT',
      cuando: new Date().toISOString(),
    });
    await fixture.whenStable();
    expect(radiosDeDistintivo(raiz).filter((r) => r.checked).map((r) => r.value)).toEqual(['sin']);
    expect(region.textContent?.trim()).toBe(
      'La DGT no ha contestado. Elige tu distintivo a mano, o vuelve a intentarlo.',
    );

    // ⭐ Y CADA PULSACIÓN CONSULTA: no hay caché ni comparación con la anterior.
    escribir('0000BBM');
    boton.click();
    fixture.detectChanges();
    contesta({
      clase: 'etiqueta',
      distintivo: 'C',
      texto: LA_DGT_CON_UNA_C,
      fuente: 'DGT',
      cuando: new Date().toISOString(),
    });
    await fixture.whenStable();
    boton.click();
    fixture.detectChanges();
    contesta({
      clase: 'etiqueta',
      distintivo: 'C',
      texto: LA_DGT_CON_UNA_C,
      fuente: 'DGT',
      cuando: new Date().toISOString(),
    });
    await fixture.whenStable();
  });

  /**
   * ⭐ JUEZ 7 (pantalla) — LA MATRÍCULA NO SE LE CUELA A `/api/ruta`.
   *
   * Va a un sitio y a uno solo. Ni al cuerpo de la ruta, ni a su URL. Lo que sí
   * viaja es **la consecuencia**: que con una B se puede entrar.
   */
  it('⭐ 7 · la matrícula no viaja a /api/ruta ni a ningún otro sitio', async () => {
    const fixture = TestBed.createComponent(Buscador);
    await fixture.whenStable();
    const raiz = fixture.nativeElement as HTMLElement;
    elegirModo(fixture, 'coche');
    tragarLaZona();
    await direccionEntera(fixture, http);

    const campo = raiz.querySelector<HTMLInputElement>('input[name="matricula"]')!;
    campo.value = '0000BBM';
    campo.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    raiz.querySelector<HTMLButtonElement>('.matricula__boton')!.click();
    fixture.detectChanges();
    http.expectOne((r) => r.url === '/api/distintivo').flush({
      clase: 'etiqueta',
      distintivo: 'B',
      texto: 'El vehículo 0000BBM cumple con los requisitos para obtener el Distintivo Ambiental B.',
      fuente: 'DGT',
      cuando: new Date().toISOString(),
    });
    fixture.detectChanges();
    await fixture.whenStable();

    botonGenerar(raiz).click();
    fixture.detectChanges();
    const peticiones = http.match('/api/ruta');
    for (const p of peticiones) {
      expect(JSON.stringify(p.request.body)).not.toContain('0000BBM');
      expect(p.request.urlWithParams).not.toContain('0000BBM');
    }
    expect(cuerpoDeLaRuta(peticiones)['puedeEntrarEnLaZbe']).toBe(true);
    drenarRutas(peticiones, () => VIAJE_EN_COCHE_POR_LA_ZBE);
    await fixture.whenStable();
  });

  describe('⭐ LA SUGERENCIA CRUZADA AZUL-NARANJA (4/09, punto 12)', () => {
    /**
     * Deja una ruta de coche pintada aparcando en `tipo`, y devuelve la raíz.
     *
     * Es el camino de una persona entero —dirección, modo, radio, Generar— para
     * que la pantalla llegue a la sugerencia por donde se llega de verdad.
     */
    const conRutaAparcando = async (
      fixture: any,
      tipo: 'azul' | 'naranja' | 'discapacitado' | 'gratuito',
    ): Promise<HTMLElement> => {
      const raiz = fixture.nativeElement as HTMLElement;
      pulsar(fixture, radiosDeAparcamiento(raiz), tipo);
      botonGenerar(raiz).click();
      fixture.detectChanges();
      const peticiones = http.match('/api/ruta');
      expect(cuerpoDeLaRuta(peticiones)['aparcamiento']).toBe(tipo);
      drenarRutas(peticiones, () =>
        tipo === 'naranja' ? VIAJE_APARCANDO_EN_NARANJA : VIAJE_APARCANDO_EN_AZUL,
      );
      await fixture.whenStable();
      fixture.detectChanges();
      return raiz;
    };

    /** El texto del hito 🅿 que se está viendo. */
    const hitoPintado = (raiz: HTMLElement): string | null => {
      const textos = Array.from(raiz.querySelectorAll('.paso__texto')).map((e) =>
        (e.textContent ?? '').replace(/\s+/g, ' ').trim(),
      );
      return textos.find((t) => t.startsWith('Aparca')) ?? null;
    };

    /**
     * ⭐ JUEZ 2 — EL BOTÓN EXISTE **SOLO CON UNA DE LAS DOS ZONAS GENERADA**, y
     * nombra la contraria.
     *
     * No es un botón de la botonera: es un atajo que cuelga del hito 🅿 de una
     * ruta que ya existe, así que sin ruta no tiene de qué ser el atajo. Y dice
     * a dónde lleva —«Sugerir zona naranja cercana»— porque [NN/g] una acción se
     * nombra por su resultado, no por su mecanismo.
     */
    it('⭐ 2 · el botón solo está con azul o naranja pintada, y nombra la otra', async () => {
      const fixture = TestBed.createComponent(Buscador);
      await fixture.whenStable();
      const raiz = fixture.nativeElement as HTMLElement;
      elegirModo(fixture, 'coche');
      tragarLaZona();
      await direccionEntera(fixture, http);

      // Sin ruta generada no hay nada de qué sugerir la vuelta.
      expect(botonSugerir(raiz)).toBeNull();

      await conRutaAparcando(fixture, 'azul');
      expect(botonSugerir(raiz)).not.toBeNull();
      expect(botonSugerir(raiz)!.textContent?.trim()).toBe('Sugerir zona naranja cercana');
      // Y cuelga del paso del hito, no del formulario ni del pie.
      expect(raiz.querySelector('.paso .sugerencia__boton')).not.toBeNull();

      await conRutaAparcando(fixture, 'naranja');
      expect(botonSugerir(raiz)!.textContent?.trim()).toBe('Sugerir zona azul cercana');
    });

    /**
     * ⭐ JUEZ 3 — PULSARLO **MUEVE EL RADIO Y GENERA**, que es todo lo que hace.
     *
     * El atajo no tiene camino propio: hace lo mismo que haría una persona
     * marcando la otra opción y pulsando «Generar ruta». Por eso se compran las
     * tres cosas a la vez —el radio marcado, la petición con el otro tipo, y el
     * hito nuevo pintado—: si hiciera dos de las tres, la botonera estaría
     * diciendo una cosa y el mapa otra.
     */
    it('⭐ 3 · pulsarlo marca el radio contrario y dispara un Generar', async () => {
      const fixture = TestBed.createComponent(Buscador);
      await fixture.whenStable();
      const raiz = fixture.nativeElement as HTMLElement;
      elegirModo(fixture, 'coche');
      tragarLaZona();
      await direccionEntera(fixture, http);
      await conRutaAparcando(fixture, 'azul');
      expect(hitoPintado(raiz)).toBe('Aparca en Calle San Blas: zona azul (rotación)');

      // Se pulsa **con el foco puesto**, que es como llega quien va con el
      // teclado: el botón reemplaza todo lo que hay debajo de él, así que si al
      // volver la ruta desapareciera del DOM el foco se caería al `body` y
      // quien navega sin ratón se quedaría al principio de la página sin saber
      // que algo ha cambiado [WCAG 2.4.3, orden del foco].
      botonSugerir(raiz)!.focus();
      botonSugerir(raiz)!.click();
      fixture.detectChanges();

      // 1 · el radio: la botonera dice la verdad de lo que se va a ver.
      const marcados = radiosDeAparcamiento(raiz).filter((r) => r.checked).map((r) => r.value);
      expect(marcados).toEqual(['naranja']);
      // 2 · la petición: lleva el otro tipo, y es una petición de verdad.
      const peticiones = http.match('/api/ruta');
      expect(peticiones.length).toBe(1);
      expect(cuerpoDeLaRuta(peticiones)['aparcamiento']).toBe('naranja');
      // 3 · el hito nuevo, que es de otro montón y lo dice con otra palabra.
      drenarRutas(peticiones, () => VIAJE_APARCANDO_EN_NARANJA);
      await fixture.whenStable();
      fixture.detectChanges();
      expect(hitoPintado(raiz)).toBe(
        'Aparca en Calle Mosen Pedro Dosset: zona naranja (residentes)',
      );
      // Y el botón se da la vuelta con la ruta: ahora ofrece volver.
      expect(botonSugerir(raiz)!.textContent?.trim()).toBe('Sugerir zona azul cercana');
      // 4 · y el foco sigue en él: se puede pulsar otra vez sin buscarlo.
      expect(document.activeElement).toBe(botonSugerir(raiz));
    });

    /**
     * ⭐ JUEZ 4 — IDA Y VUELTA SON **DOS GENERACIONES**, cada una con la suya.
     *
     * ⚠️ **Y es lo que la contraprueba del caché muerde.** Guardar la respuesta
     *    de la ida para devolverla en la vuelta parece un ahorro y es una
     *    mentira: la ruta del bordillo depende de dónde queda libre el mejor
     *    tramo, y eso es una pregunta al motor, no un recuerdo. `generarRuta` no
     *    cachea nada — lo primero que hace es tirar el resultado anterior— y
     *    este atajo no puede ser la excepción.
     */
    it('⭐ 4 · dos pulsaciones son dos generaciones, con sus dos peticiones', async () => {
      const fixture = TestBed.createComponent(Buscador);
      await fixture.whenStable();
      const raiz = fixture.nativeElement as HTMLElement;
      elegirModo(fixture, 'coche');
      tragarLaZona();
      await direccionEntera(fixture, http);
      await conRutaAparcando(fixture, 'azul');

      const pedidos: unknown[] = [];
      for (const respuesta of [VIAJE_APARCANDO_EN_NARANJA, VIAJE_APARCANDO_EN_AZUL]) {
        botonSugerir(raiz)!.click();
        fixture.detectChanges();
        const peticiones = http.match('/api/ruta');
        expect(peticiones.length).toBe(1);
        pedidos.push(cuerpoDeLaRuta(peticiones)['aparcamiento']);
        drenarRutas(peticiones, () => respuesta);
        await fixture.whenStable();
        fixture.detectChanges();
      }
      expect(pedidos).toEqual(['naranja', 'azul']);
      // Y se acaba donde se empezó, con la ruta pedida otra vez y no recordada.
      expect(hitoPintado(raiz)).toBe('Aparca en Calle San Blas: zona azul (rotación)');
      expect(radiosDeAparcamiento(raiz).filter((r) => r.checked).map((r) => r.value)).toEqual([
        'azul',
      ]);
    });

    /**
     * ⭐ JUEZ 5 — EN DISCAPACITADO Y EN GRATUITO **NO HAY BOTÓN**.
     *
     * El cruce que se pidió es azul ↔ naranja, y no hay ninguno más que tenga
     * sentido: una plaza PMR no tiene «la de al lado de otro color», y el
     * bordillo libre no es una zona. Ofrecerlo igualmente sería un botón que
     * lleva a una respuesta que nadie ha pedido.
     */
    it('⭐ 5 · con discapacitado y con gratuito el botón no existe', async () => {
      const fixture = TestBed.createComponent(Buscador);
      await fixture.whenStable();
      const raiz = fixture.nativeElement as HTMLElement;
      elegirModo(fixture, 'coche');
      tragarLaZona();
      await direccionEntera(fixture, http);

      for (const tipo of ['discapacitado', 'gratuito'] as const) {
        await conRutaAparcando(fixture, tipo);
        // El viaje SÍ tiene hito 🅿 —se pinta—, y aun así no hay atajo.
        expect(hitoPintado(raiz)).not.toBeNull();
        expect(botonSugerir(raiz)).toBeNull();
      }
    });

    /**
     * ⭐ JUEZ 6 — LA MURALLA: los otros modos y los otros tipos, intactos.
     *
     * ⚠️ **Con una excepción declarada, y es el valor del contrato**: donde
     *    había `regulado` hay ahora `azul` y `naranja`. Es la migración del
     *    4/09 y se compra aquí en vez de esconderse: los cuatro ids del grupo
     *    son exactamente los cuatro del contrato, en su orden.
     */
    it('⭐ 6 · los cuatro tipos son los del contrato y los otros modos no cambian', async () => {
      const fixture = TestBed.createComponent(Buscador);
      await fixture.whenStable();
      const raiz = fixture.nativeElement as HTMLElement;

      elegirModo(fixture, 'coche');
      tragarLaZona();
      expect(radiosDeAparcamiento(raiz).map((r) => r.value)).toEqual([
        'azul',
        'naranja',
        'discapacitado',
        'gratuito',
      ]);
      expect(radiosDeAparcamiento(raiz).map((r) => r.closest('label')!.textContent!.trim())).toEqual(
        ['Zona azul', 'Zona naranja', 'Discapacitado', 'Gratuito'],
      );
      // Y `regulado` no vive ya en ninguna parte de la pantalla.
      expect(raiz.innerHTML).not.toContain('regulado');

      await direccionEntera(fixture, http);
      await conRutaAparcando(fixture, 'azul');
      expect(botonSugerir(raiz)).not.toBeNull();

      // Los otros cinco modos mandan lo que mandaban, y no traen atajo ninguno.
      for (const modo of ['andando', 'bus', 'patin'] as const) {
        elegirModo(fixture, modo);
        botonGenerar(raiz).click();
        fixture.detectChanges();
        const peticiones = http.match('/api/ruta');
        expect(Object.keys(cuerpoDeLaRuta(peticiones)).sort()).toEqual([
          'destino',
          'modo',
          'origen',
        ]);
        drenarRutas(peticiones, () => ({ ...TRAYECTO, modo }));
        await fixture.whenStable();
        fixture.detectChanges();
        expect(botonSugerir(raiz)).toBeNull();
      }
    });
  });

  /**
   * ═════════════════════════════════════════════════════════════════════════
   *  ⭐ EL GRUPO [Moto] EN LA BOTONERA (4/09, punto 13 casilla 3)
   * ═════════════════════════════════════════════════════════════════════════
   *
   * El motor ya sabía andar en moto desde la casilla 1: `modo: 'moto'` viaja,
   * rueda por la red del coche y remata siempre en un aparcamoto. Lo que aquí
   * se compra es **la puerta**: que se pueda pedir desde la pantalla, que las
   * preguntas de la ZBE sean LAS MISMAS que las del coche —no una copia— y que
   * la del aparcamiento no aparezca, porque la moto no elige dónde deja.
   */

  /**
   * ═════════════════════════════════════════════════════════════════════════
   *  ⭐ LA FILA DE LA MOTO: [Privada] [Pública YeGo] (4/09, punto 13 casilla 2)
   * ═════════════════════════════════════════════════════════════════════════
   *
   * Es el **mismo patrón que la bici**, y no por comodidad: son la misma
   * pregunta contestada dos veces —«¿en qué te mueves?» en moto, «¿tuya o de la
   * ciudad?»—. Poner «Moto» y «YeGo» al mismo nivel en la primera fila la
   * subiría a siete y obligaría a leerlas todas para descubrir que dos son
   * hermanas, que es exactamente lo que el 2/09 se arregló con la bici.
   */
  describe('⭐ LA FILA DE LA MOTO — Privada y Pública YeGo (4/09, punto 13)', () => {
    /** Deja el formulario listo y pinta un viaje en YeGo. */
    const conViajeEnYego = async (fixture: any): Promise<HTMLElement> => {
      const raiz = fixture.nativeElement as HTMLElement;
      elegirModo(fixture, 'yego');
      for (const p of http.match((r) => r.url.includes('MU1_ZBE'))) {
        p.flush(LA_FASE_1);
      }
      await direccionEntera(fixture, http);
      botonGenerar(raiz).click();
      fixture.detectChanges();
      drenarRutas(http.match('/api/ruta'), () => VIAJE_EN_YEGO);
      await fixture.whenStable();
      fixture.detectChanges();
      return raiz;
    };

    /**
     * ⭐ JUEZ A — LA SEGUNDA FILA DE LA MOTO, con Privada por defecto.
     *
     * La primera fila **sigue siendo seis**: la moto compartida no añade botón
     * arriba, se revela debajo. Y se entra por la privada, que es la que no
     * depende de que haya una moto suelta cerca — el mismo criterio que hace que
     * la bici entre por la privada y no por la BiZi.
     */
    it('⭐ A · elegir Moto revela [Privada] [Pública YeGo], con Privada marcada', async () => {
      const fixture = TestBed.createComponent(Buscador);
      await fixture.whenStable();
      const raiz = fixture.nativeElement as HTMLElement;

      // La primera fila no crece: sigue en seis familias.
      expect(radiosDeFamilia(raiz).length).toBe(6);
      expect(raiz.querySelector('fieldset.modos.motos')).toBeNull();

      // Se pulsa la familia y NADA MÁS: lo que se compra es el defecto.
      radiosDeFamilia(raiz).find((r) => r.value === 'moto')!.click();
      fixture.detectChanges();
      for (const p of http.match((r) => r.url.includes('MU1_ZBE'))) {
        p.flush(LA_FASE_1);
      }
      await fixture.whenStable();

      const fila = raiz.querySelector<HTMLFieldSetElement>('fieldset.modos.motos')!;
      expect(fila).not.toBeNull();
      expect(fila.querySelector('legend')?.textContent?.trim()).toBe('¿Qué moto?');
      expect(
        Array.from(fila.querySelectorAll<HTMLElement>('.modo')).map((m) => m.textContent?.trim()),
      ).toEqual(['Privada', 'Pública YeGo']);
      // ⭐ Y sus `value` son LOS DEL CONTRATO, sin tabla en medio que mienta.
      expect(radiosDeMoto(raiz).map((r) => r.value)).toEqual(['moto', 'yego']);
      expect(radiosDeMoto(raiz).filter((r) => r.checked).map((r) => r.value)).toEqual(['moto']);

      // ⚠️ Su `name` es `moto` y NO `familia`: si compartieran nombre, el
      //    navegador los trataría como un solo grupo de ocho y marcar «Privada»
      //    desmarcaría «Moto». Es la misma cautela que la fila de la bici.
      expect(new Set(radiosDeMoto(raiz).map((r) => r.name))).toEqual(new Set(['moto']));
      expect(radiosDeFamilia(raiz).find((r) => r.checked)?.value).toBe('moto');

      // Y con cualquier otra familia, la fila no está.
      for (const modo of ['andando', 'bus', 'patin', 'coche'] as const) {
        elegirModo(fixture, modo);
        tragarLaZona();
        expect(raiz.querySelector('fieldset.modos.motos')).toBeNull();
        expect(radiosDeMoto(raiz).length).toBe(0);
      }
    });

    /**
     * ⭐ JUEZ B (la 7 del encargo) — CON YeGo **NO** SE PREGUNTA EL DISTINTIVO,
     * y con Privada **SÍ**.
     *
     * No es una simplificación: **la respuesta ya la da el dato**. § 1.34 mide
     * que el feed declara `eco_sticker: "distintivo_ambiental_0"` para toda la
     * flota, con `propulsion_type: electric` y `g_CO2_KM: 0`. Un CERO entra libre
     * [FAQ de la sede], así que preguntarlo sería pedirle a quien busca una ruta
     * un dato que ya está contestado — y peor: dejarle contestar mal.
     */
    it('⭐ B · con YeGo no existe la pregunta del distintivo; con Privada sí', async () => {
      const fixture = TestBed.createComponent(Buscador);
      await fixture.whenStable();
      const raiz = fixture.nativeElement as HTMLElement;

      elegirModo(fixture, 'moto');
      tragarLaZona();
      expect(radiosDeDistintivo(raiz).length).toBe(6);
      expect(raiz.querySelector('fieldset.distintivos')).not.toBeNull();

      elegirModo(fixture, 'yego');
      expect(radiosDeDistintivo(raiz).length).toBe(0);
      expect(raiz.querySelector('fieldset.distintivos')).toBeNull();
      // Ni la matrícula, que vive dentro de esa pregunta.
      expect(raiz.querySelectorAll('input[name="matricula"]').length).toBe(0);
      // Y tampoco la del aparcamiento: la moto compartida no elige dónde deja.
      expect(radiosDeAparcamiento(raiz).length).toBe(0);

      // Y al volver a Privada, la pregunta está otra vez.
      elegirModo(fixture, 'moto');
      expect(radiosDeDistintivo(raiz).length).toBe(6);
    });

    /**
     * ⭐ JUEZ C — LO QUE VIAJA ES `yego`, **y nada más**.
     *
     * Ni `puedeEntrarEnLaZbe` ni `aparcamiento`: las dos preguntas están
     * contestadas de antemano —por el feed la primera, por el free-floating la
     * segunda—, así que no hay respuesta que mandar. Y **lo contestado en
     * Privada no se le cuela**: cambiar de moto es cambiar de vehículo.
     */
    it('⭐ C · YeGo manda `modo: yego` y ni un parámetro más', async () => {
      const fixture = TestBed.createComponent(Buscador);
      await fixture.whenStable();
      const raiz = fixture.nativeElement as HTMLElement;

      // Se contesta el distintivo en la moto privada, para que se note si pasa.
      elegirModo(fixture, 'moto');
      tragarLaZona();
      await direccionEntera(fixture, http);
      pulsar(fixture, radiosDeDistintivo(raiz), 'sin');

      elegirModo(fixture, 'yego');
      botonGenerar(raiz).click();
      fixture.detectChanges();
      const peticiones = http.match('/api/ruta');
      expect(cuerpoDeLaRuta(peticiones)['modo']).toBe('yego');
      expect(Object.keys(cuerpoDeLaRuta(peticiones)).sort()).toEqual([
        'destino',
        'modo',
        'origen',
      ]);
      drenarRutas(peticiones, () => VIAJE_EN_YEGO);
      await fixture.whenStable();

      // Y el rótulo del resultado dice su palabra, no el id del contrato.
      expect(raiz.querySelector('.pasos__modo')?.textContent).toContain('Modo: YeGo');
    });

    /**
     * ⭐ JUEZ D — LA MOTO ELEGIDA SE CUENTA: su autonomía y la edad del dato.
     *
     * Las dos cosas vienen del motor y se pintan donde ya se pinta el estado de
     * un viaje: **el hito lleva la autonomía** y **el resumen de avisos lleva la
     * edad**, que es la región `role="status"` que esta pantalla tiene desde el
     * 2/09. No se estrena un cuarto sitio donde poner estado.
     *
     * ⚠️ La edad es la mitad que hace honesta a la caché de 240 s: si el dato
     *    puede tener cuatro minutos, quien lo lee tiene que poder saberlo.
     *
     * ⛔ Y el `bike_id` **no aparece en ninguna parte**: es el único campo que el
     *    operador rota por privacidad.
     */
    it('⭐ D · el hito dice la autonomía y el resumen dice la edad del dato', async () => {
      const fixture = TestBed.createComponent(Buscador);
      await fixture.whenStable();
      const raiz = await conViajeEnYego(fixture);

      const hito = Array.from(raiz.querySelectorAll<HTMLElement>('.paso')).find((li) =>
        (li.querySelector('.paso__texto')?.textContent ?? '').startsWith('Coge'),
      );
      expect(hito).toBeTruthy();
      expect(
        (hito!.querySelector('.paso__texto')?.textContent ?? '').replace(/\s+/g, ' ').trim(),
      ).toBe('Coge la moto de YeGo (45 km de autonomía)');
      expect(hito!.querySelector('.paso__flecha')?.textContent?.trim()).toBe('🚲');

      // Y el remate, que es dejarla en el destino y no en un aparcamoto.
      const deja = Array.from(raiz.querySelectorAll<HTMLElement>('.paso')).find((li) =>
        (li.querySelector('.paso__texto')?.textContent ?? '').startsWith('Deja la moto'),
      );
      expect(deja).toBeTruthy();
      expect(
        (deja!.querySelector('.paso__texto')?.textContent ?? '').replace(/\s+/g, ' ').trim(),
      ).toBe('Deja la moto en CALLE ABEN AIRE 33, donde esté permitido aparcar');

      // La edad, en el resumen de avisos, que es la región que ya existe.
      expect(resumenEnPantalla(raiz).join(' ')).toContain(
        'Motos de YeGo: 135 libres, datos de hace menos de 1 min.',
      );

      // ⛔ Ni rastro de identificadores.
      expect(raiz.innerHTML).not.toContain('bike_id');
      expect(/[0-9a-f]{8}-[0-9a-f]{4}-/.test(raiz.innerHTML)).toBe(false);
    });

    /**
     * ⭐ JUEZ E — EL POLÍGONO Y LA TRAZA, como en la moto privada.
     *
     * La zona **se pinta** aunque a YeGo no se le pregunte el distintivo: la
     * flota entra libre, pero saber por dónde va la ruta no es una restricción,
     * es contexto. Y el corte rojo lo trae el dato del motor.
     */
    it('⭐ E · con YeGo se pinta el polígono y la traza corta en rojo', async () => {
      const fixture = TestBed.createComponent(Buscador);
      await fixture.whenStable();
      const raiz = await conViajeEnYego(fixture);

      expect(raiz.querySelectorAll('.leaflet-zbe-pane path').length).toBe(1);
      // Andando ámbar, y lo rodado azul o rojo según pise la zona.
      expect(coloresDeLosTramos(raiz)).toEqual([
        '#b45309',
        '#2563eb',
        '#d32f2f',
        '#2563eb',
        '#d32f2f',
      ]);

      // Y el aviso de la zona va colgado de su paso, no del de coger la moto.
      const notas = notasPorPaso(raiz);
      expect([...notas.keys()]).toEqual([4]);
      expect(notas.get(4)).toContain('La ruta atraviesa la Zona de Bajas Emisiones');
    });

    /**
     * ⭐ JUEZ F (la 9 del encargo) — LA MURALLA: YeGo no le cambia el cuerpo a
     * nadie, **y la moto privada la primera**.
     */
    it('⭐ F · la privada, el coche y los demás siguen mandando lo suyo', async () => {
      const fixture = TestBed.createComponent(Buscador);
      await fixture.whenStable();
      const raiz = fixture.nativeElement as HTMLElement;

      elegirModo(fixture, 'yego');
      tragarLaZona();
      await direccionEntera(fixture, http);
      botonGenerar(raiz).click();
      fixture.detectChanges();
      drenarRutas(http.match('/api/ruta'), () => VIAJE_EN_YEGO);
      await fixture.whenStable();

      // La moto privada: su distintivo vuelve, y viaja cuando se contesta.
      elegirModo(fixture, 'moto');
      pulsar(fixture, radiosDeDistintivo(raiz), 'b');
      botonGenerar(raiz).click();
      fixture.detectChanges();
      const privada = http.match('/api/ruta');
      expect(Object.keys(cuerpoDeLaRuta(privada)).sort()).toEqual([
        'destino',
        'modo',
        'origen',
        'puedeEntrarEnLaZbe',
      ]);
      expect(cuerpoDeLaRuta(privada)['modo']).toBe('moto');
      drenarRutas(privada, () => VIAJE_EN_MOTO);
      await fixture.whenStable();

      // El coche, con sus dos preguntas.
      elegirModo(fixture, 'coche');
      pulsar(fixture, radiosDeDistintivo(raiz), 'b');
      pulsar(fixture, radiosDeAparcamiento(raiz), 'azul');
      botonGenerar(raiz).click();
      fixture.detectChanges();
      const coche = http.match('/api/ruta');
      expect(Object.keys(cuerpoDeLaRuta(coche)).sort()).toEqual([
        'aparcamiento',
        'destino',
        'modo',
        'origen',
        'puedeEntrarEnLaZbe',
      ]);
      drenarRutas(coche, () => VIAJE_APARCANDO_EN_AZUL);
      await fixture.whenStable();

      // Y los cinco sin motor, al byte.
      for (const modo of ['andando', 'bus', 'patin'] as const) {
        elegirModo(fixture, modo);
        botonGenerar(raiz).click();
        fixture.detectChanges();
        const peticiones = http.match('/api/ruta');
        expect(Object.keys(cuerpoDeLaRuta(peticiones)).sort()).toEqual([
          'destino',
          'modo',
          'origen',
        ]);
        drenarRutas(peticiones, () => ({ ...TRAYECTO, modo }));
        await fixture.whenStable();
      }
      for (const modo of ['bici', 'bizi'] as const) {
        elegirModo(fixture, modo);
        botonGenerar(raiz).click();
        fixture.detectChanges();
        const peticiones = http.match('/api/ruta');
        expect(Object.keys(cuerpoDeLaRuta(peticiones)).sort()).toEqual([
          'destino',
          'modo',
          'origen',
          'ruta',
        ]);
        drenarRutas(peticiones, () => ({ ...TRAYECTO, modo }));
        await fixture.whenStable();
      }
    });
  });

  describe('⭐ EL GRUPO MOTO EN LA BOTONERA (4/09, punto 13 casilla 3)', () => {
    /** Las etiquetas de la primera fila, tal y como se leen. */
    const etiquetasDeFamilia = (raiz: HTMLElement): string[] =>
      Array.from(raiz.querySelectorAll<HTMLElement>('fieldset.modos.familias .modo')).map(
        (m) => m.textContent?.trim() ?? '',
      );

    /** La región de estado de la DGT, que es una sola en toda la pantalla. */
    const regionDgt = (raiz: HTMLElement): HTMLElement | null =>
      raiz.querySelector<HTMLElement>('.matricula__estado');

    /** Contesta a la DGT con una etiqueta, como lo hace la juez 6 del coche. */
    const consultarLaDgt = (fixture: any, raiz: HTMLElement, cuerpo: object): void => {
      const campo = raiz.querySelector<HTMLInputElement>('input[name="matricula"]')!;
      campo.value = '0000BBM';
      campo.dispatchEvent(new Event('input'));
      fixture.detectChanges();
      raiz.querySelector<HTMLButtonElement>('.matricula__boton')!.click();
      fixture.detectChanges();
      http.expectOne((r) => r.url === '/api/distintivo').flush(cuerpo);
      fixture.detectChanges();
    };

    /**
     * ⭐ JUEZ 1 — SEIS FAMILIAS, y [Moto] manda `modo: 'moto'`.
     *
     * El orden es el del parlamento del 1/09 y sigue siendo el mismo criterio
     * que firmó Antonio el 28/08: de lo que no lleva vehículo a lo que más
     * ocupa. La moto entra **entre el patín y el coche**, que es su sitio — es
     * el primer vehículo de motor de la fila.
     *
     * ⚠️ **Y son SEIS, que es una más de las cinco del control segmentado.** El
     *    2/09 la fila bajó de seis a cinco justamente porque [DOC sistemas de
     *    diseño] el rango del patrón es de 2 a 5 opciones con etiqueta. Vuelve a
     *    seis por decisión del encargo, y se escribe aquí para que la próxima
     *    familia no entre sin que nadie mire este número.
     */
    it('⭐ 1 · la primera fila son SEIS familias, y Moto manda modo=moto', async () => {
      const fixture = TestBed.createComponent(Buscador);
      await fixture.whenStable();
      const raiz = fixture.nativeElement as HTMLElement;

      const radios = radiosDeFamilia(raiz);
      expect(radios.length).toBe(6);
      expect(radios.map((r) => r.value)).toEqual([
        'andando',
        'bus',
        'bici',
        'patin',
        'moto',
        'coche',
      ]);
      expect(etiquetasDeFamilia(raiz)).toEqual([
        'Andando',
        'Bus / Tranvía',
        'Bici',
        'Patín (VMP)',
        'Moto',
        'Coche',
      ]);
      // Sigue siendo UN grupo: un solo `name`, una sola parada de tabulador.
      expect(new Set(radios.map((r) => r.name)).size).toBe(1);
      expect(radios.filter((r) => r.checked).length).toBe(1);

      // Y lo que viaja es el modo del contrato, sin nada más pegado.
      elegirModo(fixture, 'moto');
      tragarLaZona();
      await direccionEntera(fixture, http);
      botonGenerar(raiz).click();
      fixture.detectChanges();
      const peticiones = http.match('/api/ruta');
      expect(cuerpoDeLaRuta(peticiones)['modo']).toBe('moto');
      expect(Object.keys(cuerpoDeLaRuta(peticiones)).sort()).toEqual([
        'destino',
        'modo',
        'origen',
      ]);
      drenarRutas(peticiones, () => VIAJE_EN_MOTO);
      await fixture.whenStable();

      // Y el resultado se rotula con su palabra, no con el id del contrato.
      expect(raiz.querySelector('.pasos__modo')?.textContent).toContain('Modo: Moto');
    });

    /**
     * ⭐ JUEZ 2 — CON [Moto] LA PREGUNTA DEL DISTINTIVO EXISTE Y LA DE PARKING NO.
     *
     * La ZBE le alcanza igual que al coche —es un vehículo de motor y la
     * ordenanza no distingue—, así que la pregunta es la misma. El aparcamiento
     * **no**: la moto remata siempre en un aparcamoto, y el motor ni mira el
     * parámetro. Enseñar «¿Dónde quieres aparcar?» a quien va en moto sería
     * pedirle que elija algo que no se le va a hacer caso.
     *
     * Y no está en gris: **no está** [DOC GOV.UK, revelado condicional].
     */
    it('⭐ 2 · con Moto se pregunta el distintivo y NO el aparcamiento', async () => {
      const fixture = TestBed.createComponent(Buscador);
      await fixture.whenStable();
      const raiz = fixture.nativeElement as HTMLElement;

      elegirModo(fixture, 'moto');
      tragarLaZona();
      expect(radiosDeDistintivo(raiz).map((r) => r.value)).toEqual([
        'cero',
        'eco',
        'c',
        'b',
        'sin',
        'nolose',
      ]);
      expect(raiz.querySelector('fieldset.distintivos legend')?.textContent).toContain(
        '¿Distintivo ambiental?',
      );
      // La del aparcamiento no está, y no es que esté apagada: no hay ni un
      // radio suyo ni el `fieldset` que los envolvería.
      expect(radiosDeAparcamiento(raiz).length).toBe(0);
      expect(raiz.querySelector('fieldset.aparcamientos')).toBeNull();

      // El coche sigue teniendo las dos: lo de la moto no le ha quitado nada.
      elegirModo(fixture, 'coche');
      expect(radiosDeAparcamiento(raiz).length).toBe(4);
      expect(radiosDeDistintivo(raiz).length).toBe(6);

      // Y al salirse a un modo sin motor, no queda ninguna de las dos.
      elegirModo(fixture, 'andando');
      expect(radiosDeAparcamiento(raiz).length).toBe(0);
      expect(radiosDeDistintivo(raiz).length).toBe(0);
    });

    /**
     * ⭐ JUEZ 3 — ES **EL MISMO SELECTOR**, no dos que se parecen.
     *
     * Un segundo grupo de radios para la moto habría sido lo fácil, y es
     * exactamente lo que esta juez prohíbe: dos listas de seis etiquetas, dos
     * campos de matrícula y dos regiones de estado que un día dirían cosas
     * distintas. **Una sola fuente de verdad**, que es el precedente de la lista
     * única región/botones del 4/09.
     *
     * Se compra por el DOM —un solo `fieldset.distintivos`, un solo
     * `input#matricula`, una sola región— y por la conducta: la matrícula marca
     * el radio en moto exactamente igual que en coche.
     */
    it('⭐ 3 · el selector del distintivo es UNO, y la matrícula lo marca en moto', async () => {
      const fixture = TestBed.createComponent(Buscador);
      await fixture.whenStable();
      const raiz = fixture.nativeElement as HTMLElement;

      elegirModo(fixture, 'moto');
      tragarLaZona();
      // Uno de cada, ni dos ni ninguno.
      expect(raiz.querySelectorAll('fieldset.distintivos').length).toBe(1);
      expect(raiz.querySelectorAll('input[name="matricula"]').length).toBe(1);
      expect(raiz.querySelectorAll('.matricula__estado').length).toBe(1);
      // Y el `name` del grupo es el mismo que el del coche: si fueran dos
      // grupos con dos nombres, el navegador los trataría como preguntas
      // distintas y marcar en uno no desmarcaría en el otro.
      expect(new Set(radiosDeDistintivo(raiz).map((r) => r.name))).toEqual(new Set(['distintivo']));

      const region = regionDgt(raiz)!;
      expect(region.getAttribute('role')).toBe('status');
      expect(raiz.querySelector('.matricula__boton')?.getAttribute('aria-controls')).toBe(region.id);

      consultarLaDgt(fixture, raiz, {
        clase: 'etiqueta',
        distintivo: 'C',
        texto: LA_DGT_CON_UNA_C,
        fuente: 'DGT',
        cuando: new Date('2026-09-04T14:53:00').toISOString(),
      });
      await fixture.whenStable();

      expect(radiosDeDistintivo(raiz).filter((r) => r.checked).map((r) => r.value)).toEqual(['c']);
      expect(regionDgt(raiz)!.textContent?.trim()).toBe(
        'Distintivo ambiental C (Fuente: DGT, 14:53)',
      );
      // La prosa de la sede sigue sin pintarse aquí tampoco.
      expect(regionDgt(raiz)!.textContent).not.toContain('Pulsa en la imagen');

      // Y lo que se ha contestado VIAJA en moto, que es lo que hace que esto no
      // sea solo un adorno compartido.
      await direccionEntera(fixture, http);
      botonGenerar(raiz).click();
      fixture.detectChanges();
      const peticiones = http.match('/api/ruta');
      expect(Object.keys(cuerpoDeLaRuta(peticiones)).sort()).toEqual([
        'destino',
        'modo',
        'origen',
        'puedeEntrarEnLaZbe',
      ]);
      expect(cuerpoDeLaRuta(peticiones)['puedeEntrarEnLaZbe']).toBe(true);
      // ⛔ Y la matrícula NO se cuela en la ruta, tampoco desde la moto.
      expect(JSON.stringify(peticiones.map((p) => p.request.body))).not.toContain('0000BBM');
      drenarRutas(peticiones, () => VIAJE_EN_MOTO);
      await fixture.whenStable();
    });

    /**
     * ⭐ JUEZ 4 — CAMBIAR DE FAMILIA DEVUELVE LAS RESPUESTAS A SIN-ELEGIR.
     *
     * [PROPIO, declarado en el encargo] **cada vehículo el suyo**: la etiqueta
     * ambiental es del coche que se conduce, y quien pasa de su coche a su moto
     * está hablando de otro vehículo. Arrastrar la respuesta le mandaría al motor
     * un `puedeEntrarEnLaZbe` que nadie ha contestado para ESE vehículo, que es
     * justo lo que «nada preseleccionado» lleva prohibiendo desde el 3/09.
     *
     * Y se resetean las tres a la vez —distintivo, matrícula y autorización—
     * porque son una sola respuesta contada en tres cajas: dejar la matrícula
     * puesta con el radio en blanco enseñaría un vehículo sin respuesta.
     */
    it('⭐ 4 · cambiar coche→moto resetea distintivo, matrícula y autorización', async () => {
      const fixture = TestBed.createComponent(Buscador);
      await fixture.whenStable();
      const raiz = fixture.nativeElement as HTMLElement;

      elegirModo(fixture, 'coche');
      tragarLaZona();
      pulsar(fixture, radiosDeDistintivo(raiz), 'sin');
      expect(radiosDeAutorizacion(raiz).length).toBe(2);
      pulsar(fixture, radiosDeAutorizacion(raiz), 'si');
      const campo = raiz.querySelector<HTMLInputElement>('input[name="matricula"]')!;
      campo.value = '0000BBM';
      campo.dispatchEvent(new Event('input'));
      fixture.detectChanges();
      expect(campo.value).toBe('0000BBM');

      // Se cambia de vehículo: las tres respuestas se quedan atrás.
      elegirModo(fixture, 'moto');
      expect(radiosDeDistintivo(raiz).filter((r) => r.checked).length).toBe(0);
      expect(radiosDeAutorizacion(raiz).length).toBe(0);
      expect(raiz.querySelector<HTMLInputElement>('input[name="matricula"]')!.value).toBe('');
      expect(regionDgt(raiz)!.textContent?.trim()).toBe('');

      // Y sin contestar, el parámetro NO viaja: es la conducta de la casilla 1b.
      await direccionEntera(fixture, http);
      botonGenerar(raiz).click();
      fixture.detectChanges();
      const enMoto = http.match('/api/ruta');
      expect(Object.keys(cuerpoDeLaRuta(enMoto)).sort()).toEqual(['destino', 'modo', 'origen']);
      drenarRutas(enMoto, () => VIAJE_EN_MOTO);
      await fixture.whenStable();

      // Y al revés vale igual: lo contestado en moto no se hereda en coche.
      pulsar(fixture, radiosDeDistintivo(raiz), 'b');
      elegirModo(fixture, 'coche');
      expect(radiosDeDistintivo(raiz).filter((r) => r.checked).length).toBe(0);
      botonGenerar(raiz).click();
      fixture.detectChanges();
      const enCoche = http.match('/api/ruta');
      expect(Object.keys(cuerpoDeLaRuta(enCoche)).sort()).toEqual(['destino', 'modo', 'origen']);
      drenarRutas(enCoche, () => VIAJE_EN_COCHE_LEJOS);
      await fixture.whenStable();
    });

    /**
     * ⭐ JUEZ 5 — EL POLÍGONO DE LA ZONA SE PINTA TAMBIÉN CON [Moto].
     *
     * La Zona de Bajas Emisiones vale para todo vehículo de motor [ordenanza],
     * así que enseñársela al coche y esconderla a la moto sería enseñar media
     * verdad. Y es el mismo fichero, pedido **una sola vez**: § 1.30, el que el
     * motor usa para marcar las aristas.
     *
     * A los cuatro modos sin motor no les llega, y eso también se compra: quien
     * va andando no tiene por qué pagar 2,9 kB de un polígono que no le afecta.
     */
    it('⭐ 5 · el polígono se pinta con Moto, y no con andando, bus, bici ni patín', async () => {
      const fixture = TestBed.createComponent(Buscador);
      await fixture.whenStable();
      const raiz = fixture.nativeElement as HTMLElement;

      // Al arrancar en andando nadie pide la capa.
      http.expectNone((r) => r.url.includes('MU1_ZBE'));

      elegirModo(fixture, 'moto');
      const capa = http.expectOne((r) => r.url.includes('MU1_ZBE'));
      expect(capa.request.method).toBe('GET');
      capa.flush(LA_FASE_1);
      fixture.detectChanges();
      await fixture.whenStable();
      expect(raiz.querySelectorAll('.leaflet-zbe-pane path').length).toBe(1);

      for (const modo of ['andando', 'bus', 'bici', 'patin'] as const) {
        elegirModo(fixture, modo);
        fixture.detectChanges();
        await fixture.whenStable();
        expect(raiz.querySelectorAll('.leaflet-zbe-pane path').length).toBe(0);
      }

      // Se vuelve a la moto: el polígono está, y NO se ha vuelto a pedir.
      elegirModo(fixture, 'moto');
      fixture.detectChanges();
      await fixture.whenStable();
      http.expectNone((r) => r.url.includes('MU1_ZBE'));
      expect(raiz.querySelectorAll('.leaflet-zbe-pane path').length).toBe(1);

      // Y el coche lo sigue teniendo, con la misma capa ya traída.
      elegirModo(fixture, 'coche');
      fixture.detectChanges();
      await fixture.whenStable();
      expect(raiz.querySelectorAll('.leaflet-zbe-pane path').length).toBe(1);
    });

    /**
     * ⭐ JUEZ 6 — EL CASO DEL OJO: el hito del aparcamoto y la traza roja.
     *
     * Es el viaje que se mira en Chrome, y aquí se compra entero con el trayecto
     * MEDIDO: la frase que el motor escribe —«Aparca en el aparcamiento de motos
     * de Predicadores 28 (sin coste)»—, su flecha 🅿, el aviso de la zona colgado
     * de su paso, y **el corte del color**: azul fuera, rojo dentro, ámbar
     * discontinuo el paseo del final.
     *
     * ⚠️ El corte no lo calcula la pantalla: viene en `TramoDelViaje.zbe`, que
     *    lo pone el motor. Lo que esta juez compra es que la moto **lo deja
     *    pasar** — el dato ya venía desde la casilla 1.
     *
     * ⚠️ Y **no hay atajo de zona cruzada**: la moto no elige aparcamiento, así
     *    que no hay ninguna otra zona que sugerir. El botón no existe.
     */
    it('⭐ 6 · el caso del ojo: hito del aparcamoto, aviso en su paso y traza roja', async () => {
      const fixture = TestBed.createComponent(Buscador);
      await fixture.whenStable();
      const raiz = fixture.nativeElement as HTMLElement;

      elegirModo(fixture, 'moto');
      http.expectOne((r) => r.url.includes('MU1_ZBE')).flush(LA_FASE_1);
      await direccionEntera(fixture, http);
      botonGenerar(raiz).click();
      fixture.detectChanges();
      drenarRutas(http.match('/api/ruta'), () => VIAJE_EN_MOTO);
      await fixture.whenStable();
      fixture.detectChanges();

      // El hito, con su frase entera y su marca.
      const hito = Array.from(raiz.querySelectorAll<HTMLElement>('.paso')).find((li) =>
        (li.querySelector('.paso__texto')?.textContent ?? '').startsWith('Aparca'),
      );
      expect(hito).toBeTruthy();
      expect(
        (hito!.querySelector('.paso__texto')?.textContent ?? '').replace(/\s+/g, ' ').trim(),
      ).toBe('Aparca en el aparcamiento de motos de Predicadores 28 (sin coste)');
      expect(hito!.querySelector('.paso__flecha')?.textContent?.trim()).toBe('🅿');

      // El aviso de la zona, en el paso que dice `Aviso.paso`.
      const notas = notasPorPaso(raiz);
      expect([...notas.keys()]).toEqual([1]);
      expect(notas.get(1)).toContain('La ruta atraviesa la Zona de Bajas Emisiones');

      // ⭐ Y LA TRAZA: azul fuera, ROJA dentro, ámbar el paseo.
      expect(coloresDeLosTramos(raiz)).toEqual(['#2563eb', '#d32f2f', '#b45309']);
      // Y el polígono sigue debajo, que es el tercer canal de la misma noticia.
      expect(raiz.querySelectorAll('.leaflet-zbe-pane path').length).toBe(1);

      // La moto no elige aparcamiento: no hay otra zona que sugerir.
      expect(botonSugerir(raiz)).toBeNull();
    });

    /**
     * ⭐ JUEZ 7 — LA MURALLA: la moto no le cambia el cuerpo a nadie.
     *
     * Ni a los cinco modos sin motor —`origen`, `destino`, `modo` y, en los que
     * eligen, `ruta`— ni al coche, que sigue mandando sus dos parámetros cuando
     * se le contestan.
     *
     * ⚠️ Y la vuelta al coche llega **con el distintivo en blanco y el parking
     *    donde estaba**, que es la juez 4 vista desde aquí. El reseteo es de las
     *    respuestas de la ZBE —distintivo, matrícula y autorización—, porque son
     *    del VEHÍCULO y el vehículo ha cambiado. El aparcamiento no: es una
     *    pregunta del coche y solo del coche, así que volver al coche es volver
     *    al mismo sitio donde se dejó.
     *
     *    ⚠️ **Esta juez compraba las dos cosas en blanco y se equivocaba.** Lo
     *       escribí así antes de implementar, se puso roja —`expected 1 to be
     *       +0`— y el rojo tenía razón: el encargo dice «distintivo, matrícula y
     *       autorización», tres cosas, no cuatro. Se corrige la juez, no el
     *       código: borrar de paso una respuesta que nadie ha pedido borrar
     *       habría sido cambiar la conducta del coche de antes del 4/09.
     */
    it('⭐ 7 · los cinco modos sin motor y el coche siguen mandando lo suyo', async () => {
      const fixture = TestBed.createComponent(Buscador);
      await fixture.whenStable();
      const raiz = fixture.nativeElement as HTMLElement;

      elegirModo(fixture, 'coche');
      tragarLaZona();
      await direccionEntera(fixture, http);
      pulsar(fixture, radiosDeDistintivo(raiz), 'sin');
      pulsar(fixture, radiosDeAutorizacion(raiz), 'si');
      pulsar(fixture, radiosDeAparcamiento(raiz), 'azul');
      botonGenerar(raiz).click();
      fixture.detectChanges();
      const delCoche = http.match('/api/ruta');
      expect(Object.keys(cuerpoDeLaRuta(delCoche)).sort()).toEqual([
        'aparcamiento',
        'destino',
        'modo',
        'origen',
        'puedeEntrarEnLaZbe',
      ]);
      expect(cuerpoDeLaRuta(delCoche)['aparcamiento']).toBe('azul');
      expect(cuerpoDeLaRuta(delCoche)['puedeEntrarEnLaZbe']).toBe(true);
      drenarRutas(delCoche, () => VIAJE_APARCANDO_EN_AZUL);
      await fixture.whenStable();

      for (const modo of ['andando', 'bus', 'patin'] as const) {
        elegirModo(fixture, modo);
        botonGenerar(raiz).click();
        fixture.detectChanges();
        const peticiones = http.match('/api/ruta');
        expect(Object.keys(cuerpoDeLaRuta(peticiones)).sort()).toEqual([
          'destino',
          'modo',
          'origen',
        ]);
        drenarRutas(peticiones, () => ({ ...TRAYECTO, modo }));
        await fixture.whenStable();
      }

      for (const modo of ['bici', 'bizi'] as const) {
        elegirModo(fixture, modo);
        botonGenerar(raiz).click();
        fixture.detectChanges();
        const peticiones = http.match('/api/ruta');
        expect(Object.keys(cuerpoDeLaRuta(peticiones)).sort()).toEqual([
          'destino',
          'modo',
          'origen',
          'ruta',
        ]);
        drenarRutas(peticiones, () => ({ ...TRAYECTO, modo }));
        await fixture.whenStable();
      }

      // Y el coche, al volver: el distintivo en blanco —hay que contestarlo
      // otra vez— y el parking donde se dejó, que es «azul» y sigue marcado.
      elegirModo(fixture, 'coche');
      expect(radiosDeDistintivo(raiz).filter((r) => r.checked).length).toBe(0);
      expect(radiosDeAparcamiento(raiz).filter((r) => r.checked).map((r) => r.value)).toEqual([
        'azul',
      ]);
      pulsar(fixture, radiosDeDistintivo(raiz), 'b');
      pulsar(fixture, radiosDeAparcamiento(raiz), 'naranja');
      botonGenerar(raiz).click();
      fixture.detectChanges();
      const otraVez = http.match('/api/ruta');
      expect(Object.keys(cuerpoDeLaRuta(otraVez)).sort()).toEqual([
        'aparcamiento',
        'destino',
        'modo',
        'origen',
        'puedeEntrarEnLaZbe',
      ]);
      expect(cuerpoDeLaRuta(otraVez)['aparcamiento']).toBe('naranja');
      drenarRutas(otraVez, () => VIAJE_APARCANDO_EN_NARANJA);
      await fixture.whenStable();
    });
  });

});
