import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageWrapper } from '../../components/layout/PageWrapper';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Card, CardContent } from '../../components/ui/card';
import { Save, ArrowLeft, Loader2, User, Phone, Mail, Calendar, Heart } from 'lucide-react';
import { useCreatePatient } from '../../hooks/usePatients';

export function NewPatient() {
    const navigate = useNavigate();
    const createPatient = useCreatePatient();

    const [form, setForm] = useState({
        name: '',
        phone: '',
        email: '',
        dateOfBirth: '',
        gender: '',
        bloodGroup: '',
        medicalHistory: '',
        allergies: '',
        address: '',
    });

    const [error, setError] = useState<string | null>(null);

    const set = (field: string, value: string) => setForm(f => ({ ...f, [field]: value }));

    const handleSave = async () => {
        if (!form.name.trim() || !form.phone.trim()) {
            setError('Name and Phone are required.');
            return;
        }
        setError(null);
        try {
            await createPatient.mutateAsync({
                name: form.name.trim(),
                phone: form.phone.trim(),
                email: form.email.trim() || undefined,
                dateOfBirth: form.dateOfBirth || undefined,
                gender: form.gender || undefined,
                bloodGroup: form.bloodGroup || undefined,
                medicalHistory: form.medicalHistory.trim() || undefined,
                allergies: form.allergies ? form.allergies.split(',').map(a => a.trim()).filter(Boolean) : [],
                address: form.address.trim() || undefined,
            });
            navigate('/patients');
        } catch (err: any) {
            setError(err?.response?.data?.message || 'Failed to create patient. Please try again.');
        }
    };

    const headerContent = (
        <Button variant="ghost" className="mb-2 -ml-4" onClick={() => navigate('/patients')}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Directory
        </Button>
    );

    return (
        <PageWrapper
            title="New Patient Registration"
            description="Enter the primary details for the new patient."
            headerContent={headerContent}
            action={
                <Button
                    className="bg-blue-600 hover:bg-blue-700"
                    onClick={handleSave}
                    disabled={createPatient.isPending}
                >
                    {createPatient.isPending ? (
                        <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</>
                    ) : (
                        <><Save className="mr-2 h-4 w-4" /> Save Patient</>
                    )}
                </Button>
            }
        >
            {error && (
                <div className="mb-4 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm font-medium">
                    {error}
                </div>
            )}
            <Card>
                <CardContent className="p-6">
                    <div className="grid gap-6 md:grid-cols-2">
                        {/* Full Name */}
                        <div className="space-y-2 md:col-span-2">
                            <label className="text-sm font-semibold text-slate-700 flex items-center gap-1.5">
                                <User className="h-4 w-4 text-blue-600" /> Full Name <span className="text-red-500">*</span>
                            </label>
                            <Input
                                placeholder="e.g. Rahul Sharma"
                                value={form.name}
                                onChange={e => set('name', e.target.value)}
                            />
                        </div>

                        {/* Phone */}
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-slate-700 flex items-center gap-1.5">
                                <Phone className="h-4 w-4 text-blue-600" /> Phone Number <span className="text-red-500">*</span>
                            </label>
                            <Input
                                placeholder="+91 98765 43210"
                                value={form.phone}
                                onChange={e => set('phone', e.target.value)}
                            />
                        </div>

                        {/* Email */}
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-slate-700 flex items-center gap-1.5">
                                <Mail className="h-4 w-4 text-blue-600" /> Email Address
                            </label>
                            <Input
                                type="email"
                                placeholder="patient@example.com"
                                value={form.email}
                                onChange={e => set('email', e.target.value)}
                            />
                        </div>

                        {/* Date of Birth */}
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-slate-700 flex items-center gap-1.5">
                                <Calendar className="h-4 w-4 text-blue-600" /> Date of Birth
                            </label>
                            <Input
                                type="date"
                                value={form.dateOfBirth}
                                onChange={e => set('dateOfBirth', e.target.value)}
                            />
                        </div>

                        {/* Gender */}
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-slate-700">Gender</label>
                            <select
                                value={form.gender}
                                onChange={e => set('gender', e.target.value)}
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                            >
                                <option value="">Select gender...</option>
                                <option value="Male">Male</option>
                                <option value="Female">Female</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>

                        {/* Blood Group */}
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-slate-700 flex items-center gap-1.5">
                                <Heart className="h-4 w-4 text-red-500" /> Blood Group
                            </label>
                            <select
                                value={form.bloodGroup}
                                onChange={e => set('bloodGroup', e.target.value)}
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                            >
                                <option value="">Select blood group...</option>
                                {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => (
                                    <option key={bg} value={bg}>{bg}</option>
                                ))}
                            </select>
                        </div>

                        {/* Address */}
                        <div className="space-y-2 md:col-span-2">
                            <label className="text-sm font-semibold text-slate-700">Residential Address</label>
                            <Input
                                placeholder="123 Main St, Mumbai, MH"
                                value={form.address}
                                onChange={e => set('address', e.target.value)}
                            />
                        </div>

                        {/* Medical section */}
                        <div className="md:col-span-2 mt-2 pt-4 border-t">
                            <h3 className="font-semibold text-slate-800 mb-4">Medical Information</h3>
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-slate-700">Known Allergies</label>
                                    <Input
                                        placeholder="e.g. Penicillin, Latex (comma-separated)"
                                        value={form.allergies}
                                        onChange={e => set('allergies', e.target.value)}
                                    />
                                    <p className="text-xs text-slate-400">Separate with commas</p>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-slate-700">Medical History</label>
                                    <Input
                                        placeholder="e.g. Hypertension, Diabetes"
                                        value={form.medicalHistory}
                                        onChange={e => set('medicalHistory', e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end mt-8 gap-3">
                        <Button variant="outline" onClick={() => navigate('/patients')}>Cancel</Button>
                        <Button
                            className="bg-blue-600 hover:bg-blue-700 px-8"
                            onClick={handleSave}
                            disabled={createPatient.isPending}
                        >
                            {createPatient.isPending ? (
                                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</>
                            ) : (
                                <><Save className="mr-2 h-4 w-4" /> Save Patient</>
                            )}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </PageWrapper>
    );
}
