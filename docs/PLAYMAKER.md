# Playmaker — cómo se publica un perfil

Sección semanal (jueves). Primer perfil: jueves 5 nov 2026. Código en
`lib/playmaker/` y `app/(public)/playmaker/`.

## Cada semana

1. Retrato vertical 4:5 (mínimo 1080×1350, JPG) en
   `public/assets/playmaker/<slug>.jpg`.
2. Una entrada nueva en `lib/playmaker/profiles.ts` (copia la de muestra):
   nombre, cargo, organización, ficha (en el cargo desde, mandato, cargo
   anterior), bajada, cuerpo (un párrafo por elemento), 2-3 frases citables,
   `publishedAt` con la fecha del jueves (YYYY-MM-DD).
3. PR → revisar en el preview de Vercel (ahí se ven también borradores y
   fechas futuras) → merge. El perfil aparece solo el jueves, sin otro deploy.

El build falla si el texto del perfil menciona al patrocinador: la regla de la
sección es no nombrar la marca dentro de la nota.

## Imágenes para compartir (automáticas)

- `/playmaker/<slug>/opengraph-image` — 1200×627, la que toman LinkedIn, X,
  WhatsApp y Facebook al pegar el enlace.
- `/playmaker/<slug>/vertical` — 1080×1350 para subir a LinkedIn o Instagram;
  el perfil tiene un enlace para descargarla.

Ambas llevan el retrato con marco, nombre, cargo y el sello pequeño.

## Pendientes de entrega (configuración en `lib/playmaker/config.ts`)

- **Marco** (Majo): PNG transparente 4:5 → `public/assets/playmaker/marco.png`
  y `frame: '/assets/playmaker/marco.png'`. Mientras tanto, doble filete verde.
- **Logotipo de Range Rover**: SVG o PNG → `public/assets/playmaker/` y
  `sponsor.logo`. Se muestra siempre en monocromo.
- **Logotipo de la sección** (opcional) → `logo`.
- **Nombre final** de la sección → `name` (la ruta /playmaker no cambia).
- Borrar el perfil de muestra (`perfil-de-muestra`) al cargar el primero real.
