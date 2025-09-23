import { Injectable, signal, computed, effect } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private readonly THEME_KEY = 'theme_preference';

  // Signal para almacenar el estado del tema
  private readonly _isDarkTheme = signal<boolean>(this.loadThemeFromStorage());

  // Señal pública de solo lectura
  readonly isDarkTheme = this._isDarkTheme.asReadonly();

  // Computed property para obtener el logo según el tema
  readonly logoPath = computed(() => this._isDarkTheme() ? '/logo-white.svg' : '/logo-black.svg');

  // Icono del tema
  readonly themeIcon = computed(() => this._isDarkTheme() ? 'light_mode' : 'dark_mode');

  constructor() {
    // Aplicar el tema al iniciar el servicio
    this.applyTheme();

    // Guardar en localStorage cuando cambie el tema
    effect(() => {
      this.saveThemeToStorage(this._isDarkTheme());
    });
  }

  toggleTheme(): void {
    this._isDarkTheme.update(current => !current);
    this.applyTheme();
  }

  setTheme(isDark: boolean): void {
    this._isDarkTheme.set(isDark);
    this.applyTheme();
  }

  private applyTheme(): void {
    const theme = this._isDarkTheme() ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', theme);
  }

  private loadThemeFromStorage(): boolean {
    try {
      const savedTheme = localStorage.getItem(this.THEME_KEY);
      if (savedTheme) {
        return savedTheme === 'dark';
      }

      // Si no hay tema guardado, usar preferencia del sistema
      return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    } catch (error) {
      console.warn('Error loading theme from localStorage:', error);
      return false;
    }
  }

  private saveThemeToStorage(isDark: boolean): void {
    try {
      localStorage.setItem(this.THEME_KEY, isDark ? 'dark' : 'light');
    } catch (error) {
      console.warn('Error saving theme to localStorage:', error);
    }
  }
}