import { Component, AfterViewInit, ViewChild, inject, OnInit } from '@angular/core';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { Header } from '../shared/header/header';
import { CommonModule, DatePipe } from '@angular/common';

import { ResidencesService } from '../../../openapi/generated/services/residences.service';
import { PaginatedResponse } from '../../../openapi/generated/models/paginated-response';
import { ResidenceWithContact } from './model/residence.model';
import { ViewResidenceModal } from './view-residence-modal/view-residence-modal';
import { ResidenceFormModal } from './residence-form-modal/residence-form-modal';
import { DeleteResidenceModal } from './delete-residence-modal/delete-residence-modal';
import { NotificationService } from '../../core/services/notification.service';

@Component({
  selector: 'app-residence',
  standalone: true,
  imports: [
    CommonModule,
    MatFormFieldModule,
    MatInputModule,
    MatTableModule,
    MatSortModule,
    MatPaginatorModule,
    Header,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatDialogModule,
    MatSnackBarModule,
    DatePipe
  ],
  templateUrl: './residence.html',
  styleUrl: './residence.scss'
})
export class Residence implements AfterViewInit, OnInit {
  displayedColumns: string[] = ['name', 'address', 'phone', 'email', 'created_at', 'actions'];
  dataSource: MatTableDataSource<ResidenceWithContact> = new MatTableDataSource<ResidenceWithContact>([]);

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  private residencesService = inject(ResidencesService);
  private dialog = inject(MatDialog);
  private notificationService = inject(NotificationService);

  ngOnInit() {
    this.loadResidences();
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  private loadResidences() {
    this.residencesService.listResidencesResidencesGet().subscribe({
      next: (response: PaginatedResponse) => {
        this.dataSource.data = response.items.map(
          (item: Record<string, any>) =>
            ({
              id: item['id'],
              name: item['name'],
              address: item['address'],
              phone: item['phone'] || 'No especificado',
              email: item['email'] || 'No especificado',
              created_at: item['created_at'] || new Date().toISOString(),
              updated_at: item['updated_at'] || null
            }) as ResidenceWithContact
        );
      },
      error: error => {
        this.notificationService.handleApiError(error, 'Error al cargar las residencias');
      }
    });
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  viewResidence(residence: ResidenceWithContact) {
    const dialogRef = this.dialog.open(ViewResidenceModal, {
      data: residence,
      width: '600px',
      maxWidth: '90vw'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadResidences();
      }
    });
  }

  editResidence(residence: ResidenceWithContact) {
    const dialogRef = this.dialog.open(ResidenceFormModal, {
      data: residence,
      width: '60%',
      maxWidth: '90vw'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadResidences();
      }
    });
  }

  deleteResidence(residence: ResidenceWithContact) {
    const dialogRef = this.dialog.open(DeleteResidenceModal, {
      data: residence,
      width: '50%',
      maxWidth: '90vw'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadResidences();
      }
    });
  }

  addResidence() {
    const dialogRef = this.dialog.open(ResidenceFormModal, {
      data: null,
      width: '60%',
      maxWidth: '90vw'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadResidences();
      }
    });
  }
}
