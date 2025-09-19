import { Component, inject, Inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ResidentWithDetails } from '../model/resident.model';

@Component({
  selector: 'app-view-resident-modal',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    DatePipe
  ],
  templateUrl: './view-resident-modal.html',
  styleUrl: './view-resident-modal.scss'
})
export class ViewResidentModal {
  constructor(
    public dialogRef: MatDialogRef<ViewResidentModal>,
    @Inject(MAT_DIALOG_DATA) public data: ResidentWithDetails
  ) {}

  onClose() {
    this.dialogRef.close();
  }
}