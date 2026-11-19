# Deploy enablement: API por entorno, CORS por entorno y prerender sin datos

Alcance: dos repositorios. Frontend `Drugstore` (rama `feature/mejora-estilos-proveedores`)
y backend `backend` (rama `feature/correcciones-seguridad-reportes`).

## Specs

- **S1** — Frontend: el build de producción no debe apuntar a `http://localhost:3000`.
  Se agrega `src/environments/environments.prod.ts` con una URL placeholder clara y
  `fileReplacements` en la configuración `production` de `angular.json`, reemplazando
  `src/environments/environments.ts`.
  Requisito textual del usuario: "configura `environments.prod.ts` + `fileReplacements`
  en el frontend (dejando una URL placeholder clara para producción)".
- **S2** — Backend: el origen permitido por CORS deja de estar hardcodeado y pasa a
  leerse de `CORS_ORIGIN`, aceptando varios orígenes separados por coma.
  Requisito textual del usuario: "parametriza `CORS_ORIGIN` en `src/main.ts` del backend
  para que acepte tanto `http://localhost:4200` como los orígenes de producción".
- **S3** — Frontend: las rutas privadas que cargan datos de la base de datos no se
  prerenderizan, para que ningún registro quede horneado en el HTML estático.
  Requisito textual del usuario: "desactiva el prerender en las rutas privadas con datos
  de la base de datos (`app.routes.server.ts`) para evitar que se filtren registros al
  HTML estático".
- **S4** — Verificación: build de producción y suites de tests ejecutados en ambos repos,
  y un commit por rama.
  Requisito textual del usuario: "verifica con build/tests y haz los commits
  correspondientes en cada rama".

## Tasks

- **T1** — S3 — spec RED de `serverRoutes` + `app.routes.server.ts` sin prerender en rutas privadas — inline — commit `feat(deploy): ship the production API base and stop prerendering private routes`
- **T2** — S1 — `environments.prod.ts` + `fileReplacements` en `angular.json` — inline — commit `f0516f3`
- **T3** — S2 — `src/cors.config.ts` + spec + `src/main.ts` con CORS por entorno — inline — commit `feat(cors): read the allowed origins from CORS_ORIGIN` (repo backend, `odd/tasks/deploy-cors.md`)

## Estado de verificación

- `src/app/app.routes.server.spec.ts`: RED observado (3/3 en rojo) y luego 3/3 en verde.
- Suite completa del frontend: 15 archivos, 88 tests en verde.
- `npm run build`: éxito, `Prerendered 3 static routes.` (antes 9) y sin llamadas a la API.
- `dist/`: 0 coincidencias de `localhost:3000`; placeholder de producción presente en el bundle de browser y en el de servidor; sin directorios `dashboard/inventory/sales/purchases/suppliers/reports`; 0 coincidencias de `ng-state`/`MED-` en el HTML estático.

## Log

- **L1** — Pedido original del usuario, textual:
  "Dale, arranquemos paso a paso con tu recomendación en estos dos puntos primero:
  1. Desbloqueo de despliegue (API env + CORS): configura `environments.prod.ts` +
     `fileReplacements` en el frontend (dejando una URL placeholder clara para producción) y
     parametriza `CORS_ORIGIN` en `src/main.ts` del backend para que acepte tanto
     `http://localhost:4200` como los orígenes de producción.
  2. Prerender con datos reales: desactiva el prerender en las rutas privadas con datos de
     la base de datos (`app.routes.server.ts`) para evitar que se filtren registros al HTML
     estático.
     Aplica estos dos cambios, verifica con build/tests y haz los commits correspondientes en
     cada rama. Avísame cuando termines para revisar y pasar al siguiente bloque."
- **L2** — Evidencia de partida (chequeo de solo lectura): `src/environments/environments.ts:5`
  tenía `apiBase: 'http://localhost:3000'` y `production: false`; `angular.json` no tenía
  `fileReplacements`; `app.routes.server.ts` prerenderizaba `**`; `src/main.ts:23-26` del
  backend fijaba `origin: 'http://localhost:4200'`.
