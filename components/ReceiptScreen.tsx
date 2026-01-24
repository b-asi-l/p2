import React from 'react';
import { Icons } from '../constants';
import { Booking } from '../types';

interface ReceiptScreenProps {
  booking: Booking;
  onHome: () => void;
}

export const ReceiptScreen: React.FC<ReceiptScreenProps> = ({ booking, onHome }) => {
  return (
    <div className="min-h-[80vh] flex flex-col justify-center animate-in slide-in-from-bottom-8">
      <div className="bg-main p-1 rounded-[48px] shadow-2xl relative">
        <div className="bg-surface p-8 md:p-10 rounded-[44px] space-y-10 overflow-hidden">
          <div className="flex justify-between items-start border-b border-subtle pb-8">
            <div className="flex items-center gap-3">
              <div className="bg-[var(--color-primary)] p-2 rounded-xl text-white"><Icons.Car /></div>
              <span className="font-black text-xl italic uppercase tracking-tighter text-main">RIDEva</span>
            </div>
            <div className="text-right">
              <p className="text-[8px] font-black uppercase text-muted tracking-widest mb-1">Receipt ID</p>
              <p className="text-[10px] font-black text-main">{booking.transactionId}</p>
            </div>
          </div>

          <div className="space-y-6">
            <div className="flex flex-col gap-1">
              <p className="text-[8px] font-black uppercase text-muted tracking-widest">Route</p>
              <p className="text-sm font-bold text-main uppercase italic">{booking.from.split(',')[0]} → {booking.to.split(',')[0]}</p>
            </div>
            
            <div className="grid grid-cols-2 gap-8">
              <div>
                <p className="text-[8px] font-black uppercase text-muted tracking-widest">Amount Paid</p>
                <p className="text-2xl font-black italic text-[var(--color-primary)]">₹{booking.amount}</p>
              </div>
              <div>
                <p className="text-[8px] font-black uppercase text-muted tracking-widest">Payment Method</p>
                <p className="text-xs font-black text-main uppercase tracking-widest">{booking.method}</p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-center py-6 border-t border-subtle">
             <div className="bg-white p-3 rounded-2xl shadow-inner border border-slate-100">
                <img 
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${booking.transactionId}`} 
                  alt="QR Code"
                  className="w-24 h-24 opacity-90 mix-blend-multiply"
                />
             </div>
          </div>

          <div className="text-center">
            <p className="text-[8px] font-black uppercase text-muted tracking-[0.2em]">Thank you for pooling in Kerala!</p>
          </div>
        </div>

        {/* Tickets visual edges - using dynamic app background color */}
        <div className="absolute left-0 top-[60%] -translate-y-1/2 w-6 h-12 bg-app rounded-r-full -ml-3 border-r border-subtle"></div>
        <div className="absolute right-0 top-[60%] -translate-y-1/2 w-6 h-12 bg-app rounded-l-full -mr-3 border-l border-subtle"></div>
      </div>

      <div className="mt-12 space-y-4">
        <button 
          onClick={onHome}
          className="w-full bg-[var(--color-primary)] text-white py-6 rounded-[30px] font-black text-xs uppercase tracking-widest shadow-2xl transition-all active:scale-95"
        >
          Back to Dashboard
        </button>
      </div>
    </div>
  );
};