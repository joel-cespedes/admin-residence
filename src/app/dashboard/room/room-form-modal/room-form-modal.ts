import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';

import { NotificationService } from '@core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { RoomCreate } from '../../../../openapi/generated/models/room-create';
import { RoomUpdate } from '../../../../openapi/generated/models/room-update';
import { StructureService } from '../../../../openapi/generated/services/structure.service';
import { FloorWithDetails } from '../../floor/model/floor.model';
import { ResidenceWithContact } from '../../residence/model/residence.model';
import { RoomWithDetails } from '../model/room.model';

@Component({
  selector: 'app-room-form-modal',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatCardModule,
    MatDividerModule,
    MatInputModule,
    MatFormFieldModule,
    MatSelectModule,
    FormsModule,
    ReactiveFormsModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './room-form-modal.html',
  styleUrl: './room-form-modal.scss'
})
export class RoomFormModal {
  roomForm: FormGroup;
  residences = signal<ResidenceWithContact[]>([]);
  floors = signal<FloorWithDetails[]>([]);
  isLoading = signal(false);
  isSubmitting = signal(false);
  isEditing = signal(false);

  private http = inject(HttpClient);
  private structureService = inject(StructureService);
  private notificationService = inject(NotificationService);
  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<RoomFormModal>);
  data = inject(MAT_DIALOG_DATA) as {
    room?: RoomWithDetails;
    residences: ResidenceWithContact[];
    floors?: FloorWithDetails[];
    preselectedResidenceId?: string;
    preselectedFloorId?: string;
  };

  constructor() {
    this.roomForm = this.fb.group({
      name: ['', [Validators.required]],
      floor_id: ['', [Validators.required]],
      residence_id: ['', [Validators.required]]
    });

    this.residences.set(this.data.residences);
    if (this.data.floors?.length) {
      this.floors.set(this.data.floors);
    }
    this.isEditing.set(!!this.data.room);

    // Handle preselections when adding new room
    if (this.data.preselectedResidenceId) {
      this.roomForm.patchValue({ residence_id: this.data.preselectedResidenceId });
      this.loadFloors(this.data.preselectedResidenceId);

      // If there's also a preselected floor, set it after floors are loaded
      if (this.data.preselectedFloorId) {
        // We'll set this after floors are loaded
        setTimeout(() => {
          this.roomForm.patchValue({ floor_id: this.data.preselectedFloorId });
        }, 100);
      }
    }

    if (this.data.room) {
      this.roomForm.patchValue(this.data.room);
      this.loadFloors(this.data.room.residence_id);

      // Disable residence field when editing
      if (this.isEditing()) {
        this.roomForm.get('residence_id')?.disable();
      }
    }
  }

  onResidenceChange(residenceId: string): void {
    this.roomForm.patchValue({ floor_id: '' });
    this.floors.set([]);
    if (residenceId) {
      this.loadFloors(residenceId);
    }
  }

  private loadFloors(residenceId: string): void {
    this.isLoading.set(true);
    this.http.get<Record<string, unknown>[]>(`${environment.apiUrl}/structure/floors/${residenceId}/simple`).subscribe({
      next: response => {
        this.floors.set(
          (response || []).map(
            item =>
              ({
                id: item['id'] as string,
                name: item['name'] as string,
                residence_id: item['residence_id'] as string,
                residence_name: item['residence_name'] as string,
                created_at: (item['created_at'] as string) || new Date().toISOString(),
                updated_at: (item['updated_at'] as string) || null
              }) as FloorWithDetails
          )
        );
        this.isLoading.set(false);
      },
      error: (error: unknown) => {
        this.notificationService.handleApiError(error, 'Error al cargar los pisos');
        this.isLoading.set(false);
      }
    });
  }

  async onSubmit(): Promise<void> {
    if (this.roomForm.valid && !this.isSubmitting()) {
      this.isSubmitting.set(true);

      try {
        const formValue = this.roomForm.value;

        if (this.isEditing()) {
          // Update existing room
          const roomUpdate = {
            name: formValue.name,
            floor_id: formValue.floor_id
          };

          await firstValueFrom(
            this.structureService.updateRoomStructureRoomsIdPut({
              id: this.data.room!.id,
              body: roomUpdate as RoomUpdate
            })
          );

          this.notificationService.success('Habitación actualizada exitosamente');
        } else {
          // Create new room
          const roomCreate: RoomCreate = {
            name: formValue.name,
            floor_id: formValue.floor_id
          };

          await firstValueFrom(
            this.structureService.createRoomStructureRoomsPost({
              body: roomCreate
            })
          );

          this.notificationService.success('Habitación creada exitosamente');
        }

        this.dialogRef.close(true);
      } catch (error: unknown) {
        this.notificationService.handleApiError(
          error,
          this.isEditing() ? 'Error al actualizar la habitación' : 'Error al crear la habitación'
        );
      } finally {
        this.isSubmitting.set(false);
      }
    }
  }

  onClose(): void {
    this.dialogRef.close();
  }
}
