'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';

import { Sidebar } from '@/components/Sidebar';

export default function ProfilePage() {
    const router = useRouter();
    // ... code ...
    // (State definitions remain same)
    const [profile, setProfile] = useState<any>(null);
    const [role, setRole] = useState<'Patient' | 'Doctor' | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState('');

    useEffect(() => {
        // ... (fetchProfile logic remains same) ...
        const fetchProfile = async () => {
            const token = localStorage.getItem('token');
            const userStr = localStorage.getItem('user');

            if (!token || !userStr) {
                router.push('/');
                return;
            }

            const user = JSON.parse(userStr);
            setRole(user.role);

            try {
                const res = await fetch('http://localhost:5000/api/auth/profile', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const data = await res.json();
                if (res.ok) {
                    if (data.DOB) data.DOB = data.DOB.split('T')[0];
                    setProfile(data);
                    console.log('Profile loaded:', data);
                    console.log('Current Role:', user.role);
                } else {
                    console.error('Failed to load profile');
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, [router]);

    const handleChange = (key: string, value: any) => {
        setProfile((prev: any) => ({ ...prev, [key]: value }));
    };

    const handleSave = async (e: React.FormEvent) => {
        // ... (logic remains same) ...
        e.preventDefault();
        setSaving(true);
        setMessage('');

        // Basic Validation Check
        if (!profile?.Full_Name?.trim()) {
            setMessage('Error: Full Name is required.');
            setSaving(false);
            return;
        }

        if (role === 'Patient') {
            if (!profile?.DOB || !profile?.Gender || !profile?.Blood_Group || !profile?.Phone_No) {
                setMessage('Error: Please fill all required fields (DOB, Gender, Blood Group, Phone).');
                setSaving(false);
                return;
            }
        }

        try {
            const token = localStorage.getItem('token');
            const res = await fetch('http://localhost:5000/api/auth/profile', {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(profile)
            });

            if (!res.ok) throw new Error('Failed to update profile');

            setMessage('Success: Profile updated successfully!');
        } catch (err: any) {
            setMessage('Error updating profile: ' + err.message);
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-8">Loading profile...</div>;

    return (
        <div className="flex min-h-screen bg-slate-50">
            <Sidebar />
            <div className="flex-1 p-8 flex items-center justify-center overflow-y-auto max-h-screen">
                <Card className="w-full max-w-3xl">
                    <CardHeader className="flex flex-row items-center gap-4 border-b pb-4 mb-4">
                        <Button variant="ghost" size="icon" onClick={() => router.back()}>
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                        <CardTitle className="text-2xl">Edit Profile ({role})</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {message && <div className={`mb-6 p-3 rounded text-sm ${message.startsWith('Success') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{message}</div>}

                        <form onSubmit={handleSave} className="space-y-6">

                            {/* Personal Info Section */}
                            <div>
                                <h3 className="text-lg font-semibold text-gray-800 mb-4 border-l-4 border-blue-500 pl-3">Personal Information</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label className="after:content-['*'] after:ml-0.5 after:text-red-500">Full Name</Label>
                                        <Input value={profile?.Full_Name || ''} onChange={(e) => handleChange('Full_Name', e.target.value)} required />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Gender</Label>
                                        <Select onValueChange={(val) => handleChange('Gender', val)} value={profile?.Gender}>
                                            <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="Male">Male</SelectItem>
                                                <SelectItem value="Female">Female</SelectItem>
                                                <SelectItem value="Other">Other</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    {role === 'Patient' && (
                                        <>
                                            <div className="space-y-2">
                                                <Label className="after:content-['*'] after:ml-0.5 after:text-red-500">Date of Birth</Label>
                                                <Input type="date" value={profile?.DOB || ''} onChange={(e) => handleChange('DOB', e.target.value)} required />
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="after:content-['*'] after:ml-0.5 after:text-red-500">Phone No</Label>
                                                <Input value={profile?.Phone_No || ''} onChange={(e) => handleChange('Phone_No', e.target.value)} required />
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Medical / Professional Info Section */}
                            <div>
                                <h3 className="text-lg font-semibold text-gray-800 mb-4 border-l-4 border-green-500 pl-3">
                                    {role === 'Doctor' ? 'Professional Details' : 'Medical Details'}
                                </h3>

                                {role === 'Patient' && (
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label className="after:content-['*'] after:ml-0.5 after:text-red-500">Blood Group</Label>
                                                <Input value={profile?.Blood_Group || ''} onChange={(e) => handleChange('Blood_Group', e.target.value)} required placeholder="e.g. O+" />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Lifestyle / Activity Level</Label>
                                                <Select onValueChange={(val) => handleChange('Lifestyle_Activity', val)} value={profile?.Lifestyle_Activity}>
                                                    <SelectTrigger><SelectValue placeholder="Select Activity Level" /></SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="Sedentary">Sedentary (Little or no exercise)</SelectItem>
                                                        <SelectItem value="Lightly Active">Lightly Active (Light exercise 1-3 days/week)</SelectItem>
                                                        <SelectItem value="Moderately Active">Moderately Active (Moderate exercise 3-5 days/week)</SelectItem>
                                                        <SelectItem value="Very Active">Very Active (Hard exercise 6-7 days/week)</SelectItem>
                                                        <SelectItem value="Extra Active">Extra Active (Very hard exercise/sports & physical job)</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Diet Preferences</Label>
                                            <Select onValueChange={(val) => handleChange('Diet_Pref', val)} value={profile?.Diet_Pref}>
                                                <SelectTrigger><SelectValue placeholder="Select Diet Preference" /></SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="None">None (Omnivore - Eats everything)</SelectItem>
                                                    <SelectItem value="Vegetarian">Vegetarian (No meat)</SelectItem>
                                                    <SelectItem value="Vegan">Vegan (No animal products)</SelectItem>
                                                    <SelectItem value="Keto">Keto (Low carb, high fat)</SelectItem>
                                                    <SelectItem value="Paleo">Paleo (Whole foods, no processed)</SelectItem>
                                                    <SelectItem value="Gluten-Free">Gluten-Free (No wheat/gluten)</SelectItem>
                                                    <SelectItem value="Halal">Halal (Islamic dietary laws)</SelectItem>
                                                    <SelectItem value="Kosher">Kosher (Jewish dietary laws)</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                )}

                                {role === 'Doctor' && (
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label className="after:content-['*'] after:ml-0.5 after:text-red-500">License No</Label>
                                                <Input value={profile?.License_No || ''} onChange={(e) => handleChange('License_No', e.target.value)} required />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Specialization</Label>
                                                <Input value={profile?.Specialization || ''} onChange={(e) => handleChange('Specialization', e.target.value)} placeholder="e.g. Cardiology" />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label>Years of Experience</Label>
                                                <Input type="number" min="0" value={profile?.Years_Experience || ''} onChange={(e) => handleChange('Years_Experience', e.target.value)} />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Hospital Affiliation</Label>
                                                <Input value={profile?.Hospital_Affiliation || ''} onChange={(e) => handleChange('Hospital_Affiliation', e.target.value)} placeholder="e.g. City General Hospital" />
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <Label>Visiting Hours</Label>
                                            <div className="flex items-center gap-2">
                                                <Input
                                                    type="time"
                                                    className="w-full"
                                                    value={profile?.Consult_Hrs ? profile.Consult_Hrs.split(' - ')[0] : ''}
                                                    onChange={(e) => {
                                                        const end = profile?.Consult_Hrs ? profile.Consult_Hrs.split(' - ')[1] : '';
                                                        handleChange('Consult_Hrs', `${e.target.value} - ${end || ''}`);
                                                    }}
                                                />
                                                <span className="text-gray-500 font-medium">to</span>
                                                <Input
                                                    type="time"
                                                    className="w-full"
                                                    value={profile?.Consult_Hrs ? profile.Consult_Hrs.split(' - ')[1] : ''}
                                                    onChange={(e) => {
                                                        const start = profile?.Consult_Hrs ? profile.Consult_Hrs.split(' - ')[0] : '';
                                                        handleChange('Consult_Hrs', `${start || ''} - ${e.target.value}`);
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <Button type="submit" className="w-full h-12 text-lg" disabled={saving}>
                                {saving ? 'Saving...' : 'Save Profile Changes'}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
