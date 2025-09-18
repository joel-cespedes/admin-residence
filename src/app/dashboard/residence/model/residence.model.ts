import { ResidenceOut } from '../../../../openapi/generated/models/residence-out';

export interface ResidenceWithContact extends ResidenceOut {
  phone?: string;
  email?: string;
  created_at: string;
  updated_at?: string;
}

export interface ResidenceFormData {
  id?: string;
  name: string;
  address: string;
  phone: string;
  email: string;
}
