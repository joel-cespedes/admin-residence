import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';

import { ResidenceWithContact } from '../model/residence.model';
import { ResidencesService } from '../../../../openapi/generated/services/residences.service';

@Component({
  selector: 'app-delete-residence-modal',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule
  ],
  templateUrl: './delete-residence-modal.html',
  styleUrl: './delete-residence-modal.scss'
})
export class DeleteResidenceModal {
  isLoading: boolean = false;

  constructor(
    public dialogRef: MatDialogRef<DeleteResidenceModal>,
    @Inject(MAT_DIALOG_DATA) public data: ResidenceWithContact,
    private residencesService: ResidencesService
  ) {}

  onDelete(): void {
    this.isLoading = true;
    this.residencesService.deleteResidenceResidencesIdDelete({ id: this.data.id }).subscribe({
      next: () => {
        this.dialogRef.close(true);
      },
      error: (error) => {
        console.error('Error deleting residence:', error);
        this.isLoading = false;
      }
    });
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}