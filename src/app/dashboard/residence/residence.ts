import { Component, inject, input, computed } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { DatePipe } from '@angular/common';

import { BaseEntityComponent, ResidenceWithContact, EntityType } from '../../shared/base-entity.component';
import { Header } from '../shared/header/header';
import { ResidencesService } from '../../../openapi/generated/services/residences.service';
import { ResidenceFormData } from './model/residence.model';
import { DeleteResidenceModal } from './delete-residence-modal/delete-residence-modal';
import { ResidenceFormModal } from './residence-form-modal/residence-form-modal';
import { ViewResidenceModal } from './view-residence-modal/view-residence-modal';
import { MatPaginatorModule } from '@angular/material/paginator';
import { PermissionsService } from '../../shared/permissions.service';

@Component({
  selector: 'app-residence',
  imports: [
    MatTableModule,
    MatPaginatorModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    MatFormFieldModule,
    MatInputModule,
    DatePipe,
    Header
  ],
  templateUrl: './residence.html',
  styleUrl: './residence.scss'
})
export class Residence extends BaseEntityComponent<ResidenceWithContact> {
  private readonly permissionsService = inject(PermissionsService);

  // Override los inputs del componente base
  override entityType = input<EntityType>('residences');

  // Role-based permissions
  readonly permissions = this.permissionsService.residencePermissions;
  readonly canCreate = computed(() => this.permissions().canCreate);
  readonly canEdit = computed(() => this.permissions().canEdit);
  readonly canDelete = computed(() => this.permissions().canDelete);
  override displayedColumns = input<string[]>(['name', 'address', 'phone', 'email', 'created_at', 'actions']);
  override title = input<string>('Residencias');

  protected override dialog = inject(MatDialog);
  protected override residencesService = inject(ResidencesService);

  // Implementar el método abstracto loadData
  protected override loadData(): void {
    this.isLoadingData.set(true);

    const params = this.getFilterParams();
    console.log('Loading residences with params:', params);

    this.residencesService.listResidencesResidencesGet(params).subscribe({
      next: (response: any) => {
        this.dataSource.data = (response.items || []).map((item: any) => ({
          id: item.id,
          name: item.name,
          address: item.address,
          phone: item.phone || 'No especificado',
          email: item.email || 'No especificado',
          created_at: item.created_at || new Date().toISOString(),
          updated_at: item.updated_at || null
        })) as ResidenceWithContact[];

        this.pagination.update(pag => ({ ...pag, total: response.total || 0 }));
        this.isLoadingData.set(false);
      },
      error: (error: any) => {
        this.notificationService.handleApiError(error, 'Error al cargar las residencias');
        this.isLoadingData.set(false);
      }
    });
  }

  // CRUD Operations
  viewResidence(residence: ResidenceWithContact) {
    const dialogRef = this.dialog.open(ViewResidenceModal, {
      data: residence,
      width: '600px',
      maxWidth: '90vw'
    });

    dialogRef.afterClosed().subscribe(() => {
      this.loadData();
    });
  }

  editResidence(residence: ResidenceWithContact) {
    const dialogRef = this.dialog.open(ResidenceFormModal, {
      data: { residence },
      width: '60%',
      maxWidth: '90vw'
    });

    dialogRef.afterClosed().subscribe((result: ResidenceFormData | null) => {
      if (result) {
        this.residencesService
          .updateResidenceResidencesIdPut({
            id: residence.id,
            body: result
          })
          .subscribe({
            next: () => {
              this.notificationService.success('Residencia actualizada exitosamente');
              this.loadData();
            },
            error: (error: any) => {
              this.notificationService.handleApiError(error, 'Error al actualizar la residencia');
            }
          });
      }
    });
  }

  deleteResidence(residence: ResidenceWithContact) {
    const dialogRef = this.dialog.open(DeleteResidenceModal, {
      data: residence,
      width: '50%',
      maxWidth: '90vw'
    });

    dialogRef.afterClosed().subscribe((confirmed: boolean) => {
      if (confirmed) {
        this.residencesService.deleteResidenceResidencesIdDelete({ id: residence.id }).subscribe({
          next: () => {
            this.notificationService.success('Residencia eliminada exitosamente');
            this.loadData();
          },
          error: (error: any) => {
            this.notificationService.handleApiError(error, 'Error al eliminar la residencia');
          }
        });
      }
    });
  }

  addResidence() {
    const dialogRef = this.dialog.open(ResidenceFormModal, {
      data: { residences: this.residences() },
      width: '60%',
      maxWidth: '90vw'
    });

    dialogRef.afterClosed().subscribe((result: ResidenceFormData | null) => {
      if (result) {
        this.residencesService
          .createResidenceResidencesPost({
            body: result
          })
          .subscribe({
            next: () => {
              this.notificationService.success('Residencia creada exitosamente');
              this.loadData();
            },
            error: (error: any) => {
              this.notificationService.handleApiError(error, 'Error al crear la residencia');
            }
          });
      }
    });
  }
}
