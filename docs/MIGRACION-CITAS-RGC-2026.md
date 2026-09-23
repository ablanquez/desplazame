# Migración de las citas al RGC reformado — RD 518/2026

> **Fecha:** 2026-09-23 · **Alcance:** las citas al Reglamento General de
> Circulación en **producto y motor**. Esta tanda es de **citas**, no de reglas:
> ni una regla del motor cambia aquí. Lo que la letra nueva sí mueve va
> declarado como **PARO** al final, para decisión aparte.
>
> **Por qué ahora:** la caducidad que el código llevaba declarada desde agosto
> vence el **1 de octubre de 2026**, que es cuando entra en vigor el RD
> 518/2026.

---

## 0 · Las fuentes, y su enlace permanente

Todas comprobadas **en vivo el 23/09/2026**: `curl -L`, código 200, y el
`<title>` servido es el que se dice aquí.

| Norma | Permalink ELI | Sirve |
|---|---|---|
| RGC — RD 1428/2003 (**consolidado**) | `https://www.boe.es/eli/es/rd/2003/11/21/1428/con` | BOE-A-2003-23514 · «última actualización publicada: 26/06/2026» |
| La reforma — RD 518/2026 | `https://www.boe.es/eli/es/rd/2026/06/24/518` | BOE-A-2026-13889 |
| Ley de Tráfico — RDLeg 6/2015 (**consolidado**) | `https://www.boe.es/eli/es/rdlg/2015/10/30/6/con` | BOE-A-2015-11722 |
| Ley 37/2007, reutilización (**consolidado**) | `https://www.boe.es/eli/es/l/2007/11/16/37/con` | BOE-A-2007-19814 |

**Por qué el ELI y no la URL de búsqueda:** el permalink ELI es el enlace
*permanente* a la norma —las URLs de búsqueda caducan—, y con el sufijo `/con`
apunta al **texto consolidado**. Eso significa que, desde el 1/10, ese mismo
enlace servirá el texto reformado **sin que haya que tocar nada**.

**La norma se leyó en su XML oficial**, no en prensa ni en resúmenes:
`https://www.boe.es/diario_boe/xml.php?id=BOE-A-2026-13889` (89.914 B) y
`…?id=BOE-A-2003-23514` (600.636 B).

---

## 1 · El censo, antes de tocar nada

**36 citas** al RGC en `motor/src`, `app/src` y `tipos/src` (`.ts` y `.html`).
Ninguna en texto visible: las de producto son comentarios, y la única línea que
el usuario podría leer es del **log del motor** (`servidor.ts:339`), que cita el
art. 50 y **no cambia**.

| Grupo | Cuántas | Dónde |
|---|---|---|
| **A · art. 121.1** → migra | 5 | `andando.ts` 28 · 50 · 97 · 109 · `andando.spec.ts` 15 |
| **B · art. 121.2** → migra | 9 | `rueda.ts` 89 · 253 · `red-rueda.ts` 19 · 547 · `etapas.ts` 278 · `servidor.ts` 378 · `tipos/index.ts` 779 · `empuje.spec.ts` 11 · `tramos.spec.ts` 26 |
| **C · art. 50** → QUEDA | 17 | `red-rueda.ts` ×10 · `rueda.ts` ×3 · `servidor.ts` ×2 · `rueda.spec.ts` ×2 · `buscador.ts` 972 · `buscador.spec.ts` 2120 |
| **D · art. 48** → QUEDA | 2 | `yego.ts` 108 · `viaje-yego.ts` 50 |
| **E · «RGC» en prosa, sin artículo** | 3 | `andando.ts` 79 · `andando.spec.ts` 24 · `rueda.ts` 555 |

**Ninguna cita del RGC lleva URL**, así que en el grupo que migra no hay nada
que convertir a ELI. La única URL al BOE del **producto** está en
`creditos.html` y es la `buscar/act.php?id=…` de la Ley 37/2007 — justo la
forma caducable que el ELI sustituye.

---

## 2 · La tabla: vieja → nueva

Cada destino **verificado contra el BOE** (el XML del RD 518 o el consolidado),
nunca contra prensa.

### A · art. 121.1 → **art. 122.1**

El 121 reformado deja de ser la regla de la vía y pasa a ser **el principio**
(«Normas generales»: prioridad de paso y estancia del peatón). La regla que
usamos vive ahora en el **122.1**, cuyo epígrafe es «Circulación por la calzada
o el arcén».

**Literal nuevo, verbatim del RD 518, punto Veintiuno:**

> «1. En los supuestos en los que no exista zona peatonal practicable, los
> peatones deberán circular por el arcén izquierdo en el sentido de su marcha,
> si existe y es practicable o, en su defecto, por la calzada. En ambos casos,
> deberán hacerlo lo más alejados posible del tránsito de los vehículos.»

**Literal viejo, verbatim del consolidado (art. 121.1 vigente hasta el 30/09):**

> «1. Los peatones están obligados a transitar por la zona peatonal, salvo
> cuando ésta no exista o no sea practicable; en tal caso, podrán hacerlo por
> el arcén o, en su defecto, por la calzada, de acuerdo con las normas que se
> determinan en este capítulo (artículo 49.1 del texto articulado).»

⚠️ **HALLAZGO — lo que citábamos como «literal» no lo era.** `andando.ts:50`
abría *«[LEY RGC art. 121.1, literal]»* y a continuación ponía «Los peatones
transitarán por la zona peatonal, salvo cuando ésta no exista o no sea
practicable, en cuyo caso podrán hacerlo por el arcén o, en su defecto, por la
calzada». Eso **no es el texto del artículo**: es una paráfrasis fiel en el
sentido, pero no en las palabras. Se corrige de paso, porque la palabra
«literal» es una promesa.

### B · art. 121.2 → **art. 122.2.a**

**Literal nuevo, verbatim:**

> «2. En todo caso, será obligatorio circular por la derecha […]:
> a) Quienes empujen o arrastren un ciclo, ciclomotor de dos ruedas, vehículo
> de movilidad personal o vehículos de similares características.»

**Literal viejo (art. 121.2.a):** «El que lleve algún objeto voluminoso o
empuje o arrastre un vehículo de reducidas dimensiones que no sea de motor, si
su circulación por la zona peatonal o por el arcén pudiera constituir un
estorbo considerable para los demás peatones.»

⭐ **Y el texto nuevo nos viene mejor, no peor:** el viejo hablaba de «un
vehículo de reducidas dimensiones **que no sea de motor**», y un VMP lleva
motor; el nuevo **nombra expresamente** el ciclo, el ciclomotor de dos ruedas y
el vehículo de movilidad personal, que son exactamente los tres casos que el
motor empuja a 5 km/h.

⚠️ **Y DÓNDE VIVE DE VERDAD «QUIEN LO LLEVA EN LA MANO *ES* PEATÓN».** Seis de
estas citas no dicen «puede ir por la calzada»: dicen que **es peatón**. Eso
**nunca estuvo en el art. 121.2**, ni antes ni después — está en el **anexo I,
concepto 4, del texto refundido de la Ley de Tráfico** (RDLeg 6/2015), verbatim:

> «También tienen la consideración de peatones quienes empujan o arrastran un
> coche de niño o de una persona con discapacidad o cualquier otro vehículo sin
> motor de pequeñas dimensiones, **los que conducen a pie un ciclo o ciclomotor
> de dos ruedas**, y las personas con discapacidad que circulan al paso en una
> silla de ruedas, con o sin motor.»

Y ese concepto 4 **no lo toca la reforma**: la disposición final primera del RD
518 modifica los conceptos 2, 59, 74, 75, 76 y 77 del anexo I y añade el 83 al
86 — el 4 no está en la lista. Así que esas citas se migran **diciendo las dos
cosas**: el 122.2.a nuevo para la regla de circulación, y el anexo I.4 de la
Ley para la condición de peatón, que es la que el motor ejerce.

### C · art. 50 — **DICTAMEN: NO SE TOCA, LA CITA QUEDA**

El RD 518 modifica **26 puntos**, y están todos enumerados de «Uno.» a
«Veintiséis.» en su artículo único: los artículos 12, 18, 31, 32, 35, 36, 38,
48.1.b, 64, 65, 69, 85, 87.1.b, 88, 92, 93 (suprimido), 98.3 (suprimido), 118,
119, 121, 122, 123, 124.4, 125, el nuevo título VI y el anexo I 4.2.d.

**El artículo 50 no aparece en esa lista.** Sigue con la redacción del RD
970/2020 en vigor desde el 11/05/2021, que es justo lo que `rueda.ts:487` ya
declara. **Las 17 citas del grupo C se quedan como están**, sin nota de reforma:
ponerles una diría algo falso.

### D · art. 48 — **QUEDA, y se dice por qué**

El RD 518 **sí** toca el 48, pero solo **el párrafo b) del apartado 1**:
transporte escolar y de mercancías peligrosas, y los 80 km/h del autobús con
pasajeros de pie fuera de poblado. **La tabla de velocidades máximas del
apartado a) —de donde sale el techo del ciclomotor que cita `yego.ts`— no se
toca.** La cita queda; se anota el matiz donde vive.

### E · Las tres de prosa

`andando.ts:79`, `andando.spec.ts:24` y `rueda.ts:555` nombran «el RGC» sin
artículo, hablando del reglamento como fuente. No hay número que migrar.

---

## 3 · Las transitorias, revisadas una a una

El RD 518 trae tres disposiciones transitorias de un año: cascos de protección
en ciclomotores, guantes y asientos/remolques en bicicletas, y la obligación de
alumbrado diurno en VMP. **Ninguna asoma por nuestras citas**: no tocamos
equipamiento ni alumbrado. Se dejan dichas aquí, que es donde se buscarán.

---

## 4 · Los dos PAROs — la letra nueva toca terreno del motor

**No se ha tocado ni una regla.** Van con su letra exacta y su artículo, para
decisión aparte.

### PARO 1 · El arcén izquierdo: de permiso a obligación, y con lado

El 121.1 viejo decía que el peatón **«podrá»** ir por el arcén o, en su
defecto, por la calzada. El 122.1 nuevo dice que **«deberá circular por el
arcén izquierdo en el sentido de su marcha»**.

Lo que **no** cambia: la calzada sigue abierta «en su defecto», que es
exactamente lo que la tabla de acceso del peatón ejerce. Por eso la migración
de la cita es honrada sin tocar nada.

Lo que **sí** aparece y hoy no modelamos: el **arcén** como espacio propio y el
**lado izquierdo** como obligación. Nuestro grafo lleva una arista por calzada,
sin arcén y sin lado. Modelarlo —o decidir que no se modela— es decisión de
Antonio.

### PARO 2 · El título VI abre a los ciclistas las zonas peatonales que no son acera

El motor cierra hoy `footway` y `pedestrian` a la rueda (`ACCESO_RODANDO`:
`footway: false`, `pedestrian: false`), y lo apoya en **[ORD Zaragoza art.
50.6]**: «prohibido circular por las aceras, vías o zonas peatonales». La letra
nueva dice otra cosa, verbatim:

> **Art. 153.2:** «Los ciclistas no podrán circular por las aceras, con las
> excepciones previstas en el artículo 152.1 para los menores de doce años
> cuando así lo establezca la Autoridad municipal, **pero sí por el resto de
> las zonas peatonales**, con las limitaciones o restricciones que pueda
> establecer la Autoridad municipal, y respetando siempre la prioridad y la
> seguridad de los peatones en estas zonas.»
>
> **Art. 151.3:** «Las ordenanzas municipales no podrán oponerse, alterar,
> desvirtuar o inducir a confusión con los preceptos de este reglamento.»

O sea: la prohibición general de la Ordenanza de Zaragoza y el reglamento nuevo
**no dicen lo mismo** sobre las zonas peatonales que no son acera (plazas,
bulevares, paseos — el anexo I.59 reformado las nombra). Y el art. 155.2 manda
a los VMP al mismo régimen que el 153.

**No se toca el motor.** Decidir si nuestra tabla sigue a la Ordenanza o al
reglamento nuevo, y con qué dato se distingue una acera de una plaza, es
decisión de Antonio con su parlamento.

---

## 5 · Lo que se ha visto y queda fuera de esta tanda

Ocho URLs `buscar/act.php?id=BOE-A-2007-19814` (Ley 37/2007) en `README.md` y
`THIRD-PARTY-NOTICES.md`. Son del registro de licencias, no del producto ni del
motor, así que quedan fuera del alcance censado. Su ELI está comprobado arriba
y la sustitución sería mecánica el día que se pida.
