import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

export default async function handler(req: any, res: any) {
  // Add CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method Not Allowed' });
  }

  try {
    const { roomId, checkIn, checkOut, requestedCount } = req.body;
    
    if (!roomId || !checkIn || !checkOut || !requestedCount) {
      return res.status(400).json({ success: false, error: "Missing required fields" });
    }

    const { data: room, error: roomError } = await supabaseAdmin
      .from("rooms")
      .select("total_rooms")
      .eq("id", roomId)
      .single();
    
    if (roomError || !room) {
      return res.status(404).json({ success: false, error: "Room not found" });
    }

    const totalRooms = room.total_rooms || 1;

    const { data: bookings, error: bookingsError } = await supabaseAdmin
      .from("bookings")
      .select("room_count")
      .eq("room_id", roomId)
      .neq("status", "Cancelled")
      .lt("check_in", checkOut)
      .gt("check_out", checkIn);

    if (bookingsError) {
      throw new Error("Failed to fetch bookings: " + bookingsError.message);
    }

    const bookedCount = bookings.reduce((sum: number, b: any) => sum + (b.room_count || 1), 0);
    const availableCount = totalRooms - bookedCount;

    if (availableCount < requestedCount) {
      return res.status(200).json({ success: true, available: false, availableCount });
    } else {
      return res.status(200).json({ success: true, available: true, availableCount });
    }

  } catch (e: any) {
    console.error("Availability Check Error:", e);
    return res.status(500).json({ success: false, error: e.message || "Failed to check availability" });
  }
}
