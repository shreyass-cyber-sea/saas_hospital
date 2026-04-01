import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageWrapper } from '../../components/layout/PageWrapper';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '../../components/ui/table';
import { Badge } from '../../components/ui/badge';
import { Plus, Search, Loader2, UserX } from 'lucide-react';
import { usePatients } from '../../hooks/usePatients';

export function PatientDirectory() {
    const navigate = useNavigate();
    const [search, setSearch] = useState('');

    const { data, isLoading, isError } = usePatients({ search, limit: 50 });

    // Backend returns { data: [], total: number, page: number } or just an array
    const patients = Array.isArray(data) ? data : (data?.data ?? []);

    return (
        <PageWrapper
            title="Patient Directory"
            description="Search and manage all registered patients."
            action={
                <Button onClick={() => navigate('/patients/new')} className="bg-blue-600 hover:bg-blue-700">
                    <Plus className="mr-2 h-4 w-4" /> Register Patient
                </Button>
            }
        >
            <div className="flex items-center py-4">
                <div className="relative w-full max-w-sm">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search by name, phone, or ID..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-9 bg-white"
                    />
                </div>
            </div>

            <div className="rounded-md border bg-white">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Patient ID</TableHead>
                            <TableHead>Name</TableHead>
                            <TableHead className="hidden md:table-cell">Phone</TableHead>
                            <TableHead className="hidden lg:table-cell">Last Visit</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading && (
                            <TableRow>
                                <TableCell colSpan={6} className="h-24 text-center">
                                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-blue-600" />
                                </TableCell>
                            </TableRow>
                        )}
                        {isError && (
                            <TableRow>
                                <TableCell colSpan={6} className="h-24 text-center text-red-500">
                                    <UserX className="h-6 w-6 mx-auto mb-2" />
                                    Could not load patients. Is the backend running?
                                </TableCell>
                            </TableRow>
                        )}
                        {!isLoading && !isError && patients.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                                    No patients found
                                </TableCell>
                            </TableRow>
                        )}
                        {patients.map((p: {
                            _id?: string; id?: string; patientId?: string; name?: string;
                            personalInfo?: { name?: string; phone?: string };
                            phone?: string; lastVisitDate?: string; status?: string;
                        }) => {
                            const id = p._id ?? p.id ?? '';
                            const name = p.personalInfo?.name ?? p.name ?? 'Unknown';
                            const phone = p.personalInfo?.phone ?? p.phone ?? '-';
                            const lastVisit = p.lastVisitDate ? new Date(p.lastVisitDate).toLocaleDateString('en-IN') : 'N/A';
                            const status = p.status ?? 'Active';
                            const patientId = p.patientId ?? id.slice(-6).toUpperCase();

                            return (
                                <TableRow key={id} className="cursor-pointer hover:bg-slate-50" onClick={() => navigate(`/patients/${id}`)}>
                                    <TableCell className="font-mono text-xs text-slate-500">#{patientId}</TableCell>
                                    <TableCell className="font-medium">{name}</TableCell>
                                    <TableCell className="hidden md:table-cell text-slate-600">{phone}</TableCell>
                                    <TableCell className="hidden lg:table-cell text-slate-600">{lastVisit}</TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className={
                                            status === 'Active' ? 'bg-emerald-50 text-emerald-700' :
                                                status === 'Inactive' ? 'bg-slate-100 text-slate-600' :
                                                    'bg-amber-50 text-amber-700'
                                        }>
                                            {status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); navigate(`/patients/${id}`); }}>
                                            View
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </div>

            {!isLoading && !isError && data?.total && (
                <p className="text-xs text-muted-foreground mt-4 text-right">
                    Showing {patients.length} of {data.total} patients
                </p>
            )}
        </PageWrapper>
    );
}
