# H1 · LA VELOCIDAD DEJA DE SER LA DE ANTONIO

<!-- SUPERADOS:INICIO — generado por src/superados.js · ⛔ no editar a mano -->
> ⚠️ **ESTE DOCUMENTO PUBLICA 1 NÚMERO(S) SUPERADO(S).**
> El cuerpo **no se ha corregido**: era verdad el día que se escribió.
>
> | lo que dice aquí | hoy vale | dónde se republicó |
> |---|---|---|
> | `3,8–4,2` | **4,3–4,5** | `data/pruebas/RUTAS-CONOCIDAS.md` · 2026-08-09 |
>
> <sub>la banda de distancia de los 40 min — era DERIVADA de los ~6 km/h y ahora está MEDIDA</sub>
<!-- SUPERADOS:FIN -->

*Tanda 4 · 2026-08-08 · `~6 km/h` → **5,0 km/h**. Decisión de diseño, no corrección.*

> **Este documento se AÑADE, no reescribe nada.** Lo que dicen los informes anteriores era
> verdad el día que se escribió: la velocidad ERA ~6 km/h y SÍ salía de la ruta nº7.

---

## 0 · SI SOLO SE LEE UNA COSA

| | |
|---|---|
| **⭐⭐⭐ qué cambia** | `VELOCIDAD_KMH` pasa de **6** a **5,0 km/h** (1,39 m/s) en `src/relato.js`. |
| **⛔ y no es que 6 estuviera mal** | Era una medida correcta de una persona real. **Lo que cambió es la pregunta**: de *«¿a qué velocidad anda Antonio?»* a *«¿qué velocidad publica un buscador de rutas?»*. |
| **⭐⭐ qué disuelve** | La ruta nº7 era el eje del que colgaban **todos** los tiempos. **Ya no calibra nada.** El eje no se arregla: desaparece. |
| **⛔⛔ qué NO toca** | **Ni un metro.** Comprobado, no supuesto: §A4 idéntica y los seis TOTAL idénticos al decimal. |
| **⚠️ qué queda rojo** | El **visor exportado** sigue publicando 6 km/h. Esta tanda no ejecuta `exportar-*.js`, y `src/velocidad.js` lo dice en voz alta en cada pasada. |

---

## A · LAS FUENTES — y por qué no es la media de la literatura

- **openrouteservice** fija **5 km/h** para los perfiles a pie en todos los tipos de vía
  permitidos.
- Las isócronas basadas en **OSRM / Valhalla** usan **5 km/h** por defecto, descrito como
  *«un ritmo moderado para un adulto medio»*.

⭐⭐⭐ **Y la razón de peso es de diseño.** Este proyecto se define por **no** usar OSRM,
Valhalla ni GraphHopper: el motor de rutas es código propio. **Compartir su constante hace
que estos tiempos sean COMPARABLES con los suyos.** Si alguien contrasta una ruta de aquí
con otro motor y sale lo mismo, **eso valida el motor**. Con 6 o con 6,67 no cuadraría y no
se sabría por qué.

⚠️ **Dato de contexto, ⛔ NO validación:** la velocidad de marcha preferida en humanos suele
caer entre **1,10 y 1,65 m/s (4,0–5,9 km/h)**. Antonio declara ~9 min/km = **6,67 km/h**,
por encima de ese rango. ⭐ Eso no dice que ande mal: dice que **su ritmo no puede calibrar
un buscador para cualquiera**, que es exactamente el argumento.

---

## B · LOS TIEMPOS, ANTES Y DESPUÉS

⛔ Los metros son los mismos. **Lo único que se mueve es el divisor.**

| ruta | metros | antes (~6 km/h) | ahora (5,0 km/h) |
|---:|---:|---:|---:|
| 2 | 598,1 | 6 min | **7 min** |
| 3 | 3.704,9 | 37 min | **44 min** |
| 4 | 505,9 | 5 min | **6 min** |
| 5 | 477,4 | 5 min | **6 min** |
| 6 | 520,2 | 5 min | **6 min** |
| 7 | 2.528,9 | 25 min | **30 min** |

⚠️ La ruta nº1 no se resuelve —sus dos extremos caen en un hueco de su propia acera— y por
eso no tiene tiempo. Es una expectativa declarada, no un hueco.

---

## C · ⭐⭐ LAS TRES BANDAS — lo que pasa con ellas, y por qué NO se tocan

Las bandas viven en `data/pruebas/RUTAS-CONOCIDAS.md`, que **es de Antonio y no se toca**.
Aquí se dice qué les pasa, sin escribir en ese fichero:

| tiempo declarado | banda publicada (a ~6 km/h) | lo que daría a 5,0 km/h |
|---|---|---|
| 5 min | ~450–550 m | **~375–460 m** |
| 25 min | **~2,4–2,6 km** ⭐ *medida con GPS* | ~1,9–2,3 km |
| 40 min | ~3,8–4,2 km | **~3,0–3,7 km** |

⛔⛔ **Y la fila de 25 min es la que hay que mirar.** Esa banda **NO es derivada: es MEDIDA**
con GPS de pulsera. A 5,0 km/h, 25 minutos serían 2,1 km — y el GPS dice 2,6 km.

⇒ ⭐⭐⭐ **El dato medido y la constante estándar ya no cuadran, y eso es correcto.** No es un
fallo: es la consecuencia exacta de la decisión. Antonio recorre esos 2,6 km en 25 min
**porque anda a 6,7 km/h**. Un buscador que publique 5,0 km/h le dirá **30 min** para su
propio trayecto, y le dirá de más — a él. A cualquier otro, no.

---

## D · ⚠️ LA CIRCULARIDAD SIGUE VIVA, y no se ha arreglado

El bloque C ya midió que **dos de las tres bandas se derivaron de la velocidad**, así que
comparar una ruta con su banda no puede fallar por una calibración mala: **banda y ruta se
mueven juntas** (ley 96).

⛔ **Cambiar 6 por 5,0 NO rompe esa circularidad. La traslada.** Si las bandas se
recalcularan a 5,0, volverían a derivarse de la misma constante y el guardián de bandas
volvería a no poder fallar por esa vía.

⭐ **Lo único que rompería la circularidad es una segunda distancia MEDIDA**, no calculada.
Hoy hay una sola: los 2,6 km de la nº7. Y sirve para lo que de verdad mide.

---

## E · ⭐ LO QUE LAS CAMINATAS DE ANTONIO SIGUEN VALIENDO

⛔ No se tiran. **Miden otra cosa, y esa cosa es la que importaba:**

```
   ruta 7 · lo que dice el motor          2.528,9 m
            lo que midió el GPS           2.600   m
            diferencia                        2,7 %
```

⭐ **Un GPS de pulsera mide bien distancias** (y en ciudad tiende a dar de más, por el
rebote en edificios). **Los minutos eran otra cosa.** ⇒ la caminata valida los METROS del
motor, que es la magnitud que el motor calcula de verdad. El tiempo siempre fue derivado.

---

## F · LOS COMANDOS

```
   node src/velocidad.js --probar    # el guardián del estándar, con su contraprueba
   node src/rutas-antonio.js         # los seis tiempos publicados
   node src/superados.js             # el puntero: quién sigue diciendo ~6 km/h
```

⚠️ **Y lo que este documento no puede prometer:** que el visor vuelva a cuadrar. El export
(`tools/rutas-visor.js`) se genera con `exportar-rutas.js`, que esta tanda no ejecuta. Hasta
que alguien lo reexporte, el visor publica 6 km/h y `src/velocidad.js` sale en rojo por esa
línea. **El rojo es el aviso, no el problema.**
