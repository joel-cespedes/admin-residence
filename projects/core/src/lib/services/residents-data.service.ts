// projects/core/src/lib/services/residents-data.service.ts
import { Injectable, inject, computed } from '@angular/core';
import { Observable } from 'rxjs';
import { tap, map } from 'rxjs/operators';
import { BaseCrudService } from './base-crud.service';
import { ResidentsService } from '../../../../../src/openapi/generated/services/residents.service';
import { ResidentOut, ResidentCreate, ResidentChangeBed } from '../../../../../src/openapi/generated/models';

@Injectable({
  providedIn: 'root'
})
export class ResidentsDataService extends BaseCrudService<ResidentOut> {
  private readonly apiService = inject(ResidentsService);

  getAll(): Observable<ResidentOut[]> {
    return this.apiService.listResidentsResidentsGet().pipe(
      map(response => response.items as ResidentOut[]),
      tap(items => this._state.update(state => ({ ...state, items })))
    );
  }

  getById(id: string): Observable<ResidentOut> {
    // Nota: no hay endpoint específico para obtener un residente por ID en la API generada
    // Implementar cuando esté disponible
    throw new Error('Method not implemented');
  }

  create(item: ResidentCreate): Observable<ResidentOut> {
    return this.apiService.createResidentResidentsPost({ body: item });
  }

  update(id: string, item: Partial<ResidentOut>): Observable<ResidentOut> {
    // Nota: no hay endpoint de update en la API generada
    // Implementar cuando esté disponible
    throw new Error('Method not implemented');
  }

  delete(id: string): Observable<void> {
    // Nota: no hay endpoint de delete en la API generada
    // Implementar cuando esté disponible
    throw new Error('Method not implemented');
  }

  // Métodos específicos para residentes
  readonly activeResidents = computed(() => this.items().filter((r) => r.status === 'active'));

  readonly residentsByStatus = computed(() => {
    const items = this.items();
    return {
      active: items.filter((r) => r.status === 'active'),
      discharged: items.filter((r) => r.status === 'discharged'),
      deceased: items.filter((r) => r.status === 'deceased')
    };
  });

  changeBed(residentId: string, newBedId: string): Observable<ResidentOut> {
    const bedChange: ResidentChangeBed = {
      new_bed_id: newBedId
    };

    return this.apiService
      .changeBedResidentsResidentIdBedPatch({
        resident_id: residentId,
        body: bedChange
      })
      .pipe(
        tap((updatedResident) => {
          this._state.update((state) => ({
            ...state,
            items: state.items.map((r) => (r.id === residentId ? updatedResident : r))
          }));
        })
      );
  }
}
