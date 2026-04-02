import { useState, useMemo, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { PageWrapper } from '../../components/layout/PageWrapper';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Card, CardContent } from '../../components/ui/card';
import { Save, ArrowLeft, Plus, Trash2, Loader2, AlertCircle } from 'lucide-react';
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '../../components/ui/table';
import { useDoctors, useProcedures, useInvoice, useUpdateInvoice } from '../../hooks/useBilling';
import { usePatients } from '../../hooks/usePatients';
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "../../components/ui/select";
import { format } from 'date-fns';

interface LineItem {
    id: string;
    procedureId?: string;
    description: string;
    quantity: number;
    unitPrice: number;
}

export function EditInvoice() {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const { data: invoice, isLoading: isInvoiceLoading, isError } = useInvoice(id || '');
    const { data: patients = [] } = usePatients();
    const { data: doctors = [] } = useDoctors();
    const { data: procedures = [] } = useProcedures();
    const updateInvoice = useUpdateInvoice();

    const [selectedPatientId, setSelectedPatientId] = useState<string>('');
    const [selectedDoctorId, setSelectedDoctorId] = useState<string>('');
    const [notes, setNotes] = useState('');
    const [applyGst, setApplyGst] = useState(true);
    const [saveError, setSaveError] = useState<string | null>(null);
    const [lineItems, setLineItems] = useState<LineItem[]>([]);
    const [initialized, setInitialized] = useState(false);

    // Populate form from loaded invoice
    useEffect(() => {
        if (invoice && !initialized) {
            setSelectedPatientId(invoice.patient?.id || invoice.patientId?.id || invoice.patientId?._id || invoice.patientId || '');
            setSelectedDoctorId(invoice.doctor?.id || invoice.doctorId?.id || invoice.doctorId?._id || invoice.doctorId || '');
            setNotes(invoice.notes || '');
            setApplyGst((invoice.lineItems?.[0]?.taxPercent ?? 18) > 0);
            setLineItems(
                (invoice.lineItems || []).map((item: any, i: number) => ({
                    id: `existing-${i}`,
                    procedureId: item.procedureId?.id || item.procedureId?._id || item.procedureId,
                    description: item.description || '',
                    quantity: item.quantity || 1,
                    unitPrice: item.unitPrice || 0,
                }))
            );
            setInitialized(true);
        }
    }, [invoice, initialized]);

    const totals = useMemo(() => {
        const subtotal = lineItems.reduce((acc, item) => acc + (item.quantity * item.unitPrice), 0);
        const taxPercent = applyGst ? 18 : 0;
        const taxAmount = (subtotal * taxPercent) / 100;
        return { subtotal, taxAmount, total: subtotal + taxAmount };
    }, [lineItems, applyGst]);

    const addLineItem = () => {
        setLineItems([...lineItems, { id: Math.random().toString(36).substr(2, 9), description: '', quantity: 1, unitPrice: 0 }]);
    };

    const removeLineItem = (itemId: string) => {
        if (lineItems.length > 1) setLineItems(lineItems.filter(i => i.id !== itemId));
    };

    const updateLineItem = (itemId: string, updates: Partial<LineItem>) => {
        setLineItems(lineItems.map(item => {
            if (item.id !== itemId) return item;
            const updated = { ...item, ...updates };
            if (updates.procedureId) {
                const proc = procedures.find((p: any) => (p.id ?? p._id) === updates.procedureId);
                if (proc) {
                    updated.description = (proc as any).name;
                    updated.unitPrice = (proc as any).basePrice || 0;
                }
            }
            return updated;
        }));
    };

    const handleSave = async () => {
        if (!selectedPatientId || lineItems.some(i => !i.description)) {
            setSaveError('Please select a patient and fill in all service descriptions.');
            return;
        }
        setSaveError(null);
        try {
            await updateInvoice.mutateAsync({
                id: id!,
                dto: {
                    patientId: selectedPatientId,
                    doctorId: selectedDoctorId || undefined,
                    notes,
                    lineItems: lineItems.map(item => ({
                        procedureId: item.procedureId,
                        description: item.description,
                        quantity: item.quantity,
                        unitPrice: item.unitPrice,
                        taxPercent: applyGst ? 18 : 0,
                    })),
                },
            });
            navigate(`/billing/${id}`);
        } catch (error: any) {
            setSaveError(error?.response?.data?.message || 'Failed to update invoice.');
        }
    };

    if (isInvoiceLoading) {
        return (
            <div className="flex h-96 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
        );
    }

    if (isError || !invoice) {
        return (
            <div className="flex h-96 flex-col items-center justify-center gap-4">
                <AlertCircle className="h-12 w-12 text-red-500" />
                <h2 className="text-xl font-bold">Invoice Not Found</h2>
                <Button onClick={() => navigate('/billing')}>Back to Billing</Button>
            </div>
        );
    }

    return (
        <PageWrapper
            title={`Edit Invoice #${invoice.invoiceNumber}`}
            description="Modify services and details for this invoice."
            headerContent={
                <Button variant="ghost" className="mb-2 -ml-4" onClick={() => navigate(`/billing/${id}`)}>
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back to Invoice
                </Button>
            }
        >
            <Card className="border-slate-200 shadow-sm">
                <CardContent className="p-6">
                    {saveError && (
                        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm font-medium">
                            ⚠ {saveError}
                        </div>
                    )}

                    <div className="grid gap-8 md:grid-cols-2 mb-10">
                        {/* Patient */}
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-slate-700">Bill To (Patient) <span className="text-red-500">*</span></label>
                            <Select value={selectedPatientId} onValueChange={setSelectedPatientId}>
                                <SelectTrigger className="w-full bg-white border-slate-200 h-10">
                                    <SelectValue placeholder="Search or select patient..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {patients.map((p: any) => (
                                        <SelectItem key={p.id ?? p._id} value={p.id ?? p._id}>
                                            <div className="flex flex-col items-start">
                                                <span className="font-medium">{p.name}</span>
                                                <span className="text-xs text-slate-400">{p.phone}</span>
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Doctor */}
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-slate-700">Treating Doctor</label>
                            <Select value={selectedDoctorId} onValueChange={setSelectedDoctorId}>
                                <SelectTrigger className="w-full bg-white border-slate-200 h-10">
                                    <SelectValue placeholder="Select doctor..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {doctors.map((d: any) => (
                                        <SelectItem key={d.id ?? d._id} value={d.id ?? d._id}>
                                            {d.name} ({d.role})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Line Items */}
                    <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                        <div className="bg-slate-50/80 backdrop-blur-sm p-4 border-b flex justify-between items-center">
                            <h3 className="font-bold text-slate-800 flex items-center gap-2 text-base">
                                <Plus className="h-4 w-4 text-blue-600" /> Treatment Line Items
                            </h3>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={addLineItem}
                                className="bg-white border-blue-200 text-blue-700 hover:bg-blue-50 font-medium"
                            >
                                <Plus className="mr-2 h-4 w-4" /> Add Service
                            </Button>
                        </div>
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-slate-50/30">
                                    <TableHead className="w-[45%] px-6">Service / Description</TableHead>
                                    <TableHead>Qty</TableHead>
                                    <TableHead>Unit Price (₹)</TableHead>
                                    <TableHead className="text-right px-6">Total (₹)</TableHead>
                                    <TableHead className="w-[60px]"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {lineItems.map((item) => (
                                    <TableRow key={item.id} className="hover:bg-slate-50/50">
                                        <TableCell className="px-6 py-4">
                                            <div className="space-y-2">
                                                <Select value={item.procedureId} onValueChange={(val) => updateLineItem(item.id, { procedureId: val })}>
                                                    <SelectTrigger className="w-full bg-white border-slate-200 h-9 text-sm">
                                                        <SelectValue placeholder="Choose a procedure..." />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {procedures.map((p: any) => (
                                                            <SelectItem key={p.id ?? p._id} value={p.id ?? p._id}>{p.name}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                                <Input
                                                    placeholder="Custom description..."
                                                    value={item.description}
                                                    onChange={(e) => updateLineItem(item.id, { description: e.target.value })}
                                                    className="bg-white border-slate-200 h-9 text-xs"
                                                />
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Input
                                                type="number" value={item.quantity} min="1"
                                                onChange={(e) => updateLineItem(item.id, { quantity: parseInt(e.target.value) || 0 })}
                                                className="w-20 border-slate-200 h-9 text-center font-medium"
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Input
                                                type="number" value={item.unitPrice}
                                                onChange={(e) => updateLineItem(item.id, { unitPrice: parseFloat(e.target.value) || 0 })}
                                                className="w-32 border-slate-200 h-9 text-right font-medium pr-3"
                                            />
                                        </TableCell>
                                        <TableCell className="text-right font-bold text-slate-900 border-l px-6 align-middle">
                                            ₹{(item.quantity * item.unitPrice).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                        </TableCell>
                                        <TableCell className="px-2">
                                            <Button
                                                variant="ghost" size="icon"
                                                onClick={() => removeLineItem(item.id)}
                                                className="text-red-400 hover:text-red-600 hover:bg-red-50 rounded-full"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>

                        <div className="bg-slate-50/50 p-8 flex flex-col md:flex-row justify-between border-t gap-8">
                            <div className="flex-1 space-y-2">
                                <label className="text-sm font-semibold text-slate-700">Notes / Remarks</label>
                                <textarea
                                    className="w-full min-h-[80px] rounded-lg border border-slate-200 bg-white p-3 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="Add any billing notes..."
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                />
                            </div>
                            <div className="w-full md:w-72 space-y-3 pt-2">
                                <div className="flex justify-between text-slate-600 text-sm font-medium">
                                    <span>Subtotal</span>
                                    <span>₹{totals.subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                                </div>
                                <div className="flex justify-between text-slate-600 text-sm font-medium items-center">
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="checkbox" id="gst" checked={applyGst}
                                            onChange={(e) => setApplyGst(e.target.checked)}
                                            className="h-4 w-4 rounded"
                                        />
                                        <label htmlFor="gst" className="text-[10px] font-bold text-slate-500 cursor-pointer">APPLY GST (18%)</label>
                                    </div>
                                    <span>₹{totals.taxAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                                </div>
                                <div className="pt-3 border-t-2 border-slate-200 flex justify-between font-extrabold text-2xl text-blue-900">
                                    <span>Grand Total</span>
                                    <span>₹{totals.total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                                </div>
                                <div className="pt-4 flex justify-end gap-3">
                                    <Button variant="outline" onClick={() => navigate(`/billing/${id}`)}>Cancel</Button>
                                    <Button
                                        className="bg-blue-600 hover:bg-blue-700"
                                        onClick={handleSave}
                                        disabled={updateInvoice.isPending}
                                    >
                                        {updateInvoice.isPending ? (
                                            <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</>
                                        ) : (
                                            <><Save className="mr-2 h-4 w-4" /> Save Changes</>
                                        )}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </PageWrapper>
    );
}
