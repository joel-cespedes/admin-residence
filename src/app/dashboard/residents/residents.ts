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
import { BedWithDetails } from '../beds/model/bed.model';
import { ResidentWithDetails, ResidentFormData } from './model/resident.model';
import { ResidentsService } from '../../../openapi/generated/services/residents.service';
import { NotificationService } from '../../core/services/notification.service';
import { ViewResidentModal } from './view-resident-modal/view-resident-modal';
import { ResidentFormModal } from './resident-form-modal/resident-form-modal';
import { DeleteResidentModal } from './delete-resident-modal/delete-resident-modal';
import { StorageService } from '@core';

@Component({
  selector: 'app-residents',
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
  templateUrl: './residents.html',
  styleUrl: './residents.scss'
})
export class Residents implements AfterViewInit, OnInit {
  displayedColumns: string[] = [
    'full_name',
    'birth_date',
    'status',
    'bed_name',
    'room_name',
    'floor_name',
    'residence_name',
    'created_at',
    'actions'
  ];
  dataSource: MatTableDataSource<ResidentWithDetails> = new MatTableDataSource<ResidentWithDetails>([]);

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  private residencesService = inject(ResidencesService);
  private structureService = inject(StructureService);
  private residentsService = inject(ResidentsService);
  private dialog = inject(MatDialog);
  private notificationService = inject(NotificationService);
  private storageService = inject(StorageService);

  residences = signal<ResidenceWithContact[]>([]);
  floors = signal<FloorWithDetails[]>([]);
  rooms = signal<RoomWithDetails[]>([]);
  beds = signal<BedWithDetails[]>([]);
  selectedResidenceId = signal<string>('');
  selectedFloorId = signal<string>('');
  selectedRoomId = signal<string>('');
  selectedBedId = signal<string>('');
  isLoadingResidences = signal(false);
  isLoadingFloors = signal(false);
  isLoadingRooms = signal(false);
  isLoadingBeds = signal(false);
  isLoadingResidents = signal(false);

  // Pagination signals
  pageIndex = signal(0);
  pageSize = signal(10);
  totalItems = signal(0);

  // Search signals
  searchTerm = signal('');
  private searchTimeout: ReturnType<typeof setTimeout> | null = null;

  ngOnInit() {
    console.log('Residents component initialized');
    // Load all residences and residents on init
    this.loadResidences();
    this.loadResidentsData(); // Load all residents initially
  }

  ngAfterViewInit() {
    // Setup paginator events - IMPORTANT: Don't connect paginator to dataSource for backend pagination
    if (this.paginator) {
      this.paginator.page.subscribe((event: PageEvent) => {
        console.log('Paginator event - Page:', event.pageIndex, 'Size:', event.pageSize);
        this.pageIndex.set(event.pageIndex);
        this.pageSize.set(event.pageSize);
        this.loadResidentsData();
      });
    }

    // Setup sort events
    if (this.sort) {
      this.sort.sortChange.subscribe(() => {
        console.log('Sort event triggered');
        this.pageIndex.set(0); // Reset to first page when sorting
        this.loadResidentsData();
      });
    }
  }

  private loadResidences() {
    this.isLoadingResidences.set(true);
    this.residencesService.listResidencesResidencesGet().subscribe({
      next: (response: { items: Record<string, any>[] }) => {
        this.residences.set(
          (response.items || []).map(
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
          )
        );
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
    // Also update the storage service to keep it in sync
    this.storageService.setSelectedResidenceId(residenceId || null);
    this.selectedFloorId.set(''); // Reset floor selection
    this.selectedRoomId.set(''); // Reset room selection
    this.selectedBedId.set(''); // Reset bed selection
    this.floors.set([]);
    this.rooms.set([]);
    this.beds.set([]);
    this.pageIndex.set(0); // Reset to first page

    this.loadResidentsData(); // Always reload residents with current filters

    if (residenceId) {
      this.loadFloors(); // Load next level options
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
    this.selectedBedId.set(''); // Reset bed selection
    this.rooms.set([]);
    this.beds.set([]);
    this.pageIndex.set(0); // Reset to first page

    this.loadResidentsData(); // Always reload residents with current filters

    if (floorId) {
      this.loadRooms(); // Load next level options
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
    this.selectedBedId.set(''); // Reset bed selection
    this.beds.set([]);
    this.pageIndex.set(0); // Reset to first page

    this.loadResidentsData(); // Always reload residents with current filters

    if (roomId) {
      this.loadBeds(); // Load next level options
    }
  }

  private loadBeds() {
    if (!this.selectedRoomId()) return;

    this.isLoadingBeds.set(true);
    this.structureService.bedsSimpleStructureBedsRoomIdSimpleGet({ room_id: this.selectedRoomId() }).subscribe({
      next: (response: Record<string, any>[]) => {
        this.beds.set(
          (response || []).map(
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
          )
        );
        this.isLoadingBeds.set(false);
      },
      error: (error: { status?: number; message?: string }) => {
        this.notificationService.handleApiError(error, 'Error al cargar las camas');
        this.isLoadingBeds.set(false);
      }
    });
  }

  onBedChange(bedId: string) {
    console.log('Bed changed to:', bedId);
    this.selectedBedId.set(bedId);
    this.pageIndex.set(0); // Reset to first page
    this.loadResidentsData();
  }

  private loadResidentsData() {
    this.isLoadingResidents.set(true);

    // Use the residents service for backend pagination
    const params: Record<string, string | number> = {
      page: this.pageIndex() + 1, // API uses 1-based indexing
      size: this.pageSize()
    };

    // X-Residence-Id is handled automatically by the interceptor
    // But we also need to send residence_id as a query parameter for filtering
    // especially for superadmin users who don't have X-Residence-Id set

    // Add filters based on selected structure - always include residence if selected
    if (this.selectedResidenceId()) {
      params['residence_id'] = this.selectedResidenceId();
      console.log('Adding residence_id filter:', this.selectedResidenceId());
    }
    if (this.selectedFloorId()) {
      params['floor_id'] = this.selectedFloorId();
    }
    if (this.selectedRoomId()) {
      params['room_id'] = this.selectedRoomId();
    }
    if (this.selectedBedId()) {
      params['bed_id'] = this.selectedBedId();
    }

    // Add search term if provided
    if (this.searchTerm()) {
      params['search'] = this.searchTerm();
    }

    console.log('Calling residents API with params:', params);
    this.residentsService.listResidentsResidentsGet(params).subscribe({
      next: (response: any) => {
        this.dataSource.data = (response.items || []).map(
          (item: any) =>
            ({
              id: item.id,
              residence_id: item.residence_id,
              full_name: item.full_name,
              birth_date: item.birth_date,
              sex: item.sex,
              gender: item.gender,
              comments: item.comments,
              status: item.status,
              status_changed_at: item.status_changed_at,
              deleted_at: item.deleted_at,
              bed_id: item.bed_id,
              created_at: item.created_at,
              updated_at: item.updated_at,
              residence_name: item.residence_name,
              bed_name: item.bed_name,
              room_name: item.room_name,
              floor_name: item.floor_name
            }) as ResidentWithDetails
        );
        this.totalItems.set(response.total || 0);
        this.isLoadingResidents.set(false);
      },
      error: (error: { status?: number; message?: string }) => {
        this.notificationService.handleApiError(error, 'Error al cargar los residentes');
        this.isLoadingResidents.set(false);
      }
    });
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;

    // Clear existing timeout
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }

    // Set new timeout for debounce (200ms - faster response)
    this.searchTimeout = setTimeout(() => {
      this.searchTerm.set(filterValue.trim());
      this.pageIndex.set(0); // Reset to first page when filtering
      this.loadResidentsData();
    }, 200);
  }

  viewResident(resident: ResidentWithDetails) {
    const dialogRef = this.dialog.open(ViewResidentModal, {
      data: resident,
      width: '600px',
      maxWidth: '90vw'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadResidentsData();
      }
    });
  }

  editResident(resident: ResidentWithDetails) {
    const dialogRef = this.dialog.open(ResidentFormModal, {
      data: {
        resident,
        residences: this.residences(),
        selectedResidenceId: this.selectedResidenceId(),
        selectedFloorId: this.selectedFloorId(),
        selectedRoomId: this.selectedRoomId(),
        selectedBedId: this.selectedBedId(),
        floors: this.floors(),
        rooms: this.rooms(),
        beds: this.beds()
      },
      width: '60%',
      maxWidth: '90vw'
    });

    dialogRef.afterClosed().subscribe((result: ResidentFormData | null) => {
      if (result) {
        this.residentsService
          .updateResidentResidentsIdPut({
            id: resident.id,
            body: {
              full_name: result.full_name,
              birth_date: result.birth_date,
              sex: result.sex,
              gender: result.gender,
              comments: result.comments,
              status: result.status,
              bed_id: result.bed_id
            }
          })
          .subscribe({
            next: () => {
              this.notificationService.success('Residente actualizado exitosamente');
              this.loadResidentsData();
            },
            error: (error: { status?: number; message?: string }) => {
              this.notificationService.handleApiError(error, 'Error al actualizar el residente');
            }
          });
      }
    });
  }

  deleteResident(resident: ResidentWithDetails) {
    const dialogRef = this.dialog.open(DeleteResidentModal, {
      data: resident,
      width: '50%',
      maxWidth: '90vw'
    });

    dialogRef.afterClosed().subscribe((result: boolean) => {
      if (result) {
        this.residentsService.deleteResidentResidentsIdDelete({ id: resident.id }).subscribe({
          next: () => {
            this.notificationService.success('Residente eliminado exitosamente');
            this.loadResidentsData();
          },
          error: (error: { status?: number; message?: string }) => {
            this.notificationService.handleApiError(error, 'Error al eliminar el residente');
          }
        });
      }
    });
  }

  addResident() {
    const dialogRef = this.dialog.open(ResidentFormModal, {
      data: {
        residences: this.residences(),
        selectedResidenceId: this.selectedResidenceId(),
        selectedFloorId: this.selectedFloorId(),
        selectedRoomId: this.selectedRoomId(),
        selectedBedId: this.selectedBedId(),
        floors: this.floors(),
        rooms: this.rooms(),
        beds: this.beds()
      },
      width: '60%',
      maxWidth: '90vw'
    });

    dialogRef.afterClosed().subscribe((result: ResidentFormData | null) => {
      if (result) {
        this.residentsService
          .createResidentResidentsPost({
            body: {
              full_name: result.full_name,
              birth_date: result.birth_date,
              sex: result.sex,
              gender: result.gender,
              comments: result.comments,
              status: result.status,
              bed_id: result.bed_id
            }
          })
          .subscribe({
            next: () => {
              this.notificationService.success('Residente creado exitosamente');
              this.loadResidentsData();
            },
            error: (error: { status?: number; message?: string }) => {
              this.notificationService.handleApiError(error, 'Error al crear el residente');
            }
          });
      }
    });
  }
}
