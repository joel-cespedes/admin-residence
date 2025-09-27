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

interface ManagerFormData {
  alias: string;
  name: string;
  password?: string;
  residence_ids: string[];
}

@Component({
  selector: 'app-manager-form-modal',
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
  templateUrl: './managers-form-modal.html',
  styleUrl: './managers-form-modal.scss'
})
export class ManagerFormModal {
  managerForm: FormGroup;
  isEditMode = signal(false);
  isLoading = signal(false);
  residences = signal<ResidenceOption[]>([]);
  isLoadingResidences = signal(false);
  hidePassword = signal(true);

  private fb = inject(FormBuilder);
  private residencesService = inject(ResidencesService);
  private dialogRef = inject(MatDialogRef<ManagerFormModal>);
  private data = inject(MAT_DIALOG_DATA);
  private notificationService = inject(NotificationService);

  constructor() {
    this.isEditMode.set(!!this.data?.manager?.id);

    this.managerForm = this.fb.group({
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

    if (this.isEditMode() && this.data?.manager) {
      this.managerForm.patchValue({
        alias: this.data.manager.alias,
        name: this.data.manager.name || this.data.manager.alias,
        residences: this.data.manager.residences.map((r: any) => r.id)
      });
    }
  }

  private async loadResidences(): Promise<void> {
    this.isLoadingResidences.set(true);
    try {
      const response = await firstValueFrom(this.residencesService.listResidencesResidencesGet({ size: 100 }));
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
    return this.isEditMode() ? 'Editar Gestor' : 'Agregar Gestor';
  }

  togglePasswordVisibility() {
    this.hidePassword.set(!this.hidePassword());
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  async onSubmit(): Promise<void> {
    if (this.managerForm.invalid || this.isLoading()) {
      return;
    }

    this.isLoading.set(true);
    try {
      const formData: ManagerFormData = {
        alias: this.managerForm.value.alias,
        name: this.managerForm.value.name,
        residence_ids: this.managerForm.value.residences || []
      };

      // Solo incluir contraseña si se proporcionó
      if (this.managerForm.value.password) {
        formData.password = this.managerForm.value.password;
      }

      this.dialogRef.close(formData);
    } catch (error) {
      this.notificationService.handleApiError(error, 'Error al guardar gestor');
    } finally {
      this.isLoading.set(false);
    }
  }
}
