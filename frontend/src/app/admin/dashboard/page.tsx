'use client';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, UserCheck, UserX } from 'lucide-react';

export default function AdminDashboard() {
    const [stats, setStats] = useState<any>({ Total_Doctors: 0, Total_Patients: 0, Pending_Approvals: 0 });
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

    useEffect(() => {
        if (token) fetchAdminData();
    }, [token]);

    const fetchAdminData = async () => {
        try {
            const [statsRes, usersRes] = await Promise.all([
                fetch('http://localhost:5000/api/admin/stats', { headers: { Authorization: `Bearer ${token}` } }),
                fetch('http://localhost:5000/api/admin/users', { headers: { Authorization: `Bearer ${token}` } })
            ]);

            if (statsRes.ok) setStats(await statsRes.json());
            if (usersRes.ok) setUsers(await usersRes.json());
        } catch (error) {
            console.error('Admin Fetch Error:', error);
        } finally {
            setLoading(false);
        }
    };

    const toggleStatus = async (userId: number, currentStatus: number) => {
        const newStatus = currentStatus === 1 ? 0 : 1;
        try {
            const res = await fetch(`http://localhost:5000/api/admin/users/${userId}/status`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ isActive: Boolean(newStatus) })
            });

            if (res.ok) {
                // Optimistic Update
                setUsers(users.map(u => u.User_ID === userId ? { ...u, Is_Active: newStatus } : u));
                fetchAdminData(); // Refresh stats
            }
        } catch (error) {
            console.error('Update Status Error:', error);
        }
    };

    if (loading) return <div className="p-10">Loading Admin Dashboard...</div>;

    return (
        <div className="min-h-screen bg-slate-50 p-8">
            <h1 className="text-3xl font-bold mb-8">System Admin Dashboard</h1>

            {/* Stats Cards */}
            <div className="grid gap-6 md:grid-cols-3 mb-8">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Total Doctors</CardTitle>
                        <Users className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent><div className="text-2xl font-bold">{stats.Total_Doctors}</div></CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Total Patients</CardTitle>
                        <Users className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent><div className="text-2xl font-bold">{stats.Total_Patients}</div></CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Pending Approvals</CardTitle>
                        <Users className="h-4 w-4 text-orange-500" />
                    </CardHeader>
                    <CardContent><div className="text-2xl font-bold">{stats.Pending_Approvals}</div></CardContent>
                </Card>
            </div>

            {/* Users Table */}
            <Card>
                <CardHeader><CardTitle>User Management</CardTitle></CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-slate-500 uppercase bg-slate-100">
                                <tr>
                                    <th className="px-4 py-3">Name</th>
                                    <th className="px-4 py-3">Role</th>
                                    <th className="px-4 py-3">Info (License/Phone)</th>
                                    <th className="px-4 py-3">Status</th>
                                    <th className="px-4 py-3">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map((user) => (
                                    <tr key={user.User_ID} className="border-b hover:bg-slate-50">
                                        <td className="px-4 py-3 font-medium">
                                            {user.Full_Name}
                                            <div className="text-xs text-slate-400 font-normal">{user.Email}</div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`px-2 py-1 rounded text-xs font-semibold 
                                                ${user.Role === 'Doctor' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>
                                                {user.Role}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">{user.Info}</td>
                                        <td className="px-4 py-3">
                                            {user.Is_Active ? (
                                                <span className="text-green-600 flex items-center gap-1"><UserCheck className="h-3 w-3" /> Active</span>
                                            ) : (
                                                <span className="text-red-600 flex items-center gap-1"><UserX className="h-3 w-3" /> Inactive</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3">
                                            <Button
                                                size="sm"
                                                variant={user.Is_Active ? "destructive" : "default"}
                                                onClick={() => toggleStatus(user.User_ID, user.Is_Active)}
                                            >
                                                {user.Is_Active ? "Deactivate" : "Approve"}
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
