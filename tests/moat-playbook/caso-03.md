# Caso 3 — Deal donde cambia quién controla un activo

**Qué valida:** el router debe detectar B y desarrollar una segunda capa
concreta de negocio (no solo repetir el movimiento). Dry-run.

---

## INPUT (sintético)

> Un fondo de private equity europeo compra el 30% de un club de la Liga
> MX (ficticio, "Club Pumas del Norte"), con opción de subir a 51% en 2029.
> El comunicado del club dice "nueva etapa de crecimiento". Playbook
> localiza, vía research, que el mismo fondo ya tiene participaciones
> minoritarias en dos clubes europeos de segunda división y que su tesis
> pública es "escalar operaciones comerciales, no deportivas". No hay
> monto revelado.

## GATE

```
DECISIÓN: PUBLICAR
RAZÓN: Cambia quién puede llegar a controlar un club de Liga MX; hay un
  patrón identificable en el comprador (tesis de escalar comercial, no
  deportivo, ya aplicada en dos clubes europeos) que el comunicado no
  menciona.
READER PERSONA PRIMARIO: Investor / Advisor
NECESIDAD DEL READER: Entender qué tipo de control está comprando el fondo
  y qué patrón sigue en otros clubes.
DELTA PLAYBOOK: La tesis del fondo en sus otras participaciones — lo que
  probablemente va a intentar en el club, más allá del comunicado.
EVIDENCIA DISPONIBLE: Comunicado del club (01), participaciones del fondo
  en dos clubes europeos y su tesis pública (01, verificable en sus propios
  materiales de inversionistas).
DATOS / EVIDENCIA QUE FALTAN: Monto de la operación (no indispensable para
  B — el mecanismo de control es el dato fuerte, no el precio).
```

## ROUTER

```
FORMATO: B
RAZÓN: Hay una segunda capa concreta de negocio: control (30% con opción a
  51%, mecanismo de escalamiento) y un patrón de tesis comercial ya
  aplicado en otros dos activos del mismo comprador.
READER PERSONA PRIMARIO: Investor / Advisor
JOB-TO-BE-DONE: Anticipar qué va a cambiar operativamente en el club, no
  solo enterarse de que hubo una inversión.
PREGUNTA CENTRAL: ¿Qué busca este fondo al entrar a un club de Liga MX, y
  qué tan parecido es a lo que ya hizo en Europa?
DELTA PLAYBOOK ESPERADO: Conectar la operación con la tesis y el patrón del
  fondo en sus otras dos participaciones.
PALANCA DE NEGOCIO PRINCIPAL: Control del activo o de la decisión (palanca 1).
EVIDENCIA DISPONIBLE: comunicado, materiales públicos del fondo sobre sus
  otras participaciones.
DATOS QUE FALTAN: monto de la operación.
```

## DRAFT (bodyMarkdown, resumido — estructura, no el cuerpo completo)

- **Movimiento:** el fondo compra 30% de Pumas del Norte, opción a 51% en
  2029.
- **Investigación/cruce:** el mismo fondo tiene participaciones minoritarias
  en dos clubes de segunda división europea; su tesis pública, repetida en
  ambos casos, es escalar el lado comercial (patrocinios, merchandising,
  data de aficionados), no el deportivo.
- **Movimiento adicional:** la opción a 51% en 2029 es la palanca real —
  hoy es un socio minoritario con un camino contractual a control mayoritario
  si el plan comercial funciona.
- `**Opinión de Playbook:**` La operación se lee mejor como un piloto de
  tesis que como una inversión deportiva: el fondo compra tiempo (cinco años
  antes de decidir si sube a control mayoritario) para probar en México el
  mismo manual que ya corre en Europa. Si el manual funciona, 2029 deja de
  ser una opción y se vuelve una formalidad.

## MOAT CHECK

4. Delta (**gate**): sí — la tesis del fondo en sus otras participaciones,
   ausente del comunicado.
5. ¿Un nivel más allá del headline? (**gate**): sí — el headline es "fondo
   compra 30%"; la pieza explica qué va a intentar hacer con ese 30%.
6. ¿Evidenciado? (**gate**): sí — materiales públicos del fondo sobre sus
   otras dos participaciones, no una interpretación sin base.
9. ¿Memorable? Sí — "el fondo compra tiempo, no control, todavía".

**Calificación: APROBADO.**

## Verificación

- La Opinión no repite la noticia (ver Caso 8 para el contraste con una que
  sí lo hace): añade la lectura del patrón repetido en otros activos.
- El router no escaló a C: no hace falta reconstruir estructura societaria
  completa ni comparables de valuación para responder la pregunta central.
