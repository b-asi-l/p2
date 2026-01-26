
import React from 'react';
import { Icons } from '../constants';
import { Booking } from '../types';

interface ReceiptScreenProps {
  booking: Booking;
  onHome: () => void;
  onChat: () => void;
}

export const ReceiptScreen: React.FC<ReceiptScreenProps> = ({ booking, onHome, onChat }) => {
  return (
    <div className="min-h-[80vh] flex flex-col justify-center animate-in slide-in-from-bottom-8 p-8">
      <div className="bg-main p-1 rounded-[48px] shadow-2xl relative">
        <div className="bg-surface p-8 md:p-10 rounded-[44px] space-y-10 overflow-hidden">
          
          {/* Header */}
          <div className="flex justify-between items-start border-b border-subtle pb-8">
            <div className="flex items-center gap-3">
              <Icons.Logo className="w-10 h-10" />
              <span className="font-black text-xl italic uppercase tracking-tighter text-[var(--color-primary)]">RIDEva</span>
            </div>
            <div className="text-right">
              <p className="text-[8px] font-black uppercase text-muted tracking-widest mb-1">Receipt ID</p>
              <p className="text-[10px] font-black text-main">{booking.transactionId}</p>
            </div>
          </div>

          {/* Pickup & Route Info */}
          <div className="space-y-6">
            <div className="p-5 bg-surface-alt rounded-[32px] border border-subtle space-y-4">
               <div className="flex flex-col gap-1">
                 <p className="text-[8px] font-black uppercase text-[var(--color-primary)] tracking-widest">Precise Pickup Location</p>
                 <div className="flex items-center gap-2">
                   <Icons.Location className="text-[var(--color-accent)] w-4 h-4" />
                   <p className="text-sm font-black text-main uppercase italic">{booking.from}</p>
                 </div>
               </div>
               
               <div className="flex flex-col gap-1 border-t border-subtle/50 pt-4">
                 <p className="text-[8px] font-black uppercase text-muted tracking-widest">Final Destination</p>
                 <p className="text-xs font-bold text-main uppercase italic opacity-70">{booking.to}</p>
               </div>
            </div>
            
            <div className="grid grid-cols-2 gap-8 px-2">
              <div>
                <p className="text-[8px] font-black uppercase text-muted tracking-widest">Amount Paid</p>
                <p className="text-2xl font-black italic text-[var(--color-primary)]">₹{booking.amount}</p>
              </div>
              <div>
                <p className="text-[8px] font-black uppercase text-muted tracking-widest">Payment Method</p>
                <p className="text-xs font-black text-main uppercase">{booking.method}</p>
              </div>
            </div>
          </div>

          {/* Driver Contact Section */}
          <div className="space-y-3 pt-2">
            <p className="text-[8px] font-black uppercase text-muted tracking-widest text-center">Your Driver for this Journey</p>
            <div className="flex items-center justify-between p-4 bg-white border border-subtle rounded-[28px] shadow-sm">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <img 
                    src={booking.ownerAvatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${booking.ownerName}`} 
                    className="w-14 h-14 rounded-2xl border-2 border-[var(--color-primary)]/20 shadow-md"
                    alt="Driver"
                  />
                  <div className="absolute -bottom-1 -right-1 bg-[var(--color-primary)] rounded-full p-1 text-white shadow-lg">
                    <Icons.Check className="w-2 h-2" strokeWidth={4} />
                  </div>
                </div>
                <div>
                  <h4 className="text-xs font-black uppercase text-main tracking-tight">{booking.ownerName}</h4>
                  <p className="text-[9px] font-bold text-[var(--color-primary)] uppercase tracking-widest">Verified Citizen</p>
                  <p className="text-[10px] font-black text-main mt-1">{booking.ownerPhone || "+91 90000 00000"}</p>
                </div>
              </div>
              
              <div className="flex gap-2">
                <button 
                  onClick={onChat}
                  className="w-12 h-12 bg-[var(--color-accent)] text-white rounded-2xl flex items-center justify-center active:scale-90 transition-transform shadow-lg shadow-[var(--color-accent)]/20"
                  title="Chat with Driver"
                >
                  <Icons.MessageCircle className="w-5 h-5" />
                </button>
                <a 
                  href={`tel:${booking.ownerPhone}`} 
                  className="w-12 h-12 bg-[var(--color-primary)] text-white rounded-2xl flex items-center justify-center active:scale-90 transition-transform shadow-lg shadow-[var(--color-primary)]/20"
                  title="Call Driver"
                >
                  <Icons.User className="w-5 h-5" />
                </a>
              </div>
            </div>
          </div>

          {/* QR Code Separator */}
          <div className="flex items-center justify-center py-6 border-t border-dashed border-subtle relative">
             <div className="bg-white p-3 rounded-2xl shadow-inner border border-slate-100 relative z-10">
                <img 
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${booking.transactionId}`} 
                  alt="QR Code"
                  className="w-24 h-24 opacity-80"
                />
             </div>
          </div>

          <div className="text-center">
            <p className="text-[8px] font-black uppercase text-muted tracking-[0.2em]">Thank you for saving Kerala's air!</p>
          </div>
        </div>

        {/* Decorative Ticket Notches */}
        <div className="absolute left-0 top-[72%] -translate-y-1/2 w-6 h-12 bg-[var(--bg-app)] rounded-r-full -ml-3 border-r border-subtle"></div>
        <div className="absolute right-0 top-[72%] -translate-y-1/2 w-6 h-12 bg-[var(--bg-app)] rounded-l-full -mr-3 border-l border-subtle"></div>
      </div>

      <div className="mt-12 space-y-4">
        <button 
          onClick={() => window.print()}
          className="w-full bg-surface-alt text-main py-4 rounded-[24px] font-black text-[10px] uppercase tracking-widest border border-subtle flex items-center justify-center gap-2 hover:bg-[var(--color-primary)]/5 transition-all"
        >
          <Icons.Shield className="w-4 h-4" /> Save PDF Receipt
        </button>
        
        <button 
          onClick={onHome}
          className="w-full bg-[var(--color-primary)] text-white py-6 rounded-[30px] font-black text-xs uppercase tracking-widest shadow-2xl transition-all active:scale-95"
        >
          Return to Hub
        </button>
      </div>
    </div>
  );
};
