import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription,
} from '../../components/ui/dialog';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '../../components/ui/form';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '../../components/ui/select';
import { useUpdatePatient } from '../../hooks/usePatients';
import { Loader2, User, Phone, Mail, FileText, CheckCircle2 } from 'lucide-react';

const formSchema = z.object({
    name: z.string().min(2, 'Name is required'),
    phone: z.string().min(10, 'Phone number is required'),
    email: z.string().email('Invalid email address').optional().or(z.literal('')),
    gender: z.enum(['MALE', 'FEMALE', 'OTHER']).optional(),
    dateOfBirth: z.string().optional(),
    bloodGroup: z.string().optional(),
    medicalHistory: z.string().optional(),
    allergies: z.string().optional(),
    address: z.object({
        street: z.string().optional(),
        city: z.string().optional(),
        pincode: z.string().optional(),
    }).optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface EditPatientDialogProps {
    patient: any;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function EditPatientDialog({ patient, open, onOpenChange }: EditPatientDialogProps) {
    const updatePatient = useUpdatePatient(patient._id);

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: patient.name || '',
            phone: patient.phone || '',
            email: patient.email || '',
            gender: patient.gender || undefined,
            dateOfBirth: patient.dateOfBirth ? new Date(patient.dateOfBirth).toISOString().split('T')[0] : '',
            bloodGroup: patient.bloodGroup || '',
            medicalHistory: patient.medicalHistory || '',
            allergies: Array.isArray(patient.allergies) ? patient.allergies.join(', ') : '',
            address: {
                street: patient.address?.street || '',
                city: patient.address?.city || '',
                pincode: patient.address?.pincode || '',
            },
        },
    });

    const onSubmit = async (values: FormValues) => {
        try {
            const dto = {
                ...values,
                allergies: values.allergies ? values.allergies.split(',').map(s => s.trim()) : [],
            };
            await updatePatient.mutateAsync(dto);
            onOpenChange(false);
        } catch (error) {
            console.error('Failed to update patient:', error);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl p-0 overflow-hidden rounded-[2rem] border-none shadow-2xl">
                <div className="bg-gradient-to-br from-primary to-primary/90 px-8 py-10 text-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 -m-8 w-40 h-40 bg-white/10 rounded-full blur-3xl" />
                    <DialogHeader className="relative z-10">
                        <DialogTitle className="text-3xl font-extrabold flex items-center gap-3 font-outfit">
                            <User className="h-8 w-8" /> Edit Patient Profile
                        </DialogTitle>
                        <DialogDescription className="text-primary-foreground/70 text-base font-medium mt-2">
                            Update personal information and medical history for {patient.name}.
                        </DialogDescription>
                    </DialogHeader>
                </div>

                <div className="p-8 max-h-[70vh] overflow-y-auto bg-slate-50/50">
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                            {/* Primary Details */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <FormField
                                    control={form.control}
                                    name="name"
                                    render={({ field }) => (
                                        <FormItem className="space-y-1.5">
                                            <FormLabel className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                                                <User className="h-3.5 w-3.5" /> Full Name *
                                            </FormLabel>
                                            <FormControl>
                                                <Input {...field} className="rounded-xl border-slate-200 focus-visible:ring-primary h-11 bg-white shadow-sm" />
                                            </FormControl>
                                            <FormMessage className="text-xs" />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="phone"
                                    render={({ field }) => (
                                        <FormItem className="space-y-1.5">
                                            <FormLabel className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                                                <Phone className="h-3.5 w-3.5" /> Phone Number *
                                            </FormLabel>
                                            <FormControl>
                                                <Input {...field} className="rounded-xl border-slate-200 focus-visible:ring-primary h-11 bg-white shadow-sm" />
                                            </FormControl>
                                            <FormMessage className="text-xs" />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="email"
                                    render={({ field }) => (
                                        <FormItem className="space-y-1.5">
                                            <FormLabel className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                                                <Mail className="h-3.5 w-3.5" /> Email Address
                                            </FormLabel>
                                            <FormControl>
                                                <Input {...field} type="email" className="rounded-xl border-slate-200 focus-visible:ring-primary h-11 bg-white shadow-sm" />
                                            </FormControl>
                                            <FormMessage className="text-xs" />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="gender"
                                    render={({ field }) => (
                                        <FormItem className="space-y-1.5">
                                            <FormLabel className="text-xs font-bold uppercase tracking-wider text-slate-500">Gender</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger className="rounded-xl border-slate-200 focus:ring-primary h-11 bg-white shadow-sm">
                                                        <SelectValue placeholder="Select gender" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent className="rounded-xl border-slate-100 shadow-xl">
                                                    <SelectItem value="MALE">Male</SelectItem>
                                                    <SelectItem value="FEMALE">Female</SelectItem>
                                                    <SelectItem value="OTHER">Other</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage className="text-xs" />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="dateOfBirth"
                                    render={({ field }) => (
                                        <FormItem className="space-y-1.5">
                                            <FormLabel className="text-xs font-bold uppercase tracking-wider text-slate-500">Date of Birth</FormLabel>
                                            <FormControl>
                                                <Input {...field} type="date" className="rounded-xl border-slate-200 focus-visible:ring-primary h-11 bg-white shadow-sm" />
                                            </FormControl>
                                            <FormMessage className="text-xs" />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="bloodGroup"
                                    render={({ field }) => (
                                        <FormItem className="space-y-1.5">
                                            <FormLabel className="text-xs font-bold uppercase tracking-wider text-slate-500">Blood Group</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger className="rounded-xl border-slate-200 focus:ring-primary h-11 bg-white shadow-sm">
                                                        <SelectValue placeholder="Select group" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent className="rounded-xl border-slate-100 shadow-xl">
                                                    {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => (
                                                        <SelectItem key={bg} value={bg}>{bg}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage className="text-xs" />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            {/* Medical Background */}
                            <div className="space-y-6 pt-6 border-t border-slate-200">
                                <div className="flex items-center gap-2">
                                    <FileText className="h-5 w-5 text-primary" />
                                    <h3 className="font-bold text-lg text-slate-800 font-outfit">Medical History & Allergies</h3>
                                </div>
                                <FormField
                                    control={form.control}
                                    name="medicalHistory"
                                    render={({ field }) => (
                                        <FormItem className="space-y-1.5">
                                            <FormLabel className="text-xs font-bold uppercase tracking-wider text-slate-500">Known Conditions</FormLabel>
                                            <FormControl>
                                                <Textarea 
                                                    {...field} 
                                                    placeholder="Diabetes, Hypertension, etc." 
                                                    className="rounded-xl border-slate-200 focus-visible:ring-primary min-h-[100px] bg-white shadow-sm resize-none" 
                                                />
                                            </FormControl>
                                            <FormMessage className="text-xs" />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="allergies"
                                    render={({ field }) => (
                                        <FormItem className="space-y-1.5">
                                            <FormLabel className="text-xs font-bold uppercase tracking-wider text-slate-500">Allergies (comma separated)</FormLabel>
                                            <FormControl>
                                                <Input {...field} placeholder="Penicillin, Peanuts, Latex" className="rounded-xl border-slate-200 focus-visible:ring-primary h-11 bg-white shadow-sm" />
                                            </FormControl>
                                            <FormMessage className="text-xs" />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </form>
                    </Form>
                </div>

                <DialogFooter className="p-8 bg-white border-t border-slate-100 gap-3">
                    <Button 
                        variant="ghost" 
                        onClick={() => onOpenChange(false)} 
                        className="rounded-xl font-bold h-12 px-6 hover:bg-slate-50 transition-all"
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={form.handleSubmit(onSubmit)}
                        className="bg-primary hover:bg-primary/90 shadow-lg shadow-primary/30 rounded-xl font-bold h-12 px-8 min-w-[160px] transition-all flex items-center gap-2"
                        disabled={updatePatient.isPending}
                    >
                        {updatePatient.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <CheckCircle2 className="h-4 w-4" />
                        )}
                        {updatePatient.isPending ? 'Saving...' : 'Save Changes'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
