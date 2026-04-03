import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';

interface InvoiceFilters {
    status?: string;
    patientId?: string;
    doctorId?: string;
    from?: string;
    to?: string;
    page?: number;
    limit?: number;
}

// ─── Procedures ──────────────────────────────────────────────────────────────
export function useProcedures() {
    return useQuery({
        queryKey: ['procedures'],
        queryFn: async () => {
            const res = await api.get('/procedures');
            const payload = res.data?.data || res.data;
            return Array.isArray(payload) ? payload : [];
        },
        staleTime: 60 * 1000,
        refetchInterval: false,
        refetchOnWindowFocus: false,
    });
}

export function useCreateProcedure() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (dto: Record<string, unknown>) => {
            const res = await api.post('/procedures', dto);
            return res.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['procedures'] });
        },
    });
}

// ─── Doctors ─────────────────────────────────────────────────────────────────
export function useDoctors() {
    return useQuery({
        queryKey: ['doctors'],
        queryFn: async () => {
            const res = await api.get('/users/doctors');
            const payload = res.data?.data || res.data;
            return Array.isArray(payload) ? payload : [];
        },
        staleTime: 60 * 1000,
        refetchInterval: false,
        refetchOnWindowFocus: false,
    });
}

// ─── Invoices ────────────────────────────────────────────────────────────────
export function useInvoices(filters: InvoiceFilters = {}) {
    return useQuery({
        queryKey: ['invoices', filters],
        queryFn: async () => {
            const res = await api.get('/invoices', { params: filters });
            const payload = res.data?.data || res.data;
            return Array.isArray(payload) ? payload : [];
        },
        staleTime: 30 * 1000,
        refetchInterval: false,
        refetchOnWindowFocus: false,
    });
}

export function useInvoice(id: string) {
    return useQuery({
        queryKey: ['invoices', id],
        queryFn: async () => {
            const res = await api.get(`/invoices/${id}`);
            return res.data?.data || res.data;
        },
        enabled: !!id,
        staleTime: 30 * 1000,
        refetchInterval: false,
        refetchOnWindowFocus: false,
    });
}

export function useCreateInvoice() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (dto: Record<string, unknown>) => {
            const res = await api.post('/invoices', dto);
            return res.data?.data || res.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['invoices'] });
            queryClient.invalidateQueries({ queryKey: ['reports', 'dashboard'] });
        },
    });
}

export function useUpdateInvoice() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, dto }: { id: string; dto: Record<string, unknown> }) => {
            const res = await api.patch(`/invoices/${id}`, dto);
            return res.data?.data || res.data;
        },
        onSuccess: (_data, { id }) => {
            queryClient.invalidateQueries({ queryKey: ['invoices', id] });
            queryClient.invalidateQueries({ queryKey: ['invoices'] });
        },
    });
}

export function useIssueInvoice() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: string) => {
            const res = await api.patch(`/invoices/${id}`, { status: 'ISSUED' });
            return res.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['invoices'] });
            queryClient.invalidateQueries({ queryKey: ['reports', 'dashboard'] });
        },
    });
}

export function useRecordPayment() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, dto }: { id: string; dto: { amount: number; mode: string; reference?: string } }) => {
            const res = await api.post(`/invoices/${id}/payment`, dto);
            return res.data;
        },
        onSuccess: (_data, { id }) => {
            queryClient.invalidateQueries({ queryKey: ['invoices', id] });
            queryClient.invalidateQueries({ queryKey: ['invoices'] });
            queryClient.invalidateQueries({ queryKey: ['reports', 'dashboard'] });
        },
    });
}

export function useCancelInvoice() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, reason }: { id: string; reason?: string }) => {
            const res = await api.post(`/invoices/${id}/cancel`, null, { params: { reason } });
            return res.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['invoices'] });
            queryClient.invalidateQueries({ queryKey: ['reports', 'dashboard'] });
        },
    });
}

export function useSendReminder() {
    return useMutation({
        mutationFn: async (id: string) => {
            const res = await api.post(`/invoices/${id}/remind`);
            return res.data;
        },
    });
}

// ─── Advance Payments ────────────────────────────────────────────────────────
export function useAdvanceBalance(patientId: string) {
    return useQuery({
        queryKey: ['advance', patientId],
        queryFn: async () => {
            const res = await api.get(`/advance-payments/patient/${patientId}`);
            return res.data?.data || res.data || { balance: 0 };
        },
        enabled: !!patientId,
        staleTime: 30 * 1000,
        refetchInterval: false,
        refetchOnWindowFocus: false,
    });
}

export function useCreateAdvancePayment() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (dto: { patientId: string; amount: number; mode: string; notes?: string }) => {
            const res = await api.post('/advance-payments', dto);
            return res.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['advance'] });
        },
    });
}
