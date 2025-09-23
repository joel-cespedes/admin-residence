import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { RouterModule, RouterLinkActive } from '@angular/router';
// Removed ResidenceService dependency - backend filters by user role
import { ApiService } from '../../openapi/generated/services/api.service';
import { DashboardService } from '../../openapi/generated/services/dashboard.service';
import { AuthService } from '@core';
import { ThemeService } from '@core';

@Component({
  selector: 'movsa-dashboard',
  imports: [RouterModule, RouterLinkActive],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.scss']
})
export class Dashboard implements OnInit {
  // Removed ResidenceService dependency
  private apiService = inject(ApiService);
  private dashboardService = inject(DashboardService);
  private authService = inject(AuthService);
  private themeService = inject(ThemeService);

  sidebarCollapsed = signal(false);
  readonly canViewHome = this.authService.isSuperAdmin;

  // Logo dinámico según el tema
  readonly logoPath = this.themeService.logoPath;

  // Contadores para el menú
  residencesCount = signal(0);
  residentsCount = signal(0);
  roomsCount = signal(0);
  bedsCount = signal(0);
  floorsCount = signal(0);
  managersCount = signal(0);
  professionalsCount = signal(0);
  categoriesCount = signal(0);
  tasksCount = signal(0);
  devicesCount = signal(0);
  behaviorCount = signal(0);
  movementsCount = signal(0);

  ngOnInit() {
    this.loadMenuCounts();
  }

  private loadMenuCounts() {
    // Usar el nuevo endpoint de navigation-counts
    this.dashboardService.getNavigationCountsDashboardNavigationCountsGet$Response().subscribe({
      next: (response: any) => {
        const data = response.body;

        // Actualizar todos los contadores con los datos reales del nuevo endpoint
        this.residencesCount.set(data?.residences || 0);
        this.residentsCount.set(data?.residents || 0);
        this.roomsCount.set(data?.rooms || 0);
        this.bedsCount.set(data?.beds || 0);
        this.managersCount.set(data?.managers || 0);
        this.professionalsCount.set(data?.professionals || 0);
        this.categoriesCount.set(data?.categories || 0);
        this.tasksCount.set(data?.tasks || 0);
        this.devicesCount.set(data?.devices || 0);
        this.floorsCount.set(data?.floors || 0);

        // Mantener los contadores existentes para comportamiento y movimientos
        // (Estos podrían necesitar endpoints específicos en el futuro)
        this.behaviorCount.set(0);
        this.movementsCount.set(0);
      },
      error: () => {
        // Set default values on error
        this.residencesCount.set(0);
        this.residentsCount.set(0);
        this.roomsCount.set(0);
        this.bedsCount.set(0);
        this.managersCount.set(0);
        this.professionalsCount.set(0);
        this.categoriesCount.set(0);
        this.tasksCount.set(0);
        this.devicesCount.set(0);
        this.behaviorCount.set(0);
        this.movementsCount.set(0);
      }
    });
  }

  toggleSidebar() {
    this.sidebarCollapsed.update(current => !current);
    const sidebar = document.querySelector('.layout__sidebar');
    if (sidebar) {
      sidebar.classList.toggle('layout__sidebar--open');
    }
  }

  toggleTheme() {
    this.themeService.toggleTheme();
  }

  closeSidebar() {
    this.sidebarCollapsed.set(false);
    const sidebar = document.querySelector('.layout__sidebar');
    if (sidebar) {
      sidebar.classList.remove('layout__sidebar--open');
    }
  }
}
