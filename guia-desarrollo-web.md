# IntegrIA Tech — Guía de desarrollo del sitio web

Instrucciones para construir el sitio real a partir del demo aprobado, con el mismo fondo de partículas 3D, y desplegarlo en **Vercel**.

## 0. Referencias

| Archivo | Para qué sirve |
|---|---|
| `demo/integria-demo.html` | **Demo aprobado.** Es la referencia visual y de comportamiento: colores, tipografías, animaciones y el fondo 3D. Ábrelo en el navegador y lee el `<script>` final. |
| `website-content-plan.md` | Contenido, servicios, bios, mapa del sitio y datos pendientes |
| `research-claude-skills-and-webgl.md` | Investigación del stack 3D y la checklist de rendimiento |

**Regla general:** el sitio real debe verse y comportarse igual que el demo. Todo lo que cambie respecto al demo (estructura de archivos, idiomas por URL, formulario) está explicado abajo.

---

## 1. Stack

| Necesidad | Herramienta | Por qué |
|---|---|---|
| Framework | **Astro 5** con salida estática | HTML real en cada página (bueno para SEO), muy poco JavaScript y multi-idioma integrado |
| Lenguaje | **TypeScript** | |
| Fondo 3D | **three** (npm) | El mismo motor del demo |
| Scroll suave | **lenis** (npm) | El mismo del demo |
| Fuentes | **@fontsource-variable/geist** y **@fontsource/ibm-plex-mono** | Fuentes alojadas en el propio sitio: cargan más rápido que Google Fonts y no comparten datos con terceros |
| Formulario de contacto | **Web3Forms** o **Formspree** (fase 1); **Resend** + endpoint en Vercel (fase 2, con dominio propio) | El sitio puede ser 100 % estático al inicio |
| SEO | **@astrojs/sitemap** | |
| Hosting | **Vercel** | Despliegue automático desde GitHub y previews por cada cambio |

No hace falta GSAP: el demo funciona con JavaScript propio. Agrégalo solo si más adelante se necesitan secuencias complejas.

---

## 2. Arranque del proyecto

```bash
npm create astro@latest integria-web -- --template minimal --typescript strict
cd integria-web
npm install three lenis @fontsource-variable/geist @fontsource/ibm-plex-mono
npm install -D @types/three
npx astro add sitemap
git init && git add . && git commit -m "Inicio del proyecto"
```

`astro.config.mjs`:

```js
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://integriatech.pe',          // cambiar por el dominio final
  output: 'static',
  i18n: {
    defaultLocale: 'es',
    locales: ['es', 'en'],
    routing: { prefixDefaultLocale: false }, // español en "/", inglés en "/en/"
  },
  integrations: [sitemap({ i18n: { defaultLocale: 'es', locales: { es: 'es-PE', en: 'en' } } })],
});
```

---

## 3. Estructura de archivos

```
src/
├── components/
│   ├── Background.astro       # canvas fijo + brillo + cuadrícula
│   ├── Nav.astro              # logo IntegrIA, enlaces, selector ES/EN
│   ├── Loader.astro           # contador 000 → 100 (solo en la primera visita)
│   ├── Cursor.astro
│   ├── Hero.astro
│   ├── Method.astro           # las 4 fases + indicador de fase
│   ├── Services.astro
│   ├── Figures.astro
│   ├── Founders.astro
│   ├── Contact.astro
│   └── Logo.astro
├── i18n/
│   ├── es.json
│   ├── en.json
│   └── t.ts                   # helper de traducción
├── layouts/
│   └── Base.astro             # <head>, SEO, fuentes, Background, Nav, scripts
├── pages/
│   ├── index.astro            # inicio (ES)
│   ├── servicios.astro
│   ├── nosotros.astro
│   ├── contacto.astro
│   ├── privacidad.astro
│   └── en/
│       ├── index.astro
│       ├── services.astro
│       ├── about.astro
│       ├── contact.astro
│       └── privacy.astro
├── scripts/
│   ├── particles.ts           # el fondo 3D (sección 6)
│   ├── app.ts                 # bucle único: Lenis, scroll, fondo, nav, cursor
│   └── ui.ts                  # contadores, botones magnéticos, copiar correo
└── styles/
    ├── tokens.css
    └── global.css
public/
├── favicon.svg
├── og-image.png               # 1200 × 630
└── bg-fallback.webp           # imagen fija del fondo (sin WebGL o con "reducir movimiento")
```

---

## 4. Diseño

### 4.1 Tokens (copiar tal cual del demo)

```css
/* src/styles/tokens.css */
:root {
  color-scheme: dark;
  --void: #05070D;   /* fondo principal */
  --navy: #0A0F1E;
  --blue: #1E5BFF;   /* color principal */
  --cyan: #00D4FF;   /* acento */
  --white: #FFFFFF;
  --paper: #F2F5FA;  /* secciones claras alternas */
  --ink: #0B1220;    /* texto sobre blanco */
  --ink-2: #46536B;
  --mist: #A9B4CC;   /* texto sobre oscuro */
  --line-d: rgba(169, 180, 204, 0.16);
  --line-l: #D6DEEA;
  --display: "Geist Variable", "Helvetica Neue", Arial, sans-serif;
  --body: "Geist Variable", "Helvetica Neue", Arial, sans-serif;
  --mono: "IBM Plex Mono", ui-monospace, Consolas, monospace;
  --gutter: clamp(16px, 4vw, 56px);
  --ease: cubic-bezier(.16, 1, .3, 1);
}
```

Importa las fuentes una sola vez en `Base.astro`:

```astro
---
import '@fontsource-variable/geist';
import '@fontsource/ibm-plex-mono/400.css';
import '@fontsource/ibm-plex-mono/500.css';
import '../styles/tokens.css';
import '../styles/global.css';
---
```

### 4.2 Tipografía

| Uso | Fuente | Tamaño | Interletrado |
|---|---|---|---|
| Título del inicio (h1) | Geist 500 | `clamp(2.7rem, 9vw, 9.6rem)`, interlineado .94 | `-0.055em` |
| Títulos de sección | Geist 500 | `clamp(2.6rem, 7.6vw, 7.8rem)`, interlineado .95 | `-0.055em` |
| Títulos de fase | Geist 500 | `clamp(2.4rem, 6vw, 5.2rem)` | `-0.05em` |
| Cifras grandes | Geist 400 | `clamp(4.2rem, 10vw, 9rem)` | `-0.06em` |
| Texto | Geist 400 | 16–18 px, interlineado 1.6 | normal |
| Etiquetas técnicas | IBM Plex Mono 500 | 12 px, mayúsculas | `0.12em` |

Los demás valores están en el `<style>` del demo.

### 4.3 Marca: IntegrIA

- El nombre se escribe **IntegrIA**: "Integr" en el color del texto y **"IA"** resaltado.
  - Sobre fondo oscuro, "IA" lleva un degradado de `--blue` a `--cyan`.
  - Sobre fondo blanco, "IA" va en `--blue` sólido, porque el cian pierde contraste.
- El logo del menú es "Integr**IA**" en Geist 600, seguido de "TECH" en IBM Plex Mono de 10 px con interletrado `0.2em`.
- En textos legales (pie de página, política de privacidad) el nombre legal es **INTEGRIA TECH S.A.C.**
- Marcado del logo:

```astro
<!-- src/components/Logo.astro -->
<a class="logo" href={home} aria-label="IntegrIA Tech">
  <b>Integr<span class="ia">IA</span></b><span class="tag">TECH</span>
</a>
```

- **Cuidado:** usa clases específicas (`.logo .tag`) y no selectores genéricos como `.logo span`. En el demo, ese selector genérico achicaba el "IA".
- Cuando haya un logo final, exportarlo como SVG y usarlo también como `favicon.svg`.

### 4.4 Ritmo oscuro / claro

Cada sección declara su fondo con un atributo:

```html
<section data-theme-zone="dark">…</section>   <!-- transparente: se ve el fondo 3D -->
<section data-theme-zone="light">…</section>  <!-- blanco o --paper, tapa el fondo 3D -->
```

Orden del inicio: Hero (oscuro) → Método (oscuro) → Servicios, Cifras, Fundadores (claro) → Contacto (oscuro).

El menú cambia de color según la zona que tenga debajo (sección 7.3). No uses `mix-blend-mode: difference` en el menú porque deforma el degradado del logo.

---

## 5. Contenido e idiomas

- Todo el texto vive en `src/i18n/es.json` y `src/i18n/en.json`. Ningún texto queda escrito directamente en los componentes.
- Los textos del demo (atributos `data-en` y su texto en español) sirven como primera versión de ambos archivos.

```json
// src/i18n/es.json (extracto)
{
  "hero.eyebrow": "Consultoría en TI · Lima, Perú",
  "hero.title": ["Integramos", "tecnología,", "datos y personas."],
  "hero.lead": "Consultoría en TI, gobierno digital y dirección de proyectos para empresas e instituciones públicas, con el software, los datos y la IA para llevarlo a la práctica.",
  "cta.meeting": "Agenda una reunión",
  "method.1.title": "Diagnóstico"
}
```

```ts
// src/i18n/t.ts
import es from './es.json';
import en from './en.json';
const dict = { es, en } as const;
export type Lang = keyof typeof dict;
export const t = (lang: Lang, key: keyof typeof es) => dict[lang][key];
```

- **Selector ES / EN:** en el sitio real es un **enlace a la página equivalente en el otro idioma** (`/servicios` ↔ `/en/services`), no un cambio de texto en la misma página. Así Google indexa los dos idiomas.
  - El efecto de "texto que se transforma como código" del demo se puede conservar como animación de salida antes de navegar. Es opcional.
- Agregar `hreflang` en el `<head>` de cada página:

```html
<link rel="alternate" hreflang="es-PE" href="https://integriatech.pe/servicios" />
<link rel="alternate" hreflang="en" href="https://integriatech.pe/en/services" />
<link rel="alternate" hreflang="x-default" href="https://integriatech.pe/servicios" />
```

---

## 6. El fondo 3D (pieza central)

### 6.1 Cómo funciona

Un único `<canvas>` fijo detrás de todo el sitio dibuja una red de partículas. Su forma depende del **progreso de scroll `p`**, que va de 0 a 4 a lo largo de la sección Método.

| `p` | Estado | Qué se ve |
|---|---|---|
| 0 | **A: caos** | Partículas dispersas que flotan (hero) |
| 0 → 1 | A → B | Se agrupan en 7 núcleos (Diagnóstico) |
| 1 → 2 | B + líneas | Líneas azules conectan los núcleos (Diseño) |
| 2 → 3 | B → D | Todo se transforma en una esfera (Implementación) |
| 3 → 4 | D + pulso | La esfera gira, muestra su malla cian y emite pulsos de luz (Acompañamiento) |

- En escritorio, la red se desplaza a la derecha (`x = 2.7`) para dejar libre el texto a la izquierda. En celular queda centrada.
- La red sigue suavemente al mouse con una rotación leve.
- En las páginas internas el fondo se muestra fijo en el estado D (esfera girando lento), con menos partículas.

### 6.2 Módulo `particles.ts`

Este código es el del demo, ordenado en un módulo y con una mejora: usa números aleatorios **con semilla**, así la red tiene la misma forma en cada visita.

```ts
// src/scripts/particles.ts
import * as THREE from 'three';

export interface FieldOptions {
  canvas: HTMLCanvasElement;
  mobile: boolean;
  reduced: boolean;
}

function mulberry32(seed: number) {
  return () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const ease = (t: number) => { t = Math.max(0, Math.min(1, t)); return t * t * (3 - 2 * t); };

export function createField({ canvas, mobile, reduced }: FieldOptions) {
  const rand = mulberry32(2026);
  const gauss = () => (rand() + rand() + rand() - 1.5) / 1.5;

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: !mobile, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, mobile ? 1.5 : 2));
  renderer.setSize(innerWidth, innerHeight, false);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(50, innerWidth / innerHeight, 0.1, 100);
  camera.position.z = 9;
  const group = new THREE.Group();
  scene.add(group);

  // --- Estados -------------------------------------------------------------
  const N = mobile ? 900 : 1800;
  const A = new Float32Array(N * 3), B = new Float32Array(N * 3), D = new Float32Array(N * 3);
  const cur = new Float32Array(N * 3), R = new Float32Array(N), S = new Float32Array(N);
  const cluster = new Int16Array(N);
  const K = 7, centers: number[][] = [];
  for (let k = 0; k < K; k++) {
    const ang = (k / K) * Math.PI * 2 + rand() * 0.4, rad = 2.4 + rand() * 0.9;
    centers.push([Math.cos(ang) * rad * 1.25, Math.sin(ang) * rad * 0.8, (rand() - 0.5) * 2]);
  }
  const golden = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < N; i++) {
    const i3 = i * 3, c = i % K;
    cluster[i] = c;
    A[i3] = (rand() - 0.5) * 16; A[i3 + 1] = (rand() - 0.5) * 10; A[i3 + 2] = (rand() - 0.5) * 8;
    B[i3] = centers[c][0] + gauss() * 0.6; B[i3 + 1] = centers[c][1] + gauss() * 0.6; B[i3 + 2] = centers[c][2] + gauss() * 0.6;
    const y = 1 - (i / (N - 1)) * 2, r = Math.sqrt(1 - y * y), th = i * golden; // esfera de Fibonacci
    D[i3] = Math.cos(th) * r * 2.6; D[i3 + 1] = y * 2.6; D[i3 + 2] = Math.sin(th) * r * 2.6;
    R[i] = rand(); S[i] = 0.6 + rand() * 1.1;
    cur.set([A[i3], A[i3 + 1], A[i3 + 2]], i3);
  }

  // --- Enlaces ---------------------------------------------------------------
  // pairs1: vecinos dentro de cada núcleo + puentes entre núcleos (estado "red")
  // pairs2: vecinos en la esfera (estado "malla")
  // Copiar la construcción de pairs1 y pairs2 del demo (bloque "Network links" y
  // "Lattice links on the sphere"), cambiando Math.random() por rand().
  const pairs1: number[] = buildClusterLinks(B, cluster, K, N, rand);
  const pairs2: number[] = buildSphereLinks(D, N);

  // --- Puntos (shader) -------------------------------------------------------
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(cur, 3));
  geo.setAttribute('aR', new THREE.BufferAttribute(R, 1));
  geo.setAttribute('aS', new THREE.BufferAttribute(S, 1));
  const mat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: {
      uTime: { value: 0 }, uPx: { value: renderer.getPixelRatio() }, uPulse: { value: 0 },
      uBlue: { value: new THREE.Color('#1E5BFF') }, uCyan: { value: new THREE.Color('#00D4FF') },
    },
    vertexShader: /* glsl */ `
      attribute float aR; attribute float aS;
      uniform float uTime; uniform float uPx; uniform float uPulse;
      varying float vR;
      void main() {
        vR = aR;
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        float pulse = 1.0 + uPulse * 0.6 * max(0.0, sin(uTime * 2.2 - aR * 12.0 - position.y * 1.4));
        gl_PointSize = 0.075 * aS * pulse * uPx * (300.0 / -mv.z);
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */ `
      uniform vec3 uBlue; uniform vec3 uCyan; varying float vR;
      void main() {
        float d = length(gl_PointCoord - 0.5);
        float a = smoothstep(0.5, 0.0, d);
        vec3 col = mix(uBlue, uCyan, smoothstep(0.35, 1.0, vR));
        gl_FragColor = vec4(col * 1.25, a * 0.9);
      }`,
  });
  group.add(new THREE.Points(geo, mat));

  const makeLines = (pairs: number[], color: number) => {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(pairs.length * 3), 3));
    const m = new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false });
    const l = new THREE.LineSegments(g, m);
    group.add(l);
    return { l, m, pairs, arr: g.attributes.position.array as Float32Array, attr: g.attributes.position };
  };
  const L1 = makeLines(pairs1, 0x3d74ff), L2 = makeLines(pairs2, 0x00d4ff);
  const sync = (L: ReturnType<typeof makeLines>) => {
    for (let n = 0; n < L.pairs.length; n++) L.arr.set(cur.subarray(L.pairs[n] * 3, L.pairs[n] * 3 + 3), n * 3);
    L.attr.needsUpdate = true;
  };

  // --- Frame -----------------------------------------------------------------
  let rotY = 0, rotX = 0, posX = 0;
  function render(time: number, p: number, mouse: { nx: number; ny: number }) {
    const t = reduced ? 0 : time * 0.001, e1 = ease(p), e3 = ease(p - 2), drift = (1 - e1) * 0.28 + 0.03;
    for (let i = 0; i < N; i++) {
      const i3 = i * 3; let bx, by, bz;
      if (p < 1) { bx = A[i3] + (B[i3] - A[i3]) * e1; by = A[i3 + 1] + (B[i3 + 1] - A[i3 + 1]) * e1; bz = A[i3 + 2] + (B[i3 + 2] - A[i3 + 2]) * e1; }
      else if (p < 2) { bx = B[i3]; by = B[i3 + 1]; bz = B[i3 + 2]; }
      else { bx = B[i3] + (D[i3] - B[i3]) * e3; by = B[i3 + 1] + (D[i3 + 1] - B[i3 + 1]) * e3; bz = B[i3 + 2] + (D[i3 + 2] - B[i3 + 2]) * e3; }
      const ph = R[i] * 40;
      cur[i3] = bx + Math.sin(t * 0.5 + ph) * drift;
      cur[i3 + 1] = by + Math.cos(t * 0.4 + ph * 1.3) * drift;
      cur[i3 + 2] = bz + Math.sin(t * 0.3 + ph * 0.7) * drift;
    }
    geo.attributes.position.needsUpdate = true;

    const o1 = ease((p - 1.25) / 0.6) * (1 - ease((p - 2.3) / 0.5));
    const o2 = ease((p - 2.6) / 0.6);
    L1.m.opacity = o1 * 0.28; L1.l.visible = o1 > 0.01; if (L1.l.visible) sync(L1);
    L2.m.opacity = o2 * 0.22; L2.l.visible = o2 > 0.01; if (L2.l.visible) sync(L2);

    mat.uniforms.uTime.value = t;
    mat.uniforms.uPulse.value = ease(p - 3);
    rotY += reduced ? 0 : 0.0006 + ease(p - 2.4) * 0.0035;
    rotX += (mouse.ny * 0.25 - rotX) * 0.04;
    posX += ((mobile ? 0 : 2.7 * ease(p * 1.2)) - posX) * 0.05;
    group.position.x = posX;
    group.rotation.set(rotX, rotY + mouse.nx * 0.3 * (1 - e3 * 0.5), 0);
    renderer.render(scene, camera);
  }

  function resize() {
    renderer.setSize(innerWidth, innerHeight, false);
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
  }

  function dispose() {
    geo.dispose(); mat.dispose(); L1.m.dispose(); L2.m.dispose();
    L1.l.geometry.dispose(); L2.l.geometry.dispose(); renderer.dispose();
  }

  return { render, resize, dispose };
}
```

`buildClusterLinks` y `buildSphereLinks` son las dos funciones de enlaces del demo pasadas a funciones puras. No cambies sus umbrales de distancia: definen cuántas líneas se ven.

### 6.3 Componente `Background.astro`

```astro
<canvas id="gl" aria-hidden="true"></canvas>
<div class="glow" aria-hidden="true"></div>
<div class="grid-bg" aria-hidden="true"></div>
<img class="bg-fallback" src="/bg-fallback.webp" alt="" aria-hidden="true" />
```

Copia los estilos `#gl`, `.glow` y `.grid-bg` del demo. `.bg-fallback` está oculto por defecto y se muestra cuando la clase `no-gl` está en `<html>`.

### 6.4 Rendimiento del fondo

- [ ] **Carga diferida:** el HTML y el texto aparecen primero. `three` se importa con `import()` después del primer pintado (dentro de `requestIdleCallback`), así no frena el LCP.
- [ ] **Pausa** cuando una zona clara tapa toda la pantalla (ya está en el demo) y cuando la pestaña está oculta (`document.hidden`).
- [ ] **Niveles de calidad:**
  - Escritorio: 1800 partículas, DPR hasta 2.
  - Celular: 900 partículas, DPR hasta 1.5, sin antialias.
  - Equipo débil (`navigator.hardwareConcurrency <= 4` y celular) o sin WebGL: imagen fija `bg-fallback.webp`.
- [ ] **Reducir movimiento** (`prefers-reduced-motion`): sin Lenis, sin contador de carga y sin deriva de partículas. El fondo solo cambia con el scroll, sin animación propia.
- [ ] Generar `bg-fallback.webp` con una captura del demo en el estado D (esfera), a 1920 × 1080 y menos de 150 KB.

---

## 7. Bucle único e interacciones (`app.ts`)

Todo corre en **un solo `requestAnimationFrame`**: Lenis, progreso de scroll, fondo, indicador de fase, menú y cursor. Así nada se desincroniza.

### 7.1 Progreso de scroll

```ts
function scrollProgress(method: HTMLElement) {
  const stepH = (method.firstElementChild as HTMLElement).offsetHeight;
  const rel = (innerHeight / 2 - method.getBoundingClientRect().top) / stepH;
  return Math.max(0, Math.min(4, rel + 0.5));   // 1 = fase 1 centrada … 4 = fase 4 centrada
}
// Suavizado: pSmooth += (p - pSmooth) * 0.07  (sin suavizado si "reducir movimiento")
```

En páginas sin sección Método, usa `p = 4` fijo.

### 7.2 Bucle

```ts
const { createField } = await import('./particles');
const field = createField({ canvas, mobile, reduced });
const lenis = reduced ? null : new Lenis({ lerp: 0.09 });

function frame(time: number) {
  lenis?.raf(time);
  const p = method ? scrollProgress(method) : 4;
  pSmooth = reduced ? p : pSmooth + (p - pSmooth) * 0.07;
  updateHud(p);
  updateCursor();
  if (!lightCoversScreen && !document.hidden) field.render(time, pSmooth, mouse);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
addEventListener('resize', field.resize);
```

### 7.3 Menú que cambia de color

Usa un `IntersectionObserver` sobre las secciones `[data-theme-zone="light"]`. No calcules posiciones en cada frame.

```ts
const nav = document.querySelector('.nav')!;
const io = new IntersectionObserver(
  (entries) => entries.forEach((e) => e.isIntersecting && nav.classList.toggle('on-light', e.target.getAttribute('data-theme-zone') === 'light')),
  { rootMargin: '-44px 0px -95% 0px' }   // franja de 1 línea a la altura del menú
);
document.querySelectorAll('[data-theme-zone]').forEach((s) => io.observe(s));
```

Observa todas las zonas (oscuras y claras) para que el menú vuelva a blanco al salir de una zona clara.

### 7.4 Resto de interacciones (copiar del demo)

| Interacción | Detalle | Solo en |
|---|---|---|
| Contador de carga 000 → 100 | 1,2 s. Mostrarlo solo en la primera visita (`sessionStorage`) | Todas las pantallas |
| Entrada del título | Cada línea sube desde abajo, con 0,1 s entre líneas | Todas |
| Indicador de fase | "Fase 02 / 04 · Diseño" + barra de progreso | Escritorio |
| Cursor propio | Anillo con `mix-blend-mode: difference`. Oculto hasta que se mueva el mouse | Mouse (`pointer: fine`) |
| Botones magnéticos | Siguen al cursor un 25–35 % | Mouse |
| Filas de servicios | Barrido azul de izquierda a derecha al pasar el mouse | Mouse |
| Contadores | 0 → valor final al entrar en pantalla. El valor final está en el HTML | Todas |
| Copiar correo | `navigator.clipboard`; si falla, selecciona el texto | Todas |

Todas deben respetar `prefers-reduced-motion`.

---

## 8. Páginas

| Ruta ES | Ruta EN | Contenido |
|---|---|---|
| `/` | `/en/` | Igual que el demo |
| `/servicios` | `/en/services` | Los 8 servicios con más detalle: problema, entregables y enfoque |
| `/nosotros` | `/en/about` | Misión y visión, historia, fundadores y certificaciones |
| `/contacto` | `/en/contact` | Formulario, correo, WhatsApp y ubicación en Miraflores |
| `/privacidad` | `/en/privacy` | Política de privacidad (Ley 29733) |
| `/sector-publico` (opcional) | `/en/public-sector` | Contratación con el Estado, experiencia en SENCICO |

Revisar si aplica el **Libro de Reclamaciones virtual** (obligatorio si se atiende a consumidores).

---

## 9. Formulario de contacto

**Fase 1, sin backend (recomendada para el lanzamiento):**

1. Crear una cuenta en **Web3Forms** (o Formspree) con **hvarasg@gmail.com** y obtener la clave de acceso.
2. Guardar la clave en Vercel como variable de entorno `PUBLIC_WEB3FORMS_KEY`.
3. El formulario envía a `https://api.web3forms.com/submit` con `fetch`.
   - Mostrar "Enviando…" mientras envía.
   - Si funciona: "Gracias, te responderemos pronto".
   - Si falla: un mensaje claro con el correo como alternativa.
4. Campos: nombre, empresa, correo, teléfono (opcional), servicio de interés y mensaje. Agregar una casilla de aceptación de la política de privacidad.
5. Activar el captcha o el campo trampa (honeypot) del servicio.

**Fase 2, con dominio propio:** cambiar a **Resend** con un endpoint en Vercel (`src/pages/api/contact.ts` y el adaptador `@astrojs/vercel`). El correo sale desde `contacto@integriatech.pe`.

---

## 10. SEO y metadatos

En `Base.astro`, para cada página e idioma:

- `<title>` y `<meta name="description">` propios, desde los JSON de idioma
- `<html lang="es">` o `lang="en"`
- Open Graph: `og:title`, `og:description`, `og:image` (`/og-image.png`, 1200 × 630, fondo negro con la esfera y "IntegrIA") y `og:locale`
- `hreflang` (sección 5) y `<link rel="canonical">`
- Datos estructurados (JSON-LD):

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "ProfessionalService",
  "name": "IntegrIA Tech",
  "legalName": "INTEGRIA TECH S.A.C.",
  "url": "https://integriatech.pe",
  "email": "hvarasg@gmail.com",
  "address": { "@type": "PostalAddress", "addressLocality": "Miraflores", "addressRegion": "Lima", "addressCountry": "PE" },
  "areaServed": "PE",
  "knowsLanguage": ["es", "en"]
}
</script>
```

- `public/robots.txt` apuntando al sitemap

---

## 11. Despliegue en Vercel

1. Subir el proyecto a un repositorio de **GitHub**, privado o público.
2. En **vercel.com**, elegir *Add New → Project* e importar el repositorio. Vercel detecta Astro solo:
   - Build command: `npm run build`
   - Output directory: `dist`
3. En *Settings → Environment Variables*, agregar `PUBLIC_WEB3FORMS_KEY`.
4. Desplegar. Cada push a `main` publica el sitio, y cada rama o pull request genera una URL de preview para revisar antes.
5. **Dominio:**
   - Registrar `integriatech.pe`, o el que se elija, en un registrador de dominios .pe.
   - En *Settings → Domains*, agregar el dominio y copiar en el registrador los registros DNS que indica Vercel.
   - Vercel activa HTTPS automáticamente.
6. Opcional: activar **Vercel Analytics** y **Speed Insights** para medir visitas y velocidad real.
7. Cabeceras de seguridad en `vercel.json`:

```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" },
        { "key": "X-Frame-Options", "value": "DENY" },
        { "key": "Permissions-Policy", "value": "camera=(), microphone=(), geolocation=()" }
      ]
    }
  ]
}
```

Los archivos de `/_astro/` ya salen con nombre único y caché larga; no hace falta configurarlos.

---

## 12. Metas de calidad

| Métrica | Meta |
|---|---|
| Lighthouse móvil: Rendimiento | ≥ 90 |
| Lighthouse: Accesibilidad, Buenas prácticas, SEO | ≥ 95 |
| LCP (el título del inicio) | < 2 s en 4G |
| JavaScript inicial, sin `three` | < 30 KB gzip |
| Peso total del inicio | < 600 KB |
| Contraste de texto | WCAG AA en zonas oscuras y claras |

---

## 13. Checklist antes de lanzar

**Visual (comparar con el demo)**
- [ ] El logo dice Integr**IA**, con el "IA" en degradado sobre oscuro y en azul sobre blanco
- [ ] El fondo pasa por las 4 fases al hacer scroll por Método
- [ ] El menú cambia a texto oscuro sobre las secciones blancas y vuelve a blanco en Contacto
- [ ] Ningún título se corta ni genera scroll horizontal a 360 px de ancho
- [ ] Probado en Chrome, Safari (Mac y iPhone), Firefox y Edge

**Funcional**
- [ ] El selector ES / EN lleva a la página equivalente
- [ ] El formulario llega a hvarasg@gmail.com
- [ ] Con "reducir movimiento" activado, el sitio es estático y se lee bien
- [ ] Con WebGL desactivado, se ve la imagen de respaldo
- [ ] Se puede navegar todo con teclado y el foco es visible

**Contenido** (ver `website-content-plan.md`, sección 10)
- [ ] Fotos de Héctor y Gorky, en blanco y negro con tinte azul, en lugar de las iniciales
- [ ] Datos confirmados de Gorky
- [ ] RUC en el pie de página (cuando lo emita SUNAT)
- [ ] Certificación ITIL renovada, o quitada del sitio
- [ ] Política de privacidad publicada
- [ ] Quitar la etiqueta "DEMO" y el texto "contenido preliminar"

---

## 14. Trabajar con Claude Code

Para construir el sitio con Claude Code en este repositorio:

1. Copiar `demo/integria-demo.html`, `website-content-plan.md` y esta guía a una carpeta `docs/` del proyecto.
2. Crear un `CLAUDE.md` que diga: *"El diseño de referencia es `docs/integria-demo.html`. Sigue `docs/guia-desarrollo-web.md`. No cambies colores, tipografías ni el comportamiento del fondo sin pedirlo."*
3. Pedir el trabajo por partes, en este orden:
   1. Tokens y layout
   2. Fondo 3D
   3. Inicio
   4. Idiomas
   5. Páginas internas
   6. Formulario
   7. SEO
   8. Despliegue
4. Revisar cada parte en la URL de preview de Vercel antes de pasar a la siguiente.
