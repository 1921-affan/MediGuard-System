'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { PlusCircle, FileText, ArrowLeft, Pill } from 'lucide-react';

export default function PatientDetailPage() {
    const params = useParams();
    const router = useRouter();
    const [patient, setPatient] = useState<any>(null);
    const [history, setHistory] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Diagnosis Form
    const [open, setOpen] = useState(false);
    const [diagnosis, setDiagnosis] = useState('');
    const [symptoms, setSymptoms] = useState('');
    const [remarks, setRemarks] = useState('');
    const [followUp, setFollowUp] = useState('');

    // Prescription Form
    const [prescriptions, setPrescriptions] = useState<any[]>([]);
    const [drugName, setDrugName] = useState('');
    const [dosage, setDosage] = useState('');
    const [frequency, setFrequency] = useState('');
    const [duration, setDuration] = useState('');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        const token = localStorage.getItem('token');
        // 1. Fetch Patient Details (Ideally we need a getPatient endpoint, defaulting to list filtering for now or simple fetch if we had one)
        // For prototype, we reuse "getAllPatients" and filter, or we add getPatientById.
        // Let's assume we can filter from listPatients for MVP speed, or fetch from clinical history which has patient ID.
        // Better: Fetch history first, it proves link.
        // Actually, let's just fetch all patients and find one. (Not scalable but works for prototype).

        try {
            const res = await fetch('http://localhost:5000/api/auth/patients', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const allPatients = await res.json();
            const found = allPatients.find((p: any) => p.Patient_ID == params.id);
            setPatient(found);

            // 2. Fetch History
            const histRes = await fetch(`http://localhost:5000/api/clinical/${params.id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (histRes.ok) setHistory(await histRes.json());
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const addPrescription = () => {
        if (!drugName) return;
        setPrescriptions([...prescriptions, { drugName, dosage, frequency, duration }]);
        setDrugName(''); setDosage(''); setFrequency(''); setDuration('');
    };

    const removePrescription = (idx: number) => {
        setPrescriptions(prescriptions.filter((_, i) => i !== idx));
    };

    const handleSaveRecord = async (e: React.FormEvent) => {
        e.preventDefault();
        const token = localStorage.getItem('token');

        try {
            // Get Doctor ID
            const profileRes = await fetch('http://localhost:5000/api/auth/profile', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const profile = await profileRes.json();

            const payload = {
                patientId: params.id,
                doctorId: profile.Doctor_ID,
                diagnosis,
                symptoms,
                remarks,
                followUpDate: followUp,
                prescriptions
            };

            const res = await fetch('http://localhost:5000/api/clinical', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            if (!res.ok) throw new Error('Failed to save record');

            alert('Record saved successfully!');
            setOpen(false);
            fetchData(); // Refresh history
            // Reset form
            setDiagnosis(''); setSymptoms(''); setRemarks(''); setFollowUp(''); setPrescriptions([]);

        } catch (err: any) {
            alert(err.message);
        }
    };

    if (loading) return <div className="p-8">Loading...</div>;
    if (!patient) return <div className="p-8">Patient not found</div>;

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => router.back()}>
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <h1 className="text-3xl font-bold">{patient.Full_Name}</h1>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                {/* Demographics */}
                <Card>
                    <CardHeader><CardTitle>Demographics</CardTitle></CardHeader>
                    <CardContent className="space-y-2 text-sm">
                        <p><span className="font-semibold">DOB:</span> {new Date(patient.DOB).toLocaleDateString()}</p>
                        <p><span className="font-semibold">Gender:</span> {patient.Gender}</p>
                        <p><span className="font-semibold">Patient ID:</span> {patient.Patient_ID}</p>
                    </CardContent>
                </Card>

                {/* Vitals Summary (Placeholder) */}
                <Card>
                    <CardHeader><CardTitle>Latest Vitals</CardTitle></CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground text-sm">No recent vitals available.</p>
                    </CardContent>
                </Card>

                {/* Actions */}
                <Card>
                    <CardHeader><CardTitle>Actions</CardTitle></CardHeader>
                    <CardContent>
                        <Dialog open={open} onOpenChange={setOpen}>
                            <DialogTrigger asChild>
                                <Button className="w-full gap-2"><PlusCircle className="h-4 w-4" /> Add Clinical Record</Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                                <DialogHeader><DialogTitle>New Clinical Record</DialogTitle></DialogHeader>
                                <form onSubmit={handleSaveRecord} className="space-y-6">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>Diagnosis</Label>
                                            <Input value={diagnosis} onChange={e => setDiagnosis(e.target.value)} required placeholder="ICD-10 or Description" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Follow Up Date</Label>
                                            <Input type="date" value={followUp} onChange={e => setFollowUp(e.target.value)} />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Symptoms</Label>
                                        <Textarea value={symptoms} onChange={e => setSymptoms(e.target.value)} placeholder="Patient complaints..." />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Remarks / Treatment Plan</Label>
                                        <Textarea value={remarks} onChange={e => setRemarks(e.target.value)} placeholder="Doctor's notes..." />
                                    </div>

                                    {/* Prescriptions */}
                                    <div className="border rounded-md p-4 bg-slate-50 space-y-4">
                                        <h3 className="font-semibold flex items-center gap-2"><Pill className="h-4 w-4" /> Prescriptions</h3>
                                        <div className="grid grid-cols-4 gap-2">
                                            <Input placeholder="Drug Name" value={drugName} onChange={e => setDrugName(e.target.value)} />
                                            <Input placeholder="Dosage (e.g. 500mg)" value={dosage} onChange={e => setDosage(e.target.value)} />
                                            <Input placeholder="Freq (e.g. BID)" value={frequency} onChange={e => setFrequency(e.target.value)} />
                                            <div className="flex gap-2">
                                                <Input placeholder="Duration" value={duration} onChange={e => setDuration(e.target.value)} />
                                                <Button type="button" onClick={addPrescription}>Add</Button>
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            {prescriptions.map((p, idx) => (
                                                <div key={idx} className="flex justify-between items-center bg-white p-2 rounded border text-sm">
                                                    <span>{p.drugName} - {p.dosage} - {p.frequency} ({p.duration})</span>
                                                    <Button type="button" variant="ghost" size="sm" onClick={() => removePrescription(idx)} className="text-red-500 h-6">X</Button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <Button type="submit" className="w-full">Save Clinical Record</Button>
                                </form>
                            </DialogContent>
                        </Dialog>
                    </CardContent>
                </Card>
            </div>

            <h2 className="text-2xl font-semibold">Clinical History</h2>
            <div className="space-y-4">
                {history.map((record) => (
                    <Card key={record.Record_ID}>
                        <CardHeader className="pb-2">
                            <div className="flex justify-between">
                                <CardTitle className="text-lg">{record.Diagnosis_ICD10}</CardTitle>
                                <span className="text-sm text-muted-foreground">{new Date(record.Visit_Date).toLocaleDateString()}</span>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="grid md:grid-cols-2 gap-4 text-sm">
                                <div><span className="font-semibold">Symptoms:</span> {record.Symptoms_Text}</div>
                                <div><span className="font-semibold">Remarks:</span> {record.Doctor_Remarks}</div>
                            </div>
                            {/* If we had prescription fetching here, we'd show it, but current getHistory API simply selects * from Clinical_Record. Needs Join for prescriptions. */}
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
