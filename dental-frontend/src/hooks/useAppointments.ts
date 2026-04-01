import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';

interface AppointmentFilters {
    date?: string;
    doctorId?: string;
    status?: string;
    patientId?: string;
    page?: number;
    limit?: number;
}

export function useAppointments(filters: AppointmentFilters = {}) {
    return useQuery({
        queryKey: ['appointments', filters],
        queryFn: async () => {
            const res = await api.get('/appointments', { params: filters });
            const payload = res.data?.data || res.data;
            return Array.isArray(payload) ? payload : [];
        },
        staleTime: 30 * 1000,
        refetchInterval: false,
        refetchOnWindowFocus: false,
    });
}

export function useTodayAppointments() {
    return useQuery({
        queryKey: ['appointments', 'today'],
        queryFn: async () => {
            const res = await api.get('/appointments/today');
            return res.data?.data || res.data || {};
        },
        staleTime: 30 * 1000,
        refetchInterval: false,
        refetchOnWindowFocus: false,
    });
}

export function useAppointment(id: string) {
    return useQuery({
        queryKey: ['appointments', id],
        queryFn: async () => {
            const res = await api.get(`/appointments/${id}`);
            return res.data?.data || res.data;
        },
        enabled: !!id,
        staleTime: 30 * 1000,
        refetchInterval: false,
        refetchOnWindowFocus: false,
    });
}

export function useAvailableSlots(doctorId: string, date: string, duration?: number) {
    return useQuery({
        queryKey: ['slots', doctorId, date, duration],
        queryFn: async () => {
            const res = await api.get('/appointments/slots', {
                params: { doctorId, date, duration },
            });
            const payload = res.data?.data || res.data;
            return { available: Array.isArray(payload) ? payload : [], booked: [] as string[] };
        },
        enabled: !!doctorId && !!date,
        staleTime: 30 * 1000,
        refetchInterval: false,
        refetchOnWindowFocus: false,
    });
}

export function useCalendarAppointments(startDate: string, endDate: string) {
    return useQuery({
        queryKey: ['appointments', 'calendar', startDate, endDate],
        queryFn: async () => {
            const res = await api.get('/appointments/for-calendar', {
                params: { startDate, endDate },
            });
            const payload = res.data?.data || res.data;
            return Array.isArray(payload) ? payload : [];
        },
        enabled: !!startDate && !!endDate,
        staleTime: 30 * 1000,
        refetchInterval: false,
        refetchOnWindowFocus: false,
    });
}

export function useCreateAppointment() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (dto: Record<string, unknown>) => {
            const res = await api.post('/appointments', dto);
            return res.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['appointments'] });
            queryClient.invalidateQueries({ queryKey: ['reports', 'dashboard'] });
        },
    });
}

export function useUpdateAppointment(id: string) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (dto: Record<string, unknown>) => {
            const res = await api.patch(`/appointments/${id}`, dto);
            return res.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['appointments'] });
            queryClient.invalidateQueries({ queryKey: ['reports', 'dashboard'] });
        },
    });
}

export function useUpdateAppointmentStatus(id: string) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (dto: { status: string; notes?: string }) => {
            const res = await api.patch(`/appointments/${id}/status`, dto);
            return res.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['appointments'] });
            queryClient.invalidateQueries({ queryKey: ['reports', 'dashboard'] });
        },
    });
}

export function useCancelAppointment() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, reason }: { id: string; reason?: string }) => {
            const res = await api.delete(`/appointments/${id}`, { params: { reason } });
            return res.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['appointments'] });
            queryClient.invalidateQueries({ queryKey: ['reports', 'dashboard'] });
        },
    });
}
