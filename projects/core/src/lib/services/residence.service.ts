// projects/core/src/lib/services/residence.service.ts
import { Injectable, signal, computed, inject, linkedSignal, effect } from '@angular/core';
import { Observable, of, catchError, tap } from 'rxjs';
import { ResidencesService } from '../../../../../src/openapi/generated/services/residences.service';
import { AuthService } from './auth.service';
import { StorageService } from './storage.service';

export interface Residence {
  id: string;
  name: string;
  address: string;
  created_at: string;
  updated_at: string;
}

export interface ResidenceState {
  residences: Residence[];
  selectedResidenceId: string | null;
  selectedResidence: Residence | null;
  isLoading: boolean;
  error: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class ResidenceService {
  private readonly apiResidences = inject(ResidencesService);
  private readonly authService = inject(AuthService);
  private readonly storageService = inject(StorageService);

  // Estado principal
  private readonly _state = signal<ResidenceState>({
    residences: [],
    selectedResidenceId: this.storageService.selectedResidenceId(),
    selectedResidence: null,
    isLoading: false,
    error: null
  });

  // Computed signals
  readonly state = this._state.asReadonly();
  readonly residences = computed(() => this._state().residences);
  readonly selectedResidenceId = computed(() => this._state().selectedResidenceId);
  readonly selectedResidence = computed(() => this._state().selectedResidence);
  readonly isLoading = computed(() => this._state().isLoading);
  readonly error = computed(() => this._state().error);
  readonly hasMultipleResidences = computed(() => this.residences().length > 1);
  readonly needsResidenceSelection = computed(
    () => !this.authService.isSuperAdmin() && this.hasMultipleResidences() && !this.selectedResidenceId()
  );

  // LinkedSignal para la residencia seleccionada
  private readonly _selectedResidenceDetails = linkedSignal(() => {
    const residenceId = this.selectedResidenceId();
    const residences = this.residences();

    if (!residenceId || !residences.length) return null;

    return (residences as Residence[]).find(r => r.id === residenceId) || null;
  });

  readonly selectedResidenceDetails = this._selectedResidenceDetails.asReadonly();

  constructor() {
    // Auto-cargar residencias cuando el usuario se autentica
    effect(() => {
      if (this.authService.isAuthenticated()) {
        this.loadUserResidences().subscribe();
      }
    });
  }

  loadUserResidences(): Observable<Residence[]> {
    this.setLoading(true);
    this.clearError();

    return this.apiResidences.myResidencesResidencesMineGet().pipe(
      tap((residences: any[]) => {
        this._state.update(state => ({
          ...state,
          residences: residences,
          isLoading: false
        }));

        // Auto-seleccionar si solo hay una residencia
        if ((residences as Residence[]).length === 1 && !this.selectedResidenceId()) {
          this.selectResidence((residences as Residence[])[0].id);
        }
      }),
      catchError(() => {
        this.setError('Error cargando residencias');
        return of([]);
      })
    );
  }

  selectResidence(residenceId: string): void {
    const residence = (this.residences() as Residence[]).find(r => r.id === residenceId);

    if (residence) {
      this._state.update(state => ({
        ...state,
        selectedResidenceId: residenceId,
        selectedResidence: residence
      }));

      this.storageService.setSelectedResidenceId(residenceId);
    }
  }

  clearSelection(): void {
    this._state.update(state => ({
      ...state,
      selectedResidenceId: null,
      selectedResidence: null
    }));

    this.storageService.setSelectedResidenceId(null);
  }

  getResidenceById(id: string): Observable<Residence> {
    return this.apiResidences.getResidenceResidencesIdGet({ id }) as Observable<Residence>;
  }

  private setLoading(isLoading: boolean): void {
    this._state.update(state => ({ ...state, isLoading }));
  }

  private setError(error: string): void {
    this._state.update(state => ({ ...state, error, isLoading: false }));
  }

  private clearError(): void {
    this._state.update(state => ({ ...state, error: null }));
  }
}
