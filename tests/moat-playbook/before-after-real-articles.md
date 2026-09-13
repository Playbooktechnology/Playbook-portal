# Before / after — 3 artículos reales recientes del archivo

Consulta de solo lectura contra la base de producción (Neon), sin ninguna
escritura — `select ... where status='published' order by date desc`, tres
de los artículos más recientes al momento de esta implementación
(2026-09-11). El objetivo es juzgar el delta sobre historias reconocibles,
no sobre casos sintéticos: cómo se habría rutedo/revisado cada una bajo el
sistema *antes* de este proyecto (el router y el checklist de doce puntos,
sin gate previo ni Moat Check) frente a *después* (con
`editorial-gate.md` + el Moat Check de `voice-and-style.md` §12).

---

## 1. "El caso Clippers-Leonard escala a una investigación criminal"

`id: el-caso-clippers-leonard-escala-a-una-investigacion-criminal` · 320
palabras publicadas · `reading_time: 2` · `priority: 4` · publicado
2026-09-11.

### Antes (sistema previo)

El router de `format-tiers.md` ya existente habría clasificado esto sin
problema como B (segunda capa: por qué una investigación penal cambia las
consecuencias frente a una sanción de liga) y el checklist de doce puntos
ya lo habría exigido bien construido. **No hay nada mal en esta pieza tal
como está publicada** — ya separa niveles de evidencia ("no está claro
todavía si el caso terminará en cargos penales"), ya tiene un device de
Precedentes bien usado, y la Opinión ya identifica una palanca real (quién
decide las consecuencias) en vez de repetir la noticia. Este es exactamente
el tipo de pieza que demuestra por qué la auditoría de la Fase 0 encontró
tanto ya construido.

### Después (con gate + Moat Check)

```
GATE: PUBLICAR — la investigación federal cambia quién puede procesar el
  caso, un hecho que la NBA por sí sola no puede producir.
ROUTER: FORMATO B (confirmado) — hay segunda capa (control del proceso,
  quién decide) sin necesitar reconstrucción completa de la estructura del
  esquema de tope salarial.
```

**Moat Check:**
- Gate 4 (delta): sí — el timing (la pesquisa federal empezó antes del
  castigo de la NBA) es un dato que reencuadra la historia.
- Gate 5 (más allá del headline): sí.
- Gate 6 (evidenciado): sí — atribuido a The New York Times, con `Fuentes:`.
- Pregunta 6 en particular, la que este proyecto refuerza en C
  (`format-tiers.md` §3b) — aquí en B ya se aplica bien sin necesitar el
  aparato de Deep Dive: "no está claro todavía" marca el evidence gap sin
  fabricar certeza sobre si habrá cargos.

**Calificación: APROBADO, sin cambios.**

### Lo único que vale la pena anotar

El propio `format-tiers.md` §1 tiene una regla de "la señal de que la
historia pide C": mecanismo + dinero + precedente, cuando el lector termina
sin entender cómo funciona el esquema completo de evasión del tope
salarial. Esta pieza se queda deliberadamente en el "qué cambia" (de
sanción a proceso penal) y no reconstruye el mecanismo completo del esquema
de patrocinios — que sí podría sostener una C separada ("cómo funcionó
realmente el esquema de los Clippers") si en el futuro hay más reporting
disponible sobre los US$28M+ del caso. Bajo el nuevo gate, esa sería una
pieza distinta con su propia decisión, no una razón para inflar esta B.

---

## 2. "¿Por qué dos fortunas mexicanas compraron parte de los Seahawks?"

`id: por-que-dos-fortunas-mexicanas-compraron-parte-de-los-seahawks` · 704
palabras publicadas · `reading_time: 4` · `priority: 5` · publicado
2026-09-11.

### Antes (sistema previo)

Ya es una pieza sólida: dato duro (Cifra clave, US$9,612M), un device Duelo
comparando franquicias deportivas contra el S&P 500, conexión mexicana
genuina y verificada (dos familias nombradas, no un "esto también aplica
para México" genérico). El router previo la habría tratado como una "B
larga" en el sentido de `format-tiers.md` §2 — un feature con `##`
secciones que corre cerca de 700-900 palabras a `readingTime: 4`, sin una
etiqueta formal de C.

### Después (con gate + router explícito de C)

```
GATE: PUBLICAR — dos fortunas mexicanas nombradas entran a un grupo de
  propietarios de NFL; hay mecanismo de negocio (diversificación de
  portafolio, correlación de activos) que ningún comunicado da.
ROUTER: FORMATO C — la pregunta central ("¿por qué el deporte profesional
  se volvió un activo de inversión institucional para fortunas
  mexicanas?") exige reconstruir un mecanismo financiero completo
  (correlación de activos, el índice Ross-Arctos, el patrón de otras
  franquicias de NFL), no solo reportar el movimiento. Esa es la señal
  exacta de format-tiers.md §1: mecanismo + dinero + precedente.
PALANCA DE NEGOCIO PRINCIPAL: Valor (palanca 2 / lente "Valor" de §1) — un
  activo con baja correlación dentro de un portafolio de alto patrimonio.
```

**Moat Check:**
- Gate 4/5/6: los tres pasan limpiamente — la cifra de correlación
  (0.10/-0.19/-0.15) y el índice Ross-Arctos son evidencia real, no
  interpretación sin base.
- Pregunta 9 (memorable): sí — "1,954% de retorno acumulado frente a 620%
  del S&P 500" es el tipo de dato que un lector se lleva a otra
  conversación.

**Calificación: APROBADO.** El único cambio real que trae este proyecto es
formal, no de contenido: bajo `format-tiers.md` §1 actualizado, esta pieza
se **nombra explícitamente C** desde el router (con su propia arquitectura
de sección-por-pregunta) en vez de quedar como una B que "le salió larga".
Eso importa para el `readingTime`/budget de devices que se le asigna desde
el principio, no solo para el resultado final.

---

## 3. "Nike acorta su contrato y libera a la Bundesliga Femenil"

`id: nike-acorta-su-contrato-y-libera-a-la-bundesliga-femenil` · 924
palabras publicadas · `reading_time: 4` · `priority: 4` · publicado
2026-09-11.

### Antes (sistema previo)

Pieza compleja y bien reporteada — cuatro actores (DFB, FBL e.V., Nike,
Adidas como comparable), una cronología completa desde 2025, dos devices
(Salto y Cronología). Publicada sin una pregunta central declarada de
forma explícita; el router previo la habría dejado, de nuevo, como una "B
larga a readingTime 4" sin el aparato formal de C (sección por pregunta,
2-4 devices con presupuesto explícito, Opinión única al cierre en la
posición que exige `format-tiers.md` §3b).

### Después (con gate + router explícito de C)

```
GATE: PUBLICAR — el DFB cede la Bundesliga Femenil a su propia asociación
  de clubes, y el nudo que casi trababa el proceso (el contrato de Nike)
  ya se resolvió con una estructura de plazo distinta a precio distinto.
ROUTER: FORMATO C — comprender el deal exige reconstruir CUATRO piezas:
  qué cede el DFB, qué gana/pierde Nike, qué compensa el DFB durante la
  transición, y la cronología completa desde 2025. Ninguna fuente lo
  resume en un solo movimiento.
PREGUNTA CENTRAL: ¿Qué tuvo que ceder cada parte (DFB, FBL, Nike) para que
  la escisión de la Bundesliga Femenil finalmente se destrabara?
PALANCA DE NEGOCIO PRINCIPAL: Poder de negociación (palanca 7) — Nike cede
  plazo, no precio; el DFB cede control, no dinero, todavía.
```

**Moat Check:**
- Gate 4: sí — "el plazo, no el precio, fue lo que cedió Nike" es
  exactamente el tipo de reencuadre que `voice-and-style.md` §6 pide, no
  visible en el titular del comunicado original.
- Gate 6 (evidenciado): sí, con matiz — el dato del monto renegociado está
  atribuido a "SPORT BILD por fuentes de los clubes" (nivel 02, reporte de
  terceros), correctamente no presentado como hecho confirmado de nivel
  01. Esto es exactamente el tipo de matiz que el vocabulario
  sabemos/parece/podría de Cambio 6 hace explícito: **sabemos** que el
  plazo bajó de 7 a 4 años (varias fuentes coinciden), **parece** (según
  SPORT BILD) que el monto se mantuvo en €500,000 sin que el DFB o Nike lo
  hayan confirmado directamente en el material citado.

**Calificación: APROBADO**, con una nota de reedición menor que el sistema
nuevo sí habría pedido: la pieza publicada no marca explícitamente el nivel
02 del dato de SPORT BILD en la prosa (lo cita como fuente pero sin el
matiz "parece"/"sin confirmación directa de las partes"). Bajo el Moat
Check post-Cambio 6, eso es exactamente el tipo de ajuste de una línea que
entra en el máximo de cinco cambios concretos, no una reedición completa.

---

## Conclusión del ejercicio

En los tres casos, el criterio editorial de fondo ya era sólido — la
auditoría de la Fase 0 tenía razón al encontrar un sistema más maduro de lo
que el encargo original asumía. Lo que el Moat Playbook aporta sobre estas
tres piezas reales no es "arreglar" nada roto, es:

1. **Nombrar C explícitamente** cuando una pieza ya tiene la forma de Deep
   Dive (Casos 2 y 3), en vez de dejarla como una B que resultó larga —
   con el efecto práctico de que el router le asigna desde el inicio el
   presupuesto de devices y la arquitectura de secciones correctas.
2. **Hacer visible el nivel de evidencia en la prosa**, no solo en la
   atribución de la fuente (Caso 3) — el vocabulario
   sabemos/parece/podría/no sabemos todavía convierte una práctica ya
   correcta (atribuir bien) en una más legible para el lector.
3. **Confirmar, no corregir**, que el sistema previo ya sabía distinguir
   una pieza que se gana su Opinión (Caso 1) de una que no — el Moat Check
   es una segunda línea de verificación explícita sobre un criterio que ya
   funcionaba.
