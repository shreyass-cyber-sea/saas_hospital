import { useParams, useNavigate } from 'react-router-dom';
import { PageWrapper } from '../../components/layout/PageWrapper';
import { Button } from '../../components/ui/button';
import {
    Calendar as CalendarIcon, Phone, Mail, Edit, Loader2, User,
    Clock, FileText, Camera, Upload, Plus, X, CreditCard,
    CheckCircle2, AlertCircle, Paperclip, Trash2
} from 'lucide-react';
import { Card, CardContent } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";
import { usePatient, usePatientHistory, usePatientNotes, useAddClinicalNote } from '../../hooks/usePatients';
import { useInvoices } from '../../hooks/useBilling';
import { format } from 'date-fns';
import { Avatar, AvatarFallback, AvatarImage } from "../../components/ui/avatar";
import { useState, useRef } from 'react';
import { EditPatientDialog } from './EditPatientDialog';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '../../components/ui/dialog';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import api from '../../lib/api';
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '../../components/ui/table';

// ── Payment Dialog ────────────────────────────────────────────────────────────
function RecordPaymentDialog({
    invoice, onClose, onSuccess
}: {
    invoice: any;
    onClose: () => void;
    onSuccess: () => void;
}) {
    const [amount, setAmount] = useState<number>(invoice?.pendingAmount ?? invoice?.grandTotal ?? 0);
    const [mode, setMode] = useState('CASH');
    const [reference, setReference] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSave = async () => {
        setLoading(true);
        setError(null);
        try {
            await api.post(`/invoices/${invoice._id}/payment`, { amount, mode, reference: reference || undefined });
            onSuccess();
            onClose();
        } catch (e: any) {
            setError(e?.response?.data?.message || 'Payment failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <DialogContent className="sm:max-w-md">
            <DialogHeader>
                <DialogTitle>Record Payment</DialogTitle>
            </DialogHeader>
            {error && <p className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded">{error}</p>}
            <div className="grid gap-4 py-2">
                <div className="space-y-1">
                    <Label>Amount (₹)</Label>
                    <Input type="number" value={amount} onChange={e => setAmount(parseFloat(e.target.value) || 0)} />
                </div>
                <div className="space-y-1">
                    <Label>Payment Method</Label>
                    <select
                        value={mode}
                        onChange={e => setMode(e.target.value)}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                        <option value="CASH">Cash</option>
                        <option value="UPI">UPI</option>
                        <option value="CARD">Card</option>
                        <option value="CHEQUE">Cheque</option>
                        <option value="NEFT">NEFT / RTGS</option>
                    </select>
                </div>
                <div className="space-y-1">
                    <Label>Reference / Transaction ID (optional)</Label>
                    <Input placeholder="UPI ref / cheque no." value={reference} onChange={e => setReference(e.target.value)} />
                </div>
            </div>
            <DialogFooter>
                <Button variant="outline" onClick={onClose}>Cancel</Button>
                <Button className="bg-blue-600 hover:bg-blue-700" onClick={handleSave} disabled={loading}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save Payment
                </Button>
            </DialogFooter>
        </DialogContent>
    );
}

// ── Add Clinical Note Dialog ──────────────────────────────────────────────────
function AddNoteDialog({ patientId, onClose, onSuccess }: { patientId: string; onClose: () => void; onSuccess: () => void }) {
    const addNote = useAddClinicalNote(patientId);
    const [form, setForm] = useState({
        diagnosis: '',
        clinicalFindings: '',
        treatmentPlan: '',
        treatmentDone: '',
        prescriptions: '',
    });
    const [error, setError] = useState<string | null>(null);
    const set = (f: string, v: string) => setForm(prev => ({ ...prev, [f]: v }));

    const handleSave = async () => {
        if (!form.diagnosis.trim() && !form.clinicalFindings.trim()) {
            setError('Please enter at least a diagnosis or clinical findings.');
            return;
        }
        setError(null);
        try {
            await addNote.mutateAsync({
                diagnosis: form.diagnosis.trim() || undefined,
                clinicalFindings: form.clinicalFindings.trim() || undefined,
                treatmentPlan: form.treatmentPlan.trim() || undefined,
                treatmentDone: form.treatmentDone.trim() || undefined,
                prescriptions: form.prescriptions ? form.prescriptions.split('\n').filter(Boolean) : [],
            });
            onSuccess();
            onClose();
        } catch (e: any) {
            setError(e?.response?.data?.message || 'Failed to save note');
        }
    };

    return (
        <DialogContent className="sm:max-w-lg">
            <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-blue-600" /> Add Clinical Note
                </DialogTitle>
            </DialogHeader>
            {error && <p className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded mb-2">{error}</p>}
            <div className="grid gap-4 py-2 max-h-[60vh] overflow-y-auto pr-1">
                <div className="space-y-1">
                    <Label>Diagnosis / Chief Complaint</Label>
                    <Input placeholder="e.g. Dental caries on 36" value={form.diagnosis} onChange={e => set('diagnosis', e.target.value)} />
                </div>
                <div className="space-y-1">
                    <Label>Clinical Findings</Label>
                    <textarea
                        className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Describe clinical findings..."
                        value={form.clinicalFindings}
                        onChange={e => set('clinicalFindings', e.target.value)}
                    />
                </div>
                <div className="space-y-1">
                    <Label>Treatment Done</Label>
                    <Input placeholder="e.g. Scaling and polishing" value={form.treatmentDone} onChange={e => set('treatmentDone', e.target.value)} />
                </div>
                <div className="space-y-1">
                    <Label>Treatment Plan</Label>
                    <Input placeholder="e.g. RCT on 36, review in 1 week" value={form.treatmentPlan} onChange={e => set('treatmentPlan', e.target.value)} />
                </div>
                <div className="space-y-1">
                    <Label>Prescriptions (one per line)</Label>
                    <textarea
                        className="flex min-h-[70px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Amoxicillin 500mg TDS × 5 days&#10;Ibuprofen 400mg SOS"
                        value={form.prescriptions}
                        onChange={e => set('prescriptions', e.target.value)}
                    />
                </div>
            </div>
            <DialogFooter>
                <Button variant="outline" onClick={onClose}>Cancel</Button>
                <Button className="bg-blue-600 hover:bg-blue-700 px-6" onClick={handleSave} disabled={addNote.isPending}>
                    {addNote.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save Note
                </Button>
            </DialogFooter>
        </DialogContent>
    );
}

export function PatientProfile() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [editOpen, setEditOpen] = useState(false);
    const [noteDialogOpen, setNoteDialogOpen] = useState(false);
    const [paymentInvoice, setPaymentInvoice] = useState<any | null>(null);

    // File upload state
    const [uploadingFile, setUploadingFile] = useState(false);
    const [uploadedFiles, setUploadedFiles] = useState<{ name: string; url: string; type: string; uploadedAt: string }[]>([]);
    const [uploadError, setUploadError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const { data: patient, isLoading: isPatientLoading, refetch: refetchPatient } = usePatient(id || '');
    const { data: historyData, isLoading: isHistoryLoading } = usePatientHistory(id || '');
    const { data: notes = [], isLoading: isNotesLoading, refetch: refetchNotes } = usePatientNotes(id || '');
    const { data: patientInvoices = [], isLoading: isInvoiceLoading, refetch: refetchInvoices } = useInvoices({ patientId: id });

    const isLoading = isPatientLoading || isHistoryLoading || isNotesLoading;

    // Handle file upload
    const handleFileUpload = async (file: File) => {
        if (!file) return;
        setUploadingFile(true);
        setUploadError(null);
        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('folder', 'patients');
            const res = await api.post('/storage/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            const fileUrl = res.data?.fileUrl || res.data?.data?.fileUrl || res.data?.url;
            if (fileUrl) {
                setUploadedFiles(prev => [...prev, {
                    name: file.name,
                    url: fileUrl,
                    type: file.type,
                    uploadedAt: new Date().toISOString(),
                }]);
            } else {
                setUploadError('Upload succeeded but no URL returned.');
            }
        } catch (e: any) {
            setUploadError(e?.response?.data?.message || 'Upload failed. Please try again.');
        } finally {
            setUploadingFile(false);
        }
    };

    const getInvoiceStatusBadge = (status: string) => {
        switch (status?.toUpperCase()) {
            case 'PAID': return <Badge className="bg-emerald-100 text-emerald-800 text-xs">Paid</Badge>;
            case 'ISSUED':
            case 'PENDING': return <Badge className="bg-amber-100 text-amber-800 text-xs">Pending</Badge>;
            case 'OVERDUE': return <Badge className="bg-red-100 text-red-800 text-xs">Overdue</Badge>;
            default: return <Badge variant="outline" className="text-xs">{status}</Badge>;
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
        );
    }

    if (!patient) {
        return (
            <div className="p-8 text-center bg-white rounded-lg border">
                <h2 className="text-xl font-semibold text-slate-800">Patient not found</h2>
                <Button onClick={() => navigate('/patients')} className="mt-4">Back to Patients</Button>
            </div>
        );
    }

    const { notes: historyNotes = [] } = historyData || {};

    return (
        <PageWrapper
            title={patient.name}
            description={`Patient ID: #${patient.patientId} • Added ${patient.createdAt ? format(new Date(patient.createdAt), 'MMM yyyy') : 'N/A'}`}
            action={
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        className="rounded-xl border-slate-200"
                        onClick={() => navigate(`/appointments?patient=${id}`)}
                    >
                        <CalendarIcon className="mr-2 h-4 w-4 text-primary" /> Book Appointment
                    </Button>
                    <Button
                        className="bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 rounded-xl"
                        onClick={() => setEditOpen(true)}
                    >
                        <Edit className="mr-2 h-4 w-4" /> Edit Profile
                    </Button>
                </div>
            }
        >
            <EditPatientDialog patient={patient} open={editOpen} onOpenChange={setEditOpen} />

            {/* Clinical Note Dialog */}
            <Dialog open={noteDialogOpen} onOpenChange={setNoteDialogOpen}>
                {noteDialogOpen && (
                    <AddNoteDialog
                        patientId={id || ''}
                        onClose={() => setNoteDialogOpen(false)}
                        onSuccess={() => refetchNotes()}
                    />
                )}
            </Dialog>

            {/* Payment Dialog */}
            <Dialog open={!!paymentInvoice} onOpenChange={open => { if (!open) setPaymentInvoice(null); }}>
                {paymentInvoice && (
                    <RecordPaymentDialog
                        invoice={paymentInvoice}
                        onClose={() => setPaymentInvoice(null)}
                        onSuccess={() => refetchInvoices()}
                    />
                )}
            </Dialog>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                {/* Patient Card */}
                <Card className="md:col-span-1 border-t-4 border-t-primary shadow-sm overflow-hidden rounded-[2rem] border-none">
                    <CardContent className="p-6">
                        <div className="flex flex-col items-center mb-6 pt-2">
                            <Avatar className="h-40 w-40 border-4 border-white shadow-xl mb-4">
                                <AvatarImage src={patient.photoUrl} alt={patient.name} className="object-cover" />
                                <AvatarFallback className="bg-primary/10 text-primary">
                                    <User className="h-20 w-20" />
                                </AvatarFallback>
                            </Avatar>
                            <div className="text-center">
                                <h3 className="font-bold text-xl text-slate-900 font-outfit">{patient.name}</h3>
                                <Badge variant="outline" className={`mt-2 border-none font-bold ${patient.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'}`}>
                                    {patient.isActive ? 'Active Member' : 'Inactive'}
                                </Badge>
                            </div>
                        </div>

                        <div className="space-y-4 text-sm mt-6 border-t border-slate-100 pt-6">
                            <h4 className="font-bold text-slate-400 uppercase text-[10px] tracking-widest mb-2">Connect</h4>
                            <div className="flex items-center gap-3 text-slate-600">
                                <div className="bg-primary/5 p-1.5 rounded-lg">
                                    <Phone className="h-3.5 w-3.5 text-primary" />
                                </div>
                                <span className="font-bold">{patient.phone}</span>
                            </div>
                            <div className="flex items-center gap-3 text-slate-600">
                                <div className="bg-primary/5 p-1.5 rounded-lg">
                                    <Mail className="h-3.5 w-3.5 text-primary" />
                                </div>
                                <span className="font-bold truncate">{patient.email || 'No email provided'}</span>
                            </div>

                            <div className="pt-4 space-y-3">
                                <div className="flex justify-between items-center py-2 border-b border-dashed border-slate-100">
                                    <span className="text-slate-400 font-medium">Age / Gender</span>
                                    <span className="font-bold text-slate-900">
                                        {patient.dateOfBirth ? `${new Date().getFullYear() - new Date(patient.dateOfBirth).getFullYear()}y` : 'N/A'}, {patient.gender || 'N/A'}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center py-2 border-b border-dashed border-slate-100">
                                    <span className="text-slate-400 font-medium">Blood Group</span>
                                    <span className="font-bold text-slate-900">{patient.bloodGroup || 'N/A'}</span>
                                </div>
                                <div className="flex justify-between items-center py-2 border-b border-dashed border-slate-100">
                                    <span className="text-slate-400 font-medium">Last Visit</span>
                                    <span className="font-bold text-slate-900">
                                        {patient.lastVisit ? format(new Date(patient.lastVisit), 'MMM d, yyyy') : 'No recent visits'}
                                    </span>
                                </div>
                            </div>

                            {(patient.medicalHistory || (patient.allergies && patient.allergies.length > 0)) && (
                                <div className="mt-4 bg-orange-50 -mx-6 px-6 py-4 border-t border-b border-orange-100">
                                    <span className="font-bold text-orange-800 text-[10px] uppercase tracking-widest block mb-2">Medical Alerts</span>
                                    <div className="space-y-2">
                                        {patient.allergies && patient.allergies.length > 0 && (
                                            <div className="flex flex-wrap gap-1">
                                                {patient.allergies.map((allergy: string) => (
                                                    <Badge key={allergy} variant="destructive" className="text-[10px] py-0 px-2 bg-red-100 text-red-700 hover:bg-red-100 border-none">
                                                        Allergy: {allergy}
                                                    </Badge>
                                                ))}
                                            </div>
                                        )}
                                        {patient.medicalHistory && (
                                            <p className="text-xs font-semibold text-slate-800 leading-relaxed italic border-l-2 border-orange-300 pl-3 py-1">
                                                {patient.medicalHistory}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Tabs */}
                <div className="md:col-span-2">
                    <Tabs defaultValue="history" className="w-full">
                        <TabsList className="grid w-full grid-cols-4 bg-slate-100 p-1">
                            <TabsTrigger value="history">Visits</TabsTrigger>
                            <TabsTrigger value="notes">Clinical Notes</TabsTrigger>
                            <TabsTrigger value="documents">Files</TabsTrigger>
                            <TabsTrigger value="billing">Billing</TabsTrigger>
                        </TabsList>

                        {/* ── VISITS TAB ── */}
                        <TabsContent value="history" className="mt-4 focus-visible:ring-0">
                            <Card className="border-none shadow-sm ring-1 ring-slate-200">
                                <CardContent className="p-6">
                                    <div className="flex justify-between items-center mb-6">
                                        <h4 className="font-bold text-slate-900 flex items-center gap-2 font-outfit text-lg">
                                            <Clock className="h-5 w-5 text-primary" />
                                            Visit History
                                        </h4>
                                        <Badge variant="secondary" className="bg-primary/10 text-primary border-none font-bold">
                                            {historyNotes.length} Records Found
                                        </Badge>
                                    </div>

                                    {historyNotes.length > 0 ? (
                                        <div className="space-y-8 relative before:absolute before:inset-0 before:ml-5 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-primary/20 before:to-transparent">
                                            {historyNotes.map((note: any) => (
                                                <div key={note._id} className="relative pl-12 group">
                                                    <span className="absolute left-3 top-1.5 h-4 w-4 rounded-full border-4 border-white bg-primary shadow-sm z-10 group-hover:scale-125 transition-transform"></span>
                                                    <div className="flex flex-col gap-1">
                                                        <div className="flex items-center gap-2 flex-wrap">
                                                            <span className="text-xs font-bold text-slate-400">
                                                                {format(new Date(note.createdAt), 'MMM d, yyyy • p')}
                                                            </span>
                                                            <span className="text-[10px] font-extrabold bg-slate-100 text-slate-500 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                                                                Dr. {note.doctorId?.name || 'Unknown'}
                                                            </span>
                                                        </div>
                                                        <h5 className="font-bold text-slate-900 mt-1 flex items-center gap-2 text-base">
                                                            {note.diagnosis || note.treatmentDone || 'Follow-up / Consultation'}
                                                        </h5>
                                                        <p className="text-sm text-slate-600 leading-relaxed mt-1">
                                                            {note.clinicalFindings || 'No findings recorded for this visit.'}
                                                        </p>
                                                        {note.treatmentPlan && (
                                                            <div className="mt-2 text-[11px] font-medium text-primary bg-primary/5 px-3 py-1.5 rounded-md inline-flex items-center gap-2 w-fit">
                                                                <FileText className="h-3 w-3" />
                                                                <b>Plan:</b> {note.treatmentPlan}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="py-12 text-center text-slate-400">
                                            <CalendarIcon className="h-12 w-12 mx-auto mb-3 opacity-20" />
                                            <p className="text-sm font-medium">No visit history found.</p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* ── CLINICAL NOTES TAB ── */}
                        <TabsContent value="notes" className="mt-4 focus-visible:ring-0">
                            <Card className="border-none shadow-sm ring-1 ring-slate-200 rounded-[2rem] overflow-hidden">
                                <CardContent className="p-6">
                                    <div className="flex justify-between items-center mb-6">
                                        <h4 className="font-bold text-slate-900 flex items-center gap-2 font-outfit text-lg">
                                            <FileText className="h-5 w-5 text-primary" />
                                            Clinical Notes
                                        </h4>
                                        <Button
                                            size="sm"
                                            className="bg-primary hover:bg-primary/90 font-bold shadow-lg shadow-primary/20 rounded-xl px-4"
                                            onClick={() => setNoteDialogOpen(true)}
                                        >
                                            <Plus className="mr-1 h-4 w-4" /> New Note
                                        </Button>
                                    </div>
                                    {isNotesLoading ? (
                                        <div className="py-10 flex justify-center">
                                            <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            {notes.length > 0 ? (
                                                notes.map((note: any) => (
                                                    <div key={note._id} className="p-5 border rounded-xl bg-white hover:shadow-md transition-all cursor-pointer border-slate-200">
                                                        <div className="flex justify-between items-start mb-3">
                                                            <div>
                                                                <h5 className="font-bold text-slate-900">{note.diagnosis || 'Clinical Record'}</h5>
                                                                <p className="text-xs text-slate-400 font-bold mt-1">
                                                                    {format(new Date(note.createdAt), 'MMM d, yyyy')} • Dr. {note.doctorId?.name || 'Unknown'}
                                                                </p>
                                                            </div>
                                                            <Badge className="bg-primary/10 text-primary hover:bg-primary/10 border-none font-bold text-[10px] tracking-widest">
                                                                COMPLETED
                                                            </Badge>
                                                        </div>
                                                        <p className="text-sm text-slate-600 line-clamp-2 leading-relaxed">
                                                            {note.clinicalFindings || note.treatmentDone}
                                                        </p>
                                                        {note.prescriptions && note.prescriptions.length > 0 && (
                                                            <div className="flex gap-2 mt-4">
                                                                <span className="bg-slate-100 text-slate-500 px-2.5 py-1 rounded text-[10px] font-bold flex items-center gap-1">
                                                                    <FileText className="h-3 w-3" /> Prescription Added
                                                                </span>
                                                            </div>
                                                        )}
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="py-12 text-center text-slate-400">
                                                    <FileText className="h-12 w-12 mx-auto mb-3 opacity-20" />
                                                    <p className="text-sm font-medium">No clinical notes recorded yet.</p>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="mt-4"
                                                        onClick={() => setNoteDialogOpen(true)}
                                                    >
                                                        <Plus className="mr-2 h-4 w-4" /> Add First Note
                                                    </Button>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* ── FILES TAB ── */}
                        <TabsContent value="documents" className="mt-4 focus-visible:ring-0">
                            <Card className="border-none shadow-sm ring-1 ring-slate-200">
                                <CardContent className="p-6">
                                    <div className="flex justify-between items-center mb-6">
                                        <h4 className="font-bold text-slate-900 flex items-center gap-2 font-outfit text-lg">
                                            <Paperclip className="h-5 w-5 text-primary" />
                                            Patient Files & Documents
                                        </h4>
                                        <Button
                                            size="sm"
                                            className="bg-primary hover:bg-primary/90 rounded-xl px-4"
                                            onClick={() => fileInputRef.current?.click()}
                                            disabled={uploadingFile}
                                        >
                                            {uploadingFile ? (
                                                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Uploading...</>
                                            ) : (
                                                <><Upload className="mr-2 h-4 w-4" /> Upload File</>
                                            )}
                                        </Button>
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            className="hidden"
                                            accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
                                            onChange={e => {
                                                const file = e.target.files?.[0];
                                                if (file) handleFileUpload(file);
                                                e.target.value = '';
                                            }}
                                        />
                                    </div>

                                    {uploadError && (
                                        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-2 text-sm flex items-center gap-2">
                                            <AlertCircle className="h-4 w-4 flex-shrink-0" />
                                            {uploadError}
                                        </div>
                                    )}

                                    {/* Upload drop zone */}
                                    <div
                                        className="border-2 border-dashed border-slate-200 rounded-xl p-8 text-center mb-4 cursor-pointer hover:bg-slate-50 transition-colors"
                                        onClick={() => fileInputRef.current?.click()}
                                        onDragOver={e => e.preventDefault()}
                                        onDrop={e => {
                                            e.preventDefault();
                                            const file = e.dataTransfer.files?.[0];
                                            if (file) handleFileUpload(file);
                                        }}
                                    >
                                        <Camera className="h-10 w-10 mx-auto mb-2 text-slate-300" />
                                        <p className="text-sm font-medium text-slate-500">Click or drag & drop to upload</p>
                                        <p className="text-xs text-slate-400 mt-1">PDF, Images, Word docs up to 10MB</p>
                                    </div>

                                    {uploadedFiles.length > 0 ? (
                                        <div className="space-y-2">
                                            {uploadedFiles.map((file, i) => (
                                                <div key={i} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200">
                                                    <div className="flex items-center gap-3">
                                                        <div className="bg-blue-100 p-2 rounded-lg">
                                                            <FileText className="h-4 w-4 text-blue-600" />
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-semibold text-slate-800">{file.name}</p>
                                                            <p className="text-[10px] text-slate-400">{format(new Date(file.uploadedAt), 'MMM d, yyyy • p')}</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <a href={file.url} target="_blank" rel="noopener noreferrer">
                                                            <Button variant="ghost" size="sm" className="text-blue-600 h-8 px-3">View</Button>
                                                        </a>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="text-red-400 h-8 w-8 p-0"
                                                            onClick={() => setUploadedFiles(prev => prev.filter((_, idx) => idx !== i))}
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-xs text-slate-400 text-center">No files uploaded yet for this patient.</p>
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* ── BILLING TAB ── */}
                        <TabsContent value="billing" className="mt-4 focus-visible:ring-0">
                            <Card className="border-none shadow-sm ring-1 ring-slate-200">
                                <CardContent className="p-6">
                                    <div className="flex justify-between items-center mb-6">
                                        <h4 className="font-bold text-slate-900 flex items-center gap-2 font-outfit text-lg">
                                            <CreditCard className="h-5 w-5 text-primary" />
                                            Billing & Invoices
                                        </h4>
                                        <Button
                                            size="sm"
                                            className="bg-primary hover:bg-primary/90 rounded-xl px-4"
                                            onClick={() => navigate(`/billing/new?patientId=${id}`)}
                                        >
                                            <Plus className="mr-2 h-4 w-4" /> Create Invoice
                                        </Button>
                                    </div>

                                    {isInvoiceLoading ? (
                                        <div className="py-10 flex justify-center">
                                            <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                                        </div>
                                    ) : patientInvoices.length > 0 ? (
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>Invoice #</TableHead>
                                                    <TableHead>Date</TableHead>
                                                    <TableHead>Amount</TableHead>
                                                    <TableHead>Status</TableHead>
                                                    <TableHead className="text-right">Actions</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {patientInvoices.map((inv: any) => {
                                                    const invId = inv._id ?? inv.id;
                                                    const invNo = inv.invoiceNumber ?? invId?.slice(-6).toUpperCase();
                                                    const amount = inv.grandTotal ?? inv.totalAmount ?? 0;
                                                    return (
                                                        <TableRow key={invId}>
                                                            <TableCell className="font-mono text-blue-600 font-medium">#{invNo}</TableCell>
                                                            <TableCell className="text-slate-600 text-sm">
                                                                {inv.createdAt ? format(new Date(inv.createdAt), 'MMM d, yyyy') : '-'}
                                                            </TableCell>
                                                            <TableCell className="font-bold">₹{amount.toLocaleString('en-IN')}</TableCell>
                                                            <TableCell>{getInvoiceStatusBadge(inv.status)}</TableCell>
                                                            <TableCell className="text-right">
                                                                <div className="flex justify-end gap-1">
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="sm"
                                                                        className="text-blue-600 h-7 px-2 text-xs"
                                                                        onClick={() => navigate(`/billing/${invId}`)}
                                                                    >
                                                                        View
                                                                    </Button>
                                                                    {inv.status !== 'PAID' && (
                                                                        <Button
                                                                            variant="ghost"
                                                                            size="sm"
                                                                            className="text-green-600 h-7 px-2 text-xs"
                                                                            onClick={() => setPaymentInvoice(inv)}
                                                                        >
                                                                            <CheckCircle2 className="mr-1 h-3 w-3" /> Pay
                                                                        </Button>
                                                                    )}
                                                                </div>
                                                            </TableCell>
                                                        </TableRow>
                                                    );
                                                })}
                                            </TableBody>
                                        </Table>
                                    ) : (
                                        <div className="py-12 text-center text-slate-400">
                                            <CreditCard className="h-12 w-12 mx-auto mb-3 opacity-20" />
                                            <p className="text-sm font-medium">No invoices found for this patient.</p>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="mt-4"
                                                onClick={() => navigate(`/billing/new?patientId=${id}`)}
                                            >
                                                <Plus className="mr-2 h-4 w-4" /> Create First Invoice
                                            </Button>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </div>
            </div>
        </PageWrapper>
    );
}
