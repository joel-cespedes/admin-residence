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
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCheckboxModule } from '@angular/material/checkbox';

import { ResidencesService } from '../../../../openapi/generated/services/residences.service';
import { ResidenceWithContact } from '../../residence/model/residence.model';
import { NotificationService } from '../../../shared/notification.service';
import { firstValueFrom } from 'rxjs';

type ResidenceOption = Pick<ResidenceWithContact, 'id' | 'name'>;

interface ProfessionalFormData {
  alias: string;
  name: string;
  password?: string;
  residence_ids: string[];
}

@Component({
  selector: 'app-professional-form-modal',
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
    MatSnackBarModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    MatCheckboxModule
  ],
  templateUrl: './professionals-form-modal.html',
  styleUrl: './professionals-form-modal.scss'
})
export class ProfessionalFormModal {
  professionalForm: FormGroup;
  isEditMode = signal(false);
  isLoading = signal(false);
  residences = signal<ResidenceOption[]>([]);
  isLoadingResidences = signal(false);

  private fb = inject(FormBuilder);
  private residencesService = inject(ResidencesService);
  private dialogRef = inject(MatDialogRef<ProfessionalFormModal>);
  private data = inject(MAT_DIALOG_DATA);
  private notificationService = inject(NotificationService);

  constructor() {
    this.isEditMode.set(!!this.data?.professional?.id);

    this.professionalForm = this.fb.group({
      alias: ['', [Validators.required]],
      name: ['', [Validators.required]],
      password: ['', this.isEditMode() ? [Validators.minLength(6)] : [Validators.required, Validators.minLength(6)]],
      residences: [[], [Validators.required]]
    });

    // Use residences from parent component if available, otherwise load them
    if (this.data?.residences?.length) {
      this.residences.set(this.data.residences as ResidenceOption[]);
    } else {
      this.loadResidences();
    }

    if (this.isEditMode() && this.data?.professional) {
      this.professionalForm.patchValue({
        alias: this.data.professional.alias,
        name: this.data.professional.name || this.data.professional.alias,
        residences: this.data.professional.residences.map((r: any) => r.id)
      });
    }
  }

  private async loadResidences(): Promise<void> {
    this.isLoadingResidences.set(true);
    try {
      const response = await firstValueFrom(
        this.residencesService.listResidencesResidencesGet({ size: 100 })
      );
      this.residences.set(
        (response.items || []).map((item: any) => ({
          id: item.id,
          name: item.name
        }))
      );
    } catch (error) {
      this.notificationService.handleApiError(error, 'Error al cargar residencias');
    } finally {
      this.isLoadingResidences.set(false);
    }
  }

  get title() {
    return this.isEditMode() ? 'Editar Profesional' : 'Agregar Profesional';
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  async onSubmit(): Promise<void> {
    if (this.professionalForm.invalid || this.isLoading()) {
      return;
    }

    this.isLoading.set(true);
    try {
      const formData: ProfessionalFormData = {
        alias: this.professionalForm.value.alias,
        name: this.professionalForm.value.name,
        residence_ids: this.professionalForm.value.residences || []
      };

      // Solo incluir contraseña si se proporcionó
      if (this.professionalForm.value.password) {
        formData.password = this.professionalForm.value.password;
      }

      this.dialogRef.close(formData);
    } catch (error) {
      this.notificationService.handleApiError(error, 'Error al guardar profesional');
    } finally {
      this.isLoading.set(false);
    }
  }
}