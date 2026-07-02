'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '../app/context/AuthContext';
import { 
  Car, 
  User as UserIcon, 
  Settings, 
  Sun, 
  Moon, 
  LogOut, 
  ShieldAlert, 
  ShieldCheck,
  Menu,
  X,
  Heart,
  GitCompare,
  CalendarDays
} from 'lucide-react';

export default function Navbar() {
  const { user, logout, darkMode, toggleDarkMode, wishlist, compareList } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showAuthMode, setShowAuthMode] = useState<'login' | 'signup'>('login');
  
  // Auth Form State
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthLoading(true);

    const url = showAuthMode === 'login' 
      ? 'https://8f720c5e353cdf2b-154-206-18-162.serveousercontent.com/api/auth/login' 
      : 'https://8f720c5e353cdf2b-154-206-18-162.serveousercontent.com/api/auth/signup';

    const payload = showAuthMode === 'login'
      ? { email, password }
      : { email, password, name, phoneNumber: phone };

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Authentication failed');
      }
      login(data.token, data.user);
      setShowLoginModal(false);
      setEmail('');
      setPassword('');
      setName('');
      setPhone('');
    } catch (err: any) {
      setAuthError(err.message || 'Error occurred');
    } finally {
      setAuthLoading(false);
    }
  };

  const triggerGoogleLoginMock = async () => {
    setAuthError('');
    setAuthLoading(true);
    try {
      const res = await fetch('https://8f720c5e353cdf2b-154-206-18-162.serveousercontent.com/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'googleuser@gmail.com',
          name: 'Google Test User',
          googleId: '1234567890',
          imageUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      login(data.token, data.user);
      setShowLoginModal(false);
    } catch (err: any) {
      setAuthError(err.message);
    } finally {
      setAuthLoading(false);
    }
  };

  return (
    <>
      <nav className="sticky top-0 z-40 w-full px-6 py-4 glass-card transition-all duration-300">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2 text-2xl font-bold tracking-wider text-foreground">
            <span className="bg-gradient-to-r from-orange-500 to-amber-600 bg-clip-text text-transparent">IND</span>
            <span>DRIVE</span>
            <Car className="w-6 h-6 text-orange-500" />
          </Link>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center space-x-8">
            <Link href="/cars" className="text-sm font-medium hover:text-orange-500 transition-colors">
              Browse Cars
            </Link>
            {user && (
              <>
                <Link href="/profile" className="text-sm font-medium hover:text-orange-500 transition-colors flex items-center gap-1">
                  <CalendarDays className="w-4 h-4" /> My Bookings
                </Link>
                <Link href="/verification" className="text-sm font-medium hover:text-orange-500 transition-colors flex items-center gap-1">
                  {user.idVerificationStatus === 'APPROVED' ? (
                    <ShieldCheck className="w-4 h-4 text-emerald-500" />
                  ) : (
                    <ShieldAlert className="w-4 h-4 text-amber-500 animate-pulse" />
                  )}
                  Verification
                </Link>
              </>
            )}
            {user?.role === 'ADMIN' && (
              <Link href="/admin" className="text-sm font-medium text-amber-500 hover:text-amber-600 transition-colors flex items-center gap-1">
                <Settings className="w-4 h-4" /> Admin Panel
              </Link>
            )}
          </div>

          {/* User Controls & DarkMode */}
          <div className="hidden md:flex items-center space-x-4">
            {/* Wishlist and Compare Indicators */}
            {wishlist.length > 0 && (
              <Link href="/cars?filter=wishlist" className="relative p-2 text-foreground hover:text-red-500 transition-colors">
                <Heart className="w-5 h-5 fill-red-500 text-red-500" />
                <span className="absolute top-0 right-0 w-4 h-4 bg-orange-500 text-[10px] text-white rounded-full flex items-center justify-center font-bold">
                  {wishlist.length}
                </span>
              </Link>
            )}
            {compareList.length > 0 && (
              <Link href={`/cars?compare=${compareList.join(',')}`} className="relative p-2 text-foreground hover:text-orange-500 transition-colors">
                <GitCompare className="w-5 h-5" />
                <span className="absolute top-0 right-0 w-4 h-4 bg-orange-500 text-[10px] text-white rounded-full flex items-center justify-center font-bold">
                  {compareList.length}
                </span>
              </Link>
            )}

            <button 
              onClick={toggleDarkMode}
              className="p-2 rounded-full hover:bg-muted transition-colors text-foreground"
              aria-label="Toggle Theme"
            >
              {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>

            {user ? (
              <div className="flex items-center space-x-4">
                <div className="flex flex-col text-right">
                  <span className="text-sm font-semibold">{user.name}</span>
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wide">
                    {user.idVerificationStatus}
                  </span>
                </div>
                <button
                  onClick={logout}
                  className="p-2 text-foreground hover:text-red-500 transition-colors"
                  title="Logout"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => { setShowAuthMode('login'); setShowLoginModal(true); }}
                className="px-5 py-2 text-sm font-semibold rounded-lg bg-orange-500 hover:bg-orange-600 text-white shadow-lg transition-all duration-300"
              >
                Sign In
              </button>
            )}
          </div>

          {/* Mobile Menu Icon */}
          <div className="md:hidden flex items-center space-x-3">
            <button onClick={toggleDarkMode} className="p-2">
              {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2">
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden mt-4 pt-4 border-t border-border flex flex-col space-y-4">
            <Link href="/cars" onClick={() => setMobileMenuOpen(false)} className="text-base font-medium py-1">
              Browse Cars
            </Link>
            {user && (
              <>
                <Link href="/profile" onClick={() => setMobileMenuOpen(false)} className="text-base font-medium py-1">
                  My Bookings
                </Link>
                <Link href="/verification" onClick={() => setMobileMenuOpen(false)} className="text-base font-medium py-1 flex items-center gap-2">
                  Driving License: {user.idVerificationStatus}
                </Link>
              </>
            )}
            {user?.role === 'ADMIN' && (
              <Link href="/admin" onClick={() => setMobileMenuOpen(false)} className="text-base font-medium py-1 text-amber-500">
                Admin Panel
              </Link>
            )}
            {user ? (
              <button
                onClick={() => { logout(); setMobileMenuOpen(false); }}
                className="w-full text-left font-medium py-1 text-red-500 flex items-center gap-2"
              >
                <LogOut className="w-5 h-5" /> Sign Out
              </button>
            ) : (
              <button
                onClick={() => { setShowAuthMode('login'); setShowLoginModal(true); setMobileMenuOpen(false); }}
                className="w-full py-2.5 text-center bg-orange-500 rounded-lg text-white font-semibold"
              >
                Sign In
              </button>
            )}
          </div>
        )}
      </nav>

      {/* Luxury Auth Modal */}
      {showLoginModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl p-8 relative overflow-hidden">
            <button 
              onClick={() => setShowLoginModal(false)}
              className="absolute top-4 right-4 p-1 hover:bg-muted rounded-full"
            >
              <X className="w-5 h-5" />
            </button>
            
            <h2 className="text-2xl font-bold tracking-tight mb-2">
              {showAuthMode === 'login' ? 'Welcome Back' : 'Create Luxury Account'}
            </h2>
            <p className="text-sm text-muted-foreground mb-6">
              {showAuthMode === 'login' ? 'Sign in to access your Indian car rental account.' : 'Join to start booking cars across major Indian cities.'}
            </p>

            {authError && (
              <div className="p-3 mb-4 text-xs font-semibold bg-red-500/10 text-red-500 border border-red-500/20 rounded-lg">
                {authError}
              </div>
            )}

            <form onSubmit={handleAuthSubmit} className="space-y-4">
              {showAuthMode === 'signup' && (
                <>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider mb-1">Full Name</label>
                    <input 
                      type="text" 
                      required 
                      value={name} 
                      onChange={e => setName(e.target.value)} 
                      className="w-full px-4 py-2.5 bg-background border border-border rounded-xl focus:outline-none focus:border-orange-500 transition-colors"
                      placeholder="Amit Sharma"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider mb-1">Phone Number (+91)</label>
                    <input 
                      type="tel" 
                      required 
                      value={phone} 
                      onChange={e => setPhone(e.target.value)} 
                      className="w-full px-4 py-2.5 bg-background border border-border rounded-xl focus:outline-none focus:border-orange-500 transition-colors"
                      placeholder="9876543210"
                    />
                  </div>
                </>
              )}

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-1">Email Address</label>
                <input 
                  type="email" 
                  required 
                  value={email} 
                  onChange={e => setEmail(e.target.value)} 
                  className="w-full px-4 py-2.5 bg-background border border-border rounded-xl focus:outline-none focus:border-orange-500 transition-colors"
                  placeholder="amit@gmail.com"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-1">Password</label>
                <input 
                  type="password" 
                  required 
                  value={password} 
                  onChange={e => setPassword(e.target.value)} 
                  className="w-full px-4 py-2.5 bg-background border border-border rounded-xl focus:outline-none focus:border-orange-500 transition-colors"
                  placeholder="••••••"
                />
              </div>

              <button
                type="submit"
                disabled={authLoading}
                className="w-full py-3 mt-2 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl transition-all duration-300 shadow-lg flex items-center justify-center gap-2"
              >
                {authLoading ? 'Authenticating...' : showAuthMode === 'login' ? 'Sign In' : 'Sign Up'}
              </button>
            </form>

            <div className="relative my-6 flex items-center justify-center text-xs uppercase font-semibold text-muted-foreground">
              <span className="w-full border-t border-border absolute"></span>
              <span className="bg-card px-3 z-10">Or continue with</span>
            </div>

            <button
              onClick={triggerGoogleLoginMock}
              type="button"
              className="w-full py-2.5 bg-background border border-border rounded-xl font-semibold hover:bg-muted transition-colors flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#EA4335" d="M12 5.04c1.63 0 3.1.56 4.25 1.66l3.17-3.17C17.47 1.6 14.93 1 12 1 7.24 1 3.2 3.73 1.24 7.72l3.77 2.92C5.9 7.39 8.7 5.04 12 5.04z"/>
                <path fill="#4285F4" d="M23.49 12.27c0-.81-.07-1.59-.2-2.35H12v4.45h6.46c-.28 1.48-1.12 2.73-2.38 3.58v2.98h3.84c2.25-2.07 3.57-5.12 3.57-8.66z"/>
                <path fill="#FBBC05" d="M5.01 10.64c-.24-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29L1.24 5.14C.45 6.72 0 8.5 0 10.38s.45 3.66 1.24 5.24l3.77-2.98z"/>
                <path fill="#34A853" d="M12 23c3.24 0 5.97-1.07 7.96-2.92l-3.84-2.98c-1.07.72-2.44 1.15-4.12 1.15-3.3 0-6.1-2.35-7.1-5.6L1.13 15.6C3.1 19.59 7.14 23 12 23z"/>
              </svg>
              Google Account (Demo)
            </button>

            <p className="text-center text-xs mt-6 text-muted-foreground font-medium">
              {showAuthMode === 'login' ? "Don't have an account? " : "Already have an account? "}
              <button 
                onClick={() => setShowAuthMode(showAuthMode === 'login' ? 'signup' : 'login')}
                className="text-orange-500 font-bold hover:underline"
              >
                {showAuthMode === 'login' ? 'Create one' : 'Login instead'}
              </button>
            </p>
          </div>
        </div>
      )}
    </>
  );
}
