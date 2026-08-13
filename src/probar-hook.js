// ⭐⭐⭐ TANDA 31 · LA CONTRAPRUEBA DEL HOOK — su ROJO y sus VERDES, vistos.
//
//   node src/probar-hook.js
//
// ═════════════════════════════════════════════════════════════════════════════
// POR QUÉ EXISTE
// ═════════════════════════════════════════════════════════════════════════════
//   `.githooks/commit-msg` lleva desde la tanda 11 rechazando `fix:` sin entrada
//   de bitácora, y **nadie le había probado nunca los verdes**. La tanda 29 le
//   encontró TRES falsos positivos —`--amend`, `--amend --no-edit`, y la entrada
//   en el commit anterior— y el tercero **castigaba la práctica que `CLAUDE.md`
//   exige**: commits atómicos.
//
//   ⛔ Un guardián no está hecho hasta que se ha visto su rojo (ley del proyecto).
//     Y a éste hay que verle además los verdes, porque el fallo que tenía era por
//     rechazar de más, no por dejar pasar.
//
// ═════════════════════════════════════════════════════════════════════════════
// ⛔⛔ DÓNDE SE PRUEBA, Y POR QUÉ NO AQUÍ
// ═════════════════════════════════════════════════════════════════════════════
//   Todo ocurre en un repositorio de usar y tirar en el temporal del sistema, con
//   su propia identidad y su propio `core.hooksPath`. ⛔ **No se toca este
//   repositorio ni una vez**: probar un hook de commits haciendo commits en el
//   sitio que se está auditando es exactamente la ley 39 —el guardián modificando
//   el estado que vigila— cometida por el que viene a arreglarla.
//   ⭐ Y el hook que se prueba es **el fichero real**, copiado: si se reescribiera
//     aquí una versión «equivalente», esto probaría mi copia y no el guardián.

'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');
const A = require('./alarma');

const HOOK = path.join(__dirname, '..', '.githooks', 'commit-msg');
const ENTRADA = '\n## [2026-01-01] — una entrada de prueba\n**Categoría:** prueba\n';

/** Un repositorio nuevo, con el hook real instalado. */
function repo() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'desplazame-hook-'));
  const git = (...args) => spawnSync('git', args, { cwd: dir, encoding: 'utf8' });
  git('init', '-q');
  git('config', 'user.email', 'prueba@local');
  git('config', 'user.name', 'prueba');
  git('config', 'commit.gpgsign', 'false');
  fs.mkdirSync(path.join(dir, '.githooks'));
  fs.mkdirSync(path.join(dir, 'docs'));
  fs.copyFileSync(HOOK, path.join(dir, '.githooks', 'commit-msg'));
  fs.chmodSync(path.join(dir, '.githooks', 'commit-msg'), 0o755);
  git('config', 'core.hooksPath', '.githooks');
  // un commit inicial que NO es un fix y NO lleva entrada
  fs.writeFileSync(path.join(dir, 'docs', 'BITACORA.md'), '# BITACORA\n');
  fs.writeFileSync(path.join(dir, 'codigo.txt'), 'v0\n');
  git('add', 'docs/BITACORA.md', 'codigo.txt');
  git('commit', '-m', 'chore: inicial');
  return { dir, git };
}

const anadirEntrada = (dir) => fs.appendFileSync(path.join(dir, 'docs', 'BITACORA.md'), ENTRADA);
const tocarCodigo = (dir, v) => fs.writeFileSync(path.join(dir, 'codigo.txt'), v + '\n');
/** ¿queda el árbol limpio? — `git status --porcelain` vacío */
const limpio = (git) => git('status', '--porcelain').stdout.trim() === '';
const tira = (dir) => { try { fs.rmSync(dir, { recursive: true, force: true }); } catch (e) { /* da igual */ } };

// ═════════════════════════════════════════════════════════════════════════════
const CASOS = [
  {
    id: 'ROJO · `fix:` sin entrada en ningún sitio',
    espera: 'rechazo',
    porque: '⭐⭐ ES EL ROJO. Si esto pasara, el hook no guardaría nada y todo lo demás daría igual.',
    correr: ({ dir, git }) => {
      tocarCodigo(dir, 'v1'); git('add', 'codigo.txt');
      return git('commit', '-m', 'fix(algo): un arreglo sin bitacora');
    },
  },
  {
    id: 'VERDE · `fix:` CON la entrada en el mismo commit',
    espera: 'acepta',
    porque: 'el caso de siempre — el que ya funcionaba. Si se rompiera, el arreglo habría roto lo bueno.',
    correr: ({ dir, git }) => {
      anadirEntrada(dir); tocarCodigo(dir, 'v1');
      git('add', 'docs/BITACORA.md', 'codigo.txt');
      return git('commit', '-m', 'fix(algo): con su bitacora al lado');
    },
  },
  {
    id: 'VERDE · `git commit --amend`  (falso positivo nº1)',
    espera: 'acepta',
    porque: 'la entrada está en el commit que se enmienda, no en el diff en stage',
    correr: ({ dir, git }) => {
      anadirEntrada(dir); tocarCodigo(dir, 'v1');
      git('add', 'docs/BITACORA.md', 'codigo.txt');
      git('commit', '-m', 'fix(algo): con su bitacora');
      tocarCodigo(dir, 'v2'); git('add', 'codigo.txt');
      return git('commit', '--amend', '-m', 'fix(algo): con su bitacora, retocado');
    },
  },
  {
    id: 'VERDE · `git commit --amend --no-edit`  (falso positivo nº2)',
    espera: 'acepta',
    porque: 'igual que el anterior, y es como se corrige un commit sin tocar el mensaje',
    correr: ({ dir, git }) => {
      anadirEntrada(dir); tocarCodigo(dir, 'v1');
      git('add', 'docs/BITACORA.md', 'codigo.txt');
      git('commit', '-m', 'fix(algo): con su bitacora');
      tocarCodigo(dir, 'v2'); git('add', 'codigo.txt');
      return git('commit', '--amend', '--no-edit');
    },
  },
  {
    id: '⭐⭐ VERDE · la entrada en el commit ANTERIOR  (falso positivo nº3)',
    espera: 'acepta',
    porque: '⚠️ el que manda: bitácora en un commit y `fix:` en el siguiente SON commits atómicos, '
      + 'que es lo que `CLAUDE.md` exige. El hook castigaba su propia ley.',
    correr: ({ dir, git }) => {
      anadirEntrada(dir); git('add', 'docs/BITACORA.md');
      git('commit', '-m', 'docs: la entrada de bitacora');
      tocarCodigo(dir, 'v1'); git('add', 'codigo.txt');
      return git('commit', '-m', 'fix(algo): el arreglo, en su propio commit');
    },
  },
  {
    id: '⛔ ROJO · `fix:` DOS commits después de la entrada',
    espera: 'rechazo',
    porque: '⭐ el límite de la laxitud nueva, comprobado: la ventana es UN commit, no «alguna vez».',
    correr: ({ dir, git }) => {
      anadirEntrada(dir); git('add', 'docs/BITACORA.md');
      git('commit', '-m', 'docs: la entrada de bitacora');
      tocarCodigo(dir, 'v1'); git('add', 'codigo.txt');
      git('commit', '-m', 'chore: algo por en medio');
      tocarCodigo(dir, 'v2'); git('add', 'codigo.txt');
      return git('commit', '-m', 'fix(algo): dos commits despues');
    },
  },
  {
    id: 'VERDE · un commit que NO es `fix:` y no lleva entrada',
    espera: 'acepta',
    porque: 'el hook solo mira los `fix:` — si tocara a los demás, no se podría trabajar',
    correr: ({ dir, git }) => {
      tocarCodigo(dir, 'v1'); git('add', 'codigo.txt');
      return git('commit', '-m', 'feat(algo): esto no es un arreglo');
    },
  },
];

module.exports = { CASOS, repo };

// ═════════════════════════════════════════════════════════════════════════════
if (require.main === module) {
  const log = console.log;
  const di = (k, v) => log(`   ${String(k).padEnd(60)} ${v}`);
  const T0 = Date.now();

  log('='.repeat(104));
  log('EL HOOK DE LA BITÁCORA — su rojo y sus verdes, vistos');
  log('='.repeat(104));

  // ═══════════════════════════════════════════════════════════════════════════
  // ⭐⭐⭐ TANDA DE ARREGLO 10 · TRES ESTADOS, NO DOS
  // ═══════════════════════════════════════════════════════════════════════════
  //   Este fichero comprueba el hook lanzando `git` **82 veces**. Hasta hoy tenía
  //   dos respuestas posibles: **acepta** o **acusa**. Le faltaba la tercera, que
  //   es la única honrada cuando no puede mirar: **no puedo comprobar.**
  //
  //   ⛔⛔ Y sin `git` en el PATH no se callaba: **MENTÍA.** Medido el 13/08 con
  //     `PATH` sin `git` — 13 fallos, y **12 eran una acusación falsa contra un
  //     hook `commit-msg` que está perfecto**:
  //         ⛔ FALLO · el hook: «VERDE · `fix:` CON la entrada…» esperaba acepta y salió rechazo
  //     *El mensaje de un guardián es una afirmación sobre la causa*, y ésa era
  //     falsa. **Cuando un test falla, el primer sospechoso es el test** — y aquí
  //     el test acusaba doce veces a código sano.
  //
  //   ⚠️ Y LO PEOR NO ES QUE FALLARA: **ES QUE YA LO SABÍA.** La palanca de abajo
  //     disparaba bien y decía la verdad —*«el hook no se ejecuta…: los siete
  //     casos serían falsos»*— y el fichero **se ignoraba a sí mismo y ejecutaba
  //     los casos igual**, seis líneas más abajo. La refutación estaba impresa en
  //     la misma ejecución, encima de las acusaciones.
  //
  //   ⭐ Y hoy no mordía **por casualidad, no por diseño**: `git` está en el PATH
  //     del sistema y `usr\bin` de Git no. La casualidad se acaba en una máquina
  //     sin Git en el PATH, o en un CI — que es justo donde se lanzan baterías.
  //
  //   ⛔ Aquí no se aprueba nada: se sale en **ROJO diciendo la causa verdadera**,
  //     y **no se ejecuta ni un caso**, porque sus veredictos no valdrían.
  log('');
  log('   ⭐⭐⭐ ANTES QUE NADA: ¿se puede ejecutar `git` en este entorno?');
  {
    const v = spawnSync('git', ['--version'], { encoding: 'utf8' });
    const hayGit = !v.error && v.status === 0 && /git version/i.test(v.stdout || '');
    di('   `git --version`', hayGit ? '✅ ' + String(v.stdout).trim()
      : '⛔ NO SE PUEDE EJECUTAR — ' + (v.error ? String(v.error.code) : 'código ' + v.status));
    if (!hayGit) {
      A.fallo('no se puede ejecutar `git` en este entorno: este guardián NO PUEDE comprobar el hook. '
        + '⛔ Los siete casos NO se ejecutan, porque sus veredictos acusarían al hook `commit-msg` de '
        + 'un fallo que es del entorno');
      log('');
      log('   ⛔⛔ NO SE EJECUTA NINGÚN CASO, y eso es el arreglo, no una escotilla:');
      log('     un guardián que no puede comprobar **no absuelve ni condena — declara');
      log('     que no puede**. El hook `commit-msg` NO está en cuestión: lo que falta');
      log('     es `git`. ⇒ Un fallo verdadero en vez de doce falsos.');
      log('');
      log(A.cierre('EL HOOK DE LA BITÁCORA'));
      di('tiempo total', ((Date.now() - T0) / 1000).toFixed(1) + ' s');
      process.exit(1);
    }
  }

  // ── ⭐ LA PALANCA: ¿el hook se está ejecutando siquiera? ────────────────────
  //   «El instrumento arranca» no es «el instrumento mide» (nº117). Si
  //   `core.hooksPath` no cogiera, TODOS los casos saldrían «acepta» y seis de
  //   los siete pasarían — un verde precioso que no probaría nada.
  log('');
  log('   ⭐⭐ LA PALANCA, ANTES DE NADA: ¿se ejecuta el hook en el repositorio de prueba?');
  {
    const { dir, git } = repo();
    // se sabota el hook para que rechace TODO: si el rechazo no llega, no corre
    fs.writeFileSync(path.join(dir, '.githooks', 'commit-msg'),
      '#!/usr/bin/env bash\necho "HOOK-VIVO" >&2\nexit 1\n');
    fs.chmodSync(path.join(dir, '.githooks', 'commit-msg'), 0o755);
    tocarCodigo(dir, 'x'); git('add', 'codigo.txt');
    const r = git('commit', '-m', 'chore: prueba de palanca');
    const vivo = r.status !== 0 && /HOOK-VIVO/.test(r.stderr || '');
    di('un hook que rechaza TODO, ¿rechaza?', vivo ? '✅ sí — el hook se ejecuta' : '⛔ NO — nada de lo de abajo valdría');
    A.exige(vivo, 'el hook no se ejecuta en el repositorio de prueba: los siete casos serían falsos');
    tira(dir);
  }

  // ── los casos ─────────────────────────────────────────────────────────────
  log('');
  log('   ' + 'caso'.padEnd(58) + 'espera'.padStart(10) + 'sale'.padStart(10) + '   árbol');
  let mal = 0;
  for (const c of CASOS) {
    const R = repo();
    let r, err = null;
    try { r = c.correr(R); } catch (e) { err = e; }
    const rechazado = !err && r.status !== 0;
    const salio = err ? 'ERROR' : (rechazado ? 'rechazo' : 'acepta');
    const ok = salio === c.espera;
    // ⚠️ Y QUE EL ÁRBOL QUEDE LIMPIO TRAS UN RECHAZO — ley 39. Lo único que
    //   puede quedar sucio es lo que el propio caso dejó en el stage a propósito,
    //   así que se mira el fichero que el hook escribía antes: la bitácora.
    const bit = fs.readFileSync(path.join(R.dir, 'docs', 'BITACORA.md'), 'utf8');
    const esqueletoEnArbol = /NO CONSTA/.test(bit);
    const esqueletoFuera = fs.existsSync(path.join(R.dir, '.git', 'BITACORA-ESQUELETO.md'));
    if (!ok || esqueletoEnArbol) mal++;
    log('   ' + c.id.padEnd(58) + c.espera.padStart(10) + salio.padStart(10)
      + '   ' + (esqueletoEnArbol ? '⛔ el hook ESCRIBIÓ en la bitácora' : '✅ intacta')
      + '   ' + (ok ? '✅' : '⛔'));
    log('      ' + c.porque);
    A.exige(ok, `el hook: «${c.id}» esperaba ${c.espera} y salió ${salio}`);
    A.exige(!esqueletoEnArbol, `el hook escribió el esqueleto en docs/BITACORA.md en el caso «${c.id}» (ley 39)`);
    if (rechazado) {
      di('   ⭐ el esqueleto va a $GIT_DIR, fuera del árbol', esqueletoFuera ? '✅ sí' : '⛔ NO se ha escrito en ningún sitio');
      A.exige(esqueletoFuera, `el rechazo de «${c.id}» no deja el esqueleto en $GIT_DIR: cumplir deja de ser fácil`);
    }
    tira(R.dir);
  }

  log('');
  di('⭐⭐ casos correctos', `${CASOS.length - mal} de ${CASOS.length}`);
  log('');
  log('   ⚠️ Lo que esto NO comprueba: que el hook esté INSTALADO en el repositorio de');
  log('      verdad. Los hooks no viajan en git; hace falta `git config core.hooksPath');
  log('      .githooks` en cada clon, y eso no lo puede garantizar ningún fichero.');
  log('   ⚠️ Y tampoco que el texto del rechazo se entienda. Eso lo dice quien se lo come.');
  log('');
  log(A.cierre('EL HOOK DE LA BITÁCORA'));
  di('tiempo total', ((Date.now() - T0) / 1000).toFixed(1) + ' s');
}
