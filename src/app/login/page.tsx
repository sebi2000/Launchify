'use client';
import React, { useState } from 'react';
import axios from 'axios';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const base = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:9000';

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true); setError(null);
      const res = await axios.post(`${base}/auth/login`, { email, password });
      // store token both in localStorage and cookie for middleware
      localStorage.setItem('token', res.data.token);
      document.cookie = `token=${res.data.token}; Path=/; SameSite=Lax`; // basic cookie
      if (res.data.siteName) localStorage.setItem('siteName', res.data.siteName);
      window.location.href = '/home';
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || 'Login failed');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white px-4">
      <form onSubmit={submit} className="w-full max-w-sm space-y-6 bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-xl shadow">
        <h1 className="text-xl font-semibold">Login</h1>
        {error && <div className="text-sm text-red-400">{error}</div>}
        <div className="space-y-2">
          <label className="block text-sm">Email</label>
          <input type="email" value={email} onChange={e=>setEmail(e.target.value)} required className="w-full px-3 py-2 rounded bg-white/10 border border-white/20 focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div className="space-y-2">
          <label className="block text-sm">Password</label>
          <input type="password" value={password} onChange={e=>setPassword(e.target.value)} required className="w-full px-3 py-2 rounded bg-white/10 border border-white/20 focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <button disabled={loading} className={`w-full py-2 rounded text-sm font-medium bg-blue-600 hover:bg-blue-500 transition ${loading?'opacity-50 cursor-not-allowed':''}`}>{loading?'Logging in...':'Login'}</button>
        <div className="text-xs text-gray-300 text-center">No account? <a href="/register" className="text-blue-400 hover:underline">Register</a></div>
      </form>
    </div>
  );
};

export default LoginPage;
