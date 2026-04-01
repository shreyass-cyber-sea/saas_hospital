import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useNavigate, Link } from 'react-router-dom';
import { Hospital, Loader2 } from 'lucide-react';

import { Button } from '../../components/ui/button';
import {
    Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from '../../components/ui/form';
import { Input } from '../../components/ui/input';
import { useRegister } from '../../hooks/useAuth';

const registerSchema = z.object({
    clinicName: z.string().min(2, { message: 'Clinic name is required.' }),
    userName: z.string().min(2, { message: 'Your name is required.' }),
    email: z.string().email({ message: 'Please enter a valid email address.' }),
    password: z.string().min(8, { message: 'Password must be at least 8 characters.' }),
    phone: z.string().optional(),
});

export function Register() {
    const navigate = useNavigate();
    const registerMutation = useRegister();

    const form = useForm<z.infer<typeof registerSchema>>({
        resolver: zodResolver(registerSchema),
        defaultValues: { clinicName: '', userName: '', email: '', password: '', phone: '' },
    });

    async function onSubmit(values: z.infer<typeof registerSchema>) {
        try {
            const data = await registerMutation.mutateAsync(values);
            if (data.accessToken && data.user) {
                navigate('/dashboard');
            } else {
                navigate('/auth/login');
            }
        } catch (error: unknown) {
            const err = error as { response?: { data?: { message?: string } } };
            const msg =
                err?.response?.data?.message ||
                (error instanceof Error ? error.message : 'Registration failed. Please try again.');
            form.setError('email', { message: msg });
        }
    }

    return (
        <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[420px]">
            <div className="flex flex-col space-y-2 text-center items-center">
                <Hospital className="h-12 w-12 text-blue-600 mb-2" />
                <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
                    Register Your Clinic
                </h1>
                <p className="text-sm text-slate-500">
                    Create your clinic account to get started
                </p>
            </div>

            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField control={form.control} name="clinicName" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Clinic Name</FormLabel>
                            <FormControl><Input placeholder="Smile Dental Clinic" {...field} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )} />
                    <FormField control={form.control} name="userName" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Your Name</FormLabel>
                            <FormControl><Input placeholder="Dr. John Doe" {...field} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )} />
                    <FormField control={form.control} name="email" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl><Input placeholder="admin@clinic.com" {...field} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )} />
                    <FormField control={form.control} name="password" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Password</FormLabel>
                            <FormControl><Input type="password" placeholder="••••••••" {...field} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )} />
                    <FormField control={form.control} name="phone" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Phone (optional)</FormLabel>
                            <FormControl><Input placeholder="+91 98765 43210" {...field} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )} />
                    <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={registerMutation.isPending}>
                        {registerMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Create Account
                    </Button>
                </form>
            </Form>

            <p className="text-center text-sm text-slate-500">
                Already have an account?{' '}
                <Link to="/auth/login" className="text-blue-600 hover:underline font-medium">Sign in</Link>
            </p>
        </div>
    );
}
