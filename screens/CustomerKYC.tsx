
import React, { useState, useRef } from 'react';
import { Icons } from '../constants';
import { kycService } from '../services/supabaseService';
import { User } from '../types';

interface CustomerKYCProps {
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

export const CustomerKYC: React.FC<CustomerKYCProps> = ({ user, onBack, onSuccess }) => {
  const [form, setForm] = useState({
    fullName: '',
    dob: '',
    gender: 'Male',
    address: ''
  });

  const [files, setFiles] = useState<{
    aadhaarFront: File | null,
    aadhaarBack: File | null,
    selfie: File | null
  }>({
    aadhaarFront: null,
    aadhaarBack: null,
    selfie: null
  });

  const [submitting, setSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async () => {
    if (!form.fullName || !form.dob || !form.address) {
      alert("Please fill all text fields.");
      return;
    }
    if (!files.aadhaarFront || !files.aadhaarBack || !files.selfie) {
      alert("Please upload all required documents.");
      return;
    }

    setSubmitting(true);

    try {
      const uploadPromises = [
        kycService.uploadFile(user.id, files.aadhaarFront, 'aadhaar_front', 'kyc-customer'),
        kycService.uploadFile(user.id, files.aadhaarBack, 'aadhaar_back', 'kyc-customer'),
        kycService.uploadFile(user.id, files.selfie, 'selfie', 'kyc-customer')
      ];

      const [aadhaarFrontUrl, aadhaarBackUrl, selfieUrl] = await Promise.all(uploadPromises);

      const dbPayload = {
        user_id: user.id,
        full_name: form.fullName,
        dob: form.dob,
        gender: form.gender,
        address: form.address,
        aadhaar_front_url: aadhaarFrontUrl,
        aadhaar_back_url: aadhaarBackUrl,
        selfie_url: selfieUrl,
        status: 'pending'
      };

      await kycService.submitCustomerKYC(dbPayload);
      setIsSuccess(true);
      
      // Auto redirect after 2 seconds
      setTimeout(() => {
        onSuccess();
      }, 2000);
      
    } catch (err) {
      console.error("KYC Submit Error", err);
      alert("Failed to submit verification details. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] animate-in zoom-in duration-500 p-8">
        <div className="w-32 h-32 bg-[var(--color-success)]/10 rounded-full flex items-center justify-center mb-8 animate-pulse">
          <div className="w-20 h-20 bg-[var(--color-success)] rounded-full flex items-center justify-center shadow-xl shadow-[var(--color-success)]/30 transform transition-transform hover:scale-110">
            <Icons.Check className="w-10 h-10 text-white" strokeWidth={3} />
          </div>
        </div>
        <h2 className="text-3xl font-black italic uppercase text-main mb-2 tracking-tighter">Submitted!</h2>
        <p className="text-muted font-bold uppercase text-[10px] tracking-widest text-center mb-8">
          Your documents are being reviewed.<br/>Redirecting...
        </p>
         <button 
          onClick={onSuccess}
          className="w-full bg-surface-alt text-main py-4 rounded-[24px] font-black text-xs uppercase tracking-widest border border-subtle hover:bg-[var(--color-primary)]/10 transition-all"
        >
          Return to Profile
        </button>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8 animate-in slide-in-from-bottom-8 pb-32">
      <button onClick={onBack} className="text-muted text-[10px] font-black uppercase tracking-widest hover:text-main">← Back to Profile</button>
      
      <div className="space-y-2">
        <h2 className="text-3xl font-black italic uppercase text-main tracking-tighter">Customer KYC</h2>
        <p className="text-muted text-xs font-medium">Verify your identity to join our community.</p>
      </div>
      
      <div className="space-y-10">
        <div className="space-y-4">
          <h3 className="text-[10px] font-black uppercase tracking-widest text-[var(--color-primary)]">Personal Details</h3>
          <div className="space-y-3">
            <input 
              value={form.fullName} 
              onChange={e => setForm({...form, fullName: e.target.value})} 
              placeholder="Full Legal Name" 
              className="w-full bg-surface-alt p-5 rounded-[24px] font-bold text-main border border-subtle outline-none focus:border-[var(--color-primary)]" 
            />
            <div className="flex gap-4">
              <input 
                type="date"
                value={form.dob} 
                onChange={e => setForm({...form, dob: e.target.value})} 
                className="w-full bg-surface-alt p-5 rounded-[24px] font-bold text-main border border-subtle outline-none focus:border-[var(--color-primary)]" 
              />
              <select 
                value={form.gender} 
                onChange={e => setForm({...form, gender: e.target.value})} 
                className="w-full bg-surface-alt p-5 rounded-[24px] font-bold text-main border border-subtle outline-none focus:border-[var(--color-primary)]"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <textarea 
              value={form.address} 
              onChange={e => setForm({...form, address: e.target.value})} 
              placeholder="Permanent Address" 
              rows={3}
              className="w-full bg-surface-alt p-5 rounded-[24px] font-bold text-main border border-subtle outline-none focus:border-[var(--color-primary)] resize-none" 
            />
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-[10px] font-black uppercase tracking-widest text-[var(--color-primary)]">Aadhaar Card</h3>
          <div className="grid grid-cols-2 gap-4">
            <FileUploadField 
              label="Front Side" 
              icon={<Icons.Shield className="w-4 h-4" />} 
              selectedFile={files.aadhaarFront}
              onFileSelect={(file) => setFiles({...files, aadhaarFront: file})} 
            />
            <FileUploadField 
              label="Back Side" 
              icon={<Icons.Shield className="w-4 h-4" />} 
              selectedFile={files.aadhaarBack}
              onFileSelect={(file) => setFiles({...files, aadhaarBack: file})} 
            />
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-[10px] font-black uppercase tracking-widest text-[var(--color-primary)]">Profile Photo</h3>
          <FileUploadField 
            label="Take a Selfie" 
            icon={<Icons.User className="w-4 h-4" />} 
            selectedFile={files.selfie}
            onFileSelect={(file) => setFiles({...files, selfie: file})} 
          />
        </div>

        <button 
          onClick={handleSubmit}
          disabled={submitting}
          className="w-full bg-[var(--color-primary)] text-white py-6 rounded-[30px] font-black text-xs uppercase tracking-widest shadow-2xl flex items-center justify-center gap-3"
        >
          {submitting ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Submit KYC'}
        </button>
      </div>
    </div>
  );
};
    