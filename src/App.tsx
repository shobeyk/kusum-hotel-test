import React, { useEffect, useState } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Home from './pages/Home';
import AdminDashboard from './admin/AdminDashboard';
import AdminLogin from './admin/AdminLogin';
import { supabase } from './lib/supabase';
import type { Session } from '@supabase/supabase-js';

// Protect admin routes
function ProtectedRoute({ children, session }: { children: React.ReactNode, session: Session | null }) {
  if (!session) {
    return <Navigate to="/admin/login" replace />;
  }
  return <>{children}</>;
}

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check active sessions and sets the user
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    // Listen for changes on auth state (logged in, signed out, etc.)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return <div className="min-h-screen bg-[#0f1011] flex items-center justify-center text-white">Loading...</div>;
  }

  return (
    <>
      <Toaster toastOptions={{
        position: 'top-center',
        style: { background: '#1a1b1e', color: '#fff', border: '1px solid #2a2d32' }
      }} />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route 
          path="/admin/login" 
          element={session ? <Navigate to="/admin" replace /> : <AdminLogin />} 
        />
        <Route 
          path="/admin/*" 
          element={
            <ProtectedRoute session={session}>
              <AdminDashboard />
            </ProtectedRoute>
          } 
        />
      </Routes>
    </>
  );
}
