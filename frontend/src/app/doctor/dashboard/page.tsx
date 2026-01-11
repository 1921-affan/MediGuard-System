'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { User, AlertOctagon, FileText, Calendar, Plus, Activity, Brain, Edit } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function DoctorDashboard() {
    const [profile, setProfile] = useState<any>(null);
    const [stats, setStats] = useState({ totalPatients: 0, highRisk: 0 });
    const [patients, setPatients] = useState<any[]>([]);
    const [appointments, setAppointments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Search State
    const [searchOpen, setSearchOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);

    // Appointment Creation State
    const [createApptOpen, setCreateApptOpen] = useState(false);
    const [selectedPatientId, setSelectedPatientId] = useState<string>('');
    const [extraPatient, setExtraPatient] = useState<any>(null); // For booking patients not yet in list
    const [apptDate, setApptDate] = useState('');
    const [apptTime, setApptTime] = useState('');
    const [creatingAppt, setCreatingAppt] = useState(false);

    // AI Insights State
    const [aiData, setAiData] = useState<any>(null);
    const [analyzing, setAnalyzing] = useState(false);

    const router = useRouter();

    useEffect(() => {
        const fetchData = async () => {
            const token = localStorage.getItem('token');
            try {
                // 0. Fetch Profile
                const profRes = await fetch('http://localhost:5000/api/auth/profile', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (profRes.ok) setProfile(await profRes.json());

                // 1. Fetch Appointments
                const appRes = await fetch('http://localhost:5000/api/appointments', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (appRes.ok) setAppointments(await appRes.json());

                // 2. Fetch My Assigned Patients
                const patRes = await fetch('http://localhost:5000/api/clinical/my-patients', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (patRes.ok) {
                    const myPatients = await patRes.json();
                    setPatients(myPatients);
                    setStats({
                        totalPatients: myPatients.length,
                        highRisk: 0 // In a real app, calculate this
                    });
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        const token = localStorage.getItem('token');
        try {
            const res = await fetch(`http://localhost:5000/api/auth/search-patients?query=${searchTerm}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) setSearchResults(await res.json());
        } catch (err) {
            console.error(err);
        }
    };

    const handleCreateAppointment = async () => {
        setCreatingAppt(true);
        const token = localStorage.getItem('token');
        try {
            const res = await fetch('http://localhost:5000/api/appointments', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    patientId: selectedPatientId,
                    scheduledTime: `${apptDate}T${apptTime}:00` // Simplistic formatting
                })
            });

            if (res.ok) {
                const newAppt = await res.json();
                setAppointments([...appointments, newAppt]);
                setCreateApptOpen(false);
                setSelectedPatientId('');
                setApptDate('');
                setApptTime('');
            } else {
                alert('Failed to create appointment');
            }
        } catch (err) {
            console.error(err);
        } finally {
            setCreatingAppt(false);
        }
    };

    // Derived Patient details for the selected patient in Appointment Dialog
    // Check both my-patients list and the extraPatient (from search)
    const selectedPatientRec = patients.find(p => p.Patient_ID === Number(selectedPatientId)) || (extraPatient?.Patient_ID === Number(selectedPatientId) ? extraPatient : null);

    // AI Logic
    useEffect(() => {
        if (!selectedPatientId) {
            setAiData(null);
            return;
        }

        const fetchInsights = async () => {
            const token = localStorage.getItem('token');
            try {
                const res = await fetch(`http://localhost:5000/api/ai/${selectedPatientId}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    if (Array.isArray(data) && data.length > 0) {
                        setAiData(data[0]); // Latest
                    } else {
                        setAiData(null);
                    }
                }
            } catch (err) {
                console.error(err);
            }
        };
        fetchInsights();
    }, [selectedPatientId]);

    const handleRunAnalysis = async () => {
        setAnalyzing(true);
        const token = localStorage.getItem('token');
        try {
            const res = await fetch('http://localhost:5000/api/ai/analyze', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ patientId: selectedPatientId })
            });

            if (res.ok) {
                const newInsight = await res.json();
                setAiData(newInsight);
            } else {
                alert('Analysis failed');
            }
        } catch (err) {
            console.error(err);
        } finally {
            setAnalyzing(false);
        }
    };

    const getRiskColor = (risk: string) => {
        switch (risk) {
            case 'Critical': return 'text-red-700 bg-red-100';
            case 'High': return 'text-orange-700 bg-orange-100';
            case 'Medium': return 'text-yellow-700 bg-yellow-100';
            case 'Low': return 'text-green-700 bg-green-100';
            default: return 'text-slate-700 bg-slate-100';
        }
    };


    return (
        <div className="min-h-screen p-8 space-y-8 bg-slate-50">
            {/* Top Bar with Profile */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-800">Doctor Dashboard</h1>
                    <p className="text-slate-500">Welcome back, Dr. {profile?.Full_Name}</p>
                </div>
                {profile && (
                    <Card className="w-full md:w-80 bg-white shadow-sm border-l-4 border-l-indigo-500">
                        <CardHeader className="p-4 pb-2 flex flex-row justify-between items-center">
                            <CardTitle className="text-sm font-medium text-slate-500 uppercase tracking-wide">Doctor Profile</CardTitle>
                            <Button variant="ghost" size="icon" className="h-6 w-6 text-slate-400" onClick={() => router.push('/profile')}>
                                <Edit className="h-3 w-3" />
                            </Button>
                        </CardHeader>
                        <CardContent className="p-4 pt-0">
                            <p className="text-lg font-bold text-slate-800">{profile.Full_Name}</p>
                            <div className="text-sm text-slate-500 flex flex-col gap-0.5 mt-1">
                                <span>{profile.Specialization || 'General Practitioner'}</span>
                                <span className="font-mono text-xs text-slate-400">License: LIC-1766961623447</span>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>

            {/* Stats */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">My Patients</CardTitle>
                        <User className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.totalPatients}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">High Risk Alerts</CardTitle>
                        <AlertOctagon className="h-4 w-4 text-red-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-600">{stats.highRisk}</div>
                        <p className="text-xs text-muted-foreground">AI Detected Cases</p>
                    </CardContent>
                </Card>
            </div>

            {/* Patients List */}
            <div className="space-y-4">
                <div className="flex justify-between items-center">
                    <h2 className="text-xl font-semibold">Assigned Patients</h2>
                    <Dialog open={searchOpen} onOpenChange={setSearchOpen}>
                        <DialogTrigger asChild>
                            <Button><User className="h-4 w-4 mr-2" /> Add Patient</Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-md">
                            <DialogHeader>
                                <DialogTitle>Search Patient Database</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                                <form onSubmit={handleSearch} className="flex gap-2">
                                    <Input
                                        placeholder="Search by Name or Phone..."
                                        value={searchTerm}
                                        onChange={e => setSearchTerm(e.target.value)}
                                    />
                                    <Button type="submit">Search</Button>
                                </form>
                                <div className="space-y-2 max-h-60 overflow-y-auto">
                                    {searchResults.map(p => (
                                        <div key={p.Patient_ID} className="flex justify-between items-center p-2 bg-slate-100 rounded">
                                            <div>
                                                <p className="font-semibold">{p.Full_Name}</p>
                                                <p className="text-xs text-gray-500">ID: {p.Patient_ID} | {p.Gender}</p>
                                            </div>
                                            <div className="flex gap-2">
                                                <Button size="sm" variant="outline" onClick={() => {
                                                    setExtraPatient(p);
                                                    setSelectedPatientId(p.Patient_ID.toString());
                                                    setSearchOpen(false);
                                                    setCreateApptOpen(true);
                                                }}>
                                                    Book
                                                </Button>
                                                <Button size="sm" variant="secondary" onClick={() => router.push(`/doctor/patients/${p.Patient_ID}`)}>
                                                    View
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                    {searchResults.length === 0 && searchTerm && <p className="text-sm text-gray-500 text-center">No patients found.</p>}
                                </div>
                            </div>
                        </DialogContent>
                    </Dialog>
                </div>

                {patients.length === 0 ? (
                    <div className="text-center py-10 bg-white rounded-lg border border-dashed border-slate-300">
                        <p className="text-gray-500">You haven't examined any patients yet.</p>
                        <Button variant="link" onClick={() => setSearchOpen(true)}>Search to add one</Button>
                    </div>
                ) : (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {patients.slice(0, 6).map(p => (
                            <Card key={p.Patient_ID} className="flex flex-col justify-between p-4 bg-white transition-all hover:shadow-md">
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold">
                                        {p.Full_Name?.charAt(0)}
                                    </div>
                                    <div>
                                        <p className="font-semibold">{p.Full_Name}</p>
                                        <p className="text-sm text-gray-500">{p.Gender}, {new Date().getFullYear() - new Date(p.DOB).getFullYear()} yrs</p>
                                    </div>
                                </div>
                                <Button variant="outline" size="sm" className="w-full" onClick={() => router.push(`/doctor/patients/${p.Patient_ID}`)}>
                                    <FileText className="h-4 w-4 mr-2" /> Clinical Record
                                </Button>
                            </Card>
                        ))}
                    </div>
                )}
            </div>

            {/* Today's Appointments */}
            <div className="space-y-4">
                <div className="flex justify-between items-center">
                    <h2 className="text-xl font-semibold">Today's Appointments</h2>

                    <Dialog open={createApptOpen} onOpenChange={setCreateApptOpen}>
                        <DialogTrigger asChild>
                            <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700">
                                <Plus className="h-4 w-4 mr-2" /> Schedule Appointment
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-lg">
                            <DialogHeader>
                                <DialogTitle>Schedule Appointment</DialogTitle>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="space-y-2">
                                    <Label>Select Patient</Label>
                                    <Select onValueChange={setSelectedPatientId} value={selectedPatientId}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select a patient..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {/* If we have an extra patient selected who isn't in the list, show them */}
                                            {extraPatient && !patients.find(p => p.Patient_ID === extraPatient.Patient_ID) && (
                                                <SelectItem value={extraPatient.Patient_ID.toString()}>
                                                    {extraPatient.Full_Name} (ID: {extraPatient.Patient_ID})
                                                </SelectItem>
                                            )}
                                            {patients.map(p => (
                                                <SelectItem key={p.Patient_ID} value={p.Patient_ID.toString()}>
                                                    {p.Full_Name} (ID: {p.Patient_ID})
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                {selectedPatientRec && (
                                    <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-md space-y-3 animate-in fade-in zoom-in-95 duration-200">
                                        <div className="flex items-center gap-2 text-indigo-900 font-semibold border-b border-indigo-200 pb-2">
                                            <Brain className="h-5 w-5" />
                                            AI Health Insights
                                        </div>

                                        {aiData ? (
                                            <>
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <Activity className="h-4 w-4 text-slate-500" />
                                                        <span className="text-sm font-medium">Risk Category:</span>
                                                    </div>
                                                    <span className={`px-2 py-0.5 rounded text-sm font-bold ${getRiskColor(aiData.Risk_Category)}`}>
                                                        {aiData.Risk_Category} ({aiData.Confidence_Score}%)
                                                    </span>
                                                </div>
                                                <div className="text-sm text-slate-600 bg-white/50 p-2 rounded">
                                                    <span className="font-semibold text-indigo-700">Analysis: </span>
                                                    {aiData.RAG_Reasoning}
                                                </div>
                                            </>
                                        ) : (
                                            <div className="text-center py-2 space-y-2">
                                                <p className="text-sm text-slate-500">No recent AI analysis found.</p>
                                                <Button size="sm" variant="outline" onClick={handleRunAnalysis} disabled={analyzing} className="w-full border-indigo-200 text-indigo-700 hover:bg-indigo-100">
                                                    {analyzing ? <Activity className="h-4 w-4 mr-2 animate-spin" /> : <Brain className="h-4 w-4 mr-2" />}
                                                    {analyzing ? 'Analyzing...' : 'Run AI Analysis'}
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                )}

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Date</Label>
                                        <Input type="date" value={apptDate} onChange={e => setApptDate(e.target.value)} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Time</Label>
                                        <Input type="time" value={apptTime} onChange={e => setApptTime(e.target.value)} />
                                    </div>
                                </div>
                            </div>
                            <Button onClick={handleCreateAppointment} disabled={!selectedPatientId || !apptDate || !apptTime || creatingAppt} className="w-full">
                                {creatingAppt ? 'Scheduling...' : 'Confirm Appointment'}
                            </Button>
                        </DialogContent>
                    </Dialog>
                </div>

                <div className="space-y-4">
                    {appointments.length === 0 ? (
                        <Card className="p-8 border-dashed bg-slate-50/50 flex flex-col items-center justify-center text-center">
                            <Calendar className="h-10 w-10 text-slate-300 mb-2" />
                            <p className="text-slate-500">No appointments scheduled for today.</p>
                        </Card>
                    ) : (
                        appointments.map((appt: any) => (
                            <Card key={appt.Appointment_ID} className="p-4 hover:shadow-md transition-shadow">
                                <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-4">
                                        <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
                                            <Calendar className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <p className="font-semibold text-slate-800">
                                                {new Date(appt.Scheduled_Time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                            <p className="text-sm text-slate-500">{appt.Patient_Name || `Patient ID: ${appt.Patient_ID}`}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className={`text-xs px-2.5 py-1 rounded-full font-medium ${appt.Status === 'Completed' ? 'bg-green-100 text-green-700' :
                                            appt.Status === 'Scheduled' ? 'bg-blue-100 text-blue-700' :
                                                'bg-yellow-100 text-yellow-700'
                                            }`}>
                                            {appt.Status}
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
