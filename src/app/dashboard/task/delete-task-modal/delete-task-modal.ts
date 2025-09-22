import { Component, inject, signal } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogTitle, MatDialogContent, MatDialogActions, MatDialogClose } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';

import { TasksService } from '../../../../openapi/generated/services/tasks.service';
import { NotificationService } from '../../../shared/notification.service';
import { TaskWithDetails } from '../task';

export interface DeleteData {
  task: TaskWithDetails;
}

@Component({
  selector: 'app-delete-task-modal',
  standalone: true,
  imports: [
    MatDialogTitle,
    MatDialogContent,
    MatDialogActions,
    MatDialogClose,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatIconModule
  ],
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

    this.tasksService.deleteTemplateTasksTemplatesTemplateIdDelete({
      template_id: this.task.id
    }).subscribe({
      next: () => {
        this.notificationService.success('Task deleted successfully');
        this.dialogRef.close(true);
      },
      error: (error) => {
        this.notificationService.error('Error deleting task');
        this.isLoading.set(false);
      }
    });
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}