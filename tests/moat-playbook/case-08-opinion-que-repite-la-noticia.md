# Caso 8 — B cuya Opinión simplemente repite la noticia

Escenario del prompt: "El editor final debe rechazarla o pedir reedición."
Entidades **ficticias**.

## Input (sintético)

> "TeleSur Andina" (televisora) firmó un acuerdo de cinco años con la "Liga
> Andina de Rugby" (LAR2, torneo ficticio) para transmitir todos sus
> partidos, reemplazando al canal que tenía los derechos desde hacía diez
> años.

## Draft tal como llegó al self-check (ANTES de corregir — este es el punto
del caso: mostrar cómo el sistema lo atrapa)

**bodyMarkdown** (tier B, movimientos 1-3 correctos, Opinión defectuosa):

```
**El movimiento:** TeleSur Andina firmó un acuerdo de cinco años con la
Liga Andina de Rugby para transmitir todos sus partidos, reemplazando al
canal que tenía los derechos desde hacía una década.

**El cambio:** [...movimiento correcto sobre qué implica el cambio de
canal para la distribución del torneo...]

**El antecedente:** [...movimiento correcto sobre el canal anterior y su
relación de diez años con la liga...]

**Opinión de Playbook:** Este es un acuerdo importante para el negocio del
rugby en la región. TeleSur Andina apuesta fuerte por el deporte y esto
demuestra que la Liga Andina de Rugby sigue creciendo. Es una gran noticia
para los aficionados que podrán ver más partidos.
```

## Step 7 — Self-check (el fallo que el caso está diseñado para exponer)

El checklist de 12 puntos (`voice-and-style.md` §12), pregunta 7: **"¿La
opinión añade una segunda capa real (y el formato la lleva)?"** — la
respuesta honesta es no: la Opinión de arriba solo repite ("acuerdo
importante", "apuesta fuerte", "sigue creciendo", "gran noticia") sin
identificar palanca, mecanismo ni consecuencia. Es exactamente lo que
`voice-and-style.md` §6 (moat playbook guide, 2026-09-13) lista como lo que
**no** cuenta como Opinión ganada: "decir que algo es importante" y "una
recomendación genérica" — aquí ambas fallas están presentes.

## Moat Check sobre este borrador

```
4. ¿Cuál es el delta Playbook? NO HAY — la Opinión no identifica ninguna
   palanca (control, dinero, distribución, riesgo, poder). Es una
   paráfrasis con adjetivos ("importante", "gran noticia") de lo que el
   movimiento ya dijo. GATE: falla.
5. ¿La pieza va un nivel después del headline? Los movimientos de hecho sí
   (antecedente, qué cambia); la Opinión específicamente NO. GATE: falla en
   la sección Opinión.
6. ¿El nivel adicional está respaldado por evidencia? No aplica -- no hay
   nivel adicional que evaluar, porque la Opinión no lo aporta. GATE: falla
   por ausencia, no por falta de evidencia.

Como fallan los gates 4 y 5, la calificación no puede ser mejor que
REQUIERE REEDICIÓN, sin importar que los movimientos de hecho estén bien
escritos.

CALIFICACIÓN: REQUIERE REEDICIÓN

Cambios concretos (máximo cinco):
1. Reescribir la Opinión identificando la palanca real: el cambio de canal
   después de diez años es una señal de que el valor de los derechos de la
   LAR2 subió lo suficiente como para que otro comprador se lo dispute —
   esa es la lectura, no "es una gran noticia".
2. Eliminar "esto demuestra que la liga sigue creciendo" — es la fórmula
   "este caso demuestra que…" que voice-and-style.md §7 marca como
   watched.
3. Eliminar "es una gran noticia para los aficionados" — no es información,
   es relleno.
4. Aplicar el test de voice-and-style.md §6: ¿esta Opinión podría pegarse
   bajo cualquier otro anuncio de patrocinio cambiando solo los nombres? Tal
   como está, sí — por eso falla.
5. Reescribir en tres movimientos (reencuadra / palanca / consecuencia) per
   el método de §6, no como párrafo de cierre genérico.
```

## Draft corregido (después del re-edit)

```
**Opinión de Playbook:** El dato real no es que TeleSur Andina "apueste"
por el rugby: es que un canal que llevaba diez años con los derechos los
perdió frente a otro comprador, lo que sugiere que el valor de transmitir a
la LAR2 subió lo suficiente como para justificar una oferta mejor. Quien
tenía la relación de una década ahora tiene que reconstruir su parrilla sin
ese contenido, y la próxima renovación de la liga se va a negociar sabiendo
que hay más de un comprador dispuesto a pagar por ella.
```

## Resultado esperado vs. obtenido

Esperado: el editor final (Moat Check) rechaza o pide reedición cuando la
Opinión solo repite la noticia. **Obtenido: coincide** — gates 4 y 5
fallan, calificación `REQUIERE REEDICIÓN` (nunca `AJUSTES MENORES`), con
los cinco cambios concretos y la versión corregida solo después del
diagnóstico, tal como pide `moat-check.md`.
