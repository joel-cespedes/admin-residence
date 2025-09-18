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
import { Header } from '../shared/header/header';
import { CommonModule, DatePipe } from '@angular/common';

// API Services
import { ResidencesService } from '../../../openapi/generated/services/residences.service';
import { ResidenceOut } from '../../../openapi/generated/models/residence-out';
import { PaginatedResponse } from '../../../openapi/generated/models/paginated-response';

interface ResidenceWithContact extends ResidenceOut {
  phone?: string;
  email?: string;
  created_at: string;
}

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
              created_at: item['created_at'] || new Date().toISOString()
            }) as ResidenceWithContact
        );
      },
      error: error => {
        console.error('Error loading residences:', error);
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
    console.log('Ver residencia:', residence);
  }

  editResidence(residence: ResidenceWithContact) {
    console.log('Editar residencia:', residence);
  }

  deleteResidence(residence: ResidenceWithContact) {
    console.log('Eliminar residencia:', residence);
  }

  addResidence() {
    console.log('Añadir residencia');
  }
}
