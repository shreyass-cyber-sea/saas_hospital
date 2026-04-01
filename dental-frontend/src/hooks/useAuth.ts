import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import { useAuthStore } from './useAuthStore';
import { signInWithSupabase, signUpWithSupabase } from '../lib/supabase';

interface LoginDto {
    email: string;
    password: string;
}

interface RegisterDto {
    clinicName: string;
    email: string;
    password: string;
    userName: string;   // matches RegisterDto in backend
    phone?: string;
}

export function useLogin() {
    const setAuth = useAuthStore((state) => state.login);
    return useMutation({
        mutationFn: async (dto: LoginDto) => {
            const session = await signInWithSupabase(dto);
            const res = await api.get('/auth/me', {
                headers: {
                    Authorization: `Bearer ${session.access_token}`,
                },
            });

            return {
                accessToken: session.access_token,
                user: res.data,
            };
        },
        onSuccess: (data) => {
            const token = data.accessToken;
            if (token && data.user) {
                setAuth(data.user, token);
            }
        },
    });
}

export function useRegister() {
    const setAuth = useAuthStore((state) => state.login);
    return useMutation({
        mutationFn: async (dto: RegisterDto) => {
            const authResult = await signUpWithSupabase({
                email: dto.email,
                password: dto.password,
            });

            if (!authResult.user?.id) {
                throw new Error('Supabase did not return a user id for this registration.');
            }

            await api.post('/auth/register', {
                ...dto,
                supabaseUserId: authResult.user.id,
            });

            if (!authResult.session?.access_token) {
                return {
                    accessToken: null,
                    user: null,
                };
            }

            const res = await api.get('/auth/me', {
                headers: {
                    Authorization: `Bearer ${authResult.session.access_token}`,
                },
            });

            return {
                accessToken: authResult.session.access_token,
                user: res.data,
            };
        },
        onSuccess: (data) => {
            const token = data.accessToken;
            if (token && data.user) {
                setAuth(data.user, token);
            }
        },
    });
}

export function useMe() {
    return useQuery({
        queryKey: ['me'],
        queryFn: async () => {
            const res = await api.get('/auth/me');
            return res.data;
        },
        retry: false,
        staleTime: 1000 * 60 * 5, // 5 minutes
    });
}


export function useChangePassword() {
    return useMutation({
        mutationFn: async (dto: { oldPassword: string; newPassword: string }) => {
            const res = await api.patch('/auth/change-password', dto);
            return res.data;
        },
    });
}

export function useCreateUser() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (dto: { name: string; email: string; password: string; role: string; supabaseUserId: string }) => {
            const res = await api.post('/auth/create-user', dto);
            return res.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
        },
    });
}
