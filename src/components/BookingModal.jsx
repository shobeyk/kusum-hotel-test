import React, { useState, useEffect } from 'react';
import { X, Calendar, User, Phone, CheckCircle2, ChevronRight, Users } from 'lucide-react';
import toast from 'react-hot-toast';

export default function BookingModal({ isOpen, onClose, room }) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    checkIn: '',
    checkOut: '',
    guests: 1,
    rooms: 1
  });
  const [calculation, setCalculation] = useState({
    nights: 0,
    total: 0,
    advance: 0,
    remaining: 0
  });

  const [bookingFailed, setBookingFailed] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setFormData({ name: '', phone: '', checkIn: '', checkOut: '', guests: 1, rooms: 1 });
      setBookingFailed(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (formData.checkIn && formData.checkOut) {
      const start = new Date(formData.checkIn);
      const end = new Date(formData.checkOut);
      const diffTime = end.getTime() - start.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays > 0) {
        // Parse string to float just in case it's a string from db
        const roomPrice = typeof room.price === 'string' ? parseFloat(room.price) : room.price;
        const total = diffDays * roomPrice * formData.rooms;
        const advance = Math.round(total * 0.20); // 20% advance
        const remaining = total - advance;
        setCalculation({ nights: diffDays, total, advance, remaining });
      } else {
        setCalculation({ nights: 0, total: 0, advance: 0, remaining: 0 });
      }
    } else {
      setCalculation({ nights: 0, total: 0, advance: 0, remaining: 0 });
    }
  }, [formData.checkIn, formData.checkOut, formData.rooms, room]);

  if (!isOpen || !room) return null;

  const handleNext = () => {
    if (!formData.name || !formData.phone || !formData.checkIn || !formData.checkOut) {
      toast.error("Please fill all required fields");
      return;
    }
    if (formData.guests < 1) {
      toast.error("At least 1 guest is required");
      return;
    }
    if (formData.rooms < 1) {
      toast.error("At least 1 room is required");
      return;
    }
    if (calculation.nights <= 0) {
      toast.error("Check-out date must be after check-in date");
      return;
    }
    setStep(2);
  };

  const loadRazorpay = () => {
    return new Promise((resolve) => {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handlePayment = async () => {
    setLoading(true);
    setBookingFailed(false);
    
    try {
      const resKey = await fetch("/api/razorpay-key");
      const keyData = await resKey.json();

      if (!resKey.ok || !keyData.key_id) {
        throw new Error("Payment gateway not configured. Please contact hotel.");
      }

      const resLoad = await loadRazorpay();
      if (!resLoad) {
        throw new Error("Razorpay SDK failed to load. Are you online?");
      }

      // Step 1: Create Order
      const response = await fetch("/api/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          guestName: formData.name,
          guestPhone: formData.phone,
          roomId: room.id || null,
          roomName: room.name,
          checkIn: formData.checkIn,
          checkOut: formData.checkOut,
          guests: formData.guests,
          roomCount: formData.rooms,
          amountToPay: calculation.advance,
          totalAmount: calculation.total,
          remainingAmount: calculation.remaining
        })
      });

      const orderData = await response.json();

      if (!response.ok) {
        throw new Error(orderData.error || "Failed to create order");
      }

      // Step 2: Open Razorpay
      const options = {
        key: keyData.key_id,
        amount: orderData.amount,
        currency: orderData.currency,
        name: "Hotel Kusum",
        description: `Advance for ${room.name} (${calculation.nights} nights)`,
        order_id: orderData.order_id,
        handler: async function (response) {
          toast.loading("Verifying payment...", { id: "payment-verify" });
          
          try {
            const verifyRes = await fetch("/api/verify-payment", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_signature: response.razorpay_signature,
                booking_id: orderData.booking_id
              })
            });

            const verifyData = await verifyRes.json();
            
            if (verifyRes.ok) {
              toast.success("Payment successful! Booking confirmed.", { id: "payment-verify" });
              setStep(3); // Go to success page
            } else {
              throw new Error(verifyData.error || "Payment verification failed");
            }
          } catch (e) {
            console.error(e);
            toast.error(e.message || "Payment verification failed", { id: "payment-verify" });
            setBookingFailed(true);
          }
        },
        prefill: {
          name: formData.name,
          contact: formData.phone
        },
        theme: {
          color: "#d4af37"
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", function (response) {
        toast.error("Payment failed: " + response.error.description);
        setBookingFailed(true);
      });
      rzp.open();
    } catch (e) {
      console.error(e);
      toast.error(e.message || "Something went wrong.");
      setBookingFailed(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-[#141414] border border-[#2a2d32] rounded-xl shadow-2xl w-full max-w-lg overflow-hidden relative text-white">
        
        {/* Header */}
        <div className="bg-[#1a1b1e] border-b border-[#2a2d32] p-4 flex items-center justify-between">
          <h2 className="text-xl font-bold font-playfair text-[#d4af37]">
            {step === 3 ? "Booking Confirmed" : "Book Room"}
          </h2>
          {step !== 3 && (
            <button onClick={onClose} className="text-gray-400 hover:text-white transition">
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Form Body */}
        <div className="p-6">
          {step === 1 && (
            <div className="space-y-4 animate-in slide-in-from-right text-sm">
              <div className="flex gap-4 mb-4 items-center">
                <div className="w-20 h-20 rounded-md overflow-hidden flex-shrink-0 border border-[#2a2d32]">
                  <img src={room.image_url} alt={room.name} className="w-full h-full object-cover" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white mb-1" style={{fontFamily: "'Playfair Display', serif"}}>{room.name}</h3>
                  <p className="text-[#d4af37] font-semibold text-sm">₹{room.price} <span className="text-gray-400 font-normal text-xs">/ night</span></p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1 bg-[#1a1b1e] p-3 rounded">
                  <label className="text-xs text-gray-400 flex items-center gap-1"><Calendar className="w-3 h-3"/> Check-In</label>
                  <input 
                    type="date" 
                    value={formData.checkIn}
                    min={new Date().toISOString().split("T")[0]}
                    onChange={e => setFormData({...formData, checkIn: e.target.value})}
                    className="w-full bg-transparent border-none outline-none text-white appearance-none" 
                  />
                </div>
                <div className="space-y-1 bg-[#1a1b1e] p-3 rounded">
                  <label className="text-xs text-gray-400 flex items-center gap-1"><Calendar className="w-3 h-3"/> Check-Out</label>
                  <input 
                    type="date"
                    min={formData.checkIn || new Date().toISOString().split("T")[0]}
                    value={formData.checkOut}
                    onChange={e => setFormData({...formData, checkOut: e.target.value})}
                    className="w-full bg-transparent border-none outline-none text-white appearance-none" 
                  />
                </div>
              </div>

              <div className="space-y-1 bg-[#1a1b1e] p-3 rounded">
                <label className="text-xs text-gray-400 flex items-center gap-1"><User className="w-3 h-3"/> Guest Name</label>
                <input 
                  type="text" 
                  placeholder="John Doe"
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  className="w-full bg-transparent border-none outline-none text-white" 
                />
              </div>

              <div className="space-y-1 bg-[#1a1b1e] p-3 rounded">
                <label className="text-xs text-gray-400 flex items-center gap-1"><Phone className="w-3 h-3"/> Phone Number</label>
                <input 
                  type="tel" 
                  placeholder="+91 9876543210"
                  value={formData.phone}
                  onChange={e => setFormData({...formData, phone: e.target.value})}
                  className="w-full bg-transparent border-none outline-none text-white" 
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1 bg-[#1a1b1e] p-3 rounded border border-[#2a2d32]">
                  <label className="text-xs text-gray-400 flex items-center gap-1"><Users className="w-3 h-3"/> Guests</label>
                  <input 
                    type="number" 
                    min="1"
                    value={formData.guests}
                    onChange={e => setFormData({...formData, guests: parseInt(e.target.value) || 1})}
                    className="w-full bg-transparent border-none outline-none text-white" 
                  />
                </div>
                
                <div className="space-y-1 bg-[#1a1b1e] p-3 rounded border border-[#2a2d32]">
                  <label className="text-xs text-gray-400 flex items-center gap-1"><Users className="w-3 h-3"/> Rooms</label>
                  <input 
                    type="number" 
                    min="1"
                    value={formData.rooms}
                    onChange={e => setFormData({...formData, rooms: parseInt(e.target.value) || 1})}
                    className="w-full bg-transparent border-none outline-none text-white" 
                  />
                </div>
              </div>

              <button 
                onClick={handleNext}
                className="w-full bg-[#d4af37] text-black hover:bg-[#f3e5ab] py-3.5 rounded font-bold transition flex items-center justify-center gap-2 mt-6 uppercase tracking-wider text-sm shadow-lg shadow-[#d4af37]/20"
              >
                Review Booking Details <ChevronRight className="w-4 h-4"/>
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6 animate-in slide-in-from-right">
              
              <div className="flex gap-4 mb-2 items-center">
                <div className="w-24 h-24 rounded-lg overflow-hidden flex-shrink-0 border border-[#2a2d32] shadow-md">
                  <img src={room.image_url} alt={room.name} className="w-full h-full object-cover" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white mb-1" style={{fontFamily: "'Playfair Display', serif"}}>{room.name}</h3>
                  <p className="text-sm text-gray-400 font-medium">₹{room.price} per night</p>
                </div>
              </div>

              <div className="bg-[#1a1b1e] p-5 rounded-xl border border-[#2a2d32] space-y-3 text-sm shadow-inner">
                <h3 className="font-bold text-white border-b border-[#2a2d32] pb-3 text-sm uppercase tracking-wider text-gray-400 font-sans">Booking Summary</h3>
                <div className="grid grid-cols-2 gap-y-3 gap-x-4 pt-2">
                  <div className="flex flex-col">
                    <span className="text-gray-500 text-xs">Dates</span>
                    <span className="font-medium text-white">{formData.checkIn} → {formData.checkOut}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-gray-500 text-xs">Duration</span>
                    <span className="font-medium text-white">{calculation.nights} Night{calculation.nights > 1 ? 's' : ''}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-gray-500 text-xs">Capacity</span>
                    <span className="font-medium text-white">{formData.guests} Guest{formData.guests > 1 ? 's' : ''}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-gray-500 text-xs">Rooms</span>
                    <span className="font-medium text-white">{formData.rooms} Room{formData.rooms > 1 ? 's' : ''}</span>
                  </div>
                </div>

                <div className="border-t border-[#2a2d32] pt-4 mt-2">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-400">₹{room.price} × {calculation.nights} nights × {formData.rooms} rooms</span>
                    <span className="font-medium">₹{calculation.total}</span>
                  </div>
                  <div className="flex justify-between text-base border-t border-dashed border-[#2a2d32] pt-2 mt-2">
                    <span className="text-white font-medium">Total Booking Amount</span>
                    <span className="font-bold text-white">₹{calculation.total}</span>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-[#d4af37]/10 to-transparent p-5 rounded-xl border border-[#d4af37]/30 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#d4af37]/5 rounded-full blur-2xl -mr-10 -mt-10"></div>
                <p className="text-xs text-[#d4af37] mb-4 uppercase tracking-wider font-bold">Payment Schedule</p>
                
                <div className="flex items-center justify-between mb-3 bg-[#141414] p-3 rounded border border-[#d4af37]/20">
                  <div>
                    <span className="block text-sm font-bold text-white">Advance to pay now</span>
                    <span className="block text-xs text-gray-400 mt-0.5">20% required to confirm</span>
                  </div>
                  <span className="text-xl font-bold text-[#d4af37]">₹{calculation.advance}</span>
                </div>
                
                <div className="flex justify-between items-center px-1">
                  <span className="text-sm text-gray-400 flex items-center gap-2">
                    Remaining amount at hotel 
                  </span>
                  <span className="text-sm font-semibold text-white">₹{calculation.remaining}</span>
                </div>
                
                <p className="text-[11px] text-gray-500 mt-4 leading-relaxed bg-black/40 p-2 rounded">
                  <span className="text-gray-300 font-medium">Note:</span> You are only paying 20% now to confirm your booking. The remaining amount will be paid at the hotel during check-in/check-out.
                </p>
              </div>

              {bookingFailed && (
                <div className="text-xs text-red-500 text-center bg-red-500/10 p-3 rounded border border-red-500/20">
                  Payment failed or cancelled. Please try again.
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button 
                  onClick={() => setStep(1)}
                  disabled={loading}
                  className="flex-1 border border-[#2a2d32] text-white hover:bg-[#1a1b1e] py-3.5 rounded font-medium transition text-sm"
                >
                  Back to Edit
                </button>
                <button 
                  onClick={handlePayment}
                  disabled={loading}
                  className="flex-[2] bg-[#d4af37] text-black hover:bg-[#f3e5ab] py-3.5 rounded font-bold transition flex items-center justify-center gap-2 shadow-lg shadow-[#d4af37]/20"
                >
                  {loading ? "Processing..." : `Pay ₹${calculation.advance} to Confirm`}
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="py-8 space-y-6 flex flex-col items-center animate-in zoom-in-95 text-center">
              <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mb-2">
                <CheckCircle2 className="w-10 h-10 text-green-500" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-white mb-2">Thank you!</h3>
                <p className="text-gray-400 text-sm">Your booking for <strong>{room.name}</strong> is confirmed.</p>
                <p className="text-gray-400 text-sm mt-1">We've received your advance payment of ₹{calculation.advance}.</p>
              </div>
              <button 
                onClick={onClose}
                className="bg-[#1a1b1e] text-white border border-[#2a2d32] hover:bg-[#2a2d32] px-8 py-3 rounded font-medium transition"
              >
                Close
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
