# Tanda 1 — Integridad de datos y escrituras honestas

Frontend Angular. Branch `feature/mejora-estilos-proveedores`, sin tocar `main`. Cierra los hallazgos rojos de la auditoría componente por componente antes de la calificación.

## Specs

- **S1** — "Arranca de inmediato con la **Tanda 1 (Integridad)** para corregir los 5 errores rojos (Observables reales en MedicineService, manejo de IDs/409, validación de access_token en login, bloqueo de doble submit en Compras/Proveedores/Login y respetar el estado VENCIDO + validación numérica estricta)."
- **S2** — "Apenas cierres y commitees la Tanda 1, continúa automáticamente con la **Tanda 2 (Accesibilidad y Consistencia)**, asegurándote de incluir: Interceptor HTTP para enviar el token JWT en todas las peticiones y limpiar sesión ante un 401. Centralizar `http://localhost:3000` en `environment` para dejar el proyecto listo para despliegue en producción. Labels `for/id`, cierre de modales con Escape, navegación por teclado y el enlace a `/suppliers` en el navbar."
- **S3** — "Sobre `design/.../03-ventas-descuento.html`: bórralo para no dejar documentación desactualizada."
- **S4** — "La parte de Backend (JWT Strategy, `/auth/me`, secreto JWT en `.env` y módulo `/reports`) ya está adelantada en `C:\Users\derll\backend` (en la rama `feature/correcciones-seguridad-reportes`). Cuando termines la Tanda 1 y Tanda 2 aquí en el frontend, pasamos allá para verificar roles y despliegue."
- **S5** — "Empieza con la Tanda 1 creando su documento ODD y avanzando paso a paso con tests y commits limpios."

## Tasks

- **T1** — MedicineService devuelve Observables reales, sin `subscribe` interno ni `alert()`, con validación numérica estricta y estado `VENCIDO` respetado. Commit `refactor(services)`
- **T2** — Inventario: IDs derivados en vez de aleatorios, 409 informado, flujo de escritura honesto con `guardando`, validación de campos. Commit `fix(inventory)`
- **T3** — Login: validar `access_token` antes de guardar y bloquear el botón durante el intento. Commit `fix(auth)`
- **T4** — Sin doble submit en compras y proveedores (incluido el borrado). Commit `fix(purchases)` / `fix(suppliers)`
- **T5** — Borrar el tablero `design/informes-evolucion/03-ventas-descuento.html` y su entrada del manifiesto. Commit `docs(design)`
- **T6** — Tanda 2: interceptor JWT + 401, `environment` centralizado, accesibilidad y `/suppliers` en el navbar. Commits por unidad

## Log

- **L1** — "¡Increíble auditoría, Gentleman! Eso es exactamente lo que necesitaba detectar antes de la calificación del profesor.

  Aprobado el plan completo en orden:
  1. Arranca de inmediato con la **Tanda 1 (Integridad)** para corregir los 5 errores rojos (Observables reales en MedicineService, manejo de IDs/409, validación de access_token en login, bloqueo de doble submit en Compras/Proveedores/Login y respetar el estado VENCIDO + validación numérica estricta).
  2. Apenas cierres y commitees la Tanda 1, continúa automáticamente con la **Tanda 2 (Accesibilidad y Consistencia)**, asegurándote de incluir:
     - Interceptor HTTP para enviar el token JWT en todas las peticiones y limpiar sesión ante un 401.
     - Centralizar `http://localhost:3000` en `environment` para dejar el proyecto listo para despliegue en producción.
     - Labels `for/id`, cierre de modales con Escape, navegación por teclado y el enlace a `/suppliers` en el navbar.
  3. Sobre `design/.../03-ventas-descuento.html`: bórralo para no dejar documentación desactualizada.
  4. La parte de Backend (JWT Strategy, `/auth/me`, secreto JWT en `.env` y módulo `/reports`) ya está adelantada en `C:\Users\derll\backend` (en la rama `feature/correcciones-seguridad-reportes`). Cuando termines la Tanda 1 y Tanda 2 aquí en el frontend, pasamos allá para verificar roles y despliegue.

  Empieza con la Tanda 1 creando su documento ODD y avanzando paso a paso con tests y commits limpios."
- **L2** — Decision on IDs: the backend's `CreateMedicineDto` cannot be inspected from this repository, so `id` keeps being sent. It is no longer random: it is derived from the loaded catalogue (max numeric suffix + 1, padded), and a 409 is surfaced as an explicit "that ID already exists" message. If the DTO later accepts an omitted id, the client generation is dropped in one place.
- **L3** — Decision on `VENCIDO`: the UI union gains `'Vencido'` instead of discarding it. The adapter maps backend `VENCIDO` to it and keeps deriving Activo/Bajo stock/Sin stock from stock. Expiry-based derivation stays on the backend because the frontend has no `expiryDate` on `Medicine`.
- **L4** — Backend pass on `feature/correcciones-seguridad-reportes` (explicitly authorized by the user): `398bf02` registers `JwtAuthGuard` as `APP_GUARD` so the API is closed by default and only `@Public()` routes pass (`POST /auth/login`, `POST /users`); `2993b93` adds `@Roles()` + `RolesGuard` (ADMIN for purchases, suppliers, reports and medicine writes, any authenticated user for sales, customers and medicine reads); `d88539a` stops the public registration from minting an ADMIN (`@default(ADMIN)` in the schema met a public endpoint) and creates `UserRole.USER` instead; `test` commit gave the scaffolding specs their doubles so the backend suite is 33/33 green with a clean typecheck.
- **L5** — Learned: the Prisma enum is only `ADMIN`/`USER`, there is no `CAJERO`; the frontend label maps `USER` to the "Cajero" badge and the first draft invented a role that did not exist. Also learned: three frontend page specs mounted real components without `HttpClientTesting`, so they hit `localhost:3000` and `whenStable()` waited on the network — that was the source of the "Hook timed out in 10000ms" flakiness, not machine load.
