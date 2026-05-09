import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Loader2, Save, Key, Shield } from 'lucide-react';

export default function RazorpaySettings() {
  const [keyId, setKeyId] = useState('');
  const [keySecret, setKeySecret] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    const { data } = await supabase.from('payment_settings').select('*').limit(1).maybeSingle();
    
    if (data) {
      setKeyId(data.razorpay_key_id || '');
      setKeySecret(data.razorpay_key_secret || '');
    }
    setLoading(false);
  };

  const saveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');

    const { data: existing } = await supabase.from('payment_settings').select('id').limit(1).maybeSingle();

    let error;
    if (existing) {
      const res = await supabase.from('payment_settings').update({
        razorpay_key_id: keyId,
        razorpay_key_secret: keySecret
      }).eq('id', existing.id);
      error = res.error;
    } else {
      const res = await supabase.from('payment_settings').insert({
        razorpay_key_id: keyId,
        razorpay_key_secret: keySecret
      });
      error = res.error;
    }

    setSaving(false);
    if (error) {
      setMessage('Error: ' + error.message);
    } else {
      setMessage('Settings saved securely');
      setTimeout(() => setMessage(''), 3000);
    }
  };

  if (loading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin text-[#d4af37]" /></div>;

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-2xl font-bold" style={{ fontFamily: "'Playfair Display', serif" }}>Payment Settings</h3>
      </div>

      <div className="bg-[#1a1b1e] border border-[#2a2d32] rounded-lg p-6">
        <div className="flex items-start mb-6 pb-6 border-b border-[#2a2d32]">
          <div className="bg-[#d4af37]/10 p-3 rounded-full mr-4">
            <Shield className="h-6 w-6 text-[#d4af37]" />
          </div>
          <div>
            <h4 className="text-white font-medium mb-1">Razorpay Integration</h4>
            <p className="text-sm text-[#9ca3af]">
              Enter your Razorpay API keys to process payments. These credentials will be stored securely in the database using Row Level Security to prevent unauthorized access.
            </p>
          </div>
        </div>

        <form onSubmit={saveSettings} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-[#9ca3af] mb-2">
              Razorpay Key ID
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Key className="h-5 w-5 text-gray-500" />
              </div>
              <input
                type="text"
                value={keyId}
                onChange={(e) => setKeyId(e.target.value)}
                placeholder="rzp_test_..."
                className="appearance-none block w-full pl-10 pr-3 py-2 border border-[#2a2d32] rounded bg-[#0f1011] text-white focus:outline-none focus:ring-1 focus:ring-[#d4af37] focus:border-[#d4af37] sm:text-sm transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#9ca3af] mb-2">
              Razorpay Key Secret
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Key className="h-5 w-5 text-gray-500" />
              </div>
              <input
                type="password"
                value={keySecret}
                onChange={(e) => setKeySecret(e.target.value)}
                placeholder="••••••••••••••••••••••••"
                className="appearance-none block w-full pl-10 pr-3 py-2 border border-[#2a2d32] rounded bg-[#0f1011] text-white focus:outline-none focus:ring-1 focus:ring-[#d4af37] focus:border-[#d4af37] sm:text-sm transition-colors"
              />
            </div>
          </div>

          <div className="pt-4 flex items-center justify-between">
            {message ? (
              <span className={`text-sm ${message.startsWith('Error') ? 'text-red-500' : 'text-green-500'}`}>
                {message}
              </span>
            ) : <span />}
            
            <button
              type="submit"
              disabled={saving}
              className="flex justify-center py-2 px-6 border border-transparent rounded text-sm font-medium text-black bg-[#d4af37] hover:bg-[#f3e5ab] focus:outline-none transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {saving ? <Loader2 className="animate-spin h-5 w-5 mr-2" /> : <Save className="h-5 w-5 mr-2" />}
              Save Keys
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
