# H2a · Tanda 7 · Puerta 3 — qué se publica y cómo no mentir

**Fecha:** 11/08/2026 · **Base:** `3363cc1` · **Puerta 3 de 3. Con ésta se cierra H2·7.**
**⭐⭐⭐ Los seis límites viajan DENTRO del artefacto, no en el README. Cinco tienen guardián con
`A.exige`; uno vive en otro artefacto y también lo tiene. Y el guardián de L6 nació sin servir para
nada: lo destapó su propia provocación.**

---

## §1 · El criterio que ordena la puerta

> **Un límite escrito en el README no protege a nadie, porque quien consulta un enlace no lee el
> README.**

⇒ Cada límite viaja **con el dato al que afecta**. Y cada uno lleva debajo un `A.exige`: **un límite
sin guardián es una intención.**

---

## §2 · La tabla de los seis

| | límite | dónde vive | qué lo mantiene vivo |
|---|---|---|---|
| **L1** | 172 paradas invisibles | `artefacto.sinEnlaces` — **las 172 con código, nombre y motivo** | ✅ `A.exige` sobre el recuento (172) y sobre que cada una lleve `code` y `motivo` |
| **L2** | el veredicto de dos campos | `artefacto.campos` + los campos `camino`/`lado` **en cada enlace** | ✅ `A.exige`: **todo valor emitido tiene leyenda**, y el aviso separa `CONOCIMIENTO` de `IGNORANCIA` |
| **L3** | la red es la del periodo del feed | `artefacto.cobertura` — periodo, aviso, `PA00617` y las 8 zombis | ✅ `A.exige` sobre las **8** líneas sin viajes y sobre **la ausencia de `PA00617`** |
| **L4** | los dos sentidos condicionales | `sentido.terminal.aviso` en `tools/gtfs/red-bus.js` | ✅ `A.exige` de banda de cuota (ya existía) **+ nuevo**: que el aviso exista y **nombre el segundo terminal** |
| **L5** | caducidad, licencia y atribución | `artefacto.feed` **+** la sección Licencia del README | ✅ `A.exige` sobre `version`/`fin`/`atribucion`/`procesado`, y que `fin === '20261005'` |
| **L6** | nunca «todos», nunca «el más rápido» | *no es un campo: es una prohibición sobre todo el artefacto* | ✅ `A.exige` con 7 patrones sobre el JSON entero, **con provocación dentro** |

⛔ **Ninguno se queda sin guardián.** ⚠️ Pero eso no es una buena noticia entera: ver §6, la deuda.

### 2.1 · Las palabras exactas, tal como viajan

**L1** — `artefacto.sinEnlaces.aviso`:
> *Para estas paradas este artefacto NO dice nada. ⛔ No significa que no haya transbordo: significa
> que a menos de 300 m no hay ninguna parada que aporte línea nueva. Puede haber una a 320 m y no se
> ha calculado.*

⭐ **Y las 172 van con nombre y código dentro.** Sin ellas, una consulta sobre una de esas paradas
devolvería **una lista vacía**, y *una lista vacía es indistinguible de «no hay transbordo»*.

**L2** — `artefacto.campos.lado.aviso`:
> *⛔ `sin-lados-en-el-grafo` es CONOCIMIENTO («el dibujo no tiene dos lados») y `no-consta` es
> IGNORANCIA («podría tenerlos y no llegamos al listón»). Son lo contrario y no se pueden leer
> igual.*

**L3** — `artefacto.cobertura`:
> *Ésta es la red del PERIODO DEL FEED, no la de la ciudad. Una parada que no esté en `stops.txt` no
> existe aquí aunque exista en la calle.* · *`PA00617` (Parque de Atracciones) no está en
> `stops.txt`: quien lo busque un día de feria no encontrará la parada.*

**L4** — `sentido.terminal.aviso`, medido y escrito:
```
   23 s0 → ⚠️ El 32 % de los viajes de este sentido NO acaba en "19414" sino en "17871".
            Depende de LA HORA. ⛔ Las paradas de más allá del terminal corto NO se sirven
            en todos los viajes.
   44 s0 → ⚠️ El 39 % … Depende de EL DÍA DE LA SEMANA. …
```
⭐ La cuota (`cuotaSegundo: 0.32`) ya estaba desde H2·6. **Pero un número no avisa a nadie**: quien
lea la lista de paradas del sentido dará por hecho que todos los viajes las hacen. **El «sí» falso
manda a alguien a esperar un autobús que no viene.**

**L5** — `artefacto.feed`:
```json
{"version":"20260623_AUZSA_Y_TRANVIA","inicio":"20260623","fin":"20261005",
 "caduca":"2026-10-05","procesado":true,
 "fuente":"Punto de Acceso Nacional (NAP) · Ministerio de Transportes y Movilidad Sostenible",
 "atribucion":"Powered by MITRAMS","atribucionUrl":"https://nap.transportes.gob.es"}
```

---

## §3 · ⛔⛔ El guardián de L6 nació sin servir para nada

Lo escribí, **salió verde a la primera**, y después le di la frase prohibida como pide la ley 156:

```
   ⭐ provocado: con la frase «el transbordo más rápido» dentro ⇒ ⛔ NO LO CAZA
   ⛔ FALLO · L6 · el guardián no caza «el transbordo más rápido»: su cero no vale nada
```

**El patrón era `/\bel m[áa]s r[áa]pido\b/i` y la frase real lleva una palabra en medio.** Estaba
pegado a `el` **porque así la escribí yo en la cabeza al redactarlo**. Ahora busca el núcleo
(`/m[áa]s r[áa]pid/i`) y **la provocación se queda dentro del script**.

⚠️ **Y su límite, declarado: vigila el ARTEFACTO, no el README.** Aplicado a la prosa daría falso
positivo en *«no se puede prometer el mejor»*, que es una negación. **Un detector de promesas no
distingue una promesa de su negación.** Bitácora nº191.

### 3.1 · Qué frases actuales incumplían L6

**Ninguna.** Comprobado con el mismo criterio sobre `README.md`, `src/relato.js` —que es el redactor
de la salida que ve el usuario— y los cinco instrumentos de `tools/`:

```
   grep -niE "m[áa]s r[áa]pid|mejor ruta|[óo]ptim|todos los transbordos|garantiz|\bel mejor\b"
   ⇒ los únicos aciertos son los patrones del propio guardián y la NEGACIÓN del README nuevo
```

⭐ **Y no es casualidad: es que la salida de `relato.js` ya está escrita con esta ley.** Termina
diciendo lo que el motor **no** sabe —giros, semáforos, cuestas, obras, y por cuál de las dos aceras
vas—, que es la forma positiva de la misma regla.

---

## §4 · ⭐⭐ El párrafo del hito

Escrito en el README, antes de *«Qué hay dentro, en números»*:

> **Entre dos paradas de autobús, la distancia que importa no es la que hay en línea recta: es la
> que se anda.** Casi todos los buscadores resuelven el enlace entre líneas con un radio a vuelo de
> pájaro, porque no tienen por dónde andar. Aquí hay un grafo peatonal de la ciudad entera, así que
> el enlace se calcula andando.
>
> | | |
> |---|---|
> | Andar frente a la línea recta | **1,29×** en la mediana |
> | El bus más cercano a cada parada de tranvía | **66 m** volando · **87 m** andando ⇒ **1,31×** |
>
> ⇒ **Un radio no se queda corto en los casos raros: se queda corto en la mitad.**
>
> ⛔ **Y lo segundo: este proyecto NO sabe por qué acera vas.** De los 2.538 enlaces, en **1.456
> (57,4 %) no sabe de qué lado de la calle va el camino**, y en **247 (9,7 %) sabe que el dibujo no
> tiene dos lados** — que es lo contrario de no saberlo. **La diferencia con un radio no es que aquí
> se sepa: es que aquí se puede decir, enlace por enlace, qué no se sabe.**
>
> ⚠️ **Nada de esto dice cuál es el transbordo más rápido**, ni pretende decirlo.

### 4.1 · La ley 157 pasada a mi propio párrafo

| frase | ¿puede un lector concluir algo que no sabemos? |
|---|---|
| *«1,29× en la mediana»* | ✅ es distancia, no tiempo, y se dice «mediana», no «siempre» |
| *«66 m volando · 87 m andando»* | ✅ misma población (las 48 con bus a ≤300 m), declarado en §6.3 de la Puerta 2 |
| *«un radio se queda corto en la mitad»* | ✅ es exactamente lo que dice una mediana de 1,29× |
| *«no sabe de qué lado va el camino»* | ✅ y va con su número: 1.456 de 2.538 |
| *«un radio no llega a formular la pregunta»* | ⚠️ **es una afirmación sobre OTROS sistemas.** Se sostiene solo porque un radio no produce camino, y sin camino no hay aristas de las que preguntar el lado. **Es lo más frágil del párrafo** |
| *«nada de esto dice cuál es el más rápido»* | ✅ negación explícita — es la vacuna de L6 |

⛔ **Lo que se cayó al pasar la prueba:** la primera versión decía *«sabemos de qué lado son 7 de
cada 100 aristas»*, tomando el 6,7 % de la Puerta 1. **Ese 6,7 % es de los 67 enlaces `ACERA`, no de
los 2.538**, y en el párrafo del hito habría sonado a global. Se sustituyó por los dos números que
sí salen de los 2.538 enteros.

---

## §5 · ⭐⭐ Ley 111 — cuál de los seis muere primero

Todo documento envejece cuando muere su contradictor. Los seis van a envejecer, y no a la vez:

| | muere cuando | ¿avisa algo? |
|---|---|---|
| **L5** | **el 05/10/2026**, y es el primero: es una fecha escrita | ⚠️ **NADIE.** El `A.exige` comprueba que la fecha VIAJE, no que no haya pasado. **Es la deuda más clara de esta tanda** |
| **L3** | al descargar un feed nuevo: cambian las zombis y puede aparecer `PA00617` | ✅ **sí**: los dos `A.exige` se ponen rojos solos |
| **L4** | si Avanza cambia los recorridos condicionales | ✅ **sí**: la banda de cuota (`0,28–0,36` y `0,35–0,43`) salta |
| **L1** | si se toca el radio de 300 m o entran paradas nuevas | ✅ **sí**: el `A.exige` del 172 |
| **L2** | si se baja el listón de cobertura — **decisión pendiente de Antonio** | ⚠️ **a medias**: el guardián exige leyenda para todo valor emitido, pero **no vería que los números se muevan** |
| **L6** | nunca por sí solo: muere si alguien añade prosa al artefacto | ✅ **sí**, y ahora de verdad (§3) |

---

## §6 · ⚠️ La deuda, escrita y no disimulada

1. ⛔⛔ **Nada comprueba que el feed no haya caducado.** `A.exige` verifica que `fin === '20261005'`
   viaje dentro — pero **el 6 de octubre seguirá viajando igual y todo seguirá en verde**. Es un
   límite con guardián de FORMA y sin guardián de VIGENCIA. **Es lo primero que hay que arreglar y
   no se ha hecho aquí.**
2. ⚠️ **L2 no tiene guardián de valores, solo de leyenda.** Si el listón de cobertura baja, los
   1.456 `no-consta` se moverán y nada se pondrá rojo.
3. ⚠️ **El artefacto no se escribe a disco**: se mide en memoria. Los límites viajan **en la
   estructura**, y quedan probados; **que sobrevivan a la serialización real es de H2·8.**
4. ⚠️ **L6 no cubre la prosa del proyecto** (§3), y esa prosa es donde vive el riesgo de prometer.

---

## §7 · ⛔ Y una tercera licencia que llevaba seis días sin declarar

El README decía *«Los datos tienen **dos** licencias distintas, y ya son ciertas las dos»*. **El
GTFS entró el 10/08 y su licencia no estaba en ningún sitio** — ni la atribución **Powered by
MITRAMS**, ni la cita al Ministerio, ni la declaración de que el dato republicado es **procesado y
no bruto**.

⚠️ **Y es la segunda vez que miente esa misma sección**: ya dijo *«hoy el repositorio no contiene
ningún dato integrado»* con 46.150 portales dentro. **Bitácora nº192**, con su ley: *una sección de
licencias con un recuento dentro es un contador escrito a mano en el sitio donde más caro sale
equivocarse.*

---

## §8 · ⭐ El cierre de H2·7 — qué queda abierto de las tres puertas

| | cerrado | abierto |
|---|---|---|
| **Puerta 1** | el lado de la acera medido · `MISMA ARISTA` degradada a marca · la explicación de la tanda 8 confirmada | **los 193 enlaces sin examinar** · si un `no-cambia-de-lado` empieza en el lado correcto · **el listón de cobertura, decisión de Antonio** |
| **Puerta 2** | los 2.538 calculados · dos campos · cruce hacia atrás perfecto · artefacto medido | **los 2 `cambia-sin-paso` sin mirar sobre el mapa** · las 172 paradas invisibles siguen invisibles (ahora se dice) |
| **Puerta 3** | los seis límites dentro del dato, con guardián | **la caducidad sin vigilar** · L2 sin guardián de valores · el artefacto sin escribir a disco |

⭐ **Y el tamaño total, actualizado con los límites dentro:**

```
   la red de bus (H2·6) ....... 200,5 KB  ·  gzip  41,9 KB
   los enlaces + los límites .. 491,1 KB  ·  gzip  82,2 KB      (eran 471,7 / 77,8 sin ellos)
   ─────────────────────────────────────────────────────────
   TOTAL ...................... 691,6 KB  ·  gzip 124,1 KB
   ⭐ sin dibujar los enlaces .. 464,1 KB  ·  gzip  67,6 KB
```

⚠️ **Y lo que este número NO decide: el stack.** El motor necesita el **grafo peatonal de 68.649
nodos en ejecución** para el primer y el último tramo, y ése es el que manda. **124 KB de enlaces no
dicen nada sobre si hace falta Node.**

---

## §9 · DESCUBRIMIENTOS PARA EL ESTADO

⛔ `DESPLAZAME-ESTADO.md` no se toca.

1. ⭐⭐⭐ **Los seis límites viven dentro del artefacto y los seis tienen guardián.** El artefacto
   pasa de 471,7 a **491,1 KB** (82,2 gzip) por llevarlos: **19,4 KB es lo que cuesta no mentir.**
2. ⛔⛔ **El guardián de L6 nació sin servir para nada y lo destapó su propia provocación**
   (bitácora nº191). Ley nueva: *un guardián de texto se escribe desde el núcleo de lo prohibido,
   no desde la frase que se te ocurrió.*
3. ⛔ **El README declaraba dos licencias y el proyecto usa tres desde el 10/08** (bitácora nº192).
   Segunda vez que miente esa sección. Ley nueva: *un recuento en prosa es un contador a mano.*
4. ⭐⭐ **L4 pasa de ser un número a ser un aviso**: `sentido.terminal.aviso` en castellano, con el
   segundo terminal nombrado y su `A.exige`.
5. ⚠️ **La deuda más clara: nada comprueba que el feed no haya caducado.** El 06/10/2026 todo
   seguirá en verde.
6. ⭐ **Ninguna frase del README ni de `relato.js` incumplía L6**, y se enseña cómo se comprobó.
7. ⭐⭐ **El párrafo del hito está escrito y pasa la ley 157**, con su punto frágil declarado: la
   frase sobre lo que un radio no puede hacer.

---

**Instrumentos:** [`tools/gtfs/enlaces.js`](../tools/gtfs/enlaces.js) ·
[`tools/gtfs/red-bus.js`](../tools/gtfs/red-bus.js) · **Bitácora:** nº191 y nº192.
