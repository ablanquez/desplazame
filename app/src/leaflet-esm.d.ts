/**
 * Los tipos del ESM de Leaflet son los de `@types/leaflet`, sin más.
 *
 * `@types/leaflet` declara el módulo `leaflet`, que resuelve al UMD; el ESM
 * (`dist/leaflet-src.esm.js`) no trae declaración propia. Es el mismo código
 * 1.9.4 con la misma superficie, así que aquí solo se dice eso: lo que exporta
 * el uno lo exporta el otro. El porqué de importar el ESM está en `mapa.ts`.
 */
declare module 'leaflet/dist/leaflet-src.esm.js' {
  export * from 'leaflet';
}
