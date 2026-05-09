--
-- Supabase Setup Schema for Hotel Admin
-- Execute this SQL to create the necessary tables and policies
--

-- Table for hotel rooms
CREATE TABLE rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC NOT NULL,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Table for homepage layout images
CREATE TABLE page_images (
  id TEXT PRIMARY KEY, -- 'hero', 'lobby', 'restaurant', etc.
  url TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Table for payment settings (stores Razorpay keys securely)
CREATE TABLE payment_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  razorpay_key_id TEXT,
  razorpay_key_secret TEXT, -- Kept secure
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Table for hotel bookings
CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guest_name TEXT NOT NULL,
  guest_phone TEXT NOT NULL,
  room_id UUID REFERENCES rooms(id) ON DELETE SET NULL,
  room_name TEXT NOT NULL,
  check_in DATE NOT NULL,
  check_out DATE NOT NULL,
  guests INTEGER NOT NULL,
  room_count INTEGER NOT NULL DEFAULT 1,
  total_price NUMERIC NOT NULL,
  advance_paid NUMERIC NOT NULL,
  remaining_amount NUMERIC NOT NULL,
  status TEXT NOT NULL DEFAULT 'Pending Confirmation',
  payment_status TEXT NOT NULL DEFAULT 'Payment Pending',
  razorpay_payment_id TEXT,
  razorpay_order_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add default images row
INSERT INTO page_images (id, url) VALUES
  ('hero', 'https://images.unsplash.com/photo-1542314831-c6a4d14d8828'),
  ('lobby', 'https://images.unsplash.com/photo-1562790351-d273a961e0e9'),
  ('restaurant', 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4');

-- Storage Bucket for public hotel images
INSERT INTO storage.buckets (id, name, public) VALUES ('hotel-images', 'hotel-images', true) ON CONFLICT DO NOTHING;

-- RLS Policies
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE page_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- Allow public to read rooms and page images
CREATE POLICY "Public can view rooms" ON rooms FOR SELECT USING (true);
CREATE POLICY "Public can view page images" ON page_images FOR SELECT USING (true);

-- Allow authenticated admins to full control of rooms & images
CREATE POLICY "Admins can manage rooms" ON rooms USING (auth.role() = 'authenticated');
CREATE POLICY "Admins can manage page images" ON page_images USING (auth.role() = 'authenticated');

-- Secure payment_settings: ONLY visible to authenticated users (or the Express backend which bypasses RLS using service_role key)
CREATE POLICY "Admins can manage payment settings" ON payment_settings USING (auth.role() = 'authenticated');

-- Allow authenticated admins to manage bookings
CREATE POLICY "Admins can manage bookings" ON bookings USING (auth.role() = 'authenticated');

-- Storage Policies
CREATE POLICY "Public can view hotel-images" ON storage.objects FOR SELECT USING (bucket_id = 'hotel-images');
CREATE POLICY "Admins can manage hotel-images" ON storage.objects FOR ALL USING (bucket_id = 'hotel-images' AND auth.role() = 'authenticated');
