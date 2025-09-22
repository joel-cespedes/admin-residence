import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';

import { ManagerWithDetails } from '../model/manager.model';
import { DateFormatPipe } from '../../../shared/pipes/date-format-pipe';

interface ViewManagerModalData {
  manager: ManagerWithDetails;
}

@Component({
  selector: 'app-view-manager-modal',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    DateFormatPipe
  ],
  templateUrl: './view-manager-modal.html',
  styleUrl: './view-manager-modal.scss'
})
export class ViewManagerModal {
  private dialogRef = inject(MatDialogRef<ViewManagerModal>);
  data = inject(MAT_DIALOG_DATA);

  // Computed properties
  manager = this.data.manager;

  statusClass = computed(() => {
    switch (this.manager.status) {
      case 'active':
        return 'status-active';
      case 'inactive':
        return 'status-inactive';
      case 'suspended':
        return 'status-suspended';
      default:
        return '';
    }
  });

  statusText = computed(() => {
    switch (this.manager.status) {
      case 'active':
        return 'Activo';
      case 'inactive':
        return 'Inactivo';
      case 'suspended':
        return 'Suspendido';
      default:
        return 'Desconocido';
    }
  });

  roleText = computed(() => {
    switch (this.manager.role) {
      case 'manager':
        return 'Gestor';
      case 'admin':
        return 'Administrador';
      default:
        return 'Desconocido';
    }
  });

  close() {
    this.dialogRef.close();
  }
}