'use client';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { LayoutDashboard, Calendar, FileText, User, LogOut, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

export function Sidebar() {
    const pathname = usePathname();
    const router = useRouter();

    const [role, setRole] = useState<'Patient' | 'Doctor' | null>(null);

    useEffect(() => {
        const userStr = localStorage.getItem('user');
        if (userStr) {
            const user = JSON.parse(userStr);
            setRole(user.role);
        } else if (pathname.startsWith('/doctor')) {
            setRole('Doctor');
        } else if (pathname.startsWith('/patient')) {
            setRole('Patient');
        }
    }, [pathname]);

    const patientLinks = [
        { href: '/patient/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { href: '/patient/upload', label: 'Upload Vitals', icon: Upload },
        { href: '/patient/appointments', label: 'Appointments', icon: Calendar },
        { href: '/patient/history', label: 'Medical History', icon: FileText },
        { href: '/profile', label: 'Profile', icon: User },
    ];

    const doctorLinks = [
        { href: '/doctor/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { href: '/doctor/patients', label: 'My Patients', icon: User },
        { href: '/profile', label: 'Profile', icon: User },
    ];

    const links = role === 'Doctor' ? doctorLinks : patientLinks;

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        router.push('/');
    };

    return (
        <div className="flex h-screen w-64 flex-col border-r border-slate-800 bg-slate-900 text-slate-100 transition-all duration-300">
            <div className="p-6 flex items-center gap-2">
                <div className="p-1 bg-blue-600 rounded">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="h-6 w-6 text-white"
                    >
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
                    </svg>
                </div>
                <h1 className="text-xl font-bold tracking-tight">MediGuard</h1>
            </div>
            <nav className="flex-1 space-y-1 px-3 py-4">
                {links.map((link) => {
                    const Icon = link.icon;
                    const isActive = pathname === link.href;
                    return (
                        <Link
                            key={link.href}
                            href={link.href}
                            className={cn(
                                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                                isActive
                                    ? "bg-blue-600 text-white shadow-lg shadow-blue-900/20"
                                    : "text-slate-400 hover:bg-slate-800 hover:text-white"
                            )}
                        >
                            <Icon className="h-4 w-4" />
                            {link.label}
                        </Link>
                    );
                })}
            </nav>
            <div className="border-t border-slate-800 p-4">
                <Button
                    variant="ghost"
                    className="w-full justify-start gap-3 text-slate-400 hover:bg-slate-800 hover:text-red-400 pl-3"
                    onClick={handleLogout}
                >
                    <LogOut className="h-4 w-4" />
                    Logout
                </Button>
            </div>
        </div>
    );
}
