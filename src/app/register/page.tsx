'use client';
import React, { useState } from 'react';
import axios from 'axios';

const RegisterPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [siteName, setSiteName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const base = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:9000';

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true); setError(null); setSuccess(false);
      const res = await axios.post(`${base}/auth/register`, { email, password, name, siteName });
      setSuccess(true);
      try {
        const loginRes = await axios.post(`${base}/auth/login`, { email, password });
        localStorage.setItem('token', loginRes.data.token);
        document.cookie = `token=${loginRes.data.token}; Path=/; SameSite=Lax`;
        if (loginRes.data.siteName) localStorage.setItem('siteName', loginRes.data.siteName);
        window.location.href = '/home';
      } catch { /* ignore */ }
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || 'Registration failed');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white px-4">
      <form onSubmit={submit} className="w-full max-w-sm space-y-6 bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-xl shadow">
        <h1 className="text-xl font-semibold">Register</h1>
        {error && <div className="text-sm text-red-400">{error}</div>}
        {success && <div className="text-sm text-green-400">Account created. Redirecting...</div>}
        <div className="space-y-2">
          <label className="block text-sm">Name</label>
          <input type="text" value={name} onChange={e=>setName(e.target.value)} className="w-full px-3 py-2 rounded bg-white/10 border border-white/20 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Your name" />
        </div>
        <div className="space-y-2">
          <label className="block text-sm">Email</label>
          <input type="email" value={email} onChange={e=>setEmail(e.target.value)} required className="w-full px-3 py-2 rounded bg-white/10 border border-white/20 focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div className="space-y-2">
          <label className="block text-sm">Password</label>
          <input type="password" value={password} onChange={e=>setPassword(e.target.value)} required minLength={6} className="w-full px-3 py-2 rounded bg-white/10 border border-white/20 focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div className="space-y-2">
          <label className="block text-sm">Site Name (public slug)</label>
          <input type="text" value={siteName} onChange={e=>setSiteName(e.target.value)} required pattern="[a-z0-9-]+" minLength={3} maxLength={40} className="w-full px-3 py-2 rounded bg-white/10 border border-white/20 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="your-store" />
          <p className="text-[11px] text-gray-400">Lowercase, numbers & hyphens only. Used in public URLs.</p>
        </div>
        <button disabled={loading} className={`w-full py-2 rounded text-sm font-medium bg-blue-600 hover:bg-blue-500 transition ${loading?'opacity-50 cursor-not-allowed':''}`}>{loading?'Creating...':'Register'}</button>
        <div className="text-xs text-gray-300 text-center">Have an account? <a href="/login" className="text-blue-400 hover:underline">Login</a></div>
      </form>
    </div>
  );
};

export default RegisterPage;
