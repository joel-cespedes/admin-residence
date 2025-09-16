import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ResidenceService } from '@core';
import { Router } from '@angular/router';
import { Residence } from '@core';

@Component({
  selector: 'app-select-residence',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatSelectModule,
    MatProgressSpinnerModule
  ],
  template: `
    <div class="select-residence-container">
      <mat-card class="select-residence-card">
        <mat-card-header>
          <mat-card-title>Seleccionar Residencia</mat-card-title>
          <mat-card-subtitle>
            Por favor, selecciona una residencia para continuar
          </mat-card-subtitle>
        </mat-card-header>

        <mat-card-content>
          <div *ngIf="residenceService.isLoading()" class="loading-container">
            <mat-spinner diameter="50"></mat-spinner>
            <p>Cargando residencias...</p>
          </div>

          <div *ngIf="residenceService.error()" class="error-message">
            <p>{{ residenceService.error() }}</p>
          </div>

          <div *ngIf="!residenceService.isLoading() && !residenceService.error()" class="form-container">
            <mat-form-field appearance="outline" class="residence-select">
              <mat-label>Residencia</mat-label>
              <mat-select
                [(ngModel)]="selectedResidenceId"
                (selectionChange)="onResidenceSelect()"
                placeholder="Selecciona una residencia">
                <mat-option *ngFor="let residence of residenceService.residences()" [value]="residence.id">
                  {{ residence.name }}
                </mat-option>
              </mat-select>
            </mat-form-field>
          </div>
        </mat-card-content>

        <mat-card-actions>
          <button
            mat-raised-button
            color="primary"
            (click)="onResidenceSelect()"
            [disabled]="!selectedResidenceId || residenceService.isLoading()">
            Continuar
          </button>
        </mat-card-actions>
      </mat-card>
    </div>
  `,
  styles: [`
    .select-residence-container {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      background-color: #f5f5f5;
      padding: 20px;
    }

    .select-residence-card {
      max-width: 500px;
      width: 100%;
    }

    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 40px 0;
      gap: 16px;
    }

    .error-message {
      color: #f44336;
      padding: 16px 0;
      text-align: center;
    }

    .form-container {
      padding: 20px 0;
    }

    .residence-select {
      width: 100%;
    }

    mat-card-actions {
      display: flex;
      justify-content: flex-end;
      padding: 16px 0;
    }
  `]
})
export class SelectResidenceComponent implements OnInit {
  selectedResidenceId: string | null = null;

  constructor(
    public residenceService: ResidenceService,
    private router: Router
  ) {}

  ngOnInit() {
    // Load residences if not already loaded
    if (this.residenceService.residences().length === 0) {
      this.residenceService.loadUserResidences().subscribe();
    }
  }

  onResidenceSelect() {
    if (this.selectedResidenceId) {
      this.residenceService.selectResidence(this.selectedResidenceId);
      this.router.navigate(['/dashboard']);
    }
  }
}