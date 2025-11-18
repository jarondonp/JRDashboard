import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as documentsApi from '../services/documentsApi';

export function useDocuments() {
  return useQuery({
    queryKey: ['documents'],
    queryFn: () => documentsApi.fetchDocuments()
  });
}

export function useDocument(id?: string) {
  return useQuery({
    queryKey: ['document', id],
    queryFn: () => documentsApi.fetchDocument(id as string),
    enabled: !!id
  });
}

export function useCreateDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Parameters<typeof documentsApi.createDocument>[0]) => documentsApi.createDocument(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['documents'] }),
  });
}

export function useUpdateDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => documentsApi.updateDocument(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['documents'] }),
  });
}

export function useDeleteDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => documentsApi.deleteDocument(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['documents'] }),
  });
}
