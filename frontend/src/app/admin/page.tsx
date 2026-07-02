'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'next/navigation';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { 
  TrendingUp, 
  Users, 
  Car, 
  CalendarDays, 
  Plus, 
  Edit3, 
  Trash2, 
  ShieldCheck, 
  ShieldAlert, 
  AlertTriangle,
  Settings,
  Coins,
  MapPin,
  Clock,
  Wrench,
  CheckCircle2,
  XCircle,
  Tag
} from 'lucide-react';

interface Stats {
  totalEarnings: number;
  totalCustomers: number;
  totalCars: number;
  availableCars: number;
  bookedCars: number;
  maintenanceCars: number;
  totalBookings: number;
  activeBookings: number;
  completedBookings: number;
  cancelledBookings: number;
  pendingDocuments: number;
  fleetUtilization: number;
  monthlyEarnings: { name: string; earnings: number }[];
}

export default function AdminDashboard() {
  const { user, token } = useAuth();
  const router = useRouter();
  
  const [mounted, setMounted] = useState(false);
  const [stats, setStats] = useState<Stats | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'cars' | 'verification' | 'coupons'>('overview');
  
  // Data lists
  const [carsList, setCarsList] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [brands, setBrands] = useState<any[]>([]);
  const [customersList, setCustomersList] = useState<any[]>([]);
  const [couponsList, setCouponsList] = useState<any[]>([]);

  // Car Form states
  const [showAddCarModal, setShowAddCarModal] = useState(false);
  const [editingCarId, setEditingCarId] = useState<string | null>(null);
  
  const [carName, setCarName] = useState('');
  const [carModel, setCarModel] = useState('');
  const [carBrandId, setCarBrandId] = useState('');
  const [carYear, setCarYear] = useState('2023');
  const [carFuel, setCarFuel] = useState('PETROL');
  const [carTrans, setCarTrans] = useState('MANUAL');
  const [carSeats, setCarSeats] = useState('5');
  const [carMileage, setCarMileage] = useState('18.5');
  const [carColor, setCarColor] = useState('White');
  const [carReg, setCarReg] = useState('');
  const [carLocationId, setCarLocationId] = useState('');
  const [carHourly, setCarHourly] = useState('100');
  const [carDaily, setCarDaily] = useState('1500');
  const [carWeekly, setCarWeekly] = useState('9000');
  const [carMonthly, setCarMonthly] = useState('32000');
  const [carDeposit, setCarDeposit] = useState('3000');
  const [carImages, setCarImages] = useState<string[]>([
    'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=600'
  ]);
  const [carImageUrlInput, setCarImageUrlInput] = useState('');

  // Coupon Form states
  const [showCouponModal, setShowCouponModal] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [couponType, setCouponType] = useState('PERCENTAGE');
  const [couponValue, setCouponValue] = useState('15');
  const [couponMin, setCouponMin] = useState('2000');
  const [couponLimit, setCouponLimit] = useState('100');
  const [couponExpiry, setCouponExpiry] = useState('2026-12-31');

  // Verification Rejection Comments
  const [rejectionComments, setRejectionComments] = useState<Record<string, string>>({});

  useEffect(() => {
    setMounted(true);
    if (!token) return;
    
    // Fetch stats
    fetchStats();
    fetchCars();
    fetchLocationsAndBrands();
    fetchCustomers();
    fetchCoupons();
  }, [token]);

  const fetchStats = () => {
    fetch('https://8f720c5e353cdf2b-154-206-18-162.serveousercontent.com/api/admin/dashboard-stats', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => setStats(data))
      .catch(err => console.error(err));
  };

  const fetchCars = () => {
    // Get all cars including details
    fetch('https://8f720c5e353cdf2b-154-206-18-162.serveousercontent.com/api/cars')
      .then(res => res.json())
      .then(data => setCarsList(data))
      .catch(err => console.error(err));
  };

  const fetchLocationsAndBrands = () => {
    fetch('https://8f720c5e353cdf2b-154-206-18-162.serveousercontent.com/api/cars/locations')
      .then(res => res.json())
      .then(data => setLocations(data))
      .catch(err => console.error(err));

    fetch('https://8f720c5e353cdf2b-154-206-18-162.serveousercontent.com/api/cars/brands')
      .then(res => res.json())
      .then(data => setBrands(data))
      .catch(err => console.error(err));
  };

  const fetchCustomers = () => {
    fetch('https://8f720c5e353cdf2b-154-206-18-162.serveousercontent.com/api/admin/customers', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => setCustomersList(data))
      .catch(err => console.error(err));
  };

  const fetchCoupons = () => {
    fetch('https://8f720c5e353cdf2b-154-206-18-162.serveousercontent.com/api/admin/coupons', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => setCouponsList(data))
      .catch(err => console.error(err));
  };

  // Car Management Submit
  const handleCarSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      name: carName,
      brandId: carBrandId,
      model: carModel,
      year: carYear,
      fuelType: carFuel,
      transmission: carTrans,
      seating: carSeats,
      mileage: carMileage,
      color: carColor,
      regNumber: carReg,
      locationId: carLocationId,
      hourlyPrice: carHourly,
      dailyPrice: carDaily,
      weeklyPrice: carWeekly,
      monthlyPrice: carMonthly,
      securityDeposit: carDeposit,
      images: carImages
    };

    const url = editingCarId 
      ? `https://8f720c5e353cdf2b-154-206-18-162.serveousercontent.com/api/admin/cars/${editingCarId}` 
      : 'https://8f720c5e353cdf2b-154-206-18-162.serveousercontent.com/api/admin/cars';

    const method = editingCarId ? 'PUT' : 'POST';

    fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    })
      .then(res => {
        if (!res.ok) throw new Error('Car submission failed');
        return res.json();
      })
      .then(() => {
        alert(editingCarId ? 'Car updated successfully.' : 'Car added to fleet successfully.');
        setShowAddCarModal(false);
        setEditingCarId(null);
        clearCarForm();
        fetchCars();
        fetchStats();
      })
      .catch(err => alert(err.message));
  };

  const deleteCar = (carId: string) => {
    if (!confirm('Are you sure you want to delete this car?')) return;
    fetch(`https://8f720c5e353cdf2b-154-206-18-162.serveousercontent.com/api/admin/cars/${carId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => {
        if (!res.ok) throw new Error('Deletion failed');
        return res.json();
      })
      .then(() => {
        alert('Car deleted from database.');
        fetchCars();
        fetchStats();
      })
      .catch(err => alert(err.message));
  };

  const toggleCarMaintenance = (carId: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'MAINTENANCE' ? 'AVAILABLE' : 'MAINTENANCE';
    fetch(`https://8f720c5e353cdf2b-154-206-18-162.serveousercontent.com/api/admin/cars/${carId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ status: nextStatus })
    })
      .then(res => {
        if (!res.ok) throw new Error('Failed to update maintenance status');
        return res.json();
      })
      .then(() => {
        alert(`Car status changed to ${nextStatus}`);
        fetchCars();
        fetchStats();
      })
      .catch(err => alert(err.message));
  };

  const clearCarForm = () => {
    setCarName('');
    setCarModel('');
    setCarBrandId('');
    setCarReg('');
    setCarLocationId('');
    setCarImages(['https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=600']);
  };

  const loadEditCar = (car: any) => {
    setEditingCarId(car.id);
    setCarName(car.name);
    setCarModel(car.model);
    setCarBrandId(car.brandId);
    setCarYear(String(car.year));
    setCarFuel(car.fuelType);
    setCarTrans(car.transmission);
    setCarSeats(String(car.seating));
    setCarMileage(String(car.mileage));
    setCarColor(car.color || 'White');
    setCarReg(car.regNumber);
    setCarLocationId(car.locationId);
    setCarHourly(String(car.hourlyPrice));
    setCarDaily(String(car.dailyPrice));
    setCarWeekly(String(car.weeklyPrice));
    setCarMonthly(String(car.monthlyPrice));
    setCarDeposit(String(car.securityDeposit));
    setCarImages(car.images.map((img: any) => img.url));
    setShowAddCarModal(true);
  };

  // Document Approval / Rejection logic
  const handleVerifyDocument = (docId: string, status: 'APPROVED' | 'REJECTED') => {
    const comments = rejectionComments[docId] || 'Document approved by admin review';
    fetch(`https://8f720c5e353cdf2b-154-206-18-162.serveousercontent.com/api/documents/verify-document/${docId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ status, comments })
    })
      .then(res => {
        if (!res.ok) throw new Error('Verification request failed');
        return res.json();
      })
      .then(() => {
        alert(`Document marked as ${status}`);
        fetchCustomers();
        fetchStats();
      })
      .catch(err => alert(err.message));
  };

  // Coupon Submission
  const handleCouponSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetch('https://8f720c5e353cdf2b-154-206-18-162.serveousercontent.com/api/admin/coupons', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        code: couponCode,
        type: couponType,
        value: couponValue,
        minBookingAmount: couponMin,
        usageLimit: couponLimit,
        expiryDate: couponExpiry
      })
    })
      .then(res => {
        if (!res.ok) throw new Error('Coupon create failed');
        return res.json();
      })
      .then(() => {
        alert('Promo discount coupon created successfully!');
        setShowCouponModal(false);
        setCouponCode('');
        fetchCoupons();
      })
      .catch(err => alert(err.message));
  };

  const deleteCoupon = (id: string) => {
    fetch(`https://8f720c5e353cdf2b-154-206-18-162.serveousercontent.com/api/admin/coupons/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => {
        if (!res.ok) throw new Error('Coupon deletion failed');
        return res.json();
      })
      .then(() => {
        alert('Coupon deleted successfully.');
        fetchCoupons();
      })
      .catch(err => alert(err.message));
  };

  if (!mounted || !user) return null;
  if (user.role !== 'ADMIN') {
    return <div className="h-96 flex items-center justify-center font-bold text-red-500">Access Denied. Owner Privilege Required.</div>;
  }

  return (
    <div className="space-y-8">
      {/* Page Title */}
      <div className="flex items-center justify-between border-b border-border/60 pb-5">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Fleet Command Portal</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Control pricing structures, approve user driving licenses, and inspect logistics.</p>
        </div>

        {/* Tab Selection */}
        <div className="flex bg-muted p-1 rounded-xl gap-1 text-xs font-bold text-muted-foreground">
          {[
            { id: 'overview', label: 'Overview Metrics' },
            { id: 'cars', label: 'Fleet Inventory' },
            { id: 'verification', label: 'License Approvals' },
            { id: 'coupons', label: 'Promo Coupons' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2 rounded-lg transition-colors ${
                activeTab === tab.id 
                  ? 'bg-orange-500 text-white shadow-sm' 
                  : 'hover:text-foreground'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* TAB CONTENT 1: OVERVIEW METRICS */}
      {activeTab === 'overview' && stats && (
        <div className="space-y-8">
          {/* Dashboard Stats Row */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-card border border-border p-6 rounded-2xl shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Earnings</span>
                <Coins className="w-5 h-5 text-orange-500" />
              </div>
              <p className="text-2xl font-black text-foreground">₹{stats.totalEarnings}</p>
              <span className="text-[10px] text-muted-foreground font-semibold">Processed Success Transactions</span>
            </div>

            <div className="bg-card border border-border p-6 rounded-2xl shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Fleet Status</span>
                <Car className="w-5 h-5 text-orange-500" />
              </div>
              <p className="text-2xl font-black text-foreground">{stats.availableCars} / {stats.totalCars}</p>
              <span className="text-[10px] text-muted-foreground font-semibold">Available vehicles in catalog</span>
            </div>

            <div className="bg-card border border-border p-6 rounded-2xl shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Verification queue</span>
                <ShieldCheck className="w-5 h-5 text-orange-500" />
              </div>
              <p className="text-2xl font-black text-foreground">{stats.pendingDocuments}</p>
              <span className="text-[10px] text-muted-foreground font-semibold">Users waiting document reviews</span>
            </div>

            <div className="bg-card border border-border p-6 rounded-2xl shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Fleet Utilization</span>
                <TrendingUp className="w-5 h-5 text-orange-500" />
              </div>
              <p className="text-2xl font-black text-foreground">{stats.fleetUtilization}%</p>
              <span className="text-[10px] text-muted-foreground font-semibold">Percentage active on trip</span>
            </div>
          </div>

          {/* Area charts */}
          <div className="grid grid-cols-1 gap-6 bg-card border border-border p-6 rounded-2xl">
            <h3 className="font-bold text-base mb-4 flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-orange-500" /> Monthly Platform Earnings Analytics (INR)
            </h3>
            <div className="w-full h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats.monthlyEarnings}>
                  <defs>
                    <linearGradient id="colorEarnings" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f97316" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="name" stroke="#888888" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="#888888" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `₹${v}`} />
                  <Tooltip />
                  <Area type="monotone" dataKey="earnings" stroke="#f97316" strokeWidth={2} fillOpacity={1} fill="url(#colorEarnings)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT 2: FLEET INVENTORY MANAGERS */}
      {activeTab === 'cars' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-lg">Active Rental Fleet ({carsList.length} Cars)</h3>
            <button
              onClick={() => { clearCarForm(); setEditingCarId(null); setShowAddCarModal(true); }}
              className="py-2 px-4 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-bold shadow-md flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Add Car to Catalog
            </button>
          </div>

          <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-muted text-muted-foreground uppercase font-bold border-b border-border">
                  <th className="p-4">Car details</th>
                  <th className="p-4">Registration</th>
                  <th className="p-4">Branch location</th>
                  <th className="p-4">Price Plans (/Day)</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {carsList.map(car => (
                  <tr key={car.id} className="hover:bg-muted/30">
                    <td className="p-4 font-bold text-foreground">
                      {car.brand.name} {car.name} <span className="text-[10px] text-muted-foreground font-semibold">({car.year})</span>
                    </td>
                    <td className="p-4 text-muted-foreground font-semibold">{car.regNumber}</td>
                    <td className="p-4 text-muted-foreground font-semibold">{car.location.name}</td>
                    <td className="p-4 font-bold text-foreground">₹{car.dailyPrice}</td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 text-[9px] font-extrabold rounded-full ${
                        car.status === 'AVAILABLE' ? 'bg-emerald-500/10 text-emerald-500' :
                        car.status === 'MAINTENANCE' ? 'bg-amber-500/10 text-amber-500' : 'bg-sky-500/10 text-sky-500'
                      }`}>
                        {car.status}
                      </span>
                    </td>
                    <td className="p-4 text-right space-x-2">
                      <button
                        onClick={() => toggleCarMaintenance(car.id, car.status)}
                        className="p-1.5 hover:bg-muted rounded-lg text-muted-foreground hover:text-amber-500"
                        title="Toggle Maintenance Status"
                      >
                        <Wrench className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => loadEditCar(car)}
                        className="p-1.5 hover:bg-muted rounded-lg text-muted-foreground hover:text-orange-500"
                        title="Edit specifications"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => deleteCar(car.id)}
                        className="p-1.5 hover:bg-muted rounded-lg text-muted-foreground hover:text-red-500"
                        title="Remove Car"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB CONTENT 3: DRIVING VERIFICATION QUEUES */}
      {activeTab === 'verification' && (
        <div className="space-y-6">
          <h3 className="font-bold text-lg">Document Approval Verification Center</h3>

          <div className="grid grid-cols-1 gap-8">
            {customersList.filter(c => c.idVerificationStatus === 'PENDING').length === 0 ? (
              <div className="bg-card border border-border p-12 text-center rounded-2xl text-muted-foreground font-semibold text-sm">
                No users are currently in verification queue.
              </div>
            ) : (
              customersList.filter(c => c.idVerificationStatus === 'PENDING').map(cust => (
                <div key={cust.id} className="bg-card border border-border p-6 rounded-2xl space-y-6">
                  <div className="flex items-center justify-between border-b border-border/60 pb-3">
                    <div>
                      <h4 className="font-extrabold text-base">{cust.name}</h4>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{cust.email} | {cust.phoneNumber || '+919988776655'}</p>
                    </div>
                    <span className="px-3 py-1 bg-amber-500/10 text-amber-600 border border-amber-500/20 text-xs font-bold rounded-full animate-pulse">
                      Pending review
                    </span>
                  </div>

                  {/* Documents images display */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {cust.documents.map((doc: any) => (
                      <div key={doc.id} className="border border-border p-3 rounded-xl bg-background/60 space-y-3">
                        <span className="block text-[10px] uppercase font-bold text-muted-foreground tracking-wide">{doc.type.replace(/_/g, ' ')}</span>
                        <a href={doc.fileUrl} target="_blank" rel="noreferrer" className="block relative h-36 rounded-lg overflow-hidden border border-border">
                          <img src={doc.fileUrl} className="w-full h-full object-cover" alt="" />
                        </a>
                        
                        {/* Approval comments inputs & buttons */}
                        {doc.status === 'PENDING' && (
                          <div className="space-y-2">
                            <input 
                              type="text" 
                              placeholder="Rejection comment..." 
                              onChange={e => setRejectionComments({ ...rejectionComments, [doc.id]: e.target.value })}
                              className="w-full p-1.5 bg-background border border-border rounded-lg text-[10px]"
                            />
                            <div className="flex gap-2 text-[9px] font-bold">
                              <button
                                onClick={() => handleVerifyDocument(doc.id, 'APPROVED')}
                                className="flex-1 py-1 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => handleVerifyDocument(doc.id, 'REJECTED')}
                                className="flex-1 py-1 bg-red-500 text-white rounded-lg hover:bg-red-600"
                              >
                                Reject
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB CONTENT 4: COUPON MANAGEMENT */}
      {activeTab === 'coupons' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-lg">Platform Promo Coupons</h3>
            <button
              onClick={() => setShowCouponModal(true)}
              className="py-2 px-4 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-bold shadow-md flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Create Coupon Code
            </button>
          </div>

          <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-muted text-muted-foreground uppercase font-bold border-b border-border">
                  <th className="p-4">Coupon Code</th>
                  <th className="p-4">Discount Type</th>
                  <th className="p-4">Value</th>
                  <th className="p-4">Min. spend amount</th>
                  <th className="p-4">Expiry Date</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {couponsList.map(c => (
                  <tr key={c.id} className="hover:bg-muted/30">
                    <td className="p-4 font-bold text-orange-500 flex items-center gap-1">
                      <Tag className="w-4 h-4" /> {c.code}
                    </td>
                    <td className="p-4 font-semibold text-muted-foreground">{c.type}</td>
                    <td className="p-4 font-extrabold">{c.type === 'FLAT' ? `₹${c.value}` : `${c.value}%`}</td>
                    <td className="p-4 font-semibold text-muted-foreground">₹{c.minBookingAmount}</td>
                    <td className="p-4 text-muted-foreground">
                      {new Date(c.expiryDate).toLocaleDateString('en-IN')}
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => deleteCoupon(c.id)}
                        className="p-1.5 hover:bg-muted rounded-lg text-red-500"
                        title="Remove Coupon"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 5. ADD / EDIT CAR MODAL */}
      {showAddCarModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <form onSubmit={handleCarSubmit} className="w-full max-w-2xl bg-card border border-border rounded-3xl p-8 relative space-y-6">
            <button
              type="button"
              onClick={() => setShowAddCarModal(false)}
              className="absolute top-4 right-4 p-1 hover:bg-muted rounded-full"
            >
              <XCircle className="w-5 h-5" />
            </button>
            
            <h2 className="text-xl font-bold tracking-tight">
              {editingCarId ? 'Edit Car Specifications' : 'Add Vehicle to Active Fleet'}
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-semibold">
              <div>
                <label className="block text-[10px] uppercase text-muted-foreground mb-1">Car Name</label>
                <input 
                  type="text" required value={carName} onChange={e => setCarName(e.target.value)} 
                  className="w-full px-3 py-2 bg-background border border-border rounded-xl"
                  placeholder="Swift"
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase text-muted-foreground mb-1">Model Trim</label>
                <input 
                  type="text" required value={carModel} onChange={e => setCarModel(e.target.value)} 
                  className="w-full px-3 py-2 bg-background border border-border rounded-xl"
                  placeholder="VXI"
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase text-muted-foreground mb-1">Brand</label>
                <select 
                  value={carBrandId} onChange={e => setCarBrandId(e.target.value)} required
                  className="w-full px-3 py-2 bg-background border border-border rounded-xl"
                >
                  <option value="">Select Brand</option>
                  {brands.map(b => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] uppercase text-muted-foreground mb-1">Registration Plate</label>
                <input 
                  type="text" required value={carReg} onChange={e => setCarReg(e.target.value)} 
                  className="w-full px-3 py-2 bg-background border border-border rounded-xl"
                  placeholder="KA-03-MM-1234"
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase text-muted-foreground mb-1">Branch Hub Location</label>
                <select 
                  value={carLocationId} onChange={e => setCarLocationId(e.target.value)} required
                  className="w-full px-3 py-2 bg-background border border-border rounded-xl"
                >
                  <option value="">Select branch</option>
                  {locations.map(loc => (
                    <option key={loc.id} value={loc.id}>{loc.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[10px] uppercase text-muted-foreground mb-1">Year</label>
                <input 
                  type="number" required value={carYear} onChange={e => setCarYear(e.target.value)} 
                  className="w-full px-3 py-2 bg-background border border-border rounded-xl"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase text-muted-foreground mb-1">Gearbox Type</label>
                <select 
                  value={carTrans} onChange={e => setCarTrans(e.target.value)} 
                  className="w-full px-3 py-2 bg-background border border-border rounded-xl"
                >
                  <option value="MANUAL">Manual</option>
                  <option value="AUTOMATIC">Automatic</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] uppercase text-muted-foreground mb-1">Fuel Type</label>
                <select 
                  value={carFuel} onChange={e => setCarFuel(e.target.value)} 
                  className="w-full px-3 py-2 bg-background border border-border rounded-xl"
                >
                  <option value="PETROL">Petrol</option>
                  <option value="DIESEL">Diesel</option>
                  <option value="ELECTRIC">Electric</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] uppercase text-muted-foreground mb-1">Seating Capacity</label>
                <input 
                  type="number" required value={carSeats} onChange={e => setCarSeats(e.target.value)} 
                  className="w-full px-3 py-2 bg-background border border-border rounded-xl"
                />
              </div>
            </div>

            {/* Flexible pricing configurations */}
            <div className="border-t border-border/60 pt-4 space-y-4">
              <h3 className="font-bold text-xs uppercase text-orange-500 tracking-wider">Flexible Pricing Plans (₹ INR)</h3>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-xs font-semibold">
                <div>
                  <label className="block text-[10px] uppercase text-muted-foreground mb-1">Hourly</label>
                  <input type="number" required value={carHourly} onChange={e => setCarHourly(e.target.value)} className="w-full px-3 py-2 bg-background border border-border rounded-xl" />
                </div>
                <div>
                  <label className="block text-[10px] uppercase text-muted-foreground mb-1">Daily</label>
                  <input type="number" required value={carDaily} onChange={e => setCarDaily(e.target.value)} className="w-full px-3 py-2 bg-background border border-border rounded-xl" />
                </div>
                <div>
                  <label className="block text-[10px] uppercase text-muted-foreground mb-1">Weekly</label>
                  <input type="number" required value={carWeekly} onChange={e => setCarWeekly(e.target.value)} className="w-full px-3 py-2 bg-background border border-border rounded-xl" />
                </div>
                <div>
                  <label className="block text-[10px] uppercase text-muted-foreground mb-1">Monthly</label>
                  <input type="number" required value={carMonthly} onChange={e => setCarMonthly(e.target.value)} className="w-full px-3 py-2 bg-background border border-border rounded-xl" />
                </div>
                <div>
                  <label className="block text-[10px] uppercase text-muted-foreground mb-1">Deposit</label>
                  <input type="number" required value={carDeposit} onChange={e => setCarDeposit(e.target.value)} className="w-full px-3 py-2 bg-background border border-border rounded-xl" />
                </div>
              </div>
            </div>

            {/* Image manager inputs */}
            <div className="border-t border-border/60 pt-4 space-y-4">
              <h3 className="font-bold text-xs uppercase text-orange-500 tracking-wider">Car Images Management</h3>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={carImageUrlInput}
                  onChange={e => setCarImageUrlInput(e.target.value)}
                  placeholder="Paste premium Unsplash car image link..."
                  className="flex-1 px-3 py-2 bg-background border border-border rounded-xl text-xs"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (carImageUrlInput) {
                      setCarImages([...carImages, carImageUrlInput]);
                      setCarImageUrlInput('');
                    }
                  }}
                  className="px-4 py-2 bg-orange-500 text-white rounded-xl text-xs font-bold"
                >
                  Add URL
                </button>
              </div>
              
              <div className="flex gap-2 overflow-x-auto py-2">
                {carImages.map((url, idx) => (
                  <div key={idx} className="relative w-20 h-14 bg-muted border border-border rounded-lg overflow-hidden flex-shrink-0">
                    <img src={url} className="w-full h-full object-cover" alt="" />
                    <button
                      type="button"
                      onClick={() => setCarImages(carImages.filter((_, i) => i !== idx))}
                      className="absolute top-0.5 right-0.5 bg-black/60 hover:bg-red-500 text-white text-[8px] px-1 rounded"
                    >
                      Delete
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl text-sm transition-all duration-300 shadow-md"
            >
              {editingCarId ? 'Update Specifications' : 'Publish Car to Catalog'}
            </button>
          </form>
        </div>
      )}

      {/* 6. CREATE COUPON CODE MODAL */}
      {showCouponModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <form onSubmit={handleCouponSubmit} className="w-full max-w-md bg-card border border-border rounded-2xl p-8 relative space-y-6">
            <button
              type="button"
              onClick={() => setShowCouponModal(false)}
              className="absolute top-4 right-4 p-1 hover:bg-muted rounded-full"
            >
              <XCircle className="w-5 h-5" />
            </button>
            <h2 className="text-xl font-bold tracking-tight">Create Promotional Coupon</h2>

            <div className="space-y-4 text-xs font-semibold">
              <div>
                <label className="block text-[10px] uppercase text-muted-foreground mb-1">Coupon Code</label>
                <input 
                  type="text" required value={couponCode} onChange={e => setCouponCode(e.target.value)} 
                  className="w-full px-3 py-2 bg-background border border-border rounded-xl uppercase font-bold"
                  placeholder="FESTIVAL500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] uppercase text-muted-foreground mb-1">Type</label>
                  <select 
                    value={couponType} onChange={e => setCouponType(e.target.value)}
                    className="w-full px-3 py-2 bg-background border border-border rounded-xl"
                  >
                    <option value="PERCENTAGE">Percentage (%)</option>
                    <option value="FLAT">Flat Rate (₹)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] uppercase text-muted-foreground mb-1">Value</label>
                  <input 
                    type="number" required value={couponValue} onChange={e => setCouponValue(e.target.value)} 
                    className="w-full px-3 py-2 bg-background border border-border rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] uppercase text-muted-foreground mb-1">Min Booking Amt (₹)</label>
                  <input 
                    type="number" required value={couponMin} onChange={e => setCouponMin(e.target.value)} 
                    className="w-full px-3 py-2 bg-background border border-border rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase text-muted-foreground mb-1">Usage Limit</label>
                  <input 
                    type="number" required value={couponLimit} onChange={e => setCouponLimit(e.target.value)} 
                    className="w-full px-3 py-2 bg-background border border-border rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase text-muted-foreground mb-1">Expiry Date</label>
                <input 
                  type="date" required value={couponExpiry} onChange={e => setCouponExpiry(e.target.value)} 
                  className="w-full px-3 py-2 bg-background border border-border rounded-xl"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl text-sm transition-all duration-300 shadow-md"
            >
              Generate Coupon Code
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
