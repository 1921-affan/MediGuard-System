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

    const [searchResults, setSearchResults] = useState<any[]>([]);

    useEffect(() => {
        fetchPatients();
    }, []);

    const fetchPatients = async () => {
        const token = localStorage.getItem('token');
        try {
            const res = await fetch('http://localhost:5000/api/clinical/my-patients', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) setPatients(await res.json());
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    // Global Search
    useEffect(() => {
        const searchGlobal = async () => {
            if (searchTerm.length < 2) {
                setSearchResults([]);
                return;
            }
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

        const timeoutId = setTimeout(searchGlobal, 500); // Debounce
        return () => clearTimeout(timeoutId);
    }, [searchTerm]);

    const handleAddDiagnosis = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        const token = localStorage.getItem('token');

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
            // Refresh Patients
            fetchPatients();

        } catch (err: any) {
            alert(err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    // Merge lists for display (Local + Global Search Results)
    // Filter duplicates
    const combinedPatients = [...patients];
    if (searchTerm) {
        searchResults.forEach(sp => {
            if (!combinedPatients.find(p => p.Patient_ID === sp.Patient_ID)) {
                combinedPatients.push(sp);
            }
        });
    }

    const displayedPatients = combinedPatients.filter(p =>
        p.Full_Name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold">My Patients</h1>

            <div className="flex items-center gap-4">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                    <Input
                        placeholder="Search global directory to add patient..."
                        className="pl-8"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {displayedPatients.map(patient => (
                    <Card key={patient.Patient_ID} className={patients.find(p => p.Patient_ID === patient.Patient_ID) ? 'border-l-4 border-l-blue-500' : 'border-dashed'}>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-lg font-medium">{patient.Full_Name}</CardTitle>
                            {!patients.find(p => p.Patient_ID === patient.Patient_ID) && (
                                <span className="text-xs bg-slate-100 px-2 py-1 rounded text-slate-500">Global</span>
                            )}
                        </CardHeader>
                        <CardContent>
                            <div className="text-sm text-gray-500 mb-4">
                                <p>DOB: {new Date(patient.DOB).toLocaleDateString()}</p>
                                <p>Gender: {patient.Gender}</p>
                            </div>

                            <Dialog open={open} onOpenChange={setOpen}>
                                <DialogTrigger asChild>
                                    <Button className="w-full gap-2" variant="outline" onClick={() => setSelectedPatient(patient)}>
                                        <PlusCircle className="h-4 w-4" /> {patients.find(p => p.Patient_ID === patient.Patient_ID) ? 'Add Diagnosis' : 'Assign & Add Record'}
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
                {searchTerm && displayedPatients.length === 0 && (
                    <div className="col-span-full text-center py-8 text-slate-500">
                        No patients found in global directory.
                    </div>
                )}
            </div>
        </div>
    );
}
