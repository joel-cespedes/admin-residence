import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterModule, RouterLinkActive } from '@angular/router';
import { ResidenceService } from '@core';
import { ApiService } from '../../openapi/generated/services/api.service';
import { DashboardService } from '../../openapi/generated/services/dashboard.service';

@Component({
  selector: 'movsa-dashboard',
  standalone: true,
  imports: [RouterModule, RouterLinkActive],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.scss']
})
export class Dashboard implements OnInit {
  private residenceService = inject(ResidenceService);
  private apiService = inject(ApiService);
  private dashboardService = inject(DashboardService);

  sidebarCollapsed = signal(false);

  // Contadores para el menú
  residencesCount = signal(0);
  residentsCount = signal(0);
  roomsCount = signal(0);
  bedsCount = signal(0);
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
    console.log('Loading menu counts...');

    // Cargar datos del dashboard para los contadores
    this.dashboardService.getDashboardDataDashboardGet$Response({
      time_filter: 'year'
    }).subscribe({
      next: (response: any) => {
        console.log('Dashboard data received:', response);
        const data = response.body;

        // Actualizar contadores basados en los datos del dashboard
        this.residentsCount.set(data.resident_stats?.total_residents || 0);
        this.tasksCount.set(data.task_stats?.total_tasks || 0);
        this.devicesCount.set(data.device_stats?.total_devices || 0);

        console.log('Updated counters - Residents:', this.residentsCount(), 'Tasks:', this.tasksCount(), 'Devices:', this.devicesCount());
      },
      error: (error) => {
        console.error('Error loading dashboard data:', error);
        // Set default values on error
        this.residentsCount.set(0);
        this.tasksCount.set(0);
        this.devicesCount.set(0);
      }
    });

    // Suscribirse a cambios en las residencias
    this.residenceService.residences().subscribe(residences => {
      console.log('Residences updated:', residences);
      this.residencesCount.set(residences?.length || 0);
    });

    // Load other counters with more realistic default values
    this.roomsCount.set(0);
    this.bedsCount.set(0);
    this.managersCount.set(0);
    this.professionalsCount.set(0);
    this.categoriesCount.set(0);
    this.behaviorCount.set(0);
    this.movementsCount.set(0);

    // TODO: Implementar cargas reales para estos contadores
    // Por ahora, valores más conservadores
    // this.roomsCount.set(45);
    // this.bedsCount.set(89);
    // this.managersCount.set(12);
    // this.professionalsCount.set(28);
    // this.categoriesCount.set(8);
    // this.behaviorCount.set(156);
    // this.movementsCount.set(89);
  }

  toggleSidebar() {
    this.sidebarCollapsed.update(current => !current);
    const sidebar = document.querySelector('.layout__sidebar');
    if (sidebar) {
      sidebar.classList.toggle('layout__sidebar--open');
    }
  }

  closeSidebar() {
    this.sidebarCollapsed.set(false);
    const sidebar = document.querySelector('.layout__sidebar');
    if (sidebar) {
      sidebar.classList.remove('layout__sidebar--open');
    }
  }
}
