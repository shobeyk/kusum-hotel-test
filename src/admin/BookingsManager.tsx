import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Search, Filter, Key, Calendar, User, Phone, CheckCircle, Clock, XCircle, Loader2, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';

export default function BookingsManager() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('bookings').select('*').order('created_at', { ascending: false });
    if (error) {
      toast.error('Failed to fetch bookings');
    } else {
      setBookings(data || []);
    }
    setLoading(false);
  };

  const handleUpdateStatus = async (id, newStatus) => {
    const { error } = await supabase.from('bookings').update({ status: newStatus }).eq('id', id);
    if (error) {
      toast.error('Failed to update status');
    } else {
      toast.success('Status updated');
      setBookings(bookings.map(b => b.id === id ? { ...b, status: newStatus } : b));
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'Confirmed': return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'Pending Confirmation': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'Checked In': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'Completed': return 'bg-purple-500/10 text-purple-500 border-purple-500/20';
      case 'Cancelled': return 'bg-red-500/10 text-red-500 border-red-500/20';
      default: return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
    }
  };

  const getPaymentStatusColor = (status) => {
    if (status === 'Paid Advance') return 'text-green-500';
    if (status === 'Payment Pending') return 'text-yellow-500';
    if (status === 'Failed Payment') return 'text-red-500';
    return 'text-gray-500';
  };

  const filteredBookings = bookings.filter(b => {
    const matchesSearch = (b.guest_name?.toLowerCase().includes(searchTerm.toLowerCase()) || b.guest_phone?.includes(searchTerm));
    const matchesFilter = statusFilter === 'All' || b.status === statusFilter;
    return matchesSearch && matchesFilter;
  });

  if (loading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin text-[#d4af37]" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-2xl font-bold" style={{ fontFamily: "'Playfair Display', serif" }}>Bookings Management</h3>
        <button onClick={fetchBookings} className="text-sm bg-[#1a1b1e] border border-[#2a2d32] px-4 py-2 rounded hover:bg-[#2a2d32] transition">
          Refresh
        </button>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col md:flex-row gap-4 bg-[#1a1b1e] p-4 rounded-lg border border-[#2a2d32]">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input 
            type="text" 
            placeholder="Search by name or phone..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#0f1011] border border-[#2a2d32] rounded pl-10 pr-4 py-2 text-white outline-none focus:border-[#d4af37]"
          />
        </div>
        <div className="w-full md:w-64 relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full bg-[#0f1011] border border-[#2a2d32] rounded pl-10 pr-4 py-2 text-white outline-none focus:border-[#d4af37] appearance-none"
          >
            <option value="All">All Statuses</option>
            <option value="Pending Confirmation">Pending Confirmation</option>
            <option value="Confirmed">Confirmed</option>
            <option value="Checked In">Checked In</option>
            <option value="Completed">Completed</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Bookings List */}
      <div className="grid gap-4">
        {filteredBookings.length === 0 ? (
          <div className="text-center p-8 bg-[#1a1b1e] border border-[#2a2d32] rounded-lg">
            <p className="text-gray-400">No bookings found.</p>
          </div>
        ) : (
          filteredBookings.map((booking) => (
            <div key={booking.id} className="bg-[#1a1b1e] border border-[#2a2d32] rounded-lg overflow-hidden flex flex-col md:flex-row">
              {/* Left col: Important details */}
              <div className="p-6 flex-1 border-b md:border-b-0 md:border-r border-[#2a2d32]">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h4 className="font-bold text-lg text-white mb-1">{booking.guest_name}</h4>
                    <p className="text-sm text-gray-400 flex items-center gap-2"><Phone className="w-3 h-3" /> {booking.guest_phone}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(booking.status)}`}>
                    {booking.status}
                  </span>
                </div>
                
                <div className="grid grid-cols-2 gap-y-3 gap-x-4 text-sm mt-4">
                  <div>
                    <p className="text-gray-500 text-xs uppercase tracking-wider mb-1">Room</p>
                    <p className="font-medium">{booking.room_name} <span className="text-gray-400 text-xs">x{booking.room_count || 1}</span></p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs uppercase tracking-wider mb-1">Guests</p>
                    <p className="font-medium flex items-center gap-1"><User className="w-3 h-3" /> {booking.guests}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs uppercase tracking-wider mb-1">Check In</p>
                    <p className="font-medium">{new Date(booking.check_in).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs uppercase tracking-wider mb-1">Check Out</p>
                    <p className="font-medium">{new Date(booking.check_out).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>

              {/* Middle col: Financials */}
              <div className="p-6 md:w-64 bg-[#141414] border-b md:border-b-0 md:border-r border-[#2a2d32] flex flex-col justify-center">
                <p className="text-gray-500 text-xs uppercase tracking-wider mb-3">Financials</p>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Total:</span>
                    <span className="font-bold text-white">₹{booking.total_price}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Advance:</span>
                    <span className="font-medium text-[#d4af37]">₹{booking.advance_paid}</span>
                  </div>
                  <div className="flex justify-between border-t border-[#2a2d32] pt-2 mt-2">
                    <span className="text-gray-400">Due:</span>
                    <span className="font-bold">₹{booking.remaining_amount}</span>
                  </div>
                </div>
                <div className="mt-4 text-xs">
                  <span className="text-gray-500">Payment: </span>
                  <span className={`font-bold ${getPaymentStatusColor(booking.payment_status)}`}>{booking.payment_status}</span>
                </div>
                {booking.razorpay_payment_id && (
                  <div className="mt-1 text-[10px] text-gray-500 flex items-center gap-1">
                    ID: {booking.razorpay_payment_id}
                  </div>
                )}
              </div>

              {/* Right col: Actions */}
              <div className="p-6 md:w-56 bg-[#1a1b1e] flex flex-col justify-center gap-2">
                <p className="text-gray-500 text-xs uppercase tracking-wider mb-1">Actions</p>
                
                {booking.status === 'Pending Confirmation' && (
                  <button onClick={() => handleUpdateStatus(booking.id, 'Confirmed')} className="w-full bg-[#d4af37] text-black hover:bg-[#f3e5ab] py-2 rounded text-sm font-bold transition">
                    Confirm Booking
                  </button>
                )}
                
                {booking.status === 'Confirmed' && (
                  <button onClick={() => handleUpdateStatus(booking.id, 'Checked In')} className="w-full bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 py-2 rounded text-sm font-bold transition border border-blue-500/30">
                    Mark Checked In
                  </button>
                )}

                {booking.status === 'Checked In' && (
                  <button onClick={() => handleUpdateStatus(booking.id, 'Completed')} className="w-full bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 py-2 rounded text-sm font-bold transition border border-purple-500/30">
                    Mark Completed
                  </button>
                )}
                
                {booking.status !== 'Cancelled' && booking.status !== 'Completed' && (
                  <button 
                    onClick={() => {
                      if (window.confirm('Are you sure you want to cancel this booking?')) {
                        handleUpdateStatus(booking.id, 'Cancelled')
                      }
                    }} 
                    className="w-full bg-red-500/10 text-red-500 hover:bg-red-500/20 py-2 rounded text-sm font-bold transition border border-red-500/20 mt-auto"
                  >
                    Cancel Booking
                  </button>
                )}

                {booking.status === 'Cancelled' && (
                  <div className="text-center text-sm text-gray-500 mt-2 flex flex-col items-center">
                    <XCircle className="w-5 h-5 text-red-500/50 mb-1" />
                    Cancelled
                  </div>
                )}
                {booking.status === 'Completed' && (
                  <div className="text-center text-sm text-gray-500 mt-2 flex flex-col items-center">
                    <CheckCircle className="w-5 h-5 text-purple-500/50 mb-1" />
                    Session Ended
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
