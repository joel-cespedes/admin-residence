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
import { environment } from '../../../../environments/environment';
import { FloorWithDetails } from '../../floor/model/floor.model';
import { ResidenceWithContact } from '../../residence/model/residence.model';
import { RoomFormData } from '../model/room.model';

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
  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<RoomFormModal>);
  data = inject(MAT_DIALOG_DATA) as {
    room?: RoomFormData;
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
    this.http.get(`${environment.apiUrl}/structure/floors/${residenceId}/simple`).subscribe(
      (response: any) => {
        this.floors.set(
          (response || []).map(
            (item: any) =>
              ({
                id: item['id'],
                name: item['name'],
                residence_id: item['residence_id'],
                residence_name: item['residence_name'],
                created_at: item['created_at'] || new Date().toISOString(),
                updated_at: item['updated_at'] || null
              }) as FloorWithDetails
          )
        );
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
