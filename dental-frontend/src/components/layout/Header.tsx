import { Bell, Menu, Search, User, CreditCard, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { useAuthStore } from "../../hooks/useAuthStore";
import { signOutFromSupabase } from "../../lib/supabase";

export function Header() {
    const navigate = useNavigate();
    const { user, token, logout } = useAuthStore();

    const handleLogout = async () => {
        await signOutFromSupabase(token);
        logout();
        navigate("/auth/login");
    };

    const getInitials = (name: string) => {
        return name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2);
    };

    return (
        <header className="flex h-16 items-center gap-4 border-b bg-white/80 backdrop-blur-md px-8 w-full sticky top-0 z-30">
            <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle menu</span>
            </Button>

            <div className="flex-1 flex items-center">
                <div className="relative w-full max-w-lg hidden md:flex group">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-primary transition-colors" />
                    <Input
                        type="search"
                        placeholder="Search patients, invoices, or appointments..."
                        className="w-full bg-slate-50 border-slate-100 rounded-2xl pl-10 h-10 focus-visible:ring-primary focus-visible:bg-white transition-all text-sm"
                    />
                </div>
            </div>

            <div className="flex items-center gap-6">
                <Button variant="ghost" size="icon" className="relative text-slate-500 hover:text-primary hover:bg-primary/5 rounded-xl transition-all">
                    <Bell className="h-5 w-5" />
                    <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-orange-500 border-2 border-white" />
                    <span className="sr-only">Notifications</span>
                </Button>

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="flex items-center gap-3 px-2 hover:bg-slate-50 rounded-xl transition-all">
                            <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm border border-primary/20">
                                {user?.name ? getInitials(user.name) : "U"}
                            </div>
                            <div className="hidden lg:flex flex-col items-start text-left">
                                <span className="text-sm font-bold text-slate-900 leading-tight truncate max-w-[120px]">
                                    {user?.name || "User"}
                                </span>
                                <span className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">
                                    {user?.role?.replace("_", " ") || "Member"}
                                </span>
                            </div>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-64 mt-2 p-1.5 rounded-2xl shadow-xl border-slate-100 animate-in fade-in-0 zoom-in-95 duration-200">
                        <DropdownMenuLabel className="p-3">
                            <div className="flex flex-col space-y-1">
                                <p className="text-sm font-bold leading-none text-slate-900">{user?.name || "User Account"}</p>
                                <p className="text-xs leading-none text-slate-500 font-medium truncate">{user?.email || "No email provided"}</p>
                            </div>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator className="bg-slate-50 mx-2" />
                        <DropdownMenuItem 
                            className="rounded-xl cursor-pointer py-2.5 font-medium flex items-center gap-2 px-3 focus:bg-slate-50 transition-colors"
                            onClick={() => navigate("/settings")}
                        >
                            <User className="h-4 w-4 text-slate-400" />
                            Profile Details
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                            className="rounded-xl cursor-pointer py-2.5 font-medium flex items-center gap-2 px-3 focus:bg-slate-50 transition-colors"
                            onClick={() => navigate("/settings")}
                        >
                            <CreditCard className="h-4 w-4 text-slate-400" />
                            Clinic & Billing
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="bg-slate-50 mx-2" />
                        <DropdownMenuItem 
                            className="text-red-500 focus:text-red-600 focus:bg-red-50/50 cursor-pointer rounded-xl py-2.5 font-bold flex items-center gap-2 px-3 transition-colors"
                            onClick={handleLogout}
                        >
                            <LogOut className="h-4 w-4" />
                            Terminate Session
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </header>
    );
}
