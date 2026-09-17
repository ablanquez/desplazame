# Los símbolos de Material, autoalojados — de dónde salieron

## La ficha

| | |
|---|---|
| **Colección** | Material Symbols (variante *outlined*) |
| **Titular** | Google |
| **Licencia** | Apache 2.0 — `LICENCIA-APACHE-2.0.txt`, al lado |
| **Origen** | `https://raw.githubusercontent.com/google/material-design-icons/master/symbols/web/<nombre>/materialsymbolsoutlined/<nombre>[_20px|_24px|_48px].svg` |
| **Descargados** | 2026-09-10 los nueve primeros · 2026-09-11 los tres de la barra de pestañas · 2026-09-12 los quince de la pintura del resultado y `arrow_back` · 2026-09-16 los dos del conmutador de tema · 2026-09-17 las dos instancias ópticas de 48 · 2026-09-18 el barrido a `opsz20` de los veinticuatro que solo se pintan por debajo de 20 px |
| **Ejes** | `wght400 · GRAD0 · FILL0` en los treinta y uno — **un solo peso en toda la app**, que es lo que la doctrina oficial pide. Lo que cambia entre ficheros es **solo el eje óptico**, y lo dice el sufijo. Verificado contra el repositorio el 17/09: de `route` hay **168** ficheros, con `opsz` en 20/24/40/48, `wght` de 100 a 700, `GRAD` en N25/0/200 y `FILL` en 0/1 |
| **Rejilla** | `viewBox="0 -960 960 960"` en todos, verificada al generarlos |

Entran **sin tocarlos**: ni se han reoptimizado, ni recoloreado, ni
renombrado. Cada uno trae **un solo `<path>`**, que es lo que permite
inyectarlo en línea con `fill="currentColor"`.

## Los símbolos, con su sha256 y para qué

⚠️ **Esta tabla se genera del disco, no se mantiene a mano**, y una jueza
comprueba que ningún `.svg` de la carpeta se queda sin ficha.

⚠️ **El nombre dice la instancia del eje óptico.** [DOC OFICIAL] el nombre sin
sufijo es la instancia por defecto —`wght400 · GRAD0 · FILL0 · opsz24`—; `_20px`
y `_48px` son las otras dos que esta app pinta. Del eje existen cuatro puntos
(20, 24, 40 y 48); el de 40 no se usa en ningún sitio y no se baja.

| fichero | peso | eje óptico | para | sha256 |
|---|---|---|---|---|
| `arrow_back_20px.svg` | 170 B | opsz20 | la vuelta al buscador desde la página de créditos | `15a775ee76d79f894c66d0c29cd2de8cfd613f53039b75004689de6fa97779bc` |
| `arrow_forward_20px.svg` | 171 B | opsz20 | la cabecera del resumen | `711752ab9b0e07938d91278975e4c94d01e550c07ec398d5a982b3cc268aef2f` |
| `cloud_off_48px.svg` | 539 B | opsz48 | el error del resultado, a 48 px | `5517ebe3fb6ee9d0e08a3d59c57391c6a7f9a393c3ddd45d7e2c8e6eb31576f4` |
| `dark_mode.svg` | 426 B | opsz24 | el conmutador con el modo oscuro PUESTO — la luna | `b45f29f9b3268bb674a00c025b619292e36a86e6dc6b28851f954763d943eca7` |
| `directions_bus_20px.svg` | 749 B | opsz20 | el chip de Bus / Tranvía · «Sube» y su hito | `cc4ff6b677110c651e300573fcd2d52d7008770042b81e8cff9c686fde50d4ce` |
| `directions_car_20px.svg` | 577 B | opsz20 | el chip de Coche | `c9c090a22c579580cb15f27329c8525d85c0b72857c60f7ccdf89e8b32b0d297` |
| `directions_walk_20px.svg` | 389 B | opsz20 | el chip de Andando | `1826396c46a5d38e8a61c3070e5af4a0b0739c7cd3e0241485e1b447300fc50e` |
| `electric_scooter_20px.svg` | 752 B | opsz20 | el chip de Patín (VMP) | `f565ee2bf393277e9e44bb4df33783b50d789877fc16e471288101bc0d004d52` |
| `flag_20px.svg` | 216 B | opsz20 | la llegada | `35e73617fa497832903db9231eb18fa27f4b6e7d0bf8997b652090856a0fd57a` |
| `hourglass_empty_20px.svg` | 402 B | opsz20 | el aviso de que la consulta a la DGT tarda | `b496492e53195ad7fdc44fe89107f2cae7bae2f2c5b33f5855339de8723a392a` |
| `light_mode.svg` | 532 B | opsz24 | el conmutador con el modo oscuro APAGADO — el sol | `59f62df813e1b2c5c9db89088ea4489617f8c89d4ccd179f713b9d6938d82db5` |
| `local_parking_20px.svg` | 265 B | opsz20 | «Aparca» —que es también «Deja»— y su hito | `e0b4b2ac7162aaedb5d164312881e4663f2895708110f390628f4a46706ed17f` |
| `map.svg` | 377 B | opsz24 | la pestaña «Mapa» de la barra de móvil | `a49ef8ee004dc4832a4bbe64fce0a054c0b90cb4246422c09cc234278788049b` |
| `my_location_20px.svg` | 576 B | opsz20 | el botón «Mi ubicación» (la diana) | `a3286362e63e49daab56c099954ef2e2445333e50c02e41ea07250fb2b77cd0a` |
| `pedal_bike_20px.svg` | 716 B | opsz20 | el chip de Bici · «Coge» y su hito | `c5d19bafac68fbd4631a287615e0952633508d10d059acd21b6f47366ad5dbb5` |
| `route.svg` | 700 B | opsz24 | la pestaña «Ruta» · el vacío del resultado | `d7962e11c41b71ce30aa4c47b7f3eacb9d88d08f02421214f5f9d641d5a45956` |
| `route_48px.svg` | 847 B | opsz48 | la pestaña «Ruta» · el vacío del resultado | `ee4c47bbe5dacd0d315a8ce6aed74ccd3b86dec4cdf4d43c13fbd1529e43d2c9` |
| `search.svg` | 357 B | opsz24 | la pestaña «Buscador» de la barra de móvil | `46d4ab85eba6eb4fe7c9a9a4c4db2fdf8fa9cc74c1f398ac72e7d872d490dd4c` |
| `straight_20px.svg` | 169 B | opsz20 | la maniobra «recto» | `4703365809e48236d9582e842d4bf807f146d9d9ad0cca9433dca119d7b1db4b` |
| `swap_vert_20px.svg` | 236 B | opsz20 | el botón de invertir origen y destino | `c95858db62f61e81261bc2013cf3e7384ee0354d36b7625437089e1a84c7aa23` |
| `transfer_within_a_station_20px.svg` | 480 B | opsz20 | el transbordo en el mismo poste | `47016adfb2f04e9c5cb4e09df12c1db5c457287165f896ea2456490217684689` |
| `trip_origin_20px.svg` | 529 B | opsz20 | la salida | `5c456cbf1d5d54f28691ff21b143083b4112529bdc6dda67695b64a33e50d5ce` |
| `turn_left_20px.svg` | 206 B | opsz20 | la maniobra «izquierda» | `99c3c34caae2f2141836e2f78ae22cb2241b1ca1f7ae9fb9e9b736d574210b81` |
| `turn_right_20px.svg` | 221 B | opsz20 | la maniobra «derecha» | `dc5bcd76bb0f8965cba9ef84be8074a1dc3ed877a2e4dd33f9883a7255218016` |
| `turn_sharp_left_20px.svg` | 263 B | opsz20 | la maniobra «cerrada-izquierda» | `048f4cf0e9bab7a84a7b59ea88785ba04b1a4be3b583b9c40030995c01751f70` |
| `turn_sharp_right_20px.svg` | 261 B | opsz20 | la maniobra «cerrada-derecha» | `97d0ef297cae8ebe50c4178d9a4076e2a9e2a26920533136f876d33b268c1a5e` |
| `turn_slight_left_20px.svg` | 211 B | opsz20 | la maniobra «ligera-izquierda» | `f2232c5bbb833cf56ba466c189e0f443520ced755b0c160f0739c5712b3e3a0f` |
| `turn_slight_right_20px.svg` | 211 B | opsz20 | la maniobra «ligera-derecha» | `55a770f7fd5e679001e696d959409a99011b32f6306ad25de30b969799e9cfa8` |
| `two_wheeler_20px.svg` | 613 B | opsz20 | el chip de Moto | `94b06f6649c460bbbb8d8ae5c1b4d88ff4e1fa8e2178f24660c6e07c4cbf338d` |
| `u_turn_left_20px.svg` | 256 B | opsz20 | la media vuelta, para las dos manos | `a6f4f0832c6814579d4c29f38880784e5a1b23eff85a09ef7a8fbd92d2242a5d` |
| `warning_20px.svg` | 327 B | opsz20 | el aviso | `301d88babfb2178b5ebb4600b0da7dd124afb0759bf0200a9af188085aaec2f4` |

## Por qué cada uno guarda la instancia que guarda

[DOC OFICIAL, Material Symbols] los iconos de sistema van a **24 dp** —20 en
escritorio denso—, y **solo las instancias de 20 y 24 están alineadas a la
retícula**: para cualquier otro tamaño se usa el eje óptico, **no el escalado a
pelo**. Por debajo de 20 el eje no baja más, así que el suelo es la de 20.

**Y no son el mismo dibujo a otra escala.** Medido: el trazado de `route` mide
594 caracteres a 24 y 741 a 48; el de `directions_bus`, 856 a 24 y 643 a 20.
Estirar el de 24 hasta 48 engorda los trazos al doble, y encoger el de 24 hasta
14 los adelgaza por debajo del píxel — que es justo lo que el eje existe para
evitar.

El censo del 17/09 contó a qué tamaño se pinta cada símbolo, y el catálogo se
puso en consecuencia:

| se pinta a | cuántos | instancia que se guarda |
|---|---|---|
| 14, 16, 18 y 20 px | **24** | `opsz20` — el suelo del eje |
| 24 px | 5 | la de por defecto, sin sufijo |
| 48 px | 1 (`cloud_off`) | `opsz48` |
| **24 y 48 a la vez** | 1 (`route`) | las dos — y es el único que necesita dos |

⚠️ **`route` es la única excepción y por eso es la única con dos ficheros**: se
pinta a 24 en la barra de pestañas de móvil y a 48 en el vacío del resultado.
Los demás se pintan a un solo tamaño.

⚠️ **El barrido a `opsz20` costó +492 caracteres de trazado (≈ 0,48 kB)**, de
5.930 a 6.422 — medido antes de hacerlo, no estimado después.

## ⚠️ Por qué el dibujo está también en `app/src/app/simbolos.ts`

Porque un `<img>` no hereda el color del texto y los chips cambian de tinta con
su estado, así que el `path` se inyecta **en línea**. Eso obliga a tener el `d`
en dos sitios — el fichero original y la tabla del componente—, que es
exactamente la clase de duplicado que en esta casa ya salió mal una vez
(`contraste.ts` y sus cuatro copias de una fórmula).

**Por eso la copia tiene portero:** `app/src/app/simbolos.spec.ts` abre estos
ficheros y compara su `d` con el de la tabla, carácter a carácter, y
además comprueba que el censo cuadra en las dos direcciones. Si alguien retoca
uno de los dos lados, la suite se pone roja.

⚠️ Y el censo **mordió solo** al entrar los tres de la barra: se copiaron los
`.svg` a esta carpeta antes de tocar la tabla y la suite dijo
`expected [ …(11) ] to deeply equal [ …(8) ]`. Es exactamente su trabajo.

## Por qué no la fuente variable

La fuente oficial de Material Symbols existe y trae **miles** de iconos en
~100 KB. Aquí hacen falta **treinta**, en treinta y un ficheros. La portada se mide contra un presupuesto
que ya está en 509 kB, así que se paga lo que se usa y nada más — y, de paso,
no se baja nada de ningún tercero en tiempo de ejecución, que es la misma ley
que sacó a Inter del CDN de Google.
