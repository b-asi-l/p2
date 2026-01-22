
import React, { useState, useEffect, useRef } from 'react';
import { 
  ViewState, 
  Trip, 
  VehicleType, 
  TripStatus, 
  User 
} from './types';
import { Icons, MOCK_TRIPS, KERALA_LOCATIONS } from './constants';
import { authService, supabase, tripService } from './services/supabaseService';

const LocationInput = ({ label, placeholder, value, onChange }: { label: string, placeholder: string, value: string, onChange: (v: string) => void }) => {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const suggestions = KERALA_LOCATIONS.filter(loc => 
    loc.toLowerCase().includes(value.toLowerCase()) && value.length > 1
  ).slice(0, 5);

  return (
    <div className="space-y-2 relative" ref={containerRef}>
      <label className="text-[10px] font-black uppercase text-slate-500 ml-4">{label}</label>
      <input 
        value={value}
        onChange={(e) => { onChange(e.target.value); setShowSuggestions(true); }}
        onFocus={() => setShowSuggestions(true)}
        placeholder={placeholder} 
        className="w-full bg-[#111827] p-5 rounded-[24px] font-bold text-white border border-white/5 focus:border-[#2DD4BF] outline-none transition-all" 
      />
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-50 top-[100%] left-0 right-0 bg-[#111827] border border-white/10 rounded-2xl mt-2 shadow-2xl overflow-hidden">
          {suggestions.map(loc => (
            <button key={loc} onClick={() => { onChange(loc); setShowSuggestions(false); }} className="w-full text-left p-4 hover:bg-[#2DD4BF]/10 text-xs font-bold border-b border-white/5 last:border-0">{loc}</button>
          ))}
        </div>
      )}
    </div>
  );
};

export default function App() {
  const [view, setView] = useState<ViewState>('LOGIN');
  const [user, setUser] = useState<User | null>(null);
  const [trips, setTrips] = useState<Trip[]>(MOCK_TRIPS);
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
  const [authMode, setAuthMode] = useState<'LOGIN' | 'SIGNUP'>('LOGIN');
  const [loginMethod, setLoginMethod] = useState<'EMAIL' | 'PHONE'>('EMAIL');
  
  // Auth state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('+91');
  const [otp, setOtp] = useState('');
  const [showOtpInput, setShowOtpInput] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form states for posting a ride
  const [postFrom, setPostFrom] = useState('');
  const [postTo, setPostTo] = useState('');

  useEffect(() => {
    authService.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        const localUser = localStorage.getItem('poolpal_user');
        if (localUser) {
          setUser({ ...JSON.parse(localUser), id: session.user.id });
          setView('HOME');
        } else {
          setView('ONBOARDING_PROFILE');
        }
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        setUser(null);
        setView('LOGIN');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const { data, error: authError } = authMode === 'LOGIN' 
        ? await authService.signIn(email, password)
        : await authService.signUp(email, password);

      if (authError) throw authError;
      if (data.user) {
        if (authMode === 'SIGNUP') {
          setView('ONBOARDING_PROFILE');
        } else {
          const mockProfile = { name: email.split('@')[0], avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`, rating: 5, tripsCount: 0, isOnboarded: true, co2Saved: 0, moneySaved: 0, balance: 100 };
          setUser({ ...mockProfile, id: data.user.id });
          localStorage.setItem('poolpal_user', JSON.stringify(mockProfile));
          setView('HOME');
        }
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePhoneSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const { error: authError } = await authService.signInWithPhone(phone);
      if (authError) throw authError;
      setShowOtpInput(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const { data, error: verifyError } = await authService.verifyPhoneOtp(phone, otp);
      if (verifyError) throw verifyError;
      if (data.user) {
        const localUser = localStorage.getItem('poolpal_user');
        if (localUser) {
          setUser({ ...JSON.parse(localUser), id: data.user.id });
          setView('HOME');
        } else {
          setView('ONBOARDING_PROFILE');
        }
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOnboarding = (name: string) => {
    const newUser = { id: '', name, avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`, rating: 5, tripsCount: 0, isOnboarded: true, co2Saved: 0, moneySaved: 0, balance: 100 };
    setUser(newUser);
    localStorage.setItem('poolpal_user', JSON.stringify(newUser));
    setView('HOME');
  };

  const renderView = () => {
    switch(view) {
      case 'LOGIN':
        return (
          <div className="min-h-screen flex flex-col items-center justify-center p-8 animate-in fade-in">
            <div className="w-20 h-20 bg-[#2DD4BF] rounded-[28px] flex items-center justify-center shadow-2xl mb-8 transform -rotate-3">
              <Icons.Car className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-4xl font-black italic uppercase text-white mb-2">PoolPal</h1>
            <p className="text-[#94A3B8] text-[9px] font-black uppercase tracking-[0.4em] mb-12">Community Mobility</p>

            <div className="w-full space-y-6">
              {!showOtpInput && (
                <div className="flex bg-[#111827] p-1 rounded-2xl mb-4">
                  <button 
                    onClick={() => { setLoginMethod('EMAIL'); setError(null); }}
                    className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${loginMethod === 'EMAIL' ? 'bg-[#2DD4BF] text-white shadow-lg' : 'text-[#94A3B8]'}`}
                  >
                    Email
                  </button>
                  <button 
                    onClick={() => { setLoginMethod('PHONE'); setError(null); }}
                    className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${loginMethod === 'PHONE' ? 'bg-[#2DD4BF] text-white shadow-lg' : 'text-[#94A3B8]'}`}
                  >
                    Phone
                  </button>
                </div>
              )}

              {loginMethod === 'EMAIL' ? (
                <form onSubmit={handleEmailAuth} className="w-full space-y-4">
                  <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="Email Address" className="w-full bg-[#111827] p-5 rounded-[24px] font-bold text-white border border-white/5 outline-none" required />
                  <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" placeholder="Password" className="w-full bg-[#111827] p-5 rounded-[24px] font-bold text-white border border-white/5 outline-none" required />
                  {error && <p className="text-rose-500 text-[10px] font-bold uppercase text-center">{error}</p>}
                  <button disabled={loading} className="w-full bg-[#2DD4BF] text-white py-5 rounded-[24px] font-black text-xs uppercase tracking-widest shadow-xl shadow-[#2DD4BF]/20">
                    {loading ? 'Processing...' : (authMode === 'LOGIN' ? 'Enter Dashboard' : 'Create Account')}
                  </button>
                </form>
              ) : (
                <div className="w-full space-y-4">
                  {!showOtpInput ? (
                    <form onSubmit={handlePhoneSignIn} className="space-y-4">
                      <div className="relative">
                        <span className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-500 font-bold text-sm">🇮🇳</span>
                        <input 
                          value={phone} 
                          onChange={(e) => setPhone(e.target.value)} 
                          type="tel" 
                          placeholder="+91 00000 00000" 
                          className="w-full bg-[#111827] pl-14 p-5 rounded-[24px] font-bold text-white border border-white/5 outline-none" 
                          required 
                        />
                      </div>
                      {error && <p className="text-rose-500 text-[10px] font-bold uppercase text-center">{error}</p>}
                      <button disabled={loading} className="w-full bg-[#2DD4BF] text-white py-5 rounded-[24px] font-black text-xs uppercase tracking-widest shadow-xl shadow-[#2DD4BF]/20">
                        {loading ? 'Sending SMS...' : 'Send Verification Code'}
                      </button>
                    </form>
                  ) : (
                    <form onSubmit={handleVerifyOtp} className="space-y-4 animate-in slide-in-from-right-4">
                      <p className="text-center text-[10px] font-black uppercase text-slate-500 tracking-widest">Code sent to {phone}</p>
                      <input 
                        value={otp} 
                        onChange={(e) => setOtp(e.target.value)} 
                        type="text" 
                        maxLength={6}
                        placeholder="0 0 0 0 0 0" 
                        className="w-full bg-[#111827] p-5 rounded-[24px] font-black text-center text-xl text-white border border-[#2DD4BF]/30 outline-none tracking-[0.5em]" 
                        required 
                      />
                      {error && <p className="text-rose-500 text-[10px] font-bold uppercase text-center">{error}</p>}
                      <button disabled={loading} className="w-full bg-[#2DD4BF] text-white py-5 rounded-[24px] font-black text-xs uppercase tracking-widest shadow-xl shadow-[#2DD4BF]/20">
                        {loading ? 'Verifying...' : 'Verify & Login'}
                      </button>
                      <button type="button" onClick={() => setShowOtpInput(false)} className="w-full text-slate-500 text-[9px] font-black uppercase tracking-widest">Change Phone Number</button>
                    </form>
                  )}
                </div>
              )}
            </div>

            {loginMethod === 'EMAIL' && (
              <button onClick={() => setAuthMode(authMode === 'LOGIN' ? 'SIGNUP' : 'LOGIN')} className="mt-6 text-[#94A3B8] text-[10px] font-black uppercase tracking-widest">
                {authMode === 'LOGIN' ? "Don't have an account? Sign Up" : "Already have an account? Login"}
              </button>
            )}
          </div>
        );

      case 'ONBOARDING_PROFILE':
        return (
          <div className="p-8 space-y-8 animate-in slide-in-from-right-8">
            <h2 className="text-3xl font-black italic uppercase text-white">Your Profile</h2>
            <form onSubmit={(e) => { e.preventDefault(); handleOnboarding((e.currentTarget.elements.namedItem('name') as HTMLInputElement).value); }} className="space-y-6">
              <input name="name" placeholder="Full Legal Name" className="w-full bg-[#111827] p-5 rounded-[24px] font-bold text-white border border-white/5 outline-none" required />
              <button className="w-full bg-[#2DD4BF] text-white py-6 rounded-[30px] font-black text-xs uppercase tracking-widest shadow-2xl">Start Pooling</button>
            </form>
          </div>
        );

      case 'HOME':
        return (
          <div className="p-8 space-y-8 animate-in fade-in">
            <div className="bg-[#111827] p-8 rounded-[40px] border border-white/5">
              <h3 className="text-[#2DD4BF] text-[10px] font-black uppercase tracking-[0.3em] mb-6">Impact Score</h3>
              <div className="grid grid-cols-2 gap-8">
                <div><p className="text-3xl font-black italic text-white">{user?.co2Saved}kg</p><p className="text-[9px] font-bold text-[#94A3B8] uppercase">CO2 Saved</p></div>
                <div><p className="text-3xl font-black italic text-[#2DD4BF]">₹{user?.moneySaved}</p><p className="text-[9px] font-bold text-[#94A3B8] uppercase">Money Saved</p></div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <button onClick={() => setView('SEARCH')} className="bg-[#111827] p-8 rounded-[40px] border border-white/5 flex flex-col items-center gap-4 active:scale-95 transition-all">
                <div className="bg-[#2DD4BF]/10 p-4 rounded-2xl text-[#2DD4BF]"><Icons.Search /></div>
                <span className="font-black text-[10px] uppercase">Find a Ride</span>
              </button>
              <button onClick={() => setView('POST')} className="bg-[#111827] p-8 rounded-[40px] border border-white/5 flex flex-col items-center gap-4 active:scale-95 transition-all">
                <div className="bg-[#2DD4BF]/10 p-4 rounded-2xl text-[#2DD4BF]"><Icons.Plus /></div>
                <span className="font-black text-[10px] uppercase">Offer a Ride</span>
              </button>
            </div>
          </div>
        );

      case 'SEARCH':
        return (
          <div className="p-8 space-y-8 animate-in slide-in-from-right-8">
            <h2 className="text-3xl font-black italic uppercase text-white">Find a Ride</h2>
            <div className="space-y-4">
              {trips.map(trip => (
                <div key={trip.id} onClick={() => { setSelectedTrip(trip); setView('TRIP_DETAIL'); }} className="bg-[#111827] p-6 rounded-[32px] border border-white/5 flex justify-between items-center active:scale-[0.98] transition-all">
                  <div className="flex items-center gap-4">
                    <img src={trip.ownerAvatar} className="w-12 h-12 rounded-2xl" />
                    <div>
                      <p className="text-xs font-black text-white uppercase">{trip.ownerName}</p>
                      <p className="text-[9px] font-bold text-slate-400">{trip.from.split(',')[0]} → {trip.to.split(',')[0]}</p>
                    </div>
                  </div>
                  <p className="text-lg font-black text-[#2DD4BF]">₹{trip.pricePerSeat}</p>
                </div>
              ))}
            </div>
          </div>
        );

      case 'TRIP_DETAIL':
        return selectedTrip && (
          <div className="p-8 space-y-8 animate-in slide-in-from-bottom-8">
            <button onClick={() => setView('SEARCH')} className="text-[#94A3B8] text-[10px] font-black uppercase tracking-widest">← Back to Search</button>
            <div className="bg-[#111827] p-8 rounded-[48px] border border-white/5 space-y-8">
              <div className="flex items-center gap-5">
                <img src={selectedTrip.ownerAvatar} className="w-20 h-20 rounded-[28px]" />
                <div>
                  <h3 className="text-xl font-black uppercase text-white">{selectedTrip.ownerName}</h3>
                  <p className="text-[10px] font-black text-[#2DD4BF]">{selectedTrip.ownerRating} Driver Rating</p>
                </div>
              </div>
              <div className="bg-[#0B1220] p-6 rounded-3xl space-y-4">
                <div><p className="text-[8px] font-black uppercase text-slate-500 mb-1">Route</p><p className="text-sm font-bold">{selectedTrip.from} → {selectedTrip.to}</p></div>
                <div><p className="text-[8px] font-black uppercase text-slate-500 mb-1">Departure</p><p className="text-sm font-bold">{selectedTrip.date} at {selectedTrip.time}</p></div>
              </div>
              <button onClick={() => { alert('Booking Request Sent!'); setView('HOME'); }} className="w-full bg-[#2DD4BF] text-white py-6 rounded-[30px] font-black text-xs uppercase tracking-widest shadow-2xl">Book Seat (₹{selectedTrip.pricePerSeat})</button>
            </div>
          </div>
        );

      case 'POST':
        return (
          <div className="p-8 space-y-8 animate-in slide-in-from-bottom-8">
            <h2 className="text-3xl font-black italic uppercase text-white">Offer a Ride</h2>
            <div className="bg-[#111827] p-8 rounded-[48px] border border-white/5">
              <form onSubmit={(e) => { e.preventDefault(); setView('HOME'); }} className="space-y-6">
                <LocationInput label="Pickup" placeholder="Where from?" value={postFrom} onChange={setPostFrom} />
                <LocationInput label="Drop-off" placeholder="Where to?" value={postTo} onChange={setPostTo} />
                <button className="w-full bg-[#2DD4BF] text-white py-6 rounded-[30px] font-black text-xs uppercase tracking-widest">Publish Ride</button>
              </form>
            </div>
          </div>
        );

      case 'ACTIVITY':
        return (
          <div className="p-8 space-y-8 animate-in fade-in">
            <h2 className="text-2xl font-black italic uppercase text-white">My Rides</h2>
            <div className="text-center py-20 opacity-50"><Icons.History className="w-12 h-12 mx-auto mb-4" /><p className="text-[10px] font-black uppercase">No recent activity</p></div>
          </div>
        );

      case 'PROFILE':
        return (
          <div className="p-8 space-y-12 animate-in fade-in">
            <div className="text-center space-y-6">
              <img src={user?.avatar} className="w-32 h-32 rounded-[48px] border-4 border-[#2DD4BF]/20 shadow-2xl mx-auto" />
              <h2 className="text-3xl font-black italic uppercase text-white">{user?.name}</h2>
            </div>
            <div className="space-y-4">
              <button onClick={() => authService.signOut()} className="w-full bg-rose-500/10 text-rose-500 py-5 rounded-[24px] font-black text-[10px] uppercase border border-rose-500/20">Log Out</button>
            </div>
          </div>
        );

      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-[#0B1220] text-slate-200 max-w-xl mx-auto flex flex-col shadow-2xl relative overflow-hidden">
      {view !== 'LOGIN' && view !== 'ONBOARDING_PROFILE' && (
        <header className="px-8 py-6 flex justify-between items-center border-b border-white/5 sticky top-0 bg-[#0B1220]/90 backdrop-blur-xl z-50">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setView('HOME')}>
            <div className="bg-[#2DD4BF] p-2 rounded-xl text-white shadow-lg"><Icons.Car /></div>
            <span className="font-black text-xl italic uppercase tracking-tighter">PoolPal</span>
          </div>
          <button onClick={() => setView('PROFILE')} className="w-10 h-10 rounded-2xl overflow-hidden border-2 border-[#2DD4BF]/20">
            <img src={user?.avatar} className="w-full h-full object-cover" />
          </button>
        </header>
      )}
      <main className="flex-1 overflow-y-auto custom-scroll">{renderView()}</main>
      {view !== 'LOGIN' && view !== 'ONBOARDING_PROFILE' && (
        <nav className="p-8 pb-10 sticky bottom-0 pointer-events-none">
          <div className="max-w-xs mx-auto bg-[#111827]/90 backdrop-blur-3xl border border-white/10 shadow-2xl rounded-[40px] px-8 py-5 flex justify-between items-center pointer-events-auto">
            <button onClick={() => setView('HOME')} className={`transition-all ${view === 'HOME' ? 'text-[#2DD4BF]' : 'text-[#94A3B8]'}`}><Icons.Home /></button>
            <button onClick={() => setView('SEARCH')} className={`transition-all ${view === 'SEARCH' ? 'text-[#2DD4BF]' : 'text-[#94A3B8]'}`}><Icons.Search /></button>
            <button onClick={() => setView('ACTIVITY')} className={`transition-all ${view === 'ACTIVITY' ? 'text-[#2DD4BF]' : 'text-[#94A3B8]'}`}><Icons.History /></button>
            <button onClick={() => setView('PROFILE')} className={`transition-all ${view === 'PROFILE' ? 'text-[#2DD4BF]' : 'text-[#94A3B8]'}`}><Icons.User /></button>
          </div>
        </nav>
      )}
    </div>
  );
}
