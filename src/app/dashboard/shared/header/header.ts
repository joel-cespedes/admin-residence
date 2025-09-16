import { Component, signal, OnInit } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatBadgeModule } from '@angular/material/badge';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'movsa-header',
  standalone: true,
  imports: [MatCardModule, MatIconModule, MatButtonModule, MatBadgeModule],
  templateUrl: './header.html',
  styleUrl: './header.scss'
})
export class Header implements OnInit {
  isDarkTheme = signal(false);
  sidebarCollapsed = signal(false);

  ngOnInit() {
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

  closeSidebar() {
    this.sidebarCollapsed.set(false);
    const sidebar = document.querySelector('.layout__sidebar');
    if (sidebar) {
      sidebar.classList.remove('layout__sidebar--open');
    }
  }

  private applyTheme() {
    const theme = this.isDarkTheme() ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', theme);
  }
}
