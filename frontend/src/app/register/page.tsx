'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Link from 'next/link';
import { Lock, Check, X } from 'lucide-react';

export default function RegisterPage() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [role, setRole] = useState<'Patient' | 'Doctor'>('Patient');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    // Password Validation Logic
    const requirements = [
        { regex: /.{8,}/, text: "At least 8 characters" },
        { regex: /[A-Z]/, text: "One uppercase letter" },
        { regex: /[0-9]/, text: "One number" },
        { regex: /[^A-Za-z0-9]/, text: "One special character (!@#$%^&*)" },
    ];

    const strength = requirements.reduce((acc, req) => acc + (req.regex.test(password) ? 1 : 0), 0);

    // Determine strength color and text
    const getStrengthInfo = (score: number) => {
        if (score === 0) return { label: "", color: "bg-gray-200" };
        if (score <= 2) return { label: "Weak", color: "bg-red-500" };
        if (score === 3) return { label: "Medium", color: "bg-yellow-500" };
        return { label: "Strong", color: "bg-green-500" };
    };

    const { label: strengthLabel, color: strengthColor } = getStrengthInfo(strength);

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        if (password !== confirmPassword) {
            setError("Passwords do not match");
            setLoading(false);
            return;
        }

        if (strength < 4) {
            setError("Password is too weak. Please meet all requirements.");
            setLoading(false);
            return;
        }

        try {
            const res = await fetch('http://localhost:5000/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password, fullName, role }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Registration failed');

            // On success, redirect to login
            router.push('/');
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen w-full items-center justify-center bg-gray-50 p-4">
            <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md border border-gray-100">
                <div className="text-center">
                    <h1 className="text-3xl font-bold text-primary">Join MediGuard</h1>
                    <p className="text-gray-500">Create your account</p>
                </div>

                {error && <div className="p-3 text-sm text-red-500 bg-red-50 border border-red-200 rounded-md text-center">{error}</div>}

                <form onSubmit={handleRegister} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="fullName">Full Name</Label>
                        <Input
                            id="fullName"
                            placeholder="John Doe"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                            id="email"
                            type="email"
                            placeholder="user@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Role</Label>
                        <Select onValueChange={(val: 'Patient' | 'Doctor') => setRole(val)} defaultValue="Patient">
                            <SelectTrigger>
                                <SelectValue placeholder="Select Role" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Patient">Patient</SelectItem>
                                <SelectItem value="Doctor">Doctor</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Password Field */}
                    <div className="space-y-2">
                        <Label htmlFor="password">Password</Label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                            <Input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="pl-10"
                                required
                            />
                        </div>
                    </div>

                    {/* Password Strength Meter */}
                    {password && (
                        <div className="space-y-2">
                            <div className="flex justify-between items-center text-xs">
                                <span className="text-gray-500">Password Strength:</span>
                                <span className={`font-medium ${strengthLabel === 'Weak' ? 'text-red-500' : strengthLabel === 'Medium' ? 'text-yellow-500' : 'text-green-500'}`}>
                                    {strengthLabel}
                                </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
                                <div
                                    className={`h-full transition-all duration-300 ${strengthColor}`}
                                    style={{ width: `${(strength / 4) * 100}%` }}
                                ></div>
                            </div>
                            <ul className="space-y-1 mt-2">
                                {requirements.map((req, index) => {
                                    const isMet = req.regex.test(password);
                                    return (
                                        <li key={index} className="flex items-center text-xs text-gray-500">
                                            {isMet ? (
                                                <Check className="h-3 w-3 text-green-500 mr-2" />
                                            ) : (
                                                <X className="h-3 w-3 text-gray-400 mr-2" />
                                            )}
                                            <span className={isMet ? "text-green-600" : "text-gray-500"}>{req.text}</span>
                                        </li>
                                    );
                                })}
                            </ul>
                        </div>
                    )}

                    {/* Confirm Password Field */}
                    <div className="space-y-2">
                        <Label htmlFor="confirmPassword">Confirm Password</Label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                            <Input
                                id="confirmPassword"
                                type="password"
                                placeholder="Confirm your password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="pl-10"
                                required
                            />
                        </div>
                    </div>

                    <Button type="submit" className="w-full mt-4" disabled={loading}>
                        {loading ? 'Creating Account...' : 'Sign Up'}
                    </Button>
                </form>

                <div className="text-center text-sm">
                    <Link href="/" className="text-primary hover:underline">Already have an account? Login</Link>
                </div>
            </div>
        </div>
    );
}
