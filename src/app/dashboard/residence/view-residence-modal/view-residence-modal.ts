import { Component, inject, Inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';

import { ResidenceWithContact } from '../model/residence.model';

@Component({
  selector: 'app-view-residence-modal',
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
  templateUrl: './view-residence-modal.html',
  styleUrl: './view-residence-modal.scss'
})
export class ViewResidenceModal {
  constructor(
    public dialogRef: MatDialogRef<ViewResidenceModal>,
    @Inject(MAT_DIALOG_DATA) public data: ResidenceWithContact
  ) {}

  onClose(): void {
    this.dialogRef.close();
  }
}
