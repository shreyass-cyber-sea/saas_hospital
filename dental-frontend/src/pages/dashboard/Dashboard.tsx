import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { 
    Download, Users, CalendarCheck, IndianRupee, TrendingUp, 
    Loader2, Package, Clock, ChevronRight, Plus, 
    AlertCircle, CheckCircle2 
} from 'lucide-react';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, BarChart, Bar
} from 'recharts';
import { PageWrapper } from '../../components/layout/PageWrapper';
import { useDashboard } from '../../hooks/useReports';
import { useTodayAppointments } from '../../hooks/useAppointments';
import { useLowStockItems } from '../../hooks/useInventory';
import { useAuthStore } from '../../hooks/useAuthStore';

export function Dashboard() {
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const { data: dashData, isLoading: dashLoading } = useDashboard();
    const { data: todayAppts, isLoading: apptLoading } = useTodayAppointments();
    
    // Flatten today's appointments (backend returns them grouped by doctorId)
    const appointments = React.useMemo(() => {
        if (!todayAppts || typeof todayAppts !== 'object') return [];
        const values = Object.values(todayAppts as Record<string, unknown>);
        return values.flatMap((value) => Array.isArray(value) ? value : []);
    }, [todayAppts]);

    const appointmentsByStatus = React.useMemo(() => {
        const value = dashData?.appointmentsByStatus;
        return Array.isArray(value) ? value : [];
    }, [dashData]);

    const { data: lowStock = [] } = useLowStockItems();

    const revenueData = React.useMemo(() => {
        if (dashData?.revenueHistory?.length) {
            return dashData.revenueHistory.map((item: any) => ({
                name: new Date(item.date).toLocaleDateString('en-IN', { weekday: 'short' }),
                revenue: item.amount
            }));
        }
        return [];
    }, [dashData]);

    return (
        <PageWrapper
            title="Hospital Overview"
            description="Quick summary of today's activities and overall metrics."
            action={
                <div className="flex gap-2">
                    <Button variant="outline" className="rounded-xl font-bold border-slate-200">
                        <Download className="mr-2 h-4 w-4" /> Export Data
                    </Button>
                    <Button className="rounded-xl font-bold bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20" onClick={() => navigate('/appointments')}>
                        <Plus className="mr-2 h-4 w-4" /> New Booking
                    </Button>
                </div>
            }
        >
            {/* Welcome Hero Section */}
            <div className="mb-10 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-10 rounded-[2rem] border border-primary/10 relative overflow-hidden group hover:shadow-2xl hover:shadow-primary/5 transition-all duration-500">
                <div className="absolute top-0 right-0 -m-12 w-64 h-64 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-colors" />
                <div className="relative z-10 max-w-2xl">
                    <div className="flex items-center gap-2 mb-4">
                        <div className="h-1.5 w-8 bg-primary rounded-full" />
                        <span className="text-[10px] font-extrabold uppercase tracking-widest text-primary">System Pulse</span>
                    </div>
                    <h1 className="text-4xl font-extrabold text-slate-900 mb-3 tracking-tight font-outfit">Welcome back, <span className="text-primary italic">{user?.name || 'Doctor'}</span></h1>
                    <p className="text-lg text-slate-600 font-medium leading-relaxed mb-6">You have <span className="text-primary font-bold underline decoration-2 underline-offset-4">{appointments.length} appointments</span> scheduled for today. Everything is running smoothly.</p>
                    <div className="flex gap-4">
                        <Button variant="link" className="p-0 h-auto text-primary font-bold hover:no-underline group/btn flex items-center">
                            Run diagnostic check <ChevronRight className="ml-1 h-4 w-4 group-hover/btn:translate-x-1 transition-transform" />
                        </Button>
                    </div>
                </div>
            </div>

            {/* Top Metrics Cards */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
                <Card className="cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border-none bg-white group overflow-hidden relative" onClick={() => navigate('/patients')}>
                    <div className="absolute top-0 left-0 w-full h-1 bg-primary/20 group-hover:bg-primary transition-colors" />
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-bold text-slate-500 uppercase tracking-wider">Total Patients</CardTitle>
                        <div className="p-2 bg-primary/10 rounded-lg group-hover:bg-primary group-hover:text-white transition-all">
                            <Users className="h-4 w-4 text-primary group-hover:text-inherit" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-extrabold text-slate-900 font-outfit">
                            {dashLoading ? <Loader2 className="h-5 w-5 animate-spin text-primary" /> : (dashData?.totalPatients ?? dashData?.monthNewPatients ?? 0).toLocaleString()}
                        </div>
                        <p className="text-xs text-slate-500 mt-2 flex items-center gap-1.5">
                            <span className="text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full font-bold flex items-center">
                                <TrendingUp className="h-3 w-3 mr-1" /> {dashData?.todayNewPatients ?? 0}
                            </span>
                            <span className="font-medium">newly registered today</span>
                        </p>
                    </CardContent>
                </Card>

                <Card className="cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border-none bg-white group overflow-hidden relative" onClick={() => navigate('/appointments')}>
                    <div className="absolute top-0 left-0 w-full h-1 bg-primary/20 group-hover:bg-primary transition-colors" />
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-bold text-slate-500 uppercase tracking-wider">Appointments Today</CardTitle>
                        <div className="p-2 bg-primary/10 rounded-lg group-hover:bg-primary group-hover:text-white transition-all">
                            <CalendarCheck className="h-4 w-4 text-primary group-hover:text-inherit" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-extrabold text-slate-900 font-outfit">
                            {dashLoading ? <Loader2 className="h-5 w-5 animate-spin text-primary" /> : (dashData?.todayAppointments ?? 0)}
                        </div>
                        <p className="text-xs text-slate-500 mt-2 font-medium">
                            <span className="text-slate-900 font-bold">{dashData?.monthAppointments ?? 0}</span> appointments scheduled this month
                        </p>
                    </CardContent>
                </Card>

                <Card className="cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border-none bg-white group overflow-hidden relative" onClick={() => navigate('/billing')}>
                    <div className="absolute top-0 left-0 w-full h-1 bg-primary/20 group-hover:bg-primary transition-colors" />
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-bold text-slate-500 uppercase tracking-wider">Revenue (MTD)</CardTitle>
                        <div className="p-2 bg-primary/10 rounded-lg group-hover:bg-primary group-hover:text-white transition-all">
                            <IndianRupee className="h-4 w-4 text-primary group-hover:text-inherit" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-extrabold text-slate-900 font-outfit">
                            {dashLoading ? <Loader2 className="h-5 w-5 animate-spin text-primary" /> : `₹${(dashData?.monthRevenue ?? 0).toLocaleString('en-IN')}`}
                        </div>
                        <p className="text-xs text-slate-500 mt-2 flex items-center gap-1.5">
                            <span className="text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full font-bold">₹{(dashData?.pendingPaymentsTotal ?? 0).toLocaleString('en-IN')}</span>
                            <span className="font-medium">outstanding invoices</span>
                        </p>
                    </CardContent>
                </Card>

                <Card className="cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border-none bg-white group overflow-hidden relative" onClick={() => navigate('/inventory')}>
                    <div className="absolute top-0 left-0 w-full h-1 bg-primary/20 group-hover:bg-primary transition-colors" />
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-bold text-slate-500 uppercase tracking-wider">Low Stock Items</CardTitle>
                        <div className="p-2 bg-orange-100 rounded-lg group-hover:bg-orange-500 group-hover:text-white transition-all">
                            <Package className="h-4 w-4 text-orange-600 group-hover:text-inherit" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-extrabold text-orange-600 font-outfit">
                            {dashLoading ? <Loader2 className="h-5 w-5 animate-spin text-primary" /> : (dashData?.lowStockCount ?? 0)}
                        </div>
                        <p className="text-xs text-orange-600 mt-2 font-bold bg-orange-50 inline-block px-2 py-0.5 rounded-full uppercase tracking-tighter">Immediate Attention Required</p>
                    </CardContent>
                </Card>
            </div>

            {/* Charts */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7 mb-8">
                <Card className="col-span-4 border-none bg-white shadow-sm overflow-hidden">
                    <CardHeader className="border-b border-slate-50">
                        <CardTitle className="text-lg font-bold text-slate-800 font-outfit">Revenue Overview (7 Days)</CardTitle>
                    </CardHeader>
                    <CardContent className="pl-2 pt-6">
                        <div className="h-[320px] w-full">
                            {dashLoading ? (
                                <div className="flex items-center justify-center h-full">
                                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                </div>
                            ) : revenueData.length === 0 ? (
                                <div className="flex items-center justify-center h-full text-slate-400 text-sm font-medium italic">
                                    No revenue data available yet
                                </div>
                            ) : (
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={revenueData}>
                                        <defs>
                                            <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="hsl(166, 76%, 25%)" stopOpacity={0.1}/>
                                                <stop offset="95%" stopColor="hsl(166, 76%, 25%)" stopOpacity={0}/>
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 500 }} dy={10} />
                                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 500 }} tickFormatter={(v) => `₹${v}`} dx={-10} />
                                        <Tooltip 
                                            contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', padding: '12px' }} 
                                            itemStyle={{ fontWeight: 700, color: 'hsl(166, 76%, 25%)' }}
                                            labelStyle={{ marginBottom: '4px', fontWeight: 600, color: '#64748b' }}
                                            formatter={(v) => [`₹${v}`, 'Revenue']} 
                                        />
                                        <Line type="monotone" dataKey="revenue" stroke="hsl(166, 76%, 25%)" strokeWidth={4} dot={{ r: 4, fill: '#fff', strokeWidth: 3, stroke: 'hsl(166, 76%, 25%)' }} activeDot={{ r: 6, strokeWidth: 0, fill: 'hsl(166, 76%, 25%)' }} />
                                    </LineChart>
                                </ResponsiveContainer>
                            )}
                        </div>
                    </CardContent>
                </Card>

                <Card className="col-span-3 border-none bg-white shadow-sm overflow-hidden">
                    <CardHeader className="border-b border-slate-50">
                        <CardTitle className="text-lg font-bold text-slate-800 font-outfit">Appointments by Status</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <div className="h-[320px] w-full">
                            {dashLoading ? (
                                <div className="flex items-center justify-center h-full">
                                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                </div>
                            ) : !appointmentsByStatus.length ? (
                                <div className="flex items-center justify-center h-full text-slate-400 text-sm font-medium italic">No appointment data this month</div>
                            ) : (
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={appointmentsByStatus}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                        <XAxis dataKey="status" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 500 }} dy={10} />
                                        <YAxis hide />
                                        <Tooltip cursor={{ fill: 'hsl(166, 76%, 25%, 0.05)' }} contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', padding: '12px' }} />
                                        <Bar dataKey="count" fill="hsl(166, 76%, 25%)" radius={[8, 8, 0, 0]} barSize={40} />
                                    </BarChart>
                                </ResponsiveContainer>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Schedule & Alerts */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7 mb-8">
                <Card className="col-span-4 border-none bg-white shadow-sm overflow-hidden">
                    <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-slate-50">
                        <div className="flex items-center gap-2">
                            <Clock className="h-5 w-5 text-primary" />
                            <CardTitle className="text-lg font-bold text-slate-800 font-outfit">Today's Schedule</CardTitle>
                        </div>
                        <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80 font-bold flex items-center gap-1 group" onClick={() => navigate('/appointments')}>
                            View Calendar <ChevronRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                        </Button>
                    </CardHeader>
                    <CardContent className="pt-6 px-4">
                        {apptLoading && (
                            <div className="flex justify-center items-center h-40">
                                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            </div>
                        )}
                        <div className="space-y-4">
                            {appointments.length === 0 && !apptLoading && (
                                <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                                    <CalendarCheck className="h-12 w-12 opacity-20 mb-3" />
                                    <p className="text-sm font-medium">Your schedule is clear for today</p>
                                </div>
                            )}
                            {appointments.slice(0, 5).map((apt, i) => {
                                const time = apt.startTime ?? apt.time ?? '-';
                                const patientName = apt.patientId?.name ?? apt.patient?.name ?? apt.patientName ?? 'Unknown';
                                const procedureValue = (apt.procedures && apt.procedures[0]) ?? apt.procedure ?? '-';
                                const procedure = typeof procedureValue === 'string'
                                    ? procedureValue
                                    : procedureValue?.name ?? '-';
                                const doctorValue = apt.doctorId?.name ?? apt.doctorName ?? apt.doctor ?? '-';
                                const doctor = typeof doctorValue === 'string'
                                    ? doctorValue
                                    : doctorValue?.name ?? '-';
                                const status = typeof apt.status === 'string' ? apt.status : 'SCHEDULED';
                                return (
                                    <div key={i} className="group flex items-center justify-between p-4 bg-slate-50/50 rounded-2xl border border-slate-100/50 hover:border-primary/20 transition-all cursor-pointer">
                                        <div className="flex items-center gap-4">
                                            <div className="bg-white shadow-sm text-primary text-sm font-bold px-4 py-2 rounded-xl border border-slate-100 min-w-[90px] text-center">{time}</div>
                                            <div>
                                                <p className="text-sm font-bold text-slate-900 group-hover:text-primary transition-colors">{patientName}</p>
                                                <p className="text-xs text-slate-500 font-medium flex items-center gap-2 mt-0.5">
                                                    <span className="text-slate-400 capitalize">{String(procedure).toLowerCase()}</span>
                                                    <span className="h-1 w-1 rounded-full bg-slate-300" />
                                                    <span className="text-slate-400">{doctor}</span>
                                                </p>
                                            </div>
                                        </div>
                                        <Badge 
                                            variant="outline"
                                            className={`rounded-full px-3 py-1 font-bold text-[10px] uppercase tracking-wider ${
                                                status === 'IN_PROGRESS' || status === 'In Progress' 
                                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                                                : status === 'WAITING' || status === 'Waiting'
                                                ? 'bg-amber-50 text-amber-700 border-amber-200'
                                                : 'bg-slate-100 text-slate-600 border-slate-200'
                                            }`}
                                        >
                                            {status.replace(/_/g, ' ')}
                                        </Badge>
                                    </div>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>

                <Card className="col-span-3 border-none bg-white shadow-sm overflow-hidden">
                    <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-slate-50">
                        <div className="flex items-center gap-2">
                            <AlertCircle className="h-5 w-5 text-primary" />
                            <CardTitle className="text-lg font-bold text-slate-800 font-outfit">Priority Tasklist</CardTitle>
                        </div>
                        <Badge variant="outline" className="rounded-full border-primary/20 text-primary font-bold">LIVE</Badge>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <div className="space-y-4">
                            {Array.isArray(lowStock) && lowStock.length > 0 && (
                                <div className="flex gap-4 items-start p-4 hover:bg-red-50/50 rounded-2xl border border-transparent hover:border-red-100 transition-all cursor-pointer group" onClick={() => navigate('/inventory')}>
                                    <div className="mt-1 h-3 w-3 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)] group-hover:scale-125 transition-transform" />
                                    <div>
                                        <p className="text-sm font-bold text-slate-900">Critical Stock Warning</p>
                                        <p className="text-xs text-slate-500 mt-0.5 font-medium leading-relaxed">{lowStock.length} dental supplies are below the safety threshold. Clinical operations may be affected.</p>
                                    </div>
                                </div>
                            )}
                            {(dashData?.pendingLabCases ?? 0) > 0 && (
                                <div className="flex gap-4 items-start p-4 hover:bg-amber-50/50 rounded-2xl border border-transparent hover:border-amber-100 transition-all cursor-pointer group">
                                    <div className="mt-1 h-3 w-3 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)] group-hover:scale-125 transition-transform" />
                                    <div>
                                        <p className="text-sm font-bold text-slate-900">Lab Case Follow-up</p>
                                        <p className="text-xs text-slate-500 mt-0.5 font-medium leading-relaxed">{dashData.pendingLabCases} prosthetic cases are currently with the technician. Check for delivery status.</p>
                                    </div>
                                </div>
                            )}
                            {(dashData?.overdueInvoices ?? 0) > 0 && (
                                <div className="flex gap-4 items-start p-4 hover:bg-indigo-50/50 rounded-2xl border border-transparent hover:border-indigo-100 transition-all cursor-pointer group" onClick={() => navigate('/billing')}>
                                    <div className="mt-1 h-3 w-3 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.5)] group-hover:scale-125 transition-transform" />
                                    <div>
                                        <p className="text-sm font-bold text-slate-900">Pending Financials</p>
                                        <p className="text-xs text-slate-500 mt-0.5 font-medium leading-relaxed">{dashData.overdueInvoices} invoices are highly overdue. Action required to maintain healthy cash flow.</p>
                                    </div>
                                </div>
                            )}
                            {!dashLoading && !lowStock?.length && !dashData?.pendingLabCases && !dashData?.overdueInvoices && (
                                <div className="flex flex-col items-center justify-center py-10 opacity-30">
                                    <CheckCircle2 className="h-12 w-12 text-emerald-600 mb-2" />
                                    <p className="text-xs font-bold uppercase tracking-widest">Peace of Mind</p>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </PageWrapper>
    );
}
