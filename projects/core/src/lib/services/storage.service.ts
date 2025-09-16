import { Injectable, signal, computed } from '@angular/core';

export interface AppState {
  token: string | null;
  selectedResidenceId: string | null;
  isAuthenticated: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class StorageService {
  private readonly _state = signal<AppState>({
    token: localStorage.getItem('auth_token'),
    selectedResidenceId: localStorage.getItem('selected_residence_id'),
    isAuthenticated: !!localStorage.getItem('auth_token')
  });

  // Public signals
  readonly token = computed(() => this._state().token);
  readonly selectedResidenceId = computed(() => this._state().selectedResidenceId);
  readonly isAuthenticated = computed(() => this._state().isAuthenticated);

  // Methods to update state
  setToken(token: string | null): void {
    if (token) {
      localStorage.setItem('auth_token', token);
    } else {
      localStorage.removeItem('auth_token');
    }
    this._state.update(state => ({
      ...state,
      token,
      isAuthenticated: !!token
    }));
  }

  setSelectedResidenceId(residenceId: string | null): void {
    if (residenceId) {
      localStorage.setItem('selected_residence_id', residenceId);
    } else {
      localStorage.removeItem('selected_residence_id');
    }
    this._state.update(state => ({ ...state, selectedResidenceId: residenceId }));
  }

  setAuthenticated(isAuthenticated: boolean): void {
    this._state.update(state => ({ ...state, isAuthenticated }));
  }

  // Clear all state
  clearAll(): void {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('selected_residence_id');
    this._state.set({
      token: null,
      selectedResidenceId: null,
      isAuthenticated: false
    });
  }
}