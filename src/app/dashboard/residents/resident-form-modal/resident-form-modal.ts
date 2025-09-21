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

import { ResidencesService } from '../../../../openapi/generated/services/residences.service';
import { StructureService } from '../../../../openapi/generated/services/structure.service';
import { FloorWithDetails } from '../../floor/model/floor.model';
import { ResidenceWithContact } from '../../residence/model/residence.model';
import { RoomWithDetails } from '../../room/model/room.model';
import { ResidentFormData, ResidentWithDetails } from '../model/resident.model';

@Component({
  selector: 'app-resident-form-modal',
  standalone: true,
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
  floors = signal<FloorWithDetails[]>([]);
  rooms = signal<RoomWithDetails[]>([]);
  beds = signal<any[]>([]);
  selectedResidenceId = signal<string>('');
  selectedFloorId = signal<string>('');
  selectedRoomId = signal<string>('');
  selectedBedId = signal<string>('');
  isLoadingFloors = signal(false);
  isLoadingRooms = signal(false);
  isLoadingBeds = signal(false);

  residentForm: FormGroup;

  private residencesService = inject(ResidencesService);
  private structureService = inject(StructureService);
  private fb = inject(FormBuilder);

  data = inject(MAT_DIALOG_DATA);
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

    // If editing, populate the form
    if (this.resident) {
      this.residentForm.patchValue({
        full_name: this.resident.full_name,
        birth_date: this.resident.birth_date,
        sex: this.resident.sex || '',
        comments: this.resident.comments || '',
        status: this.resident.status,
        residence_id: this.resident.residence_id,
        bed_id: this.resident.bed_id || ''
      });

      // Disable residence_id control in edit mode
      this.residentForm.get('residence_id')?.disable();

      // Set initial selections and load data
      this.selectedResidenceId.set(this.resident.residence_id);
      this.loadFloorsForResidence(this.resident.residence_id);

      // Load bed details to get room/floor info
      if (this.resident.bed_id) {
        this.loadBedDetailsForEdit();
      }
    } else if (this.data.selectedResidenceId) {
      // If adding and there's a pre-selected residence, set it up
      this.residentForm.patchValue({
        residence_id: this.data.selectedResidenceId
      });
      this.selectedResidenceId.set(this.data.selectedResidenceId);

      // If floors are already loaded, use them
      if (this.data.floors && this.data.floors.length > 0) {
        this.floors.set(this.data.floors);

        // If floor is pre-selected
        if (this.data.selectedFloorId) {
          this.residentForm.patchValue({
            floor_id: this.data.selectedFloorId
          });
          this.selectedFloorId.set(this.data.selectedFloorId);

          // If rooms are already loaded, use them
          if (this.data.rooms && this.data.rooms.length > 0) {
            this.rooms.set(this.data.rooms);

            // If room is pre-selected
            if (this.data.selectedRoomId) {
              this.residentForm.patchValue({
                room_id: this.data.selectedRoomId
              });
              this.selectedRoomId.set(this.data.selectedRoomId);
              this.loadBedsForRoom(this.data.selectedRoomId);

              // If bed is pre-selected
              if (this.data.selectedBedId) {
                this.residentForm.patchValue({
                  bed_id: this.data.selectedBedId
                });
                this.selectedBedId.set(this.data.selectedBedId);
              }
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
    this.selectedBedId.set('');
    this.floors.set([]);
    this.rooms.set([]);
    this.beds.set([]);
    this.residentForm.patchValue({ floor_id: '', room_id: '', bed_id: '' });

    if (residenceId) {
      this.loadFloorsForResidence(residenceId);
    }
  }

  onFloorChange(floorId: string) {
    this.selectedFloorId.set(floorId);
    this.selectedRoomId.set('');
    this.selectedBedId.set('');
    this.rooms.set([]);
    this.beds.set([]);
    this.residentForm.patchValue({ room_id: '', bed_id: '' });

    if (floorId) {
      this.loadRoomsForFloor(floorId);
    }
  }

  onRoomChange(roomId: string) {
    this.selectedRoomId.set(roomId);
    this.selectedBedId.set('');
    this.beds.set([]);
    this.residentForm.patchValue({ bed_id: '' });

    if (roomId) {
      this.loadBedsForRoom(roomId);
    }
  }

  onBedChange(bedId: string) {
    this.selectedBedId.set(bedId);
    this.residentForm.patchValue({ bed_id: bedId });
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

        // If editing, the floor selection will be handled after we get bed details
        if (this.resident && this.resident.bed_id) {
          // The floor will be selected in loadBedDetailsForEdit method
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

        this.isLoadingRooms.set(false);
      },
      error: () => {
        this.isLoadingRooms.set(false);
      }
    });
  }

  private loadBedsForRoom(roomId: string) {
    this.isLoadingBeds.set(true);
    this.structureService.bedsSimpleStructureBedsRoomIdSimpleGet({ room_id: roomId }).subscribe({
      next: response => {
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

        // If editing, set the bed selection
        if (this.resident && this.resident.bed_id) {
          this.selectedBedId.set(this.resident.bed_id);
          this.residentForm.patchValue({ bed_id: this.resident.bed_id });
        }

        this.isLoadingBeds.set(false);
      },
      error: () => {
        this.isLoadingBeds.set(false);
      }
    });
  }

  private loadBedDetailsForEdit() {
    if (!this.resident || !this.resident.bed_id) return;

    // Get bed details to find the room_id
    this.structureService.getBedStructureBedsIdGet({ id: this.resident.bed_id }).subscribe({
      next: (bedData: Record<string, any>) => {
        const roomId = bedData['room_id'];
        if (roomId) {
          // Get room details to find the floor_id
          this.structureService.getRoomStructureRoomsIdGet({ id: roomId }).subscribe({
            next: (roomData: Record<string, any>) => {
              const floorId = roomData['floor_id'];
              if (floorId) {
                const checkFloorsLoaded = () => {
                  if (this.floors().length > 0) {
                    const floor = this.floors().find(f => f.id === floorId);
                    if (floor) {
                      this.selectedFloorId.set(floor.id);
                      this.residentForm.patchValue({ floor_id: floor.id });
                    }
                  } else {
                    setTimeout(checkFloorsLoaded, 100);
                  }
                };
                checkFloorsLoaded();
              }

              // Wait for rooms to load, then load beds
              const checkRoomsLoaded = () => {
                if (this.rooms().length > 0) {
                  const room = this.rooms().find(r => r.id === roomId);
                  if (room) {
                    this.selectedRoomId.set(room.id);
                    this.residentForm.patchValue({ room_id: room.id });
                    this.loadBedsForRoom(room.id);
                  }
                } else {
                  setTimeout(checkRoomsLoaded, 100);
                }
              };
              checkRoomsLoaded();
            },
            error: () => {
              // Handle error silently - still try to set room selection
              const checkRoomsLoaded = () => {
                if (this.rooms().length > 0) {
                  const room = this.rooms().find(r => r.id === roomId);
                  if (room) {
                    this.selectedRoomId.set(room.id);
                    this.residentForm.patchValue({ room_id: room.id });
                    this.loadBedsForRoom(room.id);
                  }
                } else {
                  setTimeout(checkRoomsLoaded, 100);
                }
              };
              checkRoomsLoaded();
            }
          });
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
