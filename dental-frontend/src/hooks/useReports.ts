import { useQuery } from '@tanstack/react-query';
import api from '../lib/api';

function is404(error: unknown) {
    const err = error as { response?: { status?: number } };
    return err?.response?.status === 404;
}

export function useDashboard() {
    return useQuery({
        queryKey: ['reports', 'dashboard'],
        queryFn: async () => {
            try {
                const { data } = await api.get('/reports/dashboard');
                const payload = data?.data || data || {};
                const revenueHistory = Array.isArray(payload.revenueHistory)
                    ? payload.revenueHistory
                    : Array.isArray(payload.revenueChart)
                        ? payload.revenueChart.map((item: any) => ({
                            date: item?.date || item?.name,
                            amount: Number(item?.amount ?? item?.revenue ?? 0),
                        }))
                        : [];

                return {
                    ...payload,
                    revenueHistory,
                };
            } catch (error) {
                if (is404(error)) {
                    return {};
                }
                throw error;
            }
        },
        staleTime: 5 * 60 * 1000,
        refetchInterval: false,
        refetchOnWindowFocus: false,
        retry: false,
    });
}

export function useRevenueDaily(from?: string, to?: string) {
    return useQuery({
        queryKey: ['reports', 'revenue', 'daily', from, to],
        queryFn: async () => {
            const { data } = await api.get('/reports/revenue/daily', { params: { from, to } });
            return data?.data || data || [];
        },
        staleTime: 5 * 60 * 1000,
        refetchInterval: false,
        refetchOnWindowFocus: false,
    });
}

export function useRevenueMonthly(from?: string, to?: string) {
    return useQuery({
        queryKey: ['reports', 'revenue', 'monthly', from, to],
        queryFn: async () => {
            const { data } = await api.get('/reports/revenue/monthly', { params: { from, to } });
            return data?.data || data || [];
        },
        staleTime: 5 * 60 * 1000,
        refetchInterval: false,
        refetchOnWindowFocus: false,
    });
}

export function useRevenueByDoctor(from?: string, to?: string) {
    return useQuery({
        queryKey: ['reports', 'revenue', 'doctor', from, to],
        queryFn: async () => {
            const { data } = await api.get('/reports/revenue/doctor', { params: { from, to } });
            return data?.data || data || [];
        },
        staleTime: 5 * 60 * 1000,
        refetchInterval: false,
        refetchOnWindowFocus: false,
    });
}

export function useAppointmentsSummary(from?: string, to?: string) {
    return useQuery({
        queryKey: ['reports', 'appointments', 'summary', from, to],
        queryFn: async () => {
            const { data } = await api.get('/reports/appointments/summary', { params: { from, to } });
            return data?.data || data || {};
        },
        staleTime: 5 * 60 * 1000,
        refetchInterval: false,
        refetchOnWindowFocus: false,
    });
}

export function usePatientGrowth(from?: string, to?: string) {
    return useQuery({
        queryKey: ['reports', 'patients', 'growth', from, to],
        queryFn: async () => {
            const { data } = await api.get('/reports/patients/growth', { params: { from, to } });
            return data?.data || data || [];
        },
        staleTime: 5 * 60 * 1000,
        refetchInterval: false,
        refetchOnWindowFocus: false,
    });
}

export function useInventoryExpenses(from?: string, to?: string) {
    return useQuery({
        queryKey: ['reports', 'inventory', 'expenses', from, to],
        queryFn: async () => {
            const { data } = await api.get('/reports/inventory/expenses', { params: { from, to } });
            return data?.data || data || [];
        },
        staleTime: 5 * 60 * 1000,
        refetchInterval: false,
        refetchOnWindowFocus: false,
    });
}

export function useChairUtilization(from?: string, to?: string) {
    return useQuery({
        queryKey: ['reports', 'chairs', 'utilization', from, to],
        queryFn: async () => {
            const { data } = await api.get('/reports/chairs/utilization', { params: { from, to } });
            return data?.data || data || [];
        },
        staleTime: 5 * 60 * 1000,
        refetchInterval: false,
        refetchOnWindowFocus: false,
    });
}

export function usePendingPayments() {
    return useQuery({
        queryKey: ['reports', 'pending-payments'],
        queryFn: async () => {
            const { data } = await api.get('/reports/patients/pending-payments');
            return data?.data || data || [];
        },
        staleTime: 5 * 60 * 1000,
        refetchOnWindowFocus: false,
    });
}
