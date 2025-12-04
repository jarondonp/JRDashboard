import { apiGet, apiPost, apiPut, apiDelete } from './apiClient';

export type DocumentInput = {
  area_id: string;
  project_id?: string | null;
  goal_id?: string | null;
  task_id?: string;
  title: string;
  description?: string;
  url?: string;
  doc_type?: string;
  review_date?: string;
};

export type Document = DocumentInput & {
  id: string;
  taskTitle?: string;
  created_at?: string;
  updated_at?: string;
};

export async function fetchDocuments(): Promise<Document[]> {
  return apiGet<Document[]>('/documents');
}

export async function fetchDocument(id: string): Promise<Document> {
  return apiGet<Document>(`/documents/${id}`);
}

export async function createDocument(data: DocumentInput): Promise<Document> {
  return apiPost<Document>('/documents', data);
}

export async function updateDocument(id: string, data: DocumentInput): Promise<Document> {
  return apiPut<Document>(`/documents/${id}`, data);
}

export async function deleteDocument(id: string): Promise<void> {
  await apiDelete<void>(`/documents/${id}`);
}

export default { fetchDocuments, fetchDocument, createDocument, updateDocument, deleteDocument };
