import { AfterViewInit, Component, OnInit, ViewChild, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginator, MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSort, MatSortModule, Sort, SortDirection } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { DatePipe } from '@angular/common';

import { Header } from '../shared/header/header';
import { DevicesService } from '../../../openapi/generated/services/devices.service';
import { ResidencesService } from '../../../openapi/generated/services/residences.service';
import { NotificationService } from '../../shared/notification.service';
import { DeviceOut } from '../../../openapi/generated/models/device-out';
import { ResidenceOut } from '../../../openapi/generated/models/residence-out';
import { firstValueFrom } from 'rxjs';
import { PaginatedResponseDeviceOut } from '../../../openapi/generated/models/paginated-response-device-out';
import { ListDevicesDevicesGet$Params } from '../../../openapi/generated/fn/devices/list-devices-devices-get';

export interface DeviceWithDetails extends DeviceOut {
  residence_name?: string;
  created_by_name?: string;
}

@Component({
  selector: 'app-devices',
  imports: [
    MatTableModule,
    MatPaginatorModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    MatInputModule,
    MatSortModule,
    MatButtonToggleModule,
    DatePipe,
    Header
  ],
  templateUrl: './devices.html',
  styleUrl: './devices.scss'
})
export class Devices implements OnInit, AfterViewInit {
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  private readonly devicesService = inject(DevicesService);
  private readonly residencesService = inject(ResidencesService);
  private readonly notificationService = inject(NotificationService);

  readonly dataSource = new MatTableDataSource<DeviceWithDetails>([]);
  readonly isLoadingData = signal(false);
  readonly pagination = signal({
    pageIndex: 0,
    pageSize: 10,
    total: 0,
    sortBy: 'created_at',
    sortOrder: 'desc' as 'asc' | 'desc'
  });

  readonly searchTerm = signal<string>('');
  readonly residences = signal<ResidenceOut[]>([]);
  readonly isLoadingResidences = signal(false);
  readonly selectedResidence = signal<string>('');
  readonly displayedColumns = ['name', 'type', 'mac', 'battery_percent', 'residence_name', 'created_by_name', 'created_at'];
  readonly totalItems = computed(() => this.pagination().total);

  private searchDebounce: ReturnType<typeof setTimeout> | null = null;
  private suppressNextPageEvent = false;

  ngOnInit(): void {
    this.loadResidences();
    this.loadDevices();
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
        this.loadDevices();
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
      pageIndex: event.pageIndex,
      pageSize: event.pageSize
    }));
    this.loadDevices();
  }

  onSearch(event: Event): void {
    const value = (event.target as HTMLInputElement).value ?? '';
    if (this.searchDebounce) {
      clearTimeout(this.searchDebounce);
    }
    this.searchDebounce = setTimeout(() => {
      this.searchTerm.set(value);
      this.resetToFirstPage();
      this.loadDevices();
    }, 300);
  }

  onResidenceChange(residenceId: string): void {
    this.selectedResidence.set(residenceId || '');
    this.resetToFirstPage();
    this.loadDevices();
  }

  loadResidences(): void {
    this.isLoadingResidences.set(true);
    this.residencesService.listResidencesResidencesGet({ size: 100 }).subscribe({
      next: (residences: any) => {
        this.residences.set(residences.items || []);
        this.isLoadingResidences.set(false);
      },
      error: () => {
        this.notificationService.error('Error loading residences');
        this.isLoadingResidences.set(false);
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

  getDeviceTypeLabel(type: string): string {
    const typeLabels: Record<string, string> = {
      blood_pressure: 'Tensiómetro',
      pulse_oximeter: 'Oxímetro',
      scale: 'Báscula',
      thermometer: 'Termómetro'
    };
    return typeLabels[type] || type;
  }

  getBatteryClass(percent: number): string {
    if (percent >= 50) return 'battery-high';
    if (percent >= 20) return 'battery-medium';
    return 'battery-low';
  }

  private async loadDevices(): Promise<void> {
    this.isLoadingData.set(true);
    const state = this.pagination();

    const params: ListDevicesDevicesGet$Params = {
      page: state.pageIndex + 1,
      size: state.pageSize,
      sort_by: state.sortBy,
      sort_order: state.sortOrder
    };

    const search = this.searchTerm().trim();
    if (search) {
      params.search = search;
    }

    const residenceId = this.selectedResidence();
    if (residenceId && residenceId.trim() !== '') {
      params.residence_id = residenceId;
    }

    try {
      const response = (await firstValueFrom(this.devicesService.listDevicesDevicesGet(params))) as PaginatedResponseDeviceOut;
      const devices = (response.items ?? []).map((item: Record<string, any>) => ({
        id: item['id'],
        name: item['name'],
        type: item['type'],
        mac: item['mac'],
        battery_percent: item['battery_percent'],
        residence_id: item['residence_id'],
        residence_name: item['residence_info']?.['name'] ?? 'Desconocida',
        created_by_name: item['created_by_info']?.['name'] ?? 'Desconocido',
        created_at: item['created_at'] ?? new Date().toISOString(),
        updated_at: item['updated_at'] ?? null,
        deleted_at: item['deleted_at'] ?? null
      })) as DeviceWithDetails[];

      this.dataSource.data = devices;
      this.pagination.update(current => ({ ...current, total: response.total ?? devices.length }));
    } catch (error: any) {
      this.notificationService.handleApiError(error, 'Error al cargar los dispositivos');
    } finally {
      this.isLoadingData.set(false);
    }
  }
}
