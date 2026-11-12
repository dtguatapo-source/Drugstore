import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http'; // 👈 1. Se agrega esta importación

import { routes } from './app.routes';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { authInterceptor } from './interceptors/auth.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    // El interceptor agrega el JWT a cada petición y limpia la sesión ante un 401
    provideHttpClient(withFetch(), withInterceptors([authInterceptor])), // 👈 2. Se agrega aquí en los providers
    provideClientHydration(withEventReplay())
  ]
};