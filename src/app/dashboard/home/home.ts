import { CommonModule, DatePipe } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { MatBadgeModule } from '@angular/material/badge';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatToolbarModule } from '@angular/material/toolbar';
import { RouterModule } from '@angular/router';
import { NgApexchartsModule } from 'ng-apexcharts';

import { ResidenceService } from '@core';
import type {
  ApexAxisChartSeries,
  ApexChart,
  ApexDataLabels,
  ApexGrid,
  ApexLegend,
  ApexOptions,
  ApexPlotOptions,
  ApexStroke,
  ApexXAxis
} from 'ng-apexcharts';
import { DashboardData } from '../../../openapi/generated/models/dashboard-data';
import { TaskCategoryWithCount } from '../../../openapi/generated/models/task-category-with-count';
import { NewResidentStats } from '../../../openapi/generated/models/new-resident-stats';
import { DashboardService } from '../../../openapi/generated/services/dashboard.service';

interface Activity {
  type: string;
  status?: string;
  measurement_type?: string;
}

@Component({
  selector: 'movsa-home',
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatSelectModule,
    MatIconModule,
    MatToolbarModule,
    MatMenuModule,
    MatBadgeModule,
    MatDividerModule,
    MatProgressSpinnerModule,
    NgApexchartsModule,
    RouterModule
  ],
  templateUrl: './home.html',
  styleUrl: './home.scss'
})
export class Home implements OnInit {
  private dashboardService = inject(DashboardService);
  private residenceService = inject(ResidenceService);

  isDarkTheme = signal(false);
  sidebarCollapsed = signal(false);
  loading = signal(true);
  error = signal<string | null>(null);
  timeFilter = signal<'week' | 'month' | 'year'>('month');
  // Removed problematic residence filter - now handled by interceptor and residence service
  taskFilter = signal<'all' | 'active' | 'completed'>('all');

  // Dashboard data signals
  dashboardData = signal<DashboardData | null>(null);
  taskCategories = signal<TaskCategoryWithCount[]>([]);
  residentStats = signal<NewResidentStats | null>(null);

  // Loading and error states
  isLoadingTaskCategories = signal(false);
  taskCategoriesError = signal<string | null>(null);
  isLoadingRecentActivity = signal(false);
  recentActivityError = signal<string | null>(null);
  isLoadingResidentStats = signal(false);
  residentStatsError = signal<string | null>(null);
  recentActivities = signal<any[]>([]);

  // Computed signals for charts
  metrics = computed(() => this.dashboardData()?.metrics || []);
  revenueChartData = computed(() => this.transformYearlyData());
  chartRadial = computed(() => this.transformTaskCompletionRadial());
  profitChartData = computed(() => this.transformMeasurementsTrend());
  orderCategories = computed(() => this.residenceDataWithStats());
  categories = computed(() => this.transformTaskCategories());
  lineChart = computed(() => this.transformResidentStatsLine());
  circleChart = computed(() => this.transformResidenceDistribution());

  // Computed signal for daily measurements average
  dailyMeasurementsAverage = computed(() => {
    const measurementStats = this.dashboardData()?.measurement_stats;
    if (!measurementStats) return 0;

    const last30Days = measurementStats.last_30_days || 0;
    return Math.round(last30Days / 30); // Daily average
  });

  // Computed signals for resident statistics
  currentYear = computed(() => {
    const stats = this.residentStats();
    return stats?.current_year || new Date().getFullYear();
  });

  growthPercentage = computed(() => {
    const stats = this.residentStats();
    return stats?.growth_percentage || 0;
  });

  totalResidents = computed(() => {
    const stats = this.residentStats();
    return stats?.total_residents || 0;
  });

  // Computed signals for totals
  totalResidentsFromResidences = computed(() => {
    const residences = this.residenceService.residences();
    if (!residences || residences.length === 0) return 0;

    // Calculate total residents from all assigned residences
    // For now, use mock data - in real implementation this would come from API
    return residences.reduce(total => {
      const residentCount = Math.floor(Math.random() * 100) + 30; // 30-130 residents per residence
      return total + residentCount;
    }, 0);
  });

  totalVisibleResidences = computed(() => {
    const residences = this.residenceService.residences();
    return residences?.length || 0;
  });

  // Removed problematic residence filter options - now handled by interceptor and residence service

  // Removed problematic residence filter show logic - now handled by interceptor and residence service

  // Centralized residence data with consistent mock data
  residenceDataWithStats = computed(() => {
    const residences = this.residenceService.residences();
    if (!residences || residences.length === 0) return [];

    // Limit to maximum 10 residences
    const limitedResidences = residences.slice(0, 10);

    return limitedResidences.map((residence, index) => {
      // Generate consistent mock data for each residence
      const floorCount = Math.floor(Math.random() * 15) + 3; // 3-18 floors
      const roomCount = Math.floor(Math.random() * 50) + 20; // 20-70 rooms
      const residentCount = Math.floor(Math.random() * 100) + 30; // 30-130 residents

      return {
        id: residence.id,
        name: residence.name,
        icon: 'apartment',
        floorCount: floorCount,
        roomCount: roomCount,
        residentCount: residentCount,
        color: this.getResidenceColor(index),
        percentage: Math.floor(Math.random() * 30) + 10 // 10-40% for demo
      };
    });
  });

  ngOnInit() {
    this.isDarkTheme.set(false);
    this.applyTheme();
    this.initializeDashboard();
    this.loadRecentActivity();
  }

  private initializeDashboard() {
    // Ensure residences are loaded before getting dashboard data
    const residences = this.residenceService.residences();

    if (residences && residences.length > 0) {
      this.loadDashboardData();
      this.loadTaskCategories();
      this.loadResidentStats();
    } else {
      // Wait for residences to load using effect instead of toObservable
      this.waitForResidences();
    }
  }

  private loadDashboardData() {
    this.loading.set(true);
    this.error.set(null);

    // The residence interceptor will automatically add the X-Residence-Id header
    this.dashboardService
      .getDashboardDataDashboardGet$Response({
        time_filter: this.timeFilter()
      })
      .subscribe({
        next: response => {
          this.dashboardData.set(response.body);
          this.loading.set(false);
        },
        error: err => {
          console.error('Error loading dashboard data:', err);
          this.error.set('Error loading dashboard data');
          this.loading.set(false);
        }
      });
  }

  private loadTaskCategories() {
    this.isLoadingTaskCategories.set(true);
    this.taskCategoriesError.set(null);

    // The residence interceptor will automatically add the X-Residence-Id header
    this.dashboardService.getTaskCategoriesWithCountsDashboardTaskCategoriesGet().subscribe({
      next: (response: any) => {
        this.taskCategories.set(response);
        this.isLoadingTaskCategories.set(false);
      },
      error: (err: any) => {
        console.error('Error loading task categories:', err);
        this.taskCategoriesError.set('Error loading task categories');
        this.taskCategories.set([]);
        this.isLoadingTaskCategories.set(false);
      }
    });
  }

  private loadResidentStats() {
    this.isLoadingResidentStats.set(true);
    this.residentStatsError.set(null);

    this.dashboardService.getNewResidentsStatsDashboardNewResidentsStatsGet$Response().subscribe({
      next: (response: any) => {
        this.residentStats.set(response.body);
        this.isLoadingResidentStats.set(false);
      },
      error: (err: any) => {
        console.error('Error loading resident statistics:', err);
        this.residentStatsError.set('Error loading resident statistics');
        this.isLoadingResidentStats.set(false);
      }
    });
  }

  private transformYearlyData() {
    const data = this.dashboardData()?.yearly_comparison || [];
    const currentYear = data.find(d => d.year === new Date().getFullYear());
    const previousYear = data.find(d => d.year === new Date().getFullYear() - 1);

    return {
      series: [
        {
          name: `${new Date().getFullYear()}`,
          data: currentYear?.data.map(d => d.value) || [0, 0, 0, 0, 0, 0, 0]
        },
        {
          name: `${new Date().getFullYear() - 1}`,
          data: previousYear?.data.map(d => d.value) || [0, 0, 0, 0, 0, 0, 0]
        }
      ] as ApexAxisChartSeries,
      chart: {
        type: 'bar',
        stacked: true,
        parentHeightOffset: 6,
        height: 335,
        offsetX: -12,
        toolbar: { show: false }
      } satisfies ApexChart,
      dataLabels: { enabled: false },
      stroke: {
        width: 6,
        lineCap: 'round',
        colors: ['#000']
      },
      colors: ['#696cff', '#03c3ec'],
      legend: {
        offsetX: -22,
        offsetY: -1,
        position: 'top',
        fontSize: '13px',
        horizontalAlign: 'left',
        fontFamily: 'Inter',
        labels: { colors: '#000' },
        itemMargin: { vertical: 4, horizontal: 10 },
        markers: {
          width: 11,
          height: 11,
          radius: 10,
          offsetX: -2
        }
      } as ApexLegend,
      states: {
        hover: { filter: { type: 'none' } },
        active: { filter: { type: 'none' } }
      },
      grid: {
        strokeDashArray: 6,
        borderColor: 'rgba(34,48,62,.2)',
        padding: { bottom: 5 }
      },
      plotOptions: {
        bar: {
          borderRadius: 9,
          columnWidth: '30%',
          borderRadiusApplication: 'around',
          borderRadiusWhenStacked: 'all'
        }
      } as ApexPlotOptions,
      xaxis: {
        axisTicks: { show: false },
        crosshairs: { opacity: 0 },
        axisBorder: { show: false },
        categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'],
        tooltip: {
          style: { fontSize: '13px', fontFamily: 'Inter' }
        }
      } satisfies ApexXAxis,
      yaxis: {
        labels: {
          style: { fontSize: '13px', colors: '#000', fontFamily: 'Inter' }
        }
      }
    };
  }

  private transformTaskCompletionRadial() {
    const completionRate = this.dashboardData()?.task_stats?.completion_rate || 0;

    return {
      series: [completionRate],
      chart: {
        height: 350,
        type: 'radialBar',
        offsetY: -10
      },
      plotOptions: {
        radialBar: {
          endAngle: 150,
          startAngle: -140,
          hollow: { size: '56%' },
          track: { background: 'transparent' },
          dataLabels: {
            name: {
              offsetY: 25,
              fontWeight: 500,
              fontSize: '15px',
              color: '#000',
              fontFamily: 'Inter'
            },
            value: {
              offsetY: -15,
              fontWeight: 500,
              fontSize: '24px',
              color: '#000',
              fontFamily: 'Inter',
              formatter: () => `${completionRate.toFixed(1)}%`
            }
          }
        }
      },
      fill: {
        type: 'gradient',
        gradient: {
          shade: 'dark',
          opacityTo: 0.6,
          opacityFrom: 1,
          shadeIntensity: 0.5,
          stops: [30, 70, 100],
          inverseColors: false,
          gradientToColors: ['#696cff', '#03c3ec']
        }
      },
      states: {
        hover: { filter: { type: 'none' } },
        active: { filter: { type: 'none' } }
      },
      stroke: { dashArray: 5 },
      labels: ['Task Completion']
    } satisfies ApexOptions;
  }

  private transformMeasurementsTrend() {
    // Mock trend data based on recent measurements
    const last30Days = this.dashboardData()?.measurement_stats?.last_30_days || 0;
    const trendData = [
      last30Days * 0.7,
      last30Days * 0.8,
      last30Days * 0.9,
      last30Days * 0.85,
      last30Days,
      last30Days * 1.1,
      last30Days * 1.05,
      last30Days
    ];

    return {
      series: [{ data: trendData }] as ApexAxisChartSeries,
      chart: {
        type: 'area',
        height: 230,
        toolbar: { show: false }
      } satisfies ApexChart,
      colors: ['#696cff'],
      stroke: {
        width: 3,
        curve: 'smooth'
      } satisfies ApexStroke,
      states: {
        hover: { filter: { type: 'none' } },
        active: { filter: { type: 'none' } }
      },
      dataLabels: { enabled: false } as ApexDataLabels,
      grid: {
        strokeDashArray: 4.5,
        borderColor: 'rgba(34,48,62,.3)',
        padding: { left: 0, top: -20, right: 11, bottom: 7 }
      },
      fill: {
        type: 'gradient',
        gradient: {
          opacityTo: 0.25,
          opacityFrom: 0.5,
          stops: [0, 95, 100],
          shadeIntensity: 0.6,
          colorStops: [
            [
              {
                offset: 0,
                opacity: 0.4,
                color: '#696cff'
              },
              {
                offset: 100,
                opacity: 0.2,
                color: '#03c3ec'
              }
            ]
          ]
        }
      },
      xaxis: {
        axisTicks: { show: false },
        axisBorder: { show: false },
        categories: ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'],
        offsetY: 20,
        offsetX: -24,
        labels: {
          style: { fontSize: '14px', colors: '#696cff', fontFamily: 'Inter' }
        }
      },
      yaxis: {
        min: 0,
        show: false,
        tickAmount: 4
      }
    };
  }

  private transformTaskCategories() {
    const categories = this.taskCategories();

    // Transform backend categories to frontend format
    const transformedCategories = categories.map(category => ({
      id: category.id,
      type: category.name,
      company: category.residence_name,
      amount: category.task_count.toString(),
      status: category.active_tasks > 0 ? 'active' : 'inactive',
      icon: category.icon || 'category',
      color: this.getColorForCategory(category.name),
      residenceId: category.residence_id,
      activeTasks: category.active_tasks,
      completedTasks: category.completed_tasks
    }));

    // Apply task filter
    const taskFilter = this.taskFilter();
    let filteredCategories = transformedCategories;

    if (taskFilter === 'active') {
      filteredCategories = transformedCategories.filter(category => category.activeTasks > 0);
    } else if (taskFilter === 'completed') {
      filteredCategories = transformedCategories.filter(category => category.completedTasks > 0);
    }

    // Removed problematic residence filter - now handled by interceptor and residence service
    // All data is automatically filtered by the selected residence in the backend

    return filteredCategories;
  }

  private transformResidentStatsLine() {
    const stats = this.residentStats();
    if (!stats) {
      // Fallback to mock data if no stats available
      return {
        series: [{ data: [30, 58, 35, 53, 50, 68] }],
        tooltip: { enabled: false },
        colors: ['#FFAC04', 'red'],
        chart: {
          parentHeightOffset: 0,
          toolbar: { show: false },
          foreColor: '#ffac04',
          dropShadow: {
            top: 12,
            blur: 4,
            left: 0,
            enabled: true,
            opacity: 0.12,
            color: '#FFAC04'
          }
        } as ApexChart,
        dataLabels: { enabled: false },
        stroke: {
          width: 4,
          curve: 'smooth',
          lineCap: 'round'
        } as ApexStroke,
        grid: { show: false, padding: { top: -21, left: -5, bottom: -8 } },
        xaxis: {
          labels: { show: false },
          axisTicks: { show: false },
          axisBorder: { show: false }
        },
        yaxis: { labels: { show: false } }
      };
    }

    // Transform monthly data to line chart format
    const monthlyData = stats.monthly_data || [];
    const chartData = monthlyData.map(month => month.value);

    return {
      series: [{ data: chartData.length > 0 ? chartData : [30, 58, 35, 53, 50, 68] }],
      tooltip: { enabled: false },
      colors: ['#FFAC04', 'red'],
      chart: {
        parentHeightOffset: 0,
        toolbar: { show: false },
        foreColor: '#ffac04',
        dropShadow: {
          top: 12,
          blur: 4,
          left: 0,
          enabled: true,
          opacity: 0.12,
          color: '#FFAC04'
        }
      } as ApexChart,
      dataLabels: { enabled: false },
      stroke: {
        width: 4,
        curve: 'smooth',
        lineCap: 'round'
      } as ApexStroke,
      grid: { show: false, padding: { top: -21, left: -5, bottom: -8 } },
      xaxis: {
        labels: { show: false },
        axisTicks: { show: false },
        axisBorder: { show: false }
      },
      yaxis: { labels: { show: false } }
    };
  }

  private transformResidenceDistribution() {
    const residenceData = this.residenceDataWithStats();
    const residentStats = this.dashboardData()?.resident_stats;
    const totalResidents = residentStats?.total || 0;

    if (!residenceData || residenceData.length === 0) {
      return {
        series: [],
        chart: {
          sparkline: { enabled: true },
          animations: { enabled: false },
          width: 140,
          height: 120,
          type: 'donut',
          fontFamily: 'Inter'
        } satisfies ApexChart,
        states: {
          hover: { filter: { type: 'none' } },
          active: { filter: { type: 'none' } }
        },
        stroke: { width: 6, colors: ['rgb(105, 108, 255)'] },
        legend: { show: false },
        tooltip: { enabled: false },
        dataLabels: { enabled: false },
        labels: [],
        grid: { padding: { top: -7, bottom: 5 } } as ApexGrid,
        plotOptions: {
          pie: {
            expandOnClick: false,
            donut: {
              size: '85%',
              fontFamily: 'Inter',
              labels: {
                show: true,
                name: { offsetY: 17, fontSize: '22px', color: 'rgb(3, 195, 236)', fontFamily: 'Inter' },
                value: { offsetY: -17, fontSize: '18px', color: 'rgb(105, 108, 255)', fontFamily: 'Inter', fontWeight: 500 },
                total: {
                  show: true,
                  label: 'Residentes',
                  fontSize: '13px',
                  lineHeight: '18px',
                  formatter: () => `${totalResidents}`,
                  color: 'rgb(3, 195, 236)',
                  fontFamily: 'Inter'
                }
              }
            }
          }
        }
      };
    }

    // Use resident count from the centralized data for consistency
    const series = residenceData.map(residence => residence.residentCount);
    const labels = residenceData.map(r => r.name);

    return {
      series: series,
      chart: {
        sparkline: { enabled: true },
        animations: { enabled: false },
        width: 140,
        height: 120,
        type: 'donut',
        fontFamily: 'Inter'
      } satisfies ApexChart,
      states: {
        hover: { filter: { type: 'none' } },
        active: { filter: { type: 'none' } }
      },
      stroke: { width: 6, colors: ['rgb(105, 108, 255)'] },
      legend: { show: false },
      tooltip: { enabled: false },
      dataLabels: { enabled: false },
      labels: labels,
      grid: { padding: { top: -7, bottom: 5 } } as ApexGrid,
      plotOptions: {
        pie: {
          expandOnClick: false,
          donut: {
            size: '85%',
            fontFamily: 'Inter',
            labels: {
              show: true,
              name: { offsetY: 17, fontSize: '22px', color: 'rgb(3, 195, 236)', fontFamily: 'Inter' },
              value: { offsetY: -17, fontSize: '18px', color: 'rgb(105, 108, 255)', fontFamily: 'Inter', fontWeight: 500 },
              total: {
                show: true,
                label: 'Residentes',
                fontSize: '13px',
                lineHeight: '18px',
                formatter: () => `${totalResidents}`,
                color: 'rgb(3, 195, 236)',
                fontFamily: 'Inter'
              }
            }
          }
        }
      }
    };
  }

  private getCategoryIcon(name: string): string {
    const iconMap: Record<string, string> = {
      Medicación: 'medication',
      Higiene: 'sanitizer',
      Alimentación: 'restaurant',
      Ejercicio: 'fitness_center',
      Social: 'groups'
    };
    return iconMap[name] || 'category';
  }

  private getCategoryColor(name: string): string {
    const colorMap: Record<string, string> = {
      Medicación: 'btn_red',
      Higiene: 'btn_green',
      Alimentación: 'btn_lightblue',
      Ejercicio: 'btn_darkblue',
      Social: 'btn_gray'
    };
    return colorMap[name] || 'btn_gray';
  }

  private getResidenceColor(index: number): string {
    const colors = [
      'btn_primary',
      'btn_success',
      'btn_info',
      'btn_warning',
      'btn_danger',
      'btn_dark',
      'btn_lightblue',
      'btn_purple',
      'btn_pink',
      'btn_orange'
    ];
    return colors[index % colors.length];
  }

  private getColorForCategory(categoryName: string): string {
    const categoryColors: Record<string, string> = {
      Medicación: 'btn_red',
      Higiene: 'btn_green',
      Alimentación: 'btn_lightblue',
      Ejercicio: 'btn_darkblue',
      Social: 'btn_gray',
      Entrenamiento: 'btn_purple',
      Terapia: 'btn_pink',
      Recreación: 'btn_orange',
      Cuidado: 'btn_primary',
      Salud: 'btn_danger'
    };

    return categoryColors[categoryName] || 'btn_primary';
  }

  private getActivityDescription(activity: Activity): string {
    switch (activity.type) {
      case 'resident':
        return 'Residencia';
      case 'measurement':
        return 'Medición';
      case 'task':
        return 'Tarea';
      default:
        return 'Actividad';
    }
  }

  private getActivityAmount(activity: Activity): string {
    if (activity.type === 'measurement') {
      return `+${activity.measurement_type}`;
    }
    return '+1';
  }

  private getActivityStatus(activity: Activity): 'positive' | 'negative' {
    return activity.status === 'active' ? 'positive' : 'negative';
  }

  private getActivityIcon(type: string): string {
    const iconMap: Record<string, string> = {
      resident: 'people',
      measurement: 'monitoring',
      task: 'task_alt'
    };
    return iconMap[type] || 'info';
  }

  private getActivityColor(type: string): string {
    const colorMap: Record<string, string> = {
      resident: 'btn_green',
      measurement: 'btn_lightblue',
      task: 'btn_darkblue'
    };
    return colorMap[type] || 'btn_gray';
  }

  toggleTheme() {
    this.isDarkTheme.update(current => !current);
    this.applyTheme();
  }

  private applyTheme() {
    const theme = this.isDarkTheme() ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', theme);
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

  setTimeFilter(filter: 'week' | 'month' | 'year') {
    this.timeFilter.set(filter);
    this.loadDashboardData();
  }

  // Removed problematic setResidenceFilter - now handled by residence service and interceptor
  // Residence selection is managed globally through the residence service

  setTaskFilter(filter: 'all' | 'active' | 'completed') {
    this.taskFilter.set(filter);
  }

  private waitForResidences(): void {
    // Use a simple timeout to check for residences periodically
    const checkResidences = () => {
      const residences = this.residenceService.residences();
      if (residences && residences.length > 0) {
        this.loadDashboardData();
        this.loadTaskCategories();
        this.loadResidentStats();
      } else if (this.loading()) {
        // Check again after a delay
        setTimeout(checkResidences, 100);
      } else {
        this.error.set('No residences available. Please contact administrator.');
      }
    };

    checkResidences();
  }

  // Load recent activity data
  private loadRecentActivity() {
    this.isLoadingRecentActivity.set(true);
    this.recentActivityError.set(null);

    // Mock recent activity data for now
    const mockActivities = [
      {
        id: '1',
        type: 'resident',
        title: 'Nuevo residente registrado',
        description: 'Residencia Test',
        created_at: new Date().toISOString()
      },
      {
        id: '2',
        type: 'measurement',
        title: 'Medición completada',
        description: 'Presión arterial - Residencia Test',
        created_at: new Date(Date.now() - 3600000).toISOString()
      },
      {
        id: '3',
        type: 'task',
        title: 'Tarea completada',
        description: 'Medicación - Residencia Test',
        created_at: new Date(Date.now() - 7200000).toISOString()
      }
    ];

    setTimeout(() => {
      this.recentActivities.set(mockActivities);
      this.isLoadingRecentActivity.set(false);
    }, 1000);
  }

  // Format date for display
  formatDate(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

    if (diffInHours < 1) {
      return 'Hace menos de 1 hora';
    } else if (diffInHours < 24) {
      return `Hace ${diffInHours} horas`;
    } else {
      return date.toLocaleDateString('es-ES', {
        day: 'numeric',
        month: 'short',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
      });
    }
  }
}
