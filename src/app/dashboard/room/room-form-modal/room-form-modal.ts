import { Component, inject, Inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { ResidenceWithContact } from '../../residence/model/residence.model';
import { FloorWithDetails } from '../../floor/model/floor.model';
import { RoomFormData } from '../model/room.model';
import { NotificationService } from '../../../core/services/notification.service';

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
  isEditing = signal(false);

  private http = inject(HttpClient);
  private notificationService = inject(NotificationService);

  constructor(
    public dialogRef: MatDialogRef<RoomFormModal>,
    @Inject(MAT_DIALOG_DATA) public data: {
      room?: RoomFormData;
      residences: ResidenceWithContact[];
      preselectedResidenceId?: string;
      preselectedFloorId?: string;
    },
    private fb: FormBuilder
  ) {
    this.roomForm = this.fb.group({
      name: ['', [Validators.required]],
      floor_id: ['', [Validators.required]],
      residence_id: ['', [Validators.required]]
    });

    this.residences.set(data.residences);
    this.isEditing.set(!!data.room);

    // Handle preselections when adding new room
    if (data.preselectedResidenceId) {
      this.roomForm.patchValue({ residence_id: data.preselectedResidenceId });
      this.loadFloors(data.preselectedResidenceId);

      // If there's also a preselected floor, set it after floors are loaded
      if (data.preselectedFloorId) {
        // We'll set this after floors are loaded
        setTimeout(() => {
          this.roomForm.patchValue({ floor_id: data.preselectedFloorId });
        }, 100);
      }
    }

    if (data.room) {
      this.roomForm.patchValue(data.room);
      this.loadFloors(data.room.residence_id);
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
    this.http.get(`http://localhost:8000/structure/floors/${residenceId}/simple`).subscribe(
      (response: any) => {
        this.floors.set((response || []).map(
          (item: any) =>
            ({
              id: item['id'],
              name: item['name'],
              residence_id: item['residence_id'],
              residence_name: item['residence_name'],
              created_at: item['created_at'] || new Date().toISOString(),
              updated_at: item['updated_at'] || null
            }) as FloorWithDetails
        ));
        this.isLoading.set(false);
      },
      (error: any) => {
        this.notificationService.handleApiError(error, 'Error al cargar los pisos');
        this.isLoading.set(false);
      }
    );
  }

  onSubmit(): void {
    if (this.roomForm.valid) {
      this.dialogRef.close(this.roomForm.value);
    }
  }

  onClose(): void {
    this.dialogRef.close();
  }
}