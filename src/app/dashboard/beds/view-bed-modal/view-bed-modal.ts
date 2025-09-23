import { Component, inject, Inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { BedWithDetails } from '../model/bed.model';

@Component({
  selector: 'app-view-bed-modal',
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    DatePipe
  ],
  templateUrl: './view-bed-modal.html',
  styleUrl: './view-bed-modal.scss'
})
export class ViewBedModal {
  constructor(
    public dialogRef: MatDialogRef<ViewBedModal>,
    @Inject(MAT_DIALOG_DATA) public data: BedWithDetails
  ) {}

  onClose() {
    this.dialogRef.close();
  }
}