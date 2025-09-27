import { AfterViewInit, Component, OnInit, ViewChild, computed, inject, signal } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSort, MatSortModule, Sort, SortDirection } from '@angular/material/sort';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
// import { DatePipe } from '@angular/common';
import { DateFormatPipe } from '../../shared/pipes/date-format-pipe';

import { Header } from '../shared/header/header';
import { ResidentsService as ResidentsApiService } from '../../../openapi/generated/services/residents.service';
import { StructureService } from '../../../openapi/generated/services/structure.service';
import { ResidencesService } from '../../../openapi/generated/services/residences.service';
import { NotificationService } from '../../shared/notification.service';
import { PermissionsService } from '../../shared/permissions.service';
import { ResidentFormData, ResidentWithDetails } from './model/resident.model';
import { ViewResidentModal } from './view-resident-modal/view-resident-modal';
import { ResidentFormModal } from './resident-form-modal/resident-form-modal';
import { DeleteResidentModal } from './delete-resident-modal/delete-resident-modal';
import { firstValueFrom } from 'rxjs';

interface ResidenceOption {
  id: string;
  name: string;
}

interface FloorOption {
  id: string;
  name: string;
}

interface RoomOption {
  id: string;
  name: string;
}

interface BedOption {
  id: string;
  name: string;
}

interface ResidentFilters {
  residence_id: string;
  floor_id: string;
  room_id: string;
  bed_id: string;
  search: string;
}

@Component({
  selector: 'app-residents',
  imports: [
    MatTableModule,
    MatPaginatorModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    MatFormFieldModule,
    MatInputModule,
    MatSortModule,
    MatButtonToggleModule,
    DateFormatPipe,
    Header
  ],
  templateUrl: './residents.html',
  styleUrl: './residents.scss'
})
export class Residents implements OnInit, AfterViewInit {
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  private readonly residentsService = inject(ResidentsApiService);
  private readonly residencesService = inject(ResidencesService);
  private readonly structureService = inject(StructureService);
  private readonly notificationService = inject(NotificationService);
  private readonly dialog = inject(MatDialog);
  private readonly permissionsService = inject(PermissionsService);

  readonly displayedColumns = [
    'full_name',
    'birth_date',
    'residence_name',
    'floor_name',
    'room_name',
    'bed_name',
    'status',
    'created_at',
    'actions'
  ];
  readonly dataSource = new MatTableDataSource<ResidentWithDetails>([]);
  readonly filters = signal<ResidentFilters>({ residence_id: '', floor_id: '', room_id: '', bed_id: '', search: '' });
  readonly pagination = signal({
    page: 1,
    size: 15,
    total: 0,
    sortBy: 'created_at',
    sortOrder: 'desc' as 'asc' | 'desc'
  });

  readonly residences = signal<ResidenceOption[]>([]);
  readonly floors = signal<FloorOption[]>([]);
  readonly rooms = signal<RoomOption[]>([]);
  readonly beds = signal<BedOption[]>([]);

  readonly isLoadingData = signal(false);
  readonly isLoadingResidences = signal(false);
  readonly isLoadingFloors = signal(false);
  readonly isLoadingRooms = signal(false);
  readonly isLoadingBeds = signal(false);

  // Role-based permissions
  readonly permissions = this.permissionsService.residentPermissions;
  readonly canCreate = computed(() => this.permissions().canCreate);
  readonly canEdit = computed(() => this.permissions().canEdit);
  readonly canDelete = computed(() => this.permissions().canDelete);

  private searchDebounce: ReturnType<typeof setTimeout> | null = null;

  ngOnInit(): void {
    this.loadResidences();
    this.loadResidents();
  }

  ngAfterViewInit(): void {
    if (this.paginator) {
      const state = this.pagination();
      this.paginator.pageIndex = state.page - 1;
      this.paginator.pageSize = state.size;
    }

    if (this.sort) {
      // Use setTimeout to avoid ExpressionChangedAfterItHasBeenCheckedError
      setTimeout(() => {
        const state = this.pagination();
        this.sort.active = state.sortBy;
        this.sort.direction = state.sortOrder as SortDirection;
        this.sort.disableClear = true;
        this.dataSource.sort = this.sort;
      });

      this.sort.sortChange.subscribe(({ active, direction }: Sort) => {
        const sortDirection = (direction || 'desc') as 'asc' | 'desc';
        const sortBy = active || 'created_at';

        this.pagination.update(current => ({
          ...current,
          page: 1,
          sortBy,
          sortOrder: sortDirection
        }));
        this.loadResidents();
      });
    }
  }

  onPageChange(event: PageEvent): void {
    this.pagination.update(state => ({
      ...state,
      page: event.pageIndex + 1,
      size: event.pageSize
    }));
    this.loadResidents();
  }

  applyFilter(event: Event): void {
    const value = (event.target as HTMLInputElement).value ?? '';
    if (this.searchDebounce) {
      clearTimeout(this.searchDebounce);
    }
    this.searchDebounce = setTimeout(() => {
      this.filters.update(current => ({ ...current, search: value }));
      this.resetToFirstPage();
      this.loadResidents();
    }, 300);
  }

  onResidenceChange(residenceId: string): void {
    this.filters.update(current => ({
      ...current,
      residence_id: residenceId,
      floor_id: '',
      room_id: '',
      bed_id: ''
    }));
    this.floors.set([]);
    this.rooms.set([]);
    this.beds.set([]);

    if (residenceId) {
      this.loadFloorsForResidence(residenceId);
    }

    this.resetToFirstPage();
    this.loadResidents();
  }

  onFloorChange(floorId: string): void {
    this.filters.update(current => ({ ...current, floor_id: floorId, room_id: '', bed_id: '' }));
    this.rooms.set([]);
    this.beds.set([]);

    if (floorId) {
      this.loadRoomsForFloor(floorId);
    }

    this.resetToFirstPage();
    this.loadResidents();
  }

  onRoomChange(roomId: string): void {
    this.filters.update(current => ({ ...current, room_id: roomId, bed_id: '' }));
    this.beds.set([]);

    if (roomId) {
      this.loadBedsForRoom(roomId);
    }

    this.resetToFirstPage();
    this.loadResidents();
  }

  onBedChange(bedId: string): void {
    this.filters.update(current => ({ ...current, bed_id: bedId }));
    this.resetToFirstPage();
    this.loadResidents();
  }

  addResident(): void {
    this.dialog
      .open(ResidentFormModal, {
        data: {
          residences: this.residences(),
          selectedResidenceId: this.filters().residence_id || undefined,
          selectedFloorId: this.filters().floor_id || undefined,
          selectedRoomId: this.filters().room_id || undefined,
          selectedBedId: this.filters().bed_id || undefined,
          floors: this.floors(),
          rooms: this.rooms(),
          beds: this.beds()
        },
        width: '60%',
        maxWidth: '90vw'
      })
      .afterClosed()
      .subscribe((result: ResidentFormData | null) => {
        if (result) {
          this.residentsService.createResidentResidentsPost({ body: result }).subscribe({
            next: () => {
              this.notificationService.success('Residente creado exitosamente');
              this.loadResidents();
            },
            error: (error: any) => {
              this.notificationService.handleApiError(error, 'Error al crear el residente');
            }
          });
        }
      });
  }

  editResident(resident: ResidentWithDetails): void {
    this.dialog
      .open(ResidentFormModal, {
        data: {
          resident,
          residences: this.residences(),
          selectedResidenceId: this.filters().residence_id || resident.residence_id,
          selectedFloorId: this.filters().floor_id || undefined,
          selectedRoomId: this.filters().room_id || undefined,
          selectedBedId: this.filters().bed_id || resident.bed_id,
          floors: this.floors(),
          rooms: this.rooms(),
          beds: this.beds()
        },
        width: '60%',
        maxWidth: '90vw'
      })
      .afterClosed()
      .subscribe((result: ResidentFormData | null) => {
        if (result) {
          this.residentsService.updateResidentResidentsIdPut({ id: resident.id, body: result }).subscribe({
            next: () => {
              this.notificationService.success('Residente actualizado exitosamente');
              this.loadResidents();
            },
            error: (error: any) => {
              this.notificationService.handleApiError(error, 'Error al actualizar el residente');
            }
          });
        }
      });
  }

  deleteResident(resident: ResidentWithDetails): void {
    this.dialog
      .open(DeleteResidentModal, {
        data: resident,
        width: '50%',
        maxWidth: '90vw'
      })
      .afterClosed()
      .subscribe((confirmed: boolean) => {
        if (confirmed) {
          this.residentsService.deleteResidentResidentsIdDelete({ id: resident.id }).subscribe({
            next: () => {
              this.notificationService.success('Residente eliminado exitosamente');
              this.loadResidents();
            },
            error: (error: any) => {
              this.notificationService.handleApiError(error, 'Error al eliminar el residente');
            }
          });
        }
      });
  }

  viewResident(resident: ResidentWithDetails): void {
    this.dialog.open(ViewResidentModal, {
      data: resident,
      width: '600px',
      maxWidth: '90vw'
    });
  }

  private resetToFirstPage(): void {
    this.pagination.update(state => ({ ...state, page: 1 }));
  }

  private async loadResidents(): Promise<void> {
    this.isLoadingData.set(true);
    const state = this.pagination();
    const currentFilters = this.filters();

    const params: Record<string, any> = {
      page: state.page,
      size: state.size,
      sort_by: state.sortBy,
      sort_order: state.sortOrder
    };

    if (currentFilters.residence_id) {
      params['residence_id'] = currentFilters.residence_id;
    }

    if (currentFilters.floor_id) {
      params['floor_id'] = currentFilters.floor_id;
    }

    if (currentFilters.room_id) {
      params['room_id'] = currentFilters.room_id;
    }

    if (currentFilters.bed_id) {
      params['bed_id'] = currentFilters.bed_id;
    }

    const search = currentFilters.search.trim();
    if (search) {
      params['search'] = search;
    }

    try {
      const response: any = await firstValueFrom(this.residentsService.listResidentsResidentsGet(params));

      const items = (response.items || []).map((item: any) => ({
        id: item.id,
        full_name: item.full_name,
        birth_date: item.birth_date,
        sex: item.sex,
        status: item.status,
        status_changed_at: item.status_changed_at,
        residence_id: item.residence_id,
        residence_name: item.residence_name || 'Desconocida',
        floor_name: item.floor_name || 'Desconocido',
        room_name: item.room_name || 'Desconocida',
        bed_name: item.bed_name || 'Sin asignar',
        bed_id: item.bed_id,
        created_at: item.created_at,
        updated_at: item.updated_at
      })) as ResidentWithDetails[];

      this.dataSource.data = items;
      this.pagination.update(current => ({ ...current, total: response.total || items.length }));
    } catch (error: any) {
      this.notificationService.handleApiError(error, 'Error al cargar los residentes');
    } finally {
      this.isLoadingData.set(false);
    }
  }

  private async loadResidences(): Promise<void> {
    this.isLoadingResidences.set(true);
    try {
      const response: any = await firstValueFrom(this.residencesService.listResidencesResidencesGet({ size: 100 }));
      const items = (response.items || []).map((item: any) => ({
        id: item['id'],
        name: item['name']
      }));
      this.residences.set(items);
    } catch (error: any) {
      this.notificationService.handleApiError(error, 'Error al cargar las residencias');
    } finally {
      this.isLoadingResidences.set(false);
    }
  }

  private async loadFloorsForResidence(residenceId: string): Promise<void> {
    this.isLoadingFloors.set(true);
    try {
      const response = await firstValueFrom(
        this.structureService.floorsSimpleStructureFloorsResidenceIdSimpleGet({ residence_id: residenceId })
      );
      const items = (response || []).map((item: any) => ({
        id: item['id'],
        name: item['name']
      }));
      this.floors.set(items);
    } catch (error: any) {
      this.notificationService.handleApiError(error, 'Error al cargar los pisos');
    } finally {
      this.isLoadingFloors.set(false);
    }
  }

  private async loadRoomsForFloor(floorId: string): Promise<void> {
    this.isLoadingRooms.set(true);
    try {
      const response = await firstValueFrom(
        this.structureService.roomsSimpleStructureRoomsFloorIdSimpleGet({ floor_id: floorId })
      );
      const items = (response || []).map((item: any) => ({
        id: item['id'],
        name: item['name']
      }));
      this.rooms.set(items);
    } catch (error: any) {
      this.notificationService.handleApiError(error, 'Error al cargar las habitaciones');
    } finally {
      this.isLoadingRooms.set(false);
    }
  }

  private async loadBedsForRoom(roomId: string): Promise<void> {
    this.isLoadingBeds.set(true);
    try {
      const response = await firstValueFrom(this.structureService.bedsSimpleStructureBedsRoomIdSimpleGet({ room_id: roomId }));
      const items = (response || []).map((item: any) => ({
        id: item['id'],
        name: item['name']
      }));
      this.beds.set(items);
    } catch (error: any) {
      this.notificationService.handleApiError(error, 'Error al cargar las camas');
    } finally {
      this.isLoadingBeds.set(false);
    }
  }
}
