import { CommonModule, DatePipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ResidentWithDetails } from '../model/resident.model';
import { AgePipe } from '@core';

@Component({
  selector: 'app-view-resident-modal',
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule, MatTooltipModule, DatePipe, AgePipe],
  templateUrl: './view-resident-modal.html',
  styleUrl: './view-resident-modal.scss'
})
export class ViewResidentModal {
  private dialogRef = inject(MatDialogRef<ViewResidentModal>);
  data = inject(MAT_DIALOG_DATA) as ResidentWithDetails;

  onClose() {
    this.dialogRef.close();
  }
}
