# Propuesta: etiqueta de país para contar México / LATAM (A10)

**Estado:** propuesta, no implementada. Toca la taxonomía editorial
(`lib/taxonomy.ts` y `.claude/playbook-editorial/fields-and-taxonomy.md`), así
que necesita tu OK antes de cambiar.

## Qué hay hoy

La única etiqueta geográfica es **Alcance** (`articles.tags_scope`), con dos
valores: `Nacional` (= México) e `Internacional`. Una nota de Brasil y una de
la Premier League son igual de "Internacional". Por eso la vista
`/admin/mezcla` cuenta México con la etiqueta, pero LATAM lo **estima** por
palabras (países, torneos, clubes) en titular y bajada.

En el snapshot del 22 oct: 347 notas solo Internacional, 62 solo Nacional,
45 con ambas.

## Propuesta

Agregar un tercer valor a Alcance: **`Latinoamérica`**.

- Sin cambio de esquema: `tags_scope` ya es `text[]`; es un valor más en
  `SCOPE_OPTIONS` (`lib/taxonomy.ts`) y en el documento de taxonomía.
- Regla: `Nacional` si la nota es de México o tiene un actor mexicano
  central; `Latinoamérica` si es de otro país de la región; `Internacional`
  para el resto. Una nota puede llevar dos (p. ej. Nacional + Latinoamérica).
- Etiquetado retroactivo: un script de solo lectura propone `Latinoamérica`
  para las notas que hoy marca el estimador de `lib/home-mix.ts`; lo revisas y
  se aplica en lote con `--dry-run` primero (mismo patrón que
  `scripts/publish-newsletter.ts`).
- Las skills de publicación ya validan contra `TAXONOMY`, así que el nuevo
  valor queda disponible para el pipeline sin otro cambio.

Con eso `/admin/mezcla` deja de estimar: cambia `mixKind()` para leer la
etiqueta y se quita la expresión regular.
