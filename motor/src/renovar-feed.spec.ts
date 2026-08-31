/**
 * ⭐ LAS JUECES DE LA RENOVACIÓN DEL FEED (31/08).
 *
 * ⚠️ **CERO RED.** Ni una de estas pruebas sale a internet: el `fetch` se pasa
 * de mentira por el `Mundo`, y sus respuestas tienen **las formas del OpenAPI
 * del NAP** —`FicheroListAPI` con sus `conjuntosDatoDto[].ficherosDto[]`, y el
 * `downloadLink` devolviendo un **string pelado**, que es lo que su esquema
 * declara—. Copiar la forma de la definición y no la que uno imagina es la
 * diferencia entre una prueba y un decorado.
 *
 * ⚠️ **Y la clave no aparece por ningún lado.** Aquí se usan cadenas de mentira
 * («la-clave-de-mentira»); la de verdad vive en `.env.local` y en el panel de
 * Hostinger, y este fichero no la lee, no la imprime y no la necesita.
 */
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, writeFileSync, existsSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  atenderRenovacion,
  ErrorDeConfiguracion,
  LARGO_MINIMO_DEL_TOKEN,
  renovarFeed,
  SUELO_BYTES,
  type EstadoDelCron,
  type FicheroDelNap,
  type Mundo,
  type Registro,
} from './renovar-feed.ts';
import {
  diasHastaCaducidad,
  estadoDeCaducidad,
  guardarAtomico,
  leerFeedInfo,
  SEMILLA,
  sha256,
} from './feed.ts';

/** El fichero 1176 tal y como el NAP lo describe hoy, con la forma del OpenAPI. */
const DEL_NAP: FicheroDelNap = {
  ficheroId: 1176,
  fechaActualizacion: '2026-06-30T00:00:00',
  tamanio: 6_883_311,
  numeroViajes: 34_427,
  numeroRutas: 53,
  numeroParadas: 984,
  fechaDesde: '2026-06-23T00:00:00',
  fechaHasta: '2026-10-05T00:00:00',
};

/** La respuesta de `GetList`, con la anidación EXACTA de `FicheroListAPI`. */
function listaDelNap(fichero: FicheroDelNap = DEL_NAP): unknown {
  return {
    filesNum: 1,
    conjuntosDatoDto: [
      {
        conjuntoDatoId: 55,
        nombre: 'Transporte urbano de Zaragoza',
        ficherosDto: [
          { ...fichero, tipoFicheroNombre: 'GTFS', validado: true, avisos: [], metadatos: [] },
        ],
      },
    ],
  };
}

/** El registro de lo que hay guardado ahora mismo, para comparar contra el NAP. */
const REGISTRO_PREVIO: Registro = {
  nap: DEL_NAP,
  sha256: 'da-igual-para-comparar',
  feedVersion: '20260623_AUZSA_Y_TRANVIA',
  feedEndDate: '20261005',
  bytes: 6_883_311,
  descargadoEl: '2026-08-10T09:44:51Z',
};

/** Un zip de verdad, el de la semilla: pesa lo que pesa y empieza por PK. */
const ZIP_BUENO = readFileSync(SEMILLA);

function respuesta(cuerpo: unknown, codigo = 200): Response {
  return new Response(typeof cuerpo === 'string' ? cuerpo : JSON.stringify(cuerpo), {
    status: codigo,
    headers: { 'Content-Type': 'application/json' },
  });
}

/** Un mundo de mentira, con lo justo cambiado en cada juez. */
function mundo(parches: Partial<Mundo> = {}): Mundo & { guardados: { bytes: Buffer; registro: Registro }[] } {
  const guardados: { bytes: Buffer; registro: Registro }[] = [];
  return {
    clave: 'la-clave-de-mentira',
    pedir: (async () => respuesta({})) as typeof fetch,
    registroPrevio: REGISTRO_PREVIO,
    hayZip: true,
    edadEnDias: 21,
    guardar: (bytes, registro) => guardados.push({ bytes, registro }),
    ahora: new Date('2026-08-31T09:00:00Z'),
    recocinar: () => {},
    guardados,
    ...parches,
  };
}

/**
 * El `fetch` de mentira: contesta a `GetList` con la lista, a `downloadLink`
 * con un string pelado (lo que su esquema declara) y al enlace con los bytes.
 */
function napQueFunciona(opciones: {
  readonly fichero?: FicheroDelNap;
  readonly zip?: Buffer;
  readonly codigoDeLista?: number;
} = {}): { pedir: typeof fetch; visitas: string[] } {
  const visitas: string[] = [];
  const pedir = (async (url: string | URL) => {
    const u = String(url);
    visitas.push(u);
    if (u.includes('/GetList')) {
      return opciones.codigoDeLista && opciones.codigoDeLista !== 200
        ? new Response('', { status: opciones.codigoDeLista })
        : respuesta(listaDelNap(opciones.fichero));
    }
    if (u.includes('/downloadLink/')) {
      // ⚠️ LA FORMA REAL, medida contra el NAP el 31/08: `text/plain`, el URL
      // PELADO y SIN comillas —un enlace firmado de S3 de 397 caracteres—.
      // El fixture decía `JSON.stringify(...)`, o sea con comillas y
      // `application/json`, y por eso las trece pasaban mientras la descarga de
      // verdad reventaba en el `.json()`. Ver bitácora del 31/08.
      return new Response('https://descargas.nap.example/1176.zip?firma=abc', {
        status: 200,
        headers: { 'Content-Type': 'text/plain; charset=utf-8' },
      });
    }
    const cuerpo = opciones.zip ?? ZIP_BUENO;
    // `Uint8Array` y no `Buffer`: `BodyInit` acepta el primero, y un Buffer ES
    // un Uint8Array — pero su tipo no encaja sin decirlo.
    return new Response(new Uint8Array(cuerpo), { status: 200 });
  }) as unknown as typeof fetch;
  return { pedir, visitas };
}

describe('⭐ LA RENOVACIÓN DEL FEED — el cron que lo trae del NAP', () => {
  /**
   * ⭐ JUEZ 1 — LA FECHA IGUAL NO SE DESCARGA.
   *
   * [GTFS Best Practices] el consumidor no debe transferir lo que no ha
   * cambiado. Es la razón de ser de todo esto: 6,6 MB cada noche por nada.
   */
  test('⭐ 1 · si la fecha del NAP no ha cambiado, NO se descarga', async () => {
    const { pedir, visitas } = napQueFunciona();
    const m = mundo({ pedir });
    const r = await renovarFeed(m);

    assert.equal(r.clase, 'sin-cambios');
    assert.equal(
      visitas.filter((v) => v.includes('downloadLink') || v.includes('descargas')).length,
      0,
      'ha bajado el zip aunque la fecha era la misma',
    );
    assert.equal(m.guardados.length, 0, 'no se guarda nada si no hay nada nuevo');
  });

  /**
   * ⭐ JUEZ 2 — LA FECHA DISTINTA SE DESCARGA Y SE REGISTRA.
   *
   * Y el registro tiene que llevar las cinco cosas que hacen falta para volver
   * a comparar mañana: la huella del NAP, el `sha256`, el `feed_version` y la
   * caducidad leídos del zip, y cuándo se bajó.
   */
  test('⭐ 2 · si la fecha cambió, descarga y deja el registro completo', async () => {
    const nuevo: FicheroDelNap = { ...DEL_NAP, fechaActualizacion: '2026-09-28T00:00:00' };
    const { pedir } = napQueFunciona({ fichero: nuevo });
    const m = mundo({ pedir });
    const r = await renovarFeed(m);

    assert.equal(r.clase, 'renovado');
    assert.equal(m.guardados.length, 1, 'tenía que guardar exactamente una vez');
    const { bytes, registro } = m.guardados[0]!;
    assert.equal(bytes.length, ZIP_BUENO.length);
    assert.equal(registro.nap.fechaActualizacion, '2026-09-28T00:00:00');
    assert.equal(registro.sha256, sha256(ZIP_BUENO));
    assert.equal(registro.feedVersion, leerFeedInfo(ZIP_BUENO)!.feedVersion);
    assert.equal(registro.feedEndDate, leerFeedInfo(ZIP_BUENO)!.feedEndDate);
    assert.equal(registro.bytes, ZIP_BUENO.length);
    assert.ok(registro.descargadoEl.startsWith('2026-08-31'), registro.descargadoEl);
  });

  /**
   * ⭐ JUEZ 3 — UN `200` QUE NO EMPIEZA POR `PK` NO SE GUARDA.
   *
   * ⚠️ El caso es real y está fichado en ZetaBus: **el NAP devuelve `200` con
   * una página de error** cuando algo va mal. Guardarla produciría un fichero
   * llamado `.zip` que no es un zip, y el error saldría tres pasos más tarde,
   * en otro sitio, sin relación aparente con esto.
   */
  test('⭐ 3 · un 200 con HTML se rechaza y se conserva el que había', async () => {
    const html = Buffer.from('<!DOCTYPE html><html><body>Error del portal</body></html>'.repeat(40_000));
    const nuevo: FicheroDelNap = { ...DEL_NAP, fechaActualizacion: '2026-09-28T00:00:00' };
    const { pedir } = napQueFunciona({ fichero: nuevo, zip: html });
    const m = mundo({ pedir });
    const r = await renovarFeed(m);

    assert.equal(r.clase, 'sigue-el-viejo');
    assert.match(r.clase === 'sigue-el-viejo' ? r.motivo : '', /PK|no es un ZIP/i);
    assert.equal(m.guardados.length, 0, 'ha guardado una página de error como si fuera el feed');
  });

  /**
   * ⭐ JUEZ 4 — UN ZIP CORTO SE RECHAZA.
   *
   * ⚠️ Y esta juez existe porque la firma `PK` **no basta**: un zip truncado
   * empieza por `PK` exactamente igual que uno entero. Sin el suelo, media
   * descarga pasaría por buena.
   */
  test('⭐ 4 · un zip por debajo del suelo se rechaza aunque empiece por PK', async () => {
    const corto = Buffer.concat([Buffer.from('PK\x03\x04'), Buffer.alloc(1000)]);
    assert.ok(corto.length < SUELO_BYTES);
    const nuevo: FicheroDelNap = { ...DEL_NAP, fechaActualizacion: '2026-09-28T00:00:00' };
    const { pedir } = napQueFunciona({ fichero: nuevo, zip: corto });
    const m = mundo({ pedir });
    const r = await renovarFeed(m);

    assert.equal(r.clase, 'sigue-el-viejo');
    assert.match(r.clase === 'sigue-el-viejo' ? r.motivo : '', /corto|MB/i);
    assert.equal(m.guardados.length, 0);
  });

  /**
   * ⭐ JUEZ 5 — SIN CLAVE SE FALLA CERRADO, HAYA ZIP O NO.
   *
   * El precedente de ZetaBus, con su razón entera: «una caída del NAP es ajena
   * y pasajera, pero una clave que falta es un build MAL CONFIGURADO, y
   * tragárselo dejaría el despliegue congelado para siempre en el zip que
   * hubiera, sin que nadie se entere nunca».
   */
  test('⭐ 5 · sin la clave falla cerrado, aunque haya zip', async () => {
    const { pedir, visitas } = napQueFunciona();
    await assert.rejects(
      () => renovarFeed(mundo({ pedir, clave: undefined, hayZip: true })),
      ErrorDeConfiguracion,
    );
    assert.equal(visitas.length, 0, 'ni siquiera debe llamar al NAP sin clave');
    // Y con la clave en blanco, igual: una cadena vacía no es una clave.
    await assert.rejects(() => renovarFeed(mundo({ pedir, clave: '   ' })), ErrorDeConfiguracion);
  });

  /**
   * ⭐ JUEZ 6 — UN 401 NO SE TAPA CON EL ZIP VIEJO.
   *
   * Misma razón que la clave ausente: no es meteorología, es configuración. Una
   * clave caducada tiene que doler ahora, no dentro de tres meses.
   */
  test('⭐ 6 · un 401 o un 403 del NAP falla, no se tapa con el viejo', async () => {
    for (const codigo of [401, 403]) {
      const { pedir } = napQueFunciona({ codigoDeLista: codigo });
      await assert.rejects(
        () => renovarFeed(mundo({ pedir, hayZip: true })),
        ErrorDeConfiguracion,
        `el ${codigo} tenía que fallar`,
      );
    }
  });

  /**
   * ⭐ JUEZ 7 — EL NAP CAÍDO CON ZIP: SE SIGUE, Y SE DICE LA EDAD.
   *
   * «Un fallo del NAP no puede impedir desplegar; servir el GTFS de ayer sí es
   * aceptable, y callárselo no.» La edad es la parte que no se calla.
   */
  test('⭐ 7 · el NAP caído con zip: sigue con el que hay y dice su edad', async () => {
    const pedir = (async () => {
      throw new Error('getaddrinfo ENOTFOUND');
    }) as unknown as typeof fetch;
    const r = await renovarFeed(mundo({ pedir, hayZip: true, edadEnDias: 21 }));

    assert.equal(r.clase, 'sigue-el-viejo');
    assert.equal(r.clase === 'sigue-el-viejo' ? r.dias : null, 21, 'tiene que decir la edad');

    // Y sin zip no hay nada que servir: eso sí es morir.
    await assert.rejects(() => renovarFeed(mundo({ pedir, hayZip: false })), /no hay/i);
  });

  /**
   * ⭐ JUEZ 8 — EL ENDPOINT DEL CRON, con sus cuatro respuestas.
   *
   * El patrón entero de ZetaBus: **el token va en la CABECERA, nunca en la
   * URL** —«que se queda en los logs»—, `503` si no está configurado (falla
   * cerrado), `401` si es incorrecto, `409` si ya hay uno corriendo, y `202`
   * al instante con el trabajo de fondo, para que no lo mate ningún timeout
   * intermedio.
   */
  test('⭐ 8 · el endpoint: 503 sin token · 401 con uno malo · 409 solapado · 202', () => {
    const bueno = 'x'.repeat(LARGO_MINIMO_DEL_TOKEN);
    const quieto: EstadoDelCron = { enCurso: false };

    // Sin token configurado en el servidor: falla CERRADO y no ejecuta nada.
    assert.equal(atenderRenovacion(undefined, `Bearer ${bueno}`, quieto).codigo, 503);
    assert.equal(atenderRenovacion(undefined, `Bearer ${bueno}`, quieto).arranca, false);
    // Configurado pero demasiado corto: tampoco vale.
    assert.equal(atenderRenovacion('corto', `Bearer corto`, quieto).codigo, 503);

    // Configurado bien, pero la petición no trae el suyo o trae otro.
    assert.equal(atenderRenovacion(bueno, undefined, quieto).codigo, 401);
    assert.equal(atenderRenovacion(bueno, 'Bearer otro-token-cualquiera', quieto).codigo, 401);
    assert.equal(atenderRenovacion(bueno, bueno, quieto).codigo, 401, 'sin el Bearer no vale');

    // El bueno: 202 y arranca.
    const ok = atenderRenovacion(bueno, `Bearer ${bueno}`, quieto);
    assert.equal(ok.codigo, 202);
    assert.equal(ok.arranca, true);

    // Y si ya hay uno corriendo, 409 y NO arranca un segundo.
    const corriendo: EstadoDelCron = { enCurso: true };
    const segundo = atenderRenovacion(bueno, `Bearer ${bueno}`, corriendo);
    assert.equal(segundo.codigo, 409);
    assert.equal(segundo.arranca, false);
  });

  /**
   * ⭐ JUEZ 9 — LOS DÍAS HASTA LA CADUCIDAD, con el umbral del validador.
   *
   * [MobilityData GTFS Validator] caducar en **≤7 días es AVISO**. El día del
   * `feed_end_date` todavía cuenta como cubierto —la referencia lo define como
   * «la última fecha para la que el feed da servicio»—, así que ese mismo día
   * quedan 0 y sigue sirviendo; al siguiente, −1 y caducado.
   */
  test('⭐ 9 · díasHastaCaducidad y su umbral', () => {
    const fin = '20261005';
    // Hoy, 31/08/2026: los 35 días que el censo contó.
    assert.equal(diasHastaCaducidad(fin, new Date('2026-08-31T09:00:00Z')), 35);
    assert.equal(estadoDeCaducidad(35), 'vigente');

    // A seis días: aviso.
    assert.equal(diasHastaCaducidad(fin, new Date('2026-09-29T09:00:00Z')), 6);
    assert.equal(estadoDeCaducidad(6), 'aviso');

    // Justo en el umbral, siete: todavía aviso.
    assert.equal(estadoDeCaducidad(7), 'aviso');
    assert.equal(estadoDeCaducidad(8), 'vigente');

    // El último día cubierto: cero, y aún sirve (en aviso).
    assert.equal(diasHastaCaducidad(fin, new Date('2026-10-05T23:00:00Z')), 0);
    assert.equal(estadoDeCaducidad(0), 'aviso');

    // Pasado: caducado.
    assert.equal(diasHastaCaducidad(fin, new Date('2026-10-06T01:00:00Z')), -1);
    assert.equal(estadoDeCaducidad(-1), 'caducado');
    // Y el Pilar, que el censo midió a cero viajes, cae ya fuera.
    assert.ok(diasHastaCaducidad(fin, new Date('2026-10-12T09:00:00Z')) < 0);
    // Una fecha ilegible no se inventa: es caducado, no «vigente por si acaso».
    assert.equal(estadoDeCaducidad(diasHastaCaducidad('', new Date())), 'caducado');
  });

  /**
   * ⭐ JUEZ 10 — LA ESCRITURA ATÓMICA: un fallo a medias no deja zip roto.
   *
   * Se prueba de verdad, sobre ficheros: se escribe uno bueno, luego se intenta
   * escribir con un destino imposible, y se comprueba que **el bueno sigue
   * entero** y que no queda ningún `.tmp` tirado.
   */
  test('⭐ 10 · la escritura atómica deja el viejo entero si la nueva falla', () => {
    const dir = mkdtempSync(join(tmpdir(), 'desplazame-feed-'));
    try {
      const destino = join(dir, 'vivo.zip');
      guardarAtomico(destino, Buffer.from('el bueno de siempre'));
      assert.equal(readFileSync(destino, 'utf8'), 'el bueno de siempre');

      // Un destino imposible: dentro de un fichero, que no es un directorio.
      const imposible = join(destino, 'nope', 'otro.zip');
      assert.throws(() => guardarAtomico(imposible, Buffer.from('la mitad')));

      // El bueno, intacto. Y ni un temporal tirado por el suelo.
      assert.equal(readFileSync(destino, 'utf8'), 'el bueno de siempre');
      assert.equal(existsSync(`${destino}.${process.pid}.tmp`), false);

      // Y la escritura que SÍ sale, releva entera.
      guardarAtomico(destino, Buffer.from('el nuevo entero'));
      assert.equal(readFileSync(destino, 'utf8'), 'el nuevo entero');
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  /**
   * ⭐ JUEZ 12 — EL LECTOR DE `.env.local`: lo del entorno MANDA, y no imprime.
   *
   * ⚠️ La cerradura del secreto tiene dos mitades y las dos importan: que el
   * fichero esté en `.gitignore` **antes** de existir, y que quien lo lea no
   * devuelva su valor. Esta función solo devuelve los NOMBRES que ha puesto.
   */
  test('⭐ 12 · .env.local rellena lo que falta, respeta lo que hay, y no devuelve valores', async () => {
    const { cargarEntornoLocal } = await import('./renovar-feed.ts');
    const dir = mkdtempSync(join(tmpdir(), 'desplazame-env-'));
    try {
      const ruta = join(dir, '.env.local');
      writeFileSync(
        ruta,
        ['# un comentario', '', 'DESPLAZAME_PRUEBA_A=de-mentira',
         'DESPLAZAME_PRUEBA_B="entre comillas"', 'sin_igual', ''].join('\n'),
        'utf8',
      );
      process.env['DESPLAZAME_PRUEBA_B'] = 'el del entorno GANA';
      const puestas = cargarEntornoLocal([ruta]);

      assert.deepEqual(puestas, ['DESPLAZAME_PRUEBA_A'], 'solo pone lo que faltaba');
      assert.equal(process.env['DESPLAZAME_PRUEBA_A'], 'de-mentira');
      assert.equal(process.env['DESPLAZAME_PRUEBA_B'], 'el del entorno GANA');
      // Lo que devuelve son NOMBRES: ni un valor se escapa por ahí.
      assert.equal(puestas.join(' ').includes('de-mentira'), false);
      // Un fichero que no existe no es un error: en Hostinger no hay ninguno.
      assert.deepEqual(cargarEntornoLocal([join(dir, 'no-existe')]), []);
    } finally {
      delete process.env['DESPLAZAME_PRUEBA_A'];
      delete process.env['DESPLAZAME_PRUEBA_B'];
      rmSync(dir, { recursive: true, force: true });
    }
  });

  /**
   * ⭐ JUEZ 13 — LA RUTA POR DEFECTO ES LA DEL MOTOR, y alguien la mira.
   *
   * ⚠️ **Esta juez sale de un fallo real, cazado el 31/08 por la prueba contra
   * el NAP de verdad.** La juez 12 de aquí arriba compra que el *parser*
   * funciona, y lo compra bien — pero llama **siempre con una ruta explícita**,
   * un temporal que ella misma acaba de crear. El valor por defecto, que es el
   * único que producción usa, no lo ejercía nadie: apuntaba a la raíz del
   * repositorio, la clave estaba en `motor/.env.local`, y el fetch moría
   * diciendo que faltaba `NAP_API_KEY`. Doce pruebas en verde. Ver la entrada
   * del 31/08 de `docs/BITACORA.md`.
   *
   * El motor es un paquete del *workspace* con su propia raíz, así que su
   * `.env.local` va **en `motor/`** — y se mira también el de la raíz del
   * repositorio, porque las dos convenciones son razonables y elegir una sola
   * es volver a apostar.
   */
  test('⭐ 13 · el .env.local por defecto es el del MOTOR, y también se mira el de la raíz', async () => {
    const { FICHEROS_DE_ENTORNO, cargarEntornoLocal } = await import('./renovar-feed.ts');

    // La lista por defecto: el del motor PRIMERO, y el de la raíz después.
    const comoBarras = FICHEROS_DE_ENTORNO.map((r) => r.replace(/\\/g, '/'));
    assert.equal(comoBarras.length, 2, comoBarras.join(' | '));
    assert.match(comoBarras[0]!, /\/motor\/\.env\.local$/, 'el primero tiene que ser el del motor');
    assert.match(comoBarras[1]!, /004_DESPLAZAME\/\.env\.local$/, 'y el segundo el de la raíz');

    // Y con dos ficheros, el PRIMERO manda y el segundo completa.
    const dir = mkdtempSync(join(tmpdir(), 'desplazame-env2-'));
    try {
      const uno = join(dir, 'uno.env');
      const dos = join(dir, 'dos.env');
      writeFileSync(uno, 'DESPLAZAME_P1=del-primero\n', 'utf8');
      writeFileSync(dos, ['DESPLAZAME_P1=del-segundo', 'DESPLAZAME_P2=solo-en-el-segundo', ''].join('\n'), 'utf8');

      const puestas = cargarEntornoLocal([uno, dos]);
      assert.deepEqual([...puestas].sort(), ['DESPLAZAME_P1', 'DESPLAZAME_P2']);
      assert.equal(process.env['DESPLAZAME_P1'], 'del-primero', 'el primero de la lista manda');
      assert.equal(process.env['DESPLAZAME_P2'], 'solo-en-el-segundo');
    } finally {
      delete process.env['DESPLAZAME_P1'];
      delete process.env['DESPLAZAME_P2'];
      rmSync(dir, { recursive: true, force: true });
    }
  });

  /**
   * ⭐ JUEZ 11 — LA SEMILLA NO SE TOCA, y el vivo va a otro sitio.
   *
   * ⚠️ Es la juez de la decisión del 31/08. La semilla es un recurso del
   * manifiesto con su `sha256` **verificado sobre un clon**, y dos pruebas
   * vivas lo recalculan. Si alguien apuntara la escritura a ella, el manifiesto
   * pasaría a mentir en cinco campos y esas dos se pondrían rojas. Aquí se
   * compra que las dos rutas son **distintas** y que la semilla sigue siendo la
   * que el manifiesto declara.
   */
  test('⭐ 11 · la semilla y el vivo son ficheros DISTINTOS, y la semilla no se toca', async () => {
    const { VIVO, REGISTRO } = await import('./feed.ts');
    assert.notEqual(SEMILLA, VIVO, 'el vivo NO puede ser la semilla');
    assert.notEqual(SEMILLA, REGISTRO);
    assert.match(SEMILLA, /2026-08-10_nap_gtfs-ficha1176\.zip$/);
    assert.match(VIVO, /nap_gtfs-ficha1176\.vivo\.zip$/);

    // Y la semilla sigue siendo, byte a byte, la que el manifiesto declara.
    const paquete = JSON.parse(
      readFileSync(new URL('../../datapackage.json', import.meta.url), 'utf8'),
    ) as { resources: { path: string; hash: string; bytes: number }[] };
    const suya = paquete.resources.find((r) => r.path.endsWith('2026-08-10_nap_gtfs-ficha1176.zip'));
    assert.ok(suya, 'la semilla tiene que seguir en el manifiesto');
    assert.equal('sha256:' + sha256(ZIP_BUENO), suya.hash);
    assert.equal(ZIP_BUENO.length, suya.bytes);
  });
});
