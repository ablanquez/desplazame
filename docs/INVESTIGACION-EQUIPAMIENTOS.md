# Investigación — datos abiertos municipales: sitios y estacionamiento

> Tres consultas de solo lectura (18/08/2026) contra los servicios
> públicos del Ayuntamiento de Zaragoza, para decidir qué entra al
> proyecto. Nada se copió al repositorio en la investigación.
> Vive en `docs/INVESTIGACION-EQUIPAMIENTOS.md`.

## 0 · Resumen y decisiones tomadas (18/08)

| Qué | Fuente | Decisión |
|---|---|---|
| Aparcamotos (2.146 / 11.715 plazas) | WFS `MU2_motos` | **ENTRA** (punto 5) |
| Regulado en superficie (7.391 tramos) | WFS `MU1_estacionamientos_calle` | **ENTRA** (punto 5) |
| Zonas reguladas (13 polígonos) | WFS `MU1_zonas_reguladas` | **ENTRA** (punto 5) |
| Reservas PMR (2.636) | WFS `MU1_reservas` | **ENTRA** (punto 5 — accesibilidad) |
| Equipamientos/sitios (~250 categorías) | API `equipamiento` | Punto **6B** (destinos con nombre), pieza a pieza |
| Parquímetros (312, sellados 2015) | solo API | **NO hoy** (reevaluable) |
| Parkings públicos (104 WFS s/nombre · 41 API de 2013) | ambas, cojas | **NO hoy** → punto 9 |
| Reservas C/D (dentro de MU1_reservas) | WFS | Viajan en el dato; pintado solo PMR (propuesta) |

**Reglas transversales que salen de aquí:** toda ficha declara la cifra
DE SU fuente (las cuentas municipales no cuadran entre sí, §4.3) · en la
API el CRS solo cambia con `srsname=wgs84` (§4.1) · todo cuelga de la
Ley 37/2007 con la cita «Origen de los datos: Ayuntamiento de Zaragoza».

---

## 1 · Sitios / equipamientos (consulta 1)

**El WFS de IDEZar NO publica equipamientos** (sus 185 capas son
cartografía, urbanismo, movilidad, ruido, estadística). Los sitios viven
en la **API REST**: `zaragoza.es/sede/servicio/equipamiento.json` — 19
familias, ~250 tipos.

### El menú por familias
- **Sanidad** — Centros de Salud · Hospitales · Otros Sanitarios · OMIC ·
  Farmacias
- **Cultura y ocio** (34) — Bibliotecas · Museos · Teatros · Salas ·
  Espacios Escénicos/Musicales · Galerías · Centros Culturales ·
  Ludotecas · Librerías…
- **Educación** (44) — Infantil · Primaria · Secundaria · Bachillerato ·
  FP · Especial · Escuelas Infantiles · Idiomas · Universitaria…
- **Deporte** (9) — Centros · Pabellones · Campos · Piscinas · Fitness…
- **Comercio y hostelería** — Comercio Menor (49) · Empresas (23) ·
  Turismo y Hostelería (5)
- **Monumentos/turismo** — Arquitectura · Patrimonio (Religioso) ·
  Oficinas y Puntos de Información
- **Otros** — Servicios Sociales (16) · Servicios Urbanos · Participación
  (Centros Cívicos, Juntas) · Protección · Medio Ambiente (14) · Empleo
  (7) · Administración (6) · Información (12) · Ciencia (2)

**No existe censo de bares/restaurantes.** Lo más cercano: 712 veladores
del WFS (`MU2_veladores`, con NOMBRE_LOCAL — licencias de terraza),
subconjuntos temáticos («admite mascotas») y el Comercio Menor de
alimentación.

### Sondas (ruta `/sede/servicio/equipamiento/category/{id}.json`)

| Categoría | id | Registros | Con coordenada |
|---|---|---|---|
| Farmacias | 740 | 313 | 310 |
| Educación Primaria | 62 | 138 | 136 |
| Educación Secundaria | 63 | 104 | 103 |
| Bibliotecas | 35 | 75 | 73 |
| Centros de Salud | 781 | 56 | 56 |
| Mercados | 118 | 46 | 46 |
| Museos | 53 | 25 | 25 |
| Centros Cívicos | 93 | 25 | 25 |
| Hospitales | 780 | 17 | 15 |
| Teatros | 58 | 11 | 11 |

Campos (farmacias): `title` · `calle` · `tel` · `geometry` · `horario`
187/313 · `description` · `email` · `url`. Los municipales añaden
`servicios`, `accesibilidad`, `historia`, `precio`, `imagen` y
`lastUpdated`. Aparte: `/sede/servicio/farmacia.json` = solo las de
guardia HOY (7), con turno.

### Dato personal — la decisión pendiente (punto 6B)
268/313 farmacias llevan el nombre del titular («Farmacia Abad Sancho,
Ana María»): dato registral publicado como abierto — reutilizar es
lícito, pero el RGPD no desaparece: republicando somos responsables del
tratamiento (riesgo práctico mínimo; el caso real posible es un derecho
de supresión, que se atendería). **Salida sin asterisco:** mostrar
«Farmacia» + dirección — presentación, no edición (patrón corchetes).
El resto, limpio (teléfonos/correos institucionales).

### Mobiliario urbano del WFS (por si algún día)
`MU1_parking` 7.233 (ver §3.2) · `MU2_veladores` 712 ·
`infraestructuras:escaleras` 656 (campos nulos) ·
`fuente_agua_potable` 653 · `zona_verde_juegos_infantiles_2022` 376 ·
`MU3_paradas_taxi` 88 · `MU1_puntos_recarga` 37 ·
`estacion_calidad_aire` 8.

---

## 2 · Aparcamotos (consultas 2 y 3 — la pieza que ENTRA)

**`movilidad:MU2_motos`** — gemela estructural de `MU2_aparcabicis`
(vistas de BD, CRS nativo 25830, sirve 4326 con `srsName`).

**La sonda:** 2.146 Point · 0 sin coordenada · **11.715 plazas** (mín 1,
mediana 5, máx 74). Campos: `Codigo_calle` 100% · `Numero_plazas` 100% ·
`Nombre_calle`/`Tipo_via`/`Portal` ~100% · `Fecha_instalacion` 29% ·
`Poligono` 2%. **Nada personal.**

**⭐ Mejor enganchado que los aparcabicis:** trae `Codigo_calle`+`Portal`
— 821/823 códigos casan con nuestro callejero; los 2 huérfanos son los 6
registros que el propio Ayuntamiento deja sin nombre (agujero suyo,
coherente consigo mismo).

### La discrepancia con la API, anatomizada
La API (`…/equipamiento/aparcamiento-moto.json`) da **2.115 / 11.543**.
Casado por vecino más próximo 1-a-1 (sin id común: los del WFS son
correlativos de GeoServer; los de la API, ids de tabla con 136 huecos):
donde casan, la coordenada es IDÉNTICA — mismo dato de origen.

- **32 solo-WFS**: la firma los delata como una tanda de altas — 94% con
  `Fecha_instalacion` (31 de 2024), 91% con `Poligono` (que en el resto
  del censo es el 2%). Publicados y ubicados en el WFS; la API aún no los
  volcó.
- **1 solo-API**: MANUEL LASALA F 44 (2 plazas, id 1198) — el WFS lo
  quitó y la API lo conserva. El WFS no es superconjunto.
- **7 soportes movidos** (1,2–14,9 m): la posición corregida la lleva el
  WFS en los siete.
- **Plazas: cuadre exacto** — 0 soportes con plazas distintas en la misma
  posición (la única excepción es el reubicado de Miguel Labordeta, 6
  vs 5). Las 172 plazas de diferencia son enteras de los huérfanos.

**Frescura:** API = recarga nocturna completa (todo sellado con la misma
hora; no dice cuándo cambió cada soporte). WFS = `NO CONSTA` (sin
MetadataURL, sin fecha; cota inferior: contiene una instalación de
2025-12-01). **La fecha de descarga en la ficha será la única marca.**

**Defecto del dato, declarado:** `Fecha_instalacion = 0203-10-20` en AV
TENOR FLETA 134 (un 2023 mal tecleado, seguramente). Viaja tal cual salvo
«está mal y punto».

**Lectura (lectura, no decisión):** «el WFS va por delante añadiendo» —
32 contra 1, altas recientes, correcciones de posición en el WFS, y la
huella del `Poligono`. **Decisión de Antonio: entra el WFS**, con la
discrepancia entera en la ficha.

---

## 3 · Estacionamiento regulado y parkings (consulta 4)

### 3.1 El regulado — la pieza buena (ENTRA)
**`MU1_estacionamientos_calle`**: 7.391 tramos de bordillo
(MultiLineString) · **55.572 plazas**. El campo que MANDA:

```
tipo_actual   LIBRE 6.204 (49.222 pl) · ESRO 664 (3.507) — la azul/naranja
              ESRE 495 (2.617) — residentes · null 28 (226)
forma_estacionar   CORDÓN 5.824 · BATERÍA 1.533
```

**⚠️ La trampa:** `zona_reguladora` NO significa regulado — 5.104 tramos
LIBRES llevan número de zona. Quien filtre por ella se lleva cinco mil
tramos gratis creyendo que son de pago. **Y el aviso de Antonio la
explica:** el Ayuntamiento prepara una ampliación gorda de la zona
azul/naranja — `zona_reguladora` apunta al perímetro previsto/geográfico
y `tipo_actual` al presente (hipótesis declarada). Consecuencias: la
ficha lo dirá así, y **este dato caducará DE GOLPE al activarse la
ampliación**.

Suciedad declarada: `distrito` con mayúsculas/acentos mezclados
(Centro/CENTRO, Casco Historico/Histórico) — agrupar sin normalizar da
mal.

### 3.2 Zonas, parquímetros, parkings, reservas
- **`MU1_zonas_reguladas`** (ENTRA): 13 MultiPolygon con
  NUMERO_ZONA/NOMBRE_ZONA. Aviso: los tramos usan zonas hasta el 43 —
  los 13 polígonos no cubren todos los números.
- **Parquímetros** (NO hoy): 312, SOLO en la API, **todos sellados
  2015-07** — once años sin señal (o sello de migración). Con la
  ampliación en puerta, entraría caducado.
- **Parkings públicos** (NO hoy → punto 9): `MU1_parking` NO es lo que
  parece — censo de garajes/vados (7.129 privados, mediana 8 plazas,
  `BADENES_ASOCIADOS`); sus 104 «Público» sí son aparcamientos (EXPO
  4.757, María Zambrano 2.500…) pero varios sin calle. La alternativa
  API (`aparcamiento-publico`): 41 con nombre y horario, **sellados
  2013**. Ninguna redonda.
- **Reservas** (ENTRA como pieza PMR): WFS `MU1_reservas` 2.636 Point —
  el vivo; la API los parte en dos servicios que suman 2.072. PMR: 1.224
  «PMR general» + Hotel + Sanitaria — **cero titulares, cero
  matrículas**. Trae también carga y descarga: viaja en el dato; pintado
  solo PMR (propuesta, decide Antonio en la pieza).
- Falsa amiga: `MU1_CC_reguladores` (672) son semáforos.

### 3.3 La serie estadística que desmiente a las capas
`datos-movilidad/plazas-estacionamiento-por-tipo` (mensual, 2017-11 →
2026-08, sin geometría) contra las capas, mes 2026-08:

```
                 serie      capas       Δ
Regulada         6.794      6.124     −670
Libre           31.676     49.222  +17.546
Público         30.960     37.292   +6.332
Privado        246.872    256.081   +9.209
Motos            8.644     11.715   +3.071   ← TERCER número de motos
PMR                948      1.447     +499
```

Ninguna cuadra. Tres fuentes municipales contando distinto. **Regla que
sale:** toda ficha declara la cifra DE SU fuente, nunca «las plazas de
Zaragoza». Y **no hay tarifas ni ocupación en tiempo real** en ninguna de
las 496 rutas de la API.

---

## 4 · Transversales

### 4.1 La trampa del CRS en la API
Por defecto UTM ETRS89/30N, y el parámetro estándar SE IGNORA EN
SILENCIO:

```
?srsname=EPSG:4326 → UTM (ignorado)     ?srsName=EPSG:4326 → UTM (ignorado)
?srsname=wgs84     → [-0.8757, 41.6553] ✓
```

Con `srsname=wgs84` no hay que reproyectar → cero dependencias (sin él,
haría falta proj4, que este proyecto no mete). El WFS es aparte: ahí
`srsName=EPSG:4326` funciona normal.

### 4.2 Licencia
Todo bajo el régimen general: **Ley 37/2007** (con su art. 11
sancionador), cita «Origen de los datos: Ayuntamiento de Zaragoza»,
conservar metadatos de fecha, no dar a entender respaldo. Ninguna capa ni
servicio sondeado declara condiciones propias (WFS: `Fees/
AccessConstraints: NONE`). Misma ficha que las ocho piezas del repo.

### 4.3 El patrón multi-fuente
El Ayuntamiento publica lo mismo por varias puertas y no coinciden:
motos WFS≠API≠serie (3 números), reservas WFS≠API, parkings WFS≠API, la
serie contra todo. Cuando dos censos son legítimos, se declaran los dos
(precedente: postes de bus 944/934); cuando uno va por delante, se elige
con la anatomía hecha (precedente: aparcamotos).
