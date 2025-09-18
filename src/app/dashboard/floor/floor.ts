import { Component, AfterViewInit, ViewChild, inject, OnInit, signal } from '@angular/core';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
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
import { CommonModule, DatePipe } from '@angular/common';

import { Header } from '../shared/header/header';
import { ResidencesService } from '../../../openapi/generated/services/residences.service';
import { StructureService } from '../../../openapi/generated/services/structure.service';
import { ResidenceWithContact } from '../residence/model/residence.model';
import { FloorWithDetails } from './model/floor.model';
import { ViewFloorModal } from './view-floor-modal/view-floor-modal';
import { FloorFormModal } from './floor-form-modal/floor-form-modal';
import { DeleteFloorModal } from './delete-floor-modal/delete-floor-modal';
import { NotificationService } from '../../core/services/notification.service';

@Component({
  selector: 'app-floor',
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
    DatePipe
  ],
  templateUrl: './floor.html',
  styleUrl: './floor.scss'
})
export class Floor implements AfterViewInit, OnInit {
  displayedColumns: string[] = ['name', 'residence_name', 'created_at', 'actions'];
  dataSource: MatTableDataSource<FloorWithDetails> = new MatTableDataSource<FloorWithDetails>([]);

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  private residencesService = inject(ResidencesService);
  private structureService = inject(StructureService);
  private dialog = inject(MatDialog);
  private notificationService = inject(NotificationService);

  residences = signal<ResidenceWithContact[]>([]);
  selectedResidenceId = signal<string>('');
  isLoadingResidences = signal(false);
  isLoadingFloors = signal(false);

  // Pagination signals
  pageIndex = signal(0);
  pageSize = signal(10);
  totalItems = signal(0);

  // Search signals
  searchTerm = signal('');
  private searchTimeout: ReturnType<typeof setTimeout> | null = null;

  ngOnInit() {
    this.loadResidences();
    this.loadFloors();
  }

  ngAfterViewInit() {
    // Setup paginator events - IMPORTANT: Don't connect paginator to dataSource for backend pagination
    if (this.paginator) {
      this.paginator.page.subscribe((event: any) => {
        console.log('Paginator event - Page:', event.pageIndex, 'Size:', event.pageSize);
        this.pageIndex.set(event.pageIndex);
        this.pageSize.set(event.pageSize);
        this.loadFloors();
      });
    }

    // Setup sort events
    if (this.sort) {
      this.sort.sortChange.subscribe(() => {
        console.log('Sort event triggered');
        this.pageIndex.set(0); // Reset to first page when sorting
        this.loadFloors();
      });
    }
  }

  private loadResidences() {
    this.isLoadingResidences.set(true);
    this.residencesService.listResidencesResidencesGet().subscribe({
      next: (response: { items: any[] }) => {
        this.residences.set(response.items || []);
        this.isLoadingResidences.set(false);
      },
      error: (error: { status?: number; message?: string }) => {
        this.notificationService.handleApiError(error, 'Error al cargar las residencias');
        this.isLoadingResidences.set(false);
      }
    });
  }

  private loadFloors() {
    this.isLoadingFloors.set(true);

    // Use the paginated endpoint
    const params: { [key: string]: string | number } = {
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

    this.structureService.listFloorsStructureFloorsGet(params).subscribe({
      next: (response: { items: any[]; total?: number }) => {
        this.dataSource.data = (response.items || []).map(
          (item: Record<string, any>) =>
            ({
              id: item['id'],
              name: item['name'],
              residence_id: item['residence_id'],
              residence_name: item['residence_name'] || this.residences().find(r => r.id === item['residence_id'])?.name || 'Desconocida',
              created_at: item['created_at'] || new Date().toISOString(),
              updated_at: item['updated_at'] || null
            }) as FloorWithDetails
        );
        this.totalItems.set(response.total || 0);

        // Update paginator state manually
        if (this.paginator) {
          this.paginator.pageIndex = this.pageIndex();
          this.paginator.pageSize = this.pageSize();
        }

        this.isLoadingFloors.set(false);
      },
      error: (error: { status?: number; message?: string }) => {
        this.notificationService.handleApiError(error, 'Error al cargar los pisos');
        this.isLoadingFloors.set(false);
      }
    });
  }

  onResidenceChange(residenceId: string) {
    this.selectedResidenceId.set(residenceId);
    this.loadFloors();
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
      this.loadFloors();
    }, 300);
  }

  viewFloor(floor: FloorWithDetails) {
    const dialogRef = this.dialog.open(ViewFloorModal, {
      data: floor,
      width: '600px',
      maxWidth: '90vw'
    });

    dialogRef.afterClosed().subscribe((result: any) => {
      if (result) {
        this.loadFloors();
      }
    });
  }

  editFloor(floor: FloorWithDetails) {
    const dialogRef = this.dialog.open(FloorFormModal, {
      data: floor,
      width: '60%',
      maxWidth: '90vw'
    });

    dialogRef.afterClosed().subscribe((result: any) => {
      if (result) {
        this.loadFloors();
      }
    });
  }

  deleteFloor(floor: FloorWithDetails) {
    const dialogRef = this.dialog.open(DeleteFloorModal, {
      data: floor,
      width: '50%',
      maxWidth: '90vw'
    });

    dialogRef.afterClosed().subscribe((result: any) => {
      if (result) {
        this.loadFloors();
      }
    });
  }

  addFloor() {
    const dialogRef = this.dialog.open(FloorFormModal, {
      data: {
        residences: this.residences(),
        preselectedResidenceId: this.selectedResidenceId()
      },
      width: '60%',
      maxWidth: '90vw'
    });

    dialogRef.afterClosed().subscribe((result: any) => {
      if (result) {
        this.loadFloors();
      }
    });
  }
}