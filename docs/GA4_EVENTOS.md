# Eventos de GA4 — cómo verificarlos y marcarlos como clave

Bloque de medición del 27 oct 2026 (acción A1). Todos los eventos salen de
`lib/analytics-events.ts` (`trackEvent`), que llama al `gtag` que ya carga
`components/analytics/GoogleAnalytics.tsx`. No se agregó ningún script nuevo
ni otra propiedad de GA4.

**Consentimiento.** El modelo del sitio (`lib/consent.ts`, LFPDPPP) trata la
analítica agregada como siempre activa y solo pide permiso para publicidad.
Estos eventos son analítica agregada: viajan por el mismo `gtag` que la
`page_view` y respetan exactamente esa misma regla. No mandan correo, nombre
ni nada que identifique a la persona.

## Eventos

| Evento | Cuándo se dispara | Parámetros |
|---|---|---|
| `newsletter_signup` | Envío válido de un formulario de newsletter, o clic en "Suscríbete gratis" del encabezado (abre Substack) | `placement`: `header`, `sidebar`, `nota`, `franja`, `marcador`, `edicion` (y `hub` en /coberturas); `product` |
| `share_click` | Clic en WhatsApp, Facebook, X, LinkedIn o "Copiar enlace" | `network`: `whatsapp`, `facebook`, `x`, `linkedin`, `copy`; `placement`: `nota` o `playmaker`; `product` |
| `video_click` | Clic en un video del módulo de video de portada | `item_id` (id de YouTube), `position`, `link_text` |
| `marcador_filter` | Cambio de filtro en la tabla de /marcador (búsqueda: al salir del campo) | `filter`: `type`, `country`, `sport`, `period`, `query`, `limpiar`; `value` |
| `related_click` | Clic en "Sigue leyendo" o "Siguiente expediente" al pie de una nota | `item_id` (id de la nota destino), `position`, `link_text`, `product` |
| `outbound_substack` | Cualquier enlace que sale a `*.substack.com` | `link_url`, `link_host`, `product` |
| `studio_lead` | Mensaje enviado con éxito desde `/contacto?motivo=studio`, o clic en un enlace marcado `data-analytics="studio_lead"` | `placement` |

`placement` de `newsletter_signup`:
- `sidebar` — módulo del riel de portada (antes `home-sidebar`).
- `franja` — banda de portada editable en el CMS (antes `mid-cta`).
- `nota` — módulo a mitad de una nota de Noticias (antes `article-mid`).
- `edicion` — el mismo módulo dentro de una edición de La Lana, TFBR o Infinitas.
- `marcador`, `header`, `hub` — su página o botón.

Los valores viejos (`home-sidebar`, `mid-cta`, `article-mid`) siguen en el
histórico de GA4 hasta el 27 oct; desde el deploy se reportan con los nuevos.

Se conservan sin cambios todos los `hp_click_*`, `hp_newsletter_submit`,
`scroll_depth`, `article_read_complete`, `outbound_click`, `tag_nav_click`,
`hub_visit`, `product_hub_visit` y `email_wall_*`.

## Verificarlos en DebugView

1. Instala la extensión **Google Analytics Debugger** en Chrome y actívala
   (el ícono se pone en "ON").
2. En GA4: **Administrar → Visualización de datos → DebugView**.
3. Abre el preview de Vercel (o playbook.la) en esa misma ventana de Chrome.
   Tu dispositivo aparece en "Dispositivo de depuración" en menos de un minuto.
4. Provoca cada evento:
   - `newsletter_signup`: escribe un correo válido en el módulo del riel →
     placement `sidebar`; en una nota → `nota`; en una edición de La Lana →
     `edicion`; botón del encabezado → `header`.
   - `share_click`: al pie de cualquier nota, clic en cada red.
   - `video_click`: portada, módulo "Lo último en video", clic en un video.
   - `marcador_filter`: /marcador, cambia Tipo, País, Periodo, busca algo.
   - `related_click`: al pie de una nota, clic en una de "Sigue leyendo".
   - `outbound_substack`: clic en cualquier enlace a Substack (pie de página).
   - `studio_lead`: envía el formulario desde `/contacto?motivo=studio`.
5. Haz clic en el evento dentro de la línea de tiempo para ver sus parámetros.

En la consola del navegador también puedes confirmar el envío:
`dataLayer.filter(e => e[0] === 'event').map(e => e[1])`.

## Marcarlos como eventos clave

Un evento solo aparece en la lista después de recibirse al menos una vez (o de
crearlo a mano). Recomendación: marca como clave `newsletter_signup` y
`studio_lead` (conversiones reales). `share_click`, `related_click`,
`video_click` y `outbound_substack` son mejor como eventos normales: miden
comportamiento, no conversión, y marcarlos inflaría el conteo de conversiones.

1. **Administrar → Visualización de datos → Eventos clave → Nuevo evento clave**.
2. Escribe el nombre exacto (`newsletter_signup`) y guarda. Repite con `studio_lead`.
3. Para poder filtrar por parámetro en informes, registra las dimensiones
   personalizadas: **Administrar → Definiciones personalizadas → Crear
   dimensión personalizada**, alcance *Evento*, con estos parámetros:
   `placement`, `network`, `filter`, `item_id`, `position`, `product`
   (los que ya existan no hace falta repetirlos).

Las dimensiones solo cuentan desde que se crean; no son retroactivas.
