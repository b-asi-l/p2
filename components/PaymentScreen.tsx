
import React, { useState } from 'react';
import { Icons } from '../constants';
import { Trip, User, Booking } from '../types';
import { savePaymentToFirebase } from '../services/firebaseService';

interface PaymentScreenProps {
  trip: Trip;
  user: User;
  onPaymentSuccess: (booking: Booking) => void;
  onBack: () => void;
}

export const PaymentScreen: React.FC<PaymentScreenProps> = ({ trip, user, onPaymentSuccess, onBack }) => {
  const [method, setMethod] = useState<'UPI' | 'CASH' | null>(null);
  const [processing, setProcessing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Requirement: Static Demo Data (₹200 Total, ₹100 Per Person)
  const DEMO_TOTAL = 200;
  const DEMO_PER_PERSON = 100;

  const handlePay = async () => {
    if (!method) return;
    setProcessing(true);

    const booking: Booking = {
      id: 'pay-' + Math.random().toString(36).substr(2, 9),
      tripId: trip.id,
      userId: user.id,
      amount: DEMO_TOTAL,
      perPersonAmount: DEMO_PER_PERSON,
      method: method,
      status: method === 'UPI' ? 'PAID' : 'PENDING',
      timestamp: Date.now(),
      transactionId: 'TXN' + Math.random().toString(36).toUpperCase().substr(2, 6),
      from: trip.from,
      to: trip.to
    };

    // Save to Firebase (Mocked)
    await savePaymentToFirebase(booking);

    setProcessing(false);
    setShowSuccess(true);
    
    // Brief delay to show the success message before switching view
    setTimeout(() => {
      onPaymentSuccess(booking);
    }, 2000);
  };

  if (showSuccess) {
    return (
      <div className="flex flex-col items-center justify-center py-20 animate-in zoom-in duration-300">
        <div className="w-24 h-24 bg-emerald-500 rounded-full flex items-center justify-center shadow-xl shadow-emerald-500/20 mb-8">
          <Icons.Check className="w-12 h-12 text-white" />
        </div>
        <h2 className="text-3xl font-black italic uppercase text-white mb-2">Payment Successful!</h2>
        <p className="text-[#94A3B8] font-bold uppercase text-[10px] tracking-widest">Generating digital receipt...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-8">
      <div className="flex justify-between items-center">
        <button onClick={onBack} className="text-[#94A3B8] text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
          ← Back
        </button>
        <h2 className="text-2xl font-black italic uppercase tracking-tighter">Checkout</h2>
      </div>

      <div className="bg-[#111827] p-8 rounded-[40px] border border-white/5 space-y-6">
        <p className="text-[10px] font-black uppercase tracking-widest text-[#94A3B8]">Cost Distribution</p>
        <div className="space-y-4">
          <div className="flex justify-between items-center text-white font-bold">
            <span className="text-sm">Total Trip Cost</span>
            <span className="text-xl">₹{DEMO_TOTAL}</span>
          </div>
          <div className="flex justify-between items-center bg-[#0B1220] p-4 rounded-2xl border border-[#2DD4BF]/20">
            <span className="text-xs text-[#2DD4BF] font-black uppercase">Your Shared Cost</span>
            <span className="text-lg font-black text-[#2DD4BF]">₹{DEMO_PER_PERSON}</span>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <p className="text-[10px] font-black uppercase tracking-widest text-[#94A3B8] ml-4">Select Payment Method</p>
        <div className="grid grid-cols-1 gap-3">
          <button 
            disabled={processing}
            onClick={() => setMethod('UPI')}
            className={`p-6 rounded-[32px] border flex items-center justify-between transition-all ${method === 'UPI' ? 'bg-[#2DD4BF]/10 border-[#2DD4BF]' : 'bg-[#111827] border-white/5'}`}
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-white/5 rounded-2xl flex items-center justify-center text-[#2DD4BF]"><Icons.Wallet /></div>
              <div className="text-left">
                <p className="text-white font-black text-xs uppercase tracking-widest">Pay via UPI</p>
                <p className="text-[8px] font-bold text-[#94A3B8] uppercase">Instant Verification</p>
              </div>
            </div>
            {method === 'UPI' && <div className="w-2.5 h-2.5 bg-[#2DD4BF] rounded-full shadow-lg"></div>}
          </button>

          <button 
            disabled={processing}
            onClick={() => setMethod('CASH')}
            className={`p-6 rounded-[32px] border flex items-center justify-between transition-all ${method === 'CASH' ? 'bg-[#2DD4BF]/10 border-[#2DD4BF]' : 'bg-[#111827] border-white/5'}`}
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-white/5 rounded-2xl flex items-center justify-center text-[#2DD4BF]"><Icons.Home /></div>
              <div className="text-left">
                <p className="text-white font-black text-xs uppercase tracking-widest">Hand Cash</p>
                <p className="text-[8px] font-bold text-[#94A3B8] uppercase">Pay in Person</p>
              </div>
            </div>
            {method === 'CASH' && <div className="w-2.5 h-2.5 bg-[#2DD4BF] rounded-full shadow-lg"></div>}
          </button>
        </div>
      </div>

      <button 
        disabled={!method || processing}
        onClick={handlePay}
        className={`w-full py-6 rounded-[30px] font-black text-xs uppercase tracking-widest shadow-2xl transition-all active:scale-95 flex items-center justify-center gap-3 ${method && !processing ? 'bg-[#2DD4BF] text-white' : 'bg-white/5 text-[#94A3B8]'}`}
      >
        {processing ? (
          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
        ) : (
          `Pay ₹${DEMO_PER_PERSON}`
        )}
      </button>
    </div>
  );
};
