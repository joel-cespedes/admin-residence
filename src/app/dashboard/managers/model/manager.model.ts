import { inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

// Interface para la salida de datos de gestor
export interface ManagerOut {
  id: string;
  username: string;
  email: string;
  full_name: string;
  phone?: string | null;
  status: 'active' | 'inactive' | 'suspended';
  role: 'manager' | 'admin';
  created_at: string;
  updated_at?: string;
  last_login?: string | null;
  created_by?: string | null;  // ID del usuario que lo creó
  created_by_name?: string | null;  // Nombre del usuario que lo creó (solo para superadmin)
}

// Interface para crear un nuevo gestor
export interface ManagerCreate {
  username: string;
  email: string;
  full_name: string;
  phone?: string;
  password: string;
  residence_ids: string[];  // Array de IDs de residencias a las que tiene acceso
  status?: 'active' | 'inactive' | 'suspended';
}

// Interface para actualizar un gestor existente
export interface ManagerUpdate {
  username?: string;
  email?: string;
  full_name?: string;
  phone?: string;
  password?: string;
  residence_ids?: string[];
  status?: 'active' | 'inactive' | 'suspended';
}

// Interface para los datos del formulario
export interface ManagerFormData {
  username: string;
  email: string;
  full_name: string;
  phone?: string;
  password?: string;  // Opcional en edición
  residence_ids: string[];
  status: 'active' | 'inactive' | 'suspended';
}

// Interface para gestor con detalles adicionales
export interface ManagerWithDetails extends ManagerOut {
  residence_ids: string[];     // IDs de las residencias asignadas
  residence_names: string[];  // Nombres de las residencias para mostrar
  residence_count: number;   // Cantidad de residencias asignadas
}

// Interface para la respuesta paginada
export interface PaginatedManagersResponse {
  items: ManagerWithDetails[];
  total: number;
  page: number;
  size: number;
  pages: number;
  has_next: boolean;
  has_prev: boolean;
}

// Servicio para la API de gestores (usuarios con rol gestor)
export class ManagersService {
  private apiUrl = environment.apiUrl;
  private http = inject(HttpClient);

  private getHeaders() {
    const token = localStorage.getItem('access_token');
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    };
  }

  // Listar gestores (usuarios con rol gestor) con paginación y filtros
  listManagers(params?: {
    page?: number;
    size?: number;
    search?: string;
    residence_id?: string;
    status?: string;
  }): Observable<PaginatedManagersResponse> {
    const headers = this.getHeaders();

    // Llamar al endpoint de usuarios filtrando por rol gestor
    const httpParams = {
      ...params,
      role: 'gestor'  // Filtrar solo usuarios con rol gestor
    };

    return this.http.get<PaginatedManagersResponse>(`${this.apiUrl}/users/`, {
      headers,
      params: httpParams
    });
  }

  // Obtener un gestor específico (usuario con rol gestor)
  getManager(id: string): Observable<ManagerWithDetails> {
    const headers = this.getHeaders();
    return this.http.get<ManagerWithDetails>(`${this.apiUrl}/users/${id}`, { headers });
  }

  // Crear un nuevo gestor (crear usuario con rol gestor)
  createManager(manager: ManagerCreate): Observable<ManagerOut> {
    const headers = this.getHeaders();

    // Agregar el rol gestor al crear el usuario
    const userData = {
      ...manager,
      role: 'gestor'
    };

    return this.http.post<ManagerOut>(`${this.apiUrl}/users/`, userData, { headers });
  }

  // Actualizar un gestor existente
  updateManager(id: string, manager: ManagerUpdate): Observable<ManagerOut> {
    const headers = this.getHeaders();
    return this.http.put<ManagerOut>(`${this.apiUrl}/users/${id}`, manager, { headers });
  }

  // Eliminar un gestor (eliminar usuario)
  deleteManager(id: string): Observable<void> {
    const headers = this.getHeaders();
    return this.http.delete<void>(`${this.apiUrl}/users/${id}`, { headers });
  }

  // Obtener residencias disponibles para asignar a gestores
  getAvailableResidences(): Observable<Array<{ id: string; name: string }>> {
    const headers = this.getHeaders();
    return this.http.get<Array<{ id: string; name: string }>>(`${this.apiUrl}/residences/simple`, { headers });
  }

  // Asignar residencias a un gestor (muchos a muchos)
  assignResidencesToManager(managerId: string, residenceIds: string[]): Observable<void> {
    const headers = this.getHeaders();
    return this.http.post<void>(`${this.apiUrl}/users/${managerId}/residences`, {
      residence_ids: residenceIds
    }, { headers });
  }

  // Obtener residencias asignadas a un gestor
  getManagerResidences(managerId: string): Observable<Array<{ id: string; name: string }>> {
    const headers = this.getHeaders();
    return this.http.get<Array<{ id: string; name: string }>>(`${this.apiUrl}/users/${managerId}/residences`, { headers });
  }
}