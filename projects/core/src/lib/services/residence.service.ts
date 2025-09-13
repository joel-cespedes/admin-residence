// projects/core/src/lib/services/residence.service.ts
import { Injectable, signal, computed, inject, linkedSignal } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { Observable, switchMap, of, catchError, tap } from 'rxjs';
import { ResidencesService } from '../../../../../src/openapi/generated/services/residences.service';
import { AuthService } from './auth.service';

export interface ResidenceState {
  residences: any[];
  selectedResidenceId: string | null;
  selectedResidence: any | null;
  isLoading: boolean;
  error: string | null;
}

@Injectable({
  providedIn: 'root',
})
export class ResidenceService {
  private readonly apiResidences = inject(ResidencesService);
  private readonly authService = inject(AuthService);

  // Estado principal
  private readonly _state = signal<ResidenceState>({
    residences: [],
    selectedResidenceId: this.getStoredResidenceId(),
    selectedResidence: null,
    isLoading: false,
    error: null,
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
    () =>
      !this.authService.isSuperAdmin() &&
      this.hasMultipleResidences() &&
      !this.selectedResidenceId(),
  );

  // LinkedSignal para la residencia seleccionada
  private readonly _selectedResidenceDetails = linkedSignal(() => {
    const residenceId = this.selectedResidenceId();
    const residences = this.residences();

    if (!residenceId || !residences.length) return null;

    return residences.find((r) => r['id'] === residenceId) || null;
  });

  readonly selectedResidenceDetails = this._selectedResidenceDetails.asReadonly();

  constructor() {
    // Auto-cargar residencias cuando el usuario se autentica
    toObservable(this.authService.isAuthenticated)
      .pipe(switchMap((isAuth) => (isAuth ? this.loadUserResidences() : of(null))))
      .subscribe();
  }

  loadUserResidences(): Observable<any[]> {
    this.setLoading(true);
    this.clearError();

    return this.apiResidences.myResidencesResidencesMineGet().pipe(
      tap((residences) => {
        this._state.update((state) => ({
          ...state,
          residences,
          isLoading: false,
        }));

        // Auto-seleccionar si solo hay una residencia
        if (residences.length === 1 && !this.selectedResidenceId()) {
          this.selectResidence(residences[0]['id']);
        }
      }),
      catchError((error) => {
        this.setError('Error cargando residencias');
        return of([]);
      }),
    );
  }

  selectResidence(residenceId: string): void {
    const residence = this.residences().find((r) => r.id === residenceId);

    if (residence) {
      this._state.update((state) => ({
        ...state,
        selectedResidenceId: residenceId,
        selectedResidence: residence,
      }));

      this.storeSelectedResidenceId(residenceId);
    }
  }

  clearSelection(): void {
    this._state.update((state) => ({
      ...state,
      selectedResidenceId: null,
      selectedResidence: null,
    }));

    this.clearStoredResidenceId();
  }

  getResidenceById(id: string): Observable<any> {
    return this.apiResidences.getResidenceResidencesResidenceIdGet({ residence_id: id });
  }

  private setLoading(isLoading: boolean): void {
    this._state.update((state) => ({ ...state, isLoading }));
  }

  private setError(error: string): void {
    this._state.update((state) => ({ ...state, error, isLoading: false }));
  }

  private clearError(): void {
    this._state.update((state) => ({ ...state, error: null }));
  }

  private getStoredResidenceId(): string | null {
    return localStorage.getItem('selected_residence_id');
  }

  private storeSelectedResidenceId(residenceId: string): void {
    localStorage.setItem('selected_residence_id', residenceId);
  }

  private clearStoredResidenceId(): void {
    localStorage.removeItem('selected_residence_id');
  }
}
