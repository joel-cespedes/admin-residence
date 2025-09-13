import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatMenuModule } from '@angular/material/menu';
import { MatBadgeModule } from '@angular/material/badge';
import { NgApexchartsModule } from 'ng-apexcharts';

interface DashboardMetric {
  title: string;
  value: string;
  change: string;
  changeType: 'positive' | 'negative';
  icon: string;
  color: string;
  colorIcon?: string;
}

interface Transaction {
  id: string;
  type: string;
  company: string;
  amount: string;
  status: 'positive' | 'negative';
  icon: string;
  color: string;
}

interface OrderCategory {
  name: string;
  icon: string;
  percentage: number;
  count: number;
  color: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, MatIconModule, MatToolbarModule, MatMenuModule, MatBadgeModule, NgApexchartsModule],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.scss']
})
export class DashboardComponent implements OnInit {
  isDarkTheme = signal(false);
  sidebarCollapsed = signal(false);

  metrics = signal<DashboardMetric[]>([
    {
      title: 'Profit',
      value: '$12,628',
      change: '+72.8%',
      changeType: 'positive',
      icon: 'monitoring',
      color: 'profit',
      colorIcon: '#72DD38'
    },
    {
      title: 'Sales',
      value: '$4,679',
      change: '+28.42%',
      changeType: 'positive',
      icon: 'monitoring',
      color: 'sales',
      colorIcon: '#67DBF4'
    },
    {
      title: 'Payments',
      value: '$2,468',
      change: '-14.82%',
      changeType: 'negative',
      icon: 'monitoring',
      color: 'payments',
      colorIcon: '#FF3E1D'
    },
    {
      title: 'Transactions',
      value: '$14,857',
      change: '+28.14%',
      changeType: 'positive',
      icon: 'monitoring',
      color: 'transactions',
      colorIcon: '#A5A7FF'
    }
  ]);

  // ApexCharts data for Total Revenue
  revenueChartData = signal({
    series: [
      { name: '2024', data: [18, 7, 15, 29, 18, 12, 9] },
      { name: '2023', data: [-13, -18, -9, -14, -5, -17, -15] }
    ] as ApexAxisChartSeries,

    chart: {
      type: 'bar',
      height: 300,
      stacked: true,
      toolbar: { show: false },
      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    } satisfies ApexChart,

    colors: ['#696cff', '#03c3ec'],

    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: '30%',
        borderRadius: 4,
        borderRadiusApplication: 'end',
        dataLabels: { position: 'top' }
      }
    } satisfies ApexPlotOptions,

    dataLabels: { enabled: false } as ApexDataLabels,

    grid: {
      show: true,
      borderColor: 'rgba(34,48,62,.12)',
      strokeDashArray: 3,
      padding: { left: 0, right: 0, top: 0, bottom: 0 }
    } as ApexGrid,

    legend: {
      show: true,
      position: 'top',
      horizontalAlign: 'left',
      offsetY: 6,
      markers: { width: 8, height: 8, radius: 8 }
    } as ApexLegend,

    tooltip: {
      shared: true,
      intersect: false,
      x: { show: false },
      y: { formatter: (v: number) => `${v > 0 ? '' : ''}${v}` }
    } as ApexTooltip,

    xaxis: {
      categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'],
      axisBorder: { show: false },
      axisTicks: { show: false },
      labels: { style: { fontSize: '12px' } }
    } as ApexXAxis,

    yaxis: {
      // En el demo se perciben ticks simétricos (cuando hay negativos):
      tickAmount: 4,
      labels: { style: { fontSize: '12px' } }
    } as ApexYAxis
  });

  // ApexCharts data for Profit trend (small chart in Order Statistics)
  profitChartData = signal({
    series: [
      {
        name: 'Profit',
        data: [3350, 3350, 4800, 4800, 2950, 2950, 1800, 1800, 3750, 3750, 5700, 5700]
      }
    ] as ApexAxisChartSeries,

    chart: {
      type: 'area',
      height: 80,
      sparkline: { enabled: true },
      animations: { enabled: false }, // estático como la tarjeta
      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    } satisfies ApexChart,

    colors: ['#696cff'],

    stroke: {
      curve: 'smooth',
      width: 2
    } satisfies ApexStroke,

    fill: {
      type: 'gradient',
      gradient: {
        shade: 'light',
        shadeIntensity: 1,
        opacityFrom: 0.35,
        opacityTo: 0.05,
        stops: [0, 90, 100]
      }
    } satisfies ApexFill,

    dataLabels: { enabled: false } as ApexDataLabels,
    grid: { show: false } as ApexGrid,
    xaxis: {
      labels: { show: false },
      axisBorder: { show: false },
      axisTicks: { show: false }
    } as ApexXAxis,
    yaxis: { labels: { show: false } } as ApexYAxis,

    tooltip: { enabled: false } // tarjeta “limpia” como la del demo
  });
  orderCategories = signal<OrderCategory[]>([
    {
      name: 'Electronic',
      icon: 'devices',
      percentage: 82.5,
      count: 849,
      color: 'rgb(105, 108, 255)'
    },
    {
      name: 'Fashion',
      icon: 'checkroom',
      percentage: 23.8,
      count: 237,
      color: 'rgb(113, 221, 55)'
    },
    {
      name: 'Decor',
      icon: 'palette',
      percentage: 84.9,
      count: 849,
      color: 'rgb(3, 195, 236)'
    },
    {
      name: 'Sports',
      icon: 'sports_soccer',
      percentage: 9.9,
      count: 99,
      color: 'rgb(255, 171, 0)'
    }
  ]);

  transactions = signal<Transaction[]>([
    {
      id: '1',
      type: 'Send money',
      company: 'PayPal',
      amount: '+$82.6',
      status: 'positive',
      icon: 'account_balance',
      color: '#0070ba'
    },
    {
      id: '2',
      type: 'MacD',
      company: 'Wallet',
      amount: '+$270.69',
      status: 'positive',
      icon: 'account_balance_wallet',
      color: 'rgb(105, 108, 255)'
    },
    {
      id: '3',
      type: 'Refund',
      company: 'Transfer',
      amount: '+$637.91',
      status: 'positive',
      icon: 'swap_horiz',
      color: 'rgb(3, 195, 236)'
    },
    {
      id: '4',
      type: 'Ordered Food',
      company: 'Credit Card',
      amount: '-$838.71',
      status: 'negative',
      icon: 'credit_card',
      color: 'rgb(113, 221, 55)'
    },
    {
      id: '5',
      type: 'Starbucks',
      company: 'Wallet',
      amount: '+$203.33',
      status: 'positive',
      icon: 'local_cafe',
      color: 'rgb(105, 108, 255)'
    },
    {
      id: '6',
      type: 'Ordered Food',
      company: 'Mastercard',
      amount: '-$92.45',
      status: 'negative',
      icon: 'restaurant',
      color: 'rgb(255, 171, 0)'
    }
  ]);

  ngOnInit() {
    // const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    //  this.isDarkTheme.set(prefersDark);
    this.isDarkTheme.set(false);
    this.applyTheme();
  }

  toggleTheme() {
    this.isDarkTheme.update(current => !current);
    this.applyTheme();
  }

  toggleSidebar() {
    this.sidebarCollapsed.update(current => !current);
    const sidebar = document.querySelector('.layout__sidebar');
    if (sidebar) {
      sidebar.classList.toggle('layout__sidebar--open');
    }
  }

  private applyTheme() {
    const theme = this.isDarkTheme() ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', theme);
  }
}
