import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBarModule } from '@angular/material/snack-bar';

import { ResidencesService } from '../../../../openapi/generated/services/residences.service';
import { ResidenceWithContact } from '../model/residence.model';
import { NotificationService } from '../../../shared/notification.service';

@Component({
  selector: 'app-delete-residence-modal',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule, MatTooltipModule, MatSnackBarModule],
  templateUrl: './delete-residence-modal.html',
  styleUrl: './delete-residence-modal.scss'
})
export class DeleteResidenceModal {
  isLoading = signal(false);

  private residencesService = inject(ResidencesService);
  private dialogRef = inject(MatDialogRef<DeleteResidenceModal>);
  private notificationService = inject(NotificationService);
  data: ResidenceWithContact = inject(MAT_DIALOG_DATA);

  onDelete(): void {
    console.log('Eliminar residencia:', this.data);
    this.isLoading.set(true);
    this.residencesService.deleteResidenceResidencesIdDelete({ id: this.data.id }).subscribe({
      next: () => {
        this.notificationService.success('Residencia eliminada correctamente');
        this.dialogRef.close(true);
      },
      error: (error: any) => {
        this.notificationService.handleApiError(error, 'Error al eliminar la residencia');
        this.isLoading.set(false);
      }
    });
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}
