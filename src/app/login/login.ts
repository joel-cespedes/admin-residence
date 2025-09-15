import { Component, signal, computed } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

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
  // Form signals
  emailOrUsername = signal('');
  password = signal('');
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

    // Simulate login process
    setTimeout(() => {
      console.log('Login attempt:', {
        emailOrUsername: this.emailOrUsername(),
        password: this.password()
      });

      // Here you would typically call your authentication service
      // Example: this.authService.login(this.emailOrUsername(), this.password())

      this.isLoading.set(false);
    }, 2000);
  }
}
