import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBarModule } from '@angular/material/snack-bar';

import { ResidencesService } from '../../../../openapi/generated/services/residences.service';
import { ResidenceFormData } from '../model/residence.model';
import { NotificationService } from '../../../shared/notification.service';

@Component({
  selector: 'app-residence-form-modal',
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    ReactiveFormsModule,
    MatSnackBarModule
  ],
  templateUrl: './residence-form-modal.html',
  styleUrl: './residence-form-modal.scss'
})
export class ResidenceFormModal {
  residenceForm: FormGroup;
  isEditMode = signal(false);
  isLoading = signal(false);

  title = computed(() => (this.isEditMode() ? 'Editar Residencia' : 'Agregar Residencia'));

  private fb = inject(FormBuilder);
  private residencesService = inject(ResidencesService);
  private dialogRef = inject(MatDialogRef<ResidenceFormModal>);
  private data = inject(MAT_DIALOG_DATA);
  private notificationService = inject(NotificationService);

  constructor() {
    // Check if we have a residence object (edit mode) or just residences array (create mode)
    this.isEditMode.set(!!(this.data && this.data.id));

    this.residenceForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
      address: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
      phone: ['', [Validators.pattern(/^\+?[\d\s\-()]+$/), Validators.minLength(6), Validators.maxLength(20)]],
      email: ['', [Validators.email]]
    });

    if (this.isEditMode() && this.data && this.data.id) {
      this.residenceForm.patchValue({
        name: this.data.name,
        address: this.data.address || '',
        phone: this.data.phone || '',
        email: this.data.email || ''
      });
    }
  }

  onSubmit(): void {
    if (this.residenceForm.invalid) {
      return;
    }

    this.isLoading.set(true);
    const formData: ResidenceFormData = this.residenceForm.value;

    if (this.isEditMode() && this.data) {
      this.residencesService.updateResidenceResidencesIdPut({ id: this.data.id, body: formData }).subscribe({
        next: response => {
          this.notificationService.success('Residencia actualizada correctamente');
          this.dialogRef.close(response);
        },
        error: error => {
          this.notificationService.handleApiError(error, 'Error al actualizar la residencia');
          this.isLoading.set(false);
        }
      });
    } else {
      this.residencesService.createResidenceResidencesPost({ body: formData }).subscribe({
        next: response => {
          this.notificationService.success('Residencia creada correctamente');
          this.dialogRef.close(response);
        },
        error: error => {
          this.notificationService.handleApiError(error, 'Error al crear la residencia');
          this.isLoading.set(false);
        }
      });
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}
