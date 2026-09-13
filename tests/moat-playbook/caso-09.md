# Caso 9 — Artículo perfectamente escrito pero totalmente sustituible

**Qué valida:** debe fallar el Moat Check (pregunta 10) aunque la prosa sea
impecable. Dry-run.

---

## INPUT (sintético)

> Una liga de voleibol profesional (ficticia) anuncia los horarios de su
> próxima temporada regular. Comunicado estándar con fechas, sedes y
> formato de transmisión, sin ningún dato que Playbook no pueda tomar
> directamente del propio comunicado.

## GATE — nota: en un run real esto probablemente debería resolver en NO
## PUBLICAR TODAVÍA / RADAR desde el gate. Este caso está construido para
## mostrar qué pasa si, por error de juicio, el ítem SÍ pasa el gate y
## llega hasta el draft — la segunda línea de defensa.

```
DECISIÓN: PUBLICAR (juicio editorial cuestionable, a propósito, para
  probar el Moat Check como respaldo)
RAZÓN (débil, la que alguien podría dar apurado): "es una liga que
  cubrimos, hay que dar seguimiento a su calendario."
```

## DRAFT — bien escrito, perfectamente pulido, formato B

> **Título:** La liga de voleibol confirma calendario y sedes para 2027
>
> La liga anunció que su temporada 2027 arrancará el 14 de marzo con doce
> equipos, manteniendo el formato de todos contra todos a doble vuelta que
> ha usado desde 2023. Las sedes confirmadas incluyen los tres mercados
> habituales de la competencia, sin nuevas plazas respecto al calendario
> anterior.
>
> La transmisión seguirá a cargo del mismo socio de streaming de las
> últimas dos temporadas, sin cambios en el paquete de derechos ni en el
> número de partidos exclusivos por semana.
>
> `**Opinión de Playbook:**` Un calendario sin sorpresas es, en sí mismo,
> una señal de estabilidad para una liga que en años anteriores tuvo
> cambios de formato constantes — la continuidad del socio de streaming y
> de las sedes sugiere que la operación ha encontrado un ritmo que le
> funciona.

*(Prosa limpia: sin em dash, ritmo correcto, Opinión con estructura de tres
movidas — reencuadre, palanca, consecuencia — técnicamente bien ejecutada.)*

## MOAT CHECK

1. ¿Por qué merece espacio? — Débil: es un calendario de temporada, el tipo
   de contenido que cualquier medio deportivo generalista publica igual.
2-3. Persona/necesidad: genéricas, no hay una pregunta concreta que un
   lector de sports business esté "contratando" a Playbook para resolver
   aquí.
4. Delta (**gate**): NO en el sentido fuerte — la "lectura de estabilidad"
   en la Opinión es una observación razonable pero no requiere ningún
   trabajo de research, cruce o dato propio; cualquier redactor deportivo
   podría escribir exactamente esa misma frase con el mismo comunicado.
5. ¿Un nivel más allá del headline? (**gate**): técnicamente sí, pero es un
   nivel trivial — no cuesta nada llegar a "esto sugiere estabilidad" desde
   un calendario sin cambios.
9. ¿Memorable? No — no hay un dato o cifra que el lector se lleve a otra
   conversación.
10. **¿Seguiría teniendo el mismo valor si le quitamos el nombre Playbook y
    la generara cualquier medio a partir del comunicado?** SÍ. Esta es
    exactamente la pregunta que el caso está diseñado para fallar: el
    artículo es sustituible palabra por palabra por cualquier cobertura
    genérica del mismo comunicado.

**Calificación: REQUIERE REEDICIÓN** — por juicio editorial directo sobre la
pregunta 10, no por la regla mecánica de severidad (esa solo se dispara si
uno de los gates 4/5/6 falla formalmente, y aquí gate 4 pasa en un sentido
técnico débil). Esto es exactamente el punto del caso: los gates 4/5/6
existen para el fallo obvio (sin delta, sin evidencia); la pregunta 10
existe para el fallo sutil — una pieza que pasa los gates de forma técnica
y aun así es prescindible. El Moat Check necesita las diez preguntas, no
solo los tres gates, precisamente por casos como este.

**Nota editorial:** en la práctica, este ítem nunca debería haber llegado
tan lejos — el gate real (`editorial-gate.md`) está diseñado para atraparlo
antes, con una DECISIÓN honesta de RADAR o NO PUBLICAR TODAVÍA, no
PUBLICAR. Este caso demuestra la segunda línea de defensa, no reemplaza a
la primera.

## Verificación

- Confirma que la pregunta 10 del Moat Check hace un trabajo que los gates
  4/5/6 solos no cubren completamente: una pieza técnicamente correcta
  puede seguir siendo sustituible.
