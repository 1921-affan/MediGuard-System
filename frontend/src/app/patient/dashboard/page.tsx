'use client';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity, AlertTriangle, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function PatientDashboard() {
    const [user, setUser] = useState<any>(null);
    const [profile, setProfile] = useState<any>(null);
    const [vitals, setVitals] = useState<any[]>([]);
    const [insights, setInsights] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            const token = localStorage.getItem('token');
            const userStr = localStorage.getItem('user');

            if (userStr) setUser(JSON.parse(userStr));

            if (token) {
                try {
                    // 1. Fetch Profile for Name
                    const profileRes = await fetch('http://localhost:5000/api/auth/profile', {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    if (profileRes.ok) setProfile(await profileRes.json());

                    // 2. Fetch Latest AI Insights (Simulated for now via AI route or derived)
                    // Ideally call /api/ai/analyze but that requires posting data. 
                    // For dashboard, we might want a GET /api/ai/latest-insights if we stored them.
                    // For now, we will mock the *display* of insights but fetched with real structure if possible.

                } catch (err) {
                    console.error('Failed to fetch dashboard data', err);
                } finally {
                    setLoading(false);
                }
            }
        };
        fetchData();
    }, []);

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Patient Dashboard</h1>
                    <p className="text-muted-foreground">
                        Welcome back, <span className="font-semibold text-primary">{profile?.Full_Name || user?.email || 'User'}</span>
                    </p>
                </div>
                <Link href="/patient/upload">
                    <Button className="gap-2">
                        <Activity className="h-4 w-4" />
                        Upload New Vitals
                    </Button>
                </Link>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Heart Rate (Avg)</CardTitle>
                        <Activity className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">-- BPM</div>
                        <p className="text-xs text-muted-foreground">No recent data</p>
                    </CardContent>
                </Card>

                {/* Add more stats as real data comes in */}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
                {/* Chart Section Placeholder */}
                <Card className="col-span-1">
                    <CardHeader>
                        <CardTitle>Health Trends</CardTitle>
                    </CardHeader>
                    <CardContent className="h-[300px] flex items-center justify-center bg-slate-50 rounded-md m-4">
                        <p className="text-muted-foreground">Chart Visualization Area</p>
                    </CardContent>
                </Card>

                {/* AI Insights Section */}
                <Card className="col-span-1">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <TrendingUp className="h-5 w-5 text-purple-600" />
                            AI Health Insights
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {/* Logic to map insights would go here */}
                        {insights.length > 0 ? (
                            insights.map((insight, idx) => (
                                <div key={idx} className="p-4 rounded-lg bg-yellow-50 border border-yellow-200">
                                    <div className="flex items-start gap-3">
                                        <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                                        <div>
                                            <h4 className="font-medium text-yellow-900">Insight #{idx + 1}</h4>
                                            <p className="text-sm text-yellow-800">{insight.content}</p>
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-sm text-muted-foreground text-center py-8">
                                No insights generated yet. Upload vitals to get AI analysis.
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
