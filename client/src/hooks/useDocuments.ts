import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as documentsApi from '../services/documentsApi';

export function useDocuments() {
  return useQuery(['documents'], () => documentsApi.fetchDocuments());
}

export function useDocument(id?: string) {
  return useQuery(['document', id], () => documentsApi.fetchDocument(id as string), { enabled: !!id });
}

export function useCreateDocument() {
  const qc = useQueryClient();
  return useMutation((data: Parameters<typeof documentsApi.createDocument>[0]) => documentsApi.createDocument(data), {
    onSuccess: () => qc.invalidateQueries(['documents']),
  });
}

export function useUpdateDocument() {
  const qc = useQueryClient();
  return useMutation(({ id, data }: { id: string; data: any }) => documentsApi.updateDocument(id, data), {
    onSuccess: () => qc.invalidateQueries(['documents']),
  });
}

export function useDeleteDocument() {
  const qc = useQueryClient();
  return useMutation((id: string) => documentsApi.deleteDocument(id), {
    onSuccess: () => qc.invalidateQueries(['documents']),
  });
}
