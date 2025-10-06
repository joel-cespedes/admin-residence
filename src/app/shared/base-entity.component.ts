import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, inject, input, OnInit, signal, ViewChild } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginator, MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';

import { ResidencesService } from '../../openapi/generated/services/residences.service';
import { StructureService } from '../../openapi/generated/services/structure.service';
import { NotificationService } from './notification.service';
import {
  BedWithDetails,
  EntityType,
  FilterState,
  FloorWithDetails,
  PaginationState,
  ResidenceWithContact,
  ResidentWithDetails,
  RoomWithDetails
} from './model-entry/entry.model';

// Re-exportar tipos para uso en otros componentes
export type {
  BedWithDetails,
  EntityType,
  FilterState,
  FloorWithDetails,
  PaginationState,
  ResidenceWithContact,
  ResidentWithDetails,
  RoomWithDetails
};

@Component({
  selector: 'app-base-entity',
  imports: [
    CommonModule,
    MatFormFieldModule,
    MatInputModule,
    MatTableModule,
    MatSortModule,
    MatPaginatorModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatDialogModule,
    MatButtonToggleModule,
    MatProgressSpinnerModule,
    MatSelectModule
  ],
  template: `
    <!-- Base component template -->
  `
})
export class BaseEntityComponent<
    T extends ResidenceWithContact | FloorWithDetails | RoomWithDetails | BedWithDetails | ResidentWithDetails
  >
  implements AfterViewInit, OnInit
{
  entityType = input<EntityType>('residences');
  displayedColumns = input<string[]>(['name', 'address', 'phone', 'email', 'created_at', 'actions']);
  title = input<string>('Entidades');

  // Getter para obtener el valor del signal como array normal para Angular Material
  get columns(): string[] {
    return this.displayedColumns();
  }

  // ViewChilds
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  // Servicios inyectados
  protected residencesService = inject(ResidencesService);
  protected structureService = inject(StructureService);
  protected notificationService = inject(NotificationService);
  protected dialog = inject(MatDialog);

  // Data signals
  protected residences = signal<ResidenceWithContact[]>([]);
  protected floors = signal<FloorWithDetails[]>([]);
  protected rooms = signal<RoomWithDetails[]>([]);
  protected beds = signal<BedWithDetails[]>([]);

  // DataSource tipado
  dataSource = new MatTableDataSource<T>([]);

  // Loading signals
  protected isLoadingResidences = signal(false);
  protected isLoadingFloors = signal(false);
  protected isLoadingRooms = signal(false);
  protected isLoadingBeds = signal(false);
  protected isLoadingData = signal(false);

  // Filter state
  protected filters = signal<FilterState>({
    residence_id: '',
    floor_id: '',
    room_id: '',
    bed_id: '',
    search: ''
  });

  // Pagination state
  protected pagination = signal<PaginationState>({
    page: 1,
    size: 15,
    total: 0
  });

  // Search timeout
  private searchTimeout: ReturnType<typeof setTimeout> | null = null;

  ngOnInit() {
    console.log(`${this.title()} component initialized`);
    this.loadInitialData();
  }

  ngAfterViewInit() {
    this.setupPagination();
    this.setupSorting();
  }

  private loadInitialData() {
    this.loadResidences();
    this.loadData();
  }

  private setupPagination() {
    if (this.paginator) {
      this.paginator.page.subscribe((event: PageEvent) => {
        this.pagination.update(pag => ({
          ...pag,
          page: event.pageIndex + 1,
          size: event.pageSize
        }));
        this.loadData();
      });
    }
  }

  private setupSorting() {
    if (this.sort) {
      this.sort.sortChange.subscribe(() => {
        this.pagination.update(pag => ({ ...pag, page: 1 }));
        this.loadData();
      });
    }
  }

  // Métodos de carga de datos
  protected async loadResidences() {
    this.isLoadingResidences.set(true);
    try {
      const response = await this.residencesService.listResidencesResidencesGet().toPromise();
      this.residences.set((response as any).items || []);
    } catch (error) {
      this.notificationService.handleApiError(error, 'Error al cargar las residencias');
    } finally {
      this.isLoadingResidences.set(false);
    }
  }

  protected async loadFloors() {
    if (!this.filters().residence_id) return;

    this.isLoadingFloors.set(true);
    try {
      const response = await this.structureService
        .floorsSimpleStructureFloorsResidenceIdSimpleGet({ residence_id: this.filters().residence_id })
        .toPromise();
      const floors = (response || []).map((item: any) => ({
        id: item['id'],
        name: item['name'],
        residence_id: item['residence_id'],
        residence_name: item['residence_name'],
        created_at: item['created_at'],
        updated_at: item['updated_at']
      })) as FloorWithDetails[];
      this.floors.set(floors);
    } catch (error) {
      this.notificationService.handleApiError(error, 'Error al cargar los pisos');
    } finally {
      this.isLoadingFloors.set(false);
    }
  }

  protected async loadRooms() {
    if (!this.filters().floor_id) return;

    this.isLoadingRooms.set(true);
    try {
      const response = await this.structureService
        .roomsSimpleStructureRoomsFloorIdSimpleGet({ floor_id: this.filters().floor_id })
        .toPromise();
      const rooms = (response || []).map((item: any) => ({
        id: item['id'],
        name: item['name'],
        residence_id: item['residence_id'],
        floor_id: item['floor_id'],
        residence_name: item['residence_name'],
        floor_name: item['floor_name'],
        created_at: item['created_at'],
        updated_at: item['updated_at']
      })) as RoomWithDetails[];
      this.rooms.set(rooms);
    } catch (error) {
      this.notificationService.handleApiError(error, 'Error al cargar las habitaciones');
    } finally {
      this.isLoadingRooms.set(false);
    }
  }

  protected async loadBeds() {
    if (!this.filters().room_id) return;

    this.isLoadingBeds.set(true);
    try {
      const response = await this.structureService
        .bedsSimpleStructureBedsRoomIdSimpleGet({ room_id: this.filters().room_id })
        .toPromise();
      const beds = (response || []).map((item: any) => ({
        id: item['id'],
        name: item['name'],
        residence_id: item['residence_id'],
        room_id: item['room_id'],
        residence_name: item['residence_name'],
        room_name: item['room_name'],
        floor_name: item['floor_name'],
        resident_name: item['resident_name'],
        created_at: item['created_at'],
        updated_at: item['updated_at']
      })) as BedWithDetails[];
      this.beds.set(beds);
    } catch (error) {
      this.notificationService.handleApiError(error, 'Error al cargar las camas');
    } finally {
      this.isLoadingBeds.set(false);
    }
  }

  protected onResidenceChange(residenceId: string) {
    console.log('Residence changed to:', residenceId);

    this.filters.update(filters => ({
      ...filters,
      residence_id: residenceId,
      floor_id: '',
      room_id: '',
      bed_id: ''
    }));

    this.floors.set([]);
    this.rooms.set([]);
    this.beds.set([]);

    if (residenceId) {
      this.loadFloors();
    }

    this.pagination.update(pag => ({ ...pag, page: 1 }));
    this.loadData();
  }

  protected onFloorChange(floorId: string) {
    console.log('Floor changed to:', floorId);

    this.filters.update(filters => ({
      ...filters,
      floor_id: floorId,
      room_id: '',
      bed_id: ''
    }));

    this.rooms.set([]);
    this.beds.set([]);

    if (floorId) {
      this.loadRooms();
    }

    this.pagination.update(pag => ({ ...pag, page: 1 }));
    this.loadData();
  }

  protected onRoomChange(roomId: string) {
    console.log('Room changed to:', roomId);

    this.filters.update(filters => ({
      ...filters,
      room_id: roomId,
      bed_id: ''
    }));

    this.beds.set([]);

    if (roomId) {
      this.loadBeds();
    }

    this.pagination.update(pag => ({ ...pag, page: 1 }));
    this.loadData();
  }

  protected onBedChange(bedId: string) {
    console.log('Bed changed to:', bedId);

    this.filters.update(filters => ({
      ...filters,
      bed_id: bedId
    }));

    this.pagination.update(pag => ({ ...pag, page: 1 }));
    this.loadData();
  }

  protected onSearchChange(searchTerm: string) {
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }

    this.searchTimeout = setTimeout(() => {
      this.filters.update(filters => ({ ...filters, search: searchTerm.trim() }));
      this.pagination.update(pag => ({ ...pag, page: 1 }));
      this.loadData();
    }, 300);
  }

  // Método abstracto para cargar datos - cada entidad debe implementarlo
  protected loadData(): void {
    throw new Error('loadData must be implemented by child component');
  }

  // Métodos de utilidad
  protected formatDate(date: string | null | undefined): string {
    if (!date) return 'No especificada';
    return new Date(date).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  protected getFilterParams(): Record<string, string | number> {
    const params: Record<string, string | number> = {
      page: this.pagination().page,
      size: this.pagination().size
    };

    const filters = this.filters();

    if (filters.residence_id) {
      params['residence_id'] = filters.residence_id;
    }
    if (filters.floor_id) {
      params['floor_id'] = filters.floor_id;
    }
    if (filters.room_id) {
      params['room_id'] = filters.room_id;
    }
    if (filters.bed_id) {
      params['bed_id'] = filters.bed_id;
    }
    if (filters.search) {
      params['search'] = filters.search;
    }

    return params;
  }
}
