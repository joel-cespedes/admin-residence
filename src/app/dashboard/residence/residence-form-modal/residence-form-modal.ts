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

import { ResidencesService } from '../../../../openapi/generated/services/residences.service';
import { ResidenceFormData } from '../model/residence.model';

@Component({
  selector: 'app-residence-form-modal',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    ReactiveFormsModule
  ],
  templateUrl: './residence-form-modal.html',
  styleUrl: './residence-form-modal.scss'
})
export class ResidenceFormModal {
  residenceForm: FormGroup;
  isEditMode = signal(false);
  isLoading = signal(false);

  private fb = inject(FormBuilder);
  private residencesService = inject(ResidencesService);
  private dialogRef = inject(MatDialogRef<ResidenceFormModal>);
  private data = inject(MAT_DIALOG_DATA);

  constructor() {
    this.isEditMode.set(!!this.data);

    this.residenceForm = this.fb.group({
      name: ['', [Validators.required]],
      address: ['', [Validators.required]],
      phone: ['', [Validators.pattern(/^\+?[\d\s\-()]+$/)]],
      email: ['', [Validators.email]]
    });

    if (this.isEditMode() && this.data) {
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
          this.dialogRef.close(response);
        },
        error: error => {
          console.error('Error updating residence:', error);
          this.isLoading.set(false);
        }
      });
    } else {
      this.residencesService.createResidenceResidencesPost({ body: formData }).subscribe({
        next: response => {
          this.dialogRef.close(response);
        },
        error: error => {
          console.error('Error creating residence:', error);
          this.isLoading.set(false);
        }
      });
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  title = computed(() => this.isEditMode() ? 'Editar Residencia' : 'Agregar Nueva Residencia');
}
