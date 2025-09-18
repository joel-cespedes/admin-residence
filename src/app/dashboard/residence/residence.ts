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
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { Header } from '../shared/header/header';
import { CommonModule, DatePipe } from '@angular/common';

import { ResidencesService } from '../../../openapi/generated/services/residences.service';
import { PaginatedResponse } from '../../../openapi/generated/models/paginated-response';
import { ResidenceWithContact } from './model/residence.model';
import { ViewResidenceModal } from './view-residence-modal/view-residence-modal';
import { ResidenceFormModal } from './residence-form-modal/residence-form-modal';
import { DeleteResidenceModal } from './delete-residence-modal/delete-residence-modal';
import { NotificationService } from '../../core/services/notification.service';

@Component({
  selector: 'app-residence',
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
    MatSnackBarModule,
    DatePipe
  ],
  templateUrl: './residence.html',
  styleUrl: './residence.scss'
})
export class Residence implements AfterViewInit, OnInit {
  displayedColumns: string[] = ['name', 'address', 'phone', 'email', 'created_at', 'actions'];
  dataSource: MatTableDataSource<ResidenceWithContact> = new MatTableDataSource<ResidenceWithContact>([]);

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  private residencesService = inject(ResidencesService);
  private dialog = inject(MatDialog);
  private notificationService = inject(NotificationService);

  // Pagination signals
  pageIndex = signal(0);
  pageSize = signal(10);
  totalItems = signal(0);

  // Search signals
  searchTerm = signal('');
  private searchTimeout: ReturnType<typeof setTimeout> | null = null;

  ngOnInit() {
    this.loadResidences();
  }

  ngAfterViewInit() {
    // Setup paginator events - IMPORTANT: Don't connect paginator to dataSource for backend pagination
    if (this.paginator) {
      this.paginator.page.subscribe((event: any) => {
        console.log('Paginator event - Page:', event.pageIndex, 'Size:', event.pageSize);
        this.pageIndex.set(event.pageIndex);
        this.pageSize.set(event.pageSize);
        this.loadResidences();
      });
    }

    // Setup sort events
    if (this.sort) {
      this.sort.sortChange.subscribe(() => {
        console.log('Sort event triggered');
        this.pageIndex.set(0); // Reset to first page when sorting
        this.loadResidences();
      });
    }
  }

  private loadResidences() {
    // Use the paginated endpoint
    const params: { [key: string]: string | number } = {
      page: this.pageIndex() + 1, // API uses 1-based indexing
      size: this.pageSize()
    };

    // Add search term if provided
    if (this.searchTerm()) {
      params['search'] = this.searchTerm();
    }

    this.residencesService.listResidencesResidencesGet(params).subscribe({
      next: (response: { items: any[]; total?: number }) => {
        this.dataSource.data = (response.items || []).map(
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
        );
        this.totalItems.set(response.total || 0);

        // Update paginator state manually
        if (this.paginator) {
          this.paginator.pageIndex = this.pageIndex();
          this.paginator.pageSize = this.pageSize();
        }
      },
      error: (error: { status?: number; message?: string }) => {
        this.notificationService.handleApiError(error, 'Error al cargar las residencias');
      }
    });
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
      this.pageIndex.set(0); // Reset to first page when filtering
      this.loadResidences();
    }, 300);
  }

  viewResidence(residence: ResidenceWithContact) {
    const dialogRef = this.dialog.open(ViewResidenceModal, {
      data: residence,
      width: '600px',
      maxWidth: '90vw'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadResidences();
      }
    });
  }

  editResidence(residence: ResidenceWithContact) {
    const dialogRef = this.dialog.open(ResidenceFormModal, {
      data: residence,
      width: '60%',
      maxWidth: '90vw'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadResidences();
      }
    });
  }

  deleteResidence(residence: ResidenceWithContact) {
    const dialogRef = this.dialog.open(DeleteResidenceModal, {
      data: residence,
      width: '50%',
      maxWidth: '90vw'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadResidences();
      }
    });
  }

  addResidence() {
    const dialogRef = this.dialog.open(ResidenceFormModal, {
      data: null,
      width: '60%',
      maxWidth: '90vw'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadResidences();
      }
    });
  }
}
