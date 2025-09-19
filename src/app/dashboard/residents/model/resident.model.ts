import { inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

// Base API interfaces
export interface ResidentOut {
  id: string;
  residence_id: string;
  full_name: string;
  birth_date: string;
  sex?: string | null;
  gender?: string | null;
  comments?: string | null;
  status: 'active' | 'discharged' | 'deceased';
  status_changed_at?: string | null;
  deleted_at?: string | null;
  bed_id?: string | null;
  created_at: string;
  updated_at?: string;
}

export interface ResidentCreate {
  full_name: string;
  birth_date: string;
  sex?: string | null;
  gender?: string | null;
  comments?: string | null;
  status?: 'active' | 'discharged' | 'deceased';
  bed_id?: string | null;
}

export interface ResidentUpdate {
  full_name?: string | null;
  birth_date?: string | null;
  sex?: string | null;
  gender?: string | null;
  comments?: string | null;
  status?: 'active' | 'discharged' | 'deceased' | null;
  bed_id?: string | null;
}

export interface ResidentChangeBed {
  new_bed_id: string;
  changed_at?: string | null;
}

// Extended interface with related data
export interface ResidentWithDetails extends ResidentOut {
  residence_name?: string;
  bed_name?: string;
  room_name?: string;
  floor_name?: string;
  created_at: string;
  updated_at?: string;
}

// Form data interface
export interface ResidentFormData {
  full_name: string;
  birth_date: string;
  sex?: string;
  gender?: string;
  comments?: string;
  status: 'active' | 'discharged' | 'deceased';
  residence_id: string;
  floor_id?: string;
  room_id?: string;
  bed_id?: string;
}

// API Service
export class ResidentsService {
  private apiUrl = environment.apiUrl;
  private http = inject(HttpClient);

  private getHeaders() {
    const token = localStorage.getItem('access_token');
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  }

  listResidents(params?: {
    page?: number;
    size?: number;
    search?: string;
    'X-Residence-Id'?: string;
  }): Observable<{
    items: ResidentWithDetails[];
    total?: number;
    page?: number;
    size?: number;
    pages?: number;
  }> {
    const headers = this.getHeaders();
    return this.http.get<{
      items: ResidentWithDetails[];
      total?: number;
      page?: number;
      size?: number;
      pages?: number;
    }>(`${this.apiUrl}/residents/`, { headers, params });
  }

  getResident(id: string): Observable<ResidentWithDetails> {
    const headers = this.getHeaders();
    return this.http.get<ResidentWithDetails>(`${this.apiUrl}/residents/${id}`, { headers });
  }

  createResident(data: ResidentCreate): Observable<ResidentOut> {
    const headers = this.getHeaders();
    return this.http.post<ResidentOut>(`${this.apiUrl}/residents/`, data, { headers });
  }

  updateResident(id: string, data: ResidentUpdate): Observable<ResidentOut> {
    const headers = this.getHeaders();
    return this.http.put<ResidentOut>(`${this.apiUrl}/residents/${id}`, data, { headers });
  }

  deleteResident(id: string): Observable<void> {
    const headers = this.getHeaders();
    return this.http.delete<void>(`${this.apiUrl}/residents/${id}`, { headers });
  }

  changeResidentBed(residentId: string, data: ResidentChangeBed): Observable<ResidentOut> {
    const headers = this.getHeaders();
    return this.http.patch<ResidentOut>(`${this.apiUrl}/residents/${residentId}/bed`, data, { headers });
  }
}