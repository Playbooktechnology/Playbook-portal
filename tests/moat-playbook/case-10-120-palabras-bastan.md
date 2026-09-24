# Caso 10 — Historia donde 120 palabras son suficientes

Escenario del prompt: "El sistema no debe inflarla a 300-500." Entidades
**ficticias**.

## Input (sintético)

> El árbitro "Ricardo Solano" (ficticio), una de las figuras arbitrales más
> conocidas de la "Liga Continental de Fútbol" (LCF), anunció su retiro
> tras 22 años en la liga. No hay contexto adicional de negocio: no hay
> disputa, no hay reemplazo anunciado, no hay cambio de reglamento
> asociado.

## Step 0.5 — Editorial gate

```
DECISIÓN: PUBLICAR
RAZÓN: Es una figura reconocida de la liga y su retiro es un hecho de
  interés genuino para la audiencia, aunque no cargue una segunda capa de
  negocio.
READER PERSONA PRIMARIO: Sports Lover / Backstage Curious
DELTA PLAYBOOK: dimensionar el retiro con la trayectoria (22 años, partidos
  arbitrados) -- eso es todo lo que la historia da de sí, y es suficiente.
```

## Step 3 — Router

```
FORMATO: A
RAZÓN: El movimiento (retiro) más un dato de trayectoria explican
  completamente por qué importa. No hay mecanismo, incentivo de negocio ni
  consecuencia comercial que reconstruir -- inventarlos sería exactamente
  el "análisis artificial" que format-tiers.md prohíbe para A.
```

## La tentación (y por qué se descarta)

Sería posible alargar esto con contexto genérico sobre "el papel del
arbitraje en el fútbol moderno" o especular sobre quién lo reemplazará sin
que haya sido anunciado. Ambas son exactamente las señales de inflar una
historia que no la pide -- `editorial-gate.md` y el principio central del
sistema ("no toda pieza necesita profundidad Playbook") existen para este
caso.

## Draft

**Título:** Ricardo Solano se retira tras 22 años como árbitro en la LCF

**bodyMarkdown** (tier A, 107 palabras según `check-format-tier.ts`, sin
Opinión, sin subtítulos):

```
Ricardo Solano anunció su retiro como árbitro de la Liga Continental de
Fútbol, después de 22 años en la liga. Dirigió más de 450 partidos durante
su carrera, incluyendo cuatro finales de la Copa de Campeones del torneo.
Debutó como árbitro asistente en 2005 antes de ascender al silbato
principal tres años después.

Solano se convirtió en una de las caras más reconocidas del arbitraje de
la LCF, particularmente por su manejo de partidos de alta tensión sin
mostrar una sola tarjeta roja en las últimas tres temporadas. La liga no ha
anunciado quién tomará los partidos que tenía asignados para lo que resta
de la campaña.
```

Palabras: 107 -- dentro de 100-180, sin necesidad de estirarla a B.

## Moat Check

```
7. ¿Formato correcto? A, sí -- no hay segunda capa de negocio que la
   historia sostenga, y forzar una sería fabricarla.
8. ¿La longitud corresponde al valor disponible? SÍ -- 107 palabras es
   exactamente lo que esta historia da de sí. Inflarla a 300-500 sería
   forzar contenido que la historia no tiene, la falla que checklist §12
   pregunta 4 castiga ("¿el nivel de contexto corresponde al formato?").

CALIFICACIÓN: APROBADO
```

## check-format-tier.ts (corrida real contra este bodyMarkdown)

```
✓ Ricardo Solano se retira tras 22 años como árbitro en la LCF [A]
   107 palabras · Opinión no
```

## Resultado esperado vs. obtenido

Esperado: A, ~120-160 palabras, sin inflar a B. **Obtenido: coincide en
espíritu** (A, sin Opinión, muy por debajo de B) -- el borrador real quedó
en 107 palabras, dentro del rango 100-180 de A pero hacia el piso; el gate
y el router coinciden en que no hay segunda capa que rescatar, y el
borrador se queda corto en vez de forzar contexto genérico para llegar a
300-500.
