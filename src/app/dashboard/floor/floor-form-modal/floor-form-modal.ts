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

import { ResidencesService } from '../../../../openapi/generated/services/residences.service';
import { StructureService } from '../../../../openapi/generated/services/structure.service';
import { ResidenceWithContact } from '../../residence/model/residence.model';
import { FloorFormData } from '../model/floor.model';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-floor-form-modal',
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
    ReactiveFormsModule,
    MatSnackBarModule,
    MatSelectModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './floor-form-modal.html',
  styleUrl: './floor-form-modal.scss'
})
export class FloorFormModal {
  floorForm: FormGroup;
  isEditMode = signal(false);
  isLoading = signal(false);
  residences = signal<ResidenceWithContact[]>([]);
  isLoadingResidences = signal(false);

  private fb = inject(FormBuilder);
  private residencesService = inject(ResidencesService);
  private structureService = inject(StructureService);
  private dialogRef = inject(MatDialogRef<FloorFormModal>);
  private data = inject(MAT_DIALOG_DATA);
  private notificationService = inject(NotificationService);

  constructor() {
    this.isEditMode.set(!!this.data?.id);

    this.floorForm = this.fb.group({
      name: ['', [Validators.required]],
      residence_id: ['', [Validators.required]]
    });

    this.loadResidences();

    if (this.isEditMode() && this.data) {
      this.floorForm.patchValue({
        name: this.data.name,
        residence_id: this.data.residence_id
      });
    } else if (this.data?.residence_id) {
      this.floorForm.patchValue({
        residence_id: this.data.residence_id
      });
    }
  }

  private loadResidences() {
    this.isLoadingResidences.set(true);
    this.residencesService.listResidencesResidencesGet().subscribe({
      next: (response: any) => {
        this.residences.set(response.items || []);
        this.isLoadingResidences.set(false);
      },
      error: error => {
        this.notificationService.handleApiError(error, 'Error al cargar las residencias');
        this.isLoadingResidences.set(false);
      }
    });
  }

  onSubmit(): void {
    if (this.floorForm.invalid) {
      return;
    }

    this.isLoading.set(true);
    const formData: FloorFormData = this.floorForm.value;

    if (this.isEditMode() && this.data?.id) {
      this.structureService.updateFloorStructureFloorsIdPut({ id: this.data.id, body: { name: formData.name } }).subscribe({
        next: response => {
          this.notificationService.success('Piso actualizado correctamente');
          this.dialogRef.close(response);
        },
        error: error => {
          this.notificationService.handleApiError(error, 'Error al actualizar el piso');
          this.isLoading.set(false);
        }
      });
    } else {
      this.structureService.createFloorStructureFloorsPost({
        body: { name: formData.name },
        'X-Residence-Id': formData.residence_id
      }).subscribe({
        next: response => {
          this.notificationService.success('Piso creado correctamente');
          this.dialogRef.close(response);
        },
        error: error => {
          this.notificationService.handleApiError(error, 'Error al crear el piso');
          this.isLoading.set(false);
        }
      });
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  title = computed(() => this.isEditMode() ? 'Editar Piso' : 'Agregar Nuevo Piso');
}