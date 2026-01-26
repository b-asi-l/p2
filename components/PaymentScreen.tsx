
import React, { useState } from 'react';
import { Icons } from '../constants';
import { Trip, User, Booking } from '../types';
import { savePayment } from '../services/firebaseService';

interface PaymentScreenProps {
  trip: Trip;
  user: User;
  onPaymentSuccess: (booking: Booking) => void;
  onBack: () => void;
  bookingMessage?: string;
}

export const PaymentScreen: React.FC<PaymentScreenProps> = ({ trip, user, onPaymentSuccess, onBack, bookingMessage }) => {
  const [method, setMethod] = useState<'UPI' | 'CARD' | 'NET_BANKING' | 'CASH' | null>(null);
  const [processing, setProcessing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const DEMO_PER_PERSON = trip.pricePerSeat;

  const handlePay = async () => {
    if (!method) return;
    setProcessing(true);

    const booking: Booking = {
      id: 'pay-' + Math.random().toString(36).substr(2, 9),
      tripId: trip.id,
      userId: user.id,
      amount: DEMO_PER_PERSON,
      perPersonAmount: DEMO_PER_PERSON,
      method: method,
      status: (method === 'UPI' || method === 'CARD' || method === 'NET_BANKING') ? 'PAID' : 'PENDING',
      timestamp: Date.now(),
      transactionId: 'TXN' + Math.random().toString(36).toUpperCase().substr(2, 6),
      from: trip.from,
      to: trip.to,
      ownerName: trip.ownerName,
      ownerPhone: trip.ownerPhone,
      ownerAvatar: trip.ownerAvatar,
      message: bookingMessage
    };

    const success = await savePayment(booking);

    setProcessing(false);
    if (success) {
        setShowSuccess(true);
        setTimeout(() => {
          onPaymentSuccess(booking);
        }, 1500);
    } else {
        alert("Payment failed. Please try again.");
    }
  };

  if (showSuccess) {
    return (
      <div className="flex flex-col items-center justify-center py-20 animate-in zoom-in duration-300">
        <div className="w-24 h-24 bg-[var(--color-success)] rounded-full flex items-center justify-center shadow-xl shadow-[var(--color-success)]/20 mb-8">
          <Icons.Check className="w-12 h-12 text-white" />
        </div>
        <h2 className="text-3xl font-black italic uppercase text-main mb-2">Payment Secure</h2>
        <p className="text-muted font-bold uppercase text-[10px] tracking-widest">Digital receipt secured...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-8">
      <div className="flex justify-between items-center">
        <button onClick={onBack} className="text-muted text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:text-main transition-colors">
          ← Back
        </button>
        <h2 className="text-2xl font-black italic uppercase tracking-tighter text-main">Payment Portal</h2>
      </div>

      <div className="bg-surface p-8 rounded-[40px] border border-subtle card-shadow space-y-4">
        <div className="flex justify-between items-center">
          <span className="text-[10px] font-black uppercase tracking-widest text-muted">Booking Summary</span>
          <span className="text-[10px] font-black uppercase tracking-widest text-[var(--color-primary)]">Verified Ride</span>
        </div>
        <div className="flex justify-between items-center border-t border-subtle pt-4">
          <span className="text-xs text-main font-bold">Contribution Amount</span>
          <span className="text-2xl font-black text-[var(--color-primary)]">₹{DEMO_PER_PERSON}</span>
        </div>
      </div>

      <div className="space-y-4">
        <p className="text-[10px] font-black uppercase tracking-widest text-muted ml-4">Select Method</p>
        <div className="grid grid-cols-1 gap-3">
          {/* UPI Option */}
          <button 
            disabled={processing}
            onClick={() => setMethod('UPI')}
            className={`p-6 rounded-[32px] border flex items-center justify-between transition-all active:scale-95 ${method === 'UPI' ? 'bg-[var(--color-primary)]/10 border-[var(--color-primary)]' : 'bg-surface border-subtle'}`}
          >
            <div className="flex items-center gap-4 text-left">
              <div className="w-10 h-10 bg-surface-alt rounded-2xl flex items-center justify-center text-[var(--color-primary)]"><Icons.Wallet /></div>
              <div>
                <p className="text-main font-black text-xs uppercase tracking-widest">UPI Transfer</p>
                <p className="text-[8px] font-bold text-muted uppercase">Send to {trip.ownerUpiId || `${trip.ownerName.toLowerCase()}@okaxis`}</p>
              </div>
            </div>
          </button>

          {/* Card Option */}
          <button 
            disabled={processing}
            onClick={() => setMethod('CARD')}
            className={`p-6 rounded-[32px] border flex items-center justify-between transition-all active:scale-95 ${method === 'CARD' ? 'bg-[var(--color-primary)]/10 border-[var(--color-primary)]' : 'bg-surface border-subtle'}`}
          >
            <div className="flex items-center gap-4 text-left">
              <div className="w-10 h-10 bg-surface-alt rounded-2xl flex items-center justify-center text-[var(--color-primary)]"><Icons.Shield /></div>
              <div>
                <p className="text-main font-black text-xs uppercase tracking-widest">Credit / Debit Card</p>
                <p className="text-[8px] font-bold text-muted uppercase">Visa, Mastercard, RuPay</p>
              </div>
            </div>
          </button>

          {/* Net Banking */}
          <button 
            disabled={processing}
            onClick={() => setMethod('NET_BANKING')}
            className={`p-6 rounded-[32px] border flex items-center justify-between transition-all active:scale-95 ${method === 'NET_BANKING' ? 'bg-[var(--color-primary)]/10 border-[var(--color-primary)]' : 'bg-surface border-subtle'}`}
          >
            <div className="flex items-center gap-4 text-left">
              <div className="w-10 h-10 bg-surface-alt rounded-2xl flex items-center justify-center text-[var(--color-primary)]"><Icons.Home /></div>
              <div>
                <p className="text-main font-black text-xs uppercase tracking-widest">Net Banking</p>
                <p className="text-[8px] font-bold text-muted uppercase">All Major Indian Banks</p>
              </div>
            </div>
          </button>

          {/* Cash */}
          <button 
            disabled={processing}
            onClick={() => setMethod('CASH')}
            className={`p-6 rounded-[32px] border flex items-center justify-between transition-all active:scale-95 ${method === 'CASH' ? 'bg-[var(--color-primary)]/10 border-[var(--color-primary)]' : 'bg-surface border-subtle'}`}
          >
            <div className="flex items-center gap-4 text-left">
              <div className="w-10 h-10 bg-surface-alt rounded-2xl flex items-center justify-center text-[var(--color-primary)]"><Icons.User /></div>
              <div>
                <p className="text-main font-black text-xs uppercase tracking-widest">Pay in Person</p>
                <p className="text-[8px] font-bold text-muted uppercase">Hand over cash to {trip.ownerName}</p>
              </div>
            </div>
          </button>
        </div>
      </div>

      <button 
        disabled={!method || processing}
        onClick={handlePay}
        className={`w-full py-6 rounded-[30px] font-black text-xs uppercase tracking-widest shadow-2xl transition-all active:scale-95 flex items-center justify-center gap-3 ${method && !processing ? 'bg-[var(--color-primary)] text-white' : 'bg-surface-alt text-muted'}`}
      >
        {processing ? (
          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
        ) : (
          `Complete Payment (₹${DEMO_PER_PERSON})`
        )}
      </button>
    </div>
  );
};
