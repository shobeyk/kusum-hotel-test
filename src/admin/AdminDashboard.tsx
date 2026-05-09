import React, { useState } from 'react';
import { Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Key, LayoutDashboard, LogOut, Bed, Image as ImageIcon } from 'lucide-react';
import RoomsManager from './RoomsManager';
import RazorpaySettings from './RazorpaySettings';
import HomepageImages from './HomepageImages';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/admin/login');
  };

  const navItems = [
    { name: 'Dashboard', path: '/admin', icon: LayoutDashboard },
    { name: 'Rooms', path: '/admin/rooms', icon: Bed },
    { name: 'Homepage Images', path: '/admin/images', icon: ImageIcon },
    { name: 'Payment Settings', path: '/admin/settings', icon: Key },
  ];

  return (
    <div className="flex h-screen bg-[#0f1011] font-inter text-white">
      {/* Sidebar */}
      <div className="w-64 bg-[#1a1b1e] border-r border-[#2a2d32] flex flex-col">
        <div className="h-16 flex items-center px-6 border-b border-[#2a2d32]">
          <h1 className="text-xl font-bold text-[#d4af37]" style={{ fontFamily: "'Playfair Display', serif" }}>Admin Panel</h1>
        </div>
        
        <nav className="flex-1 py-4 space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path || (item.path !== '/admin' && location.pathname.startsWith(item.path));
            return (
              <Link
                key={item.name}
                to={item.path}
                className={`flex items-center px-6 py-3 text-sm font-medium transition-colors ${
                  isActive 
                    ? 'bg-[#d4af37]/10 text-[#d4af37] border-r-2 border-[#d4af37]' 
                    : 'text-[#9ca3af] hover:bg-[#2a2d32] hover:text-white'
                }`}
              >
                <item.icon className="mr-3 h-5 w-5" />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-[#2a2d32]">
          <button
            onClick={handleLogout}
            className="flex items-center w-full px-4 py-2 text-sm text-[#9ca3af] hover:text-white hover:bg-[#2a2d32] rounded transition-colors"
          >
            <LogOut className="mr-3 h-5 w-5" />
            Sign Out
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <header className="h-16 bg-[#1a1b1e] border-b border-[#2a2d32] flex items-center justify-between px-8">
          <h2 className="text-lg font-medium">Hotel Management</h2>
           <Link to="/" className="text-sm text-[#d4af37] hover:text-[#f3e5ab]">&larr; View Live Site</Link>
        </header>

        <main className="p-8">
          <Routes>
            <Route path="/" element={<Overview />} />
            <Route path="/rooms" element={<RoomsManager />} />
            <Route path="/images" element={<HomepageImages />} />
            <Route path="/settings" element={<RazorpaySettings />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

function Overview() {
  return (
    <div className="space-y-6">
      <h3 className="text-2xl font-bold" style={{ fontFamily: "'Playfair Display', serif" }}>Welcome back</h3>
      <p className="text-[#9ca3af]">Select an option from the sidebar to manage your hotel.</p>
    </div>
  );
}
