export const environment = {
  production: false,
  // Base única del backend NestJS: cualquier URL de la API se arma desde acá,
  // así el paso a producción se hace en un solo lugar.
  apiBase: 'http://localhost:3000'
};
