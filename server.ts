import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import * as dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";
import Razorpay from "razorpay";
import crypto from "crypto";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Initialize Supabase Admin Client
  // It's critical to use the SERVICE_ROLE_KEY to bypass RLS for payment handling
  const supabaseUrl = process.env.VITE_SUPABASE_URL || "";
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  
  if (!supabaseUrl) {
    console.warn("WARNING: VITE_SUPABASE_URL is not set.");
  }
  if (!supabaseServiceKey) {
    console.warn("WARNING: SUPABASE_SERVICE_ROLE_KEY is not set.");
  }
  
  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  // Helper to get Razorpay instance
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

  // Get Razorpay Key publishable test/live for frontend
  app.get("/api/razorpay-key", async (req, res) => {
    try {
      const { data, error } = await supabaseAdmin.from('payment_settings').select('razorpay_key_id').limit(1).maybeSingle();
      if (error || !data || !data.razorpay_key_id) {
        return res.status(404).json({ error: "Razorpay key not found" });
      }
      res.json({ key_id: data.razorpay_key_id });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Create an order and a booking
  app.post("/api/create-order", async (req, res) => {
    try {
      const { guestName, guestPhone, roomId, roomName, checkIn, checkOut, guests, roomCount, amountToPay, totalAmount, remainingAmount } = req.body;
      
      const rzp = await getRazorpay();
      
      // Amount is in paisa (INR * 100)
      const amountPaisa = Math.round(amountToPay * 100);

      const options = {
        amount: amountPaisa,
        currency: "INR",
        receipt: `receipt_${Date.now()}`
      };

      const order = await rzp.orders.create(options);
      
      // Immediately save booking to database with status processing
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

      res.json({
        order_id: order.id,
        amount: order.amount,
        currency: order.currency,
        booking_id: booking.id
      });
    } catch (e: any) {
      console.error(e);
      res.status(500).json({ error: e.message || "Failed to create order" });
    }
  });

  // Verify payment
  app.post("/api/verify-payment", async (req, res) => {
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
        // Payment failed/tampered
        await supabaseAdmin.from("bookings").update({
          payment_status: "Failed Payment"
        }).eq("id", booking_id);

        return res.status(400).json({ error: "Invalid payment signature" });
      }

      // Valid signature -> Update booking
      const { error } = await supabaseAdmin.from("bookings").update({
        status: "Confirmed",
        payment_status: "Paid Advance",
        razorpay_payment_id: razorpay_payment_id
      }).eq("id", booking_id);

      if (error) {
        throw new Error("Failed to update booking status");
      }

      res.json({ success: true });
    } catch (e: any) {
      console.error(e);
      res.status(500).json({ error: e.message || "Failed to verify payment" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res, next) => {
      // Don't forward /api to index.html
      if (req.path.startsWith('/api')) return next();
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
