import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageWrapper } from '../../components/layout/PageWrapper';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '../../components/ui/table';
import { Badge } from '../../components/ui/badge';
import { MoreHorizontal, Plus, Search, FileText, Loader2, Download, Bell, Edit } from 'lucide-react';
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from '../../components/ui/dropdown-menu';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "../../components/ui/dialog";
import { useInvoices, useRecordPayment, useSendReminder } from '../../hooks/useBilling';
import api from '../../lib/api';

export function BillingList() {
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');
    const recordPayment = useRecordPayment();
    const sendReminder = useSendReminder();
    
    // Payment Dialog State
    const [paymentAmount, setPaymentAmount] = useState<number>(0);
    const [paymentMode, setPaymentMode] = useState<string>('UPI');
    const [activeInvId, setActiveInvId] = useState<string | null>(null);

    const { data, isLoading, isError } = useInvoices({ limit: 50 });
    const invoices = Array.isArray(data) ? data : (data?.data ?? []);
    const filtered = invoices.filter((inv: { patientId?: { name?: string }; patient?: { name?: string }; patientName?: string; invoiceNumber?: string }) => {
        const name = inv.patientId?.name ?? inv.patient?.name ?? inv.patientName ?? '';
        const invNo = inv.invoiceNumber ?? '';
        return name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            invNo.toLowerCase().includes(searchTerm.toLowerCase());
    });

    const getStatusBadge = (status: string) => {
        switch (status?.toUpperCase()) {
            case 'PAID': return <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100">Paid</Badge>;
            case 'ISSUED':
            case 'PENDING': return <Badge variant="secondary" className="bg-amber-100 text-amber-800 hover:bg-amber-100">Pending</Badge>;
            case 'OVERDUE': return <Badge variant="destructive" className="bg-red-100 text-red-800 hover:bg-red-100">Overdue</Badge>;
            case 'DRAFT': return <Badge variant="outline">Draft</Badge>;
            case 'CANCELLED': return <Badge variant="outline" className="text-slate-400">Cancelled</Badge>;
            default: return <Badge variant="outline">{status}</Badge>;
        }
    }

    const handleDownload = async (invId: string, invNo: string) => {
        try {
            const res = await api.get(`/invoices/${invId}/download`, { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `invoice-${invNo}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (error: any) {
            if (error.response?.data instanceof Blob) {
                const text = await error.response.data.text();
                alert('Server Error Details: ' + text);
            } else {
                alert('Failed to download invoice: ' + (error.message || 'Unknown error'));
            }
        }
    };

    return (
        <PageWrapper
            title="Billing & Invoicing"
            description="Manage patient payments, generate invoices, and track advance balances."
            action={
                <Button onClick={() => navigate('/billing/new')} className="bg-blue-600 hover:bg-blue-700">
                    <Plus className="mr-2 h-4 w-4" /> Create Invoice
                </Button>
            }
        >
            <Tabs defaultValue="invoices" className="w-full">
                <TabsList className="mb-4">
                    <TabsTrigger value="invoices">All Invoices</TabsTrigger>
                    <TabsTrigger value="advances">Advance Payments</TabsTrigger>
                </TabsList>

                <TabsContent value="invoices">
                    <div className="flex items-center justify-between py-4">
                        <div className="relative w-full max-w-sm">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search invoices by patient or ID..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-9 bg-white"
                            />
                        </div>
                    </div>

                    <div className="rounded-md border bg-white">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Invoice ID</TableHead>
                                    <TableHead>Patient Name</TableHead>
                                    <TableHead className="hidden md:table-cell">Date</TableHead>
                                    <TableHead>Amount (₹)</TableHead>
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
                                            Could not load invoices. Is the backend running?
                                        </TableCell>
                                    </TableRow>
                                )}
                                {!isLoading && !isError && filtered.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                                            No invoices found.
                                        </TableCell>
                                    </TableRow>
                                )}
                                {filtered.map((inv: { _id?: string; id?: string; invoiceNumber?: string; patientId?: { name?: string }; patient?: { name?: string }; patientName?: string; createdAt?: string; date?: string; grandTotal?: number; totalAmount?: number; amount?: number; pendingAmount?: number; status?: string }) => {
                                    const invId = inv._id ?? inv.id ?? '';
                                    const invNo = inv.invoiceNumber ?? invId.slice(-6).toUpperCase();
                                    // Backend populates patientId ref field — it becomes an object with name
                                    const patientName = inv.patientId?.name ?? inv.patient?.name ?? inv.patientName ?? 'Unknown';
                                    const date = inv.createdAt ? new Date(inv.createdAt).toLocaleDateString('en-IN') : (inv.date ?? '-');
                                    // Backend uses grandTotal (not totalAmount)
                                    const amount = inv.grandTotal ?? inv.totalAmount ?? inv.amount ?? 0;

                                    return (
                                        <TableRow key={invId}>
                                            <TableCell className="font-medium text-blue-600">#{invNo}</TableCell>
                                            <TableCell>{patientName}</TableCell>
                                            <TableCell className="hidden md:table-cell">{date}</TableCell>
                                            <TableCell className="font-semibold">₹{amount.toLocaleString('en-IN')}</TableCell>
                                            <TableCell>{getStatusBadge(inv.status ?? '')}</TableCell>
                                            <TableCell className="text-right flex justify-end gap-1 items-center">
                                                <Button 
                                                    variant="ghost" 
                                                    size="icon" 
                                                    title="Download PDF" 
                                                    onClick={() => handleDownload(invId, invNo)}
                                                    className="h-8 w-8 text-slate-500 hover:text-blue-600"
                                                >
                                                    <Download className="h-4 w-4" />
                                                </Button>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" className="h-8 w-8 p-0">
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem onClick={() => navigate(`/billing/${invId}`)}>
                                                            <FileText className="mr-2 h-4 w-4" /> View Invoice
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => navigate(`/billing/edit/${invId}`)}>
                                                            <Edit className="mr-2 h-4 w-4" /> Edit Invoice
                                                        </DropdownMenuItem>
                                                        <Dialog onOpenChange={(open) => {
                                                            if (open) {
                                                                setPaymentAmount(amount);
                                                                setPaymentMode('UPI');
                                                                setActiveInvId(invId);
                                                            }
                                                        }}>
                                                            <DialogTrigger asChild>
                                                                <DropdownMenuItem onSelect={(e) => e.preventDefault()}>Record Payment</DropdownMenuItem>
                                                            </DialogTrigger>
                                                            <DialogContent>
                                                                <DialogHeader>
                                                                    <DialogTitle>Record Payment for #{invNo}</DialogTitle>
                                                                    <DialogDescription>
                                                                        Log a new payment. Outstanding: ₹{amount.toLocaleString('en-IN')}.
                                                                    </DialogDescription>
                                                                </DialogHeader>
                                                                <div className="grid gap-4 py-4">
                                                                    <div className="grid grid-cols-4 items-center gap-4">
                                                                        <label htmlFor="amount" className="text-right text-sm font-medium">Amount</label>
                                                                        <Input 
                                                                            id="amount" 
                                                                            type="number" 
                                                                            value={paymentAmount} 
                                                                            onChange={(e) => setPaymentAmount(parseFloat(e.target.value) || 0)}
                                                                            className="col-span-3" 
                                                                        />
                                                                    </div>
                                                                    <div className="grid grid-cols-4 items-center gap-4">
                                                                        <label htmlFor="mode" className="text-right text-sm font-medium">Method</label>
                                                                        <select 
                                                                            id="mode" 
                                                                            value={paymentMode}
                                                                            onChange={(e) => setPaymentMode(e.target.value)}
                                                                            className="col-span-3 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                                                        >
                                                                            <option value="UPI">UPI</option>
                                                                            <option value="CARD">Credit Card</option>
                                                                            <option value="CASH">Cash</option>
                                                                        </select>
                                                                    </div>
                                                                </div>
                                                                <DialogFooter>
                                                                    <Button 
                                                                        type="button" 
                                                                        onClick={() => recordPayment.mutate({ id: invId, dto: { amount: paymentAmount, mode: paymentMode } })} 
                                                                        className="bg-blue-600 hover:bg-blue-700" 
                                                                        disabled={recordPayment.isPending}
                                                                    >
                                                                        {recordPayment.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                                                                        Save Payment
                                                                    </Button>
                                                                </DialogFooter>
                                                            </DialogContent>
                                                        </Dialog>
                                                        
                                                        {(!inv.status || inv.status !== 'PAID' && inv.status !== 'DRAFT') && (
                                                            <>
                                                                <DropdownMenuSeparator />
                                                                <DropdownMenuItem 
                                                                    onClick={() => {
                                                                        sendReminder.mutate(invId, {
                                                                            onSuccess: () => alert('Reminder email sent to patient!')
                                                                        });
                                                                    }}
                                                                    disabled={sendReminder.isPending}
                                                                >
                                                                    <Bell className="mr-2 h-4 w-4 text-orange-500" />
                                                                    Send Reminder
                                                                </DropdownMenuItem>
                                                            </>
                                                        )}
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </div>
                </TabsContent>

                <TabsContent value="advances">
                    <div className="flex items-center justify-between py-4">
                        <div className="relative w-full max-w-sm">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input placeholder="Search advance payments..." className="pl-9 bg-white" />
                        </div>
                        <Button variant="outline"><Plus className="mr-2 h-4 w-4" /> Collect Advance</Button>
                    </div>

                    <div className="rounded-md border bg-white">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Receipt ID</TableHead>
                                    <TableHead>Patient Name</TableHead>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Amount (₹)</TableHead>
                                    <TableHead>Method</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                <TableRow>
                                    <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                                        Advance payment history will appear here once connected.
                                    </TableCell>
                                </TableRow>
                            </TableBody>
                        </Table>
                    </div>
                </TabsContent>
            </Tabs>
        </PageWrapper>
    );
}
