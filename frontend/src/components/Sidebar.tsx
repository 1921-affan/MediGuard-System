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
        <div className="flex h-screen w-64 flex-col border-r bg-white">
            <div className="p-6">
                <h1 className="text-2xl font-bold text-blue-600">MediGuard</h1>
            </div>
            <nav className="flex-1 space-y-1 px-4">
                {links.map((link) => {
                    const Icon = link.icon;
                    const isActive = pathname === link.href;
                    return (
                        <Link
                            key={link.href}
                            href={link.href}
                            className={cn(
                                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                                isActive
                                    ? "bg-blue-600 text-white shadow-md"
                                    : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                            )}
                        >
                            <Icon className="h-4 w-4" />
                            {link.label}
                        </Link>
                    );
                })}
            </nav>
            <div className="border-t p-4">
                <Button variant="ghost" className="w-full justify-start gap-3 text-red-500 hover:text-red-600 hover:bg-red-50" onClick={handleLogout}>
                    <LogOut className="h-4 w-4" />
                    Logout
                </Button>
            </div>
        </div>
    );
}
