# El Marcador · revisión de la migración (58 registros)

Propuesta para pasar los 58 acuerdos de la tabla `deals` (Postgres) a `data/marcador.json` con el esquema v2 (`lib/marcador-schema.ts`). **No está aplicada.** Cuando la apruebes (con los cambios que marques), se genera el archivo y el sitio pasa a leerlo.

## Resumen

- Registros: **58**. `cumple_criterio: true`: **53**; `false`: **5** (se conservan en el archivo, no se muestran ni cuentan).
- Con monto: **18** (8 revelados, 10 reportados). Cada monto trae su frase fuente de la nota en `fuente_monto`.
- Alcance: mexico 9, latam 3, eeuu 21, europa 20, global 5.
- Las 58 URLs apuntan a notas publicadas (verificado).

## Reglas que apliqué

- **Tipo:** `inversion` → `propiedad`; `estadios` → `infraestructura`; los demás igual.
- **Estatus:** `confirmado` y `reportado` se conservan. Dos cambios: Khosla × Seahawks pasa a `anunciado` (la nota dice "sujeto a la aprobación de los dueños de la NFL").
- **Monto tipo:** "revelado" donde la tabla lo tenía como revelado; las cifras de prensa pasan a `reportado`. Ninguna cifra está como `estimado`, salvo la de Telemundo × Bundesliga (abajo).
- **Conversión:** recalculé cada monto con el tipo de cambio del BCE del día del anuncio (o el último hábil anterior). Coinciden con los montos actuales; CBF difiere en US$0.1M por redondeo.
- **País:** ISO de dos letras desde el campo país. "Internacional", "Europa" y "Centroamérica" quedan vacíos.
- **Dato principal (`dato_hero`):** el monto si existe; si no, las cifras clave capturadas (JD × Axo: 140+ tiendas); si no, la duración; si no, `null` (solo hace falta cuando el acuerdo sea el destacado).
- **Destacado y lectura:** JD Sports × Grupo Axo conserva `destacado_semana: true` (de su semana, la 38) y su lectura ya publicada como `lectura` aprobada.

## Tabla

| # | Fecha | Acuerdo | Tipo | Alcance | País | Monto US$M | Monto | Estatus | Cumple | Nota |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | 26 abr | [Grupo propietario de Columbus × NWSL](https://www.playbook.la/articulo/entrar-a-la-nwsl-ya-cuesta-us-205-millones-y-eso-reescribe-el-precio-del-deporte-femenil) | inversión → propiedad | **eeuu** | US | 205.0 | reportado | confirmado | ✅ | ⚠️ La nota no atribuye la cifra; la NWSL suele anunciar la cuota. Si la anunció la liga, pasa a "revelado". |
| 2 | 5 jul | [Gasol16 Ventures y Fortified Partners × Liga F](https://www.playbook.la/articulo/pau-gasol-pone-55m-en-la-liga-f-y-una-cuarta-parte-de-los-clubes-dice-que-no) | inversión → propiedad | **europa** | ES | 63.0 | revelado | confirmado | ✅ |  |
| 3 | 14 jul | [Familia Khosla × Seattle Seahawks](https://www.playbook.la/articulo/seahawks-khosla-record-nfl) | inversión → propiedad | **eeuu** | US | 9,612.0 | reportado | anunciado | ✅ | ⚠️ "Sujeto a la aprobación formal de los dueños de la NFL": anunciado. El resumen anterior menciona co-dueños mexicanos (Hevia Baillères, Aramburuzabala) que la nota no dice; si se confirma, el alcance sería "mexico". La nota no atribuye la cifra: queda "reportado". |
| 4 | 16 jul | [Versant × Bundesliga](https://www.playbook.la/articulo/bundesliga-derechos-eeuu-versant) | derechos | **eeuu** | US | N/R | nr | confirmado | ✅ |  |
| 5 | 21 jul | [NBCUniversal × Bundesliga](https://www.playbook.la/articulo/telemundo-se-queda-con-los-derechos-en-espanol-de-la-bundesliga-en-ee-uu) | derechos | **eeuu** | US | N/R | nr | confirmado | ✅ | ⚠️ El registro anterior sumaba US$30M (US$10M × 3 temporadas): eso es una estimación interna. La nota da "una inversión estimada de US$10 millones por temporada". Propuesta: monto N/R y la cifra por temporada como dato principal. |
| 6 | 23 jul | [BYD × PSG](https://www.playbook.la/articulo/byd-se-convierte-en-socio-automotriz-oficial-del-psg-hasta-2029) | patrocinio | **europa** | FR | N/R | nr | confirmado | ✅ |  |
| 7 | 23 jul | [Albert × Los Angeles Lakers](https://www.playbook.la/articulo/los-lakers-firman-a-albert-como-nuevo-patrocinador-de-parche-por-us-30-millones-al-ano) | patrocinio | **eeuu** | US | N/R | nr | confirmado | ✅ | ⚠️ El resumen da "más de US$30 millones por temporada": es valor anual, no total. Queda N/R; puede ir como dato principal si lo quieres. |
| 8 | 23 jul | [NBCUniversal × UEFA](https://www.playbook.la/articulo/telemundo-se-lleva-la-champions-league-en-espanol) | derechos | **eeuu** | US | N/R | nr | confirmado | ✅ |  |
| 9 | 4 ago | [Aeroméxico × NFL](https://www.playbook.la/articulo/aeromexico-y-la-nfl-firman-alianza-comercial-a-tres-anos) | patrocinio | **mexico** | MX | N/R | nr | confirmado | ✅ |  |
| 10 | 6 ago | [Emirates × Arsenal](https://www.playbook.la/articulo/arsenal-renueva-con-emirates-por-70-millones-al-ano-el-patrocinio-mas-grande-de-la-premier-league) | patrocinio | **europa** | GB | N/R | nr | confirmado | ✅ | ⚠️ SportsPro reporta hasta £70 millones al año (valor anual): N/R como monto total. |
| 11 | 9 ago | [IMG × WTA](https://www.playbook.la/articulo/la-wta-le-entrega-a-img-la-produccion-de-50-torneos) | derechos | **global** | — | N/R | nr | confirmado | ✅ | ⚠️ Incluye tres torneos en México: por la regla literal podría ser "mexico". Propongo "global" porque el acuerdo cubre 50+ torneos en el mundo. |
| 12 | 10 ago | [Amit Bhatia, Jeff Bezos y Eduardo Saverin × Liverpool](https://www.playbook.la/articulo/bezos-y-saverin-cerca-de-comprar-un-tercio-del-liverpool-por-us-6-000-millones) | inversión → propiedad | **europa** | GB | N/R | nr | reportado | ✅ | ⚠️ US$6,000 millones es la valuación del club, no el precio del 30%: N/R. |
| 13 | 11 ago | [Google × FC Barcelona](https://www.playbook.la/articulo/google-convierte-al-barca-en-laboratorio-de-gemini-y-pixel) | patrocinio | **europa** | ES | N/R | nr | confirmado | ✅ |  |
| 14 | 11 ago | [Polymarket × ATP Tour](https://www.playbook.la/articulo/polymarket-sera-el-mercado-de-predicciones-oficial-del-atp-tour) | derechos | **global** | — | N/R | nr | confirmado | ✅ |  |
| 15 | 11 ago | [Disney+ y ESPN × Fórmula E](https://www.playbook.la/articulo/disney-transmitira-la-formula-e-en-144-territorios-desde-diciembre) | derechos | **global** | — | N/R | nr | confirmado | ✅ |  |
| 16 | 11 ago | [Apollo Sports Capital × Yankee Global Enterprises](https://www.playbook.la/articulo/apollo-pone-us-2-600-millones-en-los-yankees-y-se-queda-con-un-asiento-en-el-consejo) | inversión → propiedad | **eeuu** | US | 2,600.0 | revelado | confirmado | ✅ |  |
| 17 | 12 ago | [Josh Kushner y Bob Iger × Los Angeles Lakers](https://www.playbook.la/articulo/kushner-e-iger-compran-los-lakers-en-us-12-500-millones) | inversión → propiedad | **eeuu** | US | 12,500.0 | reportado | reportado | ✅ |  |
| 18 | 13 ago | [Canva × Como 1907](https://www.playbook.la/articulo/canva-firma-con-el-como-1907-su-primer-patrocinio-de-futbol) | patrocinio | **europa** | IT | N/R | nr | confirmado | ✅ |  |
| 19 | 17 ago | [José E. Feliciano y Kwanza Jones × San Diego Padres](https://www.playbook.la/articulo/mlb-aprueba-la-venta-de-los-padres-a-jose-feliciano-en-us-3-900-millones-record-de-la-liga) | inversión → propiedad | **eeuu** | US | 3,900.0 | reportado | confirmado | ✅ | ⚠️ La nota no atribuye la cifra; MLB aprobó la venta pero no la publicó. Queda "reportado". |
| 20 | 18 ago | [Black Clover × LFA Finsus](https://www.playbook.la/articulo/la-lfa-licencia-sus-gorras-a-black-clover-y-controla-la-venta) | retail | **mexico** | MX | N/R | nr | confirmado | ✅ |  |
| 21 | 20 ago | [Arctos Partners × Atlanta Falcons](https://www.playbook.la/articulo/arctos-compra-10-de-los-falcons-y-los-valua-en-mas-de-us-10-000-millones) | inversión → propiedad | **eeuu** | US | N/R | nr | reportado | ✅ | ⚠️ El 20 oct la NFL aprobó la venta (7.5%, no 10%): ver el backfill, que propone actualizar este registro. |
| 22 | 20 ago | [Amazon Prime Video × Selección Mexicana](https://www.playbook.la/articulo/amazon-se-queda-con-los-38-partidos-de-local-del-tri-camino-al-mundial-2030-pero-no-en-exclusiva) | derechos | **mexico** | MX | N/R | nr | confirmado | ✅ |  |
| 23 | 21 ago | [Marc Stad × Timberwolves y Lynx](https://www.playbook.la/articulo/marc-stad-toma-el-control-de-los-timberwolves-en-us-4-500-millones) | inversión → propiedad | **eeuu** | US | N/R | nr | confirmado | ✅ | ⚠️ US$4,500 millones es la valuación de las franquicias, no lo pagado: N/R. |
| 24 | 24 ago | [Kalshi × Dodgers y Red Sox](https://www.playbook.la/articulo/kalshi-patrocina-a-los-dodgers-y-los-red-sox-sin-decirlo) | patrocinio | **eeuu** | US | N/R | nr | reportado | ✅ | ⚠️ Patrocinio activado sin comunicado: la fuente es la observación de Playbook. ¿Basta como fuente verificable? |
| 25 | 25 ago | [Grupo inversor de Müller, Hummels y Sommer × Estrela da Amadora](https://www.playbook.la/articulo/muller-hummels-y-sommer-compran-el-estrela-da-amadora-en-40m) | inversión → propiedad | **europa** | PT | 46.6 | reportado | confirmado | ✅ |  |
| 26 | 26 ago | [DAZN × EverPass Media](https://www.playbook.la/articulo/dazn-controla-la-venta-de-sunday-ticket-a-bares-y-restaurantes) | inversión → propiedad | **eeuu** | US | N/R | nr | confirmado | ✅ |  |
| 27 | 26 ago | [Roku × NWSL](https://www.playbook.la/articulo/nwsl-cambia-a-victory-por-roku-para-sus-partidos-dominicales) | derechos | **eeuu** | US | N/R | nr | confirmado | ✅ |  |
| 28 | 26 ago | [Ten Pillars Sports Fund × Unrivaled](https://www.playbook.la/articulo/unrivaled-casi-duplica-su-valuacion-a-us-650-millones) | inversión → propiedad | **eeuu** | US | 100.0 | revelado | confirmado | ✅ |  |
| 29 | 26 ago | [Real Madrid × GP de España](https://www.playbook.la/articulo/real-madrid-patrocina-el-gp-de-espana-y-aporta-valdebebas) | patrocinio | **europa** | ES | N/R | nr | confirmado | ❌ | ⚠️ "Local Event Supporter": categoría menor y el aporte es en especie (Valdebebas). Propongo false. |
| 30 | 28 ago | [Claro Sports × Selección Mexicana](https://www.playbook.la/articulo/claro-sports-se-suma-el-tri-ya-se-reparte-en-seis-pantallas) | derechos | **mexico** | MX | N/R | nr | confirmado | ✅ |  |
| 31 | 31 ago | [Kalshi × US Open](https://www.playbook.la/articulo/kalshi-le-cierra-la-puerta-a-polymarket-en-el-us-open) | patrocinio | **eeuu** | US | N/R | nr | confirmado | ✅ |  |
| 32 | 31 ago | [Ronaldo y Roberto Carlos × Inter de Limeira](https://www.playbook.la/articulo/ronaldo-compra-otro-club-y-ya-sabe-como-puede-terminar-esto) | inversión → propiedad | **latam** | BR | N/R | nr | confirmado | ✅ | ⚠️ R$454 millones es un plan de inversión anunciado (solo R$20M comprometidos), no el precio: N/R. |
| 33 | 31 ago | [FOX × izzi y Sky](https://www.playbook.la/articulo/fox-toma-el-lugar-que-dejo-fox-sports-en-izzi-y-sky) | derechos | **mexico** | MX | N/R | nr | confirmado | ✅ | ⚠️ Es distribución de canales (FOX y FOX+ en izzi y Sky), no derechos de un evento. Propongo true como "derechos"; dime si prefieres excluirlo. |
| 34 | 1 sep | [Circle × Chelsea](https://www.playbook.la/articulo/chelsea-ficha-a-circle-y-su-stablecoin-usdc-como-patrocinador) | patrocinio | **europa** | GB | N/R | nr | confirmado | ✅ |  |
| 35 | 1 sep | [Deloitte × Billie Jean King Enterprises](https://www.playbook.la/articulo/deloitte-se-alia-con-billie-jean-king-para-el-deporte-femenil) | patrocinio | **eeuu** | US | N/R | nr | confirmado | ❌ | ⚠️ Alianza de formación de liderazgo: no es patrocinio de camiseta, naming ni oficial de liga. Propongo false. |
| 36 | 1 sep | [NBCUniversal × Serie A](https://www.playbook.la/articulo/telemundo-se-queda-con-la-serie-a-en-espanol-hasta-2029) | derechos | **eeuu** | US | N/R | nr | confirmado | ✅ |  |
| 37 | 1 sep | [Stan Kroenke × Los Angeles Angels](https://www.playbook.la/articulo/kroenke-compra-los-angels-a-moreno-en-record-de-us-4-000-millones) | inversión → propiedad | **eeuu** | US | 4,000.0 | reportado | confirmado | ✅ |  |
| 38 | 1 sep | [Kansas City Chiefs × Hunt Midwest](https://www.playbook.la/articulo/kansas-se-queda-con-los-chiefs-y-su-estadio-de-us-4-500m) | estadios → infraestructura | **eeuu** | US | 4,500.0 | revelado | confirmado | ❌ | ⚠️ Tu nota: parece inmobiliario. A favor de true: es infraestructura con operador deportivo (estadio de los Chiefs). En contra: el monto incluye sede y distritos comerciales. Propongo false hasta que decidas. |
| 39 | 2 sep | [Hard Rock × GP de Miami](https://www.playbook.la/articulo/hard-rock-releva-a-crypto-com-como-title-sponsor-del-gp-de-miami) | patrocinio | **eeuu** | US | N/R | nr | confirmado | ✅ |  |
| 40 | 2 sep | [Lottomatica × Cirsa](https://www.playbook.la/articulo/lottomatica-compra-cirsa-por-2-800m-y-nace-un-gigante-de-apuestas) | inversión → propiedad | **europa** | ES | 3,241.8 | revelado | confirmado | ❌ | ⚠️ M&A entre operadores de apuestas: no entra (como indicaste). |
| 41 | 3 sep | [Starbucks × Toulouse FC](https://www.playbook.la/articulo/starbucks-debuta-en-camisetas-de-futbol-con-el-toulouse) | patrocinio | **europa** | FR | N/R | nr | confirmado | ✅ |  |
| 42 | 3 sep | [Nike × London City Lionesses](https://www.playbook.la/articulo/nike-rompe-el-record-de-patrocinio-femenil-con-london-city) | patrocinio | **europa** | GB | N/R | nr | confirmado | ✅ | ⚠️ CityAM: unas £3 millones por temporada (valor anual): N/R como total. |
| 43 | 4 sep | [Sports Alpha Capital × Northampton Town](https://www.playbook.la/articulo/pato-forma-parte-del-grupo-que-compro-al-northampton-town) | inversión → propiedad | **europa** | GB | N/R | nr | confirmado | ✅ |  |
| 44 | 4 sep | [Strauss × UEFA](https://www.playbook.la/articulo/strauss-compra-mas-uefa-justo-cuando-hisense-compra-menos) | patrocinio | **europa** | — | N/R | nr | confirmado | ✅ |  |
| 45 | 8 sep | [Turkish Airlines × Liverpool](https://www.playbook.la/articulo/el-liverpool-elige-a-turkish-airlines-por-mas-de-60m) | patrocinio | **europa** | GB | 406.4 | reportado | confirmado | ✅ |  |
| 46 | 8 sep | [Lionel Messi × CD Eldense](https://www.playbook.la/articulo/messi-pacta-comprar-el-eldense-por-mas-de-10-millones) | inversión → propiedad | **europa** | ES | 11.6 | reportado | reportado | ✅ | ⚠️ "Por encima de" €10 millones y ninguna parte lo confirmó: reportado como mínimo. |
| 47 | 8 sep | [L Catterton × HYROX](https://www.playbook.la/articulo/hyrox-ya-tiene-un-camino-real-hacia-los-juegos-olimpicos) | inversión → propiedad | **global** | — | N/R | nr | confirmado | ✅ | ⚠️ €600 millones es la valuación de HYROX (Bloomberg), no el precio: N/R; va como dato principal. |
| 48 | 9 sep | [Wilson × LFA Finsus](https://www.playbook.la/articulo/wilson-se-queda-con-el-balon-de-la-lfa-hasta-2028) | patrocinio | **mexico** | MX | N/R | nr | confirmado | ✅ |  |
| 49 | 10 sep | [Codere Online × NFL](https://www.playbook.la/articulo/la-nfl-le-vende-sus-apuestas-en-mexico-a-codere) | patrocinio | **mexico** | MX | N/R | nr | confirmado | ✅ |  |
| 50 | 10 sep | [Globo, Amazon y ESPN × CBF](https://www.playbook.la/articulo/cbf-vende-la-copa-do-brasil-por-r-4-000m-y-deja-a-cazetv-afuera) | derechos | **latam** | BR | 780.5 | revelado | confirmado | ✅ |  |
| 51 | 11 sep | [Team México × Las Vegas Raiders](https://www.playbook.la/articulo/team-mexico-apuesta-por-raiders-no-por-la-nfl) | patrocinio | **mexico** | MX | N/R | nr | confirmado | ✅ |  |
| 52 | 12 sep | [Colin Cowherd × Ipswich Town](https://www.playbook.la/articulo/colin-cowherd-conductor-de-fs1-compra-parte-del-ipswich-town) | inversión → propiedad | **europa** | GB | N/R | nr | confirmado | ✅ |  |
| 53 | 14 sep | [Telefónica × DAZN](https://www.playbook.la/articulo/telefonica-paga-18-mas-a-dazn-por-distribuir-laliga) | derechos | **europa** | ES | 1,905.9 | revelado | confirmado | ✅ |  |
| 54 | 14 sep | [FOX × Concacaf](https://www.playbook.la/articulo/fox-llena-de-selecciones-la-senal-que-le-compro-a-tigo-sports) | derechos | **latam** | — | N/R | nr | confirmado | ✅ | ⚠️ "Siete países de Centroamérica" sin nombrarlos: país vacío hasta confirmarlos. |
| 55 | 16 sep | [Adidas × Benfica](https://www.playbook.la/articulo/adidas-duplica-su-pago-al-benfica-a-120m-y-se-queda-con-el-naming-de-su-academia) | patrocinio | **europa** | PT | 138.4 | reportado | confirmado | ✅ | ⚠️ La nota no atribuye la cifra a las partes: "reportado". |
| 56 | 16 sep | [Clearlake Capital × Chelsea](https://www.playbook.la/articulo/clearlake-se-queda-con-chelsea) | inversión → propiedad | **europa** | GB | 1,278.3 | reportado | confirmado | ✅ |  |
| 57 | 17 sep | [EQT × Fever](https://www.playbook.la/articulo/fever-levanta-us-250-millones-apostando-a-que-el-deporte-en-vivo-no-lo-reemplaza-la-ia) | inversión → propiedad | **global** | — | 250.0 | revelado | confirmado | ❌ | ⚠️ Fever es una plataforma de entretenimiento en vivo en general, no deportiva. Propongo false. |
| 58 | 21 sep | [JD Sports × Grupo Axo](https://www.playbook.la/articulo/grupo-axo-trae-a-jd-sports-a-mexico-con-140-tiendas) | retail | **mexico** | MX | N/R | nr | confirmado | ✅ |  |

## Dudosos: necesito tu decisión

Marcados con ⚠️ en la tabla. Los que más pesan:

- **#3 Familia Khosla × Seattle Seahawks** — propongo `cumple_criterio: true`, alcance `eeuu`. "Sujeto a la aprobación formal de los dueños de la NFL": anunciado. El resumen anterior menciona co-dueños mexicanos (Hevia Baillères, Aramburuzabala) que la nota no dice; si se confirma, el alcance sería "mexico". La nota no atribuye la cifra: queda "reportado".
- **#5 NBCUniversal × Bundesliga** — propongo `cumple_criterio: true`, alcance `eeuu`. El registro anterior sumaba US$30M (US$10M × 3 temporadas): eso es una estimación interna. La nota da "una inversión estimada de US$10 millones por temporada". Propuesta: monto N/R y la cifra por temporada como dato principal.
- **#11 IMG × WTA** — propongo `cumple_criterio: true`, alcance `global`. Incluye tres torneos en México: por la regla literal podría ser "mexico". Propongo "global" porque el acuerdo cubre 50+ torneos en el mundo.
- **#24 Kalshi × Dodgers y Red Sox** — propongo `cumple_criterio: true`, alcance `eeuu`. Patrocinio activado sin comunicado: la fuente es la observación de Playbook. ¿Basta como fuente verificable?
- **#29 Real Madrid × GP de España** — propongo `cumple_criterio: false`, alcance `europa`. "Local Event Supporter": categoría menor y el aporte es en especie (Valdebebas). Propongo false.
- **#33 FOX × izzi y Sky** — propongo `cumple_criterio: true`, alcance `mexico`. Es distribución de canales (FOX y FOX+ en izzi y Sky), no derechos de un evento. Propongo true como "derechos"; dime si prefieres excluirlo.
- **#35 Deloitte × Billie Jean King Enterprises** — propongo `cumple_criterio: false`, alcance `eeuu`. Alianza de formación de liderazgo: no es patrocinio de camiseta, naming ni oficial de liga. Propongo false.
- **#38 Kansas City Chiefs × Hunt Midwest** — propongo `cumple_criterio: false`, alcance `eeuu`. Tu nota: parece inmobiliario. A favor de true: es infraestructura con operador deportivo (estadio de los Chiefs). En contra: el monto incluye sede y distritos comerciales. Propongo false hasta que decidas.
- **#40 Lottomatica × Cirsa** — propongo `cumple_criterio: false`, alcance `europa`. M&A entre operadores de apuestas: no entra (como indicaste).
- **#57 EQT × Fever** — propongo `cumple_criterio: false`, alcance `global`. Fever es una plataforma de entretenimiento en vivo en general, no deportiva. Propongo false.

## Montos y su fuente

| # | Acuerdo | US$M | Tipo | Fuente |
|---|---|---|---|---|
| 1 | Grupo propietario de Columbus × NWSL | 205.0 | reportado | Nota Playbook 26 abr 2026: "cuota de expansión de US$205 millones" |
| 2 | Gasol16 Ventures y Fortified Partners × Liga F | 63.0 | revelado | Nota Playbook 5 jul 2026: "pondrán €55 millones durante los próximos cuatro años" · conversión BCE 2026-07-03: 1 EUR = 1.1448 USD |
| 3 | Familia Khosla × Seattle Seahawks | 9,612.0 | reportado | Nota Playbook 14 jul 2026: "acordó comprar los Seattle Seahawks por US$9,612 millones" |
| 16 | Apollo Sports Capital × Yankee Global Enterprises | 2,600.0 | revelado | Nota Playbook 11 ago 2026: "US$2,600 millones — la inyección de Apollo a la sociedad dueña de los Yankees" |
| 17 | Josh Kushner y Bob Iger × Los Angeles Lakers | 12,500.0 | reportado | Nota Playbook 12 ago 2026: "acordaron comprar a Los Angeles Lakers en US$12,500 millones, según ESPN" |
| 19 | José E. Feliciano y Kwanza Jones × San Diego Padres | 3,900.0 | reportado | Nota Playbook 17 ago 2026: "Feliciano y su esposa Kwanza Jones en US$3,900 millones" |
| 25 | Grupo inversor de Müller, Hummels y Sommer × Estrela da Amadora | 46.6 | reportado | Nota Playbook 25 ago 2026: "compró el 90% del Estrela da Amadora por €40 millones" · conversión BCE 2026-08-25: 1 EUR = 1.1662 USD |
| 28 | Ten Pillars Sports Fund × Unrivaled | 100.0 | revelado | Nota Playbook 26 ago 2026: "superó su meta de US$100 millones" |
| 37 | Stan Kroenke × Los Angeles Angels | 4,000.0 | reportado | Nota Playbook 1 sep 2026: "fuentes consultadas por ESPN sitúan la operación en US$4,000 millones" |
| 38 | Kansas City Chiefs × Hunt Midwest | 4,500.0 | revelado | Nota Playbook 1 sep 2026: "La inversión de capital combinada llega a US$4,500 millones" |
| 40 | Lottomatica × Cirsa | 3,241.8 | revelado | Nota Playbook 2 sep 2026: "intercambio de acciones valuado en €2,800 millones" · conversión BCE 2026-09-02: 1 EUR = 1.1578 USD |
| 45 | Turkish Airlines × Liverpool | 406.4 | reportado | Nota Playbook 8 sep 2026: "más de £300 millones en total" · conversión BCE 2026-09-08: 1 EUR = 1.1614 USD = 0.8574 GBP |
| 46 | Lionel Messi × CD Eldense | 11.6 | reportado | Nota Playbook 8 sep 2026: "Varios medios españoles ubican la valuación por encima de los €10 millones" · conversión BCE 2026-09-08: 1 EUR = 1.1614 USD |
| 50 | Globo, Amazon y ESPN × CBF | 780.5 | revelado | Nota Playbook 10 sep 2026: "por más de R$4.000 millones" · conversión BCE 2026-09-10: 1 EUR = 1.1616 USD = 5.9528 BRL |
| 53 | Telefónica × DAZN | 1,905.9 | revelado | Nota Playbook 14 sep 2026: "Telefónica acordó con DAZN pagar €1,650 millones" · conversión BCE 2026-09-14: 1 EUR = 1.1551 USD |
| 55 | Adidas × Benfica | 138.4 | reportado | Nota Playbook 16 sep 2026: "por €120 millones en seis años" · conversión BCE 2026-09-16: 1 EUR = 1.1537 USD |
| 56 | Clearlake Capital × Chelsea | 1,278.3 | reportado | Nota Playbook 16 sep 2026: "recibirán £950 millones (US$1,300 millones) en efectivo por su parte" · conversión BCE 2026-09-16: 1 EUR = 1.1537 USD = 0.8574 GBP |
| 57 | EQT × Fever | 250.0 | revelado | Nota Playbook 17 sep 2026: "una ronda de US$250 millones en capital primario" |
