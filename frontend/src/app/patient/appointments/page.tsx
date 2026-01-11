'use client';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Calendar, Clock, UserIcon, MapPin, Stethoscope, Briefcase } from 'lucide-react';
import { cn } from '@/lib/utils';
// import { Badge } from '@/components/ui/badge';

export default function AppointmentsPage() {
    const [doctors, setDoctors] = useState<any[]>([]);
    const [appointments, setAppointments] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    // Booking State
    const [bookingOpen, setBookingOpen] = useState(false);
    const [selectedDoctor, setSelectedDoctor] = useState<any>(null);
    const [date, setDate] = useState('');
    const [time, setTime] = useState('');
    const [reason, setReason] = useState('');

    useEffect(() => {
        const fetchInitialData = async () => {
            const token = localStorage.getItem('token');
            if (!token) return;

            try {
                // Fetch Doctors
                const docRes = await fetch('http://localhost:5000/api/auth/doctors', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (docRes.ok) setDoctors(await docRes.json());

                // Fetch Appointments
                const apptRes = await fetch('http://localhost:5000/api/appointments', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (apptRes.ok) setAppointments(await apptRes.json());

            } catch (err) {
                console.error(err);
            }
        };
        fetchInitialData();
    }, []);

    const openBooking = (doctor: any) => {
        setSelectedDoctor(doctor);
        setBookingOpen(true);
        setMessage('');
        // Reset form
        setDate('');
        setTime('');
        setReason('');
    };

    const handleBook = async () => {
        if (!date || !time) {
            setMessage('Error: Please select date and time.');
            return;
        }

        setLoading(true);
        setMessage('');

        try {
            const token = localStorage.getItem('token');
            const scheduledTime = `${date}T${time}:00`;

            const res = await fetch('http://localhost:5000/api/appointments', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    doctorId: selectedDoctor.Doctor_ID,
                    scheduledTime,
                    reason
                })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Booking failed');

            // Success
            setAppointments([...appointments, {
                Appt_ID: Date.now(), // temp id
                Doctor_Name: selectedDoctor.Full_Name,
                Scheduled_Time: scheduledTime,
                Status: 'Scheduled'
            }]);

            setBookingOpen(false);
            alert('Appointment booked successfully!');

        } catch (err: any) {
            setMessage(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-800">Find a Specialist</h1>
                    <p className="text-slate-500">Browse our network of specialized doctors and book an instant consultation.</p>
                </div>
            </div>

            {/* Doctor Grid */}
            <div>
                <h2 className="text-xl font-semibold mb-4 text-slate-700">Available Doctors</h2>
                {doctors.length === 0 ? (
                    <div className="p-8 text-center text-slate-500 bg-white rounded-lg border border-dashed">
                        No doctors currently registered.
                    </div>
                ) : (
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {doctors.map(doc => (
                            <Card key={doc.Doctor_ID} className="overflow-hidden hover:shadow-lg transition-shadow border-slate-200">
                                <div className="h-2 bg-blue-500 w-full" />
                                <CardHeader className="flex flex-row gap-4 items-start pb-2">
                                    <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xl shrink-0">
                                        {doc.Full_Name?.charAt(0)}
                                    </div>
                                    <div className="space-y-1">
                                        <CardTitle className="text-lg">{doc.Full_Name}</CardTitle>
                                        <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-blue-50 text-blue-700 hover:bg-blue-100">
                                            {doc.Specialization || 'General Physician'}
                                        </span>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-4 text-sm text-slate-600">
                                    <div className="flex items-center gap-2">
                                        <Clock className="h-4 w-4 text-slate-400" />
                                        <span>Hours: <span className="font-medium text-slate-800">{doc.Consult_Hrs || '9:00 AM - 5:00 PM'}</span></span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Briefcase className="h-4 w-4 text-slate-400" />
                                        <span>License: {doc.Specialization ? 'Verified' : 'Pending'}</span>
                                    </div>
                                </CardContent>
                                <CardFooter className="bg-slate-50 p-4 pt-4">
                                    <Button className="w-full bg-blue-600 hover:bg-blue-700" onClick={() => openBooking(doc)}>
                                        Book Appointment
                                    </Button>
                                </CardFooter>
                            </Card>
                        ))}
                    </div>
                )}
            </div>

            {/* Upcoming Appointments Section */}
            <div className="pt-8 border-t">
                <h2 className="text-xl font-semibold mb-4 text-slate-700">Your Scheduled Visits</h2>
                <Card>
                    <CardContent className="p-0">
                        {appointments.length > 0 ? (
                            <div className="divide-y">
                                {appointments.map((appt: any) => (
                                    <div key={appt.Appt_ID} className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors">
                                        <div className="flex items-center gap-4">
                                            <div className="h-10 w-10 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
                                                <Calendar className="h-5 w-5" />
                                            </div>
                                            <div>
                                                <p className="font-semibold text-slate-800">
                                                    {new Date(appt.Scheduled_Time).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                                                </p>
                                                <p className="text-sm text-slate-500 flex items-center gap-1">
                                                    <Clock className="h-3 w-3" />
                                                    {new Date(appt.Scheduled_Time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-medium text-sm text-slate-900">Dr. {appt.Doctor_Name || 'Unknown Doctor'}</p>
                                            <span className={cn("text-xs font-medium px-2 py-0.5 rounded-full",
                                                appt.Status === 'Scheduled' ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700")}>
                                                {appt.Status}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-12 text-slate-400">
                                <Calendar className="h-12 w-12 mx-auto mb-3 opacity-20" />
                                <p>No upcoming appointments found.</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Booking Dialog */}
            <Dialog open={bookingOpen} onOpenChange={setBookingOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Book Appointment</DialogTitle>
                    </DialogHeader>

                    {selectedDoctor && (
                        <div className="py-4 space-y-4">
                            <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg border border-blue-100">
                                <div className="h-10 w-10 rounded-full bg-blue-200 flex items-center justify-center text-blue-700 font-bold">
                                    {selectedDoctor.Full_Name?.charAt(0)}
                                </div>
                                <div>
                                    <p className="font-semibold text-blue-900">{selectedDoctor.Full_Name}</p>
                                    <p className="text-xs text-blue-700">{selectedDoctor.Specialization}</p>
                                </div>
                            </div>

                            {message && <p className="text-sm text-red-500">{message}</p>}

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Date</Label>
                                    <Input type="date" value={date} onChange={e => setDate(e.target.value)} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Time</Label>
                                    <Input type="time" value={time} onChange={e => setTime(e.target.value)} />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>Reason for Consult</Label>
                                <Input
                                    placeholder="e.g. Knee pain, fever, etc."
                                    value={reason}
                                    onChange={e => setReason(e.target.value)}
                                />
                            </div>
                        </div>
                    )}

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setBookingOpen(false)}>Cancel</Button>
                        <Button onClick={handleBook} disabled={loading}>
                            {loading ? 'Confirming...' : 'Confirm Booking'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
