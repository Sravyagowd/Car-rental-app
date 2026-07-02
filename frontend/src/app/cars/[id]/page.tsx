'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { API_BASE_URL } from '@/config';
import { 
  Star, 
  MapPin, 
  AlertCircle, 
  FileText, 
  Fuel, 
  Gauge, 
  Users, 
  CalendarDays,
  CheckCircle2,
  LockKeyhole
} from 'lucide-react';

interface ReviewDetails {
  id: string;
  rating: number;
  comment: string;
  user: { name: string; avatarUrl?: string };
  createdAt: string;
  ownerReply?: string;
}

interface CalculationResult {
  durationUnits: number;
  baseAmount: number;
  taxAmount: number;
  insuranceAmount: number;
  driverCharge: number;
  deliveryCharge: number;
  pickupCharge: number;
  discountAmount: number;
  securityDeposit: number;
  finalAmount: number;
}

interface CarDetails {
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
  hourlyPrice: number;
  dailyPrice: number;
  weeklyPrice: number;
  monthlyPrice: number;
  securityDeposit: number;
  extraKmCharge: number;
  lateReturnCharge: number;
  cleaningCharge: number;
  driverCharge: number;
  deliveryCharge: number;
  pickupCharge: number;
  insuranceExpiry: string;
  rcExpiry: string;
  pollutionExpiry: string;
  fitnessExpiry: string;
  locationId: string;
  location: { name: string };
  images: { url: string }[];
  blockedDates: { date: string; reason: string }[];
  reviews: ReviewDetails[];
}

export default function CarDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user, token } = useAuth();
  
  const [car, setCar] = useState<CarDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  // Booking Calculator inputs
  const [pickupDate, setPickupDate] = useState('');
  const [pickupTime, setPickupTime] = useState('09:00');
  const [returnDate, setReturnDate] = useState('');
  const [returnTime, setReturnTime] = useState('18:00');
  const [durationType, setDurationType] = useState('DAILY');
  const [driverRequired, setDriverRequired] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [couponApplied, setCouponApplied] = useState(false);
  const [calcResult, setCalcResult] = useState<CalculationResult | null>(null);
  const [calcError, setCalcError] = useState('');

  // Review Form
  const [userRating, setUserRating] = useState(5);
  const [userComment, setUserComment] = useState('');
  const [reviewError, setReviewError] = useState('');
  const [reviewSuccess, setReviewSuccess] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    fetch(`${API_BASE_URL}/api/cars/${id}`)
      .then(res => res.json())
      .then(data => {
        setCar(data);
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, [id]);

  // Recalculate price when variables change
  useEffect(() => {
    if (!car || !pickupDate || !returnDate) return;
    
    const startStr = `${pickupDate}T${pickupTime}`;
    const endStr = `${returnDate}T${returnTime}`;

    setCalcError('');
    fetch(`${API_BASE_URL}/api/bookings/calculate-price`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        carId: car.id,
        pickupDateTime: startStr,
        returnDateTime: endStr,
        durationType,
        couponCode: couponApplied ? couponCode : '',
        driverRequired
      })
    })
      .then(res => {
        if (!res.ok) return res.json().then(data => { throw new Error(data.message); });
        return res.json();
      })
      .then(data => {
        setCalcResult(data);
      })
      .catch(err => {
        setCalcError(err.message || 'Pricing calculation failed');
        setCalcResult(null);
      });
  }, [car, pickupDate, pickupTime, returnDate, returnTime, durationType, driverRequired, couponApplied, couponCode]);

  const applyCoupon = () => {
    if (!couponCode) return;
    setCouponApplied(true);
  };

  const removeCoupon = () => {
    setCouponCode('');
    setCouponApplied(false);
  };

  const handleBookNow = () => {
    if (!user) {
      alert('Please Sign In first to reserve a vehicle.');
      return;
    }

    if (user.idVerificationStatus !== 'APPROVED') {
      alert('Your driving license documents are not approved yet. Go to verification portal.');
      router.push('/verification');
      return;
    }

    if (!calcResult) {
      alert('Configure your pickup and return timeline to calculate cost first.');
      return;
    }

    // Direct booking simulation
    fetch(`${API_BASE_URL}/api/bookings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        carId: car?.id,
        pickupLocationId: car?.locationId,
        dropLocationId: car?.locationId,
        pickupDateTime: `${pickupDate}T${pickupTime}`,
        returnDateTime: `${returnDate}T${returnTime}`,
        durationType,
        couponCode: couponApplied ? couponCode : '',
        driverRequired,
        paymentMethod: 'UPI'
      })
    })
      .then(res => {
        if (!res.ok) return res.json().then(d => { throw new Error(d.message); });
        return res.json();
      })
      .then(booking => {
        router.push(`/profile?bookingId=${booking.id}`);
      })
      .catch(err => alert(err.message));
  };

  const handleReviewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setReviewError('');
    setReviewSuccess(false);

    if (!token) {
      setReviewError('Please login to post reviews.');
      return;
    }

    // Need a bookingId to review. Let's find user's completed booking for this car first
    fetch(`${API_BASE_URL}/api/bookings/my-bookings`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(bookings => {
        const matchingBooking = (bookings as { carId: string; status: string; id: string }[]).find(
          (b) => b.carId === car?.id && b.status === 'COMPLETED'
        );

        if (!matchingBooking) {
          throw new Error('You can only review cars you have completed rental trips for.');
        }

        return fetch(`${API_BASE_URL}/api/cars/${car?.id}/reviews`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            rating: userRating,
            comment: userComment,
            bookingId: matchingBooking.id
          })
        });
      })
      .then(res => {
        if (!res.ok) return res.json().then(d => { throw new Error(d.message); });
        return res.json();
      })
      .then(newReview => {
        setReviewSuccess(true);
        setUserComment('');
        // Refresh car reviews
        if (car) {
          setCar({
            ...car,
            reviews: [newReview, ...car.reviews]
          });
        }
      })
      .catch(err => {
        setReviewError(err.message || 'Failed to submit review');
      });
  };

  if (loading) return <div className="h-96 flex items-center justify-center font-bold">Loading Premium Car Specifications...</div>;
  if (!car) return <div className="h-96 flex items-center justify-center font-bold text-red-500">Vehicle Specifications not found.</div>;

  return (
    <div className="space-y-12">
      {/* Specs Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <span className="text-xs text-orange-500 font-extrabold uppercase tracking-widest">{car.brand.name}</span>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mt-1">{car.name}</h1>
          <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
            <MapPin className="w-4 h-4 text-orange-500" /> Pickup Branch: {car.location.name}
          </p>
        </div>
        <div className="flex items-center space-x-3 text-sm">
          <div className="bg-orange-500/10 text-orange-500 font-extrabold px-3 py-1.5 rounded-lg flex items-center gap-1">
            <Star className="w-4 h-4 fill-orange-500" /> {car.rating} / 5.0 Rating
          </div>
          <div className="border border-border font-bold px-3 py-1.5 rounded-lg text-muted-foreground uppercase">
            Model: {car.model} ({car.year})
          </div>
        </div>
      </div>

      {/* GALLERY & CALCULATOR BLOCK */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-start">
        {/* Images display */}
        <div className="lg:col-span-2 space-y-4">
          <div className="w-full h-[400px] bg-muted rounded-3xl overflow-hidden border border-border relative">
            <img 
              src={car.images[activeImageIndex]?.url || 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=600'} 
              alt={car.name} 
              className="w-full h-full object-cover"
            />
          </div>

          <div className="flex gap-4">
            {car.images.map((img, idx) => (
              <button
                key={idx}
                onClick={() => setActiveImageIndex(idx)}
                className={`w-24 h-16 rounded-xl overflow-hidden border-2 transition-all ${
                  activeImageIndex === idx ? 'border-orange-500 scale-105' : 'border-border opacity-70 hover:opacity-100'
                }`}
              >
                <img src={img.url} className="w-full h-full object-cover" alt="" />
              </button>
            ))}
          </div>

          {/* Car Specs Description details */}
          <div className="bg-card border border-border p-8 rounded-2xl space-y-6 mt-8">
            <h3 className="font-bold text-lg border-b border-border/60 pb-3">Vehicle Details</h3>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
              <div className="bg-background/60 p-4 rounded-xl border border-border/40">
                <Fuel className="w-5 h-5 text-orange-500 mx-auto mb-2" />
                <span className="text-[10px] text-muted-foreground uppercase font-bold">Fuel System</span>
                <p className="font-bold text-sm mt-1">{car.fuelType}</p>
              </div>
              <div className="bg-background/60 p-4 rounded-xl border border-border/40">
                <Gauge className="w-5 h-5 text-orange-500 mx-auto mb-2" />
                <span className="text-[10px] text-muted-foreground uppercase font-bold">Gearbox</span>
                <p className="font-bold text-sm mt-1">{car.transmission}</p>
              </div>
              <div className="bg-background/60 p-4 rounded-xl border border-border/40">
                <Users className="w-5 h-5 text-orange-500 mx-auto mb-2" />
                <span className="text-[10px] text-muted-foreground uppercase font-bold">Seats</span>
                <p className="font-bold text-sm mt-1">{car.seating} Seater</p>
              </div>
              <div className="bg-background/60 p-4 rounded-xl border border-border/40">
                <CalendarDays className="w-5 h-5 text-orange-500 mx-auto mb-2" />
                <span className="text-[10px] text-muted-foreground uppercase font-bold">Mileage</span>
                <p className="font-bold text-sm mt-1">{car.mileage} km/l</p>
              </div>
            </div>

            {/* Compliance Expiry reminders */}
            <div className="border border-border/60 p-4 rounded-xl space-y-3">
              <h4 className="text-xs uppercase font-extrabold text-muted-foreground tracking-widest flex items-center gap-1">
                <FileText className="w-4 h-4 text-orange-500" /> Compliance Expiry Logs (India)
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-semibold text-foreground">
                <div>Insurance: {car.insuranceExpiry || '2027-05-15'}</div>
                <div>RC Expiry: {car.rcExpiry || '2037-05-15'}</div>
                <div>Pollution (PUC): {car.pollutionExpiry || '2026-12-15'}</div>
                <div>Fitness Cert: {car.fitnessExpiry || '2037-05-15'}</div>
              </div>
            </div>
          </div>
        </div>

        {/* CALCULATOR / CHECKOUT SIDEBAR */}
        <aside className="bg-card border border-border p-6 rounded-2xl shadow-xl space-y-6">
          <div className="border-b border-border/60 pb-3">
            <h3 className="font-extrabold text-lg">Trip Pricing Calculator</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Adjust timelines to calculate rates.</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground block mb-2">Duration Plan</label>
              <select
                value={durationType}
                onChange={e => setDurationType(e.target.value)}
                className="w-full px-3 py-2 bg-background border border-border rounded-xl text-sm"
              >
                <option value="DAILY">Daily (Best value)</option>
                <option value="HOURLY">Hourly (Under 24h)</option>
                <option value="WEEKLY">Weekly (7+ days)</option>
                <option value="MONTHLY">Monthly (30+ days)</option>
              </select>
            </div>

            {/* Pickup details */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground block mb-2">Pickup Date</label>
                <input
                  type="date"
                  value={pickupDate}
                  onChange={e => setPickupDate(e.target.value)}
                  className="w-full px-3 py-2 bg-background border border-border rounded-xl text-xs"
                />
              </div>
              <div>
                <label className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground block mb-2">Pickup Time</label>
                <input
                  type="time"
                  value={pickupTime}
                  onChange={e => setPickupTime(e.target.value)}
                  className="w-full px-3 py-2 bg-background border border-border rounded-xl text-xs"
                />
              </div>
            </div>

            {/* Return details */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground block mb-2">Return Date</label>
                <input
                  type="date"
                  value={returnDate}
                  onChange={e => setReturnDate(e.target.value)}
                  className="w-full px-3 py-2 bg-background border border-border rounded-xl text-xs"
                />
              </div>
              <div>
                <label className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground block mb-2">Return Time</label>
                <input
                  type="time"
                  value={returnTime}
                  onChange={e => setReturnTime(e.target.value)}
                  className="w-full px-3 py-2 bg-background border border-border rounded-xl text-xs"
                />
              </div>
            </div>

            {/* Driver Opt */}
            <div className="flex items-center justify-between p-3 border border-border/60 rounded-xl bg-background/40">
              <span className="text-xs font-semibold text-muted-foreground">Add Chauffeur Driver (+₹500/day)</span>
              <input 
                type="checkbox"
                checked={driverRequired}
                onChange={e => setDriverRequired(e.target.checked)}
                className="rounded text-orange-500 focus:ring-orange-500"
              />
            </div>

            {/* Coupons */}
            <div className="space-y-2">
              <label className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground block">Apply Promo Coupon</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={couponCode}
                  onChange={e => setCouponCode(e.target.value)}
                  disabled={couponApplied}
                  placeholder="e.g. WELCOME500"
                  className="flex-1 px-3 py-1.5 bg-background border border-border rounded-xl text-xs uppercase"
                />
                {couponApplied ? (
                  <button 
                    onClick={removeCoupon}
                    className="px-3 py-1.5 bg-red-500 text-white rounded-xl text-xs font-semibold"
                  >
                    Clear
                  </button>
                ) : (
                  <button 
                    onClick={applyCoupon}
                    className="px-3 py-1.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-semibold"
                  >
                    Apply
                  </button>
                )}
              </div>
              {couponApplied && (
                <span className="text-[10px] text-emerald-500 font-semibold block">✓ Promo coupon details calculated live below</span>
              )}
            </div>

            {/* Price Calculations */}
            {calcError && (
              <div className="p-3 text-xs font-semibold bg-red-500/10 text-red-500 border border-red-500/20 rounded-xl flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 flex-shrink-0" /> {calcError}
              </div>
            )}

            {calcResult ? (
              <div className="border-t border-border/80 pt-4 space-y-2.5 text-xs font-semibold text-muted-foreground">
                <div className="flex justify-between">
                  <span>Base Duration Rental ({calcResult.durationUnits} {durationType === 'HOURLY' ? 'hrs' : 'days'})</span>
                  <span className="text-foreground">₹{calcResult.baseAmount}</span>
                </div>
                <div className="flex justify-between">
                  <span>GST Taxes (18%)</span>
                  <span className="text-foreground">₹{calcResult.taxAmount}</span>
                </div>
                <div className="flex justify-between">
                  <span>Standard Insurance</span>
                  <span className="text-foreground">₹{calcResult.insuranceAmount}</span>
                </div>
                {driverRequired && (
                  <div className="flex justify-between">
                    <span>Chauffeur Service Charge</span>
                    <span className="text-foreground">₹{calcResult.driverCharge}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Branch Delivery & Return Handling</span>
                  <span className="text-foreground">₹{calcResult.deliveryCharge + calcResult.pickupCharge}</span>
                </div>
                {calcResult.discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-500">
                    <span>Coupon Discount</span>
                    <span>-₹{calcResult.discountAmount}</span>
                  </div>
                )}
                <div className="flex justify-between border-t border-border/60 pt-2 text-foreground font-bold">
                  <span>Security Deposit (Refundable)</span>
                  <span>₹{calcResult.securityDeposit}</span>
                </div>
                <div className="flex justify-between border-t border-border/80 pt-3 text-sm text-foreground font-extrabold">
                  <span>Total Amount (with deposit)</span>
                  <span className="text-orange-500">₹{calcResult.finalAmount}</span>
                </div>
              </div>
            ) : (
              <p className="text-center text-xs text-muted-foreground py-4">Enter pickup/return dates to trigger billing.</p>
            )}

            {/* Booking Trigger button */}
            {user?.idVerificationStatus !== 'APPROVED' ? (
              <div className="space-y-2">
                <button
                  disabled
                  className="w-full py-3 bg-muted border border-border text-muted-foreground font-bold rounded-xl text-xs flex items-center justify-center gap-2 cursor-not-allowed"
                >
                  <LockKeyhole className="w-4 h-4" /> Locked: Verification Required
                </button>
                <p className="text-[10px] text-amber-500 text-center font-bold">
                  ⚠️ Go to the Document portal and get driving license approval.
                </p>
              </div>
            ) : (
              <button
                onClick={handleBookNow}
                className="w-full py-3 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl text-sm transition-all duration-300 shadow-lg flex items-center justify-center gap-1.5"
              >
                Proceed to Payment & Confirm
              </button>
            )}
          </div>
        </aside>
      </div>

      {/* REVIEWS & VERIFIED CUSTOMERS SECTION */}
      <section className="space-y-6">
        <h3 className="font-bold text-lg border-b border-border/60 pb-3 flex items-center gap-2">
          Verified Reviews ({car.reviews.length})
        </h3>

        {/* Add Review Form */}
        {user && (
          <form onSubmit={handleReviewSubmit} className="bg-card border border-border p-6 rounded-2xl space-y-4">
            <h4 className="font-bold text-sm">Write a Review (Verified Trips Only)</h4>
            
            {reviewError && (
              <p className="text-xs text-red-500 font-semibold">{reviewError}</p>
            )}
            {reviewSuccess && (
              <p className="text-xs text-emerald-500 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" /> Review submitted and aggregate rating updated successfully!
              </p>
            )}

            <div className="flex items-center space-x-3">
              <span className="text-xs text-muted-foreground font-semibold">Your Rating:</span>
              <select
                value={userRating}
                onChange={e => setUserRating(parseInt(e.target.value))}
                className="px-3 py-1 bg-background border border-border rounded-xl text-xs font-semibold focus:outline-none"
              >
                {[5, 4, 3, 2, 1].map(r => (
                  <option key={r} value={r}>{r} Star</option>
                ))}
              </select>
            </div>

            <textarea
              required
              rows={3}
              value={userComment}
              onChange={e => setUserComment(e.target.value)}
              placeholder="How was the cleanliness, fuel status, and pickup coordination?..."
              className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-sm focus:outline-none focus:border-orange-500"
            />

            <button
              type="submit"
              className="px-4 py-2 bg-secondary text-secondary-foreground hover:bg-orange-500 hover:text-white rounded-xl text-xs font-bold transition-all"
            >
              Post Review
            </button>
          </form>
        )}

        <div className="space-y-4">
          {car.reviews.map((rev, idx) => (
            <div key={idx} className="bg-card border border-border p-6 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-orange-500/10 rounded-full flex items-center justify-center font-bold text-orange-500 text-sm">
                    {rev.user.name.charAt(0)}
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-foreground">{rev.user.name}</h4>
                    <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                      <Star className="w-2.5 h-2.5 fill-amber-500 text-amber-500" /> {rev.rating} Rating
                    </span>
                  </div>
                </div>
                <span className="text-[10px] text-muted-foreground">
                  {new Date(rev.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                </span>
              </div>
              <p className="text-xs md:text-sm text-muted-foreground leading-relaxed pl-1">{rev.comment}</p>
              {rev.ownerReply && (
                <div className="mt-2 ml-4 p-3 bg-muted/40 rounded-xl border-l-2 border-orange-500 text-xs">
                  <span className="font-bold text-foreground">Response from Owner: </span>
                  <span className="text-muted-foreground">{rev.ownerReply}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
