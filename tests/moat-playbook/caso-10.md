# Caso 10 — Historia donde 120 palabras son suficientes

**Qué valida:** el sistema no debe inflarla a 300-500 palabras solo porque
hay research disponible. Dry-run.

---

## INPUT (sintético)

> Un tenista mexicano (ficticio, "Emilio Cárdenas") anuncia que cambia de
> agencia de representación, de una boutique local a una agencia
> multinacional. El research encuentra abundante material disponible: la
> historia completa de la agencia multinacional, sus otros clientes de
> tenis, su estrategia de expansión en LATAM, entrevistas pasadas del
> jugador — suficiente, en volumen, para escribir una B larga o incluso
> tentar una C.

## GATE

```
DECISIÓN: PUBLICAR
RAZÓN: Cambio de representación de un jugador mexicano relevante, con un
  antecedente propio dimensionable (la agencia nueva ya representa a otros
  dos tenistas top-50, dato verificable).
READER PERSONA PRIMARIO: Sports Lover / Backstage Curious
DELTA PLAYBOOK: El dato de que la agencia ya representa a otros dos
  top-50 — contexto de escala que el comunicado no da.
EVIDENCIA DISPONIBLE: comunicado del jugador (01), roster público de la
  agencia (01).
```

## ROUTER — la decisión que este caso pone a prueba

```
FORMATO: A
RAZÓN: El movimiento (cambio de agencia) más el dato de escala (la agencia
  ya representa a otros dos top-50) YA explican por completo por qué vale
  la pena publicarlo. No hay una segunda capa de negocio real que abrir —
  no se conocen términos del contrato, no cambia control de nada, no hay
  mecanismo de dinero que reconstruir. Que exista mucho research
  DISPONIBLE (historia de la agencia, estrategia de expansión, entrevistas
  pasadas) no es lo mismo que la historia PEDIR ese research — es
  precisamente la trampa que `format-tiers.md` §1 nombra explícitamente:
  "having a lot of research available" no puede decidir el formato.
PALANCA DE NEGOCIO PRINCIPAL: Poder de negociación (palanca 7) — mencionada
  en una frase, no desarrollada en secciones.
```

## DRAFT (bodyMarkdown)

> **Título:** Emilio Cárdenas deja su agencia local por una multinacional
>
> El tenista mexicano Emilio Cárdenas anunció su salida de la agencia
> boutique que lo representaba desde el inicio de su carrera profesional
> para firmar con una agencia multinacional de representación deportiva.
> La nueva agencia ya representa a otros dos tenistas dentro del top-50
> mundial, lo que coloca a Cárdenas en una cartera con compañeros de un
> nivel competitivo más alto al que tenía antes.
>
> El cambio no incluye, por ahora, ningún anuncio de patrocinios nuevos ni
> de un calendario de torneos distinto al que Cárdenas ya tenía planeado
> para el resto de la temporada. La transición entra en vigor de inmediato,
> antes del siguiente torneo en su calendario, según confirmó la nueva
> agencia.

*(113 palabras en el cuerpo — dentro de A, verificado con
`check-tier-length.mjs`. Deliberadamente NO se usó el material sobre la
estrategia de expansión LATAM de la agencia, ni sus entrevistas pasadas, ni
la historia completa de la firma — todo eso es research real y disponible,
pero ninguno de esos datos responde la pregunta central de esta historia:
qué cambió para Cárdenas. Ese material queda archivado por si una historia
futura sobre la agencia misma lo necesita.)*

## MOAT CHECK

7. ¿Elegimos correctamente A/B/C? Sí — el test explícito es si faltó dejar
   fuera research disponible; aquí sí se dejó fuera deliberadamente, y esa
   es la señal correcta según `format-tiers.md` §1: "a short note doesn't
   need all the research."
8. ¿La longitud corresponde al valor disponible? Sí — inflar esto a 300-500
   palabras habría significado rellenar con la historia de la agencia
   (interesante, pero no es la historia de HOY) solo para justificar la
   cantidad de research reunido.

**Calificación: APROBADO.**

## Verificación

- Conteo real: 113 palabras, dentro de A (100-180), confirmado con
  `tests/moat-playbook/check-tier-length.mjs`.
- Este caso, junto con el Caso 2, es la prueba directa de que el router NO
  usa "cantidad de research disponible" como señal de formato — la regla
  que `format-tiers.md` §1 ya tenía y que este proyecto no tuvo que
  inventar, solo confirmar que sigue sosteniéndose bajo el nuevo gate.
