'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Activity, ShieldCheck, User } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Login failed');

      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));

      if (data.user.role === 'Patient') router.push('/patient/dashboard');
      else if (data.user.role === 'Doctor') router.push('/doctor/dashboard');
      else if (data.user.role === 'Admin') router.push('/admin/dashboard');

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Left: Hero Section */}
      <div className="hidden lg:flex w-1/2 bg-slate-900 relative items-center justify-center p-12 overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&q=80')] bg-cover bg-center opacity-20"></div>
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/90 to-slate-900/90"></div>

        <div className="relative z-10 text-white max-w-lg space-y-6">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-3 bg-blue-500 rounded-lg">
              <ShieldCheck className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight">MediGuard AI</h1>
          </div>

          <h2 className="text-4xl font-extrabold leading-tight">
            Intelligent Healthcare <br />
            <span className="text-blue-400">At Your Fingertips</span>
          </h2>

          <p className="text-slate-300 text-lg leading-relaxed">
            Experience the future of preventive care. Our AI-driven platform connects you with top doctors, analyzes your vitals instantly, and manages your health records securely.
          </p>

          <div className="flex gap-4 pt-4">
            <div className="flex items-center gap-2 text-sm text-blue-200">
              <Activity className="h-5 w-5" /> Real-time Analysis
            </div>
            <div className="flex items-center gap-2 text-sm text-blue-200">
              <User className="h-5 w-5" /> Top Specialists
            </div>
          </div>
        </div>
      </div>

      {/* Right: Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-slate-50">
        <div className="w-full max-w-md space-y-8 bg-white p-10 rounded-2xl shadow-xl border border-slate-100">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold text-slate-900">Welcome Back</h2>
            <p className="text-slate-500">Sign in to your account to continue</p>
          </div>

          {error && (
            <div className="p-4 bg-red-50 text-red-600 text-sm rounded-lg flex items-center gap-2 border border-red-100">
              ⚠️ {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-11 bg-slate-50 border-slate-200 focus:bg-white transition-all"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="h-11 bg-slate-50 border-slate-200 focus:bg-white transition-all"
              />
            </div>

            <Button type="submit" className="w-full h-11 text-base font-medium bg-blue-600 hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200" disabled={loading}>
              {loading ? 'Signing In...' : 'Sign In'}
            </Button>
          </form>

          <div className="text-center pt-4 border-t border-slate-100">
            <p className="text-sm text-slate-500">
              New to MediGuard?{' '}
              <a href="/register" className="font-semibold text-blue-600 hover:text-blue-700 hover:underline">
                Create an account
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
