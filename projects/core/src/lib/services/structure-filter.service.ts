import { Injectable, signal } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';

export interface FilterOptions {
  residence_id?: string;
  floor_id?: string;
  room_id?: string;
  bed_id?: string;
  search?: string;
  page?: number;
  size?: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

export interface EntityType {
  name: string;
  hasResidenceFilter: boolean;
  hasFloorFilter: boolean;
  hasRoomFilter: boolean;
  hasBedFilter: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class StructureFilterService {
  private baseUrl = 'https://back-residence.onrender.com';

  // Entity configurations
  private entities: Record<string, EntityType> = {
    residences: {
      name: 'residences',
      hasResidenceFilter: false,
      hasFloorFilter: false,
      hasRoomFilter: false,
      hasBedFilter: false
    },
    floors: {
      name: 'floors',
      hasResidenceFilter: true,
      hasFloorFilter: false,
      hasRoomFilter: false,
      hasBedFilter: false
    },
    rooms: {
      name: 'rooms',
      hasResidenceFilter: true,
      hasFloorFilter: true,
      hasRoomFilter: false,
      hasBedFilter: false
    },
    beds: {
      name: 'beds',
      hasResidenceFilter: true,
      hasFloorFilter: true,
      hasRoomFilter: true,
      hasBedFilter: false
    },
    residents: {
      name: 'residents',
      hasResidenceFilter: true,
      hasFloorFilter: true,
      hasRoomFilter: true,
      hasBedFilter: true
    }
  };

  // Generic filter state for each entity type
  private filterStates = signal<Record<string, FilterOptions>>({
    residences: { page: 1, size: 10 },
    floors: { page: 1, size: 10 },
    rooms: { page: 1, size: 10 },
    beds: { page: 1, size: 10 },
    residents: { page: 1, size: 10 }
  });

  constructor(private http: HttpClient) {}

  // Get auth headers
  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('auth_token');
    return new HttpHeaders().set('Authorization', `Bearer ${token}`);
  }

  // Get filter state for entity
  getFilters(entityType: string): FilterOptions {
    return this.filterStates()[entityType] || {};
  }

  // Update filter state for entity
  updateFilters(entityType: string, filters: Partial<FilterOptions>) {
    const current = this.filterStates()[entityType] || {};
    this.filterStates.update(state => ({
      ...state,
      [entityType]: { ...current, ...filters }
    }));
  }

  // Set individual filter values
  setResidenceFilter(entityType: string, residenceId: string) {
    const current = this.getFilters(entityType);
    this.updateFilters(entityType, {
      ...current,
      residence_id: residenceId,
      floor_id: undefined,
      room_id: undefined,
      bed_id: undefined,
      page: 1
    });
  }

  setFloorFilter(entityType: string, floorId: string) {
    const current = this.getFilters(entityType);
    this.updateFilters(entityType, {
      ...current,
      floor_id: floorId,
      room_id: undefined,
      bed_id: undefined,
      page: 1
    });
  }

  setRoomFilter(entityType: string, roomId: string) {
    const current = this.getFilters(entityType);
    this.updateFilters(entityType, {
      ...current,
      room_id: roomId,
      bed_id: undefined,
      page: 1
    });
  }

  setBedFilter(entityType: string, bedId: string) {
    const current = this.getFilters(entityType);
    this.updateFilters(entityType, {
      ...current,
      bed_id: bedId,
      page: 1
    });
  }

  setSearchFilter(entityType: string, search: string) {
    const current = this.getFilters(entityType);
    this.updateFilters(entityType, {
      ...current,
      search: search || undefined,
      page: 1
    });
  }

  setPagination(entityType: string, page: number, size: number) {
    const current = this.getFilters(entityType);
    this.updateFilters(entityType, {
      ...current,
      page,
      size
    });
  }

  resetFilters(entityType: string) {
    this.updateFilters(entityType, {
      page: 1,
      size: 10
    });
  }

  resetAllFilters(entityType: string) {
    this.updateFilters(entityType, {
      page: 1,
      size: 10,
      residence_id: undefined,
      floor_id: undefined,
      room_id: undefined,
      bed_id: undefined,
      search: undefined
    });
  }

  // Build URL with filters based on entity type
  private buildUrl(entityType: string, options?: FilterOptions): string {
    const entity = this.entities[entityType];
    if (!entity) {
      throw new Error(`Unknown entity type: ${entityType}`);
    }

    const filters = this.getFilters(entityType);
    const finalOptions = { ...filters, ...options };
    const params = new URLSearchParams();

    // Always add pagination
    params.append('page', finalOptions.page?.toString() || '1');
    params.append('size', finalOptions.size?.toString() || '10');

    // Add entity-specific filters
    if (entity.hasResidenceFilter && finalOptions.residence_id) {
      params.append('residence_id', finalOptions.residence_id);
    }
    if (entity.hasFloorFilter && finalOptions.floor_id) {
      params.append('floor_id', finalOptions.floor_id);
    }
    if (entity.hasRoomFilter && finalOptions.room_id) {
      params.append('room_id', finalOptions.room_id);
    }
    if (entity.hasBedFilter && finalOptions.bed_id) {
      params.append('bed_id', finalOptions.bed_id);
    }

    // Add search if provided
    if (finalOptions.search) {
      params.append('search', finalOptions.search);
    }

    // Add sorting if provided
    if (finalOptions.sort_by) {
      params.append('sort_by', finalOptions.sort_by);
      if (finalOptions.sort_order) {
        params.append('sort_order', finalOptions.sort_order);
      }
    }

    return `${this.baseUrl}/${entity.name}?${params.toString()}`;
  }

  // Generic API method
  async getEntity(entityType: string, options?: FilterOptions) {
    const url = this.buildUrl(entityType, options);
    return this.http.get<any>(url, { headers: this.getAuthHeaders() }).toPromise();
  }

  // Convenience methods for each entity
  async getResidences(options?: FilterOptions) {
    return this.getEntity('residences', options);
  }

  async getFloors(options?: FilterOptions) {
    return this.getEntity('floors', options);
  }

  async getRooms(options?: FilterOptions) {
    return this.getEntity('rooms', options);
  }

  async getBeds(options?: FilterOptions) {
    return this.getEntity('beds', options);
  }

  async getResidents(options?: FilterOptions) {
    return this.getEntity('residents', options);
  }

  // Methods for dropdown/populate filters
  async getFloorsByResidence(residenceId: string) {
    return this.getFloors({ residence_id: residenceId, size: 1000 }); // Get all for dropdown
  }

  async getRoomsByFloor(floorId: string) {
    return this.getRooms({ floor_id: floorId, size: 1000 });
  }

  async getBedsByRoom(roomId: string) {
    return this.getBeds({ room_id: roomId, size: 1000 });
  }

  async getRoomsByResidence(residenceId: string) {
    return this.getRooms({ residence_id: residenceId, size: 1000 });
  }

  async getBedsByResidence(residenceId: string) {
    return this.getBeds({ residence_id: residenceId, size: 1000 });
  }

  async getBedsByFloor(floorId: string) {
    return this.getBeds({ floor_id: floorId, size: 1000 });
  }

  // Get simple list (for dropdowns that don't need pagination)
  async getSimpleList(entityType: string, parentId?: string, parentType?: string) {
    const options: FilterOptions = { size: 1000 }; // Get all for dropdown

    if (parentId && parentType) {
      switch (parentType) {
        case 'residence':
          options.residence_id = parentId;
          break;
        case 'floor':
          options.floor_id = parentId;
          break;
        case 'room':
          options.room_id = parentId;
          break;
      }
    }

    return this.getEntity(entityType, options);
  }
}
