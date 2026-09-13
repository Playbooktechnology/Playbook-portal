# Caso 2 — Movimiento sencillo pero relevante, con antecedente útil

**Qué valida:** debe poder terminar como A de ~120-160 palabras. No debe
convertirse en B solo para demostrar análisis. Dry-run, sin publish real.

---

## INPUT (sintético)

> La NBA anuncia que el próximo All-Star Game 2027 se jugará en una nueva
> sede (ciudad ficticia "Ciudad X"), rompiendo la racha de sedes
> tradicionales de los últimos 10 años (siempre mercados top-5 por tamaño).
> Es la primera vez desde 2016 que la sede sale de ese grupo de mercados.
> Cobertura: comunicado de la NBA + una nota de Associated Press
> confirmando la fecha.

## GATE

```
DECISIÓN: PUBLICAR
RAZÓN: Movimiento relevante (sede del evento insignia de la liga) con un
  antecedente propio verificable (10 años sin salir del top-5 de mercados)
  que dimensiona la decisión sin necesitar más reporteo.
READER PERSONA PRIMARIO: Sports Lover / Backstage Curious
NECESIDAD DEL READER: Entender qué tan inusual es esta decisión y por qué
  importa dentro del patrón habitual de la liga.
DELTA PLAYBOOK: El antecedente de los 10 años en mercados top-5 — dato que
  ni el comunicado ni la nota de AP mencionan.
EVIDENCIA DISPONIBLE: Comunicado NBA (01), nota AP (01), archivo propio de
  sedes de All-Star Game de la última década (01, verificable).
DATOS / EVIDENCIA QUE FALTAN: Ninguno indispensable para el nivel A.
```

## ROUTER (`format-tiers.md` §1)

```
FORMATO: A
RAZÓN: El movimiento más el antecedente de mercado ya explican por qué
  vale la pena — no hay una segunda capa de negocio (control, dinero,
  distribución) que abrir; es una decisión de sede, no una operación
  comercial nueva.
READER PERSONA PRIMARIO: Sports Lover / Backstage Curious
JOB-TO-BE-DONE: Entender rápido qué cambió en el patrón de sedes y por qué
  es inusual.
PREGUNTA CENTRAL: ¿Qué tan raro es que la NBA saque el All-Star Game del
  top-5 de mercados?
DELTA PLAYBOOK ESPERADO: Dimensionar la decisión con el propio patrón de 10
  años, no repetir el comunicado.
PALANCA DE NEGOCIO PRINCIPAL: Escala y sostenibilidad (palanca 9).
EVIDENCIA DISPONIBLE: comunicado NBA, nota AP, archivo propio de sedes.
DATOS QUE FALTAN: ninguno para A.
```

## DRAFT (bodyMarkdown, abreviado — respeta el rango A)

> **Título:** La NBA rompe diez años de sedes top-5 para el All-Star 2027
>
> La NBA confirmó que el All-Star Game 2027 se jugará en Ciudad X, la
> primera vez desde 2016 que la sede sale del grupo de los cinco mercados
> más grandes de Estados Unidos que la liga había usado sin excepción en
> la última década. El anuncio no incluye una nueva estructura comercial ni
> cambios al formato del evento; es, por ahora, una decisión de sede.
>
> Ciudad X entra a competir por el evento más visto de la temporada regular
> de la liga fuera de los mercados que tradicionalmente lo habían
> concentrado, lo que abre la pregunta de si el patrón de la próxima
> década se parecerá más a este caso que a los diez años anteriores.

*(116 palabras en el cuerpo, verificado con
`tests/moat-playbook/check-tier-length.mjs` — dentro del rango A de
100-180. Sin Opinión de Playbook, sin subtítulos, como exige
`format-tiers.md` §1.)*

## MOAT CHECK

1. ¿Por qué merece espacio? — Rompe un patrón de 10 años en el evento
   insignia de la liga.
2. Reader persona: Sports Lover / Backstage Curious.
3. Necesidad: entender qué tan inusual es la decisión.
4. Delta (**gate**): sí — el antecedente de 10 años en mercados top-5.
5. ¿Un nivel más allá del headline? (**gate**): sí — el headline solo
   dice "nueva sede"; la pieza añade el patrón roto.
6. ¿Evidenciado? (**gate**): sí — archivo propio verificable de sedes.
7. ¿A/B/C correcto? Sí — no hay segunda capa de negocio que abrir.
8. ¿Longitud corresponde al valor? Sí — 128 palabras es lo que la historia
   pide, forzar una B habría requerido inventar una capa de negocio que no
   existe en el input.
9. ¿Algo memorable? Sí — "primera vez desde 2016 que sale del top-5".
10. ¿Sustituible? No del todo — el antecedente de los 10 años no está en
    el comunicado ni en la nota de AP.

**Calificación: APROBADO.**

## Verificación

- El router no se dejó tentar por convertir esto en B — hay antecedente
  pero no hay segunda capa de negocio (control, dinero, distribución), así
  que A es correcto.
- Conteo real de palabras del cuerpo: 116 (dentro de A), verificado
  mecánicamente con `tests/moat-playbook/check-tier-length.mjs` — output:
  `OK   [A] ... — 116 words is inside A's 100-180 range`.
