import { Component, inject, signal, computed, linkedSignal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatRadioModule } from '@angular/material/radio';

import { ManagerFormData, ManagerWithDetails } from '../model/manager.model';

interface ManagerFormModalData {
  manager?: ManagerWithDetails;
  residences: Array<{ id: string; name: string }>;
}

@Component({
  selector: 'app-manager-form-modal',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatCheckboxModule,
    MatRadioModule
  ],
  templateUrl: './managers-form-modal.html',
  styleUrl: './managers-form-modal.scss'
})
export class ManagerFormModal {
  // Inputs
  username = signal('');
  email = signal('');
  fullName = signal('');
  phone = signal('');
  password = signal('');
  status = signal('active');
  selectedResidences = signal<string[]>([]);

  // Form state
  touched = signal<Record<string, boolean>>({});
  isSubmitting = signal(false);

  // Validation errors
  errors = signal<Record<string, string>>({});

  // Validation rules
  validationRules = {
    username: {
      required: true,
      minLength: 3,
      maxLength: 50
    },
    email: {
      required: true,
      pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    },
    fullName: {
      required: true,
      minLength: 2,
      maxLength: 100
    },
    password: {
      required: false,
      minLength: 6
    },
    residence_ids: {
      required: true,
      minLength: 1
    },
    status: {
      required: true
    }
  };

  // Error messages
  private errorMessages = {
    required: 'Este campo es requerido',
    email: 'Email inválido',
    minLength: (min: number) => `Mínimo ${min} caracteres`,
    maxLength: (max: number) => `Máximo ${max} caracteres`,
    pattern: 'Formato inválido'
  };

  // Computed properties
  private dialogRef = inject(MatDialogRef<ManagerFormModal>);
  data = inject(MAT_DIALOG_DATA);

  manager = this.data.manager || null;
  residences = this.data.residences;

  // Form validation computed
  isFormValid = computed(() => {
    const values = {
      username: this.username(),
      email: this.email(),
      fullName: this.fullName(),
      password: this.password(),
      residence_ids: this.selectedResidences(),
      status: this.status()
    };

    return this.validateForm(values);
  });

  // Field validation computed
  usernameErrors = computed(() => this.getFieldErrors('username', this.username()));
  emailErrors = computed(() => this.getFieldErrors('email', this.email()));
  fullNameErrors = computed(() => this.getFieldErrors('fullName', this.fullName()));
  phoneErrors = computed(() => this.getFieldErrors('phone', this.phone()));
  passwordErrors = computed(() => this.getFieldErrors('password', this.password()));
  residenceIdsErrors = computed(() => this.getFieldErrors('residence_ids', this.selectedResidences()));
  statusErrors = computed(() => this.getFieldErrors('status', this.status()));

  constructor() {
    // Initialize form if editing
    if (this.manager) {
      this.username.set(this.manager.username);
      this.email.set(this.manager.email);
      this.fullName.set(this.manager.full_name);
      this.phone.set(this.manager.phone || '');
      this.status.set(this.manager.status);
      this.selectedResidences.set(this.manager.residence_ids || []);
    }
  }

  private validateForm(values: Record<string, any>): boolean {
    const newErrors: Record<string, string> = {};

    Object.entries(this.validationRules).forEach(([field, rules]) => {
      const fieldErrors = this.getFieldErrors(field, values[field]);
      if (fieldErrors.length > 0) {
        newErrors[field] = fieldErrors[0];
      }
    });

    this.errors.set(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  private getFieldErrors(field: string, value: any): string[] {
    const rules = this.validationRules[field as keyof typeof this.validationRules];
    const errors: string[] = [];

    if (!rules) return errors;

    if (rules.required && (!value || (Array.isArray(value) && value.length === 0))) {
      errors.push(this.errorMessages.required);
    }

    // Type guard for minLength
    if ('minLength' in rules && value && rules.minLength && String(value).length < rules.minLength) {
      errors.push(this.errorMessages.minLength(rules.minLength));
    }

    // Type guard for maxLength
    if ('maxLength' in rules && value && rules.maxLength && String(value).length > rules.maxLength) {
      errors.push(this.errorMessages.maxLength(rules.maxLength));
    }

    // Type guard for pattern
    if ('pattern' in rules && value && rules.pattern && !rules.pattern.test(String(value))) {
      errors.push(this.errorMessages.pattern);
    }

    return errors;
  }

  onResidenceChange(residenceId: string, isChecked: boolean) {
    const current = this.selectedResidences();
    if (isChecked) {
      this.selectedResidences.set([...current, residenceId]);
    } else {
      this.selectedResidences.set(current.filter(id => id !== residenceId));
    }

    // Trigger validation
    this.validateForm({
      username: this.username(),
      email: this.email(),
      fullName: this.fullName(),
      phone: this.phone(),
      password: this.password(),
      residence_ids: this.selectedResidences(),
      status: this.status()
    });
  }

  isResidenceSelected(residenceId: string): boolean {
    return this.selectedResidences().includes(residenceId);
  }

  markAsTouched(field: string) {
    this.touched.update(current => ({ ...current, [field]: true }));
  }

  close() {
    this.dialogRef.close();
  }

  submit() {
    if (!this.isFormValid()) {
      // Mark all fields as touched to show errors
      Object.keys(this.validationRules).forEach(field => {
        this.markAsTouched(field);
      });
      return;
    }

    const formData: ManagerFormData = {
      username: this.username(),
      email: this.email(),
      full_name: this.fullName(),
      phone: this.phone() || undefined,
      residence_ids: this.selectedResidences(),
      status: this.status() as 'active' | 'inactive' | 'suspended'
    };

    // Add password only if it's provided (for create or password change)
    if (this.password()) {
      formData.password = this.password();
    }

    this.isSubmitting.set(true);
    this.dialogRef.close(formData);
  }

  // Error computed properties for template
  usernameError = computed(() => this.errors()['username'] && this.touched()['username'] ? this.errors()['username'] : '');
  emailError = computed(() => this.errors()['email'] && this.touched()['email'] ? this.errors()['email'] : '');
  fullNameError = computed(() => this.errors()['fullName'] && this.touched()['fullName'] ? this.errors()['fullName'] : '');
  phoneError = computed(() => this.errors()['phone'] && this.touched()['phone'] ? this.errors()['phone'] : '');
  passwordError = computed(() => this.errors()['password'] && this.touched()['password'] ? this.errors()['password'] : '');
  residenceIdsError = computed(() => this.errors()['residence_ids'] && this.touched()['residence_ids'] ? this.errors()['residence_ids'] : '');
  statusError = computed(() => this.errors()['status'] && this.touched()['status'] ? this.errors()['status'] : '');

  // Error visibility computed properties
  showUsernameError = computed(() => !!this.usernameError());
  showEmailError = computed(() => !!this.emailError());
  showFullNameError = computed(() => !!this.fullNameError());
  showPhoneError = computed(() => !!this.phoneError());
  showPasswordError = computed(() => !!this.passwordError());
  showResidenceIdsError = computed(() => !!this.residenceIdsError());
  showStatusError = computed(() => !!this.statusError());
}