# Railway + Docker: contenedores de ambos repositorios

Alcance: dos repositorios. Frontend `Drugstore` (rama `feature/mejora-estilos-proveedores`)
y backend `backend` (rama `feature/correcciones-seguridad-reportes`). El trabajo de
backend se documenta también en `backend/odd/tasks/railway-docker.md`.

## Specs

- **S1** — Backend con `Dockerfile` multi-stage sobre `node:22-alpine`: `npm ci`,
  generación del cliente de Prisma, `npm run build`, `npm prune --omit=dev`, y etapa final
  `node:22-alpine` con `ENV NODE_ENV=production` copiando `node_modules`, `dist` y
  `package.json`, con `CMD ["node", "dist/main"]`.
  Requisito textual del usuario: "Crea `Dockerfile` multi-stage con `node:22-alpine`,
  `npm ci`, `npm run build` (que ya incluye `prisma generate`), `npm prune --omit=dev`,
  etapa final `node:22-alpine` con `ENV NODE_ENV=production`, copiando `node_modules`,
  `dist`, `package.json`".
- **S2** — Backend con `.dockerignore` que excluye `node_modules`, `dist`, `.git` y `.env`.
- **S3** — Backend con `.env.example` que lista todas las variables que el backend usa,
  sin valores reales, incluyendo `PORT`, `DATABASE_URL` y `JWT_SECRET`.
- **S4** — Backend: `package-lock.json` versionado y ningún `.env` ni secreto en el repo.
- **S5** — Backend `README.md` indicando que el proyecto requiere PostgreSQL
  (`DATABASE_URL`).
- **S6** — Frontend con `Dockerfile` multi-stage: `node:22-alpine` con `npm ci` y
  `npm run build`, y etapa final `nginx:alpine` copiando el `browser` del proyecto
  `drugstore-system` a `/usr/share/nginx/html` y `nginx.conf.template` a
  `/etc/nginx/templates/default.conf.template`.
- **S7** — Frontend con `nginx.conf.template` que usa `listen ${PORT}`, `root
/usr/share/nginx/html`, `index index.html` y `try_files $uri $uri/ /index.html`.
- **S8** — Frontend con `.dockerignore` que excluye `node_modules`, `dist`, `.git`, `.env`
  y `.angular`.
- **S9** — Frontend con `.env.example` con la referencia de la API (`API_URL`).
- **S10** — Frontend: `package-lock.json` versionado.
- **S11** — Si Docker está instalado y corriendo, `docker build` y `docker run` para
  ambos, probando `/health` en backend y la recarga de una ruta interna en frontend.
  Si no está instalado, informarlo.
- **S12** — Un commit por rama con estos archivos.

## Tasks

- **T1** — S1-S5 — Dockerfile, .dockerignore, .env.example y README del backend — inline
- **T2** — S6-S10 — Dockerfile, nginx.conf.template, .dockerignore y .env.example del frontend — inline
- **T3** — S11-S12 — verificación posible sin Docker + commits — inline

## Desvíos deliberados respecto del pedido literal

1. **`prisma generate` no está dentro de `npm run build`** (`build` es solo `nest build`,
   `package.json:8`). El Dockerfile lo corre explícito antes del build, que es la intención
   del pedido; agregarlo al script queda como decisión aparte.
2. **`.env.example` del backend documenta `CORS_ORIGIN` y no `FRONTEND_URL`**: el código
   solo lee `CORS_ORIGIN` (`src/cors.config.ts`). Documentar `FRONTEND_URL` sería
   documentar una variable que no hace nada y provocaría fallas de CORS silenciosas en el
   despliegue.
3. **El `browser` del frontend no contiene `index.html`**, solo `index.csr.html`, porque el
   proyecto tiene SSR (`outputMode: "server"`). El Dockerfile copia `index.csr.html` como
   `index.html` para que el `try_files` de nginx resuelva la recarga de rutas internas.
4. **`.env.example` del frontend no se consume en runtime**: la URL de la API se compila
   desde `src/environments/environments.prod.ts`. El archivo queda como referencia
   explícita, con el aviso escrito adentro.

## Pendientes bloqueados

- **`.env.example` no se pudo crear en ninguno de los dos repos**: el harness bloqueó la
  escritura de esa ruta por política de archivos sensibles (`Gentle AI safety policy blocked
access to sensitive path`). Requiere una decisión explícita del usuario. Contenidos
  propuestos:

  Frontend (`API_URL` no se consume en runtime):

  ```dotenv
  # Referencia de la URL de la API. El frontend es estático: la base se compila desde
  # src/environments/environments.prod.ts.
  API_URL=http://localhost:3000
  ```

  Backend: ver `backend/odd/tasks/railway-docker.md`.

- **Docker no está instalado** en esta máquina (`docker: command not found`, sin Docker
  Desktop, sin servicio `docker`, sin podman), así que `docker build` / `docker run` no se
  ejecutaron y ninguna de las dos imágenes está probada.
- **No existe `GET /health`** en el backend, así que la prueba pedida contra `/health` no es
  posible todavía.

## Log

- **L1** — Pedido del usuario, textual: "sigamos con el Paso 2: preparar ambos repositorios
  para el despliegue en Railway con Docker siguiendo exactamente estas reglas: [1] En el
  Backend (`C:\Users\derll\backend`, rama `feature/correcciones-seguridad-reportes`): Crea
  `Dockerfile` multi-stage con `node:22-alpine`, `npm ci`, `npm run build` (que ya incluye
  `prisma generate`), `npm prune --omit=dev`, etapa final `node:22-alpine` con
  `ENV NODE_ENV=production`, copiando `node_modules`, `dist`, `package.json` (y verifica si
  `generated/` o `prisma/` se necesitan en runtime para que `node dist/main` no falle), y
  `CMD ["node", "dist/main"]`. Crea `.dockerignore` excluyendo `node_modules`, `dist`,
  `.git` y `.env`. Crea `.env.example` listando todas las variables que usa el backend sin
  valores reales (`PORT=3000`, `FRONTEND_URL=http://localhost:4200`,
  `DATABASE_URL=postgresql://user:pass@localhost:5432/db`,
  `JWT_SECRET=cambia_este_secreto`). Verifica que `package-lock.json` esté incluido y que no
  haya ningún `.env` ni secretos en el repo. Actualiza `README.md` indicando claramente que
  el proyecto requiere base de datos PostgreSQL (`DATABASE_URL`). [2] En el Frontend
  (`C:\Users\derll\Drugstore`, rama `feature/mejora-estilos-proveedores`): Crea `Dockerfile`
  multi-stage: `node:22-alpine` con `npm ci` y `npm run build`, y etapa final `nginx:alpine`
  copiando `/app/dist/<NOMBRE_EXACTO_DE_ANGULAR_JSON>/browser` a `/usr/share/nginx/html` y
  `nginx.conf.template` a `/etc/nginx/templates/default.conf.template`. Crea
  `nginx.conf.template` con `listen ${PORT};`, `root /usr/share/nginx/html;`, `index
index.html;` y `location / { try_files $uri $uri/ /index.html; }`. Crea `.dockerignore`
  excluyendo `node_modules`, `dist`, `.git`, `.env` y `.angular`. Crea `.env.example` con la
  variable de referencia de la API (`API_URL=http://localhost:3000`). Verifica que
  `package-lock.json` esté incluido en el repo. [3] Si Docker está instalado y corriendo en
  esta máquina, haz la prueba local de `docker build` y `docker run` para ambos (probando
  `http://localhost:3000/health` en backend y recargando una ruta interna en frontend). Si
  Docker no está instalado, dime para saberlo. Haz los commits de estos archivos en cada
  rama cuando termines."
- **L2** — Evidencia recolectada antes de escribir: `docker: command not found` (sin Docker
  local). `package.json:8` `build` = `nest build`, sin `prisma generate`, y sin
  `prebuild`/`postinstall`. Prisma 7.10 con `@prisma/adapter-pg`: cliente generado en
  `src/generated/prisma` (versionado), compilado a `dist` por `tsconfig.build.json`
  (`rootDir: ./src`). `git ls-files` no muestra ningún `.env`; sin claves hardcodeadas en
  `src`. `package-lock.json` presente en ambos repos. Build de producción del frontend sin
  `index.html` (solo `index.csr.html`).
- **L3** — El backend no expone `/health` (no existe esa ruta), así que la prueba de `/health`
  pedida en S11 no puede ejecutarse aunque Docker existiera; queda informada.
