import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';

import { NotificationService } from '@core';
import { firstValueFrom } from 'rxjs';
import { StructureService } from '../../../../openapi/generated/services/structure.service';
import { RoomWithDetails } from '../model/room.model';

@Component({
  selector: 'app-delete-room-modal',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatCardModule,
    MatDividerModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './delete-room-modal.html',
  styleUrl: './delete-room-modal.scss'
})
export class DeleteRoomModal {
  isDeleting = signal(false);

  private structureService = inject(StructureService);
  private notificationService = inject(NotificationService);
  private dialogRef = inject(MatDialogRef<DeleteRoomModal>);
  data = inject(MAT_DIALOG_DATA) as RoomWithDetails;

  async onDelete(): Promise<void> {
    if (this.isDeleting()) return;

    this.isDeleting.set(true);

    try {
      await firstValueFrom(
        this.structureService.deleteRoomStructureRoomsIdDelete({
          id: this.data.id
        })
      );

      this.notificationService.success('Habitación eliminada exitosamente');
      this.dialogRef.close(true);
    } catch (error: unknown) {
      this.notificationService.handleApiError(error, 'Error al eliminar la habitación');
    } finally {
      this.isDeleting.set(false);
    }
  }

  onClose(): void {
    this.dialogRef.close();
  }
}
