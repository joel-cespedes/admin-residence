import { Component, inject, signal } from '@angular/core';
import {
  MAT_DIALOG_DATA,
  MatDialogRef,
  MatDialogTitle,
  MatDialogContent,
  MatDialogActions,
  MatDialogClose
} from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';

import { TasksService } from '../../../../openapi/generated/services/tasks.service';
import { NotificationService } from '../../../shared/notification.service';
import { CategoryWithDetails } from '../category';

export interface DeleteData {
  category: CategoryWithDetails;
}

@Component({
  selector: 'app-delete-category-modal',
  imports: [MatDialogContent, MatDialogActions, MatButtonModule, MatProgressSpinnerModule, MatIconModule],
  templateUrl: './delete-category-modal.html',
  styleUrl: './delete-category-modal.scss'
})
export class DeleteCategoryModal {
  protected readonly dialogRef = inject(MatDialogRef<DeleteCategoryModal>);
  protected readonly data = inject(MAT_DIALOG_DATA);

  private readonly tasksService = inject(TasksService);
  private readonly notificationService = inject(NotificationService);

  readonly isLoading = signal(false);

  get category(): CategoryWithDetails {
    return this.data.category;
  }

  onDelete(): void {
    this.isLoading.set(true);

    this.tasksService
      .deleteCategoryTasksCategoriesCategoryIdDelete({
        category_id: this.category.id
      })
      .subscribe({
        next: () => {
          this.notificationService.success('Category deleted successfully');
          this.dialogRef.close(true);
        },
        error: () => {
          this.notificationService.error('Error deleting category');
          this.isLoading.set(false);
        }
      });
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}
