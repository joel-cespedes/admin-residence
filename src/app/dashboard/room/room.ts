import { AfterViewInit, Component, OnInit, ViewChild, computed, inject, signal } from '@angular/core';
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
import { DatePipe } from '@angular/common';

import { Header } from '../shared/header/header';
import { StructureService } from '../../../openapi/generated/services/structure.service';
import { ResidencesService } from '../../../openapi/generated/services/residences.service';
import { NotificationService } from '../../shared/notification.service';
import { RoomWithDetails } from './model/room.model';
import { DeleteRoomModal } from './delete-room-modal/delete-room-modal';
import { RoomFormModal } from './room-form-modal/room-form-modal';
import { ViewRoomModal } from './view-room-modal/view-room-modal';
import { firstValueFrom } from 'rxjs';
import { PaginatedResponse } from '../../../openapi/generated/models/paginated-response';
import { ListRoomsStructureRoomsGet$Params } from '../../../openapi/generated/fn/structure/list-rooms-structure-rooms-get';

interface ResidenceOption {
  id: string;
  name: string;
}

interface FloorOption {
  id: string;
  name: string;
}

@Component({
  selector: 'app-room',
  standalone: true,
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
  templateUrl: './room.html',
  styleUrl: './room.scss'
})
export class Room implements OnInit, AfterViewInit {
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  private readonly structureService = inject(StructureService);
  private readonly residencesService = inject(ResidencesService);
  private readonly notificationService = inject(NotificationService);
  private readonly dialog = inject(MatDialog);

  readonly dataSource = new MatTableDataSource<RoomWithDetails>([]);
  readonly isLoadingData = signal(false);
  readonly pagination = signal({
    pageIndex: 0,
    pageSize: 10,
    total: 0,
    sortBy: 'created_at',
    sortOrder: 'desc' as 'asc' | 'desc'
  });

  readonly residences = signal<ResidenceOption[]>([]);
  readonly isLoadingResidences = signal(false);
  readonly selectedResidence = signal<string>('');

  readonly floors = signal<FloorOption[]>([]);
  readonly isLoadingFloors = signal(false);
  readonly selectedFloor = signal<string>('');

  readonly searchTerm = signal<string>('');
  readonly displayedColumns = ['name', 'floor_name', 'residence_name', 'created_at', 'actions'];
  readonly totalItems = computed(() => this.pagination().total);

  private searchDebounce: ReturnType<typeof setTimeout> | null = null;
  private suppressNextPageEvent = false;

  ngOnInit(): void {
    this.loadResidences();
    this.loadRooms();
  }

  ngAfterViewInit(): void {
    if (this.paginator) {
      const state = this.pagination();
      this.paginator.pageIndex = state.pageIndex;
      this.paginator.pageSize = state.pageSize;
    }

    if (this.sort) {
      const state = this.pagination();
      this.sort.active = state.sortBy;
      this.sort.direction = state.sortOrder as SortDirection;
      this.sort.disableClear = true;
      this.dataSource.sort = this.sort;
      this.sort.sortChange.subscribe(({ active, direction }: Sort) => {
        const sortDirection = (direction || 'desc') as 'asc' | 'desc';
        const sortBy = active || 'created_at';

        this.pagination.update(current => ({
          ...current,
          pageIndex: 0,
          sortBy,
          sortOrder: sortDirection
        }));
        this.loadRooms();
      });
    }
  }

  selectedResidenceId(): string {
    return this.selectedResidence();
  }

  selectedFloorId(): string {
    return this.selectedFloor();
  }

  isLoadingRooms(): boolean {
    return this.isLoadingData();
  }

  onPageChange(event: PageEvent): void {
    if (this.suppressNextPageEvent) {
      this.suppressNextPageEvent = false;
      return;
    }

    this.pagination.update(state => ({
      ...state,
      pageIndex: event.pageIndex,
      pageSize: event.pageSize
    }));
    this.loadRooms();
  }

  applyFilter(event: Event): void {
    const value = (event.target as HTMLInputElement).value ?? '';
    if (this.searchDebounce) {
      clearTimeout(this.searchDebounce);
    }
    this.searchDebounce = setTimeout(() => {
      this.searchTerm.set(value);
      this.resetToFirstPage();
      this.loadRooms();
    }, 300);
  }

  onResidenceChange(residenceId: string): void {
    this.selectedResidence.set(residenceId);
    this.selectedFloor.set('');
    this.floors.set([]);

    if (residenceId) {
      this.loadFloorsForResidence(residenceId);
    }

    this.resetToFirstPage();
    this.loadRooms();
  }

  onFloorChange(floorId: string): void {
    this.selectedFloor.set(floorId);
    this.resetToFirstPage();
    this.loadRooms();
  }

  viewRoom(room: RoomWithDetails): void {
    this.dialog.open(ViewRoomModal, {
      data: room,
      width: '600px',
      maxWidth: '90vw'
    });
  }

  editRoom(room: RoomWithDetails): void {
    this.dialog
      .open(RoomFormModal, {
        data: {
          room,
          residences: this.residences(),
          floors: this.floors(),
          preselectedResidenceId: this.selectedResidence() || room.residence_id,
          preselectedFloorId: this.selectedFloor() || room.floor_id
        },
        width: '60%',
        maxWidth: '90vw'
      })
      .afterClosed()
      .subscribe(result => {
        if (result) {
          this.loadRooms();
        }
      });
  }

  deleteRoom(room: RoomWithDetails): void {
    this.dialog
      .open(DeleteRoomModal, {
        data: room,
        width: '50%',
        maxWidth: '90vw'
      })
      .afterClosed()
      .subscribe((confirmed: boolean) => {
        if (confirmed) {
          void this.loadRooms();
        }
      });
  }

  addRoom(): void {
    this.dialog
      .open(RoomFormModal, {
        data: {
          residences: this.residences(),
          floors: this.floors(),
          preselectedResidenceId: this.selectedResidence() || undefined,
          preselectedFloorId: this.selectedFloor() || undefined
        },
        width: '60%',
        maxWidth: '90vw'
      })
      .afterClosed()
      .subscribe(result => {
        if (result) {
          this.loadRooms();
        }
      });
  }

  private resetToFirstPage(): void {
    this.pagination.update(state => ({ ...state, pageIndex: 0 }));
    if (this.paginator) {
      this.suppressNextPageEvent = true;
      this.paginator.pageIndex = 0;
    }
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
      const options = (response ?? []).map((item: Record<string, any>) => ({
        id: item['id'],
        name: item['name']
      }));
      this.floors.set(options);
    } catch (error: any) {
      this.notificationService.handleApiError(error, 'Error al cargar los pisos');
    } finally {
      this.isLoadingFloors.set(false);
    }
  }

  private async loadRooms(): Promise<void> {
    this.isLoadingData.set(true);
    const state = this.pagination();

    const params: ListRoomsStructureRoomsGet$Params = {
      page: state.pageIndex + 1,
      size: state.pageSize,
      sort_by: state.sortBy,
      sort_order: state.sortOrder
    };

    const residenceId = this.selectedResidence();
    if (residenceId) {
      params.residence_id = residenceId;
    }

    const floorId = this.selectedFloor();
    if (floorId) {
      params.floor_id = floorId;
    }

    const search = this.searchTerm().trim();
    if (search) {
      params.search = search;
    }

    try {
      const response = (await firstValueFrom(this.structureService.listRoomsStructureRoomsGet(params))) as PaginatedResponse;
      const rooms = (response.items ?? []).map((item: Record<string, any>) => ({
        id: item['id'],
        name: item['name'],
        residence_id: item['residence_id'],
        floor_id: item['floor_id'],
        residence_name: item['residence_name'] ?? 'Desconocida',
        floor_name: item['floor_name'] ?? 'Desconocido',
        created_at: item['created_at'] ?? new Date().toISOString(),
        updated_at: item['updated_at'] ?? null
      })) as RoomWithDetails[];

      this.dataSource.data = rooms;
      this.pagination.update(current => ({ ...current, total: response.total ?? rooms.length }));
    } catch (error: any) {
      this.notificationService.handleApiError(error, 'Error al cargar las habitaciones');
    } finally {
      this.isLoadingData.set(false);
    }
  }
}
