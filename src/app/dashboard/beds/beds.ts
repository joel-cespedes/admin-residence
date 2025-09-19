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
import { RoomWithDetails } from '../room/model/room.model';
import { BedWithDetails, BedFormData } from './model/bed.model';
import { NotificationService } from '../../core/services/notification.service';
import { ViewBedModal } from './view-bed-modal/view-bed-modal';
import { BedFormModal } from './bed-form-modal/bed-form-modal';
import { DeleteBedModal } from './delete-bed-modal/delete-bed-modal';

@Component({
  selector: 'app-beds',
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
  templateUrl: './beds.html',
  styleUrl: './beds.scss'
})
export class Beds implements AfterViewInit, OnInit {
  displayedColumns: string[] = ['name', 'room_name', 'floor_name', 'residence_name', 'resident_name', 'created_at', 'actions'];
  dataSource: MatTableDataSource<BedWithDetails> = new MatTableDataSource<BedWithDetails>([]);

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  private residencesService = inject(ResidencesService);
  private structureService = inject(StructureService);
  private dialog = inject(MatDialog);
  private notificationService = inject(NotificationService);

  residences = signal<ResidenceWithContact[]>([]);
  floors = signal<FloorWithDetails[]>([]);
  rooms = signal<RoomWithDetails[]>([]);
  selectedResidenceId = signal<string>('');
  selectedFloorId = signal<string>('');
  selectedRoomId = signal<string>('');
  isLoadingResidences = signal(false);
  isLoadingFloors = signal(false);
  isLoadingRooms = signal(false);
  isLoadingBeds = signal(false);

  // Pagination signals
  pageIndex = signal(0);
  pageSize = signal(10);
  totalItems = signal(0);

  // Search signals
  searchTerm = signal('');
  private searchTimeout: ReturnType<typeof setTimeout> | null = null;

  ngOnInit() {
    console.log('Beds component initialized');
    // Load all residences and beds on init
    this.loadResidences();
    this.loadBedsData(); // Load all beds initially
  }

  ngAfterViewInit() {
    // Setup paginator events - IMPORTANT: Don't connect paginator to dataSource for backend pagination
    if (this.paginator) {
      this.paginator.page.subscribe((event: PageEvent) => {
        console.log('Paginator event - Page:', event.pageIndex, 'Size:', event.pageSize);
        this.pageIndex.set(event.pageIndex);
        this.pageSize.set(event.pageSize);
        this.loadBedsData();
      });
    }

    // Setup sort events
    if (this.sort) {
      this.sort.sortChange.subscribe(() => {
        console.log('Sort event triggered');
        this.pageIndex.set(0); // Reset to first page when sorting
        this.loadBedsData();
      });
    }
  }

  private loadResidences() {
    this.isLoadingResidences.set(true);
    this.residencesService.listResidencesResidencesGet().subscribe({
      next: (response: { items: Record<string, any>[] }) => {
        this.residences.set((response.items || []).map(
          (item: Record<string, any>) =>
            ({
              id: item['id'],
              name: item['name'],
              address: item['address'],
              phone: item['phone'] || 'No especificado',
              email: item['email'] || 'No especificado',
              created_at: item['created_at'] || new Date().toISOString(),
              updated_at: item['updated_at'] || null
            }) as ResidenceWithContact
        ));
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
    this.selectedRoomId.set(''); // Reset room selection
    this.floors.set([]);
    this.rooms.set([]);
    this.pageIndex.set(0); // Reset to first page

    if (residenceId) {
      this.loadFloors();
    } else {
      // Load all beds when no residence is selected
      this.loadBedsData();
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
    this.selectedRoomId.set(''); // Reset room selection
    this.rooms.set([]);
    this.pageIndex.set(0); // Reset to first page

    if (floorId) {
      this.loadRooms();
    } else {
      this.loadBedsData();
    }
  }

  private loadRooms() {
    if (!this.selectedFloorId()) return;

    this.isLoadingRooms.set(true);
    this.structureService.roomsSimpleStructureRoomsFloorIdSimpleGet({ floor_id: this.selectedFloorId() }).subscribe({
      next: (response: Record<string, any>[]) => {
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
      error: (error: { status?: number; message?: string }) => {
        this.notificationService.handleApiError(error, 'Error al cargar las habitaciones');
        this.isLoadingRooms.set(false);
      }
    });
  }

  onRoomChange(roomId: string) {
    console.log('Room changed to:', roomId);
    this.selectedRoomId.set(roomId);
    this.pageIndex.set(0); // Reset to first page
    this.loadBedsData();
  }

  private loadBedsData() {
    this.isLoadingBeds.set(true);

    // If a specific room is selected, use the room-specific endpoint
    if (this.selectedRoomId()) {
      this.loadBedsByRoom();
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

    this.structureService.listBedsStructureBedsGet(params).subscribe({
      next: (response: { items: Record<string, any>[]; total?: number }) => {
        this.dataSource.data = (response.items || []).map(
          (item: Record<string, any>) =>
            ({
              id: item['id'],
              name: item['name'],
              residence_id: item['residence_id'],
              room_id: item['room_id'],
              residence_name: item['residence_name'] || 'Desconocida',
              room_name: item['room_name'] || 'Desconocida',
              floor_name: item['floor_name'] || 'Desconocido',
              resident_name: item['resident_name'] || 'Sin asignar',
              created_at: item['created_at'] || new Date().toISOString(),
              updated_at: item['updated_at'] || null
            }) as BedWithDetails
        );
        this.totalItems.set(response.total || 0);
        this.isLoadingBeds.set(false);
      },
      error: (error: { status?: number; message?: string }) => {
        this.notificationService.handleApiError(error, 'Error al cargar las camas');
        this.isLoadingBeds.set(false);
      }
    });
  }

  private loadBedsByRoom() {
    const roomId = this.selectedRoomId();
    console.log('Loading beds for room:', roomId);
    if (!roomId) return;

    this.isLoadingBeds.set(true);
    this.structureService.bedsSimpleStructureBedsRoomIdSimpleGet({ room_id: roomId }).subscribe({
      next: (response: Record<string, any>[]) => {
        this.dataSource.data = (response || []).map(
          (item: Record<string, any>) =>
            ({
              id: item['id'],
              name: item['name'],
              residence_id: item['residence_id'],
              room_id: item['room_id'],
              residence_name: item['residence_name'] || 'Desconocida',
              room_name: item['room_name'] || 'Desconocida',
              floor_name: item['floor_name'] || 'Desconocido',
              resident_name: item['resident_name'] || 'Sin asignar',
              created_at: item['created_at'] || new Date().toISOString(),
              updated_at: item['updated_at'] || null
            }) as BedWithDetails
        );
        this.totalItems.set(this.dataSource.data.length);
        this.isLoadingBeds.set(false);
      },
      error: (error: { status?: number; message?: string }) => {
        console.error('Error loading beds:', error);
        if (error.status === 500) {
          console.log('Room does not exist, clearing selection');
          this.notificationService.error('La habitación seleccionada no existe o ha sido eliminada');
          this.selectedRoomId.set('');
          this.dataSource.data = [];
        } else {
          this.notificationService.handleApiError(error, 'Error al cargar las camas');
        }
        this.isLoadingBeds.set(false);
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
      this.loadBedsData();
    }, 300);
  }

  viewBed(bed: BedWithDetails) {
    const dialogRef = this.dialog.open(ViewBedModal, {
      data: bed,
      width: '600px',
      maxWidth: '90vw'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadBedsData();
      }
    });
  }

  editBed(bed: BedWithDetails) {
    const dialogRef = this.dialog.open(BedFormModal, {
      data: { bed, residences: this.residences() },
      width: '60%',
      maxWidth: '90vw'
    });

    dialogRef.afterClosed().subscribe((result: BedFormData | null) => {
      if (result) {
        this.structureService
          .updateBedStructureBedsIdPut({
            id: bed.id,
            body: {
              name: result.name
            }
          })
          .subscribe({
            next: () => {
              this.notificationService.success('Cama actualizada exitosamente');
              this.loadBedsData();
            },
            error: (error: { status?: number; message?: string }) => {
              this.notificationService.handleApiError(error, 'Error al actualizar la cama');
            }
          });
      }
    });
  }

  deleteBed(bed: BedWithDetails) {
    const dialogRef = this.dialog.open(DeleteBedModal, {
      data: bed,
      width: '50%',
      maxWidth: '90vw'
    });

    dialogRef.afterClosed().subscribe((result: boolean) => {
      if (result) {
        this.structureService
          .deleteBedStructureBedsIdDelete({
            id: bed.id
          })
          .subscribe({
            next: () => {
              this.notificationService.success('Cama eliminada exitosamente');
              this.loadBedsData();
            },
            error: (error: { status?: number; message?: string }) => {
              this.notificationService.handleApiError(error, 'Error al eliminar la cama');
            }
          });
      }
    });
  }

  addBed() {
    const dialogRef = this.dialog.open(BedFormModal, {
      data: {
        residences: this.residences(),
        selectedResidenceId: this.selectedResidenceId(),
        selectedFloorId: this.selectedFloorId(),
        selectedRoomId: this.selectedRoomId(),
        floors: this.floors(),
        rooms: this.rooms()
      },
      width: '60%',
      maxWidth: '90vw'
    });

    dialogRef.afterClosed().subscribe((result: BedFormData | null) => {
      if (result) {
        this.structureService
          .createBedStructureBedsPost({
            body: {
              name: result.name,
              room_id: result.room_id
            }
          })
          .subscribe({
            next: () => {
              this.notificationService.success('Cama creada exitosamente');
              this.loadBedsData();
            },
            error: (error: { status?: number; message?: string }) => {
              this.notificationService.handleApiError(error, 'Error al crear la cama');
            }
          });
      }
    });
  }
}
