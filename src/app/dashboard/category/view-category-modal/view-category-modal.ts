import { Component, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogTitle, MatDialogContent, MatDialogActions, MatDialogClose } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule, DatePipe } from '@angular/common';

import { CategoryWithDetails } from '../category';
import { ResidenceOut } from '../../../../openapi/generated/models/residence-out';

export interface ViewData {
  category: CategoryWithDetails;
}

@Component({
  selector: 'app-view-category-modal',
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