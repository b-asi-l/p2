
import React, { useState, useRef } from 'react';
import { Icons } from '../constants';
import { kycService } from '../services/firebaseService';
import { User } from '../types';

interface DriverKYCProps {
  user: User;
  onBack: () => void;
  onSuccess: () => void;
}

const FileUploadField = ({ label, icon, selectedFile, onFileSelect }: { label: string, icon: React.ReactNode, selectedFile: File | null, onFileSelect: (file: File) => void }) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleClick = () => {
    inputRef.current?.click();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onFileSelect(e.target.files[0]);
    }
  };

  return (
    <div onClick={handleClick} className={`flex items-center justify-between p-4 bg-surface-alt border border-subtle rounded-2xl group hover:border-[var(--color-primary)] transition-all cursor-pointer ${selectedFile ? 'border-[var(--color-success)] bg-[var(--color-success)]/5' : ''}`}>
      <input 
        type="file" 
        ref={inputRef} 
        onChange={handleChange} 
        className="hidden" 
        accept="image/*"
      />
      <div className="flex items-center gap-3 overflow-hidden">
        <div className={`${selectedFile ? 'text-[var(--color-success)]' : 'text-muted'} group-hover:text-[var(--color-primary)] transition-colors`}>{icon}</div>
        <div className="flex flex-col overflow-hidden">
          <span className="text-xs font-bold text-main truncate max-w-[150px]">{selectedFile ? selectedFile.name : label}</span>
          {selectedFile && <span className="text-[8px] font-bold text-[var(--color-success)] uppercase">Selected</span>}
        </div>
      </div>
      <div className={`text-[10px] font-black uppercase ${selectedFile ? 'text-[var(--color-success)]' : 'text-[var(--color-primary)] opacity-50'} group-hover:opacity-100 transition-opacity`}>
        {selectedFile ? 'Change' : 'Upload'}
      </div>
    </div>
  );
};

export const DriverKYC: React.FC<DriverKYCProps> = ({ user, onBack, onSuccess }) => {
  const [form, setForm] = useState({
    fullName: '',
    dob: '',
    gender: 'Male',
    address: '',
    regNumber: ''
  });

  const [files, setFiles] = useState<{
    aadhaarFront: File | null,
    aadhaarBack: File | null,
    selfie: File | null,
    dlFront: File | null,
    dlBack: File | null,
    rcFront: File | null,
    vehiclePhoto: File | null
  }>({
    aadhaarFront: null,
    aadhaarBack: null,
    selfie: null,
    dlFront: null,
    dlBack: null,
    rcFront: null,
    vehiclePhoto: null
  });

  const [submitting, setSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async () => {
    if (!form.fullName || !form.dob || !form.address || !form.regNumber) {
      alert("Please fill all text fields.");
      return;
    }
    if (!files.aadhaarFront || !files.aadhaarBack || !files.selfie || !files.dlFront || !files.dlBack || !files.rcFront || !files.vehiclePhoto) {
      alert("Please upload all required documents.");
      return;
    }

    setSubmitting(true);

    try {
      // Logic for uploading all files to 'kyc-driver' bucket
      const uploadPromises = [
        kycService.uploadFile(user.id, files.aadhaarFront, 'aadhaar_front', 'kyc-driver'),
        kycService.uploadFile(user.id, files.aadhaarBack, 'aadhaar_back', 'kyc-driver'),
        kycService.uploadFile(user.id, files.selfie, 'selfie', 'kyc-driver'),
        kycService.uploadFile(user.id, files.dlFront, 'dl_front', 'kyc-driver'),
        kycService.uploadFile(user.id, files.dlBack, 'dl_back', 'kyc-driver'),
        kycService.uploadFile(user.id, files.rcFront, 'rc_front', 'kyc-driver'),
        kycService.uploadFile(user.id, files.vehiclePhoto, 'vehicle_photo', 'kyc-driver')
      ];

      const [aadhaarFrontUrl, aadhaarBackUrl, selfieUrl, dlFrontUrl, dlBackUrl, rcUrl, vehicleUrl] = await Promise.all(uploadPromises);

      const dbPayload = {
        user_id: user.id,
        full_name: form.fullName,
        dob: form.dob,
        gender: form.gender,
        address: form.address,
        registration_number: form.regNumber,
        aadhaar_front_url: aadhaarFrontUrl,
        aadhaar_back_url: aadhaarBackUrl,
        selfie_url: selfieUrl,
        dl_front_url: dlFrontUrl,
        dl_back_url: dlBackUrl,
        rc_url: rcUrl,
        vehicle_photo_url: vehicleUrl,
        status: 'pending'
      };

      await kycService.submitDriverKYC(dbPayload);
      setIsSuccess(true);
      
      setTimeout(() => {
        onSuccess();
      }, 2500);
      
    } catch (err) {
      console.error("Driver KYC Submit Error", err);
      alert("Failed to submit verification details. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] animate-in zoom-in duration-500 p-8">
        <div className="w-32 h-32 bg-[var(--color-primary)]/10 rounded-full flex items-center justify-center mb-8 animate-pulse">
          <div className="w-20 h-20 bg-[var(--color-primary)] rounded-full flex items-center justify-center shadow-xl shadow-[var(--color-primary)]/30">
            <Icons.Check className="w-10 h-10 text-white" strokeWidth={3} />
          </div>
        </div>
        <h2 className="text-3xl font-black italic uppercase text-main mb-2 tracking-tighter text-center">Driver KYC Submitted</h2>
        <p className="text-muted font-bold uppercase text-[10px] tracking-widest text-center mb-8">
          Verification Under Review.<br/>Redirecting to Profile...
        </p>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8 animate-in slide-in-from-right-8 pb-32">
      <button onClick={onBack} className="text-muted text-[10px] font-black uppercase tracking-widest hover:text-main flex items-center gap-2">
        <Icons.Plus className="w-3 h-3 rotate-45" /> Back to Profile
      </button>
      
      <div className="space-y-2">
        <h2 className="text-3xl font-black italic uppercase text-main tracking-tighter">Driver Verification</h2>
        <p className="text-muted text-xs font-medium">Register your vehicle to start offering rides.</p>
      </div>
      
      <div className="space-y-10">
        {/* Section: Personal Details */}
        <div className="space-y-4">
          <h3 className="text-[10px] font-black uppercase tracking-widest text-[var(--color-primary)]">1. Personal Information</h3>
          <div className="space-y-3">
            <input 
              value={form.fullName} 
              onChange={e => setForm({...form, fullName: e.target.value})} 
              placeholder="Full Legal Name (as on DL)" 
              className="w-full bg-surface-alt p-5 rounded-[24px] font-bold text-main border border-subtle outline-none focus:border-[var(--color-primary)]" 
            />
            <div className="flex gap-4">
              <div className="flex-1 space-y-1">
                <p className="text-[8px] font-black uppercase text-muted ml-4">Date of Birth</p>
                <input 
                  type="date"
                  value={form.dob} 
                  onChange={e => setForm({...form, dob: e.target.value})} 
                  className="w-full bg-surface-alt p-5 rounded-[24px] font-bold text-main border border-subtle outline-none focus:border-[var(--color-primary)]" 
                />
              </div>
              <div className="flex-1 space-y-1">
                <p className="text-[8px] font-black uppercase text-muted ml-4">Gender</p>
                <select 
                  value={form.gender} 
                  onChange={e => setForm({...form, gender: e.target.value})} 
                  className="w-full bg-surface-alt p-5 rounded-[24px] font-bold text-main border border-subtle outline-none focus:border-[var(--color-primary)] h-full"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>
            <textarea 
              value={form.address} 
              onChange={e => setForm({...form, address: e.target.value})} 
              placeholder="Full Address" 
              rows={3}
              className="w-full bg-surface-alt p-5 rounded-[24px] font-bold text-main border border-subtle outline-none focus:border-[var(--color-primary)] resize-none" 
            />
          </div>
        </div>

        {/* Section: Aadhaar */}
        <div className="space-y-4">
          <h3 className="text-[10px] font-black uppercase tracking-widest text-[var(--color-primary)]">2. Identity (Aadhaar)</h3>
          <div className="grid grid-cols-2 gap-4">
            <FileUploadField 
              label="Aadhaar Front" 
              icon={<Icons.Shield className="w-4 h-4" />} 
              selectedFile={files.aadhaarFront}
              onFileSelect={(file) => setFiles({...files, aadhaarFront: file})} 
            />
            <FileUploadField 
              label="Aadhaar Back" 
              icon={<Icons.Shield className="w-4 h-4" />} 
              selectedFile={files.aadhaarBack}
              onFileSelect={(file) => setFiles({...files, aadhaarBack: file})} 
            />
          </div>
        </div>

        {/* Section: Driving License */}
        <div className="space-y-4">
          <h3 className="text-[10px] font-black uppercase tracking-widest text-[var(--color-primary)]">3. Driving License</h3>
          <div className="grid grid-cols-2 gap-4">
            <FileUploadField 
              label="DL Front" 
              icon={<Icons.Car className="w-4 h-4" />} 
              selectedFile={files.dlFront}
              onFileSelect={(file) => setFiles({...files, dlFront: file})} 
            />
            <FileUploadField 
              label="DL Back" 
              icon={<Icons.Car className="w-4 h-4" />} 
              selectedFile={files.dlBack}
              onFileSelect={(file) => setFiles({...files, dlBack: file})} 
            />
          </div>
        </div>

        {/* Section: Vehicle & RC */}
        <div className="space-y-4">
          <h3 className="text-[10px] font-black uppercase tracking-widest text-[var(--color-primary)]">4. Vehicle Documents</h3>
          <input 
            value={form.regNumber} 
            onChange={e => setForm({...form, regNumber: e.target.value})} 
            placeholder="Vehicle Registration Number (e.g. KL 01 AB 1234)" 
            className="w-full bg-surface-alt p-5 rounded-[24px] font-bold text-main border border-subtle outline-none focus:border-[var(--color-primary)] mb-3" 
          />
          <div className="grid grid-cols-2 gap-4">
            <FileUploadField 
              label="RC Smartcard" 
              icon={<Icons.History className="w-4 h-4" />} 
              selectedFile={files.rcFront}
              onFileSelect={(file) => setFiles({...files, rcFront: file})} 
            />
            <FileUploadField 
              label="Vehicle Photo" 
              icon={<Icons.Car className="w-4 h-4" />} 
              selectedFile={files.vehiclePhoto}
              onFileSelect={(file) => setFiles({...files, vehiclePhoto: file})} 
            />
          </div>
        </div>

        {/* Section: Selfie */}
        <div className="space-y-4">
          <h3 className="text-[10px] font-black uppercase tracking-widest text-[var(--color-primary)]">5. Confirmation</h3>
          <FileUploadField 
            label="Selfie for Verification" 
            icon={<Icons.User className="w-4 h-4" />} 
            selectedFile={files.selfie}
            onFileSelect={(file) => setFiles({...files, selfie: file})} 
          />
        </div>

        <button 
          onClick={handleSubmit}
          disabled={submitting}
          className="w-full bg-[var(--color-primary)] text-white py-6 rounded-[30px] font-black text-xs uppercase tracking-widest shadow-2xl flex items-center justify-center gap-3 transition-all active:scale-95 mb-8"
        >
          {submitting ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>Submit for Review <Icons.Check className="w-4 h-4" /></>
          )}
        </button>
      </div>
    </div>
  );
};
