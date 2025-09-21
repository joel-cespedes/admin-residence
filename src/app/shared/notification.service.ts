import { Injectable, inject } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {

  success(message: string): void {
    console.log('Success:', message);
    // Aquí podrías integrar con MatSnackBar u otro servicio de notificaciones
  }

  error(message: string): void {
    console.error('Error:', message);
    // Aquí podrías integrar con MatSnackBar u otro servicio de notificaciones
  }

  warning(message: string): void {
    console.warn('Warning:', message);
  }

  info(message: string): void {
    console.info('Info:', message);
  }

  handleApiError(error: any, defaultMessage: string = 'Error en la operación'): void {
    console.error('API Error:', error);

    if (error instanceof HttpErrorResponse) {
      if (error.status === 0) {
        this.error('Error de conexión. Verifica tu internet.');
      } else if (error.status === 401) {
        this.error('No autorizado. Inicia sesión nuevamente.');
      } else if (error.status === 403) {
        this.error('No tienes permisos para realizar esta acción.');
      } else if (error.status === 404) {
        this.error('Recurso no encontrado.');
      } else if (error.status >= 500) {
        this.error('Error del servidor. Inténtalo más tarde.');
      } else {
        this.error(error.error?.message || defaultMessage);
      }
    } else if (error?.message) {
      this.error(error.message);
    } else {
      this.error(defaultMessage);
    }
  }
}