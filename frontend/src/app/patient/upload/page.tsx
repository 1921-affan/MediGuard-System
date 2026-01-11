'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { UploadCloud, CheckCircle, AlertCircle } from 'lucide-react';

export default function UploadPage() {
    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [message, setMessage] = useState('');
    const router = useRouter();

    const [aiResult, setAiResult] = useState<any>(null);

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
            }
        } catch (err: any) {
            setStatus('error');
            setMessage(err.message);
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 p-8 flex items-center justify-center">
            <div className="w-full max-w-4xl grid gap-8 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Upload Vitals Data</CardTitle>
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

                        {status === 'success' && (
                            <div className="flex items-center gap-2 text-green-600 bg-green-50 p-3 rounded text-sm">
                                <CheckCircle className="h-4 w-4" /> {message}
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

                {/* AI Analysis Result */}
                {aiResult ? (
                    <Card className="border-blue-100 shadow-md">
                        <CardHeader className="bg-blue-50/50 pb-4">
                            <CardTitle className="text-blue-900 flex items-center justify-between">
                                AI Health Analysis
                                <span className={cn("text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider",
                                    aiResult.Risk_Category === 'Critical' || aiResult.Risk_Category === 'High'
                                        ? "bg-red-100 text-red-700"
                                        : "bg-green-100 text-green-700")}>
                                    {aiResult.Risk_Category} Risk
                                </span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6 pt-6">
                            <div>
                                <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-2">Analysis & Reasoning</h4>
                                <p className="text-slate-700 leading-relaxed bg-slate-50 p-4 rounded-lg border">
                                    {aiResult.RAG_Reasoning}
                                </p>
                            </div>

                            <div className="flex items-center justify-between text-sm text-slate-500 border-t pt-4">
                                <span>AI Confidence: <span className="font-medium text-slate-900">{aiResult.Confidence_Score}%</span></span>
                                <span>Source: Gemini 1.5 Pro</span>
                            </div>

                            {(aiResult.Risk_Category === 'High' || aiResult.Risk_Category === 'Critical') && (
                                <div className="bg-red-50 border border-red-100 p-4 rounded-lg">
                                    <div className="flex gap-3 mb-3">
                                        <AlertCircle className="h-5 w-5 text-red-600 shrink-0" />
                                        <p className="text-sm text-red-800 font-medium">
                                            Your vitals indicate potential health risks. It is highly recommended to consult a specialist immediately.
                                        </p>
                                    </div>
                                    <Button
                                        className="w-full bg-red-600 hover:bg-red-700 text-white"
                                        onClick={() => router.push('/patient/appointments')}
                                    >
                                        Find a Doctor Now
                                    </Button>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                ) : (
                    <div className="flex items-center justify-center p-8 border-2 border-dashed border-slate-200 rounded-lg text-slate-400 bg-slate-50/50">
                        <div className="text-center">
                            <AlertCircle className="h-10 w-10 mx-auto mb-3 opacity-20" />
                            <p>Upload vitals to generate<br />AI Health Analysis</p>
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
