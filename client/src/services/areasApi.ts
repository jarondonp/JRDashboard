import { apiGet, apiPost, apiPut, apiDelete } from './apiClient';

export type AreaInput = {
  name: string;
  description?: string;
  type: string;
  color: string; // e.g. "#ffffff"
  icon?: string;
};

export type Area = AreaInput & {
  id: string;
  created_at?: string;
  updated_at?: string;
};

export async function fetchAreas(): Promise<Area[]> {
  return apiGet<Area[]>('/areas');
}

export async function fetchArea(id: string): Promise<Area> {
  return apiGet<Area>(`/areas/${id}`);
}

export async function createArea(data: AreaInput): Promise<Area> {
  return apiPost<Area>('/areas', data);
}

export async function updateArea(id: string, data: AreaInput): Promise<Area> {
  return apiPut<Area>(`/areas/${id}`, data);
}

export async function deleteArea(id: string): Promise<void> {
  await apiDelete<void>(`/areas/${id}`);
}

export default { fetchAreas, fetchArea, createArea, updateArea, deleteArea };
