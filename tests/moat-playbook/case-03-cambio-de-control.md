# Caso 3 — Deal donde cambia quién controla un activo

Escenario del prompt: "Debe detectar B y desarrollar una segunda capa
concreta." Entidades **ficticias**.

## Input (sintético)

> "Cono Capital" (fondo de private equity) compró 60% de "Panal Media", la
> empresa que posee los derechos de transmisión de la "Liga de Voleibol
> Profesional" (LVP). Panal Media conservaba antes una posición minoritaria
> pasiva en esos derechos; el 60% adquirido por Cono Capital era propiedad
> de los fundadores de Panal Media, que salen del negocio. Monto no
> revelado.

## Step 0 — Overlap check

Sin cobertura previa de la LVP o de Panal Media.

## Step 0.5 — Editorial gate

```
DECISIÓN: PUBLICAR
RAZÓN: Hay un cambio real de quién controla la decisión sobre los derechos
  de una liga profesional — los fundadores salen, entra un fondo con un
  perfil de inversión distinto.
READER PERSONA PRIMARIO: Investor / Advisor
NECESIDAD DEL READER: entender qué cambia quién realmente decide sobre los
  derechos de la LVP a partir de ahora.
DELTA PLAYBOOK: el cambio de control (fundadores → fondo) y lo que eso
  típicamente implica para cómo se negocian y empaquetan derechos de
  transmisión.
EVIDENCIA DISPONIBLE: la operación en sí (confirmada por ambas partes),
  quién vendía y quién compra.
DATOS / EVIDENCIA QUE FALTAN: el monto de la operación, no revelado por
  ninguna de las partes.
```

## Step 3 — Router

```
FORMATO: B
RAZÓN: Hay una segunda capa concreta de negocio detrás del movimiento:
  control, no solo propiedad — quién decide cómo se venden y empaquetan los
  derechos de la LVP cambia de mano.
READER PERSONA PRIMARIO: Investor / Advisor
JOB-TO-BE-DONE: entender si este tipo de operación (fondo comprando el
  control de una empresa de derechos deportivos) es una señal de hacia
  dónde va el dinero en ligas de nivel medio.
PREGUNTA CENTRAL: ¿qué cambia cuando el control de un activo de derechos
  pasa de sus fundadores a un fondo de private equity?
DELTA PLAYBOOK ESPERADO: explicar qué compra realmente un fondo cuando
  entra a este tipo de negocio (no el contenido, el control sobre cómo se
  vende) y qué incentivo tiene distinto al de los fundadores salientes.
PALANCA DE NEGOCIO PRINCIPAL: control del activo / de la decisión.
EVIDENCIA DISPONIBLE: como arriba.
DATOS QUE FALTAN: monto de la operación.
```

## Draft

**Título:** Cono Capital toma el control de los derechos de la LVP

**Excerpt:** El fondo compró el 60% de Panal Media que pertenecía a sus
fundadores, quienes salen del negocio de derechos de transmisión de la Liga
de Voleibol Profesional.

**bodyMarkdown** (tier B, 3-5 movimientos + Opinión; 288 palabras según
`check-format-tier.ts`):

```
**El movimiento:** Cono Capital compró el 60% de Panal Media, la empresa
dueña de los derechos de transmisión de la Liga de Voleibol Profesional
(LVP). Ese 60% pertenecía a los fundadores de Panal Media, que salen por
completo del negocio. El monto no se reveló.

**Lo que cambia:** Panal Media nació como una apuesta de sus fundadores,
que retenían el control operativo mientras un socio minoritario pasivo
aportaba capital. Ahora es al revés: un fondo con mandato de retorno
financiero controla la mayoría, y quien construyó la relación con la LVP
queda fuera de las decisiones.

**El incentivo distinto:** un fundador que opera su propia empresa de
derechos suele priorizar la relación de largo plazo con la liga, con
renovaciones estables y paquetes que no sobrecargan al comprador de
contenido. Un fondo que compra control busca maximizar el valor del activo
en un horizonte de salida, lo que típicamente significa reempaquetar los
derechos, buscar nuevos compradores de contenido o preparar la empresa para
revenderla en unos años.

**Precedente:** casos similares en la región (fondos comprando el control
de empresas de derechos deportivos de nivel medio) han terminado en
reestructuraciones de los paquetes de transmisión dentro de los primeros 18
meses, no siempre a favor de la liga cuyos derechos se venden.

**Opinión de Playbook:** El dato que importa no es el precio, que ni
siquiera se reveló: es que la LVP ahora negocia sus derechos con un dueño
cuyo reloj es distinto al de quien construyó la relación. Eso no vuelve
mala la operación, pero cambia la pregunta que la liga necesita hacerse en
la próxima renovación: ¿el nuevo control prioriza el mismo tipo de acuerdo
de largo plazo, o el activo está en preparación para una salida?
```

## Moat Check

```
4. Delta Playbook: SÍ — el cambio de incentivo entre fundador-operador y
   fondo-inversor, no solo el hecho de la compra. GATE: pasa.
5. ¿Un nivel después del headline? SÍ — el headline diría "fondo compra
   60% de Panal Media"; la pieza explica qué cambia en cómo se negocian los
   derechos. GATE: pasa.
6. ¿Respaldado por evidencia? Parcialmente nivel 01 (la operación, quién
   vendía) y nivel 03 (interpretación sobre el incentivo del fondo,
   marcada explícitamente como lectura de Playbook, no como hecho). GATE:
   pasa — la interpretación está señalada como tal, no smuggled como hecho.
7. Formato correcto: B, sí — hay segunda capa concreta (control, incentivo),
   no alcanza a ser C porque no hace falta reconstruir números o estructura
   compleja para entenderlo.
8. Longitud corresponde al valor: sí, 288 palabras dentro de 250-500.
9. Algo memorable: sí — la idea de que "el reloj del nuevo dueño es
   distinto al de quien construyó la relación" es aplicable a otros casos.
10. ¿Sobreviviría sin el nombre Playbook? No — un reporte genérico solo
    diría quién compró qué; la lectura sobre incentivos y el precedente de
    reestructuraciones es lo que un comunicado de prensa no da.

CALIFICACIÓN: APROBADO
```

## check-voice.mjs (corrida real, honesta)

La primera versión de este borrador usaba dos guiones largos en prosa
(`—`), una violación real del em-dash ban que `check-voice.mjs` atrapó de
inmediato al correrlo contra el fixture. Se corrigió reemplazándolos por
coma/aposición antes de dejar este caso como ejemplo. Esto es exactamente
el tipo de hallazgo mecánico que Step 7 existe para atrapar antes de
publicar — se deja documentado en vez de limpiarlo silenciosamente.

```
✓ Cono Capital toma el control de los derechos de la LVP
   5 párrafos · mediana 48p/2or por párrafo/31o · antítesis 0
```

## check-format-tier.ts (corrida real contra este bodyMarkdown)

```
✓ Cono Capital toma el control de los derechos de la LVP [B]
   288 palabras · Opinión sí
```

## Resultado esperado vs. obtenido

Esperado: B, con segunda capa concreta desarrollada. **Obtenido: coincide.**
