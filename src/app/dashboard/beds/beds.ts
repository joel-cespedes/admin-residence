import { AfterViewInit, Component, OnInit, ViewChild, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { MatDialog } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSort, MatSortModule, Sort, SortDirection } from '@angular/material/sort';
import { MatButtonToggleModule } from '@angular/material/button-toggle';

import { Header } from '../shared/header/header';
import { StructureService } from '../../../openapi/generated/services/structure.service';
import { ResidencesService } from '../../../openapi/generated/services/residences.service';
import { NotificationService } from '../../shared/notification.service';
import { BedFilters, BedFormData, BedWithDetails, FloorOption, ResidenceOption, RoomOption } from './model/bed.model';
import { DeleteBedModal } from './delete-bed-modal/delete-bed-modal';
import { BedFormModal } from './bed-form-modal/bed-form-modal';
import { ViewBedModal } from './view-bed-modal/view-bed-modal';
import { firstValueFrom } from 'rxjs';
import { PaginatedResponse } from '../../../openapi/generated/models/paginated-response';
import { ListBedsStructureBedsGet$Params } from '../../../openapi/generated/fn/structure/list-beds-structure-beds-get';

@Component({
  selector: 'app-beds',
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
    DatePipe,
    Header
  ],
  templateUrl: './beds.html',
  styleUrl: './beds.scss'
})
export class Beds implements OnInit, AfterViewInit {
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  private readonly structureService = inject(StructureService);
  private readonly residencesService = inject(ResidencesService);
  private readonly notificationService = inject(NotificationService);
  private readonly dialog = inject(MatDialog);

  readonly displayedColumns = ['name', 'room_name', 'floor_name', 'residence_name', 'resident_name', 'created_at', 'actions'];
  readonly dataSource = new MatTableDataSource<BedWithDetails>([]);
  readonly filters = signal<BedFilters>({ residence_id: '', floor_id: '', room_id: '', search: '' });
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

  readonly isLoadingData = signal(false);
  readonly isLoadingResidences = signal(false);
  readonly isLoadingFloors = signal(false);
  readonly isLoadingRooms = signal(false);

  private searchDebounce: ReturnType<typeof setTimeout> | null = null;
  private suppressNextPageEvent = false;

  selectedResidenceId(): string {
    return this.filters().residence_id;
  }

  selectedFloorId(): string {
    return this.filters().floor_id;
  }

  selectedRoomId(): string {
    return this.filters().room_id;
  }

  isLoadingBeds(): boolean {
    return this.isLoadingData();
  }

  totalItems(): number {
    return this.pagination().total;
  }

  pageIndex(): number {
    return this.pagination().page - 1;
  }

  pageSize(): number {
    return this.pagination().size;
  }

  searchTerm(): string {
    return this.filters().search;
  }

  async ngOnInit(): Promise<void> {
    await this.loadResidences();
    this.reloadBeds();
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
        this.resetPaginatorIndex();
        void this.loadBeds();
      });
    }
  }

  onPageChange(event: PageEvent): void {
    if (this.suppressNextPageEvent) {
      this.suppressNextPageEvent = false;
      return;
    }

    this.pagination.update(state => ({
      ...state,
      page: event.pageIndex + 1,
      size: event.pageSize
    }));
    this.reloadBeds();
  }

  applyFilter(event: Event): void {
    const value = (event.target as HTMLInputElement).value ?? '';
    if (this.searchDebounce) {
      clearTimeout(this.searchDebounce);
    }
    this.searchDebounce = setTimeout(() => {
      this.filters.update(current => ({ ...current, search: value }));
      this.resetToFirstPage();
      this.reloadBeds();
    }, 300);
  }

  onResidenceChange(residenceId: string): void {
    this.filters.update(current => ({
      ...current,
      residence_id: residenceId,
      floor_id: '',
      room_id: ''
    }));
    this.floors.set([]);
    this.rooms.set([]);

    if (residenceId) {
      void this.loadFloorsForResidence(residenceId);
    }

    this.resetToFirstPage();
    this.reloadBeds();
  }

  onFloorChange(floorId: string): void {
    this.filters.update(current => ({ ...current, floor_id: floorId, room_id: '' }));
    this.rooms.set([]);

    if (floorId) {
      void this.loadRoomsForFloor(floorId);
    }

    this.resetToFirstPage();
    this.reloadBeds();
  }

  onRoomChange(roomId: string): void {
    this.filters.update(current => ({ ...current, room_id: roomId }));
    this.resetToFirstPage();
    this.reloadBeds();
  }

  addBed(): void {
    this.dialog
      .open(BedFormModal, {
        data: {
          residences: this.residences(),
          selectedResidenceId: this.filters().residence_id || undefined,
          selectedFloorId: this.filters().floor_id || undefined,
          selectedRoomId: this.filters().room_id || undefined,
          floors: this.floors(),
          rooms: this.rooms()
        },
        width: '60%',
        maxWidth: '90vw'
      })
      .afterClosed()
      .subscribe((result: BedFormData | null) => {
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
                this.reloadBeds();
              },
              error: (error: any) => {
                this.notificationService.handleApiError(error, 'Error al crear la cama');
              }
            });
        }
      });
  }

  editBed(bed: BedWithDetails): void {
    this.dialog
      .open(BedFormModal, {
        data: {
          bed,
          residences: this.residences(),
          selectedResidenceId: this.filters().residence_id || bed.residence_id,
          selectedFloorId: this.filters().floor_id || undefined,
          selectedRoomId: this.filters().room_id || bed.room_id,
          floors: this.floors(),
          rooms: this.rooms()
        },
        width: '60%',
        maxWidth: '90vw'
      })
      .afterClosed()
      .subscribe((result: BedFormData | null) => {
        if (result) {
          console.log('Actualizando cama:', {
            id: bed.id,
            body: {
              name: result.name,
              residence_id: result.residence_id,
              floor_id: result.floor_id,
              room_id: result.room_id
            }
          });

          // Update the bed with all fields
          this.structureService
            .updateBedStructureBedsIdPut({
              id: bed.id,
              body: {
                name: result.name,
                residence_id: result.residence_id,
                floor_id: result.floor_id,
                room_id: result.room_id
              }
            })
            .subscribe({
              next: response => {
                console.log('Respuesta de actualización:', response);
                this.notificationService.success('Cama actualizada exitosamente');
                this.reloadBeds();
              },
              error: (error: any) => {
                console.error('Error al actualizar cama:', error);
                this.notificationService.handleApiError(error, 'Error al actualizar la cama');
              }
            });
        }
      });
  }

  deleteBed(bed: BedWithDetails): void {
    this.dialog
      .open(DeleteBedModal, {
        data: bed,
        width: '50%',
        maxWidth: '90vw'
      })
      .afterClosed()
      .subscribe((confirmed: boolean) => {
        if (confirmed) {
          this.structureService.deleteBedStructureBedsIdDelete({ id: bed.id }).subscribe({
            next: () => {
              this.notificationService.success('Cama eliminada exitosamente');
              this.reloadBeds();
            },
            error: (error: any) => {
              this.notificationService.handleApiError(error, 'Error al eliminar la cama');
            }
          });
        }
      });
  }

  viewBed(bed: BedWithDetails): void {
    this.dialog.open(ViewBedModal, {
      data: bed,
      width: '600px',
      maxWidth: '90vw'
    });
  }

  private resetToFirstPage(): void {
    this.pagination.update(state => ({ ...state, page: 1 }));
    this.resetPaginatorIndex();
  }

  private resetPaginatorIndex(): void {
    if (this.paginator) {
      this.suppressNextPageEvent = true;
      this.paginator.pageIndex = 0;
    }
  }

  private reloadBeds(): void {
    const roomId = (this.filters().room_id ?? '').trim();
    if (roomId) {
      void this.loadBedsForRoom(roomId);
    } else {
      void this.loadBeds();
    }
  }

  private async loadBeds(): Promise<void> {
    const currentFilters = this.filters();
    this.isLoadingData.set(true);
    const state = this.pagination();

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

    const search = currentFilters.search.trim();
    if (search) {
      params['search'] = search;
    }

    try {
      const response = (await firstValueFrom(
        this.structureService.listBedsStructureBedsGet(params as ListBedsStructureBedsGet$Params)
      )) as PaginatedResponse;
      const items = (response.items ?? []).map((item: Record<string, any>) => ({
        id: item['id'],
        name: item['name'],
        residence_id: item['residence_id'],
        room_id: item['room_id'],
        residence_name: item['residence_name'] ?? 'Desconocida',
        room_name: item['room_name'] ?? 'Desconocida',
        floor_name: item['floor_name'] ?? 'Desconocido',
        resident_name: item['resident_name'] ?? 'Sin asignar',
        created_at: item['created_at'] ?? new Date().toISOString(),
        updated_at: item['updated_at'] ?? null
      })) as BedWithDetails[];

      this.dataSource.data = items;
      this.pagination.update(current => ({ ...current, total: response.total ?? items.length }));
    } catch (error: any) {
      this.notificationService.handleApiError(error, 'Error al cargar las camas');
    } finally {
      this.isLoadingData.set(false);
    }
  }

  private async loadBedsForRoom(roomId: string): Promise<void> {
    const targetRoomId = roomId.trim();
    if (!targetRoomId) {
      await this.loadBeds();
      return;
    }

    this.isLoadingData.set(true);
    const state = this.pagination();
    const searchTerm = this.filters().search.trim().toLowerCase();
    const pageSize = state.size;
    const sortBy = state.sortBy;
    const sortOrder = state.sortOrder;

    try {
      const response = await firstValueFrom(
        this.structureService.bedsSimpleStructureBedsRoomIdSimpleGet({ room_id: targetRoomId })
      );

      let items = (response ?? []).map((item: Record<string, any>) => ({
        id: item['id'],
        name: item['name'],
        residence_id: item['residence_id'],
        room_id: item['room_id'],
        residence_name: item['residence_name'] ?? 'Desconocida',
        room_name: item['room_name'] ?? 'Desconocida',
        floor_name: item['floor_name'] ?? 'Desconocido',
        resident_name: item['resident_name'] ?? 'Sin asignar',
        created_at: item['created_at'] ?? new Date().toISOString(),
        updated_at: item['updated_at'] ?? null
      })) as BedWithDetails[];

      if (searchTerm) {
        items = items.filter(item => this.matchesSearch(item, searchTerm));
      }

      items = this.sortBeds(items, sortBy, sortOrder);

      const total = items.length;
      const totalPages = total > 0 ? Math.max(1, Math.ceil(total / pageSize)) : 1;
      let currentPage = Math.min(state.page, totalPages);
      if (currentPage <= 0) {
        currentPage = 1;
      }

      const start = (currentPage - 1) * pageSize;
      const pagedItems = items.slice(start, start + pageSize);

      if (currentPage !== state.page && this.paginator) {
        this.suppressNextPageEvent = true;
        this.paginator.pageIndex = currentPage - 1;
      }

      this.dataSource.data = pagedItems;
      this.pagination.update(current => ({ ...current, page: currentPage, total }));
    } catch (error: any) {
      if (error?.status === 500) {
        this.notificationService.error('La habitación seleccionada no existe o ha sido eliminada');
        this.filters.update(current => ({ ...current, room_id: '' }));
        this.resetToFirstPage();
        void this.loadBeds();
      } else {
        this.notificationService.handleApiError(error, 'Error al cargar las camas');
      }
    } finally {
      this.isLoadingData.set(false);
    }
  }

  private matchesSearch(bed: BedWithDetails, term: string): boolean {
    const normalized = term.toLowerCase();
    return [bed.name, bed.room_name, bed.residence_name, bed.floor_name, bed.resident_name].some(value =>
      (value ?? '').toLowerCase().includes(normalized)
    );
  }

  private sortBeds(items: BedWithDetails[], sortBy: string, sortOrder: 'asc' | 'desc'): BedWithDetails[] {
    const sorted = [...items];
    const direction = sortOrder === 'asc' ? 1 : -1;

    sorted.sort((a, b) => {
      const getValue = (bed: BedWithDetails): string | number | Date | null => {
        switch (sortBy) {
          case 'name':
            return bed.name ?? '';
          case 'room_name':
            return bed.room_name ?? '';
          case 'floor_name':
            return bed.floor_name ?? '';
          case 'residence_name':
            return bed.residence_name ?? '';
          case 'resident_name':
            return bed.resident_name ?? '';
          case 'created_at':
          default:
            return bed.created_at ?? '';
        }
      };

      const aValue = getValue(a);
      const bValue = getValue(b);

      if (aValue === bValue) {
        return 0;
      }

      const aComparable = (aValue ?? '').toString().toLowerCase();
      const bComparable = (bValue ?? '').toString().toLowerCase();

      if (aComparable < bComparable) {
        return -1 * direction;
      }
      if (aComparable > bComparable) {
        return 1 * direction;
      }
      return 0;
    });

    return sorted;
  }

  private async loadResidences(): Promise<void> {
    this.isLoadingResidences.set(true);
    try {
      const response = (await firstValueFrom(
        this.residencesService.listResidencesResidencesGet({ size: 100 })
      )) as PaginatedResponse;
      const items = (response.items ?? []).map((item: Record<string, any>) => ({
        id: item['id'],
        name: item['name']
      }));
      this.residences.set(items);

      // Seleccionar automáticamente la primera residencia si existe
      if (items.length > 0 && !this.filters().residence_id) {
        this.filters.update(current => ({ ...current, residence_id: items[0].id }));
        // También cargar los pisos y habitaciones para la residencia seleccionada
        await this.loadFloorsForResidence(items[0].id);
      }
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
      const items = (response ?? []).map((item: Record<string, any>) => ({
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
      const items = (response ?? []).map((item: Record<string, any>) => ({
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
}
