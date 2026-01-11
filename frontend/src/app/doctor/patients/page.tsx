'use client';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { PlusCircle, Search } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

export default function DoctorPatientsPage() {
    const [patients, setPatients] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedPatient, setSelectedPatient] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    // Form States
    const [diagnosis, setDiagnosis] = useState('');
    const [symptoms, setSymptoms] = useState('');
    const [remarks, setRemarks] = useState('');
    const [followUp, setFollowUp] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [open, setOpen] = useState(false);

    useEffect(() => {
        fetchPatients();
    }, []);

    const fetchPatients = async () => {
        const token = localStorage.getItem('token');
        try {
            const res = await fetch('http://localhost:5000/api/auth/patients', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) setPatients(await res.json());
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleAddDiagnosis = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        const token = localStorage.getItem('token');
        const userStr = localStorage.getItem('user');
        const doctorId = userStr ? JSON.parse(userStr).id : null; // Strictly this should be doctor ID from profile, but using Auth ID for now. 
        // Ideally we need to fetch Doctor_ID from /profile first. 
        // For simplicity, assuming backend resolves Doctor_ID from User_ID or we fetch it.
        // Actually, let's fetch profile first or assume backend resolves it.
        // The backend clinicalController expects "doctorId". If clinicalService uses it directly, we need valid Doctor_ID.
        // Let's assume we need to fetch it.

        try {
            // 1. Get Doctor Profile to get Doctor_ID
            const profileRes = await fetch('http://localhost:5000/api/auth/profile', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const profile = await profileRes.json();
            const realDoctorId = profile.Doctor_ID;

            // 2. Post Record
            const res = await fetch('http://localhost:5000/api/clinical', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    patientId: selectedPatient.Patient_ID,
                    doctorId: realDoctorId,
                    diagnosis,
                    symptoms,
                    remarks,
                    followUpDate: followUp
                })
            });

            if (!res.ok) throw new Error('Failed to add record');

            alert('Diagnosis added successfully');
            setOpen(false);
            // Reset form
            setDiagnosis(''); setSymptoms(''); setRemarks(''); setFollowUp('');

        } catch (err: any) {
            alert(err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const filteredPatients = patients.filter(p =>
        p.Full_Name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold">My Patients</h1>

            <div className="flex items-center gap-4">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                    <Input
                        placeholder="Search patients..."
                        className="pl-8"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredPatients.map(patient => (
                    <Card key={patient.Patient_ID}>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-lg font-medium">{patient.Full_Name}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-sm text-gray-500 mb-4">
                                <p>DOB: {new Date(patient.DOB).toLocaleDateString()}</p>
                                <p>Gender: {patient.Gender}</p>
                            </div>

                            <Dialog open={open} onOpenChange={setOpen}>
                                <DialogTrigger asChild>
                                    <Button className="w-full gap-2" onClick={() => setSelectedPatient(patient)}>
                                        <PlusCircle className="h-4 w-4" /> Add Diagnosis
                                    </Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>Add Clinical Record for {selectedPatient?.Full_Name}</DialogTitle>
                                    </DialogHeader>
                                    <form onSubmit={handleAddDiagnosis} className="space-y-4">
                                        <div className="space-y-2">
                                            <Label>Diagnosis (ICD-10 or Name)</Label>
                                            <Input value={diagnosis} onChange={e => setDiagnosis(e.target.value)} required placeholder="e.g. Hypertension" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Symptoms</Label>
                                            <Textarea value={symptoms} onChange={e => setSymptoms(e.target.value)} placeholder="Patient complains of..." />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Doctor's Remarks</Label>
                                            <Textarea value={remarks} onChange={e => setRemarks(e.target.value)} placeholder="Treatment plan, advice..." />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Follow Up Date</Label>
                                            <Input type="date" value={followUp} onChange={e => setFollowUp(e.target.value)} />
                                        </div>
                                        <Button type="submit" className="w-full" disabled={isSubmitting}>
                                            {isSubmitting ? 'Saving...' : 'Save Record'}
                                        </Button>
                                    </form>
                                </DialogContent>
                            </Dialog>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
