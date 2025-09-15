import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { MatBadgeModule } from '@angular/material/badge';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatSelectModule } from '@angular/material/select';
import { MatToolbarModule } from '@angular/material/toolbar';
import { RouterModule } from '@angular/router';
import { NgApexchartsModule } from 'ng-apexcharts';

import {
  CHART_RADIAL,
  CIRCLE_CHART,
  EWVENUE_CHART_DATA,
  LINE_CHART,
  METRICS,
  ORDER_CATEGORIES,
  PROFIT_CHART_DATA,
  TRANSACTIONS
} from '../shared/charts-dashboard';

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
