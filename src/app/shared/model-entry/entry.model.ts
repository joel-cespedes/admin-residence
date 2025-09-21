export interface ResidenceWithContact {
  id: string;
  name: string;
  address: string;
  phone: string;
  email: string;
  created_at: string;
  updated_at: string | null;
}

export interface FloorWithDetails {
  id: string;
  name: string;
  residence_id: string;
  residence_name: string;
  created_at: string;
  updated_at: string | null;
}

export interface RoomWithDetails {
  id: string;
  name: string;
  residence_id: string;
  floor_id: string;
  residence_name: string;
  floor_name: string;
  created_at: string;
  updated_at: string | null;
}

export interface BedWithDetails {
  id: string;
  name: string;
  residence_id: string;
  room_id: string;
  residence_name: string;
  room_name: string;
  floor_name: string;
  resident_name: string;
  created_at: string;
  updated_at: string | null;
}

export interface ResidentWithDetails {
  id: string;
  full_name: string;
  residence_id: string;
  floor_id: string;
  room_id: string;
  bed_id: string;
  residence_name: string;
  floor_name: string;
  room_name: string;
  bed_name: string;
  status: string;
  created_at: string;
  updated_at: string | null;
}

// Tipos genéricos para el componente base
export type EntityType = 'residences' | 'floors' | 'rooms' | 'beds' | 'residents';

export interface FilterState {
  residence_id: string;
  floor_id: string;
  room_id: string;
  bed_id: string;
  search: string;
}

export interface PaginationState {
  page: number;
  size: number;
  total: number;
}
