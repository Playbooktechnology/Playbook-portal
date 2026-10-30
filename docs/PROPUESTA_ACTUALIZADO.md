# Propuesta: "Actualizado" solo por cambio de fondo (A4, pendiente de aprobar)

**Estado:** aprobado el 27 oct 2026 e implementado en su propia rama
(`claude/articulo-actualizado`), con la migración `0015`. Diferencia con lo
propuesto abajo: no hay casilla aparte. Escribir un texto nuevo o distinto en
"Actualización de fondo" es la marca, y la hora se registra en ese guardado;
vaciarlo quita "Actualizado". El SQL real usa `ADD COLUMN IF NOT EXISTS`.

## Por qué hace falta un campo

`articles.updated_at` se mueve con **cada** guardado en el CMS, incluida una
coma corregida. Usarlo para "Actualizado" haría que casi toda nota diga
"Actualizado" y le diría a Google (`dateModified`) que hubo un cambio de fondo
cuando no lo hubo. Ningún campo actual distingue un cambio de fondo de una
corrección menor.

## Qué se agregaría

```sql
-- drizzle/0013_article_substantive_update.sql
ALTER TABLE "articles" ADD COLUMN "substantive_update_at" timestamp with time zone;
ALTER TABLE "articles" ADD COLUMN "substantive_update_note" text;
```

Dos columnas nuevas, ambas opcionales (NULL por defecto). No se renombra ni
borra nada; las notas publicadas no cambian.

- **CMS** (`components/admin/tabs/ArticlesTab.tsx` + `lib/actions/admin.ts`):
  una casilla "Cambio de fondo" junto a Guardar, y un campo corto "Qué
  cambió". Marcada, el guardado escribe `substantive_update_at = now()`.
  Sin marcar, nada cambia (correcciones menores).
- **Nota**: debajo de "Publicado …", la línea "Actualizado 28 oct 2026,
  14:05" solo cuando `substantive_update_at` existe, con la nota de qué
  cambió si se escribió.
- **Marcado estructurado**: `dateModified` = `substantive_update_at` si
  existe; si no, igual a `datePublished` (lo que ya hace esta rama).

## Cómo se aplica

PR aparte, solo con la migración y estos tres cambios. Se aplica en producción
por `scripts/predeploy-migrate.ts` al mergear (los preview no migran, así que
el preview de ese PR debe apuntar a una base con la migración ya aplicada, o
revisarse localmente).
