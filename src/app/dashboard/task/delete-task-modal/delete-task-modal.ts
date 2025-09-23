import { Component, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogActions, MatDialogContent, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { TasksService } from '../../../../openapi/generated/services/tasks.service';
import { NotificationService } from '../../../shared/notification.service';
import { TaskWithDetails } from '../task';

export interface DeleteData {
  task: TaskWithDetails;
}

@Component({
  selector: 'app-delete-task-modal',
  imports: [MatDialogContent, MatDialogActions, MatButtonModule, MatProgressSpinnerModule, MatIconModule],
  templateUrl: './delete-task-modal.html',
  styleUrl: './delete-task-modal.scss'
})
export class DeleteTaskModal {
  protected readonly dialogRef = inject(MatDialogRef<DeleteTaskModal>);
  protected readonly data = inject(MAT_DIALOG_DATA);

  private readonly tasksService = inject(TasksService);
  private readonly notificationService = inject(NotificationService);

  readonly isLoading = signal(false);

  get task(): TaskWithDetails {
    return this.data.task;
  }

  onDelete(): void {
    this.isLoading.set(true);

    this.tasksService
      .deleteTemplateTasksTemplatesTemplateIdDelete({
        template_id: this.task.id
      })
      .subscribe({
        next: () => {
          this.notificationService.success('Task deleted successfully');
          this.dialogRef.close(true);
        },
        error: () => {
          this.notificationService.error('Error deleting task');
          this.isLoading.set(false);
        }
      });
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}
