import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBarModule } from '@angular/material/snack-bar';

import { StructureService } from '../../../../openapi/generated/services/structure.service';
import { FloorWithDetails } from '../model/floor.model';
import { NotificationService } from '../../../shared/notification.service';

@Component({
  selector: 'app-delete-floor-modal',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule, MatTooltipModule, MatSnackBarModule],
  templateUrl: './delete-floor-modal.html',
  styleUrl: './delete-floor-modal.scss'
})
export class DeleteFloorModal {
  isLoading = signal(false);

  private structureService = inject(StructureService);
  private dialogRef = inject(MatDialogRef<DeleteFloorModal>);
  private notificationService = inject(NotificationService);
  data: FloorWithDetails = inject(MAT_DIALOG_DATA);

  onDelete(): void {
    if (this.isLoading()) {
      return;
    }
    this.isLoading.set(true);
    this.structureService
      .deleteFloorStructureFloorsIdDelete({ id: this.data.id, residence_id: this.data.residence_id })
      .subscribe({
      next: () => {
        this.notificationService.success('Piso eliminado correctamente');
        this.dialogRef.close(true);
      },
      error: (error: any) => {
        this.notificationService.handleApiError(error, 'Error al eliminar el piso');
        this.isLoading.set(false);
      }
    });
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}