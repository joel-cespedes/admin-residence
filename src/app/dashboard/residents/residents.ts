import { Component, OnInit, ViewChild, AfterViewInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Header } from '../shared/header/header';

// Angular Material v20 imports
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

// API Services
import { ResidentsService } from '../../../openapi/generated/services/residents.service';
import { ResidentOut } from '../../../openapi/generated/models/resident-out';
import { PaginatedResponse } from '../../../openapi/generated/models/paginated-response';

@Component({
  selector: 'app-residents',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    Header,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatTooltipModule,
    MatPaginatorModule,
    MatSortModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule
  ],
  templateUrl: './residents.html',
  styleUrl: './residents.scss'
})
export class Residents implements OnInit, AfterViewInit {
  displayedColumns: string[] = ['fullName', 'birthDate', 'status', 'residence', 'actions'];

  dataSource: MatTableDataSource<ResidentOut> = new MatTableDataSource<ResidentOut>([]);

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  private residentsService = inject(ResidentsService);
  private dialog = inject(MatDialog);

  ngOnInit() {
    this.loadResidents();
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  private loadResidents() {
    this.residentsService.listResidentsResidentsGet().subscribe({
      next: (response: PaginatedResponse) => {
        this.dataSource.data = response.items as ResidentOut[];
      },
      error: error => {
        console.error('Error loading residents:', error);
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

  getAge(birthDate: string): number {
    const birth = new Date(birthDate);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }

    return age;
  }

  getGenderText(gender?: string | null): string {
    if (!gender) return 'No especificado';
    return gender.toLowerCase() === 'm' ? 'Masculino' : gender.toLowerCase() === 'f' ? 'Femenino' : gender;
  }

  getStatusText(status: string): string {
    const statusMap = {
      active: 'Activo',
      discharged: 'Dado de alta',
      deceased: 'Fallecido'
    };
    return statusMap[status as keyof typeof statusMap] || status;
  }

  viewResident(resident: ResidentOut) {
    console.log('Ver residente:', resident);
  }

  editResident(resident: ResidentOut) {
    console.log('Editar residente:', resident);
  }

  deleteResident(resident: ResidentOut) {
    console.log('Eliminar residente:', resident);
  }

  addResident() {
    console.log('Añadir residente');
  }
}
