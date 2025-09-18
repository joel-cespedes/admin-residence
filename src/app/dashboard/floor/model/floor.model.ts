import { FloorOut } from '../../../../openapi/generated/models/floor-out';

export interface FloorWithDetails extends FloorOut {
  residence_name?: string;
  created_at: string;
  updated_at?: string;
}

export interface FloorFormData {
  id?: string;
  name: string;
  residence_id: string;
}