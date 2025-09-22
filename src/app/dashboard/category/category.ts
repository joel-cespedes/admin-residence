import { DatePipe } from '@angular/common';
import { AfterViewInit, Component, OnInit, ViewChild, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginator, MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSort, MatSortModule, Sort } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';

import { ResidenceOut } from '../../../openapi/generated/models/residence-out';
import { TaskCategoryOut } from '../../../openapi/generated/models/task-category-out';
import { ResidencesService } from '../../../openapi/generated/services/residences.service';
import { TasksService } from '../../../openapi/generated/services/tasks.service';
import { NotificationService } from '../../shared/notification.service';
import { Header } from '../shared/header/header';
import { CategoryFormModal } from './category-form-modal/category-form-modal';
import { DeleteCategoryModal } from './delete-category-modal/delete-category-modal';
import { ViewCategoryModal } from './view-category-modal/view-category-modal';

export interface CategoryWithDetails extends TaskCategoryOut {
  residence_name?: string;
  created_by_info?: {
    id: string;
    name: string;
    alias: string;
  };
}

@Component({
  selector: 'app-category',
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
  templateUrl: './category.html',
  styleUrl: './category.scss'
})
export class Category implements OnInit, AfterViewInit {
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  private readonly tasksService = inject(TasksService);
  private readonly residencesService = inject(ResidencesService);
  private readonly notificationService = inject(NotificationService);
  private readonly dialog = inject(MatDialog);

  readonly dataSource = new MatTableDataSource<CategoryWithDetails>([]);
  readonly isLoadingData = signal(false);
  readonly pagination = signal({
    pageIndex: 0,
    pageSize: 10,
    total: 0,
    sortBy: 'created_at',
    sortOrder: 'desc' as 'asc' | 'desc'
  });

  readonly residences = signal<ResidenceOut[]>([]);
  readonly isLoadingResidences = signal(false);
  readonly selectedResidence = signal<string>('');
  readonly searchTerm = signal<string>('');
  readonly displayedColumns = ['name', 'residence_name', 'created_by_info', 'created_at', 'actions'];
  readonly totalItems = computed(() => this.pagination().total);

  private searchDebounce: ReturnType<typeof setTimeout> | null = null;

  ngOnInit(): void {
    this.loadResidences();
    this.loadCategories();
  }

  ngAfterViewInit(): void {
    this.dataSource.sort = this.sort;
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

  loadCategories(): void {
    this.isLoadingData.set(true);
    const params: any = {
      page: this.pagination().pageIndex + 1,
      size: this.pagination().pageSize,
      sort: `${this.pagination().sortBy}:${this.pagination().sortOrder}`
    };

    const residenceId = this.selectedResidence();
    if (residenceId) {
      params.residence_id = residenceId;
    }

    const search = this.searchTerm();
    if (search) {
      params.search = search;
    }

    this.tasksService.listCategoriesTasksCategoriesGet(params).subscribe({
      next: response => {
        const categoriesWithDetails = response.items.map(category => {
          const residence = this.residences().find(r => r.id === category['residence_id']);
          return {
            ...category,
            residence_name: residence?.name || 'Unknown'
          };
        });
        this.dataSource.data = categoriesWithDetails as CategoryWithDetails[];
        this.pagination.update(p => ({ ...p, total: response.total }));
        this.isLoadingData.set(false);
      },
      error: (error: any) => {
        this.notificationService.error('Error loading categories');
        this.isLoadingData.set(false);
      }
    });
  }

  onSearch(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.searchTerm.set(value);

    if (this.searchDebounce) {
      clearTimeout(this.searchDebounce);
    }

    this.searchDebounce = setTimeout(() => {
      this.pagination.update(p => ({ ...p, pageIndex: 0 }));
      this.loadCategories();
    }, 300);
  }

  onResidenceChange(residenceId: string): void {
    this.selectedResidence.set(residenceId);
    this.pagination.update(p => ({ ...p, pageIndex: 0 }));
    this.loadCategories();
  }

  onPageChange(event: PageEvent): void {
    this.pagination.update(p => ({
      ...p,
      pageIndex: event.pageIndex,
      pageSize: event.pageSize
    }));
    this.loadCategories();
  }

  onSort(sort: Sort): void {
    this.pagination.update(p => ({
      ...p,
      sortBy: sort.active || 'created_at',
      sortOrder: sort.direction || 'desc',
      pageIndex: 0
    }));
    this.loadCategories();
  }

  openViewModal(category: CategoryWithDetails): void {
    this.dialog.open(ViewCategoryModal, {
      width: '600px',
      data: { category }
    });
  }

  openCreateModal(): void {
    const dialogRef = this.dialog.open(CategoryFormModal, {
      width: '600px',
      data: {
        residences: this.residences(),
        mode: 'create'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadCategories();
      }
    });
  }

  openEditModal(category: CategoryWithDetails): void {
    const dialogRef = this.dialog.open(CategoryFormModal, {
      width: '600px',
      data: {
        category,
        residences: this.residences(),
        mode: 'edit'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadCategories();
      }
    });
  }

  openDeleteModal(category: CategoryWithDetails): void {
    const dialogRef = this.dialog.open(DeleteCategoryModal, {
      width: '400px',
      data: { category }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadCategories();
      }
    });
  }
}
