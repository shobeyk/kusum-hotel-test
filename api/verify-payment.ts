import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

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
    const { razorpay_payment_id, razorpay_order_id, razorpay_signature, booking_id } = req.body;

    const { data: settings } = await supabaseAdmin.from('payment_settings').select('razorpay_key_secret').limit(1).maybeSingle();
    if (!settings || !settings.razorpay_key_secret) {
      throw new Error("Razorpay secret not found");
    }

    const generated_signature = crypto
      .createHmac("sha256", settings.razorpay_key_secret)
      .update(razorpay_order_id + "|" + razorpay_payment_id)
      .digest("hex");

    if (generated_signature !== razorpay_signature) {
      await supabaseAdmin.from("bookings").update({
        payment_status: "Failed Payment"
      }).eq("id", booking_id);

      return res.status(400).json({ success: false, error: "Invalid payment signature" });
    }

    const { error } = await supabaseAdmin.from("bookings").update({
      status: "Confirmed",
      payment_status: "Paid Advance",
      razorpay_payment_id: razorpay_payment_id
    }).eq("id", booking_id);

    if (error) {
      throw new Error("Failed to update booking status");
    }

    return res.status(200).json({ success: true });
  } catch (e: any) {
    console.error(e);
    return res.status(500).json({ success: false, error: e.message || "Failed to verify payment" });
  }
}
