'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  phoneNumber?: string;
  avatarUrl?: string;
  idVerificationStatus: string; // "NOT_SUBMITTED", "PENDING", "APPROVED", "REJECTED"
  idVerificationComments?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  darkMode: boolean;
  wishlist: string[];
  compareList: string[];
  login: (token: string, user: User) => void;
  logout: () => void;
  toggleDarkMode: () => void;
  toggleWishlist: (carId: string) => void;
  toggleCompare: (carId: string) => void;
  refreshProfile: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [darkMode, setDarkMode] = useState<boolean>(true); // default dark for luxury look
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [compareList, setCompareList] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Load state on mount
  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    const savedDarkMode = localStorage.getItem('darkMode');
    const savedWishlist = localStorage.getItem('wishlist');

    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
    }

    if (savedDarkMode !== null) {
      setDarkMode(savedDarkMode === 'true');
    }

    if (savedWishlist) {
      setWishlist(JSON.parse(savedWishlist));
    }

    setLoading(false);
  }, []);

  // Update HTML class for Tailwind dark mode
  useEffect(() => {
    const root = window.document.documentElement;
    if (darkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('darkMode', String(darkMode));
  }, [darkMode]);

  const login = (newToken: string, newUser: User) => {
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem('token', newToken);
    localStorage.setItem('user', JSON.stringify(newUser));
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  const toggleWishlist = (carId: string) => {
    let updated: string[];
    if (wishlist.includes(carId)) {
      updated = wishlist.filter(id => id !== carId);
    } else {
      updated = [...wishlist, carId];
    }
    setWishlist(updated);
    localStorage.setItem('wishlist', JSON.stringify(updated));
  };

  const toggleCompare = (carId: string) => {
    if (compareList.includes(carId)) {
      setCompareList(compareList.filter(id => id !== carId));
    } else {
      if (compareList.length >= 3) {
        alert('You can compare a maximum of 3 cars at a time.');
        return;
      }
      setCompareList([...compareList, carId]);
    }
  };

  const refreshProfile = async () => {
    if (!token) return;
    try {
      const res = await fetch('https://8f720c5e353cdf2b-154-206-18-162.serveousercontent.com/api/auth/profile', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        const updatedUser = {
          id: data.id,
          email: data.email,
          name: data.name,
          role: data.role,
          phoneNumber: data.phoneNumber || undefined,
          avatarUrl: data.avatarUrl || undefined,
          idVerificationStatus: data.idVerificationStatus,
          idVerificationComments: data.idVerificationComments || undefined
        };
        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
      }
    } catch (err) {
      console.error('Error refreshing profile:', err);
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      token,
      darkMode,
      wishlist,
      compareList,
      login,
      logout,
      toggleDarkMode,
      toggleWishlist,
      toggleCompare,
      refreshProfile,
      loading
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
