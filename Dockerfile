# Build stage: compile the Angular app.
FROM node:22-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

# Final stage: static nginx server.
FROM nginx:alpine AS runtime

COPY --from=build /app/dist/drugstore-system/browser /usr/share/nginx/html

# La app tiene SSR habilitado, así que el shell de cliente se emite como
# index.csr.html: se copia a index.html para que el fallback de nginx lo encuentre.
RUN cp /usr/share/nginx/html/index.csr.html /usr/share/nginx/html/index.html

COPY nginx.conf.template /etc/nginx/templates/default.conf.template

# Railway inyecta PORT en runtime; este valor es sólo el default del contenedor.
ENV PORT=80

EXPOSE 80
