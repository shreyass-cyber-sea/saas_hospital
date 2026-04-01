import { useState } from 'react';
import { PageWrapper } from '../../components/layout/PageWrapper';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Progress } from "../../components/ui/progress";
import { Download, CalendarIcon, Loader2 } from 'lucide-react';
import {
    LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '../../components/ui/table';
import {
    useRevenueDaily,
    useRevenueMonthly,
    useAppointmentsSummary,
    usePatientGrowth,
    useInventoryExpenses,
    useChairUtilization,
    usePendingPayments,
} from '../../hooks/useReports';
import { useLowStockItems } from '../../hooks/useInventory';

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const PIE_COLORS: Record<string, string> = {
    completed: '#10b981',
    cancelled: '#ef4444',
    no_show: '#f59e0b',
    scheduled: '#3b82f6',
    waiting: '#8b5cf6',
    in_progress: '#0ea5e9',
};

export function ReportsView() {
    const [dateRange, setDateRange] = useState({
        from: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
        to: new Date().toISOString().split('T')[0]
    });
    const [appliedRange, setAppliedRange] = useState({ ...dateRange });

    const { data: dailyRevData, isLoading: dailyRevLoading } = useRevenueDaily(appliedRange.from, appliedRange.to);
    const { data: monthlyRevData, isLoading: monthlyRevLoading } = useRevenueMonthly(appliedRange.from, appliedRange.to);
    const { data: apptSummary, isLoading: apptLoading } = useAppointmentsSummary(appliedRange.from, appliedRange.to);
    const { data: patientGrowthData, isLoading: patientLoading } = usePatientGrowth(appliedRange.from, appliedRange.to);
    const { data: inventoryExpenses, isLoading: invLoading } = useInventoryExpenses(appliedRange.from, appliedRange.to);
    const { data: chairData, isLoading: chairLoading } = useChairUtilization(appliedRange.from, appliedRange.to);
    const { data: pendingPayments, isLoading: pendingLoading } = usePendingPayments();
    const { data: lowStockData, isLoading: lowStockLoading } = useLowStockItems();

    // ── Revenue ──────────────────────────────────────────────────────────────
    const dailyRevChartData: { date: string; billed: number; collected: number }[] = Array.isArray(dailyRevData)
        ? dailyRevData.map((r: { date: string; totalRevenue: number; collected: number }) => ({
            date: r.date,
            billed: r.totalRevenue ?? 0,
            collected: r.collected ?? 0,
        }))
        : [];

    const monthlyRevChartData: { date: string; billed: number; collected: number }[] = Array.isArray(monthlyRevData)
        ? monthlyRevData.map((r: { month: number; year: number; totalRevenue: number; collected: number }) => ({
            date: `${MONTH_NAMES[(r.month ?? 1) - 1]} ${r.year}`,
            billed: r.totalRevenue ?? 0,
            collected: r.collected ?? 0,
        }))
        : [];

    const totalBilled = dailyRevChartData.reduce((s, r) => s + r.billed, 0);
    const totalCollected = dailyRevChartData.reduce((s, r) => s + r.collected, 0);
    const totalPending = totalBilled - totalCollected;

    // ── Appointments ─────────────────────────────────────────────────────────
    const apptPieData = apptSummary
        ? Object.entries(apptSummary)
            .filter(([key]) => key !== 'total')
            .map(([key, value]) => ({
                name: key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
                value: value as number,
                color: PIE_COLORS[key.toLowerCase()] ?? '#94a3b8',
            }))
        : [];

    // ── Patient Growth ────────────────────────────────────────────────────────
    const patientChartData: { month: string; newPatients: number }[] = Array.isArray(patientGrowthData)
        ? patientGrowthData.map((r: { month: number; year: number; newPatients: number }) => ({
            month: `${MONTH_NAMES[(r.month ?? 1) - 1]} ${r.year}`,
            newPatients: r.newPatients ?? 0,
        }))
        : [];

    // ── Inventory Expenses ────────────────────────────────────────────────────
    const expenseChartData: { category: string; amount: number }[] = Array.isArray(inventoryExpenses)
        ? inventoryExpenses.map((r: { category: string; totalSpent: number }) => ({
            category: r.category ?? 'Other',
            amount: r.totalSpent ?? 0,
        }))
        : [];

    // ── Chair Utilization ─────────────────────────────────────────────────────
    const chairs: { chairId: string; totalAppointments: number; totalHours: number; utilizationPercent: number }[] =
        Array.isArray(chairData) ? chairData : [];

    // ── Pending Payments ──────────────────────────────────────────────────────
    const pendingList: { name: string; totalPending: number; patientId?: string }[] =
        Array.isArray(pendingPayments) ? pendingPayments : [];

    // ── Low Stock Items ───────────────────────────────────────────────────────
    const lowStockItems: { _id: string; name: string; currentStock: number; minimumStock: number; unit?: string }[] =
        Array.isArray(lowStockData) ? lowStockData : [];

    return (
        <PageWrapper
            title="Reports & Analytics"
            description="In-depth insights into your clinic's performance."
            action={
                <Button variant="outline">
                    <Download className="mr-2 h-4 w-4" /> Export Data
                </Button>
            }
        >
            <div className="flex items-center gap-4 bg-white p-3 rounded-md border mb-6 w-max">
                <CalendarIcon className="h-5 w-5 text-slate-400 ml-2" />
                <div className="flex items-center gap-2">
                    <Input type="date" value={dateRange.from} onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })} className="h-8 w-36" />
                    <span className="text-slate-500 font-medium">to</span>
                    <Input type="date" value={dateRange.to} onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })} className="h-8 w-36" />
                </div>
                <Button size="sm" className="bg-slate-900 text-white" onClick={() => setAppliedRange({ ...dateRange })}>Apply Range</Button>
            </div>

            <Tabs defaultValue="revenue" className="w-full">
                <TabsList className="mb-6 grid grid-cols-4 w-full md:w-auto md:inline-grid">
                    <TabsTrigger value="revenue">Revenue</TabsTrigger>
                    <TabsTrigger value="appointments">Appointments</TabsTrigger>
                    <TabsTrigger value="patients">Patients</TabsTrigger>
                    <TabsTrigger value="inventory">Inventory</TabsTrigger>
                </TabsList>

                {/* REVENUE TAB */}
                <TabsContent value="revenue">
                    <div className="grid gap-4 md:grid-cols-4 mb-6">
                        <Card>
                            <CardContent className="p-6">
                                <p className="text-sm font-medium text-slate-500">Total Billed</p>
                                <h3 className="text-2xl font-bold mt-1 text-slate-900">
                                    {dailyRevLoading ? <Loader2 className="h-5 w-5 animate-spin text-blue-600" /> : `₹${totalBilled.toLocaleString('en-IN')}`}
                                </h3>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="p-6">
                                <p className="text-sm font-medium text-slate-500">Total Collected</p>
                                <h3 className="text-2xl font-bold mt-1 text-indigo-600">
                                    {dailyRevLoading ? <Loader2 className="h-5 w-5 animate-spin text-blue-600" /> : `₹${totalCollected.toLocaleString('en-IN')}`}
                                </h3>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="p-6">
                                <p className="text-sm font-medium text-slate-500">Total Pending</p>
                                <h3 className="text-2xl font-bold mt-1 text-amber-600">
                                    {dailyRevLoading ? <Loader2 className="h-5 w-5 animate-spin text-blue-600" /> : `₹${totalPending.toLocaleString('en-IN')}`}
                                </h3>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="p-6">
                                <p className="text-sm font-medium text-slate-500">Outstanding Invoices</p>
                                <h3 className="text-2xl font-bold mt-1 text-slate-900">
                                    {pendingLoading ? <Loader2 className="h-5 w-5 animate-spin text-blue-600" /> : pendingList.length}
                                </h3>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="grid gap-6 md:grid-cols-2">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">Daily Revenue</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="h-[300px] w-full mt-4">
                                    {dailyRevLoading ? (
                                        <div className="flex items-center justify-center h-full"><Loader2 className="h-8 w-8 animate-spin text-blue-600" /></div>
                                    ) : dailyRevChartData.length === 0 ? (
                                        <div className="flex items-center justify-center h-full text-slate-400 text-sm">No revenue data for this period</div>
                                    ) : (
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={dailyRevChartData}>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} dy={10} />
                                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dx={-10} tickFormatter={(v) => `₹${v}`} />
                                                <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} formatter={(v) => [`₹${Number(v).toLocaleString('en-IN')}`, '']} />
                                                <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                                                <Bar dataKey="billed" name="Billed" fill="#94a3b8" radius={[4, 4, 0, 0]} />
                                                <Bar dataKey="collected" name="Collected" fill="#10b981" radius={[4, 4, 0, 0]} />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">Monthly Trend</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="h-[300px] w-full mt-4">
                                    {monthlyRevLoading ? (
                                        <div className="flex items-center justify-center h-full"><Loader2 className="h-8 w-8 animate-spin text-blue-600" /></div>
                                    ) : monthlyRevChartData.length === 0 ? (
                                        <div className="flex items-center justify-center h-full text-slate-400 text-sm">No monthly data for this period</div>
                                    ) : (
                                        <ResponsiveContainer width="100%" height="100%">
                                            <LineChart data={monthlyRevChartData}>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={10} />
                                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dx={-10} tickFormatter={(v) => `₹${v}`} />
                                                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} formatter={(v) => [`₹${Number(v).toLocaleString('en-IN')}`, '']} />
                                                <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                                                <Line type="monotone" dataKey="billed" name="Billed" stroke="#94a3b8" strokeWidth={3} dot={{ r: 3 }} />
                                                <Line type="monotone" dataKey="collected" name="Collected" stroke="#10b981" strokeWidth={3} dot={{ r: 3 }} />
                                            </LineChart>
                                        </ResponsiveContainer>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                {/* APPOINTMENTS TAB */}
                <TabsContent value="appointments">
                    <div className="grid gap-6 md:grid-cols-3 mb-6">
                        <Card className="md:col-span-1">
                            <CardHeader>
                                <CardTitle className="text-base">Appointment Outcomes</CardTitle>
                            </CardHeader>
                            <CardContent className="flex flex-col items-center justify-center">
                                <div className="h-[200px] w-full">
                                    {apptLoading ? (
                                        <div className="flex items-center justify-center h-full"><Loader2 className="h-8 w-8 animate-spin text-blue-600" /></div>
                                    ) : apptPieData.length === 0 ? (
                                        <div className="flex items-center justify-center h-full text-slate-400 text-sm">No appointment data</div>
                                    ) : (
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie
                                                    data={apptPieData}
                                                    innerRadius={60}
                                                    outerRadius={80}
                                                    paddingAngle={5}
                                                    dataKey="value"
                                                >
                                                    {apptPieData.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                                    ))}
                                                </Pie>
                                                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                                <Legend verticalAlign="bottom" height={36} />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    )}
                                </div>
                                {apptSummary && (
                                    <p className="text-sm text-slate-500 mt-2">Total: <span className="font-semibold text-slate-800">{apptSummary.total ?? 0}</span> appointments</p>
                                )}
                            </CardContent>
                        </Card>

                        <Card className="md:col-span-2">
                            <CardHeader>
                                <CardTitle className="text-base">Chair Utilization</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6 pt-4">
                                {chairLoading ? (
                                    <div className="flex items-center justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-blue-600" /></div>
                                ) : chairs.length === 0 ? (
                                    <p className="text-sm text-slate-400 text-center py-6">No chair utilization data for this period</p>
                                ) : (
                                    chairs.map((chair, i) => (
                                        <div key={i} className="space-y-2">
                                            <div className="flex justify-between text-sm font-medium">
                                                <span>Chair {chair.chairId} ({chair.totalAppointments} appts)</span>
                                                <span className="text-slate-500">{chair.utilizationPercent ?? 0}%</span>
                                            </div>
                                            <Progress value={chair.utilizationPercent ?? 0} className="h-2 bg-slate-100" />
                                        </div>
                                    ))
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                {/* PATIENTS TAB */}
                <TabsContent value="patients">
                    <div className="grid gap-6 md:grid-cols-2">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">Patient Growth (New Reg.)</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="h-[300px] w-full mt-4">
                                    {patientLoading ? (
                                        <div className="flex items-center justify-center h-full"><Loader2 className="h-8 w-8 animate-spin text-blue-600" /></div>
                                    ) : patientChartData.length === 0 ? (
                                        <div className="flex items-center justify-center h-full text-slate-400 text-sm">No patient growth data for this period</div>
                                    ) : (
                                        <ResponsiveContainer width="100%" height="100%">
                                            <LineChart data={patientChartData}>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} dy={10} />
                                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} dx={-10} />
                                                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                                <Line type="monotone" dataKey="newPatients" name="New Patients" stroke="#0ea5e9" strokeWidth={3} dot={{ r: 4, fill: '#0ea5e9', stroke: '#fff', strokeWidth: 2 }} />
                                            </LineChart>
                                        </ResponsiveContainer>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base text-amber-600">Top Pending Payments</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {pendingLoading ? (
                                    <div className="flex items-center justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-blue-600" /></div>
                                ) : (
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Patient Name</TableHead>
                                                <TableHead>Pending Amount</TableHead>
                                                <TableHead className="text-right">Action</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {pendingList.length === 0 ? (
                                                <TableRow>
                                                    <TableCell colSpan={3} className="text-center text-slate-400 py-6">No pending payments 🎉</TableCell>
                                                </TableRow>
                                            ) : (
                                                pendingList.slice(0, 10).map((p, i) => (
                                                    <TableRow key={i}>
                                                        <TableCell className="font-medium">{p.name}</TableCell>
                                                        <TableCell className="text-red-500 font-bold">₹{p.totalPending.toLocaleString('en-IN')}</TableCell>
                                                        <TableCell className="text-right"><Button variant="outline" size="sm">Remind</Button></TableCell>
                                                    </TableRow>
                                                ))
                                            )}
                                        </TableBody>
                                    </Table>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                {/* INVENTORY TAB */}
                <TabsContent value="inventory">
                    <div className="grid gap-6 md:grid-cols-2">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">Expenses by Category</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="h-[300px] w-full mt-4">
                                    {invLoading ? (
                                        <div className="flex items-center justify-center h-full"><Loader2 className="h-8 w-8 animate-spin text-blue-600" /></div>
                                    ) : expenseChartData.length === 0 ? (
                                        <div className="flex items-center justify-center h-full text-slate-400 text-sm">No inventory expense data for this period</div>
                                    ) : (
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={expenseChartData} layout="vertical" margin={{ top: 0, right: 0, left: 30, bottom: 0 }}>
                                                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#e2e8f0" />
                                                <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} tickFormatter={(v) => `₹${v}`} />
                                                <YAxis type="category" dataKey="category" axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 13, fontWeight: 500 }} dx={-10} />
                                                <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} formatter={(v) => [`₹${Number(v).toLocaleString('en-IN')}`, 'Spent']} />
                                                <Bar dataKey="amount" name="Amount Spent" fill="#8b5cf6" radius={[0, 4, 4, 0]} barSize={24} />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base text-red-600">Low Stock Triggers</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Item</TableHead>
                                            <TableHead>Current</TableHead>
                                            <TableHead>Min.</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {lowStockLoading ? (
                                            <TableRow>
                                                <TableCell colSpan={3} className="text-center py-6">
                                                    <Loader2 className="h-5 w-5 animate-spin text-blue-600 mx-auto" />
                                                </TableCell>
                                            </TableRow>
                                        ) : lowStockItems.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={3} className="text-center text-slate-400 py-6">✅ No low stock items</TableCell>
                                            </TableRow>
                                        ) : (
                                            lowStockItems.map((item) => (
                                                <TableRow key={item._id}>
                                                    <TableCell className="font-medium text-slate-800">{item.name}</TableCell>
                                                    <TableCell className="text-red-600 font-bold">{item.currentStock} {item.unit ?? ''}</TableCell>
                                                    <TableCell className="text-slate-500">{item.minimumStock}</TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

            </Tabs>
        </PageWrapper>
    );
}
