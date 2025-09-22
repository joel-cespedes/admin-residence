import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatCheckboxModule } from '@angular/material/checkbox';

import { ManagerWithDetails } from '../model/manager.model';

interface DeleteManagerModalData {
  manager: ManagerWithDetails;
}

@Component({
  selector: 'app-delete-manager-modal',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatCheckboxModule
  ],
  templateUrl: './delete-manager-modal.html',
  styleUrl: './delete-manager-modal.scss'
})
export class DeleteManagerModal {
  private dialogRef = inject(MatDialogRef<DeleteManagerModal>);
  data = inject(MAT_DIALOG_DATA);

  // Computed properties
  manager = this.data.manager;

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

  hasAssignedResidences = computed(() => {
    return this.manager.residence_count > 0 &&
           this.manager.residence_names &&
           this.manager.residence_names.length > 0;
  });

  warningMessage = computed(() => {
    if (this.hasAssignedResidences()) {
      return `Este gestor está asignado a ${this.manager.residence_count} residencia(s). Al eliminarlo, perderá el acceso a todas las residencias asignadas.`;
    }

    return 'Esta acción no se puede deshacer. El gestor será eliminado permanentemente del sistema.';
  });

  shouldShowAdditionalWarning = computed(() => {
    return this.manager.status === 'active' && this.hasAssignedResidences();
  });

  close() {
    this.dialogRef.close(false);
  }

  confirm() {
    this.dialogRef.close(true);
  }
}