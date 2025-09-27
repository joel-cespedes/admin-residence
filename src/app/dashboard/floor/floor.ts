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
import { PermissionsService } from '../../shared/permissions.service';
import { FloorWithDetails, ResidenceOption } from './model/floor.model';
import { DeleteFloorModal } from './delete-floor-modal/delete-floor-modal';
import { FloorFormModal } from './floor-form-modal/floor-form-modal';
import { ViewFloorModal } from './view-floor-modal/view-floor-modal';
import { firstValueFrom } from 'rxjs';
import { ListFloorsStructureFloorsGet$Params } from '../../../openapi/generated/fn/structure/list-floors-structure-floors-get';
import { PaginatedResponse } from '../../../openapi/generated/models/paginated-response';

@Component({
  selector: 'app-floor',
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
  templateUrl: './floor.html',
  styleUrl: './floor.scss'
})
export class Floor implements OnInit, AfterViewInit {
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  private readonly structureService = inject(StructureService);
  private readonly residencesService = inject(ResidencesService);
  private readonly notificationService = inject(NotificationService);
  private readonly dialog = inject(MatDialog);
  private readonly permissionsService = inject(PermissionsService);

  readonly dataSource = new MatTableDataSource<FloorWithDetails>([]);
  readonly isLoadingData = signal(false);
  readonly pagination = signal({
    pageIndex: 0,
    pageSize: 15,
    total: 0,
    sortBy: 'created_at',
    sortOrder: 'desc' as 'asc' | 'desc'
  });

  readonly residences = signal<ResidenceOption[]>([]);
  readonly isLoadingResidences = signal(false);
  readonly selectedResidence = signal<string>('');
  readonly searchTerm = signal<string>('');
  readonly displayedColumns = ['name', 'residence_name', 'created_at', 'actions'];
  readonly totalItems = computed(() => this.pagination().total);

  // Role-based permissions
  readonly permissions = this.permissionsService.floorPermissions;
  readonly canCreate = computed(() => this.permissions().canCreate);
  readonly canEdit = computed(() => this.permissions().canEdit);
  readonly canDelete = computed(() => this.permissions().canDelete);

  private searchDebounce: ReturnType<typeof setTimeout> | null = null;
  private suppressNextPageEvent = false;

  ngOnInit(): void {
    this.loadResidences();
    this.loadFloors();
  }

  ngAfterViewInit(): void {
    if (this.paginator) {
      this.paginator.pageIndex = this.pagination().pageIndex;
      this.paginator.pageSize = this.pagination().pageSize;
    }

    if (this.sort) {
      const state = this.pagination();
      this.sort.active = state.sortBy;
      this.sort.direction = state.sortOrder as SortDirection;
      this.sort.disableClear = true;
      this.sort.sortChange.subscribe(({ active, direction }: Sort) => {
        const sortDirection = (direction || 'desc') as 'asc' | 'desc';
        const sortBy = active || 'created_at';

        this.pagination.update(current => ({
          ...current,
          pageIndex: 0,
          sortBy,
          sortOrder: sortDirection
        }));
        this.loadFloors();
      });
    }
  }

  applyFilter(event: Event): void {
    const value = (event.target as HTMLInputElement).value ?? '';
    if (this.searchDebounce) {
      clearTimeout(this.searchDebounce);
    }
    this.searchDebounce = setTimeout(() => {
      this.searchTerm.set(value);
      this.resetToFirstPage();
      this.loadFloors();
    }, 300);
  }

  onResidenceChange(residenceId: string): void {
    this.selectedResidence.set(residenceId);
    this.resetToFirstPage();
    this.loadFloors();
  }

  viewFloor(floor: FloorWithDetails): void {
    this.dialog.open(ViewFloorModal, {
      data: floor,
      width: '600px',
      maxWidth: '90vw'
    });
  }

  editFloor(floor: FloorWithDetails): void {
    this.dialog
      .open(FloorFormModal, {
        data: {
          ...floor,
          residences: this.residences(),
          preselectedResidenceId: floor.residence_id
        },
        width: '60%',
        maxWidth: '90vw'
      })
      .afterClosed()
      .subscribe(result => {
        if (result) {
          this.loadFloors();
        }
      });
  }

  deleteFloor(floor: FloorWithDetails): void {
    this.dialog
      .open(DeleteFloorModal, {
        data: floor,
        width: '50%',
        maxWidth: '90vw'
      })
      .afterClosed()
      .subscribe((confirmed: boolean) => {
        if (confirmed) {
          void this.loadFloors();
        }
      });
  }

  addFloor(): void {
    this.dialog
      .open(FloorFormModal, {
        data: {
          residences: this.residences(),
          preselectedResidenceId: this.selectedResidence() || undefined
        },
        width: '60%',
        maxWidth: '90vw'
      })
      .afterClosed()
      .subscribe(result => {
        if (result) {
          this.loadFloors();
        }
      });
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
    this.loadFloors();
  }

  private resetToFirstPage(): void {
    this.pagination.update(state => ({ ...state, pageIndex: 0 }));
    if (this.paginator) {
      this.suppressNextPageEvent = true;
      this.paginator.pageIndex = 0;
    }
  }

  private async loadFloors(): Promise<void> {
    this.isLoadingData.set(true);
    const state = this.pagination();

    const params: ListFloorsStructureFloorsGet$Params = {
      page: state.pageIndex + 1,
      size: state.pageSize,
      sort_by: state.sortBy,
      sort_order: state.sortOrder
    };

    const residenceId = this.selectedResidence();
    if (residenceId) {
      params.residence_id = residenceId;
    }

    const search = this.searchTerm().trim();
    if (search) {
      params.search = search;
    }

    try {
      const response = (await firstValueFrom(this.structureService.listFloorsStructureFloorsGet(params))) as PaginatedResponse;
      const floors = (response.items ?? []).map((item: Record<string, any>) => ({
        id: item['id'],
        name: item['name'],
        residence_id: item['residence_id'],
        residence_name: item['residence_name'] ?? 'Desconocida',
        created_at: item['created_at'] ?? new Date().toISOString(),
        updated_at: item['updated_at'] ?? null
      })) as FloorWithDetails[];

      this.dataSource.data = floors;
      this.pagination.update(current => ({ ...current, total: response.total ?? floors.length }));
    } catch (error: any) {
      this.notificationService.handleApiError(error, 'Error al cargar los pisos');
    } finally {
      this.isLoadingData.set(false);
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
}
