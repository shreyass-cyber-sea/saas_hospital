import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';

interface PaginationParams {
    page?: number;
    limit?: number;
    search?: string;
}

export function usePatients(params: PaginationParams = {}) {
    return useQuery({
        queryKey: ['patients', params],
        queryFn: async () => {
            const queryParams: Record<string, unknown> = {};
            if (params.page) queryParams.page = params.page;
            if (params.limit) queryParams.limit = params.limit;
            if (params.search && params.search.trim() !== '') queryParams.search = params.search;

            const res = await api.get('/patients', { params: queryParams });
            const payload = res.data?.data || res.data;
            return Array.isArray(payload) ? payload : [];
        },
        staleTime: 30 * 1000,
        refetchInterval: false,
        refetchOnWindowFocus: false,
    });
}

export function usePatient(id: string) {
    return useQuery({
        queryKey: ['patients', id],
        queryFn: async () => {
            const res = await api.get(`/patients/${id}`);
            return res.data?.data || res.data;
        },
        enabled: !!id,
        staleTime: 30 * 1000,
        refetchOnWindowFocus: false,
    });
}

export function usePatientHistory(id: string) {
    return useQuery({
        queryKey: ['patients', id, 'history'],
        queryFn: async () => {
            const res = await api.get(`/patients/${id}/history`);
            return res.data?.data || res.data;
        },
        enabled: !!id,
        staleTime: 30 * 1000,
        refetchOnWindowFocus: false,
    });
}

export function usePatientNotes(id: string) {
    return useQuery({
        queryKey: ['patients', id, 'notes'],
        queryFn: async () => {
            const res = await api.get(`/patients/${id}/notes`);
            const payload = res.data?.data || res.data;
            return Array.isArray(payload) ? payload : [];
        },
        enabled: !!id,
        staleTime: 30 * 1000,
        refetchOnWindowFocus: false,
    });
}

export function useCreatePatient() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (dto: Record<string, unknown>) => {
            const res = await api.post('/patients', dto);
            return res.data?.data || res.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['patients'] });
            queryClient.invalidateQueries({ queryKey: ['reports', 'dashboard'] });
        },
    });
}

export function useUpdatePatient(id: string) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (dto: Record<string, unknown>) => {
            const res = await api.patch(`/patients/${id}`, dto);
            return res.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['patients', id] });
            queryClient.invalidateQueries({ queryKey: ['patients'] });
        },
    });
}

export function useAddClinicalNote(patientId: string) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (dto: Record<string, unknown>) => {
            const res = await api.post(`/patients/${patientId}/notes`, dto);
            return res.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['patients', patientId, 'notes'] });
        },
    });
}

export function useUploadPatientDocument(patientId: string) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (formData: FormData) => {
            const res = await api.post(`/patients/${patientId}/documents`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            return res.data?.data || res.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['patients', patientId] });
        },
    });
}
