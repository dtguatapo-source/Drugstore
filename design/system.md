# Sistema de diseño — Sistema Droguería Pili

Sincronizado a mano desde el código real. No hay tokens nuevos: todo lo de abajo existe hoy en el
repositorio y cada entrada nombra su archivo y línea de origen.

Fuentes leídas:

- `src/styles.css` — **única fuente global** de tokens, reset, tipografía, formularios, botones,
  tarjetas, tablas, alertas y la capa responsive (`@media (max-width: 768px)`).
- `src/app/app.css` — shell: header, navbar, enlaces, badge de usuario, footer.
- `src/app/pages/reports/reports.css` — extensión de página: KPIs, barras, tarjetas de reporte,
  badges de medicamento, indicador de carga.
- `src/app/pages/sales/sales.css` — extensión de página: grillas de venta, carrito y bloque de total.
- `src/app/shared/estado-carga/estado-carga.css` — línea `Cargando información…`.

## 1. Colores (16 tokens, `src/styles.css:12-36`)

| Token | Valor | Uso declarado en el código | Fuente |
| --- | --- | --- | --- |
| `--primary` | `#0d9488` | marca: botón primario, borde de foco, pestaña activa, `.kpi-value`, `.total-big-container h1` | `src/styles.css:14` |
| `--primary-hover` | `#0f766e` | hover de primario, texto sobre `--primary-soft` | `src/styles.css:15` |
| `--primary-soft` | `#ccfbf1` | superficies suaves: `.med-badge`, `.subtotal-mini`, logo, `.admin-badge` | `src/styles.css:17` |
| `--secondary` | `#0284c7` | enlaces, `.kpi-secondary`, extremo del degradado de barras | `src/styles.css:18` |
| `--bg-main` | `#f8fafc` | fondo de la app, hover de fila, fondo de `th`, `--input` readonly | `src/styles.css:21` |
| `--bg-surface` | `#ffffff` | tarjetas, inputs, header, botón secundario | `src/styles.css:22` |
| `--border-color` | `#e2e8f0` | bordes de tarjeta, inputs, separadores de tabla, pestaña inactiva | `src/styles.css:23` |
| `--text-title` | `#0f172a` | títulos `h1..h6`, celdas de precio, `.bar-amount` | `src/styles.css:26` |
| `--text-body` | `#334155` | texto por defecto, celdas, enlace de navegación | `src/styles.css:27` |
| `--text-muted` | `#64748b` | subtítulos, labels, `th`, `.section-title`, metadatos | `src/styles.css:28` |
| `--danger` | `#dc2626` | borde de `.status-banner`, botón de peligro, `.kpi-warning` | `src/styles.css:31` |
| `--danger-hover` | `#b91c1c` | hover de peligro y texto del banner de error | `src/styles.css:32` |
| `--danger-soft` | `#fee2e2` | fondo de `.status-banner` y de `.alerta` | `src/styles.css:33` |
| `--success` | `#059669` | borde izquierdo de `.alert-box.ok` | `src/styles.css:34` |
| `--warning` | `#b45309` | declarado, sin consumidores en CSS ni plantillas | `src/styles.css:35` |
| `--warning-soft` | `#fef3c7` | declarado, sin consumidores en CSS ni plantillas | `src/styles.css:36` |

Colores literales fuera de token, todos dentro de reglas del sistema:

- `#ffffff` como color de texto de `.btn-primary`, `.btn-danger` y `.alert-box button`
  (`src/styles.css:151`, `173`, `196`, `623`). Coincide en valor con `--bg-surface`, pero el código
  escribe el literal.
- `rgb(13 148 136 / 0.15)` — anillo de foco de inputs (`src/styles.css:338`).
- `rgb(0 0 0 / 0.4)` overlay de modal, `rgb(0 0 0 / 0.12)` sombra de `.search-results`,
  `rgb(0 0 0 / 0.2)` sombra de `.alert-box` (`src/styles.css`), `rgb(0 0 0 / 0.04)` sombra del
  header y `rgb(0 0 0 / 0.05)` sombra del footer (`src/app/app.css`), `rgb(255 255 255 / 0.86)`
  y `rgb(255 255 255 / 0.3)` en la pantalla de auth (`src/styles.css`),
  `rgb(15 23 42 / 0.28)` sombra de `.auth-card` (`src/styles.css:399`).

## 2. Tipografía

| Rol | Valor | Fuente |
| --- | --- | --- |
| Familia | `'Inter', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif` | `src/styles.css:66` |
| Webfont | `@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap')` | `src/styles.css:9` |
| Cuerpo | `14px` / `line-height 1.5` / `--text-body` | `src/styles.css:67-70` |
| Encabezados | `line-height 1.25`, color `--text-title` | `src/styles.css:79-82` |
| `h1` | `24px` / `800` (en `.auth-brand h1` sube a `28px`/`800`; en `.total-big-container h1` a `32px`/`900`) | `src/styles.css:84-87`, `src/styles.css:414-419`, `src/app/pages/sales/sales.css:110-114` |
| `h2` | `22px` / `700` | `src/styles.css:89-92` |
| `h3` | `16px` / `700` | `src/styles.css:94-97` |
| `p` | `14px` / `--text-body` | `src/styles.css:99-102` |
| `small` | `12px` / `--text-muted` | `src/styles.css:108-111` |
| `a` | color `--secondary` (en auth, `--primary-hover` al hover) | `src/styles.css:104-106` |
| `label`, `legend` | `12px` / `700` / `uppercase` / `letter-spacing .3px` | `src/styles.css:293-299` |
| `.section-title` | `12px` / `700` / `uppercase` / `letter-spacing .5px` | `src/styles.css:229-238` |
| `th` | `12px` / `700` / `uppercase` / `letter-spacing .5px` | `src/styles.css:349-359` |
| `.btn` | `14px` / `600` / `line-height 1` | `src/styles.css:120-128` |
| `.nav-link` | `14px` / `500`, padding `7px 12px` (sin token; valor de `src/app/app.css:54-67`) | `src/app/app.css:56` |
| `.kpi-label` | `11px` / `700` / `letter-spacing .05em` | `src/app/pages/reports/reports.css:41-46` |
| `.kpi-value` | `28px` / `800` | `src/app/pages/reports/reports.css:48-52` |
| `.kpi-meta` | `12px` / `--text-muted` | `src/app/pages/reports/reports.css:62-65` |
| `.bar-label strong` / `small` | `13px` / `11px` | `src/app/pages/reports/reports.css:84-92` |
| `.bar-amount` | `13px` / `700` | `src/app/pages/reports/reports.css:107-112` |
| `.section-note` | `12px` / `--text-muted` | `src/styles.css:241-245` |

## 3. Espaciado

| Token | Valor | Uso | Fuente |
| --- | --- | --- | --- |
| `--space-page` | `30px` | padding del contenedor de cada página (dashboard, inventario, compras, informes, ventas, proveedores) | `src/styles.css:44` |
| `--space-card` | `24px` | padding de `.card` | `src/styles.css:45`, `:221` |
| `--space-field` | `16px` | **declarado y sin consumidores** en ningún CSS del repositorio (sólo aparece la declaración) | `src/styles.css:46` |

Ritmo escrito como valor literal, sin token (gaps y paddings de página):

- `8px` gap de `.tabs` y de `.btn` (`src/styles.css:113`, `:220`).
- `12px` gap de `.status-banner`, `.date-inputs-row`, `.header-actions`, `.filter-actions-column`.
- `15px` gap de `.grid-row`, `.footer-actions`.
- `20px` gap de `.grid-row`, `.kpi-grid`, `.filter-grid`, `.grid-inputs-mini`, `.tabs` margin.
- `24px` margin de `.reports-header`, `.kpi-grid`, `.analytics-grid`, `.filters-container`.
- `25px` gap de `.top-grid` / `.bottom-grid` y `margin-bottom` de `.header-main` (`src/app/pages/sales/sales.css:10-22`).
- `30px` padding del contenedor de informes (`src/app/pages/reports/reports.css:1-7`) y `12px 24px` en el header del shell (`src/app/app.css:9`).

## 4. Radio

| Token | Valor | Uso | Fuente |
| --- | --- | --- | --- |
| `--radius-btn` | `8px` | `.btn`, inputs, `select`, `textarea`, `.status-banner`, `.tab`, `.alert-box button`, `.table-wrapper` | `src/styles.css:39` |
| `--radius-card` | `12px` | `.card`, `.auth-card`, `.alert-box`, `.search-results`, `.total-big-container` | `src/styles.css:40` |

Radios literales sin token: `999px` en `.bar-track`/`.bar-fill`, `.med-badge`, `.subtotal-mini`
y en `.admin-badge` (pastillas); `10px` en `.med-stock`; `50%` en `.logo-circulo`,
`.brand-logo` y el spinner de `.reports-loading`.

## 5. Sombras

| Token | Valor | Uso | Fuente |
| --- | --- | --- | --- |
| `--shadow-card` | `0 4px 6px -1px rgb(0 0 0 / 0.05), 0 2px 4px -2px rgb(0 0 0 / 0.05)` | `.card` | `src/styles.css:41` |

Sombras literales fuera de token, todas de una sola pieza de UI:

- header `0 2px 6px rgb(0 0 0 / 0.04)` (`src/app/app.css:10`)
- `.search-results` `0 10px 25px rgb(0 0 0 / 0.12)` (`src/styles.css:494`)
- `.auth-card` `0 24px 50px -24px rgb(15 23 42 / 0.28)` (`src/styles.css:399`)
- `.alert-box` `0 10px 25px rgb(0 0 0 / 0.2)` (`src/styles.css:608`)
- footer `0 -2px 10px rgb(0 0 0 / 0.05)` (`src/app/app.css:76`)
- foco de input `0 0 0 3px rgb(13 148 136 / 0.15)` (`src/styles.css:338`)

## 6. Reglas de componentes

| Componente | Comportamiento real | Fuente |
| --- | --- | --- |
| `.btn` | inline-flex, `height 40px`, `padding 0 18px`, `gap 8px`, radio `--radius-btn`, `14px/600`, `line-height 1`, `white-space nowrap`, transición de `background-color`, `border-color`, `color`, `opacity` a `0.15s ease` | `src/styles.css:112-138` |
| `.btn:disabled` | `opacity .55`, `cursor not-allowed` (lo usa `VER REPORTE` cuando el rango es inválido) | `src/styles.css:140-143` |
| `.btn-primary` | fondo y borde `--primary`, texto `#ffffff`; hover `--primary-hover` | `src/styles.css:145-154` |
| `.btn-secondary` | fondo `--bg-surface`, borde `--border-color`, texto `--text-body`; hover fondo `--bg-main` y texto `--text-title` | `src/styles.css:156-164` |
| `.btn-danger` | fondo y borde `--danger`, texto `#ffffff`; hover `--danger-hover` (botón de borrar del carrito) | `src/styles.css:166-174` |
| `.btn-block` | `width 100%` (`+ AGREGAR A LA VENTA`, `CONFIRMAR Y COBRAR`) | `src/styles.css:176-178` |
| `.tabs` / `.tab` | `.tabs` flex con `gap 8px` y `margin-bottom 20px`; `.tab` es un `.btn` cuyo color depende de `[aria-selected]`: `true` = primario, `false` = secundario | `src/styles.css:181-208` |
| `.card` | fondo `--bg-surface`, borde `--border-color`, radio `--radius-card`, `--shadow-card`, padding `--space-card` | `src/styles.css:213-219` |
| `.section-title` | bloque uppercase, `12px/700`, `letter-spacing .5px`, `--text-muted`, `border-bottom` de 1px, `margin-bottom 16px`, `padding-bottom 6px` | `src/styles.css:229-238` |
| `.section-note` | `12px`, `--text-muted`, `margin 4px 0 0` | `src/styles.css:241-245` |
| `.sr-only` | recorte accesible estándar (`1px`, `clip`, `nowrap`) | `src/styles.css:248-256` |
| `.status-banner` | flex con `space-between`, `gap 12px`, `padding 14px 18px`, borde `--danger`, radio `--radius-btn`, fondo `--danger-soft`, texto `--danger-hover`, `13px/500` | `src/styles.css:259-270` |
| `.field` | columna con `gap 6px`; label `12px/700` uppercase | `src/styles.css:275-299` |
| inputs / `select` / `textarea` | alto `40px` (`--input-height`), padding `0 12px` (`--input-padding`), borde `--border-color`, radio `--radius-btn`, foco `border-color --primary` + anillo `0 0 0 3px rgb(13 148 136 / 0.15)`; `readonly` fondo `--bg-main` y texto `--text-muted` | `src/styles.css:301-346` |
| tabla | `width 100%`, `border-collapse collapse`; `th` padding `12px 16px`, fondo `--bg-main`, uppercase `12px/700`; `td` padding `14px 16px`, borde inferior de 1px; `tbody tr:hover` fondo `--bg-main` | `src/styles.css:347-373` |
| `.table-wrapper` (y alias) | `overflow-x auto`, radio `--radius-btn` | `src/styles.css:376-386` |
| `.med-badge` | pastilla `--primary-soft` / `--primary-hover`, `12px/600`, padding `4px 10px` | `src/app/pages/reports/reports.css:172-180` |
| `.kpi-card` / `.kpi-value` | columna `gap 6px`; valor `28px/800` en `--primary`; variantes `--secondary` y `--danger` | `src/app/pages/reports/reports.css:39-65` |
| `.bar-track` / `.bar-fill` | pista `12px` de alto, fondo `--bg-main`, borde `--border-color`, radio `999px`; relleno `linear-gradient(90deg, --primary, --secondary)` | `src/app/pages/reports/reports.css:94-105` |
| `.report-card-box` / `.report-card-header` | tarjeta sin padding interno (`padding 0`, `overflow hidden`) con cabecera `padding 16px 24px` y borde inferior | `src/app/pages/reports/reports.css:154-165` |
| `.reports-loading` | tarjeta en línea con spinner de `14px` (`::before`, borde de `2px`), animación `reports-spin .8s linear infinite` | `src/app/pages/reports/reports.css:130-151` |
| `.cargando` | línea de `app-estado-carga`: `13px`, `--text-muted`, `margin 0 0 20px` | `src/app/shared/estado-carga/estado-carga.css:2-6` |
| `.alerta` / `.overlay` / `.alert-box` | aviso de error en línea, overlay `rgb(0 0 0 / 0.4)` y caja centrada con borde izquierdo `--danger` o `--success` | `src/styles.css:568-633` |
| nav | header blanco con borde inferior y sombra, `padding 12px 24px`, radio de enlaces `--radius-btn`, enlace `.activo` con fondo `--primary` y texto blanco, `.admin-badge` en pastilla `--primary-soft` de `13px/600` | `src/app/app.css:6-108` |

## 7. Responsive y movimiento

- Un solo breakpoint: `@media (max-width: 768px)` en `src/styles.css:660-750`. Apila `.top-grid`,
  `.bottom-grid`, `.grid-row`, `.header-main`, `.reports-header`, `.filter-grid`, `.date-inputs-row`,
  `.footer-actions` y los demás contenedores listados; fuerza `font-size 16px` en inputs y botones;
  `table { min-width: 700px }`; `h1, h2 { font-size: 20px; text-align: center }`;
  `.btn-primary, .btn-secondary { width: 100% }`; `.card { padding: 16px }`.
- Los dashboards de informes añaden su propio `@media (max-width: 768px)` para pasar `.kpi-grid` y
  `.analytics-grid` a una columna (`src/app/pages/reports/reports.css:194-197`).
- `@media (prefers-reduced-motion: reduce)` reduce animaciones y transiciones a `0.01ms`
  (`src/styles.css:753-760`).

## 8. Huecos declarados (lo que el sistema no tiene)

1. No hay token de espaciado para `20px`, `25px`, `12px`, `15px` ni `8px`: esos valores se escriben
   literales en `src/styles.css` y en los CSS de página. `--space-field: 16px` existe pero no se usa.
2. No hay token de altura de control: `40px` está en `.btn` y como valor por defecto de
   `--input-height` (`src/styles.css:305`), que sólo `src/app/pages/auth` reescribe (`auto`/`12px 16px`).
3. No hay token de radio para pastillas (`999px`) ni para `.admin-badge` (`15px`); se repiten literales.
4. No hay token tipográfico para los tamaños `11px`, `13px`, `18px`, `20px`, `22px`, `28px`, `32px`
   usados en informes, ventas y navbar.
5. No hay token de color para el texto blanco de botones: el código usa `#ffffff` literal.
6. `--warning` y `--warning-soft` están declarados y no se consumen.
7. La familia Inter llega por un `@import` externo; si la red falla, la app cae al stack de sistema.
   Los tableros de `design/` no pueden pedir fuentes remotas, así que usan exactamente esa misma
   declaración de familia (`'Inter', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif`) sin el
   `@import`, y por eso se ven con la fuente local del sistema.

## 9. Autocomprobación de los tableros
Colores usados por `design/system.html` y los tres tableros, extraídos con
`grep -o '#[0-9a-fA-F]\{3,8\}'`: `#0d9488`, `#0f766e`, `#ccfbf1`, `#0284c7`, `#f8fafc`, `#ffffff`,
`#e2e8f0`, `#0f172a`, `#334155`, `#64748b`, `#dc2626`, `#b91c1c`, `#fee2e2`, `#059669`, `#b45309`,
`#fef3c7`. Son los 16 tokens, ninguno ajeno al sistema. Los `rgb()` presentes son sólo los que el
código ya escribe: `rgb(13 148 136 / 0.15)` (anillo de foco), `rgb(0 0 0 / 0.04)` (sombra del header),
`rgb(0 0 0 / 0.05)` (`--shadow-card`) y `rgb(0 0 0 / 0.12)` (sombra de `.search-results`).

Familias tipográficas: una sola, `'Inter', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif`, más
`font-family: inherit` en botones e inputs como en `src/styles.css`.

Desviaciones encontradas y corregidas en esta sincronización:

1. Se había usado `'Consolas', monospace` para etiquetas de tokens; el sistema no tiene familia
   monoespaciada, así que se reemplazó por `inherit` en los cuatro archivos.
2. Los tableros escribían `<strong class="price-bold">` para el nombre del medicamento en las
   tablas de top: la plantilla real usa `<strong>` sin clase (`reports.html`), así que se quitó la
   clase para no cambiar el color real de esa celda.
3. La nota `.section-note` del modo Compras se había maquetado con `margin-bottom: 24px`; el
   componente real sólo declara `margin: 4px 0 0`, así que se dejó el valor real.

Nota de sincronización del shell: mientras se hacía esta sincronización, `src/app/app.css` tenía
cambios sin confirmar en el árbol de trabajo (header `12px 24px`, logo de `30px`, título `15px/700`,
enlaces `14px/500` con `gap 6px`, `.admin-badge` de `13px/600`, `.content` con `padding-top 16px`).
Los tableros de `design/` copian esos valores vigentes, que son los que la app muestra hoy; las
cifras de `src/styles.css` coinciden con lo confirmado en el repositorio.
