import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceArea } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface VitalsChartProps {
    data: any[]; // Expects { Timestamp, Systolic_BP, Diastolic_BP, Heart_Rate }
}

export default function VitalsChart({ data }: VitalsChartProps) {
    // Format data for chart
    const chartData = data.map(d => ({
        time: new Date(d.Timestamp).toLocaleDateString() + ' ' + new Date(d.Timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        systolic: d.Systolic_BP,
        diastolic: d.Diastolic_BP,
        heartRate: d.Heart_Rate
    })).reverse(); // Assuming input is Descending (newest first), we want Ascending for chart

    return (
        <Card className="w-full h-[400px]">
            <CardHeader>
                <CardTitle className="text-sm font-medium text-slate-500">Blood Pressure & Heart Rate Trends</CardTitle>
            </CardHeader>
            <CardContent className="h-[320px]">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                        <XAxis dataKey="time" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} domain={['auto', 'auto']} />
                        <Tooltip
                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        />

                        {/* Normal Range Reference (approx 90-120 sy / 60-80 dia) */}
                        <ReferenceArea y1={120} y2={140} strokeOpacity={0} fill="#fef08a" fillOpacity={0.2} label="Elevated" />
                        <ReferenceArea y1={140} y2={200} strokeOpacity={0} fill="#fecaca" fillOpacity={0.2} label="High" />

                        <Line type="monotone" dataKey="systolic" stroke="#ef4444" strokeWidth={2} dot={{ fill: '#ef4444' }} name="Systolic BP" />
                        <Line type="monotone" dataKey="diastolic" stroke="#f97316" strokeWidth={2} dot={{ fill: '#f97316' }} name="Diastolic BP" />
                        <Line type="monotone" dataKey="heartRate" stroke="#3b82f6" strokeWidth={2} strokeDasharray="5 5" dot={false} name="Heart Rate" />
                    </LineChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
}
