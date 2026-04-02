import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';

// ─── Items ──────────────────────────────────────────────────────────────────
export function useInventoryItems(
    params: { category?: string; lowStock?: boolean; page?: number; limit?: number } = {},
) {
    return useQuery({
        queryKey: ['inventory', 'items', params],
        queryFn: async () => {
            const res = await api.get('/inventory/items', { params });
            const payload = res.data?.data || res.data;
            return Array.isArray(payload) ? payload : payload?.items ?? [];
        },
        staleTime: 60 * 1000,
        refetchInterval: false,
        refetchOnWindowFocus: false,
    });
}

export function useLowStockItems() {
    return useQuery({
        queryKey: ['inventory', 'low-stock'],
        queryFn: async () => {
            const res = await api.get('/inventory/low-stock');
            const payload = res.data?.data || res.data;
            return Array.isArray(payload) ? payload : [];
        },
        staleTime: 60 * 1000,
        refetchInterval: false,
        refetchOnWindowFocus: false,
        retry: false,
    });
}

export function useInventoryValuation() {
    return useQuery({
        queryKey: ['inventory', 'valuation'],
        queryFn: async () => {
            const res = await api.get('/inventory/valuation');
            return res.data?.data || res.data || {};
        },
        staleTime: 60 * 1000,
        refetchInterval: false,
        refetchOnWindowFocus: false,
    });
}

export function useInventoryItem(id: string) {
    return useQuery({
        queryKey: ['inventory', 'items', id],
        queryFn: async () => {
            const res = await api.get(`/inventory/items/${id}`);
            return res.data?.data || res.data;
        },
        enabled: !!id,
        staleTime: 60 * 1000,
        refetchInterval: false,
        refetchOnWindowFocus: false,
    });
}

export function useCreateInventoryItem() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (dto: Record<string, unknown>) => {
            const res = await api.post('/inventory/items', dto);
            return res.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['inventory'] });
        },
    });
}

export function useUpdateInventoryItem(id: string) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (dto: Record<string, unknown>) => {
            const res = await api.patch(`/inventory/items/${id}`, dto);
            return res.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['inventory'] });
        },
    });
}

// ─── Transactions ────────────────────────────────────────────────────────────
export function useInventoryTransactions(
    params: { itemId?: string; type?: string; from?: string; to?: string; page?: number; limit?: number } = {},
) {
    return useQuery({
        queryKey: ['inventory', 'transactions', params],
        queryFn: async () => {
            const res = await api.get('/inventory/transactions', { params });
            const payload = res.data?.data || res.data;
            return Array.isArray(payload) ? payload : payload?.items ?? [];
        },
        staleTime: 60 * 1000,
        refetchInterval: false,
        refetchOnWindowFocus: false,
    });
}

export function useCreateInventoryTransaction() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (dto: {
            itemId: string;
            type: string;
            quantity: number;
            unitCost?: number;
            referenceNote?: string;
            patientId?: string;
        }) => {
            const res = await api.post('/inventory/transactions', dto);
            return res.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['inventory'] });
        },
    });
}

// ─── Lab Cases ───────────────────────────────────────────────────────────────
export function useLabCases(params: { status?: string; doctorId?: string } = {}) {
    return useQuery({
        queryKey: ['lab-cases', params],
        queryFn: async () => {
            const res = await api.get('/inventory/lab-cases', { params });
            const payload = res.data?.data || res.data;
            return Array.isArray(payload) ? payload : [];
        },
        staleTime: 60 * 1000,
        refetchInterval: false,
        refetchOnWindowFocus: false,
    });
}

export function usePendingLabCases() {
    return useQuery({
        queryKey: ['lab-cases', 'pending'],
        queryFn: async () => {
            const res = await api.get('/inventory/lab-cases/pending');
            const payload = res.data?.data || res.data;
            return Array.isArray(payload) ? payload : [];
        },
        staleTime: 60 * 1000,
        refetchInterval: false,
        refetchOnWindowFocus: false,
    });
}

export function useCreateLabCase() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (dto: Record<string, unknown>) => {
            const res = await api.post('/inventory/lab-cases', dto);
            return res.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['lab-cases'] });
            queryClient.invalidateQueries({ queryKey: ['inventory'] });
        },
    });
}

export function useUpdateLabCase(id: string) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (dto: Record<string, unknown>) => {
            const res = await api.patch(`/inventory/lab-cases/${id}`, dto);
            return res.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['lab-cases'] });
            queryClient.invalidateQueries({ queryKey: ['inventory'] });
        },
    });
}
