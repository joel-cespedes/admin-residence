import { Component, signal, computed, inject } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '@core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { LoginRequest } from '../../openapi/generated/models/login-request';

@Component({
  selector: 'app-login',
  imports: [
    CommonModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    FormsModule
  ],
  templateUrl: './login.html',
  styleUrl: './login.scss'
})
export class Login {
  // Dependencies
  private authService = inject(AuthService);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);

  // Form signals
  emailOrUsername = signal('superadmin');
  password = signal('admin123');
  hidePassword = signal(true);
  isLoading = signal(false);

  // Computed form validation
  isFormValid = computed(() => {
    return this.emailOrUsername().trim().length > 0 && this.password().trim().length > 0;
  });

  onEmailOrUsernameChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.emailOrUsername.set(target.value);
  }

  onPasswordChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.password.set(target.value);
  }

  togglePasswordVisibility(): void {
    this.hidePassword.set(!this.hidePassword());
  }

  onSubmit(): void {
    if (!this.isFormValid()) {
      return;
    }

    this.isLoading.set(true);

    const loginRequest: LoginRequest = {
      alias: this.emailOrUsername(),
      password: this.password()
    };

    this.authService.login(loginRequest).subscribe({
      next: () => {
        this.snackBar.open('Inicio de sesión exitoso', 'Cerrar', {
          duration: 3000,
          panelClass: ['success-snackbar']
        });

        // Forzar recarga completa para evitar problemas con el estado del router
        // swindow.location.href = redirectUrl || '/dashboard';
        this.router.navigate(['/dashboard']);
      },
      error: (error: { error?: { detail?: string }; message?: string }) => {
        let errorMessage = 'Error al iniciar sesión. Verifique sus credenciales.';

        if (error.error?.detail) {
          errorMessage = error.error.detail;
        } else if (error.message) {
          errorMessage = error.message;
        }

        this.snackBar.open(errorMessage, 'Cerrar', {
          duration: 5000,
          panelClass: ['error-snackbar']
        });
        this.isLoading.set(false);
      }
    });
  }
}
