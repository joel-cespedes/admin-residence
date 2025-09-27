import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { provideNativeDateAdapter } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatRadioModule } from '@angular/material/radio';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';

import { StructureService } from '../../../../openapi/generated/services/structure.service';
import { FloorWithDetails } from '../../floor/model/floor.model';
import { ResidenceWithContact } from '../../residence/model/residence.model';
import { RoomWithDetails } from '../../room/model/room.model';
import { ResidentFormData, ResidentWithDetails } from '../model/resident.model';

@Component({
  selector: 'app-resident-form-modal',
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatRadioModule,
    ReactiveFormsModule,
    MatDatepickerModule
  ],
  providers: [provideNativeDateAdapter()],
  templateUrl: './resident-form-modal.html',
  styleUrl: './resident-form-modal.scss'
})
export class ResidentFormModal {
  resident: ResidentWithDetails | null = null;
  residences: ResidenceWithContact[];

  // Signals for UI state
  floors = signal<FloorWithDetails[]>([]);
  rooms = signal<RoomWithDetails[]>([]);
  beds = signal<any[]>([]);
  isLoadingFloors = signal(false);
  isLoadingRooms = signal(false);
  isLoadingBeds = signal(false);

  // Form
  residentForm: FormGroup;

  // Services
  private structureService = inject(StructureService);
  private fb = inject(FormBuilder);
  private data = inject(MAT_DIALOG_DATA);
  private dialogRef = inject(MatDialogRef<ResidentFormModal>);

  constructor() {
    this.resident = this.data.resident || null;
    this.residences = this.data.residences;

    this.residentForm = this.fb.group({
      full_name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
      birth_date: ['', Validators.required],
      sex: ['', Validators.required],
      comments: [''],
      status: ['active', Validators.required],
      residence_id: ['', Validators.required],
      floor_id: [''],
      room_id: [''],
      bed_id: ['']
    });

    this.initializeForm();
  }

  private async initializeForm(): Promise<void> {
    if (this.resident) {
      // Edit mode
      await this.setupEditMode();
    } else {
      // Create mode
      this.setupCreateMode();
    }
  }

  private async setupEditMode(): Promise<void> {
    if (!this.resident) return;

    // Set basic form values
    this.residentForm.patchValue({
      full_name: this.resident.full_name,
      birth_date: this.resident.birth_date,
      sex: this.resident.sex || '',
      comments: this.resident.comments || '',
      status: this.resident.status,
      residence_id: this.resident.residence_id,
      bed_id: this.resident.bed_id || ''
    });

    // Disable residence selection in edit mode
    this.residentForm.get('residence_id')?.disable();

    // Load floors for the residence
    await this.loadFloorsForResidence(this.resident.residence_id);

    // If resident has bed_id, get bed details to find floor and room
    if (this.resident.bed_id) {
      await this.loadBedDetailsAndSetSelections(this.resident.bed_id);
    } else {
      // If no bed but we have floor/room info from the resident data, try to load them
      // This handles cases where resident has floor but no bed assigned
      if (this.resident.floor_name) {
        // Try to find the floor by name and load rooms
        const floors = this.floors();
        const matchingFloor = floors.find(f => f.name === this.resident!.floor_name);
        if (matchingFloor) {
          this.residentForm.patchValue({ floor_id: matchingFloor.id });
          await this.loadRoomsForFloor(matchingFloor.id);

          // If we also have room info, try to load beds
          if (this.resident.room_name) {
            const rooms = this.rooms();
            const matchingRoom = rooms.find(r => r.name === this.resident!.room_name);
            if (matchingRoom) {
              this.residentForm.patchValue({ room_id: matchingRoom.id });
              await this.loadBedsForRoom(matchingRoom.id);
            }
          }
        }
      }
    }
  }

  private setupCreateMode(): void {
    if (this.data.selectedResidenceId) {
      this.residentForm.patchValue({
        residence_id: this.data.selectedResidenceId
      });
      this.loadFloorsForResidence(this.data.selectedResidenceId);
    }
  }

  // Event handlers
  onResidenceChange(residenceId: string): void {
    this.clearDependentSelections();
    this.residentForm.patchValue({
      residence_id: residenceId,
      floor_id: '',
      room_id: '',
      bed_id: ''
    });

    if (residenceId) {
      this.loadFloorsForResidence(residenceId);
    }
  }

  onFloorChange(floorId: string): void {
    this.clearRoomAndBedSelections();
    this.residentForm.patchValue({
      floor_id: floorId,
      room_id: '',
      bed_id: ''
    });

    if (floorId) {
      this.loadRoomsForFloor(floorId);
    }
  }

  onRoomChange(roomId: string): void {
    this.clearBedSelection();
    this.residentForm.patchValue({
      room_id: roomId,
      bed_id: ''
    });

    if (roomId) {
      this.loadBedsForRoom(roomId);
    }
  }

  onBedChange(bedId: string): void {
    this.residentForm.patchValue({ bed_id: bedId });
  }

  // Helper methods
  private clearDependentSelections(): void {
    this.floors.set([]);
    this.rooms.set([]);
    this.beds.set([]);
  }

  private clearRoomAndBedSelections(): void {
    this.rooms.set([]);
    this.beds.set([]);
  }

  private clearBedSelection(): void {
    this.beds.set([]);
  }

  // Data loading methods
  private async loadBedDetailsAndSetSelections(bedId: string): Promise<void> {
    try {
      // Get bed details to find room_id
      const bedData = await this.structureService.getBedStructureBedsIdGet({ id: bedId }).toPromise();
      if (!bedData) return;

      const roomId = bedData['room_id'];
      if (!roomId) return;

      // Get room details to find floor_id
      const roomData = await this.structureService.getRoomStructureRoomsIdGet({ id: roomId }).toPromise();
      if (!roomData) return;

      const floorId = roomData['floor_id'];
      if (!floorId) return;

      // Load rooms for this floor
      await this.loadRoomsForFloor(floorId);

      // Load beds for this room
      await this.loadBedsForRoom(roomId);

      // Set form values
      this.residentForm.patchValue({
        floor_id: floorId,
        room_id: roomId,
        bed_id: bedId
      });
    } catch (error) {
      console.error('Error loading bed details:', error);
    }
  }

  private async loadFloorsForResidence(residenceId: string): Promise<void> {
    this.isLoadingFloors.set(true);
    try {
      const response = await this.structureService
        .floorsSimpleStructureFloorsResidenceIdSimpleGet({
          residence_id: residenceId
        })
        .toPromise();

      this.floors.set(
        (response || []).map((item: Record<string, any>) => ({
          id: item['id'],
          name: item['name'],
          residence_id: item['residence_id'],
          residence_name: item['residence_name'],
          created_at: item['created_at'] || new Date().toISOString(),
          updated_at: item['updated_at'] || null
        })) as FloorWithDetails[]
      );
    } catch (error) {
      console.error('Error loading floors:', error);
    } finally {
      this.isLoadingFloors.set(false);
    }
  }

  private async loadRoomsForFloor(floorId: string): Promise<void> {
    this.isLoadingRooms.set(true);
    try {
      const response = await this.structureService
        .roomsSimpleStructureRoomsFloorIdSimpleGet({
          floor_id: floorId
        })
        .toPromise();

      this.rooms.set(
        (response || []).map((item: Record<string, any>) => ({
          id: item['id'],
          name: item['name'],
          residence_id: item['residence_id'],
          floor_id: item['floor_id'],
          residence_name: item['residence_name'] || 'Desconocida',
          floor_name: item['floor_name'] || 'Desconocido',
          created_at: item['created_at'] || new Date().toISOString(),
          updated_at: item['updated_at'] || null
        })) as RoomWithDetails[]
      );
    } catch (error) {
      console.error('Error loading rooms:', error);
    } finally {
      this.isLoadingRooms.set(false);
    }
  }

  private async loadBedsForRoom(roomId: string): Promise<void> {
    this.isLoadingBeds.set(true);
    try {
      const response = await this.structureService
        .bedsSimpleStructureBedsRoomIdSimpleGet({
          room_id: roomId
        })
        .toPromise();

      this.beds.set(
        (response || []).map((item: Record<string, any>) => ({
          id: item['id'],
          name: item['name'],
          room_id: item['room_id'],
          resident_name: item['resident_name'] || 'Sin asignar',
          created_at: item['created_at'] || new Date().toISOString(),
          updated_at: item['updated_at'] || null
        }))
      );
    } catch (error) {
      console.error('Error loading beds:', error);
    } finally {
      this.isLoadingBeds.set(false);
    }
  }

  // Modal actions
  close(): void {
    this.dialogRef.close();
  }

  submit(): void {
    if (this.residentForm.invalid) {
      this.residentForm.markAllAsTouched();
      return;
    }

    const formData: ResidentFormData = {
      full_name: this.residentForm.value.full_name,
      birth_date: this.residentForm.value.birth_date
        ? new Date(this.residentForm.value.birth_date).toISOString().split('T')[0]
        : this.residentForm.value.birth_date,
      sex: this.residentForm.value.sex,
      comments: this.residentForm.value.comments || null,
      status: this.residentForm.value.status,
      residence_id: this.residentForm.value.residence_id,
      floor_id: this.residentForm.value.floor_id || null,
      room_id: this.residentForm.value.room_id || null,
      bed_id: this.residentForm.value.bed_id || null
    };

    this.dialogRef.close(formData);
  }
}
