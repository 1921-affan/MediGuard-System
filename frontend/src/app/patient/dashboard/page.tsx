'use client';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Activity, AlertTriangle, TrendingUp, Calendar, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import VitalsChart from '@/components/dashboard/VitalsChart';
import { Badge } from '@/components/ui/badge';

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
                    // 1. Fetch Profile
                    const profileRes = await fetch('http://localhost:5000/api/auth/profile', {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });

                    let patientId = null;
                    if (profileRes.ok) {
                        const profileData = await profileRes.json();
                        setProfile(profileData);
                        patientId = profileData.Patient_ID;
                    }

                    // 2. Fetch Vitals History for Chart
                    const vitalsRes = await fetch('http://localhost:5000/api/upload/history', {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    if (vitalsRes.ok) {
                        setVitals(await vitalsRes.json());
                    }

                    // 3. Fetch AI Insights
                    if (patientId) {
                        const insightsRes = await fetch(`http://localhost:5000/api/ai/${patientId}`, {
                            headers: { 'Authorization': `Bearer ${token}` }
                        });
                        if (insightsRes.ok) {
                            setInsights(await insightsRes.json());
                        }
                    }

                } catch (err) {
                    console.error('Failed to fetch dashboard data', err);
                } finally {
                    setLoading(false);
                }
            }
        };
        fetchData();
    }, []);

    const latestVitals = vitals.length > 0 ? vitals[0] : null;

    return (
        <div className="space-y-8 p-8 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">Patient Dashboard</h1>
                    <p className="text-slate-500">
                        Welcome back, <span className="font-semibold text-primary">{profile?.Full_Name || user?.email || 'User'}</span>
                    </p>
                </div>
                <Link href="/patient/upload">
                    <Button className="gap-2 shadow-sm">
                        <Activity className="h-4 w-4" />
                        Upload New Vitals
                    </Button>
                </Link>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Heart Rate</CardTitle>
                        <Activity className="h-4 w-4 text-red-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{latestVitals?.Heart_Rate || '--'} <span className="text-sm font-normal text-slate-500">bpm</span></div>
                        <p className="text-xs text-muted-foreground mt-1">
                            {latestVitals ? `Last recorded: ${new Date(latestVitals.Timestamp).toLocaleDateString()}` : 'No recent data'}
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Blood Pressure</CardTitle>
                        <Activity className="h-4 w-4 text-orange-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{latestVitals ? `${latestVitals.Systolic_BP}/${latestVitals.Diastolic_BP}` : '--/--'} <span className="text-sm font-normal text-slate-500">mmHg</span></div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Average: {vitals.length > 0 ? 'Stable' : 'N/A'}
                        </p>
                    </CardContent>
                </Card>

                {/* Placeholders for other stats */}
            </div>

            <div className="grid gap-6 grid-cols-1">
                {/* Chart Section */}
                <div className="space-y-6">
                    <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                        <TrendingUp className="h-5 w-5 text-blue-600" />
                        Health Trends
                    </h3>
                    <VitalsChart data={vitals} />
                </div>

                {/* AI Insights Section */}
                <div className="space-y-6">
                    <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-purple-600" />
                        Latest AI Insights
                    </h3>

                    <div className="space-y-4">
                        {insights.length > 0 ? (
                            insights.map((insight, idx) => (
                                <Card key={idx} className="hover:shadow-md transition-shadow cursor-pointer border-l-4" style={{
                                    borderLeftColor: insight.Risk_Category === 'High' || insight.Risk_Category === 'Critical' ? '#ef4444' :
                                        insight.Risk_Category === 'Medium' ? '#eab308' : '#22c55e'
                                }}>
                                    <div className="p-4">
                                        <div className="flex justify-between items-start mb-2">
                                            <Badge className={`uppercase text-[10px] ${insight.Risk_Category === 'High' ? 'bg-red-500 hover:bg-red-600' : 'bg-slate-500 hover:bg-slate-600'}`}>
                                                {insight.Risk_Category} Risk
                                            </Badge>
                                            <span className="text-xs text-slate-400 flex items-center gap-1">
                                                <Calendar className="h-3 w-3" />
                                                {new Date(insight.Generated_At).toLocaleDateString()}
                                            </span>
                                        </div>
                                        <h4 className="font-semibold text-slate-800 text-sm mb-1">
                                            {insight.RAG_Reasoning.split('.')[0]}...
                                        </h4>
                                        <p className="text-sm text-slate-600">
                                            {insight.RAG_Reasoning}
                                        </p>
                                        {/* Show Key Factors if available */}
                                        {insight.Key_Factors && insight.Key_Factors.length > 0 && (
                                            <div className="mt-3">
                                                <p className="text-xs font-semibold text-slate-500 mb-1">Key Factors:</p>
                                                <div className="flex flex-wrap gap-1">
                                                    {insight.Key_Factors.map((factor: string, i: number) => (
                                                        <span key={i} className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full border border-slate-200">
                                                            {factor}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </Card>
                            ))
                        ) : (
                            <Card className="bg-slate-50 border-dashed">
                                <CardContent className="flex flex-col items-center justify-center py-8 text-center">
                                    <p className="text-sm text-slate-500">No insights generated yet.</p>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
