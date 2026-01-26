
import React, { useState, useEffect } from 'react';
import { Icons } from '../constants';
import { kycService } from '../services/firebaseService';

interface AdminKYCPanelProps {
  onBack: () => void;
}

const KYCItem = ({ data, type, onAction }: { data: any, type: 'customer' | 'driver', onAction: (id: string, status: 'approved' | 'rejected') => void }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-surface border border-subtle rounded-[32px] overflow-hidden card-shadow mb-4">
      <div className="p-6 flex justify-between items-center cursor-pointer" onClick={() => setExpanded(!expanded)}>
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-surface-alt flex items-center justify-center border border-subtle">
            <img src={data.selfie_url} className="w-full h-full object-cover rounded-2xl" alt="Selfie" />
          </div>
          <div>
            <p className="text-xs font-black uppercase text-main">{data.full_name}</p>
            <p className="text-[8px] font-bold text-muted uppercase tracking-widest">{type === 'customer' ? 'Customer Profile' : 'Driver Application'}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={(e) => { e.stopPropagation(); onAction(data.id, 'rejected'); }}
            className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all"
          >
            <Icons.Plus className="w-5 h-5 rotate-45" />
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); onAction(data.id, 'approved'); }}
            className="w-10 h-10 rounded-xl bg-green-500/10 text-green-500 flex items-center justify-center hover:bg-green-500 hover:text-white transition-all"
          >
            <Icons.Check className="w-5 h-5" />
          </button>
        </div>
      </div>

      {expanded && (
        <div className="px-6 pb-6 border-t border-subtle pt-4 space-y-6 animate-in slide-in-from-top-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-[8px] font-black uppercase text-muted tracking-widest mb-1">DOB</p>
              <p className="text-[10px] font-bold text-main">{data.dob}</p>
            </div>
            <div>
              <p className="text-[8px] font-black uppercase text-muted tracking-widest mb-1">Gender</p>
              <p className="text-[10px] font-bold text-main">{data.gender}</p>
            </div>
          </div>
          
          <div>
            <p className="text-[8px] font-black uppercase text-muted tracking-widest mb-1">Address</p>
            <p className="text-[10px] font-bold text-main leading-relaxed">{data.address}</p>
          </div>

          <div className="space-y-4">
            <p className="text-[10px] font-black uppercase text-[var(--color-primary)] tracking-widest">Document Verification</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <p className="text-[7px] font-black uppercase text-muted">Aadhaar Front</p>
                <div className="aspect-video rounded-xl bg-surface-alt border border-subtle overflow-hidden">
                   <img src={data.aadhaar_front_url} className="w-full h-full object-cover" onClick={() => window.open(data.aadhaar_front_url)} />
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-[7px] font-black uppercase text-muted">Aadhaar Back</p>
                <div className="aspect-video rounded-xl bg-surface-alt border border-subtle overflow-hidden">
                   <img src={data.aadhaar_back_url} className="w-full h-full object-cover" onClick={() => window.open(data.aadhaar_back_url)} />
                </div>
              </div>
              
              {type === 'driver' && (
                <>
                  <div className="space-y-1">
                    <p className="text-[7px] font-black uppercase text-muted">DL Front</p>
                    <div className="aspect-video rounded-xl bg-surface-alt border border-subtle overflow-hidden">
                       <img src={data.dl_front_url} className="w-full h-full object-cover" onClick={() => window.open(data.dl_front_url)} />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[7px] font-black uppercase text-muted">DL Back</p>
                    <div className="aspect-video rounded-xl bg-surface-alt border border-subtle overflow-hidden">
                       <img src={data.dl_back_url} className="w-full h-full object-cover" onClick={() => window.open(data.dl_back_url)} />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[7px] font-black uppercase text-muted">RC Photo</p>
                    <div className="aspect-video rounded-xl bg-surface-alt border border-subtle overflow-hidden">
                       <img src={data.rc_url} className="w-full h-full object-cover" onClick={() => window.open(data.rc_url)} />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[7px] font-black uppercase text-muted">Vehicle Photo</p>
                    <div className="aspect-video rounded-xl bg-surface-alt border border-subtle overflow-hidden">
                       <img src={data.vehicle_url} className="w-full h-full object-cover" onClick={() => window.open(data.vehicle_url)} />
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export const AdminKYCPanel: React.FC<AdminKYCPanelProps> = ({ onBack }) => {
  const [tab, setTab] = useState<'customer' | 'driver'>('customer');
  const [pendingCustomers, setPendingCustomers] = useState<any[]>([]);
  const [pendingDrivers, setPendingDrivers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    const [cust, driv] = await Promise.all([
      kycService.getPendingCustomerKYC(),
      kycService.getPendingDriverKYC()
    ]);
    setPendingCustomers(cust);
    setPendingDrivers(driv);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAction = async (id: string, status: 'approved' | 'rejected', type: 'customer' | 'driver') => {
    const success = type === 'customer' 
      ? await kycService.updateCustomerKYCStatus(id, status)
      : await kycService.updateDriverKYCStatus(id, status);
    
    if (success) {
      alert(`KYC ${status === 'approved' ? 'Verified' : 'Rejected'}`);
      fetchData();
    } else {
      alert("Action failed. Try again.");
    }
  };

  return (
    <div className="p-8 space-y-8 animate-in slide-in-from-right-8 pb-32">
      <div className="flex justify-between items-center">
        <button onClick={onBack} className="text-muted text-[10px] font-black uppercase tracking-widest hover:text-main transition-colors">← Back to Profile</button>
        <div className="bg-[var(--color-primary)]/10 px-4 py-2 rounded-full border border-[var(--color-primary)]/20">
          <p className="text-[9px] font-black text-[var(--color-primary)] uppercase">Administrator</p>
        </div>
      </div>

      <div className="space-y-2">
        <h2 className="text-3xl font-black italic uppercase text-main tracking-tighter">KYC Hub</h2>
        <p className="text-muted text-[10px] font-bold uppercase tracking-widest">Community Verification Dashboard</p>
      </div>

      <div className="flex bg-surface-alt p-1 rounded-2xl border border-subtle">
        <button 
          onClick={() => setTab('customer')}
          className={`flex-1 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${tab === 'customer' ? 'bg-[var(--color-primary)] text-white shadow-lg shadow-[var(--color-primary)]/20' : 'text-muted'}`}
        >
          Customers ({pendingCustomers.length})
        </button>
        <button 
          onClick={() => setTab('driver')}
          className={`flex-1 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${tab === 'driver' ? 'bg-[#EA580C] text-white shadow-lg shadow-[#EA580C]/20' : 'text-muted'}`}
        >
          Drivers ({pendingDrivers.length})
        </button>
      </div>

      <div className="space-y-4">
        {loading ? (
          <div className="py-20 text-center">
            <div className="w-10 h-10 border-4 border-[var(--color-primary)]/20 border-t-[var(--color-primary)] rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-[10px] font-black uppercase text-muted tracking-widest">Refreshing Feed...</p>
          </div>
        ) : (
          <>
            {tab === 'customer' ? (
              pendingCustomers.length > 0 ? (
                pendingCustomers.map(c => <KYCItem key={c.id} data={c} type="customer" onAction={(id, s) => handleAction(id, s, 'customer')} />)
              ) : (
                <div className="py-20 text-center bg-surface-alt rounded-[40px] border border-dashed border-subtle">
                   <Icons.Check className="w-12 h-12 text-[var(--color-primary)]/20 mx-auto mb-4" />
                   <p className="text-[10px] font-black uppercase text-muted tracking-widest">No Pending Customers</p>
                </div>
              )
            ) : (
              pendingDrivers.length > 0 ? (
                pendingDrivers.map(d => <KYCItem key={d.id} data={d} type="driver" onAction={(id, s) => handleAction(id, s, 'driver')} />)
              ) : (
                <div className="py-20 text-center bg-surface-alt rounded-[40px] border border-dashed border-subtle">
                   <Icons.Check className="w-12 h-12 text-[#EA580C]/20 mx-auto mb-4" />
                   <p className="text-[10px] font-black uppercase text-muted tracking-widest">No Pending Drivers</p>
                </div>
              )
            )}
          </>
        )}
      </div>
    </div>
  );
};
