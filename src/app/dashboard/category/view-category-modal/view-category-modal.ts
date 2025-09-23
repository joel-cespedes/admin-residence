import { CommonModule, DatePipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogActions, MatDialogContent, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';

import { CategoryWithDetails } from '../category';

export interface ViewData {
  category: CategoryWithDetails;
}

@Component({
  selector: 'app-view-category-modal',
  imports: [CommonModule, MatDialogContent, MatDialogActions, MatButtonModule, MatIconModule, DatePipe],
  templateUrl: './view-category-modal.html',
  styleUrl: './view-category-modal.scss'
})
export class ViewCategoryModal {
  protected readonly dialogRef = inject(MatDialogRef<ViewCategoryModal>);
  protected readonly data = inject(MAT_DIALOG_DATA);

  get category(): CategoryWithDetails {
    return this.data.category;
  }

  onClose(): void {
    this.dialogRef.close();
  }
}
