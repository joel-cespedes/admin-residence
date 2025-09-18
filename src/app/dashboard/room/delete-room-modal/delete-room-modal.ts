import { Component, inject, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';

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
    MatDividerModule
  ],
  templateUrl: './delete-room-modal.html',
  styleUrl: './delete-room-modal.scss'
})
export class DeleteRoomModal {
  constructor(
    public dialogRef: MatDialogRef<DeleteRoomModal>,
    @Inject(MAT_DIALOG_DATA) public data: RoomWithDetails
  ) {}

  onDelete(): void {
    this.dialogRef.close(true);
  }

  onClose(): void {
    this.dialogRef.close();
  }
}