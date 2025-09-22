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
import { TaskTemplateOut } from '../../../openapi/generated/models/task-template-out';
import { ResidencesService } from '../../../openapi/generated/services/residences.service';
import { TasksService } from '../../../openapi/generated/services/tasks.service';
import { NotificationService } from '../../shared/notification.service';
import { Header } from '../shared/header/header';
import { DeleteTaskModal } from './delete-task-modal/delete-task-modal';
import { TaskFormModal } from './task-form-modal/task-form-modal';
import { ViewTaskModal } from './view-task-modal/view-task-modal';

export interface TaskWithDetails extends TaskTemplateOut {
  category_name?: string;
  residence_name?: string;
  created_by_info?: {
    id: string;
    name: string;
    alias: string;
  };
}

@Component({
  selector: 'app-task',
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
  templateUrl: './task.html',
  styleUrl: './task.scss'
})
export class Task implements OnInit, AfterViewInit {
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  private readonly tasksService = inject(TasksService);
  private readonly residencesService = inject(ResidencesService);
  private readonly notificationService = inject(NotificationService);
  private readonly dialog = inject(MatDialog);

  readonly dataSource = new MatTableDataSource<TaskWithDetails>([]);
  readonly isLoadingData = signal(false);
  readonly pagination = signal({
    pageIndex: 0,
    pageSize: 10,
    total: 0,
    sortBy: 'created_at',
    sortOrder: 'desc' as 'asc' | 'desc'
  });

  readonly residences = signal<ResidenceOut[]>([]);
  readonly categories = signal<TaskCategoryOut[]>([]);
  readonly isLoadingResidences = signal(false);
  readonly selectedResidence = signal<string>('');
  readonly selectedCategory = signal<string>('');
  readonly searchTerm = signal<string>('');
  readonly displayedColumns = ['name', 'category_name', 'residence_name', 'created_by_info', 'created_at', 'actions'];
  readonly totalItems = computed(() => this.pagination().total);

  private searchDebounce: ReturnType<typeof setTimeout> | null = null;

  ngOnInit(): void {
    this.loadResidences();
    this.loadCategories();
    this.loadTasks();
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
      error: y => {
        this.notificationService.error('Error loading residences');
        this.isLoadingResidences.set(false);
      }
    });
  }

  loadCategories(): void {
    this.tasksService.listCategoriesSimpleTasksCategoriesSimpleGet().subscribe({
      next: categories => {
        this.categories.set(categories);
      },
      error: () => {
        this.notificationService.error('Error loading categories');
      }
    });
  }

  loadTasks(): void {
    this.isLoadingData.set(true);
    const params: any = {
      page: this.pagination().pageIndex + 1,
      size: this.pagination().pageSize,
      sort: `${this.pagination().sortBy}:${this.pagination().sortOrder}`
    };

    if (this.selectedResidence()) {
      params.residence_id = this.selectedResidence();
    }

    if (this.selectedCategory()) {
      params.task_category_id = this.selectedCategory();
    }

    if (this.searchTerm()) {
      params.search = this.searchTerm();
    }

    this.tasksService.listTemplatesTasksTemplatesGet(params).subscribe({
      next: response => {
        const tasksWithDetails = response.items.map(task => {
          const category = this.categories().find(c => c.id === task['task_category_id']);
          const residence = this.residences().find(r => r.id === task['residence_id']);
          return {
            ...task,
            category_name: category?.name || 'Unknown',
            residence_name: residence?.name || 'Unknown'
          };
        });
        this.dataSource.data = tasksWithDetails as TaskWithDetails[];
        this.pagination.update(p => ({ ...p, total: response.total }));
        this.isLoadingData.set(false);
      },
      error: () => {
        this.notificationService.error('Error loading tasks');
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
      this.loadTasks();
    }, 300);
  }

  onResidenceChange(event: any): void {
    const residenceId = event.value;
    this.selectedResidence.set(residenceId);
    this.pagination.update(p => ({ ...p, pageIndex: 0 }));
    this.loadTasks();
  }

  onCategoryChange(event: any): void {
    const categoryId = event.value;
    this.selectedCategory.set(categoryId);
    this.pagination.update(p => ({ ...p, pageIndex: 0 }));
    this.loadTasks();
  }

  onPageChange(event: PageEvent): void {
    this.pagination.update(p => ({
      ...p,
      pageIndex: event.pageIndex,
      pageSize: event.pageSize
    }));
    this.loadTasks();
  }

  onSort(sort: Sort): void {
    this.pagination.update(p => ({
      ...p,
      sortBy: sort.active || 'created_at',
      sortOrder: sort.direction || 'desc',
      pageIndex: 0
    }));
    this.loadTasks();
  }

  openViewModal(task: TaskWithDetails): void {
    this.dialog.open(ViewTaskModal, {
      width: '600px',
      data: { task }
    });
  }

  openCreateModal(): void {
    const dialogRef = this.dialog.open(TaskFormModal, {
      width: '600px',
      data: {
        residences: this.residences(),
        categories: this.categories(),
        mode: 'create'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadTasks();
      }
    });
  }

  openEditModal(task: TaskWithDetails): void {
    const dialogRef = this.dialog.open(TaskFormModal, {
      width: '600px',
      data: {
        task,
        residences: this.residences(),
        categories: this.categories(),
        mode: 'edit'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadTasks();
      }
    });
  }

  openDeleteModal(task: TaskWithDetails): void {
    const dialogRef = this.dialog.open(DeleteTaskModal, {
      width: '400px',
      data: { task }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadTasks();
      }
    });
  }
}
