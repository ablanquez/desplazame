# H2a · Tanda 9 — el 5 de octubre: la caducidad y la repetibilidad

**Fecha:** 11/08/2026 · **Base:** `6540041`
**⭐⭐⭐ El guardián que faltaba existe, vive en `src/` para que lo corra la batería, y se ha visto en
rojo. Y el comparador de feeds cazó un número mal publicado en su primera ejecución — el día que no
había cambiado nada.**

---

## §1 · El guardián de vigencia (ley 163)

**El que había comprobaba que la fecha VIAJARA dentro del artefacto. Éste comprueba que no haya
pasado.** Son dos cosas distintas y hacían falta las dos.

### 1.1 · ⭐⭐ Verde hoy, y rojo con el reloj movido

```
   $ node src/probar-vigencia.js
   periodo declarado por el editor      20260623 – 20261005
   fecha de referencia                  20260811   (el reloj del sistema)
   estado                               dentro-del-periodo
   días hasta el fin del periodo        55
   ⇒ ✅ sin fallos. (código de salida 0)

   $ node src/probar-vigencia.js --hoy 20261006
   estado                               fuera-del-periodo-declarado
   días hasta el fin del periodo        -1
   ⛔ FALLO · el feed está en estado «fuera-del-periodo-declarado»
   ⇒ ⛔ 1 FALLO(S). El proceso saldrá en rojo.
```

⭐ **Y la provocación va DENTRO de la ejecución verde**, así que la batería enseña cada día que el
guardián sabe ponerse rojo:

```
   ⭐⭐ LA PROVOCACIÓN, en la misma ejecución — ¿sabe este guardián ponerse rojo?
      con la fecha 20261005 ⇒ se-acaba                      ✅ pasaría
      con la fecha 20261006 ⇒ fuera-del-periodo-declarado   ⛔ SERÍA FALLO
      con la fecha 20261231 ⇒ fuera-del-periodo-declarado   ⛔ SERÍA FALLO
```

### 1.2 · ⛔ Y vive en `src/`, no en `tools/` — ése es el punto

`src/probar-paradas.js:217` solo ejecuta los `.js` de **`src/`**: `tools/` está fuera del universo
de la batería (ley 142). ⇒ **Un guardián de caducidad metido en `tools/` es un guardián que nadie
corre nunca**, y el 6 de octubre seguiría sin enterarse nadie. La lógica vive en
`tools/gtfs/vigencia.js`; **el guardián que la ejecuta a diario vive en `src/`**.

### 1.3 · Los cinco estados, con la ley 157 pasada a cada nombre

| valor | qué dice | ley 157 |
|---|---|---|
| `sin-empezar` | hoy es anterior a `feed_start_date` | ✅ |
| `dentro-del-periodo` | el periodo declarado incluye hoy | ⚠️ se llamaba **`vigente`** y **NO PASABA**: se lee *«el dato es correcto»*. **Un feed puede estar dentro de su periodo y tener la red mal** |
| `se-acaba` | quedan ≤30 días | ✅ Y **no es lo mismo que estar fuera**: el dato sigue siendo el bueno |
| `fuera-del-periodo-declarado` | hoy > `feed_end_date` | ⚠️ se llamaba **`caducado`** y **NO PASABA**: se lee *«esto ya no sirve»*. Lo que se sabe es que **el editor declaró un periodo y terminó** |
| `NO CONSTA` | `feed_info.txt` sin fecha de fin | ✅ |

**Los cinco se provocan y se exigen** — un estado que nunca sale no es un estado, es una promesa.
Y la frontera se comprueba al día: **`20261005` todavía es `se-acaba`; `20261006` ya no.**

### 1.4 · ⚠️ `se-acaba` avisa y NO falla, con su coste declarado

Ponerlo en rojo dejaría la batería roja **treinta días seguidos**, y un rojo que dura un mes enseña
a ignorarlo. ⛔ **El coste, dicho: `se-acaba` avisa y no obliga.** Si nadie lee la salida, el 6 de
octubre uno se entera por el rojo, no por el aviso.

### 1.5 · ⚠️ El instrumento cuyo veredicto cambia sin que cambie el dato

**Todos los demás instrumentos de este proyecto son función del fichero. Éste es función del fichero
Y DEL RELOJ.** Consecuencias:

- **Un reloj mal puesto produce un veredicto falso y no hay forma de saberlo desde dentro.** Lo
  único que se puede hacer es **cotejarlo con algo del repositorio**: si `HOY` es anterior a la
  fecha del ZIP descargado (**20260810**), el reloj va por detrás y el veredicto no vale. **Eso caza
  el reloj atrasado —el que produce un falso «todavía vigente»— y ⛔ NO caza el adelantado.**
- ⭐⭐ **Y por eso el estado NO se puede congelar en el artefacto.** Lo que viaja son **las fechas y
  la regla**; quien sirva el dato recalcula:

```json
"vigencia": { "inicio":"20260623", "fin":"20261005", "caduca":"2026-10-05",
  "reglaDiasAviso": 30,
  "comoSeEvalua": "compara la fecha de HOY con `fin` …",
  "aviso": "⛔ NO se hornea el estado: depende del reloj, no del dato." }
```

⚠️ **El listón de 30 días está DECIDIDO, no medido.** Sale de cuánto se cree que dura una tanda de
este proyecto, y eso no se ha cronometrado nunca.

---

## §2 · El comparador de feeds

### 2.1 · ⭐⭐⭐ Cazó algo el día que no había cambiado nada

```
   routes.txt      3430 bytes = 3430 bytes      53 filas ≠ 52 filas      ⛔
```

**Los bytes cuadran al byte, así que el fichero es el mismo: lo que estaba mal era el recuento.**
Medido: **52 de `route_type` 704 (bus) + 1 de 900 (tranvía) = 53.** El 52 publicado en
`docs/RECONOCIMIENTO-003-TRANSPORTE.md:105` es **el recuento del bus puesto en la columna del
total**, y el tranvía se quedó fuera de su propio recuento.

⭐⭐ **Y el número bueno llevaba un mes publicado en otro documento del mismo proyecto**
(`docs/DISENO-H2A-RED.md:203`: *«de 53 rutas… de 52 de bus…»*). **Nada compara dos documentos entre
sí.** Bitácora nº193.

⛔ El informe **no se reescribe** —es registro histórico—; el ancla del comparador pasa a ser **lo
medido**, con la discrepancia **impresa en cada ejecución**.

### 2.2 · El «sin cambios», y por qué no vale solo

```
   P2 · el diff contra sí mismo ....... 0 hallazgos   ✅
   ⚠️ Y esto NO demuestra que funcione: un comparador roto que no mira nada
     daría exactamente este mismo cero.
```

### 2.3 · ⭐⭐⭐ Siete diferencias provocadas, seis clases, todas cazadas

```
   caducidad   el periodo se mueve al siguiente trimestre     ✅
   version     cambia la feed_version                         ✅
   filas       stops.txt gana una fila                        ✅
   fichero     desaparece shapes.txt                          ✅
   identidad   desaparece una parada                          ✅
   identidad   ⛔ un stop_id cambia de stop_code               ✅
   zombis      una línea zombi resucita                       ✅
   ⇒ 6 de 6 clases
```

⛔ **El sha y los bytes se dejan iguales a propósito** en las mutaciones: si no, todas se cazarían
por el sha y no se probaría nada más.

⚠️ **LÍMITE DECLARADO: se muta la MEDICIÓN en memoria, no el ZIP.** Esto prueba el comparador;
**no prueba el lector de ZIP ni el descargador**, que siguen sin control hasta que exista un segundo
fichero de verdad.

### 2.4 · Qué contestará sobre la estabilidad de los `stop_id`

```
   paradas ................ 984
   formato del stop_id .... "16487" — un entero opaco, sin significado
   stop_code de esa misma . "PA00002"
```

El comparador ya sabe decir: **cuántos desaparecen · cuántos son nuevos · y ⛔⛔ cuántos MANTIENEN
el id y CAMBIAN el `stop_code`** — que es el caso peor, porque **la identidad parecería estable y
señalaría a otro poste.**

⭐ **Y hoy no se puede contestar.** Todo lo que cuadra hoy —las ocho filas, las catorce cifras
idénticas a las de 003— **no valida ningún instrumento: valida que nadie ha tocado el fichero.**

---

## §3 · La línea de flotación

[`docs/H2A-LINEA-DE-FLOTACION.md`](H2A-LINEA-DE-FLOTACION.md): qué se hace el día que el feed
cambie, qué deja de valer según qué cambie, y qué **no** hay que re-medir pase lo que pase (el
grafo, las diez rutas, los 26 congelados: **el GTFS no toca H1**).

⭐ **Su contradictor está escrito dentro:** `node tools/gtfs/comparar-feed.js --otro <zip nuevo>`.
Cada fila de su tabla dice qué salida del comparador la activa. **Si el comparador dice algo que el
documento no prevé, es el documento el que está mal.**

---

## §4 · DESCUBRIMIENTOS PARA EL ESTADO

⛔ `DESPLAZAME-ESTADO.md` no se toca.

1. ⭐⭐⭐ **El instrumento nº143 deja de estar catalogado y pasa a estar arreglado.** El guardián de
   vigencia existe, **se ha visto en rojo con la fecha movida**, y vive en `src/` para que lo corra
   la batería. **Faltan 55 días.**
2. ⛔ **`routes.txt` tiene 53 filas y el reconocimiento publicó 52** (bitácora nº193). El tranvía se
   quedó fuera de su propio recuento. **El número bueno llevaba un mes en otro documento del
   proyecto** y nada los comparó.
3. ⭐⭐ **Ley nueva:** *una columna de recuentos tiene que significar lo mismo en todas sus filas; la
   que mezcla poblaciones no se ve mirando la tabla — las otras siete la arropan.*
4. ⭐⭐ **Ley nueva:** *un veredicto que depende del reloj no se puede congelar en un artefacto.* Lo
   que viaja son las fechas y la regla; el estado se recalcula al servir.
5. ⚠️ **`se-acaba` avisa y no falla**, con su coste declarado: un rojo de 30 días enseña a
   ignorarlo.
6. ⚠️ **El descargador y el lector de ZIP siguen sin control.** La provocación del comparador muta
   la medición, no el fichero.
7. ⚠️ **El listón de 30 días está decidido, no medido.**

---

## §5 · ⚠️ Lo que NO se ha hecho

- **No se ha descargado nada.** Descargar hoy no prueba nada y gasta la única bala del control.
- **El bloque `vigencia` no se ha metido en el artefacto de `enlaces.js`**: se enseña la forma que
  tendría. Meterlo es tocar el artefacto, y eso quedó para H2·8.
- **No hay validador GTFS propio** para el día que llegue un feed que no valide.
- **La fecha interna de `routes.txt` (2025-09-23) no se ha vuelto a comprobar** en esta tanda: se
  cita del reconocimiento y **necesita el segundo fichero para significar algo**.

---

**Instrumentos:** [`src/probar-vigencia.js`](../src/probar-vigencia.js) ·
[`tools/gtfs/vigencia.js`](../tools/gtfs/vigencia.js) ·
[`tools/gtfs/comparar-feed.js`](../tools/gtfs/comparar-feed.js) · **Bitácora:** nº193.
