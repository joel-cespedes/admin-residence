import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';

import { StructureService } from '../../../../openapi/generated/services/structure.service';
import { FloorWithDetails } from '../../floor/model/floor.model';
import { ResidenceWithContact } from '../../residence/model/residence.model';
import { RoomWithDetails } from '../../room/model/room.model';
import { BedFormData, BedWithDetails } from '../model/bed.model';

@Component({
  selector: 'app-bed-form-modal',
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    ReactiveFormsModule
  ],
  templateUrl: './bed-form-modal.html',
  styleUrl: './bed-form-modal.scss'
})
export class BedFormModal {
  bed: BedWithDetails | null = null;
  residences: ResidenceWithContact[];
  floors = signal<FloorWithDetails[]>([]);
  rooms = signal<RoomWithDetails[]>([]);
  selectedResidenceId = signal<string>('');
  selectedFloorId = signal<string>('');
  selectedRoomId = signal<string>('');
  isLoadingFloors = signal(false);
  isLoadingRooms = signal(false);

  bedForm: FormGroup;

  private structureService = inject(StructureService);
  private fb = inject(FormBuilder);
  data = inject(MAT_DIALOG_DATA);
  private dialogRef = inject(MatDialogRef<BedFormModal>);

  constructor() {
    this.bed = this.data.bed || null;
    this.residences = this.data.residences;

    this.bedForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
      residence_id: ['', Validators.required],
      floor_id: ['', Validators.required],
      room_id: ['', Validators.required]
    });

    // If editing, populate the form
    if (this.bed) {
      this.bedForm.patchValue({
        name: this.bed.name,
        residence_id: this.bed.residence_id,
        floor_id: '', // Will be set when residence is selected
        room_id: this.bed.room_id
      });

      // Set initial selections and load data
      this.selectedResidenceId.set(this.bed.residence_id);
      this.loadFloorsForResidence(this.bed.residence_id);

      // Load room details to get floor_id
      this.loadRoomDetailsForEdit();
    } else if (this.data.selectedResidenceId) {
      // If adding and there's a pre-selected residence, set it up
      this.bedForm.patchValue({
        residence_id: this.data.selectedResidenceId
      });
      this.selectedResidenceId.set(this.data.selectedResidenceId);

      // If floors are already loaded, use them
      if (this.data.floors && this.data.floors.length > 0) {
        this.floors.set(this.data.floors);

        // If floor is pre-selected
        if (this.data.selectedFloorId) {
          this.bedForm.patchValue({
            floor_id: this.data.selectedFloorId
          });
          this.selectedFloorId.set(this.data.selectedFloorId);

          // If rooms are already loaded, use them
          if (this.data.rooms && this.data.rooms.length > 0) {
            this.rooms.set(this.data.rooms);

            // If room is pre-selected
            if (this.data.selectedRoomId) {
              this.bedForm.patchValue({
                room_id: this.data.selectedRoomId
              });
              this.selectedRoomId.set(this.data.selectedRoomId);
            }
          } else if (this.data.selectedFloorId) {
            // Load rooms for the selected floor
            this.loadRoomsForFloor(this.data.selectedFloorId);
          }
        }
      } else {
        // Load floors for the selected residence
        this.loadFloorsForResidence(this.data.selectedResidenceId);
      }
    }
  }

  onResidenceChange(residenceId: string) {
    this.selectedResidenceId.set(residenceId);
    this.selectedFloorId.set('');
    this.selectedRoomId.set('');
    this.floors.set([]);
    this.rooms.set([]);
    this.bedForm.patchValue({ floor_id: '', room_id: '' });

    if (residenceId) {
      this.loadFloorsForResidence(residenceId);
    }
  }

  onFloorChange(floorId: string) {
    this.selectedFloorId.set(floorId);
    this.selectedRoomId.set('');
    this.rooms.set([]);
    this.bedForm.patchValue({ room_id: '' });

    if (floorId) {
      this.loadRoomsForFloor(floorId);
    }
  }

  onRoomChange(roomId: string) {
    this.selectedRoomId.set(roomId);
    this.bedForm.patchValue({ room_id: roomId });
  }

  private loadFloorsForResidence(residenceId: string) {
    this.isLoadingFloors.set(true);
    this.structureService.floorsSimpleStructureFloorsResidenceIdSimpleGet({ residence_id: residenceId }).subscribe({
      next: response => {
        this.floors.set(
          (response || []).map(
            (item: Record<string, any>) =>
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

        // If editing, the floor selection will be handled after we get room details
        if (this.bed) {
          // The floor will be selected in loadRoomDetailsForEdit method
        }

        this.isLoadingFloors.set(false);
      },
      error: () => {
        this.isLoadingFloors.set(false);
      }
    });
  }

  private loadRoomsForFloor(floorId: string) {
    this.isLoadingRooms.set(true);
    this.structureService.roomsSimpleStructureRoomsFloorIdSimpleGet({ floor_id: floorId }).subscribe({
      next: response => {
        this.rooms.set(
          (response || []).map(
            (item: Record<string, any>) =>
              ({
                id: item['id'],
                name: item['name'],
                residence_id: item['residence_id'],
                floor_id: item['floor_id'],
                residence_name: item['residence_name'] || 'Desconocida',
                floor_name: item['floor_name'] || 'Desconocido',
                created_at: item['created_at'] || new Date().toISOString(),
                updated_at: item['updated_at'] || null
              }) as RoomWithDetails
          )
        );

        // If editing, set the room selection
        if (this.bed) {
          this.selectedRoomId.set(this.bed.room_id);
          this.bedForm.patchValue({ room_id: this.bed.room_id });
        }

        this.isLoadingRooms.set(false);
      },
      error: () => {
        this.isLoadingRooms.set(false);
      }
    });
  }

  private loadRoomDetailsForEdit() {
    if (!this.bed || !this.bed.room_id) return;

    // Get room details to find the floor_id
    this.structureService.getRoomStructureRoomsIdGet({ id: this.bed.room_id }).subscribe({
      next: (roomData: Record<string, any>) => {
        const floorId = roomData['floor_id'];
        if (floorId) {
          // Wait for floors to load, then select the correct floor
          const checkFloorsLoaded = () => {
            if (this.floors().length > 0) {
              const floor = this.floors().find(f => f.id === floorId);
              if (floor) {
                this.selectedFloorId.set(floor.id);
                this.bedForm.patchValue({ floor_id: floor.id });
                this.loadRoomsForFloor(floor.id);
              }
            } else {
              // If floors not loaded yet, check again after a short delay
              setTimeout(checkFloorsLoaded, 100);
            }
          };
          checkFloorsLoaded();
        }
      },
      error: () => {
        // Handle error silently
      }
    });
  }

  close() {
    this.dialogRef.close();
  }

  submit() {
    if (this.bedForm.invalid) {
      this.bedForm.markAllAsTouched();
      return;
    }

    const formData: BedFormData = {
      name: this.bedForm.value.name,
      residence_id: this.bedForm.value.residence_id,
      floor_id: this.bedForm.value.floor_id,
      room_id: this.bedForm.value.room_id
    };

    this.dialogRef.close(formData);
  }
}
