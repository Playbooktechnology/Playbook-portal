# Caso 8 — B cuya Opinión simplemente repite la noticia

**Qué valida:** el editor final (Moat Check) debe rechazar o pedir
reedición cuando la Opinión no añade nada. Dry-run.

---

## INPUT (sintético)

> Una marca de ropa deportiva firma como patrocinador principal de una liga
> universitaria de básquetbol (ficticia), reemplazando al patrocinador
> anterior. El monto no se revela, pero el research encuentra que el
> patrocinador saliente llevaba 12 años en el puesto y que el nuevo
> patrocinador es una marca emergente sin presencia previa en el deporte
> universitario.

## GATE → ROUTER (resumen — clasificación correcta)

```
DECISIÓN: PUBLICAR
FORMATO: B
PALANCA DE NEGOCIO PRINCIPAL: Poder de negociación / inventario comercial
  (palancas 3 y 7).
DELTA PLAYBOOK ESPERADO: Qué significa que una marca emergente, sin
  historial en el deporte universitario, le gane el puesto a un
  patrocinador de 12 años.
```

## DRAFT — PRIMERA VERSIÓN (la que el Moat Check debe atrapar)

- **Movimiento:** la marca nueva reemplaza a la anterior como patrocinador
  principal de la liga.
- **Investigación:** el patrocinador saliente llevaba 12 años en el puesto;
  el entrante es una marca emergente sin presencia previa en el deporte
  universitario.
- `**Opinión de Playbook:**` Este acuerdo confirma que las marcas
  emergentes están apostando fuerte por el deporte universitario como
  plataforma de crecimiento, y es un movimiento importante para la
  categoría. La liga gana un socio nuevo con energía renovada, y esto marca
  una tendencia interesante a seguir de cerca en los próximos años.

## MOAT CHECK sobre la primera versión

1-3. Persona/necesidad/importancia: correctas, la clasificación B fue
correcta.

4. **Delta Playbook (gate): FALLA.** La Opinión no reencuadra nada — repite
   "reemplaza al anterior" y "marca emergente" con otras palabras
   ("confirma que las marcas emergentes están apostando fuerte") sin
   identificar una palanca real (¿qué pagó de más o de menos la marca
   nueva por entrar sin historial? ¿qué le costó al patrocinador anterior
   perder el puesto tras 12 años? ¿qué obtiene la liga a cambio de asumir
   el riesgo de un socio sin trayectoria?). Pasa exactamente la prueba de
   `voice-and-style.md` §6: "¿podría pegarse esta opinión debajo de otra
   noticia solo cambiando los nombres?" — sí, se puede.
5. ¿Un nivel más allá del headline? (**gate**): NO — la pieza completa se
   queda en "hubo un cambio de patrocinador", que es exactamente el
   headline.
6. ¿Evidenciado? (**gate**): la pregunta no llega a aplicar porque el gate
   4 y 5 ya fallaron sin que haya una interpretación específica que
   evaluar.

**Calificación: REQUIERE REEDICIÓN** (tres gates fallando, no solo uno —
por la regla de severidad no puede ser mejor que esto de todas formas).

**Cambios concretos pedidos (máximo cinco):**
1. Reescribir la Opinión para identificar la palanca real: poder de
   negociación de una marca sin historial frente al costo de reputación de
   perder un socio de 12 años.
2. Nombrar qué obtiene la liga a cambio de asumir el riesgo (¿términos más
   agresivos? ¿exclusividad más amplia?) si el research lo sostiene.
3. Quitar "esto marca una tendencia interesante a seguir de cerca" —
   fórmula bajo vigilancia (`voice-and-style.md` §7, lista ampliada).
4. Quitar "confirma que... están apostando fuerte" — la misma fórmula que
   §7 ya señalaba antes de esta ampliación.

## DRAFT — VERSIÓN CORREGIDA (después del diagnóstico)

> `**Opinión de Playbook:**` Que una marca sin historial en el deporte
> universitario le haya ganado el puesto a un patrocinador de 12 años dice
> más del poder de negociación de la liga que del atractivo de la marca
> entrante: doce años de relación no se rompen por una oferta apenas mejor,
> se rompen quien está dispuesto a pagar por entrar a una categoría donde
> no tiene trayectoria que defender. La pregunta que queda abierta es
> cuánto de ese premio por entrada la liga logró convertir en términos más
> favorables para sí misma.

## MOAT CHECK sobre la versión corregida

4. Delta: sí — identifica el mecanismo (premio por entrada de un
   patrocinador sin trayectoria) en vez de repetir el movimiento.
5. ¿Un nivel más allá del headline? sí.
6. ¿Evidenciado? sí, sobre lo que el research sí confirmó (los 12 años del
   patrocinador anterior, la falta de historial del entrante) sin inventar
   cifras que no existen.

**Calificación: APROBADO.**

## Verificación

- Confirma que el Moat Check, con la regla de severidad de
  `voice-and-style.md` §12, detiene exactamente el patrón que Cambio 8
  quería atrapar: una Opinión bien escrita en superficie pero que no dice
  nada nuevo.
