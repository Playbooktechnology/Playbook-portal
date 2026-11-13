# El Marcador de Negocios y La cifra del día

Esta es la guía de operación de los dos módulos automatizados del sidebar de la
portada. Explica cómo se carga un acuerdo, cómo se marca el destacado de la
semana, qué pasa si no actualizas y cómo revisar La cifra del día.

## La rutina semanal (unos dos minutos)

Hazla una vez por semana, idealmente el viernes.

1. **Ver qué detectó la automatización.**

   ```bash
   npm run marcador:pendientes
   ```

   Lista las notas de acuerdos publicadas que todavía no están en el Marcador.
   Junto a cada una aparece el comando para agregarla.

2. **Agregar cada acuerdo.** Hazlo con una nota a la vez:

   ```bash
   npm run marcador:add -- https://www.playbook.la/articulo/<nota>
   ```

   - El comando lee la nota y te propone cada campo.
   - **Enter** acepta lo que aparece entre corchetes y `-` deja el campo vacío.
   - Para el monto, te muestra las frases de la nota que traen una cifra: eliges
     el número de la frase y esa frase queda guardada, literal, como fuente.
   - Si la cifra está en otra moneda, la convierte con el tipo de cambio del BCE
     del día del anuncio.
   - Al final te muestra el registro completo y solo lo escribe si contestas `s`.

   Si una nota de la lista **no es un acuerdo**, descártala para que no vuelva a
   salir:

   ```bash
   npm run marcador:pendientes -- --descartar <url> "<motivo>"
   ```

3. **Elegir el destacado de la semana** y guardar su lectura aprobada:

   ```bash
   npm run marcador:destacado -- <id> "<lectura aprobada>"
   ```

   - El `id` aparece al agregar el acuerdo, o búscalo en `data/marcador.json`.
   - Sin el texto entre comillas, solo lo marca como destacado y la tarjeta sale
     sin el bloque de lectura.
   - Si otro acuerdo de la misma semana era el destacado, deja de serlo.
   - El destacado se queda arriba hasta que marques uno nuevo, aunque cambie la
     semana. Mientras sea de una semana anterior, la etiqueta dice
     "Acuerdo de la semana 45" en lugar de "Acuerdo de la semana".
   - Si nunca se marcó ninguno, el widget elige solo: México primero, luego
     Latam, luego el mayor monto revelado de la semana.

4. **Publicar.** Haz commit de `data/marcador.json` (y de
   `data/marcador-descartadas.json`, si descartaste algo) y súbelo a `main`.
   Vercel despliega en unos dos minutos. Antes del build se valida el archivo:
   si algo está mal, el deploy no sale y el error dice qué registro y qué campo
   hay que corregir.

Para revisar sin escribir nada, agrega `--dry-run` al comando `marcador:add`.

### Si prefieres revisar en tanda

```bash
npm run marcador:pendientes -- --importar
npm run marcador:aprobar
npm run marcador:aprobar -- <id>
npm run marcador:aprobar -- <id> --rechazar
```

- `--importar` agrega todo lo detectado como **propuestas**
  (`cumple_criterio: null`). Las propuestas no se muestran ni cuentan.
- `marcador:aprobar` sin argumentos lista las propuestas pendientes.
- `marcador:aprobar -- <id>` revisa una propuesta campo por campo, con el mismo
  flujo que `marcador:add`, y la aprueba.
- `--rechazar` la conserva con `cumple_criterio: false`: se queda en el archivo,
  pero no se muestra.

`--importar` no importa las notas cuyo título no deja claras las partes. Esas
aparecen listadas al final para que las agregues con `marcador:add`.

### Antes de empezar

- Instala las dependencias con `npm ci` y define `POSTGRES_URL` (la misma de
  `.env.local`). `marcador:add`, `marcador:pendientes` y `marcador:aprobar` leen
  las notas de la base en modo solo lectura. `marcador:destacado` y
  `marcador:validar` no necesitan la base.
- Si no quieres usar la terminal, pídele a Claude Code que corra la rutina y te
  muestre cada registro antes de guardarlo.

## De dónde salen los datos

Desde el 11 nov 2026 la fuente única es **`data/marcador.json`**: un objeto por
acuerdo, con el esquema de `lib/marcador-schema.ts`.

- Solo se muestran y cuentan los registros con `cumple_criterio: true`. Los que
  tienen `false` (no entran) o `null` (propuestas) se quedan en el archivo.
- `npm run marcador:validar` revisa el archivo. También corre antes de cada build.
- `data/marcador-descartadas.json` guarda las notas que se revisaron y no son
  acuerdo, con su motivo, para que `marcador:pendientes` no las vuelva a mostrar.
- **La automatización.** Al publicar una nota de Patrocinios, Naming Rights,
  Inversiones, Derechos de TV o Infraestructura, el sistema propone un borrador
  en la tabla `deal_drafts`, igual que antes. Eso es lo que lee
  `marcador:pendientes`. La automatización nunca escribe en el Marcador: solo
  propone.
- La pestaña Marcador de `/admin` ya no alimenta el sitio.
- Las decisiones de la migración y del backfill están en
  `docs/marcador/marcador-migracion-revision.md` y
  `docs/marcador/marcador-backfill-revision.md`.

### Campos de cada acuerdo

| Campo | Qué va |
|---|---|
| `id` | `AAAA-MM-DD-slug`; lo genera `marcador:add` |
| `fecha` | Día del anuncio |
| `titulo`, `partes` | "Fox × Roku" y las partes completas |
| `tipo` | patrocinio, derechos, propiedad, retail o infraestructura |
| `alcance` | mexico, latam, eeuu, europa o global (la regla está en la metodología de `/marcador`) |
| `pais`, `deporte`, `duracion` | ISO de dos letras; deporte en minúsculas con guiones; duración en texto o `null` |
| `monto_usd_m` | Millones de dólares, o `null` |
| `monto_tipo` | revelado, reportado, estimado o nr. Solo los **revelados** se suman |
| `fuente_monto` | La frase literal de la nota y la conversión del BCE; es obligatoria si hay monto |
| `estatus` | anunciado, reportado, confirmado o cerrado |
| `dato_hero` | La cifra grande del destacado cuando no hay monto (por ejemplo, "140+ tiendas"). Nunca "N/R" |
| `resumen` | Máximo 35 palabras si el acuerdo será destacado |
| `lectura` | Lectura Playbook **aprobada**: es lo único que se publica |
| `lectura_borrador` | Borrador de la lectura: nunca se muestra |
| `destacado_semana` | El acuerdo de la semana; uno por semana como máximo |
| `cumple_criterio` | `true` se muestra; `false` no entra; `null` es una propuesta |

## Qué pasa si no se actualizan

Ambos módulos se degradan solos, sin mostrar nada falso. Los umbrales viven en
`lib/freshness.ts`.

**El Marcador.** Si el acuerdo más reciente tiene más de **10 días** (hora de
México), el widget entra en *modo archivo*:

- muestra el título "El Marcador de Negocios" y el subtítulo "Los acuerdos de 2026";
- quita el número de semana, el score y la tarjeta destacada;
- lista los 4 acuerdos más recientes con su fecha real y el enlace a `/marcador`.

En `/marcador`, la línea de semana cambia a "Último acuerdo registrado: [fecha]".
Mientras no pasan esos 10 días, el widget muestra la semana más reciente con
acuerdos. Un lunes sin nada cargado todavía muestra la semana anterior.

**La cifra del día.** Se elige entre las notas de los últimos **3 días**:

- Si la nota de la cifra es de hoy, el encabezado dice "La cifra del día".
- Si es de ayer o de antes, dice "La cifra".
- En los dos casos aparece la fecha de la cifra a la derecha.
- Si ninguna nota de los últimos 3 días tiene cifra, el bloque se oculta.

## La alerta diaria

`.github/workflows/alerta-frescura.yml` corre todos los días a las **8:00 de
México** y lee `https://www.playbook.la/api/salud/portada`. Si algún módulo pasó
su umbral, o si el endpoint no responde, abre el issue
**`[Alerta] Marcador / Cifra del día desactualizado`** con el módulo afectado,
desde cuándo y el último dato. Si el issue ya está abierto:

- lo actualiza sin duplicarlo;
- solo comenta, y por lo tanto notifica, cuando cambia lo que está mal;
- lo cierra solo cuando todo vuelve a estar al día.

Para correrla a mano, ve a GitHub, abre Actions → "Alerta de frescura" → Run workflow.

## Cómo revisar La cifra del día

```bash
curl -s https://www.playbook.la/api/salud/portada
```

En `cifra.ultima` vienen la cifra, su fecha, la nota y el enlace. En
`cifra.visibleEnPortada` se ve si el bloque se está mostrando.

La cifra sale de la "Cifra clave:" declarada en el cuerpo de una nota o, si
ninguna nota tiene una, del titular (`lib/daily-figure.ts`). Para controlar cuál
sale, declara la Cifra clave en la nota.
