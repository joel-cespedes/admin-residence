import { Component, inject, Inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { ResidentWithDetails } from '../model/resident.model';

@Component({
  selector: 'app-delete-resident-modal',
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
  ],
  templateUrl: './delete-resident-modal.html',
  styleUrl: './delete-resident-modal.scss'
})
export class DeleteResidentModal {
  isLoading = signal(false);

  constructor(
    public dialogRef: MatDialogRef<DeleteResidentModal>,
    @Inject(MAT_DIALOG_DATA) public data: ResidentWithDetails
  ) {}

  onCancel() {
    this.dialogRef.close(false);
  }

  onDelete() {
    this.isLoading.set(true);
    this.dialogRef.close(true);
  }
}