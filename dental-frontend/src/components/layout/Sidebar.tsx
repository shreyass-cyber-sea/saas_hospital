import { NavLink, useNavigate } from 'react-router-dom';
import {
    Calendar,
    Users,
    FileText,
    Package,
    BarChart,
    Settings,
    LogOut,
    Hospital
} from 'lucide-react';
import { useAuthStore } from '../../hooks/useAuthStore';
import { signOutFromSupabase } from '../../lib/supabase';

const navItems = [
    { icon: BarChart, label: 'Dashboard', path: '/dashboard' },
    { icon: Calendar, label: 'Appointments', path: '/appointments' },
    { icon: Users, label: 'Patients', path: '/patients' },
    { icon: FileText, label: 'Billing', path: '/billing' },
    { icon: Package, label: 'Inventory', path: '/inventory' },
    { icon: BarChart, label: 'Reports', path: '/reports' },
    { icon: Settings, label: 'Settings', path: '/settings' },
];

export function Sidebar() {
    const navigate = useNavigate();
    const { token, logout } = useAuthStore();

    const handleLogout = async () => {
        await signOutFromSupabase(token);
        logout();
        navigate('/auth/login');
    };

    return (
        <aside className="w-72 bg-[#064e3b] flex flex-col h-full shadow-2xl z-20 overflow-hidden relative border-r border-white/10">
            {/* Subtle Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-b from-primary/10 via-transparent to-transparent pointer-events-none" />

            <div className="p-8 pb-10 flex items-center gap-3 relative z-10">
                <div className="bg-emerald-500/20 p-2.5 rounded-2xl border border-emerald-500/20 shadow-lg shadow-emerald-500/10">
                    <Hospital className="h-6 w-6 text-emerald-400" />
                </div>
                <span className="font-extrabold text-2xl tracking-tight text-white font-outfit">DentalCloud</span>
            </div>

            <nav className="flex-1 px-4 space-y-1.5 overflow-y-auto relative z-10">
                <div className="px-4 mb-4">
                    <span className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-emerald-500/50">Main Menu</span>
                </div>
                {navItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) =>
                            `flex items-center gap-3.5 px-4 py-3.5 rounded-2xl transition-all duration-300 group relative ${isActive
                                ? 'bg-white/10 text-white font-bold shadow-lg shadow-black/10'
                                : 'text-emerald-100/60 hover:text-white hover:bg-white/5'
                            }`
                        }
                    >
                        {({ isActive }) => (
                            <>
                                {/* Active Indicator Bar */}
                                {isActive && (
                                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-8 bg-emerald-400 rounded-r-full shadow-[4px_0_15px_rgba(52,211,153,0.4)]" />
                                )}

                                <item.icon className={`h-5 w-5 transition-all duration-300 ${isActive ? 'text-emerald-400 scale-110' : 'group-hover:text-emerald-400'}`} />
                                <span className={isActive ? 'translate-x-0.5 transition-transform' : ''}>{item.label}</span>
                            </>
                        )}
                    </NavLink>
                ))}
            </nav>

            <div className="p-6 mt-auto relative z-10">
                <div className="bg-white/5 rounded-[1.5rem] p-2 border border-white/5">
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-3.5 px-5 py-4 w-full rounded-2xl text-slate-400 hover:text-red-400 hover:bg-red-400/10 transition-all font-bold group"
                    >
                        <LogOut className="h-5 w-5 group-hover:rotate-12 transition-transform" />
                        <span className="text-sm">Quick Logout</span>
                    </button>
                </div>
            </div>
        </aside>
    );
}
