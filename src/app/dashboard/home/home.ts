import { CommonModule } from '@angular/common';
import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { MatBadgeModule } from '@angular/material/badge';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatSelectModule } from '@angular/material/select';
import { MatToolbarModule } from '@angular/material/toolbar';
import { RouterModule } from '@angular/router';
import { NgApexchartsModule } from 'ng-apexcharts';

import { DashboardService } from '../../../openapi/generated/services/dashboard.service';
import { DashboardData } from '../../../openapi/generated/models/dashboard-data';
import { ResidenceService } from '@core';
import { toObservable } from '@angular/core/rxjs-interop';
import { take } from 'rxjs';
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

  // Dashboard data signals
  dashboardData = signal<DashboardData | null>(null);

  // Computed signals for charts
  metrics = computed(() => this.dashboardData()?.metrics || []);
  revenueChartData = computed(() => this.transformYearlyData());
  chartRadial = computed(() => this.transformTaskCompletionRadial());
  profitChartData = computed(() => this.transformMeasurementsTrend());
  orderCategories = computed(() => this.transformTaskCategories());
  transactions = computed(() => this.transformRecentActivity());
  lineChart = computed(() => this.transformActivityTrend());
  circleChart = computed(() => this.transformDeviceDistribution());

  ngOnInit() {
    this.isDarkTheme.set(false);
    this.applyTheme();
    this.initializeDashboard();
  }

  private initializeDashboard() {
    // Ensure residences are loaded before getting dashboard data
    const residences = this.residenceService.residences();

    if (residences && residences.length > 0) {
      this.loadDashboardData();
    } else {
      // Wait for residences to load
      toObservable(this.residenceService.residences)
        .pipe(take(1))
        .subscribe({
          next: (residencesList) => {
            if (residencesList && residencesList.length > 0) {
              this.loadDashboardData();
            } else {
              this.error.set('No residences available. Please contact administrator.');
              this.loading.set(false);
            }
          },
          error: () => {
            this.error.set('Error loading residences');
            this.loading.set(false);
          }
        });
    }
  }

  private loadDashboardData() {
    this.loading.set(true);
    this.error.set(null);

    // The residence interceptor will automatically add the X-Residence-Id header
    this.dashboardService.getDashboardDataDashboardGet$Response().subscribe({
      next: (response) => {
        this.dashboardData.set(response.body);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error loading dashboard data:', err);
        this.error.set('Error loading dashboard data');
        this.loading.set(false);
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
    const trendData = [last30Days * 0.7, last30Days * 0.8, last30Days * 0.9, last30Days * 0.85, last30Days, last30Days * 1.1, last30Days * 1.05, last30Days];

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
            [{
              offset: 0,
              opacity: 0.4,
              color: '#696cff'
            }, {
              offset: 100,
              opacity: 0.2,
              color: '#03c3ec'
            }]
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
    const taskStats = this.dashboardData()?.task_stats?.by_category || {};
    const total = Object.values(taskStats).reduce((sum, cat: any) => sum + cat.total, 0);

    return Object.entries(taskStats).map(([name, data]: [string, any]) => ({
      name,
      icon: this.getCategoryIcon(name),
      percentage: total > 0 ? (data.completed / total) * 100 : 0,
      color: this.getCategoryColor(name)
    }));
  }

  private transformRecentActivity() {
    const activities = this.dashboardData()?.recent_activity || [];

    return activities.slice(0, 6).map((activity: any) => ({
      id: activity.id,
      type: activity.type,
      company: this.getActivityDescription(activity),
      amount: this.getActivityAmount(activity),
      status: this.getActivityStatus(activity),
      icon: this.getActivityIcon(activity.type),
      color: this.getActivityColor(activity.type)
    }));
  }

  private transformActivityTrend() {
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

  private transformDeviceDistribution() {
    const deviceStats = this.dashboardData()?.device_stats?.by_type || {};
    const total = Object.values(deviceStats).reduce((sum, count) => sum + count, 0);

    return {
      series: Object.values(deviceStats),
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
      labels: Object.keys(deviceStats),
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
                label: 'Devices',
                fontSize: '13px',
                lineHeight: '18px',
                formatter: () => `${total}`,
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
      'Medicación': 'medication',
      'Higiene': 'sanitizer',
      'Alimentación': 'restaurant',
      'Ejercicio': 'fitness_center',
      'Social': 'groups'
    };
    return iconMap[name] || 'category';
  }

  private getCategoryColor(name: string): string {
    const colorMap: Record<string, string> = {
      'Medicación': 'btn_red',
      'Higiene': 'btn_green',
      'Alimentación': 'btn_lightblue',
      'Ejercicio': 'btn_darkblue',
      'Social': 'btn_gray'
    };
    return colorMap[name] || 'btn_gray';
  }

  private getActivityDescription(activity: any): string {
    switch (activity.type) {
      case 'resident': return 'Residencia';
      case 'measurement': return 'Medición';
      case 'task': return 'Tarea';
      default: return 'Actividad';
    }
  }

  private getActivityAmount(activity: any): string {
    if (activity.type === 'measurement') {
      return `+${activity.measurement_type}`;
    }
    return '+1';
  }

  private getActivityStatus(activity: any): 'positive' | 'negative' {
    return activity.status === 'active' ? 'positive' : 'negative';
  }

  private getActivityIcon(type: string): string {
    const iconMap: Record<string, string> = {
      'resident': 'people',
      'measurement': 'monitoring',
      'task': 'task_alt'
    };
    return iconMap[type] || 'info';
  }

  private getActivityColor(type: string): string {
    const colorMap: Record<string, string> = {
      'resident': 'btn_green',
      'measurement': 'btn_lightblue',
      'task': 'btn_darkblue'
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
}
