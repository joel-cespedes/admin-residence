import { Component, inject, Inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';

import { RoomWithDetails } from '../model/room.model';

@Component({
  selector: 'app-view-room-modal',
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
  templateUrl: './view-room-modal.html',
  styleUrl: './view-room-modal.scss'
})
export class ViewRoomModal {
  constructor(
    public dialogRef: MatDialogRef<ViewRoomModal>,
    @Inject(MAT_DIALOG_DATA) public data: RoomWithDetails
  ) {}

  onClose(): void {
    this.dialogRef.close();
  }
}