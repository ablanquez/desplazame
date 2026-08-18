# Investigación — sitios con coordenadas del Ayuntamiento de Zaragoza

> Investigación de solo lectura, 18/08/2026, para el punto 6B del plan
> (destinos con nombre). Nada se copió al repositorio. Las sondas se
> ejecutaron contra los servicios públicos del Ayuntamiento.
> Destino de este fichero: `docs/INVESTIGACION-EQUIPAMIENTOS.md`.

## El titular

**El WFS de IDEZar NO publica equipamientos** (ni farmacias, ni
hospitales, ni bibliotecas: sus 185 capas son cartografía base,
urbanismo, movilidad, ruido y estadística). Los sitios viven en **la API
REST de datos abiertos** (`zaragoza.es/sede/servicio/equipamiento`):
~250 categorías en 19 familias, casi todas con coordenada.

## 1 · Lo que el WFS sí tiene con forma de «sitio» (mobiliario urbano)

| Capa | Registros | Geometría | Campos clave |
|---|---|---|---|
| `movilidad:MU1_parking` | 7.233 | Point | TIPO, CALLE, PORTAL, **Vias_codigo** (enlaza con nuestro callejero), TOTAL_PLAZAS |
| `movilidad:MU2_veladores` | 712 | Point | **NOMBRE_LOCAL**, DIRECCION, PLAZAS — lo más cercano a «bares»: censo de licencias de terraza |
| `infraestructuras:escaleras` | 656 | Point | 46 campos, todos nulos en muestra — solo geometría |
| `medioambiente:fuente_agua_potable` | 653 | Point | ubicacion, vial, en_servicio |
| `idezar_base:zona_verde_juegos_infantiles_2022` | 376 | MultiPolygon | DESCRIPCION, DISTRITO, SUPERFICIE |
| `movilidad:MU3_paradas_taxi` | 88 | Point | taxi_calle (código), taxi_num_p |
| `movilidad:MU1_puntos_recarga` | 37 | Point | nombre, telefono, email, url, potencia, gestora |
| `medioambiente:estacion_calidad_aire` | 8 | Point | nombre, direccion, contaminantes |

Todas en EPSG:4326 con coordenada poblada.

## 2 · La API de equipamientos — el menú (19 familias, ~250 tipos)

- **Sanidad** — Centros de Salud · Hospitales · Otros Servicios
  Sanitarios · OMIC · Farmacias
- **Cultura y ocio** (34 tipos, la mayor) — Bibliotecas · Museos ·
  Teatros · Salas de Exposiciones · Espacios Escénicos y Musicales ·
  Galerías · Centros Culturales · Ludotecas · Librerías…
- **Educación** (44) — Infantil · Primaria · Secundaria · Bachillerato ·
  FP · Especial · Escuelas Infantiles · Idiomas · Universitaria…
- **Deporte** (9) — Centros Deportivos · Pabellones · Campos de Fútbol ·
  Piscinas · Fitness…
- **Comercio y hostelería** — Comercio Menor (49 tipos: panaderías,
  fruterías, supermercados, ópticas, estancos…) · Empresas (23) ·
  Turismo y Hostelería (5)
- **Monumentos y turismo** — Arquitectura · Patrimonio Cultural ›
  Religioso · Oficinas de Turismo · Puntos de Información
- **Otros** — Servicios Sociales (16) · Servicios Urbanos (mercados,
  cementerios, aseos…) · Participación (Centros Cívicos, Juntas) ·
  Protección (bomberos, policía) · Medio Ambiente (14) · Empleo (7) ·
  Administración (6) · Información (12) · Ciencia (2)

**No existe censo de bares/restaurantes.** Lo más cercano: los 712
veladores del WFS, «Restaurante/Hotel que admite mascotas» (subconjuntos
temáticos) y el Comercio Menor de alimentación.

## 3 · Sondas — recuentos reales

Ruta de listado: `/sede/servicio/equipamiento/category/{id}.json`
(hallada en el descriptor OpenAPI de `docs-api_sede`, 496 rutas;
`/equipamiento/{id}` es la ficha individual).

| Categoría | id | Registros | Con coordenada |
|---|---|---|---|
| Farmacias | 740 | 313 | 310 (99%) |
| Educación Primaria | 62 | 138 | 136 |
| Educación Secundaria | 63 | 104 | 103 |
| Bibliotecas | 35 | 75 | 73 |
| Centros de Salud | 781 | 56 | 56 |
| Mercados | 118 | 46 | 46 |
| Museos | 53 | 25 | 25 |
| Centros Cívicos | 93 | 25 | 25 |
| Hospitales | 780 | 17 | 15 |
| Teatros | 58 | 11 | 11 |
| Arquitectura | 620 | 3 | 3 |
| Patrimonio religioso | 204 | 3 | 3 |

Campos (medidos en farmacias): `title` 313 · `calle` 312 · `tel` 310 ·
`geometry` 310 · `horario` 187 · `description` 44 · `email` 31 · `url`
4. Los municipales añaden `servicios`, `accesibilidad`, `historia`,
`precio`, `imagen` y **`lastUpdated`** (la fecha por registro que la Ley
37/2007 exige conservar).

Servicio aparte: `/sede/servicio/farmacia.json` = solo las farmacias
**de guardia hoy** (7), con turno y horario. Distinto del censo.

## 4 · ⚠️ La trampa del CRS

Por defecto la coordenada viene en **UTM ETRS89/30N**, y el parámetro
estándar se ignora EN SILENCIO:

```
(sin parámetro)      → [676984.82, 4613895.88]   UTM
?srsname=EPSG:4326   → [676984.82, 4613895.88]   lo ignora
?srsName=EPSG:4326   → [676984.82, 4613895.88]   lo ignora
?srsname=wgs84       → [-0.8757473, 41.6553092]  ✓ ESTE
```

Con `srsname=wgs84` no hace falta reproyectar → **cero dependencias**
(sin él, haría falta proj4, que este proyecto no mete).

## 5 · Licencia

Las condiciones generales del portal: **Ley 37/2007** (con su régimen
sancionador, art. 11), cita obligada «Origen de los datos: Ayuntamiento
de Zaragoza», conservar metadatos de fecha, no dar a entender respaldo
municipal. Ninguna capa ni categoría sondeada declara condiciones
distintas. Entraría en el notices como ficha del mismo régimen que los
portales.

## 6 · Dato personal — la decisión pendiente

**268 de 313 farmacias llevan nombre de persona física en el título**
(«Farmacia Abad Sancho, Ana María»): es el nombre registral (las
farmacias se registran a nombre de su titular) y el Ayuntamiento lo
publica como dato abierto — la reutilización es lícita. Pero el RGPD no
desaparece por ser público: al republicar, este proyecto sería
responsable del tratamiento (riesgo práctico mínimo: dato profesional,
fuente administrativa, finalidad compatible; el caso real posible es un
derecho de supresión, que se atendería). **Salida sin asterisco:**
mostrar «Farmacia» + dirección, sin titular — presentación, no edición
del dato (patrón de los corchetes).

Lo demás, limpio: teléfonos y correos institucionales o de empresa; el
campo `tecnico` de escaleras viene nulo.

## 7 · Encaje en el proyecto (decidido 18/08)

Punto **6B** del plan: el destino puede ser un sitio. Reutiliza el
autocompletar (elegir-fija-código) y el enganche coordenada→grafo del
punto 6. Qué categorías entran: Antonio, pieza a pieza, patrón del
punto 4.
