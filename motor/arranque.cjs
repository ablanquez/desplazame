// El lanzador de Hostinger (lsnode) carga el entry con require(); nuestro
// servidor es ESM con top-level await (cocina la red ANTES de escuchar — sin
// mentira rápida), y require() no puede con eso [ERR_REQUIRE_ASYNC_MODULE:
// «Use import() instead»]. Este .cjs es el puente: probado en el servidor el
// 8/09.
//
// ⚠️ El top-level await NO es un descuido que se pueda quitar: está medido y es
//    `await cocinarYServir(...)` en `dist/servidor.js:894` —lo dice el propio
//    Node con `--experimental-print-required-tla`—, o sea la red de bus
//    cocinada antes de abrir el puerto. Un motor que escuchara antes de tenerla
//    contestaría «no hay red de bus» a quien llegase primero. Se conserva, y se
//    carga por la puerta que Node manda.
//
// ⚠️ La ruta es relativa A ESTE fichero, no al cwd: el panel arranca el proceso
//    desde donde quiere. `motor/arranque.cjs` → `motor/dist/servidor.js`.
//    Comprobado midiendo, no suponiendo (8/09).
import('./dist/servidor.js');
