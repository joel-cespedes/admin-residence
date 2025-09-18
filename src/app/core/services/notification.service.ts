import { Injectable, inject } from '@angular/core';
import { MatSnackBar, MatSnackBarConfig } from '@angular/material/snack-bar';

export interface NotificationConfig {
  duration?: number;
  panelClass?: string | string[];
  horizontalPosition?: 'start' | 'center' | 'end' | 'left' | 'right';
  verticalPosition?: 'top' | 'bottom';
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private snackBar = inject(MatSnackBar);

  private getDefaultConfig(type: 'success' | 'error' | 'warning' | 'info'): MatSnackBarConfig {
    const baseConfig: MatSnackBarConfig = {
      duration: 3000,
      horizontalPosition: 'end',
      verticalPosition: 'top'
    };

    switch (type) {
      case 'success':
        return {
          ...baseConfig,
          panelClass: ['success-snackbar'],
          duration: 3000
        };
      case 'error':
        return {
          ...baseConfig,
          panelClass: ['error-snackbar'],
          duration: 5000
        };
      case 'warning':
        return {
          ...baseConfig,
          panelClass: ['warning-snackbar'],
          duration: 4000
        };
      case 'info':
      default:
        return {
          ...baseConfig,
          panelClass: ['info-snackbar'],
          duration: 3000
        };
    }
  }

  success(message: string, action: string = 'Cerrar', config?: NotificationConfig): void {
    const finalConfig = { ...this.getDefaultConfig('success'), ...config };
    this.snackBar.open(message, action, finalConfig);
  }

  error(message: string, action: string = 'Cerrar', config?: NotificationConfig): void {
    const finalConfig = { ...this.getDefaultConfig('error'), ...config };
    this.snackBar.open(message, action, finalConfig);
  }

  warning(message: string, action: string = 'Cerrar', config?: NotificationConfig): void {
    const finalConfig = { ...this.getDefaultConfig('warning'), ...config };
    this.snackBar.open(message, action, finalConfig);
  }

  info(message: string, action: string = 'Cerrar', config?: NotificationConfig): void {
    const finalConfig = { ...this.getDefaultConfig('info'), ...config };
    this.snackBar.open(message, action, finalConfig);
  }

  handleApiError(error: any, defaultMessage: string = 'Error en la operación'): void {
    console.error('API Error:', error);

    let errorMessage = defaultMessage;

    // Extraer mensaje de error del backend
    if (error?.error?.detail) {
      errorMessage = error.error.detail;
    } else if (error?.error?.message) {
      errorMessage = error.error.message;
    } else if (error?.message) {
      errorMessage = error.message;
    } else if (error?.status === 0) {
      errorMessage = 'Error de conexión. Verifica tu conexión a internet.';
    } else if (error?.status === 401) {
      errorMessage = 'No autorizado. Inicia sesión nuevamente.';
    } else if (error?.status === 403) {
      errorMessage = 'No tienes permisos para realizar esta acción.';
    } else if (error?.status === 404) {
      errorMessage = 'Recurso no encontrado.';
    } else if (error?.status === 409) {
      errorMessage = 'Conflicto: El recurso ya existe.';
    } else if (error?.status === 422) {
      errorMessage = 'Datos inválidos. Verifica la información.';
    } else if (error?.status >= 500) {
      errorMessage = 'Error del servidor. Inténtalo más tarde.';
    }

    this.error(errorMessage);
  }
}