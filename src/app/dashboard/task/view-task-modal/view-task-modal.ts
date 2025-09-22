import { Component, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogTitle, MatDialogContent, MatDialogActions, MatDialogClose } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule, DatePipe } from '@angular/common';

import { TaskWithDetails } from '../task';

export interface ViewData {
  task: TaskWithDetails;
}

@Component({
  selector: 'app-view-task-modal',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogTitle,
    MatDialogContent,
    MatDialogActions,
    MatDialogClose,
    MatButtonModule,
    MatIconModule,
    DatePipe
  ],
  templateUrl: './view-task-modal.html',
  styleUrl: './view-task-modal.scss'
})
export class ViewTaskModal {
  protected readonly dialogRef = inject(MatDialogRef<ViewTaskModal>);
  protected readonly data = inject(MAT_DIALOG_DATA);

  get task(): TaskWithDetails {
    return this.data.task;
  }

  onClose(): void {
    this.dialogRef.close();
  }
}