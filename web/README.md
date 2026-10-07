# Sitio web IntegrIA Tech

Sitio estático (HTML, CSS y JavaScript) listo para publicar en **Vercel**. No necesita compilación ni `npm install`.

## Contenido

```
web/
├── index.html, servicios.html, nosotros.html, contacto.html, privacidad.html   ← español
├── en/  index.html, services.html, about.html, contact.html, privacy.html        ← inglés
├── 404.html
├── assets/
│   ├── css/styles.css          estilos y colores
│   ├── js/app.js               scroll suave, menú, cursor, formulario, indicador de fase
│   ├── js/particles.js         fondo 3D de partículas
│   ├── vendor/                 three.js r169 y Lenis (copias locales)
│   └── fonts/                  Geist e IBM Plex Mono (copias locales)
├── favicon.svg, og-image.png   ícono e imagen para redes sociales
├── robots.txt, sitemap.xml
└── vercel.json                 URLs limpias (/servicios), caché y cabeceras de seguridad
```

## Publicar en Vercel

### Opción A: desde la terminal (la más rápida)
1. Instalar Node.js (https://nodejs.org) y luego: `npm i -g vercel`
2. Dentro de esta carpeta `web/`: `vercel` y seguir las preguntas. Es un proyecto nuevo, sin framework ("Other"), sin comando de build.
3. Para publicar en producción: `vercel --prod`

### Opción B: desde GitHub (recomendada a largo plazo)
1. Subir la carpeta `web/` a un repositorio de GitHub.
2. En vercel.com → *Add New → Project* → importar el repositorio.
3. Framework preset: **Other**. Build command: vacío. Output directory: `.` (o la carpeta `web` si el repo contiene más cosas, en *Root Directory*).
4. Cada cambio que se suba a `main` se publica solo, y cada rama genera una URL de prueba.

### Dominio: integriatec.com (registrado en Cloudflare)

El dominio ya está comprado en Cloudflare. Para que apunte al sitio en Vercel:

**En Vercel**
1. Abrir el proyecto → *Settings → Domains* → *Add*.
2. Agregar `integriatec.com` y también `www.integriatec.com`. Marcar `integriatec.com` como principal para que `www` redirija a él.
3. Vercel mostrará los registros DNS que necesita (normalmente los dos de abajo).

**En Cloudflare** (dash.cloudflare.com → integriatec.com → *DNS → Records*)

| Tipo | Nombre | Contenido | Proxy |
|---|---|---|---|
| A | `@` | `76.76.21.21` | **Desactivado** (nube gris, "DNS only") |
| CNAME | `www` | `cname.vercel-dns.com` | **Desactivado** (nube gris, "DNS only") |

- Si Cloudflare creó registros A o CNAME por defecto para `@` o `www`, borrarlos antes de agregar estos.
- Dejar el proxy **desactivado**: con la nube naranja, Vercel no puede emitir el certificado y el sitio puede mostrar errores de SSL o bucles de redirección. Vercel ya incluye HTTPS y CDN.
- Si Vercel muestra valores distintos a los de la tabla, usar los que indique Vercel.

**Comprobar**
- En Vercel, el dominio pasa a "Valid Configuration" en unos minutos (hasta 1 hora si el DNS tarda).
- El certificado HTTPS se emite solo.
- Probar `https://integriatec.com`, `https://www.integriatec.com` y `https://integriatec.com/en/`.

**Si el dominio final cambia**, buscar y reemplazar `https://integriatec.com` en todos los `.html`, `sitemap.xml` y `robots.txt`.

## Formulario de contacto

Hoy, sin configurar nada, el botón *Enviar* abre el programa de correo del visitante con el mensaje armado para **hvarasg@gmail.com**.

Para que el mensaje llegue directo sin abrir el correo:
1. Crear una clave gratuita en https://web3forms.com con el correo hvarasg@gmail.com.
2. Pegar la clave en el atributo `data-key=""` del formulario, en `contacto.html` y en `en/contact.html`.

## Probar en local

Abrir los `.html` con doble clic no funciona, porque las rutas empiezan con `/`. Usar un servidor:
- Con Node: `npx serve .` dentro de `web/`
- Con Python: `python -m http.server` dentro de `web/`
- Con Vercel: `vercel dev`

## Cambiar textos

Los textos están directamente en cada `.html`. Si se cambia un texto en español, hay que cambiar también su versión en inglés (`en/`).
- Español: trato de **usted**
- Inglés: inglés estadounidense

## Pendientes antes de lanzar

**Datos que deben confirmar los socios** (hoy el sitio no los afirma o los dice de forma prudente):
- [ ] Gorky: cargo exacto y nombre de la empresa de certificados de salud, título y universidad, foto
- [ ] Héctor: que "participa directamente en cada proyecto" (Nosotros, compromiso 02) sea un compromiso real
- [ ] Nombre legal exacto de "Financiera Daewoo S.A." y la mención exacta del MBA
- [ ] Atención en inglés (se menciona en Contacto)
- [ ] Plazo de conservación de datos (Privacidad: "hasta dos años")
- [ ] ITIL: renovar la certificación. Hoy el sitio solo dice "basado en ITIL" y "Marco de referencia: ITIL 4"; no la presenta como certificación vigente.

**Antes de publicar:**
- [ ] Revisión legal de `privacidad.html` y `en/privacy.html` (y si corresponde inscribir el banco de datos ante la ANPD)
- [ ] Revisar si aplica el Libro de Reclamaciones virtual
- [ ] Fotos de los socios: reemplazar `<span class="ini">HV</span>` por `<img src="/assets/img/hector.jpg" alt="">` dentro de `.portrait` (el estilo ya las pasa a blanco y negro)
- [ ] RUC en el pie de página, cuando lo emita SUNAT
- [ ] Correo con dominio propio (contacto@…) en lugar de Gmail
- [ ] Inscripción en el RNP antes de anunciar participación en licitaciones
