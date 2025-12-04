import { apiGet, apiPost, apiPut, apiDelete } from './apiClient';

export type ProjectInput = {
    area_id: string | null;
    code?: string;
    title: string;
    description?: string | null;
    status?: string;
    start_date?: string | null;
    end_date?: string | null;
};

export type Project = ProjectInput & {
    id: string;
    created_at?: string;
    updated_at?: string;
};

export async function fetchProjects(): Promise<Project[]> {
    return apiGet<Project[]>('/projects');
}

export async function fetchProject(id: string): Promise<Project> {
    return apiGet<Project>(`/projects/${id}`);
}

export async function createProject(data: ProjectInput): Promise<Project> {
    return apiPost<Project>('/projects', data);
}

export async function updateProject(id: string, data: ProjectInput): Promise<Project> {
    return apiPut<Project>(`/projects/${id}`, data);
}

export async function deleteProject(id: string): Promise<void> {
    await apiDelete<void>(`/projects/${id}`);
}

export default { fetchProjects, fetchProject, createProject, updateProject, deleteProject };
