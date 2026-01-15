'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { UploadCloud, CheckCircle, AlertCircle, AlertTriangle, Pill, Activity } from 'lucide-react';
import VitalsChart from '@/components/dashboard/VitalsChart';
import AIChat from '@/components/dashboard/AIChat';

export default function UploadPage() {
    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [message, setMessage] = useState('');
    const router = useRouter();

    const [aiResult, setAiResult] = useState<any>(null);
    const [recentVitals, setRecentVitals] = useState<any[]>([]);
    const [patientId, setPatientId] = useState<number | undefined>(undefined);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) setFile(e.target.files[0]);
    };

    const handleUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file) return;

        setUploading(true);
        setStatus('idle');
        setMessage('');
        setAiResult(null);

        const formData = new FormData();
        formData.append('file', file);

        try {
            const token = localStorage.getItem('token');
            const res = await fetch('http://localhost:5000/api/upload/vitals', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });

            const data = await res.json();

            if (!res.ok) throw new Error(data.message || 'Upload failed');

            setStatus('success');
            setMessage(`Successfully processed ${data.totalRows} records.`);

            if (data.aiAnalysis) {
                setAiResult(data.aiAnalysis);
                setPatientId(data.aiAnalysis.Patient_ID);
            }
            if (data.recentVitals) {
                setRecentVitals(data.recentVitals);
            }
        } catch (err: any) {
            setStatus('error');
            setMessage(err.message);
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 p-4 md:p-8">
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Upload Section */}
                {!aiResult && (
                    <Card className="max-w-2xl mx-auto">
                        <CardHeader>
                            <CardTitle>Upload Vitals Data</CardTitle>
                            <CardDescription>Upload your CSV file to generate a comprehensive AI health analysis.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="border-2 border-dashed border-slate-300 rounded-lg p-10 text-center hover:bg-slate-50 transition-colors">
                                <UploadCloud className="mx-auto h-12 w-12 text-slate-400" />
                                <p className="mt-2 text-sm text-slate-600">Drag and drop your CSV file here, or click to browse</p>
                                <Input
                                    type="file"
                                    accept=".csv"
                                    onChange={handleFileChange}
                                    className="mt-4"
                                />
                            </div>

                            {file && (
                                <div className="flex items-center justify-between text-sm bg-slate-100 p-2 rounded">
                                    <span className="truncate max-w-[200px]">{file.name}</span>
                                    <span className="text-slate-500">{(file.size / 1024).toFixed(1)} KB</span>
                                </div>
                            )}

                            {status === 'error' && (
                                <div className="flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded text-sm">
                                    <AlertCircle className="h-4 w-4" /> {message}
                                </div>
                            )}

                            <div className="flex gap-4">
                                <Button variant="outline" onClick={() => router.back()} className="w-full">Cancel</Button>
                                <Button onClick={handleUpload} disabled={!file || uploading} className="w-full">
                                    {uploading ? 'Processing...' : 'Upload & Analyze'}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Analysis Dashboard */}
                {aiResult && (
                    <div className="space-y-6">
                        {/* Header Badge */}
                        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                            <div>
                                <h1 className="text-2xl font-bold text-slate-900">Health Analysis Report</h1>
                                <p className="text-slate-500">Generated based on your uploaded vitals and clinical history.</p>
                            </div>
                            <Badge className={`text-lg px-4 py-1.5 rounded-full capitalize ${aiResult.Risk_Category === 'Critical' || aiResult.Risk_Category === 'High' ? 'bg-red-100 text-red-700 hover:bg-red-100' :
                                    aiResult.Risk_Category === 'Medium' ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-100' :
                                        'bg-green-100 text-green-700 hover:bg-green-100'
                                }`}>
                                Risk Level: {aiResult.Risk_Category}
                            </Badge>
                        </div>

                        {/* Main Grid */}
                        <div className="grid gap-6 md:grid-cols-2">
                            {/* Left Col: Chart & Reasoning */}
                            <div className="space-y-6">
                                <VitalsChart data={recentVitals} />

                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2 text-base">
                                            <Activity className="h-5 w-5 text-blue-600" />
                                            Clinical Reasoning
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-slate-700 leading-relaxed text-sm">
                                            {aiResult.RAG_Reasoning}
                                        </p>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Right Col: Factors, Meds, Chat */}
                            <div className="space-y-6">
                                {/* Risk Factors */}
                                <Card className="border-l-4 border-l-red-400">
                                    <CardHeader className="pb-2">
                                        <CardTitle className="flex items-center gap-2 text-base">
                                            <AlertTriangle className="h-5 w-5 text-red-500" />
                                            Key Risk Factors
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        {aiResult.Key_Factors && aiResult.Key_Factors.length > 0 ? (
                                            <ul className="space-y-2">
                                                {aiResult.Key_Factors.map((factor: string, i: number) => (
                                                    <li key={i} className="text-sm text-slate-700 flex items-start gap-2">
                                                        <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-red-400 shrink-0" />
                                                        {factor}
                                                    </li>
                                                ))}
                                            </ul>
                                        ) : (
                                            <p className="text-sm text-slate-500 italic">No specific risk triggers identified.</p>
                                        )}
                                    </CardContent>
                                </Card>

                                {/* Medication Links */}
                                <Card className="border-l-4 border-l-purple-400">
                                    <CardHeader className="pb-2">
                                        <CardTitle className="flex items-center gap-2 text-base">
                                            <Pill className="h-5 w-5 text-purple-500" />
                                            Medication Correlation
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        {aiResult.Medication_Links && aiResult.Medication_Links.length > 0 ? (
                                            <ul className="space-y-2">
                                                {aiResult.Medication_Links.map((link: string, i: number) => (
                                                    <li key={i} className="text-sm text-slate-700 flex items-start gap-2">
                                                        <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-purple-400 shrink-0" />
                                                        {link}
                                                    </li>
                                                ))}
                                            </ul>
                                        ) : (
                                            <p className="text-sm text-slate-500 italic">No medication interactions detected.</p>
                                        )}
                                    </CardContent>
                                </Card>

                                {/* Chat Interface */}
                                <AIChat patientId={patientId} contextId={aiResult._id} />
                            </div>
                        </div>

                        <div className="flex justify-end pt-8">
                            <Button variant="outline" onClick={() => { setAiResult(null); setFile(null); }}>
                                Upload Another File
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

// Helper for class names
function cn(...classes: (string | undefined | null | false)[]) {
    return classes.filter(Boolean).join(' ');
}
