import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''; // Use service role for script

const supabase = createClient(supabaseUrl, supabaseKey);

const rooms = [
  {
    name: 'Standard AC Room',
    price: 600,
    description: 'Comfortable and affordable room perfect for solo travelers or short stays.',
    image_url: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=600'
  },
  {
    name: 'Deluxe AC Room',
    price: 900,
    description: 'Spacious room with elegant decor, offering extra comfort for couples and small families.',
    image_url: 'https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=600' // Changed to a different one
  },
  {
    name: 'Premium AC Room',
    price: 1200,
    description: 'Our finest accommodation featuring a private terrace and dedicated butler service.',
    image_url: 'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=600'
  }
];

const galleryImages = [
  "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=600",
  "https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=600",
  "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=600",
  "https://images.unsplash.com/photo-1582719508461-905c673771fd?w=600",
  "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600",
  "https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=600"
];

async function seed() {
  console.log('Seeding rooms...');
  for (const room of rooms) {
    const { error } = await supabase.from('rooms').insert(room);
    if (error) console.error('Error inserting room:', error);
    else console.log('Inserted', room.name);
  }

  console.log('Seeding gallery images...');
  for (let i = 0; i < galleryImages.length; i++) {
    const id = `gallery_${Date.now()}_${i}`;
    const { error } = await supabase.from('page_images').insert({
      id,
      url: galleryImages[i]
    });
    if (error) console.error('Error inserting gallery image:', error);
    else console.log('Inserted gallery image', i+1);
  }

  console.log('Done!');
}

seed();
