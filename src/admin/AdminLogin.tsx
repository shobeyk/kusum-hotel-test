import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Lock, Mail, Loader2, Hotel } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      navigate('/admin');
    }
  };

  return (
    <div className="min-h-screen bg-[#0f1011] flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-inter">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Hotel className="mx-auto h-12 w-12 text-[#d4af37]" />
        <h2 className="mt-6 text-3xl tracking-tight font-bold text-white uppercase" style={{ fontFamily: "'Playfair Display', serif" }}>
          Admin Access
        </h2>
        <p className="mt-2 text-sm text-[#9ca3af]">Sign in to manage hotel details</p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-[#1a1b1e] py-8 px-4 shadow sm:rounded-lg sm:px-10 border border-[#2a2d32]">
          <form className="space-y-6" onSubmit={handleLogin}>
            
            {error && (
              <div className="bg-red-500/10 border border-red-500/50 rounded p-3">
                <p className="text-sm text-red-500">{error}</p>
              </div>
            )}

            <div>
              <label placholder="email" className="block text-sm font-medium text-[#9ca3af]">
                Email address
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-500" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none block w-full pl-10 pr-3 py-2 border border-[#2a2d32] rounded bg-[#0f1011] text-white focus:outline-none focus:ring-1 focus:ring-[#d4af37] focus:border-[#d4af37] sm:text-sm transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#9ca3af]">
                Password
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-500" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none block w-full pl-10 pr-3 py-2 border border-[#2a2d32] rounded bg-[#0f1011] text-white focus:outline-none focus:ring-1 focus:ring-[#d4af37] focus:border-[#d4af37] sm:text-sm transition-colors"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded text-sm font-medium text-black bg-[#d4af37] hover:bg-[#f3e5ab] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#d4af37] focus:ring-offset-[#0f1011] transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {loading ? <Loader2 className="animate-spin h-5 w-5" /> : 'Log in'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
