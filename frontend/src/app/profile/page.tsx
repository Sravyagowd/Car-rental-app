'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'next/navigation';
import { API_BASE_URL } from '@/config';
import { 
  CalendarDays, 
  MapPin, 
  Clock, 
  FileText, 
  RefreshCw, 
  XCircle, 
  CheckCircle2, 
  Mail, 
  Phone,
  Shield,
  QrCode,
  CheckCircle
} from 'lucide-react';

interface Booking {
  id: string;
  carId: string;
  car: {
    name: string;
    brand: { name: string };
    regNumber: string;
    images: { url: string }[];
    dailyPrice: number;
  };
  pickupDateTime: string;
  returnDateTime: string;
  durationType: string;
  status: string;
  pickupLocation: { name: string };
  dropLocation: { name: string };
  paymentStatus: string;
  finalAmount: number;
  baseAmount: number;
  taxAmount: number;
  insuranceAmount: number;
  securityDeposit: number;
  discountAmount: number;
  penaltyFee: number;
  lateFee: number;
  pickupOtp: string;
  returnOtp: string;
  pickupQrCode: string;
}

export default function ProfilePage() {
  const { user, token, refreshProfile, loading: authLoading } = useAuth();
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal controls
  const [activeInvoice, setActiveInvoice] = useState<Booking | null>(null);
  const [pickupBooking, setPickupBooking] = useState<Booking | null>(null);
  const [returnBooking, setReturnBooking] = useState<Booking | null>(null);
  const [extensionBooking, setExtensionBooking] = useState<Booking | null>(null);

  // Form states for Pickup
  const [pickupOtpInput, setPickupOtpInput] = useState('');
  const [pickupOdoInput, setPickupOdoInput] = useState('');
  const [pickupFuelInput, setPickupFuelInput] = useState('90');
  const [pickupDamages, setPickupDamages] = useState('');
  const [pickupLoading, setPickupLoading] = useState(false);

  // Form states for Return
  const [returnOtpInput, setReturnOtpInput] = useState('');
  const [returnOdoInput, setReturnOdoInput] = useState('');
  const [returnFuelInput, setReturnFuelInput] = useState('85');
  const [returnDamages, setReturnDamages] = useState('');
  const [returnLoading, setReturnLoading] = useState(false);

  // Extension date
  const [extensionDate, setExtensionDate] = useState('');
  const [extensionLoading, setExtensionLoading] = useState(false);

  const fetchBookings = useCallback(() => {
    if (!token) return;
    setLoading(true);
    fetch(`${API_BASE_URL}/api/bookings/my-bookings`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => setBookings(data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, [token]);

  useEffect(() => {
    if (authLoading) return;
    if (!token) {
      router.push('/');
      return;
    }
    fetchBookings();
    refreshProfile();
  }, [token, fetchBookings, refreshProfile, router, authLoading]);

  const handleCancelBooking = (bookingId: string) => {
    if (!confirm('Are you sure you want to cancel this booking? Refund will be processed immediately.')) return;
    fetch(`${API_BASE_URL}/api/bookings/${bookingId}/cancel`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => {
        if (!res.ok) throw new Error('Cancellation failed');
        return res.json();
      })
      .then(() => {
        alert('Booking cancelled successfully.');
        fetchBookings();
      })
      .catch(err => alert(err.message));
  };

  const handlePickupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pickupBooking) return;
    setPickupLoading(true);

    fetch(`${API_BASE_URL}/api/bookings/${pickupBooking.id}/verify-pickup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        otp: pickupOtpInput,
        odometer: pickupOdoInput,
        fuelLevel: pickupFuelInput,
        damageNotes: pickupDamages,
        signature: 'Customer E-Sign'
      })
    })
      .then(res => {
        if (!res.ok) return res.json().then(d => { throw new Error(d.message); });
        return res.json();
      })
      .then(() => {
        alert('Pickup verified successfully! Car is now ON_RIDE.');
        setPickupBooking(null);
        setPickupOtpInput('');
        setPickupOdoInput('');
        fetchBookings();
      })
      .catch(err => alert(err.message))
      .finally(() => setPickupLoading(false));
  };

  const handleReturnSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!returnBooking) return;
    setReturnLoading(true);

    fetch(`${API_BASE_URL}/api/bookings/${returnBooking.id}/verify-return`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        otp: returnOtpInput,
        odometer: returnOdoInput,
        fuelLevel: returnFuelInput,
        damageNotes: returnDamages,
        signature: 'Customer E-Sign'
      })
    })
      .then(res => {
        if (!res.ok) return res.json().then(d => { throw new Error(d.message); });
        return res.json();
      })
      .then(data => {
        alert(`Return completed successfully!\nLate fee calculated: ₹${data.lateFee}\nPenalty fee (extra KMs): ₹${data.penaltyFee}\nSecurity deposit refunded: ₹${data.refundedDeposit}`);
        setReturnBooking(null);
        setReturnOtpInput('');
        setReturnOdoInput('');
        fetchBookings();
      })
      .catch(err => alert(err.message))
      .finally(() => setReturnLoading(false));
  };

  const handleExtensionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!extensionBooking || !extensionDate) return;
    setExtensionLoading(true);

    fetch(`${API_BASE_URL}/api/bookings/${extensionBooking.id}/extend`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ newReturnDateTime: extensionDate })
    })
      .then(res => {
        if (!res.ok) return res.json().then(d => { throw new Error(d.message); });
        return res.json();
      })
      .then(() => {
        alert('Rental extended successfully! Extra cost charged to your UPI.');
        setExtensionBooking(null);
        setExtensionDate('');
        fetchBookings();
      })
      .catch(err => alert(err.message))
      .finally(() => setExtensionLoading(false));
  };

  if (authLoading) return <div className="h-96 flex items-center justify-center font-bold text-sm">Verifying premium access...</div>;
  if (!user) return null;

  return (
    <div className="space-y-12">
      {/* 1. CUSTOMER PROFILE HEADER CARD */}
      <div className="bg-card border border-border p-8 rounded-3xl shadow-sm grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
        <div className="flex items-center space-x-6">
          <div className="w-20 h-20 bg-orange-500/10 rounded-full flex items-center justify-center font-bold text-orange-500 text-2xl shadow-sm border border-border">
            {user.name.charAt(0)}
          </div>
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-foreground">{user.name}</h2>
            <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest flex items-center gap-1 mt-0.5">
              Role: {user.role}
            </span>
          </div>
        </div>

        <div className="space-y-2 text-xs font-semibold text-muted-foreground border-y md:border-y-0 md:border-x border-border/60 py-4 md:py-0 md:px-8">
          <div className="flex items-center gap-2"><Mail className="w-4 h-4 text-orange-500" /> {user.email}</div>
          <div className="flex items-center gap-2"><Phone className="w-4 h-4 text-orange-500" /> {user.phoneNumber || '+919988776655'}</div>
        </div>

        <div className="flex flex-col md:items-end justify-center">
          <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-extrabold">Driving Compliance</span>
          <div className="mt-2 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-orange-500/10 text-orange-500 text-xs font-bold border border-orange-500/20">
            <Shield className="w-4 h-4" /> Status: {user.idVerificationStatus}
          </div>
        </div>
      </div>

      {/* 2. BOOKING LEDGER */}
      <div className="space-y-6">
        <h3 className="font-extrabold text-xl border-b border-border/60 pb-3 flex items-center gap-2">
          <CalendarDays className="w-6 h-6 text-orange-500" /> Rental Ledger Logs
        </h3>

        {loading ? (
          <div className="text-center py-12 text-sm text-muted-foreground font-semibold">Loading rental ledger...</div>
        ) : bookings.length === 0 ? (
          <div className="bg-card border border-border p-12 text-center rounded-2xl space-y-4">
            <p className="text-muted-foreground text-sm font-semibold">No rental bookings registered yet.</p>
            <button 
              onClick={() => router.push('/cars')}
              className="px-5 py-2.5 bg-orange-500 text-white rounded-xl text-xs font-bold shadow-md hover:bg-orange-600"
            >
              Browse Cars & Start Booking
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {bookings.map(b => (
              <div 
                key={b.id} 
                className="bg-card border border-border p-6 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center space-x-6">
                  {/* Thumbnail */}
                  <div className="w-24 h-16 bg-muted rounded-xl overflow-hidden border border-border">
                    <img 
                      src={b.car.images[0]?.url || 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=600'} 
                      className="w-full h-full object-cover" 
                      alt="" 
                    />
                  </div>
                  
                  {/* Car Specs */}
                  <div>
                    <h4 className="font-extrabold text-base text-foreground">
                      {b.car.brand.name} {b.car.name}
                    </h4>
                    <p className="text-[10px] text-muted-foreground font-semibold flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3.5 h-3.5 text-orange-500" /> {b.pickupLocation.name}
                    </p>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-muted-foreground font-semibold mt-2">
                      <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5 text-orange-500" /> Pickup: {new Date(b.pickupDateTime).toLocaleString('en-IN')}</span>
                      <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5 text-orange-500" /> Drop: {new Date(b.returnDateTime).toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                </div>

                {/* Status Logs & Actions */}
                <div className="flex flex-col md:items-end justify-between space-y-3">
                  <div className="flex items-center gap-3">
                    {/* Live booking status badges */}
                    <span className={`px-2.5 py-1 text-[9px] font-extrabold rounded-full uppercase tracking-wider ${
                      b.status === 'COMPLETED' ? 'bg-emerald-500/10 text-emerald-500' :
                      b.status === 'CANCELLED' ? 'bg-red-500/10 text-red-500' :
                      b.status === 'ON_RIDE' ? 'bg-sky-500/10 text-sky-500 animate-pulse' : 'bg-orange-500/10 text-orange-500'
                    }`}>
                      {b.status}
                    </span>
                    <span className="text-xs font-extrabold text-foreground">₹{b.finalAmount}</span>
                  </div>

                  {/* Actions buttons dynamically loaded */}
                  <div className="flex flex-wrap gap-2">
                    <button 
                      onClick={() => setActiveInvoice(b)}
                      className="px-3 py-1.5 bg-muted text-foreground hover:bg-orange-500 hover:text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1"
                    >
                      <FileText className="w-3.5 h-3.5" /> GST Receipt
                    </button>

                    {b.status === 'CONFIRMED' && (
                      <>
                        <button 
                          onClick={() => setPickupBooking(b)}
                          className="px-3 py-1.5 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1"
                        >
                          <QrCode className="w-3.5 h-3.5" /> Pickup QR
                        </button>
                        <button 
                          onClick={() => handleCancelBooking(b.id)}
                          className="px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1"
                        >
                          <XCircle className="w-3.5 h-3.5" /> Cancel
                        </button>
                      </>
                    )}

                    {b.status === 'ON_RIDE' && (
                      <>
                        <button 
                          onClick={() => setReturnBooking(b)}
                          className="px-3 py-1.5 bg-sky-500 hover:bg-sky-600 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" /> Drop off Return
                        </button>
                        <button 
                          onClick={() => setExtensionBooking(b)}
                          className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1"
                        >
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Extend
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 3. MODALS FOR VEHICLE PICKUP / RETURN / EXTENSION / GST INVOICE */}

      {/* Pickup OTP/QR Modal */}
      {pickupBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <form onSubmit={handlePickupSubmit} className="w-full max-w-md bg-card border border-border rounded-2xl p-8 relative space-y-6">
            <button type="button" onClick={() => setPickupBooking(null)} className="absolute top-4 right-4 p-1 hover:bg-muted rounded-full">
              <XCircle className="w-5 h-5" />
            </button>
            <h2 className="text-xl font-bold text-orange-500 flex items-center gap-2">
              <QrCode className="w-5 h-5" /> Verify Vehicle Pickup
            </h2>
            <div className="p-4 bg-muted/40 border border-border/60 rounded-xl space-y-3">
              <p className="text-xs text-muted-foreground font-semibold">
                Provide QR key to coordinator or input pickup PIN:
              </p>
              <div className="bg-white p-3 w-32 h-32 mx-auto rounded-lg flex items-center justify-center shadow-inner">
                {/* Simulated QR Code */}
                <div className="w-28 h-28 border-4 border-black border-dashed flex items-center justify-center text-black font-extrabold text-[9px] text-center">
                  {pickupBooking.pickupQrCode}
                </div>
              </div>
              <p className="text-[10px] text-center font-bold uppercase tracking-wider text-orange-500">
                OTP: {pickupBooking.pickupOtp}
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground block mb-2">Input OTP</label>
                <input 
                  type="text" 
                  required 
                  value={pickupOtpInput} 
                  onChange={e => setPickupOtpInput(e.target.value)} 
                  className="w-full px-3 py-2 bg-background border border-border rounded-xl text-sm font-bold"
                  placeholder="Enter 4-digit PIN"
                />
              </div>
              <div>
                <label className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground block mb-2">Odometer Reading (KM)</label>
                <input 
                  type="number" 
                  required 
                  value={pickupOdoInput} 
                  onChange={e => setPickupOdoInput(e.target.value)} 
                  className="w-full px-3 py-2 bg-background border border-border rounded-xl text-sm"
                  placeholder="e.g. 12450"
                />
              </div>
              <div>
                <label className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground block mb-2">Pickup Fuel Level (%)</label>
                <input 
                  type="number" 
                  required 
                  value={pickupFuelInput} 
                  onChange={e => setPickupFuelInput(e.target.value)} 
                  className="w-full px-3 py-2 bg-background border border-border rounded-xl text-sm"
                  placeholder="e.g. 90"
                />
              </div>
              <div>
                <label className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground block mb-2">Damage Checklist Notes</label>
                <textarea 
                  value={pickupDamages} 
                  onChange={e => setPickupDamages(e.target.value)} 
                  className="w-full px-3 py-2 bg-background border border-border rounded-xl text-xs"
                  placeholder="Scratches on bumper, etc. (leave blank if clean)"
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={pickupLoading}
              className="w-full py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-bold transition-all shadow-md"
            >
              {pickupLoading ? 'Verifying PIN...' : 'Verify Pin & Start Ride'}
            </button>
          </form>
        </div>
      )}

      {/* Return OTP/Damage Check Modal */}
      {returnBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <form onSubmit={handleReturnSubmit} className="w-full max-w-md bg-card border border-border rounded-2xl p-8 relative space-y-6">
            <button type="button" onClick={() => setReturnBooking(null)} className="absolute top-4 right-4 p-1 hover:bg-muted rounded-full">
              <XCircle className="w-5 h-5" />
            </button>
            <h2 className="text-xl font-bold text-sky-500 flex items-center gap-2">
              <CheckCircle className="w-5 h-5" /> Drop off Return Handover
            </h2>
            <p className="text-xs text-muted-foreground font-semibold">
              Enter details below. Penalties for late return or extra mileage will compute live upon validation.
            </p>
            <p className="text-[10px] font-bold text-orange-500">
              Return OTP: {returnBooking.returnOtp}
            </p>

            <div className="space-y-4">
              <div>
                <label className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground block mb-2">Input Return OTP</label>
                <input 
                  type="text" 
                  required 
                  value={returnOtpInput} 
                  onChange={e => setReturnOtpInput(e.target.value)} 
                  className="w-full px-3 py-2 bg-background border border-border rounded-xl text-sm font-bold"
                  placeholder="Enter 4-digit Return PIN"
                />
              </div>
              <div>
                <label className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground block mb-2">Ending Odometer (KM)</label>
                <input 
                  type="number" 
                  required 
                  value={returnOdoInput} 
                  onChange={e => setReturnOdoInput(e.target.value)} 
                  className="w-full px-3 py-2 bg-background border border-border rounded-xl text-sm"
                  placeholder="e.g. 12720"
                />
              </div>
              <div>
                <label className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground block mb-2">Ending Fuel Level (%)</label>
                <input 
                  type="number" 
                  required 
                  value={returnFuelInput} 
                  onChange={e => setReturnFuelInput(e.target.value)} 
                  className="w-full px-3 py-2 bg-background border border-border rounded-xl text-sm"
                  placeholder="e.g. 85"
                />
              </div>
              <div>
                <label className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground block mb-2">Return Damage Inspection Notes</label>
                <textarea 
                  value={returnDamages} 
                  onChange={e => setReturnDamages(e.target.value)} 
                  className="w-full px-3 py-2 bg-background border border-border rounded-xl text-xs"
                  placeholder="Describe damages if any"
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={returnLoading}
              className="w-full py-2.5 bg-sky-500 hover:bg-sky-600 text-white rounded-xl text-xs font-bold transition-all shadow-md"
            >
              {returnLoading ? 'Computing Overage...' : 'Complete Verification & Drop-off'}
            </button>
          </form>
        </div>
      )}

      {/* Extension Modal */}
      {extensionBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <form onSubmit={handleExtensionSubmit} className="w-full max-w-md bg-card border border-border rounded-2xl p-8 relative space-y-6">
            <button type="button" onClick={() => setExtensionBooking(null)} className="absolute top-4 right-4 p-1 hover:bg-muted rounded-full">
              <XCircle className="w-5 h-5" />
            </button>
            <h2 className="text-xl font-bold text-amber-500 flex items-center gap-2">
              <RefreshCw className="w-5 h-5 animate-spin" /> Extend Rental Period
            </h2>
            <p className="text-xs text-muted-foreground font-semibold">
              Select your extended return date. Extra charges (daily price + 18% GST) will be computed and charged.
            </p>

            <div>
              <label className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground block mb-2">New Return Date & Time</label>
              <input 
                type="datetime-local" 
                required 
                value={extensionDate} 
                onChange={e => setExtensionDate(e.target.value)} 
                className="w-full px-3 py-2 bg-background border border-border rounded-xl text-sm"
              />
            </div>

            <button 
              type="submit" 
              disabled={extensionLoading}
              className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold shadow-md"
            >
              {extensionLoading ? 'Extending...' : 'Confirm Extension & Charge UPI'}
            </button>
          </form>
        </div>
      )}

      {/* GST Receipt Modal */}
      {activeInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-2xl bg-white text-black rounded-3xl p-8 md:p-12 relative shadow-2xl space-y-6 font-mono text-xs">
            <button onClick={() => setActiveInvoice(null)} className="absolute top-4 right-4 p-1 hover:bg-gray-200 text-gray-700 rounded-full font-bold">
              [CLOSE]
            </button>

            {/* Invoice Header */}
            <div className="flex justify-between border-b-2 border-black pb-6">
              <div>
                <h1 className="text-xl font-extrabold tracking-wider">INDDRIVE CAR RENTALS</h1>
                <p className="text-[9px] text-gray-600">GSTIN: 29AABBCCDD1122Z3</p>
                <p className="text-[9px] text-gray-600">100 Ft Rd, Indiranagar, Bengaluru, KA</p>
              </div>
              <div className="text-right">
                <h2 className="text-base font-bold">TAX INVOICE</h2>
                <p className="text-[9px] text-gray-600">Inv: INV-2026-{activeInvoice.id.substring(0, 6).toUpperCase()}</p>
                <p className="text-[9px] text-gray-600">Date: {new Date(activeInvoice.pickupDateTime).toLocaleDateString('en-IN')}</p>
              </div>
            </div>

            {/* Billing details */}
            <div className="grid grid-cols-2 gap-4 py-4 border-b border-gray-300">
              <div>
                <h3 className="font-bold text-[10px] text-gray-600 uppercase">Billing To:</h3>
                <p className="font-bold">{user.name}</p>
                <p className="text-gray-600">{user.email}</p>
              </div>
              <div>
                <h3 className="font-bold text-[10px] text-gray-600 uppercase">Vehicle Details:</h3>
                <p className="font-bold">{activeInvoice.car.brand.name} {activeInvoice.car.name}</p>
                <p className="text-gray-600">Reg: {activeInvoice.car.regNumber}</p>
              </div>
            </div>

            {/* Price breakdown table */}
            <div className="space-y-3 py-4 border-b border-gray-300">
              <div className="flex justify-between font-bold border-b border-gray-200 pb-1">
                <span>Description</span>
                <span>Amount</span>
              </div>
              <div className="flex justify-between">
                <span>Base Duration Fare ({activeInvoice.durationType})</span>
                <span>₹{activeInvoice.baseAmount}</span>
              </div>
              <div className="flex justify-between">
                <span>GST Tax CGST+SGST (18%)</span>
                <span>₹{activeInvoice.taxAmount}</span>
              </div>
              <div className="flex justify-between">
                <span>Standard Road Insurance Coverage</span>
                <span>₹{activeInvoice.insuranceAmount}</span>
              </div>
              <div className="flex justify-between">
                <span>Delivery & Return Logistics Handling</span>
                <span>₹500</span>
              </div>
              {activeInvoice.discountAmount > 0 && (
                <div className="flex justify-between text-green-700 font-bold">
                  <span>Coupon Discount Applied</span>
                  <span>-₹{activeInvoice.discountAmount}</span>
                </div>
              )}
              {activeInvoice.penaltyFee > 0 && (
                <div className="flex justify-between text-red-600">
                  <span>Extra Kilometer Charge Overage</span>
                  <span>₹{activeInvoice.penaltyFee}</span>
                </div>
              )}
              {activeInvoice.lateFee > 0 && (
                <div className="flex justify-between text-red-600">
                  <span>Late Return Delay Penalty</span>
                  <span>₹{activeInvoice.lateFee}</span>
                </div>
              )}
              <div className="flex justify-between font-bold border-t border-gray-200 pt-2">
                <span>Security Deposit (Refunded)</span>
                <span>₹{activeInvoice.securityDeposit}</span>
              </div>
              <div className="flex justify-between text-sm font-extrabold border-t-2 border-black pt-3">
                <span>Grand Total Settled</span>
                <span>₹{activeInvoice.finalAmount}</span>
              </div>
            </div>

            <div className="text-center text-[9px] text-gray-500 mt-6">
              Thank you for driving with INDDRIVE! Computer generated invoice, signature not required.
            </div>

            <button 
              onClick={() => window.print()}
              className="w-full py-2 bg-black hover:bg-gray-800 text-white rounded-xl text-xs font-bold font-sans"
            >
              Print Receipt (PDF)
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
