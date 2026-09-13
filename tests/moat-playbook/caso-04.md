# Caso 4 — Adquisición compleja (equipo + real estate + media + otros activos)

**Qué valida:** el router debe detectar C cuando comprender el deal exige
reconstrucción de estructura y no solo repetir el precio. Dry-run.

---

## INPUT (sintético)

> Un grupo inversionista compra una franquicia de la NBL (liga ficticia de
> básquetbol) por "US$1,400 millones", cifra que el comunicado presenta
> como "el precio del equipo". Investigando el prospecto de la operación
> (research, `ingestion.md`), Playbook encuentra que la cifra en realidad
> se reparte así: US$620M por el equipo en sí, US$540M por el arena y el
> terreno adyacente (desarrollo inmobiliario incluido), US$180M por los
> derechos de media regional a 10 años, y US$60M por la marca de esports
> asociada. El comunicado no desglosa nada de esto.

## GATE

```
DECISIÓN: PUBLICAR
RAZÓN: Operación de alto valor cuyo precio publicado esconde una estructura
  de cuatro activos distintos — entenderla exige abrir la caja, no repetir
  el titular.
READER PERSONA PRIMARIO: Investor / Advisor
NECESIDAD DEL READER: Saber qué realmente compró el grupo y cuánto vale
  cada pieza, no solo el número grande.
DELTA PLAYBOOK: El desglose de los US$1,400M en sus cuatro componentes,
  ausente del comunicado.
EVIDENCIA DISPONIBLE: Prospecto de la operación (01, documento primario),
  comunicado del grupo comprador (01).
DATOS / EVIDENCIA QUE FALTAN: Términos exactos del contrato de media (solo
  se conoce el monto agregado, no el desglose por temporada).
```

## ROUTER

```
FORMATO: C
RAZÓN: Comprender el deal exige abrir número por número: el precio
  publicado mezcla equipo, real estate, media y marca de esports, y
  ninguna fuente lo desglosa. Eso es exactamente la prueba de C en
  format-tiers.md §1 — reconstrucción de estructura, no una cifra que se
  reporta y ya.
READER PERSONA PRIMARIO: Investor / Advisor
JOB-TO-BE-DONE: Entender qué compró realmente el grupo y qué riesgo carga
  cada pieza del precio.
PREGUNTA CENTRAL: ¿Qué compró el grupo por US$1,400 millones, y qué tan
  caro pagó por el equipo en sí frente al resto?
DELTA PLAYBOOK ESPERADO: El desglose de las cuatro piezas y qué precedente
  de valuación tiene cada una por separado.
PALANCA DE NEGOCIO PRINCIPAL: Captura de valor (palanca 2).
EVIDENCIA DISPONIBLE: prospecto de la operación, comunicado.
DATOS QUE FALTAN: desglose del contrato de media por temporada.
```

## DRAFT (bodyMarkdown — resumen estructurado, 700-1200 palabras en producción real)

**Apertura (2-3 párrafos):** el titular de US$1,400 millones y la tensión —
ese número no es el precio del equipo.

**## Cuatro precios en uno** — desglose: US$620M equipo / US$540M arena y
terreno / US$180M media / US$60M esports. Cada cifra puesta contra un
comparable reciente de su categoría (venta de equipo comparable, venta de
arena comparable, deal de media comparable).

**## Lo que el arena en realidad vale** — por qué el desarrollo
inmobiliario adyacente (no solo el edificio) es la pieza que más eleva el
precio total, y qué precedente tiene esa estructura en otras ventas de
franquicias recientes.

**## El riesgo que carga cada pieza** — el equipo tiene el riesgo
deportivo/competitivo; el real estate tiene riesgo de desarrollo y
permisos; el contrato de media tiene riesgo de renovación en 10 años.

**## Por qué el grupo estructuró la compra así** — Ecuación/Reparto device
posible aquí (`dynamic-element-library.md`), mostrando qué fracción del
precio total representa cada pieza.

`**Opinión de Playbook:**` Pagar US$620M por el equipo, dentro del rango de
comparables recientes de la liga, es la parte menos interesante de esta
operación. Los otros US$780M son una apuesta inmobiliaria y de medios con
un perfil de riesgo completamente distinto al deportivo — y es ahí donde el
grupo puede ganar o perder más que en la cancha.

*(Estructura completa de C: 4-7 secciones `##`, cada una respondiendo una
parte de la pregunta central, 2-4 devices, Opinión de una sola vez al
final, per `format-tiers.md` §3b.)*

## MOAT CHECK

4. Delta (**gate**): sí — el desglose de los cuatro componentes, que ningún
   comunicado ofrece.
5. ¿Un nivel más allá del headline? (**gate**): sí — el headline dice
   "US$1,400M por el equipo"; la pieza demuestra que eso es falso.
6. ¿Evidenciado? (**gate**): sí — el prospecto de la operación es un
   documento primario, no una estimación.
7. ¿A/B/C correcto? Sí — sin el desglose, un lector nunca entendería el
   verdadero precio del equipo; eso exige C, no una B más larga.

**Calificación: APROBADO.**

## Verificación

- El router resistió la tentación de tratar esto como "B larga": el propio
  `format-tiers.md` §1 marca justo este patrón (mecanismo + dinero +
  precedente) como la señal de que la historia pide C, no un brief inflado.
- El rango de palabras objetivo para C es 700-1200 — verificable con
  `check-tier-length.mjs` sobre el draft completo una vez redactado en una
  corrida real.
