import { RoomOut } from '../../../../openapi/generated/models/room-out';

export interface RoomWithDetails extends RoomOut {
  floor_name?: string;
  residence_name?: string;
  created_at: string;
  updated_at?: string;
}

export interface RoomFormData {
  name: string;
  residence_id: string;
  floor_id: string;
}