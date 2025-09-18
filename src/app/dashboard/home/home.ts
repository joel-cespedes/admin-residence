import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { MatBadgeModule } from '@angular/material/badge';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatToolbarModule } from '@angular/material/toolbar';
import { Router, RouterModule } from '@angular/router';
import { NgApexchartsModule } from 'ng-apexcharts';

import { AuthService, ResidenceService } from '@core';
import type {
  ApexAxisChartSeries,
  ApexChart,
  ApexDataLabels,
  ApexGrid,
  ApexLegend,
  ApexPlotOptions,
  ApexStroke,
  ApexXAxis
} from 'ng-apexcharts';
import { DashboardData } from '../../../openapi/generated/models/dashboard-data';
import { NewResidentStats } from '../../../openapi/generated/models/new-resident-stats';
import { TaskCategoryWithCount } from '../../../openapi/generated/models/task-category-with-count';
import { ApiService } from '../../../openapi/generated/services/api.service';
import { DashboardService } from '../../../openapi/generated/services/dashboard.service';
import { AuthService as ApiAuthService } from '../../../openapi/generated/services/auth.service';

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
  private apiService = inject(ApiService);
  private authService = inject(AuthService);
  private apiAuthService = inject(ApiAuthService);
  userName = signal<string>('');

  isDarkTheme = signal(false);
  sidebarCollapsed = signal(false);
  loading = signal(true);
  error = signal<string | null>(null);
  // Filtro global para compatibilidad
  timeFilter = signal<'week' | 'month' | 'year'>('year');
  taskFilter = signal<'all' | 'active' | 'completed'>('all');

  // Filtro para la gráfica de mediciones
  chartTimeFilter = signal<'week' | 'month'>('week');

  // Filtro para el gráfico de tareas completadas por mes
  monthFilter = signal<'current' | 'previous'>('current');

  dashboardData = signal<DashboardData | null>(null);
  taskCategories = signal<TaskCategoryWithCount[]>([]);
  residentStats = signal<NewResidentStats | null>(null);

  // Datos individuales para cada métrica - independientes del dashboardData
  residentesValue = signal('0');
  dispositivosValue = signal('0');
  medicionesValue = signal('0');
  tareasValue = signal('0');

  isLoadingTaskCategories = signal(false);
  taskCategoriesError = signal<string | null>(null);
  isLoadingRecentActivity = signal(false);
  recentActivityError = signal<string | null>(null);
  isLoadingResidentStats = signal(false);
  residentStatsError = signal<string | null>(null);
  recentActivities = signal<any[]>([]);
  router = inject(Router);

  metrics = computed(() => {
    const originalMetrics = this.dashboardData()?.metrics || [];

    return originalMetrics.map((metric: any) => {
      // Reemplazar el valor con el valor individual correspondiente
      let value = metric.value;
      switch (metric.title) {
        case 'Residentes':
          value = this.residentesValue();
          break;
        case 'Dispositivos':
          value = this.dispositivosValue();
          break;
        case 'Mediciones':
          value = this.medicionesValue();
          break;
        case 'Tareas':
          value = this.tareasValue();
          break;
      }

      return {
        ...metric,
        value: value
      };
    });
  });

  ngOnInit() {
    this.isDarkTheme.set(false);
    this.applyTheme();
    this.loadUserInfo();
    this.initializeDashboard();
    this.loadRecentActivity();
  }

  private initializeDashboard() {
    const residences = this.residenceService.residences();

    if (residences && residences.length > 0) {
      this.loadDashboardData();
      this.loadTaskCategories();
      this.loadResidentStats();
    } else {
      this.waitForResidences();
    }
  }

  private loadDashboardData() {
    this.loading.set(true);
    this.error.set(null);

    // Usar el nuevo endpoint de navigation-counts para obtener todos los datos sin filtro
    this.dashboardService.getNavigationCountsDashboardNavigationCountsGet$Response().subscribe({
      next: response => {
        // Transformar los datos de navigation counts al formato esperado por el dashboard
        const navigationData = response.body;

        // Crear un objeto de dashboard compatible con el formato existente
        const mockDashboardData = {
          metrics: [
            {
              title: 'Residentes',
              value: navigationData.residents.toString(),
              change: '+0%',
              changeType: 'positive' as 'positive' | 'negative',
              icon: 'people',
              color: 'primary',
              colorIcon: 'btn_lightblue'
            },
            {
              title: 'Dispositivos',
              value: navigationData.devices.toString(),
              change: '+0%',
              changeType: 'positive' as 'positive' | 'negative',
              icon: 'devices',
              color: 'success',
              colorIcon: 'btn_green'
            },
            {
              title: 'Mediciones',
              value: navigationData.measurements.toString(),
              change: '+0%',
              changeType: 'positive' as 'positive' | 'negative',
              icon: 'monitoring',
              color: 'warning',
              colorIcon: 'btn_orange'
            },
            {
              title: 'Tareas',
              value: navigationData.tasks.toString(),
              change: '+0%',
              changeType: 'positive' as 'positive' | 'negative',
              icon: 'task_alt',
              color: 'info',
              colorIcon: 'btn_purple'
            }
          ],
          resident_stats: {
            total: navigationData.residents,
            active: navigationData.residents,
            discharged: 0,
            deceased: 0,
            with_bed: Math.floor(navigationData.residents * 0.8),
            without_bed: Math.floor(navigationData.residents * 0.2),
            new_residents: 0,
            change_percentage: 0
          },
          measurement_stats: {
            total_measurements: navigationData.measurements,
            by_type: { bp: 0, spo2: 0, weight: 0, temperature: 0 },
            by_source: { device: 0, voice: 0, manual: 0 },
            last_30_days: navigationData.measurements,
            trend: 'stable' as 'increasing' | 'decreasing' | 'stable',
            change_percentage: 0
          },
          task_stats: {
            total_applications: navigationData.tasks,
            completion_rate: 0,
            by_category: {},
            last_30_days: navigationData.tasks,
            change_percentage: 0
          },
          device_stats: {
            total_devices: navigationData.devices,
            by_type: { blood_pressure: 0, pulse_oximeter: 0, scale: 0, thermometer: 0 },
            low_battery: 0,
            average_battery: 0,
            new_devices: 0,
            change_percentage: 0
          },
          yearly_comparison: [],
          recent_activity: []
        };

        this.dashboardData.set(mockDashboardData);

        // Inicializar los valores individuales con los datos reales
        this.residentesValue.set(navigationData.residents.toString());
        this.dispositivosValue.set(navigationData.devices.toString());
        this.medicionesValue.set(navigationData.measurements.toString());
        this.tareasValue.set(navigationData.tasks.toString());

        this.loading.set(false);
      },
      error: () => {
        this.error.set('Error loading dashboard data');
        this.loading.set(false);
      }
    });
  }

  private loadTaskCategories() {
    this.isLoadingTaskCategories.set(true);
    this.taskCategoriesError.set(null);

    this.dashboardService.getTaskCategoriesWithCountsDashboardTaskCategoriesGet().subscribe({
      next: (response: any) => {
        this.taskCategories.set(response);
        this.isLoadingTaskCategories.set(false);
      },
      error: () => {
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
      error: () => {
        this.residentStatsError.set('Error loading resident statistics');
        this.isLoadingResidentStats.set(false);
      }
    });
  }

  private transformYearlyData() {
    const isWeekFilter = this.chartTimeFilter() === 'week';

    if (isWeekFilter) {
      return {
        series: [
          {
            name: 'Semana pasada',
            data: [15, 22, 18, 25, 20, 17, 12]
          },
          {
            name: 'Esta semana',
            data: [20, 25, 22, 30, 28, 24, 18]
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
          labels: {
            colors: '#000'
          },
          itemMargin: {
            vertical: 4,
            horizontal: 10
          },
          markers: {
            width: 11,
            height: 11,
            radius: 10,
            offsetX: -2
          }
        } as ApexLegend,
        states: {
          hover: {
            filter: { type: 'none' }
          },
          active: {
            filter: { type: 'none' }
          }
        },
        grid: {
          strokeDashArray: 6,
          borderColor: 'rgba(34,48,62,.2)',
          padding: {
            bottom: 5
          }
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
          categories: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'],
          tooltip: {
            style: {
              fontSize: '13px',
              fontFamily: 'Inter'
            }
          }
        } satisfies ApexXAxis,
        yaxis: {
          labels: {
            style: {
              colors: '#000',
              fontSize: '13px',
              fontFamily: 'Inter'
            }
          }
        }
      };
    } else {
      return {
        series: [
          {
            name: 'Mes pasado',
            data: [120, 150, 180, 140, 160]
          },
          {
            name: 'Anterior mes',
            data: [100, 130, 160, 120, 140]
          }
        ] as ApexAxisChartSeries,
        chart: {
          type: 'bar',
          stacked: true,
          parentHeightOffset: 6,
          height: 335,
          width: 400,
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
          labels: {
            colors: '#000'
          },
          itemMargin: {
            vertical: 4,
            horizontal: 10
          },
          markers: {
            width: 11,
            height: 11,
            radius: 10,
            offsetX: -2
          }
        } as ApexLegend,
        states: {
          hover: {
            filter: { type: 'none' }
          },
          active: {
            filter: { type: 'none' }
          }
        },
        grid: {
          strokeDashArray: 6,
          borderColor: 'rgba(34,48,62,.2)',
          padding: {
            bottom: 5
          }
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
          categories: ['1ra semana', '2da semana', '3ra semana', '4ta semana', '5ta semana'],
          tooltip: {
            style: {
              fontSize: '13px',
              fontFamily: 'Inter'
            }
          }
        } satisfies ApexXAxis,
        yaxis: {
          labels: {
            style: {
              colors: '#000',
              fontSize: '13px',
              fontFamily: 'Inter'
            }
          }
        }
      };
    }
  }

  private transformTaskCompletionRadial() {
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const previousMonth = currentMonth === 1 ? 12 : currentMonth - 1;

    // Obtener datos según el filtro seleccionado
    const selectedFilter = this.monthFilter();
    let taskCount: number;
    let labelText: string;

    if (selectedFilter === 'current') {
      taskCount = this.getMonthTaskData(currentMonth);
      labelText = 'Mes actual';
    } else {
      taskCount = this.getMonthTaskData(previousMonth);
      labelText = 'Mes anterior';
    }

    // Calcular el porcentaje de completitud (asumiendo un objetivo de 100 tareas)
    const targetTasks = 100;
    const completionPercentage = Math.min((taskCount / targetTasks) * 100, 100);

    return {
      series: [completionPercentage],
      chart: {
        height: 350,
        type: 'radialBar' as const,
        offsetY: -10
      } as ApexChart,
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
              color: '#696cff',
              fontFamily: 'Inter',
              formatter: () => `${taskCount}`
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
      labels: [labelText]
    };
  }

  private getMonthTaskData(month: number): number {
    // Simular datos más realistas de tareas completadas
    // En una implementación real, esto vendría del API
    const baseData = {
      1: 245,
      2: 312,
      3: 298,
      4: 355,
      5: 412,
      6: 389,
      7: 445,
      8: 478,
      9: 423,
      10: 467,
      11: 398,
      12: 512
    };

    return baseData[month as keyof typeof baseData] || 350;
  }

  private transformMeasurementsTrend() {
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

    const taskFilter = this.taskFilter();
    let filteredCategories = transformedCategories;

    if (taskFilter === 'active') {
      filteredCategories = transformedCategories.filter(category => category.activeTasks > 0);
    } else if (taskFilter === 'completed') {
      filteredCategories = transformedCategories.filter(category => category.completedTasks > 0);
    }

    return filteredCategories;
  }

  private transformResidentStatsLine() {
    const stats = this.residentStats();
    if (!stats) {
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
    const categories = this.taskCategories();
    const taskStats = this.dashboardData()?.task_stats;

    if (!categories || categories.length === 0) {
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
                  label: 'Completadas',
                  fontSize: '13px',
                  lineHeight: '18px',
                  formatter: () => '0',
                  color: 'rgb(3, 195, 236)',
                  fontFamily: 'Inter'
                }
              }
            }
          }
        }
      };
    }

    const series = categories.map(category => category.completed_tasks || 0);
    const totalCompleted = series.reduce((sum, count) => sum + count, 0);
    const labels = categories.map(category => category.name);

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
                label: 'Completadas',
                fontSize: '13px',
                lineHeight: '18px',
                formatter: () => `${totalCompleted}`,
                color: 'rgb(3, 195, 236)',
                fontFamily: 'Inter'
              }
            }
          }
        }
      }
    };
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

  setTaskFilter(filter: 'all' | 'active' | 'completed') {
    this.taskFilter.set(filter);
  }

  setChartTimeFilter(filter: 'week' | 'month') {
    this.chartTimeFilter.set(filter);
  }

  onMonthFilterChange(event: any) {
    this.monthFilter.set(event.value);
  }

  getMonthComparisonText(): string {
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const previousMonth = currentMonth === 1 ? 12 : currentMonth - 1;

    const monthNames = [
      'Enero',
      'Febrero',
      'Marzo',
      'Abril',
      'Mayo',
      'Junio',
      'Julio',
      'Agosto',
      'Septiembre',
      'Octubre',
      'Noviembre',
      'Diciembre'
    ];

    if (this.monthFilter() === 'current') {
      return monthNames[currentMonth - 1];
    } else {
      return monthNames[previousMonth - 1];
    }
  }

  // Método para filtrar métricas individuales sin recargar todo el dashboard
  setMetricFilter(metricTitle: string, filter: 'week' | 'month' | 'year') {
    // Nota: El nuevo endpoint de navigation-counts no usa filtros de tiempo
    // Mostramos todos los datos disponibles sin filtrar
    this.dashboardService.getNavigationCountsDashboardNavigationCountsGet$Response().subscribe({
      next: (response: any) => {
        const navigationData = response.body;

        // Actualizar solo la señal individual correspondiente con datos completos
        switch (metricTitle) {
          case 'Residentes':
            this.residentesValue.set(navigationData.residents.toString());
            break;
          case 'Dispositivos':
            this.dispositivosValue.set(navigationData.devices.toString());
            break;
          case 'Mediciones':
            this.medicionesValue.set(navigationData.measurements.toString());
            break;
          case 'Tareas':
            this.tareasValue.set(navigationData.tasks.toString());
            break;
          default:
        }
      },
      error: error => {}
    });
  }

  private waitForResidences(): void {
    const checkResidences = () => {
      const residences = this.residenceService.residences();
      if (residences && residences.length > 0) {
        this.loadDashboardData();
        this.loadTaskCategories();
        this.loadResidentStats();
      } else if (this.loading()) {
        setTimeout(checkResidences, 100);
      } else {
        this.error.set('No residences available. Please contact administrator.');
      }
    };

    checkResidences();
  }

  private loadUserInfo() {
    this.apiAuthService.meAuthMeGet().subscribe({
      next: (response: any) => {
        this.userName.set(response.alias || 'Usuario');
      },
      error: () => {
        this.userName.set('Usuario');
      }
    });
  }

  private loadRecentActivity() {
    this.isLoadingRecentActivity.set(true);
    this.recentActivityError.set(null);

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

  logout(): void {
    this.authService.logout();
  }

  // Computed properties must be defined after the methods they reference
  revenueChartData = computed(() => this.transformYearlyData());
  chartRadial = computed(() => this.transformTaskCompletionRadial());
  profitChartData = computed(() => this.transformMeasurementsTrend());
  orderCategories = computed(() => this.residenceDataWithStats());
  categories = computed(() => this.transformTaskCategories());
  lineChart = computed(() => this.transformResidentStatsLine());
  circleChart = computed(() => this.transformResidenceDistribution());

  dailyMeasurementsAverage = computed(() => {
    const measurementStats = this.dashboardData()?.measurement_stats;
    if (!measurementStats) return 0;

    const last30Days = measurementStats.last_30_days || 0;
    return Math.round(last30Days / 30);
  });

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

  totalVisibleResidences = computed(() => {
    const residences = this.residenceService.residences();
    return residences?.length || 0;
  });

  totalResidentsFromResidences = computed(() => {
    const residences = this.residenceService.residences();
    if (!residences || residences.length === 0) return 0;

    return residences.reduce(total => {
      const residentCount = Math.floor(Math.random() * 100) + 30;
      return total + residentCount;
    }, 0);
  });

  residenceDataWithStats = computed(() => {
    const residences = this.residenceService.residences();
    if (!residences || residences.length === 0) return [];

    const limitedResidences = residences.slice(0, 10);

    return limitedResidences.map((residence, index) => {
      const floorCount = Math.floor(Math.random() * 15) + 3;
      const roomCount = Math.floor(Math.random() * 50) + 20;
      const residentCount = Math.floor(Math.random() * 100) + 30;

      return {
        id: residence.id,
        name: residence.name,
        icon: 'apartment',
        floorCount: floorCount,
        roomCount: roomCount,
        residentCount: residentCount,
        color: this.getResidenceColor(index),
        percentage: Math.floor(Math.random() * 30) + 10
      };
    });
  });

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

  goToResidences() {
    this.router.navigate(['/dashboard/residences']);
  }
}
