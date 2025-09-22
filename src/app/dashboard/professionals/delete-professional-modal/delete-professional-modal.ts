import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatCardModule } from '@angular/material/card';

import { UsersService } from '../../../../openapi/generated/services/users.service';
import { NotificationService } from '../../../shared/notification.service';

interface ProfessionalWithDetails {
  id: string;
  alias: string;
  name: string;
  role: 'superadmin' | 'manager' | 'professional';
  created_at: string;
  residences: { id: string; name?: string }[];
  residence_names: string[];
  residence_count: number;
}

@Component({
  selector: 'app-delete-professional-modal',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule, MatTooltipModule, MatSnackBarModule, MatCardModule],
  templateUrl: './delete-professional-modal.html',
  styleUrl: '../../floor/delete-floor-modal/delete-floor-modal.scss'
})
export class DeleteProfessionalModal {
  isLoading = signal(false);

  private usersService = inject(UsersService);
  private dialogRef = inject(MatDialogRef<DeleteProfessionalModal>);
  private notificationService = inject(NotificationService);
  data: { professional: ProfessionalWithDetails } = inject(MAT_DIALOG_DATA);

  onDelete(): void {
    if (this.isLoading()) {
      return;
    }
    this.isLoading.set(true);

    this.usersService.deleteUserUsersUserIdDelete({ user_id: this.data.professional.id }).subscribe({
      next: () => {
        this.notificationService.success('Profesional eliminado correctamente');
        this.dialogRef.close(true); // Cerrar con true para indicar que se eliminó
      },
      error: (error: any) => {
        this.notificationService.handleApiError(error, 'Error al eliminar profesional');
        this.isLoading.set(false);
        this.dialogRef.close(false); // Cerrar con false para indicar error
      }
    });
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }
}
