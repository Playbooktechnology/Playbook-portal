# El Marcador de Negocios y La cifra del día

Guía de operación de los dos módulos automatizados del sidebar de la portada.
Las secciones para agregar y destacar acuerdos llegan con el flujo semanal
(Fase 6 de `fix/marcador-v2-cifra`).

## De dónde salen los datos

Desde el 11 nov 2026 la fuente única es **`data/marcador.json`**: un objeto por
acuerdo, con el esquema de `lib/marcador-schema.ts`.

- `npm run marcador:validar` revisa el archivo. También corre antes de cada build:
  si hay un registro inválido, el deploy no sale y el error dice qué registro y
  qué campo hay que corregir.
- Solo se muestran y cuentan los registros con `cumple_criterio: true`.
- La pestaña Marcador de `/admin` ya no alimenta el sitio.
- Las decisiones de la migración y del backfill están en
  `docs/marcador/marcador-migracion-revision.md` y
  `docs/marcador/marcador-backfill-revision.md`.

## Qué pasa si no se actualizan

Ambos módulos se degradan solos, sin mostrar nada falso. Los umbrales viven en
`lib/freshness.ts`.

**El Marcador.** Si el acuerdo más reciente tiene más de **10 días**
(hora de México), el widget entra en *modo archivo*:

- muestra el título "El Marcador de Negocios" y el subtítulo "Los acuerdos de 2026";
- quita el número de semana y la tarjeta destacada;
- lista los 4 acuerdos más recientes con su fecha real y el enlace a `/marcador`.

En `/marcador`, la línea de semana cambia a "Último acuerdo registrado: [fecha]".

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
`cifra.visibleEnPortada` se ve si el bloque se está mostrando. La cifra sale de
la "Cifra clave:" declarada en el cuerpo de una nota o, si ninguna nota tiene
una, del titular (`lib/daily-figure.ts`). Para controlar cuál sale, declara la
Cifra clave en la nota.
