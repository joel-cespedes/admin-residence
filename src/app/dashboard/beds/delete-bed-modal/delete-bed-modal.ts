import { Component, inject, Inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { BedWithDetails } from '../model/bed.model';

@Component({
  selector: 'app-delete-bed-modal',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
  ],
  templateUrl: './delete-bed-modal.html',
  styleUrl: './delete-bed-modal.scss'
})
export class DeleteBedModal {
  isLoading = signal(false);

  constructor(
    public dialogRef: MatDialogRef<DeleteBedModal>,
    @Inject(MAT_DIALOG_DATA) public data: BedWithDetails
  ) {}

  onCancel() {
    this.dialogRef.close(false);
  }

  onDelete() {
    this.isLoading.set(true);
    this.dialogRef.close(true);
  }
}