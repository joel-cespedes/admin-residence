import { Injectable, signal, computed } from '@angular/core';

export interface AppState {
  token: string | null;
  isAuthenticated: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class StorageService {
  private readonly _state = signal<AppState>({
    token: localStorage.getItem('auth_token'),
    isAuthenticated: !!localStorage.getItem('auth_token')
  });

  // Public signals
  readonly token = computed(() => this._state().token);
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

  setAuthenticated(isAuthenticated: boolean): void {
    this._state.update(state => ({ ...state, isAuthenticated }));
  }

  // Clear all state
  clearAll(): void {
    localStorage.removeItem('auth_token');
    this._state.set({
      token: null,
      isAuthenticated: false
    });
  }
}