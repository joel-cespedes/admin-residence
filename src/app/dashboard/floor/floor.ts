import { Component, AfterViewInit, ViewChild, inject, OnInit, signal } from '@angular/core';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CommonModule, DatePipe } from '@angular/common';

import { Header } from '../shared/header/header';
import { ResidencesService } from '../../../openapi/generated/services/residences.service';
import { StructureService } from '../../../openapi/generated/services/structure.service';
import { ResidenceWithContact } from '../residence/model/residence.model';
import { FloorWithDetails } from './model/floor.model';
import { ViewFloorModal } from './view-floor-modal/view-floor-modal';
import { FloorFormModal } from './floor-form-modal/floor-form-modal';
import { DeleteFloorModal } from './delete-floor-modal/delete-floor-modal';
import { NotificationService } from '../../core/services/notification.service';

@Component({
  selector: 'app-floor',
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
    MatButtonToggleModule,
    MatProgressSpinnerModule,
    DatePipe
  ],
  templateUrl: './floor.html',
  styleUrl: './floor.scss'
})
export class Floor implements AfterViewInit, OnInit {
  displayedColumns: string[] = ['name', 'residence_name', 'created_at', 'actions'];
  dataSource: MatTableDataSource<FloorWithDetails> = new MatTableDataSource<FloorWithDetails>([]);

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  private residencesService = inject(ResidencesService);
  private structureService = inject(StructureService);
  private dialog = inject(MatDialog);
  private notificationService = inject(NotificationService);

  residences = signal<ResidenceWithContact[]>([]);
  selectedResidenceId = signal<string>('');
  isLoadingResidences = signal(false);
  isLoadingFloors = signal(false);

  ngOnInit() {
    this.loadResidences();
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  private loadResidences() {
    this.isLoadingResidences.set(true);
    this.residencesService.listResidencesResidencesGet().subscribe({
      next: (response: any) => {
        this.residences.set(response.items || []);
        this.isLoadingResidences.set(false);

        // Auto-select first residence if available
        if (this.residences().length > 0 && !this.selectedResidenceId()) {
          this.selectedResidenceId.set(this.residences()[0].id);
          this.loadFloors();
        }
      },
      error: error => {
        this.notificationService.handleApiError(error, 'Error al cargar las residencias');
        this.isLoadingResidences.set(false);
      }
    });
  }

  private loadFloors() {
    if (!this.selectedResidenceId()) return;

    this.isLoadingFloors.set(true);
    this.structureService.floorsSimpleStructureFloorsResidenceIdSimpleGet({ residence_id: this.selectedResidenceId() }).subscribe({
      next: (response: any) => {
        this.dataSource.data = (response || []).map(
          (item: any) =>
            ({
              id: item['id'],
              name: item['name'],
              residence_id: item['residence_id'],
              residence_name: this.residences().find(r => r.id === item['residence_id'])?.name || 'Desconocida',
              created_at: item['created_at'] || new Date().toISOString(),
              updated_at: item['updated_at'] || null
            }) as FloorWithDetails
        );
        this.isLoadingFloors.set(false);
      },
      error: error => {
        this.notificationService.handleApiError(error, 'Error al cargar los pisos');
        this.isLoadingFloors.set(false);
      }
    });
  }

  onResidenceChange(residenceId: string) {
    this.selectedResidenceId.set(residenceId);
    this.loadFloors();
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  viewFloor(floor: FloorWithDetails) {
    const dialogRef = this.dialog.open(ViewFloorModal, {
      data: floor,
      width: '600px',
      maxWidth: '90vw'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadFloors();
      }
    });
  }

  editFloor(floor: FloorWithDetails) {
    const dialogRef = this.dialog.open(FloorFormModal, {
      data: floor,
      width: '60%',
      maxWidth: '90vw'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadFloors();
      }
    });
  }

  deleteFloor(floor: FloorWithDetails) {
    const dialogRef = this.dialog.open(DeleteFloorModal, {
      data: floor,
      width: '50%',
      maxWidth: '90vw'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadFloors();
      }
    });
  }

  addFloor() {
    if (!this.selectedResidenceId()) {
      this.notificationService.warning('Debes seleccionar una residencia para agregar pisos');
      return;
    }

    const dialogRef = this.dialog.open(FloorFormModal, {
      data: { residence_id: this.selectedResidenceId() },
      width: '60%',
      maxWidth: '90vw'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadFloors();
      }
    });
  }
}