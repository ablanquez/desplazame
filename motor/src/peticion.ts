/**
 * EL LECTOR DE LA PETICIÓN: lo único que mira lo que llega de fuera.
 *
 * Vive solo, y no por gusto de repartir ficheros. `leerPeticion` no necesita
 * el grafo, ni el callejero, ni los portales: **solo el contrato**. Estaba
 * dentro de `trayecto.ts`, que sí los necesita, y eso lo hacía inalcanzable
 * desde la pantalla — importarlo arrastraba la mitad del motor y con ella
 * `node:fs`, que en un navegador no existe.
 *
 * ⭐ Y esa era justamente la costura sin vigilar. Lo cuenta la entrada nº11 de
 * la bitácora: las pruebas del motor probaban el motor, las de la pantalla
 * probaban la pantalla, y **el cable entre las dos no lo miraba nadie** — un
 * cuerpo bien formado y un lector que sabe leerlo pueden estar los dos en
 * verde sin haberse visto nunca. `app/src/app/peticion-de-punta-a-punta.spec.ts`
 * importa este fichero para cerrar ese hueco, y por eso aquí no puede entrar
 * ni un `import` que hable de disco.
 */

import type { ExtremoDeRuta, ExtremoPortal, Modo, PeticionDeRuta } from '@desplazame/tipos';

/**
 * Lee la petición sin fiarse de nada de lo que trae.
 *
 * Llega de fuera, así que puede ser cualquier cosa: `null`, una lista, un
 * objeto sin campos, o campos que no son cadenas. Devuelve `null` si no es una
 * petición, y arriba eso se convierte en un aviso — no en un 400.
 */
export function leerPeticion(cuerpo: unknown): PeticionDeRuta | null {
  if (typeof cuerpo !== 'object' || cuerpo === null || Array.isArray(cuerpo)) {
    return null;
  }
  const bruto = cuerpo as Record<string, unknown>;
  const punto = (nombre: string): ExtremoPortal | null => {
    const valor = bruto[nombre];
    if (typeof valor !== 'object' || valor === null) {
      return null;
    }
    const { via, portal } = valor as Record<string, unknown>;
    if (typeof via !== 'string' || typeof portal !== 'string' || via === '' || portal === '') {
      return null;
    }
    return { via, portal };
  };
  /**
   * Un extremo puede venir de dos formas, y se prueban **en este orden**: si
   * trae `sitio`, es un sitio; si no, se le exige la pareja vía+portal. Lo que
   * no sea ninguna de las dos no es una petición, y arriba eso es un aviso.
   */
  const extremo = (nombre: string): ExtremoDeRuta | null => {
    const valor = bruto[nombre];
    if (typeof valor === 'object' && valor !== null) {
      const { sitio } = valor as Record<string, unknown>;
      if (typeof sitio === 'string' && sitio !== '') {
        return { sitio };
      }
    }
    return punto(nombre);
  };
  // Los dos extremos, por el mismo camino: la simetría empieza aquí.
  const origen = extremo('origen');
  const destino = extremo('destino');
  /**
   * ⭐ `modo` es OPCIONAL desde el 29/08, y las dos ausencias no son la misma.
   *
   * **No venir** es un cliente que no dice el modo, y ese tiene defecto:
   * `andando`, que es el modo que existía cuando el campo era obligatorio.
   * **Venir y no ser una cadena** es un cliente roto, y ese sigue sin ser una
   * petición — un `7` ahí no es una omisión, es una equivocación.
   *
   * Lo que vale como texto no se valida aquí contra la lista de modos: eso lo
   * hace el motor, que contesta con un Aviso honrado al modo que no atiende.
   * Este fichero solo mira la forma.
   */
  const crudoModo = bruto['modo'];
  if (crudoModo !== undefined && typeof crudoModo !== 'string') {
    return null;
  }
  if (!origen || !destino) {
    return null;
  }
  return { origen, destino, modo: (crudoModo as Modo | undefined) ?? 'andando' };
}
