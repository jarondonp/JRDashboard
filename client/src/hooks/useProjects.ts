import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as projectsApi from '../services/projectsApi';

export function useProjects() {
    return useQuery({
        queryKey: ['projects'],
        queryFn: () => projectsApi.fetchProjects()
    });
}

export function useProject(id?: string) {
    return useQuery({
        queryKey: ['project', id],
        queryFn: () => projectsApi.fetchProject(id as string),
        enabled: !!id
    });
}

export function useCreateProject() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (data: Parameters<typeof projectsApi.createProject>[0]) => projectsApi.createProject(data),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['projects'] });
            // Invalidate other queries if projects affect them (e.g. area dashboard)
            qc.invalidateQueries({ queryKey: ['areaDashboard'] });
        },
    });
}

export function useUpdateProject() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: any }) => projectsApi.updateProject(id, data),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['projects'] });
            qc.invalidateQueries({ queryKey: ['areaDashboard'] });
        },
    });
}

export function useDeleteProject() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => projectsApi.deleteProject(id),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['projects'] });
            qc.invalidateQueries({ queryKey: ['areaDashboard'] });
        },
    });
}
