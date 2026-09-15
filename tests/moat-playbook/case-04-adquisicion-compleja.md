# Caso 4 — Adquisición compleja que mezcla equipo, real estate, media y otros activos

Escenario del prompt: "Debe detectar C si comprender el deal exige
reconstrucción." Entidades **ficticias**.

## Input (sintético)

> "Grupo Altamira" (conglomerado industrial) adquirió a los "Toros de
> Monterrey" (equipo de básquetbol de una liga de desarrollo ficticia) por
> un monto reportado de US$180 millones. El comunicado dice que el precio
> "incluye el equipo, el estadio y otros activos relacionados", sin
> desglosar. Reporteo adicional (fuentes del medio local "Cancha Regia")
> indica que el paquete incluye: el equipo en sí, el estadio (que Grupo
> Altamira ya rentaba parcialmente para eventos corporativos), 35% de la
> red de televisión regional que transmite los partidos, y la división de
> esports del equipo, que no genera ingresos significativos todavía.

## Step 0 — Overlap check

Sin cobertura previa de los Toros de Monterrey o Grupo Altamira.

## Step 0.5 — Editorial gate

```
DECISIÓN: PUBLICAR
RAZÓN: El precio reportado mezcla activos de naturaleza completamente
  distinta (equipo, real estate, participación en un medio, una unidad sin
  ingresos) bajo una sola cifra — eso es exactamente el tipo de historia
  que necesita reconstrucción, no una nota que repita el comunicado.
READER PERSONA PRIMARIO: Investor / Advisor
NECESIDAD DEL READER: entender qué está pagando realmente Grupo Altamira
  y por qué activo, para poder juzgar si el precio tiene sentido.
DELTA PLAYBOOK: descomponer el precio único en sus partes y estimar qué
  pesa cada una, algo que ni el comunicado ni el reporteo local hicieron.
EVIDENCIA DISPONIBLE: monto total confirmado por ambas partes; el desglose
  de qué incluye, reportado por Cancha Regia (nivel 02, de tercero).
DATOS / EVIDENCIA QUE FALTAN: el valor individual de cada componente —
  nadie lo ha confirmado, así que cualquier desglose que la pieza haga es
  una estimación (nivel 03), no un hecho.
```

## Step 3 — Router

```
FORMATO: C
RAZÓN: Entender el deal exige abrir números, actores y estructura: una
  cifra sola no dice si Grupo Altamira pagó de más por el equipo o si el
  precio real está en el estadio y el 35% del canal.
READER PERSONA PRIMARIO: Investor / Advisor
JOB-TO-BE-DONE: poder comparar esta adquisición con otras del mismo tipo
  sabiendo qué compró cada parte.
PREGUNTA CENTRAL: ¿qué pagó realmente Grupo Altamira, activo por activo, y
  qué le conviene del paquete?
DELTA PLAYBOOK ESPERADO: la reconstrucción del precio por componente y la
  lectura de qué activo es el que de verdad le interesa al comprador.
PALANCA DE NEGOCIO PRINCIPAL: captura de valor (¿dónde está el valor real
  del paquete?) e inventario comercial (el estadio como activo de eventos).
EVIDENCIA DISPONIBLE: como arriba.
DATOS QUE FALTAN: valor individual de cada componente.
```

## Draft (extracto — pieza completa correría ~800 palabras)

**Título:** Los Toros de Monterrey no se vendieron en US$180M, se vendieron en cuatro pedazos

**bodyMarkdown** (tier C, extracto de las secciones clave; en producción
llevaría 4-7 secciones completas):

```
Grupo Altamira compró a los Toros de Monterrey por US$180 millones. El
comunicado conjunto dice que el precio "incluye el equipo, el estadio y
otros activos relacionados" — una frase que junta cuatro negocios distintos
bajo una sola cifra.

## El equipo es la parte más fácil de valuar y probablemente la más barata

Comparables recientes de equipos de ligas de desarrollo similares se han
transado entre US$40M y US$70M sin activos inmobiliarios ni de medios
incluidos. Si el equipo por sí solo vale, digamos, US$55M dentro de ese
rango, quedan US$125M repartidos entre estadio, canal y esports — y ahí es
donde el precio deja de ser sobre básquetbol.

## El estadio es el activo que Grupo Altamira ya quería

Grupo Altamira rentaba parcialmente el estadio para eventos corporativos
antes de esta compra. Convertirse en dueño en vez de arrendatario elimina un
costo recurrente y le da control total del calendario del recinto —
conciertos, convenciones, el uso que Grupo Altamira ya hacía y ahora no
paga por hacer. Esa es una lectura de real estate, no de deporte.

## El 35% del canal regional es la pieza que cambia el negocio, no el equipo

Un 35% de una televisora regional no es control, pero sí es suficiente para
sentarse en decisiones sobre contenido y ventana de transmisión. Para un
conglomerado con otros negocios de consumo en la región, tener un pie en la
mesa de contenidos deportivos locales vale más como plataforma de
distribución para otras marcas del grupo que como inversión en el canal en
sí mismo.

## La división de esports es la parte que no se está pagando por lo que hace hoy

La unidad de esports no genera ingresos significativos. Su valor en este
paquete es opcionalidad: si el negocio crece, Grupo Altamira ya tiene el
vehículo; si no, es la parte más fácil de cerrar o vender sin afectar el
resto de la operación.

**Opinión de Playbook:** El titular dice que Grupo Altamira compró un
equipo de básquetbol. Lo que en realidad compró es control de un estadio
que ya usaba, un asiento en la mesa de un canal regional y una opción
barata sobre esports — el equipo es el empaque, no el contenido del
paquete. Eso importa para cualquiera que lea el próximo deal similar en la
región con la misma frase de "el equipo, el estadio y otros activos": el
desglose, no el titular, es donde está el negocio.
```

## Moat Check

```
4. Delta Playbook: SÍ — la reconstrucción del precio en cuatro componentes,
   ausente tanto del comunicado como del reporteo local. GATE: pasa.
5. ¿Un nivel después del headline? SÍ, varios niveles: descompone una
   cifra en cuatro negocios distintos. GATE: pasa.
6. ¿Respaldado por evidencia? El monto total y qué incluye son nivel 01/02;
   el desglose por componente está marcado explícitamente como estimación
   ("si el equipo vale, digamos, US$55M") — nivel 03, nunca presentado como
   cifra confirmada. GATE: pasa porque la incertidumbre es explícita, no
   escondida detrás de lenguaje seguro.
7. Formato correcto: C — reconstruir el precio exige abrir comparables,
   estructura de activos y quién se beneficia de cada uno; no cabe en un
   brief.
8. Longitud corresponde al valor: sí, en su versión completa (~800 palabras
   dentro de 700-1200).
9. Algo memorable: "no se vendieron en US$180M, se vendieron en cuatro
   pedazos" es reutilizable como marco para leer deals similares.
10. ¿Sobreviviría sin el nombre Playbook? No — el comunicado y la nota
    local ya existen; lo que agrega esta pieza es precisamente la
    reconstrucción que ninguna de las dos fuentes hizo.

CALIFICACIÓN: APROBADO
```

## check-format-tier.ts (simulado, sobre la pieza completa de ~800 palabras)

```
✓ Los Toros de Monterrey no se vendieron en US$180M, se vendieron en cuatro pedazos [C]
   ~800 palabras · Opinión sí (1 párrafo)
```

## Resultado esperado vs. obtenido

Esperado: C, por necesidad de reconstrucción. **Obtenido: coincide.**
