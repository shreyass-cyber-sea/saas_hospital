import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useNavigate, Link } from 'react-router-dom';
import { Hospital, Loader2 } from 'lucide-react';
import { useState } from 'react';

import { Button } from '../../components/ui/button';
import {
    Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from '../../components/ui/form';
import { Input } from '../../components/ui/input';
import { useLogin } from '../../hooks/useAuth';

const loginSchema = z.object({
    email: z.string().email({ message: 'Please enter a valid email address.' }),
    password: z.string().min(8, { message: 'Password must be at least 8 characters.' }),
});

export function Login() {
    const navigate = useNavigate();
    const loginMutation = useLogin();
    const [error, setError] = useState('');

    const form = useForm<z.infer<typeof loginSchema>>({
        resolver: zodResolver(loginSchema),
        defaultValues: { email: '', password: '' },
    });

    async function onSubmit(values: z.infer<typeof loginSchema>) {
        setError('');
        try {
            await loginMutation.mutateAsync(values);
            navigate('/dashboard');
        } catch (err: unknown) {
            const e = err as { response?: { data?: { message?: string } } };
            setError(
                e?.response?.data?.message ||
                (err instanceof Error ? err.message : 'Invalid credentials. Please check and try again.')
            );
        }
    }

    return (
        <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[380px]">
            <div className="flex flex-col space-y-2 text-center items-center">
                <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mb-2 shadow-lg">
                    <Hospital className="h-9 w-9 text-white" />
                </div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900">DentalCloud</h1>
                <p className="text-sm text-slate-500">Sign in to your clinic dashboard</p>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6">
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField control={form.control} name="email" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Email</FormLabel>
                                <FormControl>
                                    <Input placeholder="doctor@smilecenter.com" autoComplete="email" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                        <FormField control={form.control} name="password" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Password</FormLabel>
                                <FormControl>
                                    <Input type="password" placeholder="••••••••" autoComplete="current-password" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />

                        {error && (
                            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
                                {error}
                            </div>
                        )}

                        <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 h-11 text-base" disabled={loginMutation.isPending}>
                            {loginMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Sign In
                        </Button>
                    </form>
                </Form>
            </div>

            <p className="text-center text-sm text-slate-500">
                New clinic?{' '}
                <Link to="/auth/register" className="text-blue-600 hover:underline font-medium">Create an account</Link>
            </p>
        </div>
    );
}
