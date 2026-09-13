# Caso 1 — Patrocinio pequeño, comunicado sin cifras

**Qué valida:** el gate debe poder decidir NO PUBLICAR / RADAR cuando no hay
valor adicional, aunque exista un comunicado real. Dry-run — no se invoca
`scripts/publish-newsletter.ts`, no hay escritura en Neon, no hay deploy.

---

## INPUT (sintético)

> Comunicado de prensa de un equipo de Liga MX Femenil: "X equipo anuncia
> nueva alianza con una marca de bebidas isotónicas como patrocinador
> oficial de camiseta de entrenamiento." Sin monto, sin plazo, sin
> exclusividad mencionada, sin comparación con el patrocinador anterior. El
> comunicado tiene 90 palabras y no hay cobertura de terceros.

## GATE (`editorial-gate.md`)

```
DECISIÓN: RADAR
RAZÓN: Hay importancia editorial marginal — es un patrocinio real, cubre la
  categoría de sponsorships que Playbook sigue — pero no hay ninguna
  segunda capa disponible hoy: sin monto, sin plazo, sin exclusividad, sin
  antecedente que permita comparar. Publicar hoy sería reescribir el
  comunicado con otras palabras.
READER PERSONA PRIMARIO: Commercial Leader
NECESIDAD DEL READER: Sigue el mercado de patrocinios de Liga MX Femenil,
  necesita saber cuándo un deal marca un movimiento real de precio o
  categoría, no cada alianza de camiseta de entrenamiento.
DELTA PLAYBOOK: Ninguno disponible hoy. Si se consigue el monto o se
  encuentra el patrocinador anterior para comparar, esto puede convertirse
  en una A con delta real.
EVIDENCIA DISPONIBLE: El comunicado del equipo (nivel 01, hecho confirmado,
  pero solo para "hubo un patrocinio nuevo").
DATOS / EVIDENCIA QUE FALTAN: Monto o rango, plazo, patrocinador anterior
  de la misma categoría, si es exclusivo.
```

**No se rutea a `format-tiers.md`.** El ítem se salta como un outcome A de
`overlap-check.md`: no hay draft.

## Reporte (como aparecería en `publishing-mechanics.md` → "Report back")

> RADAR: patrocinio de [equipo] con [marca] — sin monto ni plazo publicados,
> sin patrocinador anterior localizado para comparar. No se publica hoy;
> seguimiento por si aparece la cifra o el antecedente.

## Verificación

- El gate produjo RADAR, no PUBLICAR: correcto, coincide con lo esperado.
- El pipeline nunca llegó al router ni a `voice-and-style.md`: confirmado
  por diseño (paso 2c corta antes del paso 3).
