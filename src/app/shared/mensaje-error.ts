/**
 * Traduce un error HTTP a un mensaje en español listo para mostrar al usuario.
 *
 * Es una función pura: no importa nada de Angular y no tiene efectos secundarios,
 * para poder reutilizarla en los servicios y en cualquier componente.
 */
export function mensajeDeError(err: unknown, contexto: string): string {
  const error = err as { status?: number; error?: { message?: unknown } } | null | undefined;
  const status = error?.status;

  // Sin status (o status 0) el backend no respondió: no significa "no hay datos"
  if (status === undefined || status === null || status === 0) {
    return (
      'No se pudo conectar con el servidor. ' +
      'Verifique que el backend esté en ejecución e intente de nuevo.'
    );
  }

  const mensaje = error?.error?.message;

  // El ValidationPipe de NestJS devuelve un arreglo de mensajes
  if (Array.isArray(mensaje)) {
    const textos = mensaje.filter(
      (item): item is string => typeof item === 'string' && item.trim() !== ''
    );

    if (textos.length > 0) {
      return textos.join(', ');
    }
  } else if (typeof mensaje === 'string' && mensaje.trim() !== '') {
    return mensaje;
  }

  return contexto;
}
