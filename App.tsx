
import React, { useState, useEffect, useRef } from 'react';
import { 
  ViewState, 
  Trip, 
  VehicleType, 
  TripStatus, 
  RequestStatus, 
  User, 
  JoinRequest,
  UserRole,
  IDType,
  Gender
} from './types';
import { Icons, MOCK_TRIPS } from './constants';
import * as aiService from './services/geminiService';

const StatusBadge = ({ status }: { status: RequestStatus | TripStatus }) => {
  const styles: Record<string, string> = {
    [RequestStatus.PENDING]: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
    [RequestStatus.ACCEPTED]: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
    [RequestStatus.REJECTED]: 'bg-rose-500/10 text-rose-500 border-rose-500/20',
    [TripStatus.OPEN]: 'bg-teal-500/10 text-teal-400 border-teal-500/20',
    [TripStatus.STARTED]: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
    [TripStatus.COMPLETED]: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest border ${styles[status] || styles[RequestStatus.PENDING]}`}>
      {status}
    </span>
  );
};

const CancellationPolicyCard = () => (
  <div className="bg-[#111827] p-6 rounded-[28px] border border-white/5 space-y-4">
    <div className="flex items-center gap-3 text-teal-400">
      <Icons.Shield className="w-4 h-4" />
      <h4 className="text-[10px] font-black uppercase tracking-widest">Trust & Cancellation Policy</h4>
    </div>
    <div className="space-y-3">
      <div className="flex gap-3">
        <div className="w-1 h-1 bg-teal-500 rounded-full mt-1.5 flex-shrink-0"></div>
        <p className="text-[10px] text-[#94A3B8] leading-relaxed">
          <span className="text-white font-bold">2+ Hours Notice:</span> Full refund. No impact on Karma.
        </p>
      </div>
      <div className="flex gap-3">
        <div className="w-1 h-1 bg-amber-500 rounded-full mt-1.5 flex-shrink-0"></div>
        <p className="text-[10px] text-[#94A3B8] leading-relaxed">
          <span className="text-white font-bold">Late Notice:</span> -0.2 Karma trust deduction.
        </p>
      </div>
    </div>
  </div>
);

const MapView = ({ 
  lat, 
  lng, 
  interactive = true, 
  onLocationSelect, 
  showLiveMarker = false 
}: { 
  lat?: number, 
  lng?: number, 
  interactive?: boolean, 
  onLocationSelect?: (lat: number, lng: number) => void,
  showLiveMarker?: boolean
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMap = useRef<any>(null);
  const markerRef = useRef<any>(null);

  useEffect(() => {
    if (!mapRef.current) return;
    const initialLat = lat || 9.9312; 
    const initialLng = lng || 76.2673;

    // @ts-ignore
    leafletMap.current = L.map(mapRef.current, {
      center: [initialLat, initialLng],
      zoom: 13,
      zoomControl: false,
      attributionControl: false
    });

    // @ts-ignore
    L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
      maxZoom: 19,
    }).addTo(leafletMap.current);

    // @ts-ignore
    markerRef.current = L.marker([initialLat, initialLng], {
      // @ts-ignore
      icon: L.divIcon({
        className: 'custom-div-icon',
        html: `<div class="w-8 h-8 flex items-center justify-center bg-[#2DD4BF] rounded-full border-4 border-white shadow-2xl ${showLiveMarker ? 'animate-pulse-teal' : ''}"><div class="w-2 h-2 bg-white rounded-full"></div></div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 16]
      })
    }).addTo(leafletMap.current);

    if (interactive) {
      leafletMap.current.on('click', (e: any) => {
        const { lat, lng } = e.latlng;
        markerRef.current.setLatLng([lat, lng]);
        if (onLocationSelect) onLocationSelect(lat, lng);
      });
    }

    return () => {
      if (leafletMap.current) leafletMap.current.remove();
    };
  }, []);

  useEffect(() => {
    if (leafletMap.current && markerRef.current && lat && lng) {
      markerRef.current.setLatLng([lat, lng]);
      leafletMap.current.panTo([lat, lng]);
    }
  }, [lat, lng]);

  return <div ref={mapRef} className="w-full h-full" />;
};

export default function App() {
  const [view, setView] = useState<ViewState>('LOGIN');
  const [user, setUser] = useState<User | null>(null);
  const [allTrips, setAllTrips] = useState<Trip[]>(MOCK_TRIPS);
  const [activeRide, setActiveRide] = useState<Trip | null>(null);
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);
  const [rideCoords, setRideCoords] = useState({ lat: 9.9922, lng: 76.3501 });
  // Initialized with grounding state to comply with Maps grounding display requirements
  const [liveAdvice, setLiveAdvice] = useState<{text: string, grounding?: any[]}>({ text: "Drive safely through Kerala!" });
  const [userRequests, setUserRequests] = useState<JoinRequest[]>([]);
  const [loginMethod, setLoginMethod] = useState<'PHONE' | 'EMAIL' | null>(null);
  const [otpSent, setOtpSent] = useState(false);
  const [profilePreview, setProfilePreview] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('codepool_v3_auth');
    if (saved) {
      const parsed = JSON.parse(saved);
      setUser(parsed);
      setView('HOME');
    }
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (isHydrated && user) {
      localStorage.setItem('codepool_v3_auth', JSON.stringify(user));
    }
  }, [user, isHydrated]);

  // Live Tracking Logic
  useEffect(() => {
    if (view === 'LIVE_TRACKING' && activeRide) {
      const interval = setInterval(async () => {
        setRideCoords(prev => ({
          lat: prev.lat + (Math.random() - 0.5) * 0.0004,
          lng: prev.lng + (Math.random() - 0.5) * 0.0004
        }));
        // Updated to store the full result including grounding metadata
        const advice = await aiService.getLiveCopilotUpdate(activeRide.from, activeRide.to, 40);
        setLiveAdvice(advice);
      }, 7000);
      return () => clearInterval(interval);
    }
  }, [view, activeRide]);

  const handleLoginStart = (method: 'PHONE' | 'EMAIL') => {
    setLoginMethod(method);
    setOtpSent(true);
    // Simulation: Automatically "verify" after 1.5 seconds
    setTimeout(() => {
      setView('ONBOARDING_LANG');
    }, 1500);
  };

  const handleGuestLogin = () => {
    const newUser: User = {
      id: 'g-' + Math.random().toString(36).substr(2, 9),
      name: 'Guest Explorer',
      avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=Guest`,
      rating: 0,
      tripsCount: 0,
      balance: 0,
      isGuest: true,
      isOnboarded: false,
      co2Saved: 0,
      moneySaved: 0,
      role: UserRole.RIDER,
      language: 'English'
    };
    setUser(newUser);
    setView('HOME');
  };

  const handleGoogleLogin = () => {
    // Simulate google login
    handleLoginStart('EMAIL');
  };

  const completeOnboarding = (profile: Partial<User>) => {
    const newUser: User = {
      id: 'u-' + Math.random().toString(36).substr(2, 9),
      name: profile.name || 'User',
      avatar: profilePreview || profile.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.name}`,
      rating: 5.0,
      tripsCount: 0,
      balance: 500,
      isGuest: false,
      isOnboarded: true,
      co2Saved: 0,
      moneySaved: 0,
      role: profile.role || UserRole.BOTH,
      language: profile.language || 'English',
      address: profile.address,
      idType: profile.idType,
      idNumber: profile.idNumber,
      gender: profile.gender,
      vehiclePreference: profile.vehiclePreference
    };
    setUser(newUser);
    setView('HOME');
  };

  const handleJoinRequest = (trip: Trip) => {
    const newReq: JoinRequest = {
      id: `req-${Date.now()}`,
      tripId: trip.id,
      userId: user!.id,
      userName: user!.name,
      userAvatar: user!.avatar,
      status: RequestStatus.PENDING,
      timestamp: Date.now()
    };
    setUserRequests(prev => [newReq, ...prev]);
    setView('ACTIVITY');
  };

  const acceptRequestSim = (reqId: string) => {
    setUserRequests(prev => prev.map(r => r.id === reqId ? { ...r, status: RequestStatus.ACCEPTED } : r));
    const req = userRequests.find(r => r.id === reqId);
    if (req) {
      const trip = allTrips.find(t => t.id === req.tripId);
      if (trip) {
        setActiveRide({ ...trip, status: TripStatus.STARTED });
        setRideCoords({ lat: trip.currentLat || 9.9, lng: trip.currentLng || 76.3 });
      }
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  if (!isHydrated) return null;

  // View Routing
  const renderView = () => {
    switch(view) {
      case 'LOGIN':
        return (
          <div className="min-h-screen bg-[#0B1220] flex items-center justify-center p-8">
            <div className="w-full max-w-sm text-center">
              <div className="w-24 h-24 bg-[#2DD4BF] rounded-[32px] mx-auto flex items-center justify-center shadow-2xl mb-10 transform -rotate-3 transition-transform hover:rotate-0">
                 <Icons.Car className="w-12 h-12 text-white" />
              </div>
              <h1 className="text-4xl font-black text-white italic uppercase tracking-tighter mb-2">Code Pooling</h1>
              <p className="text-[#94A3B8] text-[10px] font-black uppercase tracking-[0.4em] mb-16">Trust-First Mobility</p>
              
              {!otpSent ? (
                <div className="space-y-4 animate-in fade-in zoom-in-95">
                  <div className="space-y-3">
                    <button onClick={handleGoogleLogin} className="w-full bg-[#111827] border border-white/5 p-4 rounded-[24px] font-black text-xs uppercase text-white flex items-center justify-center gap-4 hover:bg-white/10 transition-all">
                      <Icons.Google className="w-5 h-5" /> Continue with Google
                    </button>
                    <button onClick={() => setLoginMethod('PHONE')} className={`w-full ${loginMethod === 'PHONE' ? 'bg-[#2DD4BF] text-white' : 'bg-[#111827] border border-white/5 text-[#94A3B8]'} p-4 rounded-[24px] font-black text-xs uppercase flex items-center justify-center gap-4 transition-all`}>
                      <Icons.Phone className="w-5 h-5" /> Phone Number
                    </button>
                    <button onClick={() => setLoginMethod('EMAIL')} className={`w-full ${loginMethod === 'EMAIL' ? 'bg-[#2DD4BF] text-white' : 'bg-[#111827] border border-white/5 text-[#94A3B8]'} p-4 rounded-[24px] font-black text-xs uppercase flex items-center justify-center gap-4 transition-all`}>
                      <Icons.Mail className="w-5 h-5" /> Email Address
                    </button>
                  </div>

                  {loginMethod && (
                    <div className="mt-8 animate-in slide-in-from-top-4 space-y-4">
                      <input 
                        type={loginMethod === 'PHONE' ? 'tel' : 'email'} 
                        placeholder={loginMethod === 'PHONE' ? '+91 00000 00000' : 'name@example.com'} 
                        className="w-full bg-[#111827] border border-white/5 p-5 rounded-[24px] font-bold text-white outline-none focus:border-[#2DD4BF]" 
                      />
                      <button onClick={() => handleLoginStart(loginMethod)} className="w-full bg-[#2DD4BF] text-white py-5 rounded-[24px] font-black text-xs uppercase tracking-widest active:scale-95 shadow-xl shadow-[#2DD4BF]/20">
                        Continue
                      </button>
                    </div>
                  )}

                  <div className="pt-6">
                    <button onClick={handleGuestLogin} className="text-[#94A3B8] font-black text-[10px] uppercase tracking-widest hover:text-[#2DD4BF] transition-all">
                      Explore as Guest
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-6 animate-in slide-in-from-bottom-4">
                  <p className="text-teal-400 font-bold text-xs uppercase tracking-widest">Verifying Identity...</p>
                  <div className="flex justify-center gap-3">
                    {[1,2,3,4].map(i => <div key={i} className="w-12 h-12 bg-[#111827] rounded-xl border border-teal-500/30 animate-pulse" />)}
                  </div>
                  <p className="text-[9px] text-[#94A3B8] uppercase">Waiting for secure handshake</p>
                </div>
              )}
            </div>
          </div>
        );

      case 'ONBOARDING_LANG':
        return (
          <div className="min-h-screen bg-[#0B1220] p-10 flex flex-col justify-center animate-in fade-in">
            <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter mb-4">Select Language</h2>
            <p className="text-[#94A3B8] text-xs font-bold uppercase tracking-widest mb-10 leading-relaxed">Customize your experience in God's Own Country.</p>
            <div className="grid grid-cols-1 gap-4">
              {['English', 'Malayalam (മലയാളം)', 'Hindi (हिंदी)'].map(lang => (
                <button key={lang} onClick={() => setView('ONBOARDING_PROFILE')} className="w-full bg-[#111827] p-8 rounded-[32px] border border-white/5 text-left flex justify-between items-center group hover:border-teal-500/50 transition-all active:scale-95">
                  <span className="font-black text-white uppercase tracking-wider">{lang}</span>
                  <div className="text-[#2DD4BF] opacity-0 group-hover:opacity-100"><Icons.Check /></div>
                </button>
              ))}
            </div>
          </div>
        );

      case 'ONBOARDING_PROFILE':
        return (
          <div className="min-h-screen bg-[#0B1220] p-8 pb-12 flex flex-col animate-in slide-in-from-right-8 overflow-y-auto">
            <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter mb-2">Create Profile</h2>
            <p className="text-[#94A3B8] text-[10px] font-black uppercase tracking-widest mb-8">Secure your identity in the community.</p>
            
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              completeOnboarding({
                name: formData.get('name') as string,
                role: formData.get('role') as UserRole,
                address: formData.get('address') as string,
                idType: formData.get('idType') as IDType,
                idNumber: formData.get('idNumber') as string,
                gender: formData.get('gender') as Gender,
                vehiclePreference: formData.get('vehicle') as VehicleType
              });
            }} className="space-y-6">
              
              {/* Profile Image Section */}
              <div className="flex flex-col items-center gap-4 mb-4">
                <div className="relative w-28 h-28 bg-[#111827] rounded-[40px] border-4 border-white/5 flex items-center justify-center overflow-hidden shadow-2xl group">
                  {profilePreview ? (
                    <img src={profilePreview} className="w-full h-full object-cover" />
                  ) : (
                    <Icons.User className="w-12 h-12 text-[#94A3B8]" />
                  )}
                  <input type="file" accept="image/*" onChange={handleImageUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
                </div>
                <p className="text-[9px] font-black uppercase text-[#2DD4BF] tracking-widest">Tap to upload photo</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[9px] font-black uppercase text-slate-500 ml-4">Full Legal Name</label>
                  <input name="name" placeholder="Enter as per ID" required className="w-full bg-[#111827] p-5 rounded-[24px] font-bold text-white border border-white/5 focus:border-[#2DD4BF] outline-none" />
                </div>

                <div className="space-y-2">
                  <label className="text-[9px] font-black uppercase text-slate-500 ml-4">Gender</label>
                  <div className="flex gap-2">
                    {Object.values(Gender).map(g => (
                      <label key={g} className="flex-1 cursor-pointer">
                        <input type="radio" name="gender" value={g} className="peer sr-only" required />
                        <div className="bg-[#111827] p-4 rounded-2xl border border-white/5 text-center text-[10px] font-black text-[#94A3B8] uppercase peer-checked:bg-[#2DD4BF] peer-checked:text-white peer-checked:border-[#2DD4BF] transition-all">
                          {g}
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[9px] font-black uppercase text-slate-500 ml-4">Residence Address</label>
                  <input name="address" placeholder="House/Flat No, Area, City" required className="w-full bg-[#111827] p-5 rounded-[24px] font-bold text-white border border-white/5 focus:border-[#2DD4BF] outline-none" />
                </div>

                <div className="space-y-2">
                  <label className="text-[9px] font-black uppercase text-slate-500 ml-4">Indian ID Verification</label>
                  <div className="flex gap-3">
                    <select name="idType" className="bg-[#111827] p-5 rounded-[24px] font-bold text-white border border-white/5 outline-none w-1/3 text-xs">
                      {Object.values(IDType).map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                    <input name="idNumber" placeholder="ID Number" required className="flex-1 bg-[#111827] p-5 rounded-[24px] font-bold text-white border border-white/5 focus:border-[#2DD4BF] outline-none" />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[9px] font-black uppercase text-slate-500 ml-4">Primary Role</label>
                  <select name="role" className="w-full bg-[#111827] p-5 rounded-[24px] font-bold text-white border border-white/5 outline-none appearance-none">
                    <option value={UserRole.BOTH}>Rider & Driver</option>
                    <option value={UserRole.DRIVER}>Driver only</option>
                    <option value={UserRole.RIDER}>Rider only</option>
                  </select>
                </div>
              </div>

              <div className="p-6 bg-[#2DD4BF]/5 rounded-[32px] border border-[#2DD4BF]/20">
                <p className="text-[8px] font-black text-[#2DD4BF] uppercase tracking-widest mb-2 flex items-center gap-2">
                  <Icons.Shield className="w-3 h-3" /> Privacy Assurance
                </p>
                <p className="text-[9px] text-[#94A3B8] leading-relaxed italic">
                  Your ID and address are used only for trust-verification. They will never be shared with other users or 3rd parties.
                </p>
              </div>

              <button type="submit" className="w-full bg-[#2DD4BF] text-white py-6 rounded-[30px] font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-[#2DD4BF]/20 active:scale-95 transition-all mt-4">
                Complete Verification
              </button>
            </form>
          </div>
        );

      case 'HOME':
        return (
          <div className="space-y-8 animate-in fade-in duration-500">
            {/* Impact & Wallet Cards */}
            <div className="grid grid-cols-1 gap-4">
              <div className="bg-[#111827] p-8 rounded-[40px] border border-white/5 relative overflow-hidden group">
                 <div className="absolute top-0 right-0 p-10 opacity-5 group-hover:scale-110 transition-transform duration-700">
                    <Icons.Leaf className="w-32 h-32" />
                 </div>
                 <h3 className="text-[#2DD4BF] text-[10px] font-black uppercase tracking-[0.3em] mb-6">Impact Dashboard</h3>
                 <div className="grid grid-cols-2 gap-8">
                    <div>
                       <p className="text-3xl font-black italic text-white tracking-tighter">{user?.co2Saved}kg</p>
                       <p className="text-[9px] font-bold text-[#94A3B8] uppercase mt-1">CO2 Footprint</p>
                    </div>
                    <div>
                       <p className="text-3xl font-black italic text-[#2DD4BF] tracking-tighter">₹{user?.moneySaved}</p>
                       <p className="text-[9px] font-bold text-[#94A3B8] uppercase mt-1">Split Savings</p>
                    </div>
                 </div>
              </div>
              <div className="bg-[#2DD4BF]/5 p-8 rounded-[40px] border border-[#2DD4BF]/20 flex justify-between items-center">
                <div>
                   <h4 className="text-[9px] font-black uppercase text-[#2DD4BF] tracking-widest">Pool Wallet</h4>
                   <p className="text-2xl font-black text-white mt-1">₹{user?.balance}</p>
                </div>
                <button className="bg-[#2DD4BF] p-3 rounded-2xl text-white"><Icons.Plus /></button>
              </div>
            </div>

            {/* Primary Actions */}
            <div className="grid grid-cols-2 gap-4">
               <button onClick={() => setView('SEARCH')} className="bg-[#111827] p-8 rounded-[40px] border border-white/5 flex flex-col items-center gap-5 hover:border-[#2DD4BF]/30 transition-all active:scale-95">
                  <div className="bg-[#2DD4BF]/10 p-6 rounded-2xl text-[#2DD4BF]"><Icons.Search className="w-8 h-8" /></div>
                  <span className="font-black text-[10px] uppercase tracking-[0.2em]">Find a Pool</span>
               </button>
               <button onClick={() => setView('POST')} className="bg-[#111827] p-8 rounded-[40px] border border-white/5 flex flex-col items-center gap-5 hover:border-[#2DD4BF]/30 transition-all active:scale-95">
                  <div className="bg-[#2DD4BF]/10 p-6 rounded-2xl text-[#2DD4BF]"><Icons.Plus className="w-8 h-8" /></div>
                  <span className="font-black text-[10px] uppercase tracking-[0.2em]">Offer a Pool</span>
               </button>
            </div>

            <div className="bg-[#111827] p-8 rounded-[40px] border border-white/5">
               <h4 className="text-[10px] font-black uppercase text-[#94A3B8] tracking-[0.2em] mb-6">Trust Reminders</h4>
               <div className="space-y-4">
                  <div className="flex gap-4 p-4 bg-[#0B1220] rounded-3xl border border-white/5">
                     <div className="text-[#2DD4BF]"><Icons.Shield /></div>
                     <p className="text-[10px] font-bold text-[#E2E8F0]">Always verify the vehicle plate before boarding.</p>
                  </div>
               </div>
            </div>
          </div>
        );

      case 'SEARCH':
        return (
          <div className="space-y-6 animate-in slide-in-from-right-8">
             <h2 className="text-3xl font-black italic uppercase tracking-tighter">Available Pools</h2>
             <div className="space-y-4">
                {allTrips.map(trip => (
                  <div key={trip.id} onClick={() => { setSelectedTrip(trip); setView('TRIP_DETAIL'); }} className="bg-[#111827] p-6 rounded-[32px] border border-white/5 hover:border-teal-400/30 transition-all cursor-pointer">
                     <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-3">
                           <img src={trip.ownerAvatar} className="w-10 h-10 rounded-xl object-cover" />
                           <div>
                              <p className="text-xs font-black text-white uppercase">{trip.ownerName}</p>
                              <p className="text-[8px] font-black text-[#2DD4BF] uppercase">{trip.ownerRating} ★ • {trip.vehicleType}</p>
                           </div>
                        </div>
                        <p className="text-xl font-black text-[#2DD4BF]">₹{trip.pricePerSeat}</p>
                     </div>
                     <div className="pl-4 border-l-2 border-[#2DD4BF]/20 space-y-3 mb-4">
                        <p className="text-xs font-bold text-slate-200">{trip.from} → {trip.to}</p>
                        <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">{trip.time} • {trip.availableSeats} SEATS LEFT</p>
                     </div>
                  </div>
                ))}
             </div>
          </div>
        );

      case 'TRIP_DETAIL':
        return selectedTrip && (
          <div className="space-y-8 animate-in slide-in-from-bottom-8">
            <button onClick={() => setView('SEARCH')} className="text-[#94A3B8] text-[10px] font-black uppercase tracking-widest">← Back</button>
            <div className="bg-[#111827] p-8 rounded-[48px] border border-white/5">
              <div className="flex items-center gap-5 mb-8">
                <img src={selectedTrip.ownerAvatar} className="w-14 h-14 rounded-2xl" />
                <div>
                  <h3 className="text-xl font-black uppercase text-white italic">{selectedTrip.ownerName}</h3>
                  <p className="text-[10px] font-black text-teal-400 uppercase tracking-widest">{selectedTrip.ownerRating} ★ Trust Score</p>
                </div>
              </div>
              <div className="space-y-6 mb-10">
                <div className="bg-[#0B1220] p-6 rounded-3xl border border-white/5">
                  <p className="text-[8px] font-black uppercase text-[#94A3B8] mb-2">Trip Route</p>
                  <p className="text-sm font-bold text-white">{selectedTrip.from} to {selectedTrip.to}</p>
                </div>
                <div className="bg-[#0B1220] p-6 rounded-3xl border border-white/5">
                  <p className="text-[8px] font-black uppercase text-[#94A3B8] mb-2">Driver Notes</p>
                  <p className="text-xs font-medium text-[#E2E8F0] leading-relaxed italic">"{selectedTrip.description}"</p>
                </div>
              </div>
              <CancellationPolicyCard />
              <button onClick={() => handleJoinRequest(selectedTrip)} className="w-full bg-[#2DD4BF] text-white py-6 rounded-[30px] font-black text-xs uppercase tracking-[0.2em] shadow-2xl mt-10 active:scale-95 transition-all">Request to Join</button>
            </div>
          </div>
        );

      case 'POST':
        return (
          <div className="animate-in slide-in-from-bottom-8">
            <h2 className="text-3xl font-black italic uppercase tracking-tighter mb-8">Offer a Pool</h2>
            <div className="bg-[#111827] p-10 rounded-[48px] border border-white/5">
               <form onSubmit={(e) => { e.preventDefault(); setView('HOME'); }} className="space-y-6">
                  <div className="space-y-2">
                     <label className="text-[9px] font-black uppercase text-slate-500 ml-4">Source</label>
                     <input placeholder="Starting from..." className="w-full bg-[#0B1220] p-5 rounded-[24px] font-bold text-white border border-white/5 focus:border-[#2DD4BF] outline-none" required />
                  </div>
                  <div className="space-y-2">
                     <label className="text-[9px] font-black uppercase text-slate-500 ml-4">Destination</label>
                     <input placeholder="Heading to..." className="w-full bg-[#0B1220] p-5 rounded-[24px] font-bold text-white border border-white/5 focus:border-[#2DD4BF] outline-none" required />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                     <div className="space-y-2">
                        <label className="text-[9px] font-black uppercase text-slate-500 ml-4">Date</label>
                        <input type="date" className="w-full bg-[#0B1220] p-5 rounded-[24px] font-bold text-white border border-white/5 outline-none" required />
                     </div>
                     <div className="space-y-2">
                        <label className="text-[9px] font-black uppercase text-slate-500 ml-4">Seats</label>
                        <input type="number" defaultValue="1" className="w-full bg-[#0B1220] p-5 rounded-[24px] font-bold text-white border border-white/5 outline-none" required />
                     </div>
                  </div>
                  <button type="submit" className="w-full bg-[#2DD4BF] text-white py-6 rounded-[30px] font-black text-xs uppercase tracking-[0.2em] active:scale-95 transition-all">Publish Trip</button>
               </form>
            </div>
          </div>
        );

      case 'ACTIVITY':
        return (
          <div className="space-y-8 animate-in fade-in">
             <h2 className="text-3xl font-black italic uppercase tracking-tighter">My Trips</h2>
             <div className="space-y-4">
                {userRequests.map(req => (
                  <div key={req.id} className="bg-[#111827] p-6 rounded-[32px] border border-white/5">
                     <div className="flex justify-between items-center mb-6">
                        <div className="flex items-center gap-4">
                           <div className="bg-[#2DD4BF]/10 p-3 rounded-2xl text-[#2DD4BF]"><Icons.Activity /></div>
                           <div>
                              <p className="text-xs font-black text-white uppercase">Request #{req.id.slice(-4)}</p>
                              <p className="text-[9px] font-bold text-[#94A3B8]">{new Date(req.timestamp).toLocaleTimeString()}</p>
                           </div>
                        </div>
                        <StatusBadge status={req.status} />
                     </div>
                     {req.status === RequestStatus.PENDING && (
                        <button onClick={() => acceptRequestSim(req.id)} className="w-full bg-white/5 py-4 rounded-2xl text-[9px] font-black uppercase tracking-widest text-[#2DD4BF]">Simulate Approval</button>
                     )}
                     {req.status === RequestStatus.ACCEPTED && (
                        <div className="space-y-3">
                           <button onClick={() => setView('LIVE_TRACKING')} className="w-full bg-[#2DD4BF] text-white py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest">Track & Board</button>
                           <button onClick={() => setView('CHAT')} className="w-full bg-white/5 text-white py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-3"><Icons.Message /> Coordinate Pickup</button>
                        </div>
                     )}
                  </div>
                ))}
             </div>
          </div>
        );

      case 'CHAT':
        return (
          <div className="h-[75vh] flex flex-col animate-in slide-in-from-right-8">
            <button onClick={() => setView('ACTIVITY')} className="text-[#94A3B8] text-[10px] font-black uppercase tracking-widest mb-6">← Back to Trips</button>
            <div className="flex-1 bg-[#111827] rounded-[48px] border border-white/5 p-8 overflow-y-auto">
               <div className="space-y-6">
                  <div className="bg-[#0B1220] p-4 rounded-2xl rounded-tl-none mr-12 border border-white/5">
                     <p className="text-xs text-[#E2E8F0]">Hi! I'm waiting at the Technopark front gate near the ATM.</p>
                  </div>
                  <div className="bg-[#2DD4BF] p-4 rounded-2xl rounded-tr-none ml-12 text-white">
                     <p className="text-xs font-bold">Great, I'll be there in 5 mins. Look for the white Ciaz.</p>
                  </div>
               </div>
            </div>
            <div className="mt-4 flex gap-3">
               <input placeholder="Type a message..." className="flex-1 bg-[#111827] p-5 rounded-[24px] border border-white/5 text-white text-xs font-bold outline-none" />
               <button className="bg-[#2DD4BF] p-5 rounded-[24px] text-white"><Icons.Navigation /></button>
            </div>
          </div>
        );

      case 'LIVE_TRACKING':
        return (
          <div className="h-[76vh] flex flex-col gap-6 animate-in zoom-in-95">
             <div className="flex-1 bg-[#111827] rounded-[48px] overflow-hidden border-4 border-white/5 relative">
                <MapView lat={rideCoords.lat} lng={rideCoords.lng} showLiveMarker={true} />
                <div className="absolute top-6 left-6 right-6 z-10">
                   <div className="bg-[#0B1220]/90 backdrop-blur-xl p-5 rounded-3xl border border-[#2DD4BF]/30 text-[#2DD4BF] shadow-2xl">
                      <p className="text-[10px] font-black italic tracking-wide">{liveAdvice.text}</p>
                      {/* Extracting and displaying mandatory Google Maps grounding links from the Gemini response */}
                      {liveAdvice.grounding?.map((chunk: any, i: number) => chunk.maps && (
                        <a 
                          key={i} 
                          href={chunk.maps.uri} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="text-[8px] underline block mt-2 text-teal-400 font-bold uppercase tracking-widest"
                        >
                          📍 {chunk.maps.title || 'View on Maps'}
                        </a>
                      ))}
                   </div>
                </div>
                <div className="absolute bottom-6 left-6 right-6 z-10">
                   <div className="bg-white p-6 rounded-[36px] shadow-2xl flex items-center justify-between text-[#0B1220]">
                      <div className="flex items-center gap-4">
                         <img src={activeRide?.ownerAvatar} className="w-14 h-14 rounded-2xl" />
                         <div>
                            <p className="text-[10px] font-black uppercase text-[#2DD4BF] tracking-widest">Enroute</p>
                            <p className="text-xl font-black italic">{activeRide?.ownerName}</p>
                         </div>
                      </div>
                      <button onClick={() => setView('PAYMENT')} className="bg-[#2DD4BF] text-white px-6 py-3 rounded-2xl font-black text-[10px] uppercase">End Trip</button>
                   </div>
                </div>
             </div>
          </div>
        );

      case 'PAYMENT':
        return (
          <div className="animate-in fade-in flex flex-col items-center justify-center h-[70vh] text-center">
             <div className="w-20 h-20 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mb-8 border border-emerald-500/30">
                <Icons.Check className="w-10 h-10" />
             </div>
             <h2 className="text-3xl font-black italic uppercase text-white mb-2">Trip Completed</h2>
             <p className="text-[#94A3B8] text-xs font-bold uppercase tracking-widest mb-10">Arrived safely in God's Own Country.</p>
             <div className="bg-[#111827] p-8 rounded-[40px] border border-white/5 w-full mb-10">
                <p className="text-[10px] font-black uppercase text-[#94A3B8] tracking-widest mb-2">Cost Share Contribution</p>
                <p className="text-4xl font-black text-white italic tracking-tighter">₹{activeRide?.pricePerSeat}</p>
                <p className="text-[8px] font-bold text-emerald-400 uppercase mt-4 tracking-widest">Deducted from Pool Wallet</p>
             </div>
             <button onClick={() => setView('HOME')} className="w-full bg-[#2DD4BF] text-white py-6 rounded-[30px] font-black text-xs uppercase tracking-widest">Back to Dashboard</button>
          </div>
        );

      case 'PROFILE':
        return (
           <div className="max-w-sm mx-auto animate-in fade-in">
              <div className="bg-[#111827] p-12 rounded-[56px] border border-white/5 text-center">
                 <img src={user?.avatar} className="w-28 h-28 mx-auto mb-8 rounded-[40px] border-4 border-[#2DD4BF]/20 shadow-2xl" />
                 <h2 className="text-3xl font-black italic uppercase text-white">{user?.name}</h2>
                 <p className="text-[10px] font-black uppercase text-[#94A3B8] tracking-[0.3em] mt-3 mb-12">Verified {user?.role}</p>
                 
                 <div className="space-y-4 text-left">
                    <div className="bg-[#0B1220] p-6 rounded-3xl border border-white/5 flex justify-between items-center">
                       <div>
                          <p className="text-[8px] font-black uppercase text-[#94A3B8]">Language</p>
                          <p className="text-sm font-bold text-white mt-1">{user?.language}</p>
                       </div>
                       <Icons.Globe className="text-[#94A3B8]" />
                    </div>
                    <div className="bg-[#0B1220] p-6 rounded-3xl border border-white/5 flex justify-between items-center">
                       <div>
                          <p className="text-[8px] font-black uppercase text-[#94A3B8]">Wallet Balance</p>
                          <p className="text-sm font-bold text-white mt-1">₹{user?.balance}</p>
                       </div>
                       <Icons.Wallet className="text-[#2DD4BF]" />
                    </div>
                 </div>

                 <button onClick={() => { localStorage.removeItem('codepool_v3_auth'); window.location.reload(); }} className="w-full bg-rose-500/10 text-rose-500 py-5 rounded-[24px] font-black text-[10px] uppercase tracking-widest mt-10">Sign Out</button>
              </div>
           </div>
        );

      default:
        return <div>View not found</div>;
    }
  };

  return (
    <div className="min-h-screen bg-[#0B1220] text-[#E2E8F0] flex flex-col max-w-xl mx-auto shadow-2xl relative overflow-x-hidden">
      {/* Dynamic Header */}
      {view !== 'LOGIN' && !view.startsWith('ONBOARDING') && (
        <header className="px-8 py-6 flex justify-between items-center sticky top-0 z-50 bg-[#0B1220]/90 backdrop-blur-xl border-b border-white/5">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setView('HOME')}>
            <div className="bg-[#2DD4BF] p-2 rounded-xl text-white shadow-lg"><Icons.Car /></div>
            <span className="font-black text-xl italic uppercase tracking-tighter">CodePool</span>
          </div>
          <button onClick={() => setView('PROFILE')} className="w-10 h-10 rounded-2xl overflow-hidden border-2 border-[#2DD4BF]/20">
            <img src={user?.avatar} className="w-full h-full object-cover" />
          </button>
        </header>
      )}

      <main className={`flex-1 ${view !== 'LOGIN' && !view.startsWith('ONBOARDING') ? 'px-8 pt-6 pb-32' : ''} overflow-y-auto custom-scroll`}>
        {renderView()}
      </main>

      {/* Navigation */}
      {view !== 'LOGIN' && !view.startsWith('ONBOARDING') && view !== 'LIVE_TRACKING' && view !== 'PAYMENT' && (
        <nav className="fixed bottom-0 left-0 right-0 z-50 px-8 pb-8 pointer-events-none">
          <div className="max-w-sm mx-auto bg-[#111827]/90 backdrop-blur-3xl border border-white/10 shadow-2xl rounded-[40px] px-8 py-5 flex justify-between items-center pointer-events-auto">
            {[
              { id: 'HOME', icon: <Icons.Home />, label: 'Home' },
              { id: 'SEARCH', icon: <Icons.Search />, label: 'Find' },
              { id: 'ACTIVITY', icon: <Icons.Activity />, label: 'Trips' },
              { id: 'PROFILE', icon: <Icons.User />, label: 'Profile' },
            ].map((item) => (
              <button 
                key={item.id} 
                onClick={() => { setView(item.id as ViewState); setSelectedTrip(null); }} 
                className={`flex flex-col items-center gap-1.5 transition-all ${view === item.id ? 'text-[#2DD4BF] scale-110' : 'text-[#94A3B8] hover:text-[#E2E8F0]'}`}
              >
                <div className={`${view === item.id ? 'bg-[#2DD4BF]/10 p-2.5 rounded-2xl' : ''}`}>{item.icon}</div>
                <span className="text-[8px] font-black uppercase tracking-[0.1em]">{item.label}</span>
              </button>
            ))}
          </div>
        </nav>
      )}
    </div>
  );
}
