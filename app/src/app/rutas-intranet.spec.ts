import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideLocationMocks } from '@angular/common/testing';
import { provideRouter, Router, type Routes } from '@angular/router';
import { App } from './app';
import { Buscador } from './buscador';
import { RUTAS_DE_INTRANET } from './rutas-intranet';
import { RUTAS_DE_INTRANET as RUTAS_DE_PRODUCCION } from './rutas-intranet.vacio';

/**
 * ⭐ LA MITAD DE PRODUCCIÓN, COMPROBADA SIN CONSTRUIR (19/09).
 *
 * ═══════════════════════════════════════════════════════════════════════════
 *  El problema: estas pruebas corren con el programa TypeScript de desarrollo,
 *  así que **ven el `rutas-intranet.ts` de verdad**. El `fileReplacements` que
 *  vacía la intranet solo lo aplica la configuración `production` del
 *  constructor, y aquí no hay constructor.
 *
 *  La solución no es fingir el mecanismo: es **importar el fichero de
 *  producción por su nombre** —`rutas-intranet.vacio.ts`, el mismo que
 *  `angular.json` pone en su sitio— y montar la app con él. Lo que se mide
 *  entonces es el objeto real que producción usará.
 *
 *  ⚠️ Lo que esto NO cubre, y por eso existe la otra: que el REEMPLAZO esté
 *     bien escrito en `angular.json` y que el trozo no se genere. Eso solo lo
 *     puede decir el dist construido, y lo dice `no-viaja.spec.ts`.
 * ═══════════════════════════════════════════════════════════════════════════
 */
describe('Las rutas de intranet, y su gemelo vacío', () => {
  /** La app montada con una tabla de rutas concreta, y navegada a una URL. */
  async function ir(url: string, deIntranet: Routes) {
    const rutas: Routes = [
      { path: '', component: Buscador },
      ...deIntranet,
      { path: '**', redirectTo: '' },
    ];
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter(rutas),
        provideLocationMocks(),
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(App);
    await TestBed.inject(Router).navigateByUrl(url);
    await fixture.whenStable();
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  beforeEach(() => {
    // El visor pide sus 17 ficheros al montarse. Aquí no se contesta ninguna:
    // lo que se mira es qué componente hay en pantalla, no qué trae.
    globalThis.fetch = (() => new Promise<Response>(() => {})) as typeof globalThis.fetch;
  });

  it('⭐ el fichero de producción declara CERO rutas', () => {
    // La forma más barata de que esto se rompa: que alguien copie el fichero
    // de verdad encima del vacío «para probar una cosa» y se le olvide.
    expect(RUTAS_DE_PRODUCCION).toEqual([]);
  });

  it('⭐ y el de local declara exactamente las dos firmadas: visor y panel', () => {
    // Alcance B, firmado por Antonio el 19/09. Si entrara una tercera página
    // en la intranet sin parlamentarla, se vería aquí.
    expect(RUTAS_DE_INTRANET.map((r) => r.path)).toEqual(['visor', 'panel']);
  });

  it('⭐ EN PRODUCCIÓN /visor cae en el buscador, no en una pantalla en blanco', async () => {
    const raiz = await ir('/visor', RUTAS_DE_PRODUCCION);
    expect(raiz.querySelector('app-buscador')).not.toBeNull();
    expect(raiz.querySelector('app-visor')).toBeNull();
  });

  it('⭐ EN PRODUCCIÓN /panel también cae en el buscador', async () => {
    // Quien tenga `/panel` en un marcador desde el 23/08 no se encuentra un
    // 404 ni una pantalla blanca: se encuentra la portada. Es el precio dicho
    // en el parlamento, y así es como se paga.
    const raiz = await ir('/panel', RUTAS_DE_PRODUCCION);
    expect(raiz.querySelector('app-buscador')).not.toBeNull();
    expect(raiz.querySelector('app-panel')).toBeNull();
  });

  // ⚠️ Un montaje por jueza, y no dos: `TestBed` no se deja reconfigurar una
  //    vez instanciado —«Cannot configure the test module when the test module
  //    has already been instantiated»—. Se aprendió aquí, en rojo.

  it('⭐ y en local /visor SÍ abre el visor, que es el contraste', async () => {
    // Sin esto, la de producción podría estar verde porque la página está
    // rota, no porque la lista venga vacía.
    expect((await ir('/visor', RUTAS_DE_INTRANET)).querySelector('app-visor')).not.toBeNull();
  });

  it('⭐ y en local /panel SÍ abre el panel, por lo mismo', async () => {
    expect((await ir('/panel', RUTAS_DE_INTRANET)).querySelector('app-panel')).not.toBeNull();
  });
});
