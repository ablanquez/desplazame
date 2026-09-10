# Los símbolos de Material, autoalojados — de dónde salieron

## La ficha

| | |
|---|---|
| **Colección** | Material Symbols (variante *outlined*) |
| **Titular** | Google |
| **Licencia** | Apache 2.0 — `LICENCIA-APACHE-2.0.txt`, al lado |
| **Origen** | `https://raw.githubusercontent.com/google/material-design-icons/master/symbols/web/<nombre>/materialsymbolsoutlined/<nombre>_24px.svg` |
| **Descargados** | 2026-09-10 |
| **Rejilla** | `viewBox="0 -960 960 960"` en los ocho, verificada al generarlos |

Los ocho entran **sin tocarlos**: ni se han reoptimizado, ni recoloreado, ni
renombrado. Cada uno trae **un solo `<path>`**, que es lo que permite
inyectarlo en línea con `fill="currentColor"`.

## Los ocho, con su sha256 y para qué

| fichero | peso | para | sha256 |
|---|---|---|---|
| `directions_walk.svg` | 386 B | el chip de Andando | `bc0c074e23c643d93f61f85546abd0385ccd98d851dd71081f698e01e732c967` |
| `directions_bus.svg` | 734 B | el chip de Bus / Tranvía | `dde80b9567a4961c397193ac86ac371b6f9edb18aaed78b55fd3b71abc0157bb` |
| `pedal_bike.svg` | 654 B | el chip de Bici | `76cbf7271e223044b9534b7dc99335bba0174423f6eddb5f819609530f524c42` |
| `electric_scooter.svg` | 640 B | el chip de Patín (VMP) | `c6e011f03f9b9f951cb3f31715b42a82f3bc3624070c2e22a8ea83b2dac4582a` |
| `two_wheeler.svg` | 659 B | el chip de Moto | `26b5e1b6c8860120609183ca1d39f0b1c1c5145ce9687fe8fbca3b45b83c4f35` |
| `directions_car.svg` | 573 B | el chip de Coche | `8f0a18a0a7a8ad65529fef7917a4aa7fdd4e9a7de784578c744e26cb6f3be2f1` |
| `my_location.svg` | 547 B | el botón «Mi ubicación» (la diana) | `8e4f63bed1446eb726036a4b573ecef3b8a8261aeb50e31a89883e929758d067` |
| `swap_vert.svg` | 236 B | el botón de invertir origen y destino | `246628e8efd0914fb1358c5fc53fea6f03dc4fad424aad4e1933abcdeae8f11a` |

## ⚠️ Por qué el dibujo está también en `app/src/app/simbolos.ts`

Porque un `<img>` no hereda el color del texto y los chips cambian de tinta con
su estado, así que el `path` se inyecta **en línea**. Eso obliga a tener el `d`
en dos sitios — el fichero original y la tabla del componente—, que es
exactamente la clase de duplicado que en esta casa ya salió mal una vez
(`contraste.ts` y sus cuatro copias de una fórmula).

**Por eso la copia tiene portero:** `app/src/app/simbolos.spec.ts` abre estos
ocho ficheros y compara su `d` con el de la tabla, carácter a carácter, y
además comprueba que el censo cuadra en las dos direcciones. Si alguien retoca
uno de los dos lados, la suite se pone roja.

## Por qué no la fuente variable

La fuente oficial de Material Symbols existe y trae **miles** de iconos en
~100 KB. Aquí hacen falta **ocho**. La portada se mide contra un presupuesto
que ya está en 509 kB, así que se paga lo que se usa y nada más — y, de paso,
no se baja nada de ningún tercero en tiempo de ejecución, que es la misma ley
que sacó a Inter del CDN de Google.
