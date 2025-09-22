import { AfterViewInit, Component, OnInit, ViewChild, inject, signal, computed } from '@angular/core';
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
import { MatCheckboxModule } from '@angular/material/checkbox';
import { DateFormatPipe } from '../../shared/pipes/date-format-pipe';

import { Header } from '../shared/header/header';
import { ManagersService } from './model/manager.model';
import { ResidencesService } from '../../../openapi/generated/services/residences.service';
import { NotificationService } from '../../shared/notification.service';
import { ManagerFormData, ManagerWithDetails } from './model/manager.model';
import { ViewManagerModal } from './view-manager-modal/view-manager-modal';
import { ManagerFormModal } from './managers-form-modal/managers-form-modal';
import { DeleteManagerModal } from './delete-manager-modal/delete-manager-modal';
import { firstValueFrom } from 'rxjs';

interface ResidenceOption {
  id: string;
  name: string;
}

interface ManagerFilters {
  search: string;
  residence_id: string;
  status: string;
}

interface PaginatedResponse {
  items: ManagerWithDetails[];
  total: number;
  page: number;
  size: number;
  pages: number;
  has_next: boolean;
  has_prev: boolean;
}

@Component({
  selector: 'app-managers',
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
    MatCheckboxModule,
    DateFormatPipe,
    Header,
    ViewManagerModal,
    ManagerFormModal,
    DeleteManagerModal
  ],
  providers: [ManagersService],
  templateUrl: './managers.html',
  styleUrl: './managers.scss'
})
export class Managers implements OnInit, AfterViewInit {
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  dataSource = new MatTableDataSource<ManagerWithDetails>([]);
  displayedColumns: string[] = [
    'username',
    'full_name',
    'email',
    'status',
    'residence_names',
    'created_by_name',
    'created_at',
    'actions'
  ];

  isLoadingData = signal(false);
  isLoadingResidences = signal(false);
  residences = signal<ResidenceOption[]>([]);
  availableResidences = signal<ResidenceOption[]>([]);

  // Filtros
  filters = signal<ManagerFilters>({
    search: '',
    residence_id: '',
    status: ''
  });

  // Paginación
  pagination = signal({
    page: 1,
    size: 10,
    total: 0,
    sort_by: 'created_at',
    sort_order: 'desc' as SortDirection
  });

  // Role del usuario actual
  currentUserRole = signal<string>('');
  isSuperAdmin = computed(() => this.currentUserRole() === 'superadmin');

  private dialog = inject(MatDialog);
  private managersService = inject(ManagersService);
  private residencesService = inject(ResidencesService);
  private notificationService = inject(NotificationService);

  ngOnInit() {
    this.loadUserRole();
    this.loadResidences();
    this.loadAvailableResidences();
    this.loadManagers();
  }

  ngAfterViewInit() {
    this.dataSource.sort = this.sort;
    this.dataSource.paginator = this.paginator;
  }

  private loadUserRole() {
    const userData = localStorage.getItem('user_data');
    if (userData) {
      try {
        const user = JSON.parse(userData);
        this.currentUserRole.set(user.role || '');
      } catch (e) {
        console.error('Error parsing user data:', e);
      }
    }
  }

  private async loadResidences() {
    this.isLoadingResidences.set(true);
    try {
      const response: any = await firstValueFrom(this.residencesService.listResidencesResidencesGet({}));
      this.residences.set(
        (response || []).map((item: any) => ({
          id: item.id,
          name: item.name
        }))
      );
    } catch (error) {
      this.notificationService.error('Error al cargar residencias');
    } finally {
      this.isLoadingResidences.set(false);
    }
  }

  private async loadAvailableResidences() {
    try {
      const residences = await firstValueFrom(this.managersService.getAvailableResidences());
      this.availableResidences.set(residences);
    } catch (error) {
      this.notificationService.error('Error al cargar residencias disponibles');
    }
  }

  private async loadManagers() {
    this.isLoadingData.set(true);
    try {
      const currentFilters = this.filters();
      const search = currentFilters.search?.trim() || '';

      const params: any = {
        page: this.pagination().page,
        size: this.pagination().size,
        sort_by: this.pagination().sort_by,
        sort_order: this.pagination().sort_order
      };

      if (search) {
        params['search'] = search;
      }
      if (currentFilters.residence_id) {
        params['residence_id'] = currentFilters.residence_id;
      }
      if (currentFilters.status) {
        params['status'] = currentFilters.status;
      }

      const response: PaginatedResponse = await firstValueFrom(this.managersService.listManagers(params));

      const items = (response.items || []).map((item: ManagerWithDetails) => ({
        ...item
      }));

      this.dataSource.data = items;
      this.pagination.update(current => ({ ...current, total: response.total || items.length }));
    } catch (error: any) {
      this.notificationService.error('Error al cargar gestores');
    } finally {
      this.isLoadingData.set(false);
    }
  }

  applyFilter(event: Event) {
    const input = event.target as HTMLInputElement;
    this.filters.update(current => ({ ...current, search: input.value }));
    this.pagination.update(current => ({ ...current, page: 1 }));
    this.loadManagers();
  }

  onResidenceChange(residenceId: string) {
    this.filters.update(current => ({ ...current, residence_id: residenceId }));
    this.pagination.update(current => ({ ...current, page: 1 }));
    this.loadManagers();
  }

  onStatusChange(status: string) {
    this.filters.update(current => ({ ...current, status }));
    this.pagination.update(current => ({ ...current, page: 1 }));
    this.loadManagers();
  }

  onPageChange(event: PageEvent) {
    this.pagination.update(current => ({
      ...current,
      page: event.pageIndex + 1,
      size: event.pageSize
    }));
    this.loadManagers();
  }

  onSort(sort: Sort) {
    this.pagination.update(current => ({
      ...current,
      sort_by: sort.active,
      sort_order: sort.direction
    }));
    this.loadManagers();
  }

  addManager() {
    const dialogRef = this.dialog.open(ManagerFormModal, {
      width: '600px',
      data: {
        residences: this.availableResidences()
      }
    });

    dialogRef.afterClosed().subscribe((result: ManagerFormData | undefined) => {
      if (result) {
        this.createManager(result);
      }
    });
  }

  editManager(manager: ManagerWithDetails) {
    const dialogRef = this.dialog.open(ManagerFormModal, {
      width: '600px',
      data: {
        manager,
        residences: this.availableResidences()
      }
    });

    dialogRef.afterClosed().subscribe((result: ManagerFormData | undefined) => {
      if (result) {
        this.updateManager(manager.id, result);
      }
    });
  }

  viewManager(manager: ManagerWithDetails) {
    this.dialog.open(ViewManagerModal, {
      width: '500px',
      data: { manager }
    });
  }

  deleteManager(manager: ManagerWithDetails) {
    const dialogRef = this.dialog.open(DeleteManagerModal, {
      width: '400px',
      data: { manager }
    });

    dialogRef.afterClosed().subscribe((confirmed: boolean) => {
      if (confirmed) {
        this.confirmDeleteManager(manager.id);
      }
    });
  }

  private async createManager(data: ManagerFormData) {
    try {
      // Asegurar que password esté presente para creación
      const createData = {
        ...data,
        password: data.password || 'default123' // Password temporal si no se proporciona
      };
      await firstValueFrom(this.managersService.createManager(createData));
      this.notificationService.success('Gestor creado exitosamente');
      this.loadManagers();
    } catch (error) {
      this.notificationService.error('Error al crear gestor');
    }
  }

  private async updateManager(id: string, data: ManagerFormData) {
    try {
      await firstValueFrom(this.managersService.updateManager(id, data));
      this.notificationService.success('Gestor actualizado exitosamente');
      this.loadManagers();
    } catch (error) {
      this.notificationService.error('Error al actualizar gestor');
    }
  }

  private async confirmDeleteManager(id: string) {
    try {
      await firstValueFrom(this.managersService.deleteManager(id));
      this.notificationService.success('Gestor eliminado exitosamente');
      this.loadManagers();
    } catch (error) {
      this.notificationService.error('Error al eliminar gestor');
    }
  }

  // Columnas que se muestran según el rol
  getDisplayedColumns(): string[] {
    if (this.isSuperAdmin()) {
      return this.displayedColumns;
    } else {
      // Ocultar columna 'created_by_name' para no superadmin
      return this.displayedColumns.filter(col => col !== 'created_by_name');
    }
  }
}