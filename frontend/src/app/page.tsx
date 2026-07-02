'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { API_BASE_URL } from '@/config';
import { 
  ShieldCheck, 
  MapPin, 
  Clock, 
  Sparkles, 
  Compass, 
  HelpCircle, 
  Star,
  ChevronRight,
  TrendingUp
} from 'lucide-react';

interface Car {
  id: string;
  name: string;
  brand: { name: string };
  model: string;
  year: number;
  fuelType: string;
  transmission: string;
  seating: number;
  dailyPrice: number;
  hourlyPrice: number;
  rating: number;
  images: { url: string }[];
  location: { name: string };
  mileage: number;
}

export default function LandingPage() {
  const router = useRouter();
  const [featuredCars, setFeaturedCars] = useState<Car[]>([]);
  const [locations, setLocations] = useState<{ id: string; name: string }[]>([]);
  
  // Search state
  const [pickupLoc, setPickupLoc] = useState('');
  const [pickupDate, setPickupDate] = useState('');
  const [returnDate, setReturnDate] = useState('');

  useEffect(() => {
    // Fetch locations
    fetch(`${API_BASE_URL}/api/cars/locations`)
      .then(res => res.json())
      .then(data => setLocations(data))
      .catch(err => console.error(err));

    // Fetch featured cars (just top 3)
    fetch(`${API_BASE_URL}/api/cars`)
      .then(res => res.json())
      .then(data => setFeaturedCars(data.slice(0, 3)))
      .catch(err => console.error(err));
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let query = `/cars?`;
    if (pickupLoc) query += `locationId=${pickupLoc}&`;
    if (pickupDate) query += `pickupDate=${pickupDate}&`;
    if (returnDate) query += `returnDate=${returnDate}&`;
    router.push(query);
  };

  const faqs = [
    {
      q: "What documents do I need to upload for driving verification?",
      a: "You need a valid Indian Driving License (front & back) and a selfie holding the license. We also support Aadhaar or other Govt-issued IDs for security checks. Verification is approved by our admins in 10 minutes."
    },
    {
      q: "When will I get my security deposit back?",
      a: "The security deposit (ranges from ₹3,000 to ₹7,000 depending on the vehicle class) is fully refundable. It will be credited back to your original source account (UPI or Card) immediately upon safe return of the vehicle."
    },
    {
      q: "Are the prices inclusive of fuel and GST?",
      a: "Our prices are exclusive of fuel (you get the car with a certain level, and return it at the same level). Prices are subject to 18% standard Indian GST, which is calculated live during checkout."
    },
    {
      q: "Can I extend my booking period mid-journey?",
      a: "Yes! You can request an extension directly from your Booking Ledger in the customer portal. Extension approval depends on whether another customer has booked that car after you."
    }
  ];

  return (
    <div className="space-y-24 pb-16">
      {/* 1. HERO SECTION */}
      <section className="relative w-full h-[550px] rounded-3xl overflow-hidden shadow-2xl flex items-center justify-center">
        {/* Animated dark gradient backdrop representing luxury feel */}
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `linear-gradient(to right, rgba(0,0,0,0.85), rgba(0,0,0,0.5)), url('https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=1600')` }}
        />
        
        <div className="relative z-10 w-full max-w-4xl px-8 flex flex-col items-center text-center space-y-6">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-orange-500/20 text-orange-400 text-xs font-semibold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Self-Drive Car Rentals in India</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-white leading-tight">
            Premium Drive. <br />
            <span className="bg-gradient-to-r from-orange-400 to-amber-500 bg-clip-text text-transparent">Everyday Prices.</span>
          </h1>
          <p className="text-sm md:text-base text-gray-300 max-w-xl">
            Rent trusted Indian hatchbacks & SUVs. Instant driving license verification, zero hidden charges, and UPI payments.
          </p>

          {/* Search Form */}
          <form 
            onSubmit={handleSearchSubmit}
            className="w-full glass-card p-6 rounded-2xl grid grid-cols-1 md:grid-cols-4 gap-4 items-end mt-8 border border-white/10"
          >
            <div className="flex flex-col text-left">
              <label className="text-[10px] uppercase font-bold text-gray-300 tracking-wider mb-2 flex items-center gap-1">
                <MapPin className="w-3 h-3 text-orange-500" /> Location
              </label>
              <select
                value={pickupLoc}
                onChange={e => setPickupLoc(e.target.value)}
                className="w-full px-3 py-2 bg-black/40 border border-white/20 rounded-xl text-xs text-white focus:outline-none focus:border-orange-500 transition-colors"
              >
                <option value="" className="text-black">Select Branch Location</option>
                {locations.map(loc => (
                  <option key={loc.id} value={loc.id} className="text-black">{loc.name}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col text-left">
              <label className="text-[10px] uppercase font-bold text-gray-300 tracking-wider mb-2 flex items-center gap-1">
                <Clock className="w-3 h-3 text-orange-500" /> Pickup Date
              </label>
              <input
                type="date"
                value={pickupDate}
                onChange={e => setPickupDate(e.target.value)}
                className="w-full px-3 py-2 bg-black/40 border border-white/20 rounded-xl text-xs text-white focus:outline-none focus:border-orange-500"
              />
            </div>
            <div className="flex flex-col text-left">
              <label className="text-[10px] uppercase font-bold text-gray-300 tracking-wider mb-2 flex items-center gap-1">
                <Clock className="w-3 h-3 text-orange-500" /> Return Date
              </label>
              <input
                type="date"
                value={returnDate}
                onChange={e => setReturnDate(e.target.value)}
                className="w-full px-3 py-2 bg-black/40 border border-white/20 rounded-xl text-xs text-white focus:outline-none focus:border-orange-500"
              />
            </div>
            <button
              type="submit"
              className="w-full py-2 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl text-sm transition-all duration-300 shadow-md flex items-center justify-center gap-1"
            >
              Search Cars <ChevronRight className="w-4 h-4" />
            </button>
          </form>
        </div>
      </section>

      {/* 2. FEATURED VEHICLES */}
      <section className="space-y-8">
        <div className="flex items-end justify-between">
          <div className="space-y-2">
            <h2 className="text-3xl font-bold tracking-tight">Featured Indian Fleet</h2>
            <p className="text-sm text-muted-foreground">Choose from our most requested budget-friendly self-drive options.</p>
          </div>
          <Link href="/cars" className="text-sm font-bold text-orange-500 hover:text-orange-600 flex items-center gap-1">
            View All Cars <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {featuredCars.map(car => (
            <div 
              key={car.id} 
              className="group bg-card border border-border/80 rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 flex flex-col"
            >
              {/* Image container */}
              <div className="w-full h-48 bg-muted relative overflow-hidden">
                <img 
                  src={car.images[0]?.url || 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=600'} 
                  alt={car.name} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-sm text-white px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                  <Star className="w-3 h-3 fill-amber-500 text-amber-500" /> {car.rating}
                </div>
                <div className="absolute bottom-3 right-3 bg-orange-500 text-white px-3 py-1 rounded-lg text-xs font-bold shadow-lg">
                  ₹{car.dailyPrice}/day
                </div>
              </div>

              {/* Specs */}
              <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                <div>
                  <h3 className="text-lg font-bold text-foreground group-hover:text-orange-500 transition-colors">
                    {car.brand.name} {car.name}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-orange-500" /> {car.location.name}
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-2 py-3 border-y border-border/60 text-center text-xs font-semibold">
                  <div>
                    <span className="block text-[10px] text-muted-foreground uppercase">Gearbox</span>
                    <span>{car.transmission}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] text-muted-foreground uppercase">Fuel</span>
                    <span>{car.fuelType}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] text-muted-foreground uppercase">Mileage</span>
                    <span>{car.mileage} {car.fuelType === 'ELECTRIC' ? 'km/kWh' : 'km/l'}</span>
                  </div>
                </div>

                <Link 
                  href={`/cars/${car.id}`}
                  className="w-full py-2.5 bg-secondary text-secondary-foreground hover:bg-orange-500 hover:text-white rounded-xl text-xs font-bold text-center transition-all duration-300"
                >
                  Configure & Book
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 3. WHY CHOOSE US */}
      <section className="bg-card/50 border border-border/60 rounded-3xl p-8 md:p-12 grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="flex flex-col items-center text-center space-y-3 p-4">
          <div className="w-12 h-12 bg-orange-500/10 rounded-xl flex items-center justify-center text-orange-500">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-lg">Instant Verification</h3>
          <p className="text-xs text-muted-foreground">
            No long waiting hours. Upload your Driving License and Selfie, and verification is processed instantly via OCR and Admin check.
          </p>
        </div>
        <div className="flex flex-col items-center text-center space-y-3 p-4">
          <div className="w-12 h-12 bg-orange-500/10 rounded-xl flex items-center justify-center text-orange-500">
            <Clock className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-lg">Flexible Bookings</h3>
          <p className="text-xs text-muted-foreground">
            Whether you need a car for an quick hour-long grocery run, a weekend trip, or monthly corporate commute, we offer tailored pricing.
          </p>
        </div>
        <div className="flex flex-col items-center text-center space-y-3 p-4">
          <div className="w-12 h-12 bg-orange-500/10 rounded-xl flex items-center justify-center text-orange-500">
            <TrendingUp className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-lg">100% Refundable Deposit</h3>
          <p className="text-xs text-muted-foreground">
            We value trust. All security deposits are stored safely and processed back to your original payment method immediately on drop-off.
          </p>
        </div>
      </section>

      {/* 4. POPULAR DESTINATIONS */}
      <section className="space-y-8">
        <div className="space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Popular Hub Branches</h2>
          <p className="text-sm text-muted-foreground">Pickup vehicles directly at our airports and central commercial hubs.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[
            { city: "Bengaluru", branch: "Indiranagar", img: "https://images.unsplash.com/photo-1596176530529-78163a4f7af2?w=400" },
            { city: "Delhi / NCR", branch: "Airport Terminal 3", img: "https://images.unsplash.com/photo-1587474260584-136574528ed5?w=400" },
            { city: "Mumbai", branch: "Andheri East", img: "https://images.unsplash.com/photo-1570168007204-dfb528c6958f?w=400" },
            { city: "Hyderabad", branch: "Madhapur", img: "https://images.unsplash.com/photo-1605007493699-af65834f8a00?w=400" }
          ].map((item, idx) => (
            <div key={idx} className="group relative h-48 rounded-2xl overflow-hidden shadow-md cursor-pointer">
              <div 
                className="absolute inset-0 bg-cover bg-center group-hover:scale-110 transition-transform duration-500"
                style={{ backgroundImage: `linear-gradient(to top, rgba(0,0,0,0.8), transparent), url('${item.img}')` }}
              />
              <div className="absolute bottom-4 left-4 text-white">
                <span className="text-[10px] text-orange-400 font-bold uppercase tracking-wider flex items-center gap-1">
                  <Compass className="w-3 h-3" /> {item.city}
                </span>
                <h4 className="font-bold text-sm">{item.branch}</h4>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 5. FAQ SECTION */}
      <section className="space-y-8 max-w-4xl mx-auto">
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-bold tracking-tight flex items-center justify-center gap-2">
            <HelpCircle className="text-orange-500 w-7 h-7" /> Frequently Asked Questions
          </h2>
          <p className="text-sm text-muted-foreground">Clear queries regarding documentation, penalties, security, and payouts.</p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, idx) => (
            <div key={idx} className="bg-card border border-border p-6 rounded-2xl space-y-2">
              <h4 className="font-bold text-base text-foreground">{faq.q}</h4>
              <p className="text-xs md:text-sm text-muted-foreground leading-relaxed">{faq.a}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
