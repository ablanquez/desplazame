/**
 * foto-del-inicial — de qué está hecho el paquete INICIAL, leído del metafile
 * que escribe el propio constructor. Nace con la poda del presupuesto (22/09).
 *
 * DE DÓNDE SALE EL DATO
 *   `ng build --stats-json` deja junto al dist un `stats.json` que es **el
 *   metafile de esbuild**: cada fichero de salida con los bytes que pone en él
 *   cada fichero de entrada (`bytesInOutput`). Esto no adivina nada: suma lo que
 *   el constructor dice que escribió. Para contrastarlo por otra vía está
 *   source-map-explorer sobre una construcción con `--source-map`; las dos
 *   coinciden al byte en los paquetes (ver el checkpoint de la poda).
 *
 * QUÉ ES «EL INICIAL»
 *   El trozo de `src/main.ts`, todo lo que importa de forma ESTÁTICA —en
 *   cadena—, y la hoja global de estilos. Los `import()` no cuentan: son las
 *   rutas perezosas. Es la misma suma que la raya de `initial` del
 *   presupuesto: el TOTAL de la primera tabla es la cifra que el CLI avisa.
 *
 * ⚠️ LO QUE EL METAFILE NO ATRIBUYE: «pegamento»
 *   Las sentencias `import`/`export` entre trozos y el envoltorio del propio
 *   esbuild no son de ninguna entrada. Se imprimen aparte, porque es lo que
 *   crece cuando el inicial se parte en más trozos.
 *
 * ⚠️ Y CUÁNDO NO SIRVE: el optimizador de trozos
 *   `@angular/build` pasa una segunda vuelta con Rollup cuando hay **3 o más
 *   trozos perezosos** (`optimizeChunksThreshold`, por defecto 3; se fuerza con
 *   `NG_BUILD_OPTIMIZE_CHUNKS`). Esa vuelta reescribe los trozos y deja el
 *   metafile con las cuentas de ANTES: lo atribuido supera a lo escrito. El
 *   guion lo detecta y sale con 3 en vez de dar una foto falsa.
 *
 * USO
 *   npx ng build --stats-json --output-path <carpeta>
 *   node scripts/foto-del-inicial.mjs <carpeta>/stats.json [--gordos N]
 *
 * CÓDIGOS DE SALIDA
 *   0  foto hecha
 *   2  no hay metafile, o no tiene la entrada `src/main.ts`
 *   3  el metafile no es atribuible (pasó el optimizador de trozos)
 */

import { existsSync, readFileSync } from 'node:fs';

const [ruta] = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const iGordos = process.argv.indexOf('--gordos');
const GORDOS = iGordos > 0 ? Number(process.argv[iGordos + 1]) : 10;

if (!ruta || !existsSync(ruta)) {
  console.error(`  MAL  no hay metafile en «${ruta ?? '(sin ruta)'}» — construye con --stats-json`);
  process.exit(2);
}
const meta = JSON.parse(readFileSync(ruta, 'utf8'));
const salidas = Object.entries(meta.outputs ?? {});
const main = salidas.find(([, v]) => v.entryPoint === 'src/main.ts')?.[0];
if (!main) {
  console.error('  MAL  el metafile no tiene el trozo de src/main.ts');
  process.exit(2);
}

// El inicial: main, sus importaciones estáticas en cadena, y la hoja global.
const iniciales = new Set([main]);
for (const cola = [main]; cola.length; ) {
  for (const i of meta.outputs[cola.pop()].imports ?? []) {
    if (i.kind === 'import-statement' && !iniciales.has(i.path)) {
      iniciales.add(i.path);
      cola.push(i.path);
    }
  }
}
for (const [nombre, v] of salidas) if (v.entryPoint?.startsWith('angular:styles/global')) iniciales.add(nombre);

const BARRA = String.fromCharCode(92);
/** `../node_modules/@angular/core/fesm2022/x.mjs` → `@angular/core`; lo nuestro, tal cual. */
const paqueteDe = (entrada) => {
  const e = entrada.split(BARRA).join('/');
  const i = e.lastIndexOf('node_modules/');
  if (i < 0) return e;
  const partes = e.slice(i + 'node_modules/'.length).split('/');
  return partes[0].startsWith('@') ? `${partes[0]}/${partes[1]}` : partes[0];
};
const kB = (b) => (b / 1000).toFixed(2).replace('.', ',');
const pct = (b, t) => ((100 * b) / t).toFixed(1).replace('.', ',');

let total = 0;
let atribuido = 0;
const porPaquete = new Map();
const porEntrada = [];
console.log('foto-del-inicial · de qué está hecho el paquete inicial\n');
console.log('  trozo                          |      kB | entradas');
for (const nombre of iniciales) {
  const v = meta.outputs[nombre];
  total += v.bytes;
  const entradas = Object.entries(v.inputs ?? {});
  for (const [entrada, x] of entradas) {
    atribuido += x.bytesInOutput;
    porPaquete.set(paqueteDe(entrada), (porPaquete.get(paqueteDe(entrada)) ?? 0) + x.bytesInOutput);
    porEntrada.push([entrada, x.bytesInOutput]);
  }
  console.log(`  ${nombre.padEnd(30)} | ${kB(v.bytes).padStart(7)} | ${entradas.length}`);
}
console.log(`  ${'TOTAL (la raya «initial»)'.padEnd(30)} | ${kB(total).padStart(7)} |`);

if (atribuido > total) {
  console.error(`\n  MAL  lo atribuido (${atribuido} B) supera a lo escrito (${total} B): pasó el`);
  console.error('       optimizador de trozos y el metafile cuenta lo de ANTES. Sin foto.');
  process.exit(3);
}

console.log('\n  por paquete                    |      kB |     %');
for (const [p, b] of [...porPaquete].sort((a, b) => b[1] - a[1])) {
  console.log(`  ${p.padEnd(30)} | ${kB(b).padStart(7)} | ${pct(b, total).padStart(5)}`);
}
console.log(`  ${'pegamento (sin entrada)'.padEnd(30)} | ${kB(total - atribuido).padStart(7)} | ${pct(total - atribuido, total).padStart(5)}`);

console.log(`\n  los ${GORDOS} ficheros más gordos`);
porEntrada.sort((a, b) => b[1] - a[1]);
for (const [entrada, b] of porEntrada.slice(0, GORDOS)) console.log(`  ${kB(b).padStart(7)} kB  ${entrada}`);
