# Caso 7 — Noticia A con delta Playbook, sin Opinión separada

**Qué valida:** una A debe contener delta Playbook real sin añadir una
Opinión que el formato no lleva. Dry-run.

---

## INPUT (sintético)

> La F1 confirma que el Gran Premio de una sede europea (ficticia,
> "Circuito de Lindtal") extiende su contrato tres años más, hasta 2031.
> Comunicado de 60 palabras, sin cifra de la extensión.

## GATE

```
DECISIÓN: PUBLICAR
RAZÓN: Extensión de un GP de F1 es relevante para el calendario de la
  categoría; Playbook tiene research propio (cobertura previa de la F1
  reduciendo el número total de sedes europeas este ciclo) que dimensiona
  la noticia.
READER PERSONA PRIMARIO: Sports Lover / Backstage Curious
NECESIDAD DEL READER: Saber si esta sede está entre las que la F1 viene
  recortando o entre las que blinda.
DELTA PLAYBOOK: Conectar la extensión con el propio patrón de recorte de
  sedes europeas que Playbook ya viene cubriendo.
EVIDENCIA DISPONIBLE: comunicado (01), cobertura previa propia sobre el
  recorte de sedes (01).
DATOS / EVIDENCIA QUE FALTAN: cifra del nuevo contrato (no indispensable
  para A).
```

## ROUTER

```
FORMATO: A
RAZÓN: El movimiento más el antecedente del propio patrón de recortes ya
  explican el valor; no hay segunda capa de negocio (no se conoce cifra,
  no hay cambio de control).
READER PERSONA PRIMARIO: Sports Lover / Backstage Curious
JOB-TO-BE-DONE: Saber si esta sede europea está a salvo del recorte de
  calendario.
PREGUNTA CENTRAL: ¿Esta sede se salva del recorte que la F1 viene haciendo
  en Europa?
DELTA PLAYBOOK ESPERADO: El patrón de recorte como contexto que dimensiona
  la extensión.
PALANCA DE NEGOCIO PRINCIPAL: Escala y sostenibilidad (palanca 9).
EVIDENCIA DISPONIBLE: comunicado, cobertura previa propia.
DATOS QUE FALTAN: cifra del contrato.
```

## DRAFT (bodyMarkdown)

> **Título:** El Circuito de Lindtal extiende su contrato con la F1 hasta 2031
>
> La F1 confirmó que el Gran Premio en el Circuito de Lindtal extiende su
> contrato tres años, hasta 2031, sin que la categoría revelara el monto
> de la renovación. La sede se mantiene así fuera de la ronda de recortes
> que la F1 ha aplicado a otros circuitos europeos en los últimos dos
> ciclos de calendario.
>
> La extensión llega en un momento en que la categoría ha reducido, no
> ampliado, su presencia tradicional en Europa a favor de mercados nuevos
> en Medio Oriente y Asia — lo que convierte a Lindtal en una de las pocas
> sedes del continente que sale fortalecida de esa tendencia en lugar de
> amenazada por ella.

*(110 palabras en el cuerpo, verificado con
`tests/moat-playbook/check-tier-length.mjs` — dentro de A. Sin subtítulo,
sin `**Opinión de Playbook:**`, como exige `format-tiers.md` §1 para A.)*

## MOAT CHECK

4. Delta (**gate**): sí — conectar con el patrón de recorte de sedes
   europeas, dato que el comunicado de 60 palabras no menciona.
5. ¿Un nivel más allá del headline? (**gate**): sí.
6. ¿Evidenciado? (**gate**): sí — cobertura previa propia y verificable.

**Calificación: APROBADO.** Sin Opinión de Playbook — correcto para A — y
aun así con delta real, que es exactamente lo que Cambio 4 pide distinguir.

## Verificación

- Conteo de palabras verificado con el checker determinista:
  `OK   [A] ... — 110 words is inside A's 100-180 range`.
