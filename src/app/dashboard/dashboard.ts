import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatMenuModule } from '@angular/material/menu';
import { MatBadgeModule } from '@angular/material/badge';
import { CHART_RADIAL, CIRCLE_CHART, EWVENUE_CHART_DATA, LINE_CHART, METRICS, ORDER_CATEGORIES, PROFIT_CHART_DATA, TRANSACTIONS } from './charts/charts-dashboard';
import { NgApexchartsModule } from 'ng-apexcharts';
import { MatSelectModule } from '@angular/material/select';
@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, MatSelectModule, MatIconModule, MatToolbarModule, MatMenuModule, MatBadgeModule, NgApexchartsModule],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.scss']
})
export class DashboardComponent implements OnInit {
  isDarkTheme = signal(false);
  sidebarCollapsed = signal(false);

  metrics = METRICS;
  revenueChartData = EWVENUE_CHART_DATA;
  chartRadial = CHART_RADIAL;
  profitChartData = PROFIT_CHART_DATA;
  orderCategories = ORDER_CATEGORIES;
  transactions = TRANSACTIONS;
  lineChart = LINE_CHART;
  circleChart = CIRCLE_CHART;
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
