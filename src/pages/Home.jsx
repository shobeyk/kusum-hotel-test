import React, { useState, useEffect } from 'react';
import { Menu, X, MapPin, Phone, MessageCircle, Star, Wifi, AirVent, BellRing, Utensils, Clock, Car, BatteryCharging, Briefcase, Trees, Cross, Shield, Check } from 'lucide-react';

const COLORS = {
  bg: '#0f1011',
  surface: '#1a1b1e',
  border: '#2a2d32',
  gold: '#d4af37',
  goldLight: '#f3e5ab',
  text: '#f5f5f5',
  muted: '#9ca3af'
};

export default function App() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [rooms, setRooms] = useState([]);
  const [pageImages, setPageImages] = useState({});
  const [galleryImages, setGalleryImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [heroImageSrc, setHeroImageSrc] = useState(null);
  const [heroImageLoaded, setHeroImageLoaded] = useState(false);

  // Default fallbacks in case database is empty or fetching fails
  const fallbackImages = {
    hero: "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=1600",
    lobby: "https://images.unsplash.com/photo-1562790351-d273a961e0e9?w=600",
    restaurant: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1400"
  };

  const fallbackGallery = [
    "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=600",
    "https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=600",
    "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=600",
    "https://images.unsplash.com/photo-1582719508461-905c673771fd?w=600",
    "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600",
    "https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=600"
  ];

  const fallbackRooms = [
    {
      name: 'Standard AC Room',
      price: 600,
      description: 'Comfortable and affordable room perfect for solo travelers or short stays.',
      image_url: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=600',
      features: ['AC', 'WiFi', 'TV', 'Attached Bath', 'Room Service']
    },
    {
      name: 'Deluxe AC Room',
      price: 900,
      description: 'Spacious room with elegant decor, offering extra comfort for couples and small families.',
      image_url: 'https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=600',
      popular: true,
      features: ['AC', 'WiFi', 'TV', 'Attached Bath', 'Work Desk', 'Room Service']
    },
    {
      name: 'Premium AC Room',
      price: 1200,
      description: 'Our finest accommodation featuring a private terrace and dedicated butler service.',
      image_url: 'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=600',
      features: ['AC', 'WiFi', 'Terrace', 'Butler', 'Work Desk']
    }
  ];

  useEffect(() => {
    // Inject Google Fonts
    const linkObj = document.createElement('link');
    linkObj.href = 'https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&family=Inter:wght@300;400;500;600&display=swap';
    linkObj.rel = 'stylesheet';
    document.head.appendChild(linkObj);

    // Provide smooth scrolling to HTML element via JS style since we want to avoid extra CSS files (per instructions, though index.css exists)
    document.documentElement.style.scrollBehavior = 'smooth';
    document.body.style.backgroundColor = COLORS.bg;
    document.body.style.color = COLORS.text;
    document.body.style.fontFamily = "'Inter', sans-serif";

    // Load Razorpay script
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);

    // Fetch dynamic content from Supabase
    fetchSupabaseData();

    return () => {
      document.head.removeChild(linkObj);
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);

  const fetchSupabaseData = async () => {
    try {
      // Dynamic import to avoid missing supabase dependency error if running without it, though it is used in the app
      const { supabase } = await import('../lib/supabase');
      
      // Fetch rooms
      const { data: roomsData, error: roomsError } = await supabase.from('rooms').select('*').order('price', { ascending: true });
      if (!roomsError && roomsData?.length > 0) {
        setRooms(roomsData);
      }
      
      // Fetch images
      const { data: imagesData, error: imagesError } = await supabase.from('page_images').select('*');
      let cmsHero = null;
      if (!imagesError && imagesData?.length > 0) {
        const coreImages = {};
        const gImages = [];
        imagesData.forEach(img => {
          if (img.id.startsWith('gallery_')) {
            gImages.push(img.url);
          } else {
            coreImages[img.id] = img.url;
          }
        });
        setPageImages(coreImages);
        if (gImages.length > 0) setGalleryImages(gImages);
        cmsHero = coreImages.hero;
      }
      setHeroImageSrc(cmsHero || fallbackImages.hero);
    } catch (e) {
      console.error("Error fetching data:", e);
      setHeroImageSrc(fallbackImages.hero);
    } finally {
      setLoading(false);
    }
  };

  const currentRooms = rooms.length > 0 ? rooms : fallbackRooms;
  const currentRestaurantImage = pageImages.restaurant || fallbackImages.restaurant;
  const currentGallery = galleryImages.length > 0 ? galleryImages : fallbackGallery;

  const handleBooking = (roomName, amount) => {
    if (!window.Razorpay) {
      alert("Razorpay SDK failed to load. Are you online?");
      return;
    }

    const options = {
      key: "YOUR_RAZORPAY_KEY_ID", // Using placeholder as requested
      amount: amount * 100, // Amount is in currency subunits. Default currency is INR. Hence, 50000 refers to 50000 paise
      currency: "INR",
      name: "Hotel Kusum",
      description: `Advance Booking for ${roomName}`,
      image: "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=100&q=80",
      handler: function (response) {
        setToastMessage("Booking confirmed! We'll reach you shortly.");
        setTimeout(() => setToastMessage(''), 5000);
      },
      prefill: {
        name: "",
        email: "",
        contact: ""
      },
      theme: {
        color: COLORS.gold
      }
    };
    
    try {
      const rzp1 = new window.Razorpay(options);
      rzp1.open();
    } catch(err) {
      console.error(err);
    }
  };

  const cormorantFont = { fontFamily: "'Playfair Display', serif" };

  return (
    <div className="min-h-screen relative selection:bg-[#d4af37] selection:text-black">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-24 right-4 z-50 bg-[#1a1b1e] border border-[#d4af37] text-white px-6 py-4 rounded shadow-2xl flex items-center gap-3 animate-in slide-in-from-top-2 fade-in">
          <Check className="text-[#d4af37]" size={20} />
          <p className="font-medium">{toastMessage}</p>
        </div>
      )}

      {/* 1. NAVBAR */}
      <nav className="fixed w-full z-40 top-0 border-b border-[#2a2d32] backdrop-blur-md bg-[#0f1011]/90 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex-shrink-0">
              <a href="#" style={cormorantFont} className="text-2xl sm:text-3xl font-bold tracking-wider text-[#d4af37]">
                Hotel Kusum
              </a>
            </div>
            
            {/* Desktop Menu */}
            <div className="hidden md:flex items-center gap-8">
              <a href="#rooms" className="text-xs uppercase tracking-widest font-semibold text-gray-400 hover:text-[#d4af37] transition-colors">Rooms</a>
              <a href="#amenities" className="text-xs uppercase tracking-widest font-semibold text-gray-400 hover:text-[#d4af37] transition-colors">Amenities</a>
              <a href="#gallery" className="text-xs uppercase tracking-widest font-semibold text-gray-400 hover:text-[#d4af37] transition-colors">Gallery</a>
              <a href="#contact" className="text-xs uppercase tracking-widest font-semibold text-gray-400 hover:text-[#d4af37] transition-colors">Contact</a>
              <a 
                href="#rooms" 
                className="bg-gradient-to-r from-[#d4af37] to-[#f3e5ab] hover:opacity-90 text-black px-6 py-2 rounded-full text-xs font-bold uppercase tracking-tighter shadow-lg shadow-[#d4af37]/20 transition-all transform hover:scale-105"
              >
                Book Now
              </a>
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden flex items-center">
              <button 
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="text-gray-300 hover:text-white p-2"
              >
                {isMenuOpen ? <X size={28} /> : <Menu size={28} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden bg-[#1a1b1e] border-b border-[#2a2d32] absolute w-full left-0 top-20 shadow-xl">
            <div className="px-4 py-6 flex flex-col space-y-4">
              <a href="#rooms" onClick={() => setIsMenuOpen(false)} className="text-gray-300 hover:text-[#d4af37] text-lg font-medium">Rooms</a>
              <a href="#amenities" onClick={() => setIsMenuOpen(false)} className="text-gray-300 hover:text-[#d4af37] text-lg font-medium">Amenities</a>
              <a href="#gallery" onClick={() => setIsMenuOpen(false)} className="text-gray-300 hover:text-[#d4af37] text-lg font-medium">Gallery</a>
              <a href="#contact" onClick={() => setIsMenuOpen(false)} className="text-gray-300 hover:text-[#d4af37] text-lg font-medium">Contact</a>
              <a 
                href="#rooms" 
                onClick={() => setIsMenuOpen(false)}
                className="bg-gradient-to-r from-[#d4af37] to-[#f3e5ab] text-black px-6 py-3 rounded text-center font-bold mt-4"
              >
                Book Now
              </a>
            </div>
          </div>
        )}
      </nav>

      {/* 2. HERO */}
      <section id="home" className="relative h-screen flex items-center justify-center overflow-hidden bg-[#0f1011]">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-black/60 sm:bg-black/50 z-10 transition-opacity duration-1000"></div>
          {heroImageSrc && (
            <img 
              src={heroImageSrc} 
              alt="Hotel Kusum Interior" 
              className={`w-full h-full object-cover grayscale-[20%] contrast-110 transition-opacity duration-1000 ${heroImageLoaded ? 'opacity-100' : 'opacity-0'}`}
              onLoad={() => setHeroImageLoaded(true)}
              onError={() => {
                if (heroImageSrc !== fallbackImages.hero) {
                  setHeroImageSrc(fallbackImages.hero);
                }
              }}
            />
          )}
        </div>
        
        <div className="relative z-20 text-center px-4 max-w-4xl mx-auto flex flex-col items-center justify-center gap-3 animate-in fade-in slide-in-from-bottom-8 duration-1000 mt-16">
          <div className="w-24 h-px bg-gradient-to-r from-[#d4af37] to-[#f3e5ab] opacity-60 mb-4"></div>
          
          <h1 style={cormorantFont} className="text-5xl sm:text-7xl md:text-8xl font-semibold text-[#d4af37] leading-none">
            Hotel Kusum
          </h1>
          
          <p className="mt-3 text-lg text-gray-300 font-light tracking-wide">
            Your Home Away From Home in Chhindwara
          </p>
          
          <div className="w-24 h-px bg-gradient-to-r from-[#d4af37] to-[#f3e5ab] opacity-60 mt-4"></div>
          
          <div className="mt-6 inline-flex items-center px-3 py-1 bg-[#1a1b1e] border border-[#2a2d32] rounded-full text-xs uppercase tracking-widest text-[#9ca3af]">
            <span className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-[#d4af37]"></span>4.1 RATING · 200+ REVIEWS</span>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 mt-8 w-full sm:w-auto">
            <a 
              href="#rooms" 
              className="bg-gradient-to-r from-[#d4af37] to-[#f3e5ab] text-black px-8 py-3 rounded-md font-bold text-sm tracking-wide transition-transform hover:scale-105 flex items-center justify-center shadow-lg shadow-[#d4af37]/20 uppercase"
            >
              Book Your Stay
            </a>
            <a 
              href="#rooms" 
              className="border border-white/20 text-white hover:bg-white/5 px-8 py-3 rounded-md font-bold text-sm tracking-wide transition-all flex items-center justify-center uppercase"
            >
              Explore Rooms
            </a>
          </div>
        </div>
      </section>

      {/* 3. STATS STRIP */}
      <section className="bg-[#1a1b1e] border-y border-[#2a2d32] relative z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 text-center divide-y sm:divide-y-0 sm:divide-x divide-[#2a2d32]">
            <div className="px-4 py-2">
              <p style={cormorantFont} className="text-xl sm:text-3xl text-[#d4af37] mb-1">450m</p>
              <p className="text-gray-500 text-[10px] sm:text-xs uppercase tracking-widest font-bold">From Railway Station</p>
            </div>
            <div className="px-4 py-6 sm:py-2">
              <p style={cormorantFont} className="text-xl sm:text-3xl text-[#d4af37] mb-1">4.1★</p>
              <p className="text-gray-500 text-[10px] sm:text-xs uppercase tracking-widest font-bold">Average Guest Rating</p>
            </div>
            <div className="px-4 pt-6 sm:pt-2">
              <p style={cormorantFont} className="text-xl sm:text-3xl text-[#d4af37] mb-1">3</p>
              <p className="text-gray-500 text-[10px] sm:text-xs uppercase tracking-widest font-bold">Room Categories</p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. ROOMS */}
      <section id="rooms" className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 style={cormorantFont} className="text-3xl sm:text-4xl font-semibold text-[#d4af37] mb-2">Our Rooms</h2>
          <p className="text-gray-400 uppercase tracking-widest text-xs font-semibold">Comfort at every budget</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {currentRooms.map((room, idx) => (
            <div key={room.id || idx} className={`bg-[rgba(26,27,30,0.6)] backdrop-blur-[12px] border ${room.popular ? 'border-[#d4af37]/40 shadow-2xl shadow-[#d4af37]/10 transform md:-translate-y-4' : 'border-[#2a2d32] hover:border-[#d4af37]/50'} rounded-xl overflow-hidden relative group flex flex-col h-full transition-colors`}>
              {room.popular && (
                <div className="absolute top-0 w-full bg-[#d4af37] text-black text-xs font-bold text-center py-1 z-10 tracking-wider">
                  MOST POPULAR
                </div>
              )}
              <div className={`relative h-64 overflow-hidden ${room.popular ? 'mt-6' : ''}`}>
                <img 
                  src={room.image_url} 
                  alt={room.name} 
                  className="w-full h-full object-cover grayscale-[20%] contrast-110 transform group-hover:scale-105 transition-transform duration-700"
                />
                <div className={`absolute top-4 right-4 bg-black/80 backdrop-blur-sm px-4 py-2 rounded text-lg font-bold border ${room.popular ? 'text-[#d4af37] border-[#d4af37]' : 'text-white border-[#2a2d32]'}`}>
                  ₹{room.price}<span className={`text-sm font-normal ${room.popular ? 'text-gray-300' : 'text-gray-400'}`}>/night</span>
                </div>
              </div>
              <div className="p-8 flex flex-col flex-grow text-center">
                <h3 style={cormorantFont} className="text-2xl font-bold text-white mb-4">{room.name}</h3>
                <p className="text-gray-400 text-sm mb-6 flex-grow">
                  {room.description}
                </p>
                <div className="flex flex-wrap justify-center gap-3 mb-8 text-xs text-gray-300 font-medium">
                  {room.features ? room.features.map((feature, fIdx) => (
                    <span key={fIdx} className={`px-3 py-1 rounded ${feature === 'Terrace' || feature === 'Butler' ? 'border border-[#d4af37]/30 text-[#d4af37]' : 'bg-[#2a2d32]'}`}>
                      {feature}
                    </span>
                  )) : (
                    <>
                      <span className="bg-[#2a2d32] px-3 py-1 rounded">AC</span>
                      <span className="bg-[#2a2d32] px-3 py-1 rounded">WiFi</span>
                      <span className="bg-[#2a2d32] px-3 py-1 rounded">TV</span>
                      <span className="bg-[#2a2d32] px-3 py-1 rounded">Attached Bath</span>
                    </>
                  )}
                </div>
                <button 
                  onClick={() => handleBooking(room.name, room.price)}
                  className={`w-full py-4 rounded font-bold transition-all mt-auto ${room.popular ? 'bg-gradient-to-r from-[#d4af37] to-[#f3e5ab] text-black hover:opacity-90 shadow-lg' : 'bg-transparent border border-[#d4af37] text-[#d4af37] hover:bg-[#d4af37] hover:text-black'}`}
                >
                  Book {room.name.replace(' AC Room', '')}
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 5. AMENITIES */}
      <section id="amenities" className="py-24 bg-[#141414] border-t border-[#2a2d32]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 style={cormorantFont} className="text-3xl sm:text-4xl font-semibold text-[#d4af37] mb-2">Amenities</h2>
            <p className="text-gray-400 uppercase tracking-widest text-xs font-semibold">Everything you need for a comfortable stay</p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {[
              { icon: <MapPin />, text: '5 Min from Railway Station' },
              { icon: <Wifi />, text: 'Free WiFi' },
              { icon: <AirVent />, text: 'Air Conditioning' },
              { icon: <BellRing />, text: 'Butler Service' },
              { icon: <Utensils />, text: 'Restaurant On-site' },
              { icon: <Clock />, text: '24hr Room Service' },
              { icon: <Car />, text: 'Parking Available' },
              { icon: <BatteryCharging />, text: 'Power Backup' },
              { icon: <Briefcase />, text: 'Work Desk' },
              { icon: <Trees />, text: 'Terrace Access' },
              { icon: <Cross />, text: 'Medical Aid' },
              { icon: <Shield />, text: 'CCTV Security' }
            ].map((item, idx) => (
              <div key={idx} className="bg-[rgba(26,27,30,0.6)] backdrop-blur-[12px] border border-[#2a2d32] border-t-2 border-t-[#d4af37] p-6 hover:bg-[rgba(36,36,36,0.8)] transition-colors rounded-xl group">
                <div className="text-[#d4af37] mb-4 transform group-hover:scale-110 transition-transform w-8 h-8">
                  {item.icon}
                </div>
                <h4 className="text-[#f5f5f5] font-medium text-sm sm:text-base">{item.text}</h4>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 6. RESTAURANT */}
      <section className="relative py-32 flex items-center justify-center border-y border-[#d4af37]/20">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-black/80 z-10"></div>
          <img 
            src={currentRestaurantImage} 
            alt="Restaurant" 
            className="w-full h-full object-cover grayscale-[20%] contrast-110"
          />
        </div>
        
        <div className="relative z-20 text-center px-4 max-w-3xl mx-auto">
          <Utensils className="text-[#d4af37] mx-auto mb-6 w-12 h-12" />
          <h2 style={cormorantFont} className="text-4xl sm:text-5xl font-semibold text-[#d4af37] mb-6">In-House Restaurant</h2>
          <div className="h-px w-24 bg-[#d4af37] mx-auto mb-8"></div>
          <p className="text-lg sm:text-xl text-gray-300 font-light leading-relaxed mb-8">
            Enjoy freshly prepared Indian meals right at the hotel. Our kitchen serves breakfast, lunch, and dinner — so you never have to go far for a good meal at affordable prices.
          </p>
          <div className="inline-block border border-[#d4af37]/50 text-[#d4af37] bg-black/50 px-6 py-3 rounded-full text-sm font-medium tracking-wide">
            🍽️ 24-hour room service available
          </div>
        </div>
      </section>

      {/* 7. GALLERY */}
      <section id="gallery" className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 style={cormorantFont} className="text-3xl sm:text-4xl font-semibold text-[#d4af37] mb-2">A Look Inside</h2>
          <p className="text-gray-400 uppercase tracking-widest text-xs font-semibold">Explore Hotel Kusum</p>
        </div>

        <div className="columns-2 lg:columns-3 gap-4 space-y-4">
          {currentGallery.map((src, idx) => (
            <div key={idx} className="relative overflow-hidden rounded group mb-4">
              <img 
                src={src} 
                alt={`Gallery image ${idx + 1}`} 
                className="w-full h-auto object-cover transform group-hover:scale-110 transition-transform duration-700"
                loading="lazy"
              />
              <div className="absolute inset-0 border-2 border-transparent group-hover:border-[#d4af37]/80 transition-colors duration-300 pointer-events-none rounded z-10"></div>
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300"></div>
            </div>
          ))}
        </div>
      </section>

      {/* 8. REVIEWS */}
      <section className="py-24 bg-[#141414] border-t border-[#2a2d32]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 style={cormorantFont} className="text-3xl sm:text-4xl font-semibold text-[#d4af37] mb-2">What Our Guests Say</h2>
            <p className="text-gray-400 uppercase tracking-widest text-xs font-semibold">4.1★ rated · 200+ verified reviews on Goibibo</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Review 1 */}
            <div className="bg-[rgba(26,27,30,0.6)] backdrop-blur-[12px] border border-[#2a2d32] border-l-4 border-l-[#d4af37] p-8 rounded-xl relative">
              <div className="flex text-[#d4af37] mb-4">
                {[1,2,3,4,5].map(i => <Star key={i} size={16} className="fill-current" />)}
              </div>
              <p className="text-gray-300 italic mb-6">"Great location, just 5 minutes from the railway station. Rooms are clean and staff is very helpful. Best value for money in Chhindwara."</p>
              <h4 className="text-white font-medium">- Ramesh T.</h4>
            </div>
            
            {/* Review 2 */}
            <div className="bg-[rgba(26,27,30,0.6)] backdrop-blur-[12px] border border-[#2a2d32] border-l-4 border-l-[#d4af37] p-8 rounded-xl relative">
              <div className="flex text-[#d4af37] mb-4">
                {[1,2,3,4].map(i => <Star key={i} size={16} className="fill-current" />)}
                <Star size={16} className="text-gray-600" />
              </div>
              <p className="text-gray-300 italic mb-6">"Comfortable stay, good food in the restaurant. The butler service was a nice touch at this price. Would definitely stay again."</p>
              <h4 className="text-white font-medium">- Sneha M.</h4>
            </div>
            
            {/* Review 3 */}
            <div className="bg-[rgba(26,27,30,0.6)] backdrop-blur-[12px] border border-[#2a2d32] border-l-4 border-l-[#d4af37] p-8 rounded-xl relative">
              <div className="flex text-[#d4af37] mb-4">
                {[1,2,3,4].map(i => <Star key={i} size={16} className="fill-current" />)}
                <Star size={16} className="text-gray-600" />
              </div>
              <p className="text-gray-300 italic mb-6">"Centrally located hotel. Check-in was smooth and quick. AC rooms are spacious. Good for both business and leisure travellers."</p>
              <h4 className="text-white font-medium">- Vikram S.</h4>
            </div>
          </div>
        </div>
      </section>

      {/* 9. LOCATION & 10. ENQUIRY (Combined in contact section) */}
      <section id="contact" className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-t border-[#2a2d32]">
        <div className="text-center mb-16">
          <h2 style={cormorantFont} className="text-3xl sm:text-4xl font-semibold text-[#d4af37] mb-2">Contact & Location</h2>
          <p className="text-gray-400 uppercase tracking-widest text-xs font-semibold">We're here to help</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Location Column */}
          <div className="flex flex-col gap-8">
            <div className="bg-[rgba(26,27,30,0.6)] backdrop-blur-[12px] p-8 border border-[#2a2d32] rounded-xl">
              <h3 style={cormorantFont} className="text-2xl font-semibold text-[#d4af37] mb-6 border-b border-[#2a2d32] pb-4">Hotel Details</h3>
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <MapPin className="text-[#d4af37] flex-shrink-0 mt-1" size={24} />
                  <div>
                    <h4 className="text-white font-medium mb-1">Address</h4>
                    <p className="text-gray-400 text-sm">4 Phatak, Beside Santoshi Mata Mandir,<br/>Gandhi Ganj, Chhindwara - 480001, M.P.</p>
                    <p className="text-[#f3e5ab] text-xs mt-2">🚂 5 min walk from Railway Station</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <Clock className="text-[#d4af37] flex-shrink-0" size={24} />
                  <div>
                    <p className="text-gray-400 text-sm">Check-in: <span className="text-white font-medium">10:00 AM</span></p>
                    <p className="text-gray-400 text-sm">Check-out: <span className="text-white font-medium">10:00 AM</span></p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <Phone className="text-[#d4af37] flex-shrink-0" size={24} />
                  <div>
                    <h4 className="text-white font-medium mb-1">Phone</h4>
                    <a href="tel:+917162298034" className="text-gray-400 text-sm hover:text-[#d4af37] transition-colors">07162 298034</a>
                  </div>
                </div>
              </div>
              
              <div className="mt-8 flex flex-col sm:flex-row gap-4">
                <a href="tel:+917162298034" className="flex-1 bg-transparent border border-[#d4af37] text-[#d4af37] py-3 rounded text-center font-bold hover:bg-[#d4af37] hover:text-black transition-all flex items-center justify-center gap-2">
                  <Phone size={18} /> Call Now
                </a>
                <a href="https://wa.me/916265216945" target="_blank" rel="noreferrer" className="flex-1 bg-gradient-to-r from-[#d4af37] to-[#f3e5ab] text-black py-3 rounded text-center font-bold hover:opacity-90 transition-all flex items-center justify-center gap-2">
                  <MessageCircle size={18} /> WhatsApp Us
                </a>
              </div>
            </div>

            <div className="rounded-xl overflow-hidden border border-[#2a2d32] group relative h-[350px] shadow-xl">
              <div className="absolute inset-0 pointer-events-none border-2 border-[#d4af37]/20 rounded-xl z-10 transition-colors group-hover:border-[#d4af37]/60"></div>
              <iframe 
                src="https://maps.google.com/maps?q=Hotel+Kusum+Gandhi+Ganj+Chhindwara&output=embed" 
                width="100%" 
                height="100%" 
                style={{ border: 0 }} 
                allowFullScreen="" 
                loading="lazy" 
                referrerPolicy="no-referrer-when-downgrade"
                className="filter invert grayscale contrast-125"
                title="Hotel Kusum Location"
              ></iframe>
            </div>
          </div>

          {/* Form Column */}
          <div className="bg-[rgba(26,27,30,0.6)] backdrop-blur-[12px] p-8 border border-[#2a2d32] rounded-xl shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 w-full left-0 h-1 bg-gradient-to-r from-[#d4af37] to-[#f3e5ab]"></div>
            <h3 style={cormorantFont} className="text-3xl font-semibold text-[#d4af37] mb-2">Booking Enquiry</h3>
            <p className="text-gray-400 text-sm mb-8">Fill the form and we'll confirm your room on WhatsApp.</p>
            
            <form onSubmit={(e) => {
              e.preventDefault();
              const fd = new FormData(e.target);
              const data = Object.fromEntries(fd);
              const text = `*Booking Enquiry*\nName: ${data.name}\nPhone: ${data.phone}\nCheck-in: ${data.checkin}\nCheck-out: ${data.checkout}\nRoom: ${data.room}\nRequests: ${data.message}`;
              window.open(`https://wa.me/916265216945?text=${encodeURIComponent(text)}`, '_blank');
              e.target.reset();
            }} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Full Name</label>
                <input required name="name" type="text" className="w-full bg-[#111] border border-[#333] rounded px-4 py-3 text-white focus:outline-none focus:border-[#d4af37] transition-colors" placeholder="John Doe" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Phone Number</label>
                <input required name="phone" type="tel" className="w-full bg-[#111] border border-[#333] rounded px-4 py-3 text-white focus:outline-none focus:border-[#d4af37] transition-colors" placeholder="+91 98765 43210" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Check-in Date</label>
                  <input required name="checkin" type="date" className="w-full bg-[#111] border border-[#333] rounded px-4 py-3 text-white focus:outline-none focus:border-[#d4af37] transition-colors [color-scheme:dark]" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Check-out Date</label>
                  <input required name="checkout" type="date" className="w-full bg-[#111] border border-[#333] rounded px-4 py-3 text-white focus:outline-none focus:border-[#d4af37] transition-colors [color-scheme:dark]" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Room Type</label>
                <select required name="room" className="w-full bg-[#111] border border-[#333] rounded px-4 py-3 text-white focus:outline-none focus:border-[#d4af37] transition-colors appearance-none" style={{ backgroundImage: 'url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23d4af37%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right .7rem top 50%', backgroundSize: '.65rem auto' }}>
                  <option value="Standard AC Room">Standard AC Room</option>
                  <option value="Deluxe AC Room">Deluxe AC Room</option>
                  <option value="Premium AC Room">Premium AC Room</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Special Requests</label>
                <textarea name="message" rows={3} className="w-full bg-[#111] border border-[#333] rounded px-4 py-3 text-white focus:outline-none focus:border-[#d4af37] transition-colors resize-none" placeholder="Any specific requirements..."></textarea>
              </div>
              <button type="submit" className="w-full bg-gradient-to-r from-[#d4af37] to-[#f3e5ab] hover:opacity-90 text-black py-4 rounded font-bold transition-all text-lg flex justify-center items-center gap-2">
                Send Enquiry <MessageCircle size={20} />
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* 11. FOOTER */}
      <footer className="bg-[rgba(26,27,30,0.6)] backdrop-blur-[12px] border-t border-[#2a2d32] pt-16 pb-8 text-center text-gray-500 uppercase tracking-widest text-[10px]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 style={cormorantFont} className="text-3xl font-semibold text-[#d4af37] tracking-normal mb-4 normal-case">Hotel Kusum</h2>
          <p className="text-sm mb-8 max-w-md mx-auto">
            4 Phatak, Beside Santoshi Mata Mandir, Gandhi Ganj, Chhindwara - 480001, Madhya Pradesh
          </p>
          
          <div className="flex flex-wrap justify-center gap-6 mb-12 border-y border-[#1a1b1e] py-6">
            <a href="#rooms" className="hover:text-[#d4af37] transition-colors text-sm uppercase tracking-wider font-medium">Rooms</a>
            <a href="#amenities" className="hover:text-[#d4af37] transition-colors text-sm uppercase tracking-wider font-medium">Amenities</a>
            <a href="#gallery" className="hover:text-[#d4af37] transition-colors text-sm uppercase tracking-wider font-medium">Gallery</a>
            <a href="#contact" className="hover:text-[#d4af37] transition-colors text-sm uppercase tracking-wider font-medium">Contact</a>
          </div>
          
          <div className="text-xs space-y-2">
            <p>&copy; {new Date().getFullYear()} Hotel Kusum, Chhindwara. All rights reserved.</p>
            <p className="text-gray-500">Website by Shaban Khan</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
