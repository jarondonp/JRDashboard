import { apiGet, apiPost, apiPut, apiDelete } from './apiClient';

export type ReportInput = {
  title: string;
  report_type: string;
  area_id?: string;
  period_start: string;
  period_end: string;
  content: string; // markdown or text
  status?: string;
};

export type Report = ReportInput & {
  id: string;
  created_at?: string;
  updated_at?: string;
};

export async function fetchReports(): Promise<Report[]> {
  return apiGet<Report[]>('/reports');
}

export async function fetchReport(id: string): Promise<Report> {
  return apiGet<Report>(`/reports/${id}`);
}

export async function createReport(data: ReportInput): Promise<Report> {
  return apiPost<Report>('/reports', data);
}

export async function updateReport(id: string, data: ReportInput): Promise<Report> {
  return apiPut<Report>(`/reports/${id}`, data);
}

export async function deleteReport(id: string): Promise<void> {
  await apiDelete<void>(`/reports/${id}`);
}

export default { fetchReports, fetchReport, createReport, updateReport, deleteReport };
