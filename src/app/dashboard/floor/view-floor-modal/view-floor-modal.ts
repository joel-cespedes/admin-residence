import { CommonModule, DatePipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'app-view-floor-modal',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatCardModule,
    MatDividerModule,
    DatePipe
  ],
  templateUrl: './view-floor-modal.html',
  styleUrl: './view-floor-modal.scss'
})
export class ViewFloorModal {
  private dialogRef = inject(MatDialogRef<ViewFloorModal>);
  data = inject(MAT_DIALOG_DATA);

  onClose(): void {
    this.dialogRef.close();
  }
}
