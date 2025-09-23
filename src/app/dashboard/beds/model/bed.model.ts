import { BedOut } from '../../../../openapi/generated/models/bed-out';

export interface BedWithDetails extends BedOut {
  room_name?: string;
  floor_name?: string;
  residence_name?: string;
  resident_name?: string;
  created_at: string;
  updated_at?: string;
}

export interface BedFormData {
  name: string;
  residence_id: string;
  floor_id: string;
  room_id: string;
}

export interface ResidenceOption {
  id: string;
  name: string;
}

export interface FloorOption {
  id: string;
  name: string;
}

export interface RoomOption {
  id: string;
  name: string;
}

export interface BedFilters {
  residence_id: string;
  floor_id: string;
  room_id: string;
  search: string;
}
