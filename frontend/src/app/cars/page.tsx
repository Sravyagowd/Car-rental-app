'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../context/AuthContext';
import { 
  Filter, 
  MapPin, 
  Star, 
  Heart, 
  GitCompare, 
  X, 
  Search, 
  SlidersHorizontal,
  ChevronDown
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
  mileage: number;
  color: string;
  regNumber: string;
  rating: number;
  images: { url: string }[];
  location: { name: string };
  hourlyPrice: number;
  dailyPrice: number;
  weeklyPrice: number;
  monthlyPrice: number;
  securityDeposit: number;
  extraKmCharge: number;
  lateReturnCharge: number;
}

function CarBrowsingContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { wishlist, toggleWishlist, compareList, toggleCompare } = useAuth();
  
  const [cars, setCars] = useState<Car[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFiltersMobile, setShowFiltersMobile] = useState(false);
  const [locations, setLocations] = useState<{ id: string; name: string }[]>([]);
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [selectedBrand, setSelectedBrand] = useState(searchParams.get('brand') || '');
  const [selectedFuel, setSelectedFuel] = useState(searchParams.get('fuel') || '');
  const [selectedTrans, setSelectedTrans] = useState(searchParams.get('transmission') || '');
  const [selectedSeats, setSelectedSeats] = useState(searchParams.get('seats') || '');
  const [selectedLocation, setSelectedLocation] = useState(searchParams.get('locationId') || '');
  const [maxPrice, setMaxPrice] = useState('3000');
  const [sortBy, setSortBy] = useState('rating');
  const [showOnlyWishlist, setShowOnlyWishlist] = useState(searchParams.get('filter') === 'wishlist');

  // Trigger filters load
  useEffect(() => {
    fetch('https://8f720c5e353cdf2b-154-206-18-162.serveousercontent.com/api/cars/locations')
      .then(res => res.json())
      .then(data => setLocations(data))
      .catch(err => console.error(err));
  }, []);

  // Fetch cars on filter change
  useEffect(() => {
    setLoading(true);
    let url = `https://8f720c5e353cdf2b-154-206-18-162.serveousercontent.com/api/cars?`;
    if (searchTerm) url += `search=${searchTerm}&`;
    if (selectedBrand) url += `brand=${selectedBrand}&`;
    if (selectedFuel) url += `fuel=${selectedFuel}&`;
    if (selectedTrans) url += `transmission=${selectedTrans}&`;
    if (selectedSeats) url += `seats=${selectedSeats}&`;
    if (selectedLocation) url += `locationId=${selectedLocation}&`;
    if (maxPrice) url += `maxPrice=${maxPrice}&`;
    if (sortBy) url += `sortBy=${sortBy}&`;

    fetch(url)
      .then(res => res.json())
      .then(data => {
        let filtered = data;
        if (showOnlyWishlist) {
          filtered = data.filter((c: Car) => wishlist.includes(c.id));
        }
        setCars(filtered);
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, [searchTerm, selectedBrand, selectedFuel, selectedTrans, selectedSeats, selectedLocation, maxPrice, sortBy, showOnlyWishlist, wishlist]);

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedBrand('');
    setSelectedFuel('');
    setSelectedTrans('');
    setSelectedSeats('');
    setSelectedLocation('');
    setMaxPrice('3000');
    setSortBy('rating');
    setShowOnlyWishlist(false);
  };

  const getComparedCarsData = () => {
    return cars.filter(c => compareList.includes(c.id));
  };

  return (
    <div className="space-y-8 relative pb-24">
      {/* Search and Sort Topbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card border border-border p-4 rounded-2xl shadow-sm">
        <div className="relative flex-1 max-w-lg">
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search by Maruti Swift, location, petrol automatic..."
            className="w-full pl-10 pr-4 py-2.5 bg-background border border-border rounded-xl focus:outline-none focus:border-orange-500 text-sm transition-colors"
          />
          <Search className="w-5 h-5 text-muted-foreground absolute left-3 top-3" />
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowFiltersMobile(!showFiltersMobile)}
            className="md:hidden py-2.5 px-4 bg-secondary text-secondary-foreground hover:bg-orange-500 hover:text-white rounded-xl text-sm font-semibold flex items-center gap-1.5 transition-all"
          >
            <SlidersHorizontal className="w-4 h-4" /> Filters
          </button>
          
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider hidden md:inline">Sort By</span>
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
              className="py-2.5 px-4 bg-background border border-border rounded-xl text-sm font-semibold focus:outline-none"
            >
              <option value="rating">Best Rated</option>
              <option value="price_low_high">Price: Low to High</option>
              <option value="price_high_low">Price: High to Low</option>
              <option value="latest">Latest Models</option>
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8 items-start">
        {/* FILTERS PANEL */}
        <aside className={`md:block space-y-6 ${showFiltersMobile ? 'block' : 'hidden md:block'}`}>
          <div className="bg-card border border-border p-6 rounded-2xl space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-base flex items-center gap-2">
                <Filter className="w-4 h-4 text-orange-500" /> Filter Options
              </h3>
              <button 
                onClick={clearFilters}
                className="text-xs font-bold text-orange-500 hover:underline"
              >
                Clear All
              </button>
            </div>

            {/* Location filter */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Hub Location</label>
              <select
                value={selectedLocation}
                onChange={e => setSelectedLocation(e.target.value)}
                className="w-full px-3 py-2 bg-background border border-border rounded-xl text-sm"
              >
                <option value="">All Branches</option>
                {locations.map(loc => (
                  <option key={loc.id} value={loc.id}>{loc.name}</option>
                ))}
              </select>
            </div>

            {/* Brand filter */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Brand</label>
              <select
                value={selectedBrand}
                onChange={e => setSelectedBrand(e.target.value)}
                className="w-full px-3 py-2 bg-background border border-border rounded-xl text-sm"
              >
                <option value="">All Brands</option>
                <option value="Maruti Suzuki">Maruti Suzuki</option>
                <option value="Tata Motors">Tata Motors</option>
                <option value="Hyundai">Hyundai</option>
                <option value="Mahindra">Mahindra</option>
                <option value="Kia">Kia</option>
                <option value="Toyota">Toyota</option>
              </select>
            </div>

            {/* Transmission filter */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Gearbox</label>
              <div className="flex gap-2">
                {['MANUAL', 'AUTOMATIC'].map(t => (
                  <button
                    key={t}
                    onClick={() => setSelectedTrans(selectedTrans === t ? '' : t)}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                      selectedTrans === t 
                        ? 'bg-orange-500 border-orange-500 text-white' 
                        : 'border-border bg-background hover:bg-muted text-foreground'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Fuel Type filter */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Fuel Type</label>
              <select
                value={selectedFuel}
                onChange={e => setSelectedFuel(e.target.value)}
                className="w-full px-3 py-2 bg-background border border-border rounded-xl text-sm"
              >
                <option value="">All Fuels</option>
                <option value="PETROL">Petrol</option>
                <option value="DIESEL">Diesel</option>
                <option value="ELECTRIC">Electric</option>
              </select>
            </div>

            {/* Max Daily Price slider */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-muted-foreground">
                <span>Max Day Rate</span>
                <span className="text-orange-500">₹{maxPrice}/day</span>
              </div>
              <input
                type="range"
                min="1000"
                max="3000"
                step="100"
                value={maxPrice}
                onChange={e => setMaxPrice(e.target.value)}
                className="w-full accent-orange-500"
              />
            </div>

            {/* Wishlist toggle */}
            <div className="flex items-center space-x-2 pt-2 border-t border-border/60">
              <input 
                type="checkbox"
                id="wishlistOnly"
                checked={showOnlyWishlist}
                onChange={e => setShowOnlyWishlist(e.target.checked)}
                className="rounded text-orange-500 focus:ring-orange-500"
              />
              <label htmlFor="wishlistOnly" className="text-xs font-bold text-muted-foreground cursor-pointer flex items-center gap-1">
                <Heart className="w-3.5 h-3.5 fill-red-500 text-red-500" /> Wishlisted Cars Only
              </label>
            </div>
          </div>
        </aside>

        {/* CARS RESULTS GRID */}
        <main className="md:col-span-3">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="h-[360px] bg-card/60 animate-pulse border border-border rounded-2xl" />
              ))}
            </div>
          ) : cars.length === 0 ? (
            <div className="text-center py-16 bg-card border border-border rounded-2xl space-y-4">
              <p className="text-muted-foreground text-sm font-semibold">No cars match your chosen filter configurations.</p>
              <button 
                onClick={clearFilters}
                className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-bold"
              >
                Reset Search Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {cars.map(car => (
                <div 
                  key={car.id}
                  className="group bg-card border border-border/80 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
                >
                  <div className="relative w-full h-44 bg-muted overflow-hidden">
                    <img 
                      src={car.images[0]?.url || 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=600'} 
                      alt={car.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    
                    {/* Floating wishlist toggle */}
                    <button
                      onClick={() => toggleWishlist(car.id)}
                      className="absolute top-3 right-3 p-2 bg-black/40 hover:bg-black/60 rounded-full text-white backdrop-blur-sm transition-all"
                    >
                      <Heart className={`w-4 h-4 transition-colors ${wishlist.includes(car.id) ? 'fill-red-500 text-red-500' : 'text-white'}`} />
                    </button>

                    {/* Floating compare toggle */}
                    <button
                      onClick={() => toggleCompare(car.id)}
                      className="absolute top-3 left-3 p-2 bg-black/40 hover:bg-black/60 rounded-full text-white backdrop-blur-sm transition-all flex items-center"
                      title="Compare specs"
                    >
                      <GitCompare className={`w-4 h-4 ${compareList.includes(car.id) ? 'text-orange-500' : 'text-white'}`} />
                    </button>

                    <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-sm text-white px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-wider flex items-center gap-0.5">
                      <Star className="w-2.5 h-2.5 fill-amber-500 text-amber-500" /> {car.rating}
                    </div>
                  </div>

                  <div className="p-5 space-y-4 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-muted-foreground uppercase font-semibold tracking-wider">
                          {car.brand.name}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          Model: {car.model}
                        </span>
                      </div>
                      <h4 className="font-bold text-base text-foreground mt-0.5">{car.name}</h4>
                      <p className="text-[10px] text-muted-foreground flex items-center gap-0.5 mt-1">
                        <MapPin className="w-3 h-3 text-orange-500" /> {car.location.name}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-center text-xs py-2 bg-muted/40 rounded-xl font-semibold text-muted-foreground">
                      <div>
                        <span className="block text-[9px] uppercase tracking-wide">Gearbox</span>
                        <span className="text-foreground text-[10px]">{car.transmission}</span>
                      </div>
                      <div>
                        <span className="block text-[9px] uppercase tracking-wide">Fuel Type</span>
                        <span className="text-foreground text-[10px]">{car.fuelType}</span>
                      </div>
                    </div>

                    <div className="flex items-end justify-between pt-2">
                      <div>
                        <span className="text-[10px] text-muted-foreground uppercase tracking-wide block">Rate Plans</span>
                        <span className="text-base font-extrabold text-foreground">₹{car.dailyPrice}</span>
                        <span className="text-xs text-muted-foreground">/day</span>
                      </div>
                      <Link
                        href={`/cars/${car.id}`}
                        className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-bold shadow-md transition-all"
                      >
                        Rent Now
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>

      {/* 3-WAY SPEC COMPARISON DRAWER */}
      {compareList.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-card border-t border-border shadow-2xl p-6 transition-transform transform translate-y-0 max-h-[70vh] overflow-y-auto">
          <div className="max-w-7xl mx-auto space-y-4">
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <h3 className="font-bold text-base flex items-center gap-2 text-orange-500">
                <GitCompare className="w-5 h-5" /> Compare Vehicles ({compareList.length}/3)
              </h3>
              <button 
                onClick={() => getComparedCarsData().forEach(c => toggleCompare(c.id))}
                className="p-1 hover:bg-muted rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs font-semibold">
              <div className="hidden md:flex flex-col justify-around text-muted-foreground uppercase tracking-wider font-bold">
                <div className="py-2.5 border-b border-border/40">Vehicle</div>
                <div className="py-2.5 border-b border-border/40">Gearbox</div>
                <div className="py-2.5 border-b border-border/40">Fuel Type</div>
                <div className="py-2.5 border-b border-border/40">Mileage</div>
                <div className="py-2.5 border-b border-border/40">Seating</div>
                <div className="py-2.5 border-b border-border/40">Daily Price</div>
                <div className="py-2.5 border-b border-border/40">Security Deposit</div>
              </div>

              {getComparedCarsData().map(c => (
                <div key={c.id} className="bg-muted/40 p-4 rounded-xl border border-border flex flex-col space-y-1 relative">
                  <button 
                    onClick={() => toggleCompare(c.id)}
                    className="absolute top-2 right-2 text-muted-foreground hover:text-red-500"
                  >
                    <X className="w-4 h-4" />
                  </button>

                  <div className="py-2.5 border-b border-border/40 font-bold text-foreground">
                    {c.brand.name} {c.name} ({c.year})
                  </div>
                  <div className="py-2.5 border-b border-border/40 flex justify-between md:block">
                    <span className="md:hidden text-muted-foreground">Gearbox: </span>
                    <span>{c.transmission}</span>
                  </div>
                  <div className="py-2.5 border-b border-border/40 flex justify-between md:block">
                    <span className="md:hidden text-muted-foreground">Fuel: </span>
                    <span>{c.fuelType}</span>
                  </div>
                  <div className="py-2.5 border-b border-border/40 flex justify-between md:block">
                    <span className="md:hidden text-muted-foreground">Mileage: </span>
                    <span>{c.mileage} km/l</span>
                  </div>
                  <div className="py-2.5 border-b border-border/40 flex justify-between md:block">
                    <span className="md:hidden text-muted-foreground">Seats: </span>
                    <span>{c.seating} Seater</span>
                  </div>
                  <div className="py-2.5 border-b border-border/40 flex justify-between md:block text-orange-500 font-extrabold">
                    <span className="md:hidden text-muted-foreground">Rate: </span>
                    <span>₹{c.dailyPrice}/day</span>
                  </div>
                  <div className="py-2.5 border-b border-border/40 flex justify-between md:block">
                    <span className="md:hidden text-muted-foreground">Deposit: </span>
                    <span>₹{c.securityDeposit}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function CarBrowsingPage() {
  return (
    <Suspense fallback={<div className="h-96 flex items-center justify-center font-bold">Loading Fleet Listings...</div>}>
      <CarBrowsingContent />
    </Suspense>
  );
}
