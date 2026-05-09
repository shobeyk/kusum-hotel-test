import { createClient } from '@supabase/supabase-js';
import Razorpay from 'razorpay';

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function getRazorpay() {
  const { data, error } = await supabaseAdmin.from('payment_settings').select('razorpay_key_id, razorpay_key_secret').limit(1).maybeSingle();
  if (error || !data || !data.razorpay_key_id || !data.razorpay_key_secret) {
    throw new Error("Razorpay keys not configured in database.");
  }
  return new Razorpay({
    key_id: data.razorpay_key_id,
    key_secret: data.razorpay_key_secret
  });
}

export default async function handler(req: any, res: any) {
  // CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method Not Allowed' });
  }

  try {
    const { guestName, guestPhone, roomId, roomName, checkIn, checkOut, guests, roomCount, amountToPay, totalAmount, remainingAmount } = req.body;
    
    // Verification of availability
    if (roomId) {
      const { data: room } = await supabaseAdmin.from("rooms").select("total_rooms").eq("id", roomId).single();
      if (room) {
        const totalRooms = room.total_rooms || 1;
        const { data: bookings } = await supabaseAdmin
          .from("bookings")
          .select("room_count")
          .eq("room_id", roomId)
          .neq("status", "Cancelled")
          .lt("check_in", checkOut)
          .gt("check_out", checkIn);
        
        if (bookings) {
          const bookedCount = bookings.reduce((sum: number, b: any) => sum + (b.room_count || 1), 0);
          if (totalRooms - bookedCount < (roomCount || 1)) {
            return res.status(400).json({ success: false, error: "Selected room is not available for these dates." });
          }
        }
      }
    }

    const rzp = await getRazorpay();
    const amountPaisa = Math.round(amountToPay * 100);

    const options = {
      amount: amountPaisa,
      currency: "INR",
      receipt: `receipt_${Date.now()}`
    };

    const order = await rzp.orders.create(options);
    
    const { data: booking, error } = await supabaseAdmin.from("bookings").insert({
      guest_name: guestName,
      guest_phone: guestPhone,
      room_id: roomId,
      room_name: roomName,
      check_in: checkIn,
      check_out: checkOut,
      guests: guests,
      room_count: roomCount || 1,
      total_price: totalAmount,
      advance_paid: amountToPay,
      remaining_amount: remainingAmount,
      status: "Pending Confirmation",
      payment_status: "Payment Pending",
      razorpay_order_id: order.id
    }).select().single();

    if (error) {
      throw new Error("Failed to save booking to database: " + error.message);
    }

    return res.status(200).json({
      success: true,
      order_id: order.id,
      amount: order.amount,
      currency: order.currency,
      booking_id: booking.id
    });
  } catch (e: any) {
    console.error(e);
    return res.status(500).json({ success: false, error: e.message || "Failed to create order" });
  }
}
