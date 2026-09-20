import { Component, computed, inject, input } from '@angular/core';
import { Simbolo } from './simbolos';
import { Tema } from './tema';
import type { EleccionDeTema } from './tema';

/**
 * ⭐ EL CONMUTADOR DE TEMA (16/09, tanda 6 · parte 3).
 *
 * ── ⭐ ACTA: DE INTERRUPTOR A GRUPO DE TRES (20/09, la tanda de flecos) ─────
 *
 * Aquí vivía un `<button role="switch">` con `aria-checked`, y este comentario
 * decía —con el APG en la mano— que el modo oscuro es el ejemplo canónico del
 * patrón *Switch*. Sigue siéndolo **para dos estados**, y ése era el problema:
 *
 * ⚠️ **«SEGUIR AL SISTEMA» ES UNA ELECCIÓN, Y CON DOS ESTADOS NO SE PODÍA
 *    PEDIR.** Se tenía al arrancar, por no haber elegido nunca, y se perdía
 *    para siempre en cuanto alguien tocaba el interruptor: la primera pulsación
 *    escribía `data-theme` y la capa 2 de `styles.css` —`prefers-color-scheme`,
 *    que es el respaldo que el §35 firma— dejaba de mandar sin vuelta atrás.
 *    Un interruptor no tiene tercera posición: lo que hace falta es un grupo.
 *
 * ⚠️ Y por eso es **un grupo de radios nativo** y no tres botones con ARIA
 *    puesto a mano: el `name` compartido le regala al navegador la navegación
 *    con flechas, el foco que rueda por el grupo, la exclusión mutua y el
 *    «opción 2 de 3» que dice el lector — lo mismo que ya hacen los seis chips
 *    de modo del Buscador, con el mismo dibujo y el mismo patrón de casa.
 *
 * ⚠️ **EL `name` LLEVA LA VARIANTE DETRÁS**, y eso es la lección de
 *    `.modo__radio` cobrada antes de tropezar: en la portada están pintadas a la
 *    vez la variante de barra y la de cabecera —una apagada por ancho, pero las
 *    dos en el DOM—, y con el mismo `name` el navegador las juntaría en UN
 *    grupo de seis. Diría «opción 1 de 6» y las flechas saltarían de un
 *    conmutador al otro.
 *
 * ⚠️ El nombre del grupo lo pone una `<legend>` dentro de un `<fieldset>`, que
 *    es el mecanismo nativo: sin ella, un lector anunciaría «Claro, opción 1 de
 *    3» sin decir nunca de qué. Va oculta a la vista —las tres palabras ya
 *    dicen de qué va esto a quien lo mira— pero NO con `display: none`, que la
 *    sacaría también del árbol de accesibilidad.
 *
 * ── ⭐ LO QUE SE QUEDA DEL PATRÓN ANTERIOR ──────────────────────────────────
 *
 * [APG, *Switch Pattern*] un `switch` es un control de **efecto inmediato**, sin
 * «aplicar» ni confirmación — y el modo oscuro es el ejemplo canónico que la
 * propia guía usa. De ahí las tres piezas:
 *
 * · Controles **de verdad**, no `div` con `role` puesto a mano: el foco, el
 *   orden de tabulación, las flechas y la exclusión los trae el nativo.
 * · **Nombres estables**: «Claro», «Oscuro» y «Sistema» no cambian nunca. Era
 *   el error clásico del interruptor —«Activar modo oscuro» → «Desactivar modo
 *   oscuro»—: quien navega por voz dice el nombre para pulsarlo, y si el nombre
 *   cambia al usarlo, el control se le escapa cada vez. Aquí no puede pasar:
 *   el nombre de cada opción es lo que la opción ES.
 * · Y **el estado no se dice solo con color** [WCAG 1.4.1]: lo dicen la palabra
 *   escrita de cada opción y el `checked` nativo, que es lo que oye quien no ve
 *   ni el color ni la palabra.
 *
 * ⚠️ **EL DIBUJO DEL TERCER ESTADO SON LOS OTROS DOS JUNTOS**, y se llegó ahí
 *    midiendo, no eligiendo. El censo de símbolos de esta casa —ficheros de
 *    Google, uno a uno, con su sha256 y su ficha en el notices— **no tiene
 *    ninguno que diga «sigue al aparato»**, y bajar uno nuevo pide su fichero,
 *    su ficha y pasar el portero de `simbolos.spec.ts`, que compara el `d`
 *    carácter a carácter: eso es una tanda, no un fleco.
 *
 *    · Repetir el sol en la tercera no vale: dos opciones con el mismo dibujo
 *      es justo lo que 1.4.1 no quiere.
 *    · Dejar la tercera SIN dibujo tampoco: se probó y **se miró** —captura
 *      `tercero-pc-dark.png` del 20/09—, y con dos celdas de dos pisos y una de
 *      uno, «Sistema» cuelga de otra línea base y el grupo se lee torcido.
 *    · Quitarles el dibujo a las tres lo dejaba derecho, y **una jueza lo cazó
 *      en el acto**: `light_mode` y `dark_mode` se quedaban sin pintar en toda
 *      la app —«símbolos que nadie pinta»— y el catálogo tiene que gastarse
 *      entero. Dos ficheros muertos en el paquete y en el notices.
 *
 *    Así que la tercera lleva **el sol y la luna a la vez**, que es lo que de
 *    verdad significa: el que diga el aparato. Ningún fichero nuevo, ningún
 *    fichero huérfano, ningún tamaño fuera de la retícula —los dos a 20, que es
 *    instancia del eje óptico—, y las tres celdas con la misma altura.
 *
 * ⚠️ La marca va `aria-hidden`: el nombre de cada opción lo pone su palabra, y
 *    decirlo dos veces es ruido para quien escucha.
 *
 * ── Dónde se pinta ──────────────────────────────────────────────────────────
 *
 * En dos sitios de la app pública, y **nunca en los dos a la vez**: el cuarto
 * hueco de la barra de pestañas en móvil, y la cabecera del panel en
 * escritorio. Cada variante se apaga en el ancho de la otra; ver `styles.css`.
 *
 * ── ⭐ Y DESDE EL 20/09, UNA TERCERA: `suelta` ──────────────────────────────
 *
 * La pide la intranet. `/visor` y `/panel` no tienen barra de pestañas ni
 * cabecera del Buscador, así que con la variante de escritorio el conmutador
 * **desaparecía por debajo de 768** —`.conmutador` lo apaga ahí porque en móvil
 * manda el hueco de la barra— y esas dos páginas se quedaban otra vez sin
 * forma de cambiar de tema. Medido antes de tocar nada: `0×0 px · display
 * none` en los dos, a 390.
 *
 * ⚠️ **POR QUÉ EL ARREGLO VIVE AQUÍ Y NO EN LA HOJA GLOBAL**, que es la parte
 *    que importa. [DOC Angular · *Styling components*] la encapsulación
 *    emulada —la de serie— garantiza que los estilos de un componente no
 *    salgan de él, «sin embargo, los estilos GLOBALES definidos fuera de un
 *    componente SÍ pueden afectar a los elementos de dentro». Las dos mitades
 *    de esa frase mandan aquí:
 *
 *    · la segunda es la causa raíz de la colisión de `.panel` (bitácora del
 *      20/09): en una hoja global, el nombre de una clase es un identificador
 *      de TODA la aplicación, y una página nueva que lo reutilice hereda en
 *      silencio la maquetación de otra;
 *    · la primera es la que se aprovecha ahora: **un estilo declarado en este
 *      componente no puede tocar a nadie más**. Así que la tercera variante no
 *      añade ni una línea a `styles.css` —ni un nombre de la intranet a la
 *      hoja que SÍ viaja a producción— y no puede colisionar con nada.
 *
 * ⚠️ Y **no copia el vestido, lo hereda**: `suelta` lleva las DOS clases,
 *    `conmutador` —la píldora, las tintas, el anillo de foco, los 44 de cada
 *    opción— y `conmutador--suelta`, que solo deshace el apagado por ancho. Un
 *    segundo juego de colores escrito a mano es justo lo que la casa no tiene.
 *
 * ⚠️ La posición en escritorio **NO CONSTA** en DISEÑO ni en la maqueta —el §35
 *    firma el conmutador y el §20 le guarda el hueco de móvil, pero de PC no
 *    dicen nada—. Se pinta donde la cabecera lo admite (arriba a la derecha,
 *    a la altura del `h1`) y va a capturas: la posición la ratifica un ojo, no
 *    se parlamenta a ciegas.
 */
@Component({
  selector: 'app-conmutador-de-tema',
  imports: [Simbolo],
  /**
   * ⚠️ DOS REGLAS, Y ENCAPSULADAS A PROPÓSITO.
   *
   * · `.conmutador--suelta` deshace el `display: none` que `.conmutador` trae de
   *   partida en la hoja global. Pesa (0,2,0) contra los (0,1,0) de aquélla
   *   —dentro y fuera de sus `@media`—, así que gana por especificidad y no por
   *   orden de hojas, que es lo que no se deshace al reordenar.
   *   ⚠️ Y de ahí que `.conmutador` TENGA que salir apagado: si algún día
   *      alguien le pusiera un `display` visible de partida, esta regla dejaría
   *      de pintar nada y no se notaría —la intranet se vería igual, por otro
   *      motivo—. Lleva portero en `pintura.spec.ts`.
   * · `.conmutador__leyenda` esconde el nombre del grupo **sin sacarlo del árbol
   *   de accesibilidad**: 1×1 px y `clip-path`, que es el gesto de la casa
   *   —`.modo__radio`, en `buscador.css`, hace lo mismo con los radios de modo—.
   *   Ni `display: none` ni `visibility: hidden`: las dos lo callarían.
   */
  styles: `
    .conmutador--suelta {
      display: inline-flex;
    }

    .conmutador__leyenda {
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      overflow: hidden;
      clip-path: inset(50%);
      white-space: nowrap;
    }
  `,
  template: `
    <fieldset [class]="clase()">
      <legend class="conmutador__leyenda">Tema</legend>
      @for (o of OPCIONES; track o.valor) {
        <label class="conmutador__opcion" [class.conmutador__opcion--puesta]="tema.elegida() === o.valor">
          <input
            class="conmutador__radio"
            type="radio"
            [name]="nombreDelGrupo()"
            [value]="o.valor"
            [checked]="tema.elegida() === o.valor"
            (change)="tema.elegir(o.valor)"
          />
          <span class="conmutador__marca" aria-hidden="true">
            @if (o.valor === 'sistema') {
              <app-simbolo nombre="light_mode" [lado]="20" />
              <app-simbolo nombre="dark_mode" [lado]="20" />
            } @else {
              <app-simbolo [nombre]="o.valor === 'oscuro' ? 'dark_mode' : 'light_mode'" [lado]="20" />
            }
          </span>
          <span class="conmutador__texto">{{ o.rotulo }}</span>
        </label>
      }
    </fieldset>
  `,
})
export class ConmutadorDeTema {
  /** Las tres, cada una con su palabra. El dibujo lo pone la plantilla —sol,
      luna, y los dos para «Sistema»—, y el porqué está arriba. */
  protected readonly OPCIONES = [
    { valor: 'claro', rotulo: 'Claro' },
    { valor: 'oscuro', rotulo: 'Oscuro' },
    { valor: 'sistema', rotulo: 'Sistema' },
  ] as const satisfies readonly { valor: EleccionDeTema; rotulo: string }[];

  /**
   * `barra` se calza el traje de las pestañas de móvil; `cabecera`, el de PC; y
   * `suelta`, el de una página que no tiene ni lo uno ni lo otro — la intranet.
   */
  readonly variante = input<'barra' | 'cabecera' | 'suelta'>('cabecera');

  /**
   * ⭐ UN `name` POR VARIANTE, y no es cosmético: ver la cabecera. En la portada
   * están las dos en el DOM a la vez —una apagada por ancho— y con el mismo
   * nombre el navegador haría de las seis un solo grupo.
   */
  protected readonly nombreDelGrupo = computed(() => 'tema-' + this.variante());

  /** El traje que toca. Las tres llevan `conmutador` —la píldora, las tintas,
      el anillo, los 44 de cada opción— y su modificador, que solo decide DÓNDE
      se enciende. El vestido no se copia: se hereda. */
  protected readonly clase = computed(() => {
    switch (this.variante()) {
      case 'barra':
        return 'conmutador conmutador--barra';
      case 'suelta':
        return 'conmutador conmutador--suelta';
      default:
        return 'conmutador conmutador--cabecera';
    }
  });

  protected readonly tema = inject(Tema);
}
