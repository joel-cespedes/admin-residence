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
import { UsersService } from '../../../openapi/generated/services/users.service';
import { ResidencesService } from '../../../openapi/generated/services/residences.service';
import { NotificationService } from '../../shared/notification.service';
import { ViewManagerModal } from './view-manager-modal/view-manager-modal';
import { ManagerFormModal } from './managers-form-modal/managers-form-modal';
import { DeleteManagerModal } from './delete-manager-modal/delete-manager-modal';
import { firstValueFrom } from 'rxjs';

interface ResidenceOption {
  id: string;
  name: string;
}

interface ManagerWithDetails {
  id: string;
  alias: string;
  name: string;
  role: 'superadmin' | 'manager' | 'professional';
  created_at: string;
  residences: { id: string; name?: string }[];
  residence_names: string[];
  residence_count: number;
  created_by: {
    id: string;
    name: string;
    alias: string;
  };
}

@Component({
  selector: 'app-managers',
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
  templateUrl: './managers.html',
  styleUrl: './managers.scss'
})
export class Managers implements OnInit, AfterViewInit {
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  private readonly usersService = inject(UsersService);
  private readonly residencesService = inject(ResidencesService);
  private readonly notificationService = inject(NotificationService);
  private readonly dialog = inject(MatDialog);

  readonly dataSource = new MatTableDataSource<ManagerWithDetails>([]);
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
  readonly searchTerm = signal<string>('');
  readonly displayedColumns = ['alias', 'name', 'role', 'created_by', 'residence_names', 'created_at', 'actions'];
  readonly totalItems = computed(() => this.pagination().total);

  private searchDebounce: ReturnType<typeof setTimeout> | null = null;

  ngOnInit(): void {
    this.loadResidences();
    this.loadManagers();
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

        this.loadManagers();
      });
    }
  }

  private async loadResidences(): Promise<void> {
    this.isLoadingResidences.set(true);
    try {
      const response = await firstValueFrom(this.residencesService.listResidencesResidencesGet({ size: 100 }));
      this.residences.set(
        (response.items || []).map((item: any) => ({
          id: item.id,
          name: item.name
        }))
      );
    } catch (error) {
      this.notificationService.handleApiError(error, 'Error al cargar residencias');
    } finally {
      this.isLoadingResidences.set(false);
    }
  }

  private async loadManagers(): Promise<void> {
    this.isLoadingData.set(true);
    try {
      const params: any = {
        page: this.pagination().pageIndex + 1,
        size: this.pagination().pageSize,
        sort_by: this.pagination().sortBy,
        sort_order: this.pagination().sortOrder
      };

      // Add role filter to get only managers and professionals
      params['role'] = 'manager';

      // Add search term if exists
      if (this.searchTerm().trim()) {
        params['search'] = this.searchTerm().trim();
      }

      // Note: residence_id filter is not available in users endpoint
      // We'll filter by residence on the frontend after getting all managers

      const response = await firstValueFrom(this.usersService.listUsersUsersGet(params));

      // Process managers data
      const managers = await this.processManagersData(response.items || []);

      this.dataSource.data = managers;
      this.pagination.update(current => ({
        ...current,
        total: response.total || managers.length
      }));
    } catch (error) {
      this.notificationService.handleApiError(error, 'Error al cargar gestores');
    } finally {
      this.isLoadingData.set(false);
    }
  }

  private async processManagersData(users: any[]): Promise<ManagerWithDetails[]> {
    // Get all residence IDs to fetch names
    const allResidenceIds = new Set<string>();
    users.forEach(user => {
      (user.residences || []).forEach((res: any) => {
        allResidenceIds.add(res.id);
      });
    });

    // Fetch residence names
    let residenceNames = new Map<string, string>();
    if (allResidenceIds.size > 0) {
      try {
        const residencesResponse = await firstValueFrom(this.residencesService.listResidencesResidencesGet({ size: 100 }));
        residenceNames = new Map((residencesResponse.items || []).map((res: any) => [res.id, res.name]));
      } catch (error) {
        console.error('Error loading residence names:', error);
      }
    }

    // Map users to manager format and filter by selected residence
    const filteredUsers = this.selectedResidence()
      ? users.filter(user => (user.residences || []).some((res: any) => res.id === this.selectedResidence()))
      : users;

    return filteredUsers.map(user => ({
      id: user.id,
      alias: user.alias,
      name: user.name || user.alias,
      role: user.role,
      created_at: user.created_at,
      residences: user.residences || [],
      residence_names: (user.residences || []).map((res: any) => residenceNames.get(res.id) || 'Desconocida'),
      residence_count: (user.residences || []).length,
      created_by: user.created_by || { id: '', name: 'Desconocido', alias: 'desconocido' }
    }));
  }

  onResidenceChange(residenceId: string): void {
    this.selectedResidence.set(residenceId);
    this.pagination.update(current => ({ ...current, pageIndex: 0 }));
    this.loadManagers();
  }

  applyFilter(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchTerm.set(input.value);

    // Debounce search
    if (this.searchDebounce) {
      clearTimeout(this.searchDebounce);
    }

    this.searchDebounce = setTimeout(() => {
      this.pagination.update(current => ({ ...current, pageIndex: 0 }));
      this.loadManagers();
    }, 300);
  }

  onPageChange(event: PageEvent): void {
    this.pagination.update(current => ({
      ...current,
      pageIndex: event.pageIndex,
      pageSize: event.pageSize
    }));
    this.loadManagers();
  }

  addManager(): void {
    const dialogRef = this.dialog.open(ManagerFormModal, {
      width: '80%',
      data: {
        residences: this.residences()
      }
    });

    dialogRef.afterClosed().subscribe(async (result: any) => {
      if (result) {
        await this.createManager(result);
      }
    });
  }

  viewManager(manager: ManagerWithDetails): void {
    this.dialog.open(ViewManagerModal, {
      width: '80%',
      data: { manager }
    });
  }

  editManager(manager: ManagerWithDetails): void {
    const dialogRef = this.dialog.open(ManagerFormModal, {
      width: '80%',
      data: {
        manager,
        residences: this.residences()
      }
    });

    dialogRef.afterClosed().subscribe(async (result: any) => {
      if (result) {
        await this.updateManager(manager.id, result);
      }
    });
  }

  deleteManager(manager: ManagerWithDetails): void {
    const dialogRef = this.dialog.open(DeleteManagerModal, {
      width: '80%',
      data: { manager }
    });

    dialogRef.afterClosed().subscribe((confirmed: boolean) => {
      if (confirmed) {
        // La modal ya manejó la eliminación, solo recargar la lista
        this.loadManagers();
      }
    });
  }

  private async createManager(data: any): Promise<void> {
    try {
      await firstValueFrom(
        this.usersService.createUserUsersPost({
          body: {
            alias: data.alias,
            name: data.name,
            password: data.password || 'default123',
            residence_ids: data.residence_ids,
            role: 'manager'
          }
        })
      );
      this.notificationService.success('Gestor creado exitosamente');
      this.loadManagers();
    } catch (error) {
      this.notificationService.handleApiError(error, 'Error al crear gestor');
    }
  }

  private async updateManager(id: string, data: any): Promise<void> {
    try {
      const updateBody: any = {
        alias: data.alias,
        name: data.name,
        residence_ids: data.residence_ids
      };

      // Solo incluir contraseña si se proporcionó
      if (data.password) {
        updateBody.password = data.password;
      }

      await firstValueFrom(
        this.usersService.updateUserUsersUserIdPut({
          user_id: id,
          body: updateBody
        })
      );
      this.notificationService.success('Gestor actualizado exitosamente');
      this.loadManagers();
    } catch (error) {
      this.notificationService.handleApiError(error, 'Error al actualizar gestor');
    }
  }
}
