import { Component, AfterViewInit, ViewChild, inject, OnInit, signal } from '@angular/core';
import { MatPaginator, MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { CommonModule, DatePipe } from '@angular/common';

import { Header } from '../shared/header/header';
import { ResidencesService } from '../../../openapi/generated/services/residences.service';
import { StructureService } from '../../../openapi/generated/services/structure.service';
import { ResidenceWithContact } from '../residence/model/residence.model';
import { FloorWithDetails } from '../floor/model/floor.model';
import { RoomWithDetails } from './model/room.model';
import { ViewRoomModal } from './view-room-modal/view-room-modal';
import { RoomFormModal } from './room-form-modal/room-form-modal';
import { DeleteRoomModal } from './delete-room-modal/delete-room-modal';
import { NotificationService } from '../../core/services/notification.service';

@Component({
  selector: 'app-room',
  standalone: true,
  imports: [
    CommonModule,
    MatFormFieldModule,
    MatInputModule,
    MatTableModule,
    MatSortModule,
    MatPaginatorModule,
    Header,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatDialogModule,
    MatButtonToggleModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    DatePipe
  ],
  templateUrl: './room.html',
  styleUrl: './room.scss'
})
export class Room implements AfterViewInit, OnInit {
  displayedColumns: string[] = ['name', 'floor_name', 'residence_name', 'created_at', 'actions'];
  dataSource: MatTableDataSource<RoomWithDetails> = new MatTableDataSource<RoomWithDetails>([]);

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  private residencesService = inject(ResidencesService);
  private structureService = inject(StructureService);
  private dialog = inject(MatDialog);
  private notificationService = inject(NotificationService);

  residences = signal<ResidenceWithContact[]>([]);
  floors = signal<FloorWithDetails[]>([]);
  selectedResidenceId = signal<string>('');
  selectedFloorId = signal<string>('');
  isLoadingResidences = signal(false);
  isLoadingFloors = signal(false);
  isLoadingRooms = signal(false);

  // Pagination signals
  pageIndex = signal(0);
  pageSize = signal(10);
  totalItems = signal(0);

  // Search signals
  searchTerm = signal('');
  private searchTimeout: ReturnType<typeof setTimeout> | null = null;

  ngOnInit() {
    console.log('Room component initialized');
    // Load all rooms and residences on init
    this.loadRoomsData();
    this.loadResidences();
  }

  ngAfterViewInit() {
    // Setup paginator events - IMPORTANT: Don't connect paginator to dataSource for backend pagination
    if (this.paginator) {
      this.paginator.page.subscribe((event: PageEvent) => {
        console.log('Paginator event - Page:', event.pageIndex, 'Size:', event.pageSize);
        this.pageIndex.set(event.pageIndex);
        this.pageSize.set(event.pageSize);
        this.loadRoomsData();
      });
    }

    // Setup sort events
    if (this.sort) {
      this.sort.sortChange.subscribe(() => {
        console.log('Sort event triggered');
        this.pageIndex.set(0); // Reset to first page when sorting
        this.loadRoomsData();
      });
    }
  }

  private loadResidences() {
    this.isLoadingResidences.set(true);
    this.residencesService.listResidencesResidencesGet().subscribe({
      next: (response: { items: any[] }) => {
        this.residences.set(response.items || []);
        this.isLoadingResidences.set(false);
      },
      error: (error: { status?: number; message?: string }) => {
        this.notificationService.handleApiError(error, 'Error al cargar las residencias');
        this.isLoadingResidences.set(false);
      }
    });
  }

  onResidenceChange(residenceId: string) {
    this.selectedResidenceId.set(residenceId);
    this.selectedFloorId.set(''); // Reset floor selection
    this.floors.set([]);
    this.pageIndex.set(0); // Reset to first page

    if (residenceId) {
      this.loadFloors();
      this.loadRoomsData();
    } else {
      // Load all rooms when no residence is selected
      this.loadRoomsData();
    }
  }

  private loadFloors() {
    if (!this.selectedResidenceId()) return;

    this.isLoadingFloors.set(true);
    this.structureService
      .floorsSimpleStructureFloorsResidenceIdSimpleGet({ residence_id: this.selectedResidenceId() })
      .subscribe({
        next: (response: Record<string, any>[]) => {
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
          this.isLoadingFloors.set(false);
        },
        error: (error: { status?: number; message?: string }) => {
          this.notificationService.handleApiError(error, 'Error al cargar los pisos');
          this.isLoadingFloors.set(false);
        }
      });
  }

  onFloorChange(floorId: string) {
    console.log('Floor changed to:', floorId);
    this.selectedFloorId.set(floorId);
    this.pageIndex.set(0); // Reset to first page
    this.loadRoomsData();
  }

  private loadRoomsData() {
    this.isLoadingRooms.set(true);

    // If a specific floor is selected, use the floor-specific endpoint
    if (this.selectedFloorId()) {
      this.loadRooms();
      return;
    }

    // Otherwise use the paginated endpoint
    const params: Record<string, string | number> = {
      page: this.pageIndex() + 1, // API uses 1-based indexing
      size: this.pageSize()
    };

    // Add filters based on current selection
    if (this.selectedResidenceId()) {
      params['X-Residence-Id'] = this.selectedResidenceId();
    }

    // Add search term if provided
    if (this.searchTerm()) {
      params['search'] = this.searchTerm();
    }

    this.structureService.listRoomsStructureRoomsGet(params).subscribe({
      next: (response: { items: Record<string, any>[]; total?: number }) => {
        this.dataSource.data = (response.items || []).map(
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
        );
        this.totalItems.set(response.total || 0);
        this.isLoadingRooms.set(false);
      },
      error: (error: { status?: number; message?: string }) => {
        this.notificationService.handleApiError(error, 'Error al cargar las habitaciones');
        this.isLoadingRooms.set(false);
      }
    });
  }

  private loadRoomsByResidence(residenceId: string) {
    this.isLoadingRooms.set(true);
    this.structureService.listRoomsStructureRoomsGet({ 'X-Residence-Id': residenceId }).subscribe({
      next: (response: { items: Record<string, any>[] }) => {
        this.dataSource.data = (response.items || []).map(
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
        );
        this.isLoadingRooms.set(false);
      },
      error: (error: { status?: number; message?: string }) => {
        this.notificationService.handleApiError(error, 'Error al cargar las habitaciones de la residencia');
        this.isLoadingRooms.set(false);
      }
    });
  }

  private loadRooms() {
    const floorId = this.selectedFloorId();
    console.log('Loading rooms for floor:', floorId);
    if (!floorId) return;

    this.isLoadingRooms.set(true);
    this.structureService.roomsSimpleStructureRoomsFloorIdSimpleGet({ floor_id: floorId }).subscribe({
      next: (response: Record<string, any>[]) => {
        this.dataSource.data = (response || []).map(
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
        );
        this.isLoadingRooms.set(false);
      },
      error: (error: { status?: number; message?: string }) => {
        console.error('Error loading rooms:', error);
        // If we get a 500 error, it likely means the floor doesn't exist
        if (error.status === 500) {
          console.log('Floor does not exist, clearing selection');
          this.notificationService.error('El piso seleccionado no existe o ha sido eliminado');
          // Clear the invalid floor selection
          this.selectedFloorId.set('');
          this.dataSource.data = [];
        } else {
          this.notificationService.handleApiError(error, 'Error al cargar las habitaciones');
        }
        this.isLoadingRooms.set(false);
      }
    });
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;

    // Clear existing timeout
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }

    // Set new timeout for debounce (300ms)
    this.searchTimeout = setTimeout(() => {
      this.searchTerm.set(filterValue.trim());
      this.pageIndex.set(0); // Reset to first page when filtering
      this.loadRoomsData();
    }, 300);
  }

  viewRoom(room: RoomWithDetails) {
    const dialogRef = this.dialog.open(ViewRoomModal, {
      data: room,
      width: '600px',
      maxWidth: '90vw'
    });

    dialogRef.afterClosed().subscribe((result: any) => {
      if (result) {
        this.loadRoomsData();
      }
    });
  }

  editRoom(room: RoomWithDetails) {
    const dialogRef = this.dialog.open(RoomFormModal, {
      data: { room: room, residences: this.residences() },
      width: '60%',
      maxWidth: '90vw'
    });

    dialogRef.afterClosed().subscribe((result: any) => {
      if (result) {
        // Update the room using the service
        this.structureService
          .updateRoomStructureRoomsIdPut({
            id: room.id,
            body: {
              name: result.name
            }
          })
          .subscribe({
            next: () => {
              this.notificationService.success('Habitación actualizada exitosamente');
              this.loadRoomsData();
            },
            error: (error: { status?: number; message?: string }) => {
              this.notificationService.handleApiError(error, 'Error al actualizar la habitación');
            }
          });
      }
    });
  }

  deleteRoom(room: RoomWithDetails) {
    const dialogRef = this.dialog.open(DeleteRoomModal, {
      data: room,
      width: '50%',
      maxWidth: '90vw'
    });

    dialogRef.afterClosed().subscribe((result: any) => {
      if (result) {
        // Delete the room using the service
        this.structureService
          .deleteRoomStructureRoomsIdDelete({
            id: room.id
          })
          .subscribe({
            next: () => {
              this.notificationService.success('Habitación eliminada exitosamente');
              this.loadRoomsData();
            },
            error: (error: { status?: number; message?: string }) => {
              this.notificationService.handleApiError(error, 'Error al eliminar la habitación');
            }
          });
      }
    });
  }

  addRoom() {
    const dialogRef = this.dialog.open(RoomFormModal, {
      data: {
        residences: this.residences(),
        preselectedResidenceId: this.selectedResidenceId(),
        preselectedFloorId: this.selectedFloorId()
      },
      width: '60%',
      maxWidth: '90vw'
    });

    dialogRef.afterClosed().subscribe((result: any) => {
      if (result) {
        // Create the room using the service
        this.structureService
          .createRoomStructureRoomsPost({
            body: {
              name: result.name,
              floor_id: result.floor_id
            }
          })
          .subscribe({
            next: () => {
              this.notificationService.success('Habitación creada exitosamente');
              this.loadRoomsData();
            },
            error: (error: { status?: number; message?: string }) => {
              this.notificationService.handleApiError(error, 'Error al crear la habitación');
            }
          });
      }
    });
  }
}
