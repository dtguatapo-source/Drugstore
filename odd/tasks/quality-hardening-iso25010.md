# Quality hardening for ISO 25010 evaluation

Branch `feature/mejora-estilos-proveedores`. No `main` changes. Closes the five blocks the user authorized after a read-only audit of the frontend.

## Specs

- **S1** — "Haz los commits limpios (Conventional Commits) de los 8 archivos pendientes actuales para asegurar el trabajo previo."
- **S2** — "Elimina por completo el chat de IA en `src/app/pages/sales` (`sales.html`, `sales.ts`, `sales.spec.ts`) y elimina `src/app/services/ai.service.ts` (y su spec si existe) para erradicar la API key expuesta y los estilos inline fuera de paleta."
- **S3** — "En `auth.guard.ts`: valida no solo `login`, sino que exista un JWT válido y que su claim `exp` no esté vencido (si venció o es inválido, limpia las claves de sesión y redirige a `/login`)."
- **S4** — "En `dashboard.ts` (`salir()`): limpia `login`, `token` y `user` de `localStorage`."
- **S5** — "Agrega el indicador visual de carga cuando `cargando()` esté activo."
- **S6** — "Alinea `.report-custom-table` con las tablas del sistema global, quita `ViewEncapsulation.None` si ya no es necesario y unifica el breakpoint responsive con el estándar del proyecto."
- **S7** — "Estados de carga y error en los demás servicios/páginas (`MedicineService`, `SalesService`, `PurchaseService`, `SupplierService`) usando `.status-banner` global para que ninguna pantalla falle en silencio si el backend no responde."
- **S8** — "Ejecuta `npm run build` y los tests al cierre de cada bloque, haz los commits de cada unidad de trabajo y actualiza Engram al finalizar."
- **S9** — "Autorizo el plan completo en la rama actual (`feature/mejora-estilos-proveedores`, sin tocar `main`)."
- **S10** — "Apenas el usuario entre a `/reports`, debe ver de inmediato las gráficas generales (ventas del día / ventas por fecha y top medicamentos) y la tabla general con los registros recientes, sin que la pantalla abajo esté vacía esperando un filtro."
- **S11** — "Si el usuario elige un medicamento en el buscador o un rango de fechas (\"Desde / Hasta\") y filtra, la gráfica y la tabla deben actualizarse mostrando la tendencia y los datos de ese medicamento/rango; y al darle a \"Limpiar\", vuelve a la vista general de toda la droguería."
- **S12** — "Agrega un selector de pestaña o botones en Informes para alternar entre \"Informe de Ventas\" e \"Informe de Compras\" (o comparativa Ventas vs Compras), aprovechando `SalesService` y `PurchaseService` junto con `/reports/summary`, para que podamos analizar y exportar a Excel tanto las Ventas como las Compras."
- **S13** — "Autorizo que lo corrijas conectándolo correctamente en `sales.html` y `sales.ts`, pero agrégale validación estricta (no puede ser negativo ni superar el 50% del subtotal para que jamás deje una venta en $0, cumpliendo la observación M2 del profesor)."
- **S14** — "Termina los bloques en curso y luego aplica esta mejora de Informes y el fix de descuento con sus tests y commits."

## Tasks

- **T1** — Baseline: record pre-existing failing tests before any edit. Commit
- **T2** — S1: two Conventional Commits over the eight pending files. Commit `chore`/`feat(reports)`/`fix(auth)`
- **T3** — S2: delete the sales AI chat, its signals, and `ai.service.ts`. Commit `refactor(sales)`
- **T4** — S3+S4: JWT `exp` validation in the guard, full session cleanup on logout, tests first. Commit `feat(auth)`
- **T5** — S5+S6: reports loading indicator, table base styles, encapsulation, 768px breakpoint. Commit `fix(reports)`
- **T6** — S7: loading/error state across Medicine/Sales/Purchase/Supplier services and their pages. Commit `feat(services)`
- **T7** — S8: final build + tests, feature document, Engram update. Commit
- **T9** — S10+S11: general view on load (charts + recent records) and filter/Limpiar round trip in reports. Commit `feat(reports)`
- **T10** — S12: Ventas / Compras mode selector with Excel export for both. Commit `feat(reports)`
- **T11** — S13: bind the discount field with 0..50% validation. Commit `fix(sales)`
- **T12** — S14+S8: final build + tests, document, Engram. Commit

## Log

- **L1** — "Hola Gentleman. Ya estoy trabajando desde Gentle Shell en mi proyecto frontend de Angular (Drugstore).

  Primero, en modo lectura:
  1. Consulta la memoria de Engram del proyecto `drugstore` y `backend` para recordar los avances que ya hicimos (unificación de estilos en src/styles.css, módulo de proveedores, mejoras en compras y los nuevos endpoints /reports del backend).
  2. Revisa el estado actual del frontend y dime qué opinas de cómo va el proyecto, qué detalles ves pendientes por pulir (como quitar el chat de IA de ventas en sales y mejorar la vista de reports) y qué me recomiendas hacer primero.

  hola"
- **L2** — "Gentleman, tu diagnóstico y el orden de tus 5 puntos son impecables. El profesor evaluará el proyecto con un agente auditor bajo criterios estrictos de calidad (ISO 25010: seguridad, confiabilidad/manejo de fallos, usabilidad, accesibilidad y mantenibilidad) y quiero que todo quede perfecto para un 5.0.

  Autorizo el plan completo en la rama actual (`feature/mejora-estilos-proveedores`, sin tocar `main`). Ejecútalo paso a paso en este orden:

  1. Haz los commits limpios (Conventional Commits) de los 8 archivos pendientes actuales para asegurar el trabajo previo.
  2. Elimina por completo el chat de IA en `src/app/pages/sales` (`sales.html`, `sales.ts`, `sales.spec.ts`) y elimina `src/app/services/ai.service.ts` (y su spec si existe) para erradicar la API key expuesta y los estilos inline fuera de paleta.
  3. Fortalece la seguridad de sesión en Frontend:
     - En `auth.guard.ts`: valida no solo `login`, sino que exista un JWT válido y que su claim `exp` no esté vencido (si venció o es inválido, limpia las claves de sesión y redirige a `/login`).
     - En `dashboard.ts` (`salir()`): limpia `login`, `token` y `user` de `localStorage`.
  4. Pulido final de `reports`:
     - Agrega el indicador visual de carga cuando `cargando()` esté activo.
     - Alinea `.report-custom-table` con las tablas del sistema global, quita `ViewEncapsulation.None` si ya no es necesario y unifica el breakpoint responsive con el estándar del proyecto.
  5. Estados de carga y error en los demás servicios/páginas (`MedicineService`, `SalesService`, `PurchaseService`, `SupplierService`) usando `.status-banner` global para que ninguna pantalla falle en silencio si el backend no responde.

  Ejecuta `npm run build` y los tests al cierre de cada bloque, haz los commits de cada unidad de trabajo y actualiza Engram al finalizar. ¡Adelante!"
- **L3** — Baseline evidence: `npx ng test --watch=false` → 8/10 passing; the 2 failures are the pre-existing scaffolding specs (`app.spec.ts`, `dashboard.spec.ts`, `NG0201: No provider found for ActivatedRoute`). `npm run build` exits 0 with only the pre-existing 500 kB initial-bundle warning. These are the regression reference points: any other failure is ours.
- **L4** — "Gentleman, continúa con el cierre de los bloques pendientes (T5 y T6) y además quiero que evolucionemos el módulo de Informes (`src/app/pages/reports`) para que sea mucho más completo e intuitivo:

  1. Vista General Inmediata en Informes (sin obligar a buscar primero):
     - Apenas el usuario entre a `/reports`, debe ver de inmediato las gráficas generales (ventas del día / ventas por fecha y top medicamentos) y la tabla general con los registros recientes, sin que la pantalla abajo esté vacía esperando un filtro.
     - Si el usuario elige un medicamento en el buscador o un rango de fechas (\"Desde / Hasta\") y filtra, la gráfica y la tabla deben actualizarse mostrando la tendencia y los datos de ese medicamento/rango; y al darle a \"Limpiar\", vuelve a la vista general de toda la droguería.

  2. Selector de Modo: Ventas y Compras en Informes:
     - Agrega un selector de pestaña o botones en Informes para alternar entre \"Informe de Ventas\" e \"Informe de Compras\" (o comparativa Ventas vs Compras), aprovechando `SalesService` y `PurchaseService` junto con `/reports/summary`, para que podamos analizar y exportar a Excel tanto las Ventas como las Compras.

  3. Sobre el hallazgo del campo \"Descuento\" en `sales`:
     - Autorizo que lo corrijas conectándolo correctamente en `sales.html` y `sales.ts`, pero agrégale validación estricta (no puede ser negativo ni superar el 50% del subtotal para que jamás deje una venta en $0, cumpliendo la observación M2 del profesor).

  Termina los bloques en curso y luego aplica esta mejora de Informes y el fix de descuento con sus tests y commits."
- **L5** — Decision recorded on the Compras report: the backend `/reports/*` endpoints are sales-only, and `reports.service.ts` counts purchases by `purchaseItem._count._all` (line count, not ticket count). The Compras view therefore derives its chart and tables from `PurchaseService.purchases$` in the browser and must state that summary semantics caveat in the UI instead of pretending the numbers are interchangeable with Ventas.
- **L6** — Delivered on this branch so far, each with its own commit and its checks: `59bdbf0` reports hardening · `29f4fe4` guard wiring + SSR session fix · `2fa10b6` sales AI chat deleted, no API key left in the bundle · `1ee255a` JWT expiry in the guard + full session cleanup · `3bc0e01` reports loading indicator, global table chrome, encapsulation, 768px · `5db027f` cargando$/errorCarga$ on four services + app-estado-carga in five pages · `750f761` discount field wired behind a 50% ceiling · `61afef9` the two scaffolding specs repaired and the navbar logout fixed (suite 40/40) · `d373483` reports general view with an always-visible recent-records table plus filtering and Limpiar. Suite at this point: 11 files / 45 tests green, `npm run build` exit 0.
