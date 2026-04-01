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
                const [patientsRes, appointmentsRes, invoicesRes, doctorsRes] = await Promise.all([
                    api.get('/patients', { params: { page: 1, limit: 500 } }),
                    api.get('/appointments', { params: { page: 1, limit: 500 } }),
                    api.get('/invoices', { params: { page: 1, limit: 500 } }),
                    api.get('/users/doctors'),
                ]);

                const patientsPayload = patientsRes.data?.data || patientsRes.data || {};
                const appointmentsPayload = appointmentsRes.data?.data || appointmentsRes.data || {};
                const invoicesPayload = invoicesRes.data?.data || invoicesRes.data || {};
                const doctorsPayload = doctorsRes.data?.data || doctorsRes.data || [];

                const patients = Array.isArray(patientsPayload?.data)
                    ? patientsPayload.data
                    : Array.isArray(patientsPayload)
                        ? patientsPayload
                        : [];
                const appointments = Array.isArray(appointmentsPayload?.data)
                    ? appointmentsPayload.data
                    : Array.isArray(appointmentsPayload)
                        ? appointmentsPayload
                        : [];
                const invoices = Array.isArray(invoicesPayload?.data)
                    ? invoicesPayload.data
                    : Array.isArray(invoicesPayload)
                        ? invoicesPayload
                        : [];
                const doctors = Array.isArray(doctorsPayload) ? doctorsPayload : [];

                const now = new Date();
                const todayKey = now.toISOString().slice(0, 10);
                const currentMonth = now.getMonth();
                const currentYear = now.getFullYear();

                const sameDay = (value?: string | Date) => {
                    if (!value) return false;
                    return new Date(value).toISOString().slice(0, 10) === todayKey;
                };

                const sameMonth = (value?: string | Date) => {
                    if (!value) return false;
                    const date = new Date(value);
                    return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
                };

                const issuedLikeStatuses = new Set(['ISSUED', 'PARTIALLY_PAID', 'PAID']);

                const appointmentsByStatusMap = appointments.reduce((acc: Record<string, number>, item: any) => {
                    const status = item?.status || 'UNKNOWN';
                    acc[status] = (acc[status] || 0) + 1;
                    return acc;
                }, {});

                const revenueHistoryMap = invoices.reduce((acc: Record<string, number>, item: any) => {
                    if (!issuedLikeStatuses.has(item?.status)) {
                        return acc;
                    }
                    const key = new Date(item.createdAt).toISOString().slice(0, 10);
                    acc[key] = (acc[key] || 0) + Number(item.paidAmount || 0);
                    return acc;
                }, {});

                const revenueHistory = Array.from({ length: 7 }).map((_, index) => {
                    const date = new Date();
                    date.setDate(now.getDate() - (6 - index));
                    const key = date.toISOString().slice(0, 10);
                    return {
                        date: key,
                        amount: revenueHistoryMap[key] || 0,
                    };
                });

                return {
                    totalPatients: patientsPayload?.total ?? patients.length,
                    monthNewPatients: patients.filter((item: any) => sameMonth(item?.createdAt)).length,
                    todayNewPatients: patients.filter((item: any) => sameDay(item?.createdAt)).length,
                    totalDoctors: doctors.length,
                    todayAppointments: appointments.filter((item: any) => sameDay(item?.date)).length,
                    monthAppointments: appointments.filter((item: any) => sameMonth(item?.date)).length,
                    monthRevenue: invoices
                        .filter((item: any) => sameMonth(item?.createdAt))
                        .reduce((sum: number, item: any) => sum + Number(item?.paidAmount || 0), 0),
                    pendingPaymentsTotal: invoices.reduce(
                        (sum: number, item: any) => sum + Number(item?.pendingAmount || 0),
                        0,
                    ),
                    overdueInvoices: invoices.filter(
                        (item: any) => Number(item?.pendingAmount || 0) > 0 && item?.status !== 'DRAFT',
                    ).length,
                    pendingLabCases: 0,
                    lowStockCount: 0,
                    revenueHistory,
                    appointmentsByStatus: Object.entries(appointmentsByStatusMap).map(([status, count]) => ({
                        status,
                        count,
                    })),
                };
            } catch (error) {
                if (is404(error)) {
                    return {};
                }
                throw error;
            }
        },
        staleTime: 60 * 1000,
        refetchInterval: false,
        refetchOnWindowFocus: false,
        retry: false,
    });
}

export function useRevenueDaily(from?: string, to?: string) {
    return useQuery({
        queryKey: ['reports', 'revenue', 'daily', from, to],
        queryFn: async () => {
            const res = await api.get('/reports/revenue/daily', { params: { from, to } });
            const payload = res.data?.data || res.data;
            return Array.isArray(payload) ? payload : [];
        },
        staleTime: 60 * 1000,
        refetchInterval: false,
        refetchOnWindowFocus: false,
    });
}

export function useRevenueMonthly(from?: string, to?: string) {
    return useQuery({
        queryKey: ['reports', 'revenue', 'monthly', from, to],
        queryFn: async () => {
            const res = await api.get('/reports/revenue/monthly', { params: { from, to } });
            const payload = res.data?.data || res.data;
            return Array.isArray(payload) ? payload : [];
        },
        staleTime: 60 * 1000,
        refetchInterval: false,
        refetchOnWindowFocus: false,
    });
}

export function useRevenueByDoctor(from?: string, to?: string) {
    return useQuery({
        queryKey: ['reports', 'revenue', 'doctor', from, to],
        queryFn: async () => {
            const res = await api.get('/reports/revenue/doctor', { params: { from, to } });
            const payload = res.data?.data || res.data;
            return Array.isArray(payload) ? payload : [];
        },
        staleTime: 60 * 1000,
        refetchInterval: false,
        refetchOnWindowFocus: false,
    });
}

export function useAppointmentsSummary(from?: string, to?: string) {
    return useQuery({
        queryKey: ['reports', 'appointments', 'summary', from, to],
        queryFn: async () => {
            const res = await api.get('/reports/appointments/summary', { params: { from, to } });
            return res.data?.data || res.data || {};
        },
        staleTime: 60 * 1000,
        refetchInterval: false,
        refetchOnWindowFocus: false,
    });
}

export function usePatientGrowth(from?: string, to?: string) {
    return useQuery({
        queryKey: ['reports', 'patients', 'growth', from, to],
        queryFn: async () => {
            const res = await api.get('/reports/patients/growth', { params: { from, to } });
            const payload = res.data?.data || res.data;
            return Array.isArray(payload) ? payload : [];
        },
        staleTime: 60 * 1000,
        refetchInterval: false,
        refetchOnWindowFocus: false,
    });
}

export function useInventoryExpenses(from?: string, to?: string) {
    return useQuery({
        queryKey: ['reports', 'inventory', 'expenses', from, to],
        queryFn: async () => {
            const res = await api.get('/reports/inventory/expenses', { params: { from, to } });
            const payload = res.data?.data || res.data;
            return Array.isArray(payload) ? payload : [];
        },
        staleTime: 60 * 1000,
        refetchInterval: false,
        refetchOnWindowFocus: false,
    });
}

export function useChairUtilization(from?: string, to?: string) {
    return useQuery({
        queryKey: ['reports', 'chairs', 'utilization', from, to],
        queryFn: async () => {
            const res = await api.get('/reports/chairs/utilization', { params: { from, to } });
            const payload = res.data?.data || res.data;
            return Array.isArray(payload) ? payload : [];
        },
        staleTime: 60 * 1000,
        refetchInterval: false,
        refetchOnWindowFocus: false,
    });
}

export function usePendingPayments() {
    return useQuery({
        queryKey: ['reports', 'pending-payments'],
        queryFn: async () => {
            const res = await api.get('/reports/patients/pending-payments');
            const payload = res.data?.data || res.data;
            return Array.isArray(payload) ? payload : [];
        },
        staleTime: 2 * 60 * 1000,
        refetchOnWindowFocus: false,
    });
}
