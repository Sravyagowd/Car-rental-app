'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '@/config';
import { 
  ShieldCheck, 
  ShieldAlert, 
  FileText, 
  User, 
  Sparkles,
  RefreshCw,
  Clock
} from 'lucide-react';

export default function VerificationPage() {
  const { user, token, refreshProfile } = useAuth();
  
  const frontImage = 'https://images.unsplash.com/photo-1554415707-6e8cfc93fe23?w=600';
  const backImage = 'https://images.unsplash.com/photo-1554415707-6e8cfc93fe23?w=600';
  const selfieImage = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300';
  const govtIdImage = 'https://images.unsplash.com/photo-1554415707-6e8cfc93fe23?w=600';

  // Form OCR states
  const [extractedDl, setExtractedDl] = useState('');
  const [extractedName, setExtractedName] = useState('');
  const [extractedDob, setExtractedDob] = useState('');
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrDone, setOcrDone] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    if (token) {
      refreshProfile();
    }
  }, [token, refreshProfile]);

  const triggerOcrReading = async () => {
    setOcrLoading(true);
    setErrorMsg('');
    try {
      const res = await fetch(`${API_BASE_URL}/api/ai/ocr-license`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ imageUrl: frontImage })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      
      setExtractedDl(data.extractedData.licenseNumber);
      setExtractedName(data.extractedData.name);
      setExtractedDob(data.extractedData.dob);
      setOcrDone(true);
    } catch (err) {
      const error = err as Error;
      setErrorMsg(error.message || 'AI OCR analysis failed');
    } finally {
      setOcrLoading(false);
    }
  };

  const handleSubmitDocuments = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setSubmitting(true);

    try {
      // 1. Submit Front DL
      await fetch(`${API_BASE_URL}/api/documents/upload`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ type: 'DRIVING_LICENSE_FRONT', fileUrl: frontImage })
      });

      // 2. Submit Back DL
      await fetch(`${API_BASE_URL}/api/documents/upload`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ type: 'DRIVING_LICENSE_BACK', fileUrl: backImage })
      });

      // 3. Submit Selfie
      await fetch(`${API_BASE_URL}/api/documents/upload`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ type: 'DRIVING_LICENSE_SELFIE', fileUrl: selfieImage })
      });

      // 4. Submit Gov ID
      await fetch(`${API_BASE_URL}/api/documents/upload`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ type: 'GOVT_ID', fileUrl: govtIdImage })
      });

      setSuccessMsg('Your verification documents have been uploaded successfully. Admin review is pending.');
      await refreshProfile();
    } catch (err) {
      const error = err as Error;
      setErrorMsg(error.message || 'Document submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (!user) {
    return (
      <div className="h-96 flex flex-col items-center justify-center space-y-4">
        <p className="text-muted-foreground font-semibold text-sm">Please sign in to view and upload driving verification documents.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">Driving Verification Center</h1>
        <p className="text-sm text-muted-foreground mt-1">Upload required Indian road compliance documents to activate booking capability.</p>
      </div>

      {/* VERIFICATION STATUS ALERT BOXES */}
      {user.idVerificationStatus === 'APPROVED' && (
        <div className="p-6 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 rounded-2xl flex items-start gap-4">
          <ShieldCheck className="w-8 h-8 flex-shrink-0" />
          <div className="space-y-1">
            <h3 className="font-extrabold text-base">Verification Approved</h3>
            <p className="text-xs md:text-sm">
              Your driving license and ID are fully approved. You are ready to configure and book cars on our platform.
            </p>
          </div>
        </div>
      )}

      {user.idVerificationStatus === 'PENDING' && (
        <div className="p-6 bg-amber-500/10 border border-amber-500/20 text-amber-600 rounded-2xl flex items-start gap-4 animate-pulse">
          <Clock className="w-8 h-8 flex-shrink-0" />
          <div className="space-y-1">
            <h3 className="font-extrabold text-base">Review In Progress</h3>
            <p className="text-xs md:text-sm">
              Your documents have been submitted and are being verified. Review is typically completed within 10 minutes.
            </p>
          </div>
        </div>
      )}

      {user.idVerificationStatus === 'REJECTED' && (
        <div className="p-6 bg-red-500/10 border border-red-500/20 text-red-500 rounded-2xl flex items-start gap-4">
          <ShieldAlert className="w-8 h-8 flex-shrink-0" />
          <div className="space-y-1">
            <h3 className="font-extrabold text-base">Verification Rejected</h3>
            <p className="text-xs md:text-sm">
              Reason: {user.idVerificationComments || 'Unclear driving license photo. Please re-upload clean documents.'}
            </p>
          </div>
        </div>
      )}

      {/* UPLOAD FORM (Only show if NOT APPROVED or PENDING) */}
      {user.idVerificationStatus !== 'APPROVED' && user.idVerificationStatus !== 'PENDING' && (
        <form onSubmit={handleSubmitDocuments} className="space-y-8 bg-card border border-border p-8 rounded-2xl shadow-sm">
          {errorMsg && (
            <div className="p-3 text-xs bg-red-500/10 text-red-500 border border-red-500/20 rounded-lg">{errorMsg}</div>
          )}
          {successMsg && (
            <div className="p-3 text-xs bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 rounded-lg">{successMsg}</div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Driving License Front */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-orange-500" /> Driving License (Front)
              </label>
              <div className="p-6 border border-dashed border-border rounded-2xl text-center space-y-4">
                <img src={frontImage} className="w-40 h-24 object-cover mx-auto rounded-lg shadow-sm" alt="DL Front" />
                <button
                  type="button"
                  onClick={triggerOcrReading}
                  disabled={ocrLoading}
                  className="mx-auto px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-bold shadow-md flex items-center gap-1 cursor-pointer"
                >
                  {ocrLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                  Extract DL Details with AI OCR
                </button>
              </div>
            </div>

            {/* Driving License Back */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-orange-500" /> Driving License (Back)
              </label>
              <div className="p-6 border border-dashed border-border rounded-2xl text-center space-y-4">
                <img src={backImage} className="w-40 h-24 object-cover mx-auto rounded-lg shadow-sm" alt="DL Back" />
                <span className="text-[10px] text-muted-foreground block font-semibold">Ready for upload</span>
              </div>
            </div>

            {/* Selfie with DL */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <User className="w-4 h-4 text-orange-500" /> Selfie Holding License
              </label>
              <div className="p-6 border border-dashed border-border rounded-2xl text-center space-y-4">
                <img src={selfieImage} className="w-24 h-24 object-cover rounded-full mx-auto shadow-sm" alt="Selfie" />
                <span className="text-[10px] text-muted-foreground block font-semibold">Face must match DL portrait</span>
              </div>
            </div>

            {/* Govt ID */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-orange-500" /> Aadhaar or Government ID
              </label>
              <div className="p-6 border border-dashed border-border rounded-2xl text-center space-y-4">
                <img src={govtIdImage} className="w-40 h-24 object-cover mx-auto rounded-lg shadow-sm" alt="Aadhaar" />
                <span className="text-[10px] text-muted-foreground block font-semibold">Aadhaar front card</span>
              </div>
            </div>
          </div>

          {/* AI OCR Extracted Fields Display */}
          {ocrDone && (
            <div className="p-6 bg-orange-500/5 border border-orange-500/10 rounded-2xl space-y-4">
              <h3 className="text-xs font-extrabold uppercase tracking-widest text-orange-500 flex items-center gap-1">
                <Sparkles className="w-4 h-4 animate-pulse" /> AI OCR Parsed License Parameters
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs font-semibold text-foreground">
                <div>
                  <span className="block text-[9px] uppercase text-muted-foreground">DL Number</span>
                  <input
                    type="text"
                    value={extractedDl}
                    onChange={e => setExtractedDl(e.target.value)}
                    className="w-full mt-1 bg-background border border-border p-2 rounded-lg font-bold"
                  />
                </div>
                <div>
                  <span className="block text-[9px] uppercase text-muted-foreground">Full Name (Matches DL)</span>
                  <input
                    type="text"
                    value={extractedName}
                    onChange={e => setExtractedName(e.target.value)}
                    className="w-full mt-1 bg-background border border-border p-2 rounded-lg font-bold"
                  />
                </div>
                <div>
                  <span className="block text-[9px] uppercase text-muted-foreground">Date of Birth</span>
                  <input
                    type="text"
                    value={extractedDob}
                    onChange={e => setExtractedDob(e.target.value)}
                    className="w-full mt-1 bg-background border border-border p-2 rounded-lg font-bold"
                  />
                </div>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl text-sm transition-all duration-300 shadow-md flex items-center justify-center gap-1.5"
          >
            {submitting ? 'Submitting Documents...' : 'Submit Verification Package'}
          </button>
        </form>
      )}
    </div>
  );
}
