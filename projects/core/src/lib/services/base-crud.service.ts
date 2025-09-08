import { Injectable, signal, computed } from '@angular/core';
import { Observable, BehaviorSubject, combineLatest } from 'rxjs';
import { map, tap, catchError, startWith } from 'rxjs/operators';

export interface CrudState<T> {
  items: T[];
  selectedItem: T | null;
  isLoading: boolean;
  error: string | null;
  filters: Record<string, any>;
  pagination: {
    page: number;
    pageSize: number;
    total: number;
  };
}

export abstract class BaseCrudService<T extends { id: string }> {
  // Estado principal
  protected readonly _state = signal<CrudState<T>>({
    items: [],
    selectedItem: null,
    isLoading: false,
    error: null,
    filters: {},
    pagination: {
      page: 1,
      pageSize: 50,
      total: 0,
    },
  });

  // Computed signals públicos
  readonly state = this._state.asReadonly();
  readonly items = computed(() => this._state().items);
  readonly selectedItem = computed(() => this._state().selectedItem);
  readonly isLoading = computed(() => this._state().isLoading);
  readonly error = computed(() => this._state().error);
  readonly filters = computed(() => this._state().filters);
  readonly pagination = computed(() => this._state().pagination);
  readonly isEmpty = computed(() => this.items().length === 0);
  readonly hasError = computed(() => !!this.error());

  // Métodos abstractos que deben implementar las clases hijas
  abstract getAll(params?: any): Observable<T[]>;
  abstract getById(id: string): Observable<T>;
  abstract create(item: Partial<T>): Observable<T>;
  abstract update(id: string, item: Partial<T>): Observable<T>;
  abstract delete(id: string): Observable<void>;

  // Métodos comunes
  loadAll(params?: any): Observable<T[]> {
    this.setLoading(true);
    this.clearError();

    return this.getAll(params).pipe(
      tap((items) => {
        this._state.update((state) => ({
          ...state,
          items,
          isLoading: false,
        }));
      }),
      catchError((error) => {
        this.setError('Error cargando datos');
        this.setLoading(false);
        throw error;
      })
    );
  }

  loadById(id: string): Observable<T> {
    this.setLoading(true);
    this.clearError();

    return this.getById(id).pipe(
      tap((item) => {
        this._state.update((state) => ({
          ...state,
          selectedItem: item,
          isLoading: false,
        }));
      }),
      catchError((error) => {
        this.setError('Error cargando elemento');
        this.setLoading(false);
        throw error;
      })
    );
  }

  createItem(item: Partial<T>): Observable<T> {
    this.setLoading(true);
    this.clearError();

    return this.create(item).pipe(
      tap((newItem) => {
        this._state.update((state) => ({
          ...state,
          items: [...state.items, newItem],
          isLoading: false,
        }));
      }),
      catchError((error) => {
        this.setError('Error creando elemento');
        this.setLoading(false);
        throw error;
      })
    );
  }

  updateItem(id: string, item: Partial<T>): Observable<T> {
    this.setLoading(true);
    this.clearError();

    return this.update(id, item).pipe(
      tap((updatedItem) => {
        this._state.update((state) => ({
          ...state,
          items: state.items.map((i) => (i.id === id ? updatedItem : i)),
          selectedItem: state.selectedItem?.id === id ? updatedItem : state.selectedItem,
          isLoading: false,
        }));
      }),
      catchError((error) => {
        this.setError('Error actualizando elemento');
        this.setLoading(false);
        throw error;
      })
    );
  }

  deleteItem(id: string): Observable<void> {
    this.setLoading(true);
    this.clearError();

    return this.delete(id).pipe(
      tap(() => {
        this._state.update((state) => ({
          ...state,
          items: state.items.filter((i) => i.id !== id),
          selectedItem: state.selectedItem?.id === id ? null : state.selectedItem,
          isLoading: false,
        }));
      }),
      catchError((error) => {
        this.setError('Error eliminando elemento');
        this.setLoading(false);
        throw error;
      })
    );
  }

  selectItem(item: T | null): void {
    this._state.update((state) => ({
      ...state,
      selectedItem: item,
    }));
  }

  setFilters(filters: Record<string, any>): void {
    this._state.update((state) => ({
      ...state,
      filters: { ...state.filters, ...filters },
    }));
  }

  clearFilters(): void {
    this._state.update((state) => ({
      ...state,
      filters: {},
    }));
  }

  protected setLoading(isLoading: boolean): void {
    this._state.update((state) => ({ ...state, isLoading }));
  }

  protected setError(error: string | null): void {
    this._state.update((state) => ({ ...state, error, isLoading: false }));
  }

  protected clearError(): void {
    this._state.update((state) => ({ ...state, error: null }));
  }
}
