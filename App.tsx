
import React, { useState, useEffect, useRef } from 'react';
import { 
  ViewState, 
  Trip, 
  VehicleType, 
  TripStatus, 
  User,
  Booking,
  JoinRequest,
  RequestStatus,
  VerificationStatus,
  LiveLocation
} from './types';
import { Icons, MOCK_TRIPS, KERALA_LOCATIONS } from './constants';
import { authService, supabase, tripService, kycService } from './services/supabaseService';
import { savePaymentToFirebase } from './services/firebaseService';
import { getRideAdvice, suggestTripPrice } from './services/geminiService';
import { CustomerKYC } from './screens/CustomerKYC';

/**
 * REUSABLE COMPONENTS
 */

const LocationInput = ({ label, placeholder, value, onChange }: { label: string, placeholder: string, value: string, onChange: (v: string) => void }) => {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const suggestions = KERALA_LOCATIONS.filter(loc => 
    loc.toLowerCase().includes(value.toLowerCase()) && value.length > 1
  ).slice(0, 5);

  return (
    <div className="space-y-2 relative" ref={containerRef}>
      <label className="text-[10px] font-black uppercase text-muted ml-4">{label}</label>
      <input 
        value={value}
        onChange={(e) => { onChange(e.target.value); setShowSuggestions(true); }}
        onFocus={() => setShowSuggestions(true)}
        placeholder={placeholder} 
        className="w-full bg-surface-alt p-5 rounded-[24px] font-bold text-main border border-subtle focus:border-[var(--color-primary)] outline-none transition-all" 
      />
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-50 top-[100%] left-0 right-0 bg-surface border border-subtle rounded-2xl mt-2 shadow-2xl overflow-hidden">
          {suggestions.map(loc => (
            <button key={loc} onClick={() => { onChange(loc); setShowSuggestions(false); }} className="w-full text-left p-4 hover:bg-[var(--color-primary)]/10 text-xs font-bold border-b border-subtle last:border-0">{loc}</button>
          ))}
        </div>
      )}
    </div>
  );
};

const MapContainer = ({ lat, lng, accuracy, secondaryLat, secondaryLng, showRoute = false }: { lat: number, lng: number, accuracy?: number, secondaryLat?: number, secondaryLng?: number, showRoute?: boolean }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletInstance = useRef<any>(null);
  const marker1 = useRef<any>(null);
  const accuracyCircle = useRef<any>(null);
  const marker2 = useRef<any>(null);
  const polyline = useRef<any>(null);

  useEffect(() => {
    if (mapRef.current && !leafletInstance.current) {
      // @ts-ignore
      leafletInstance.current = L.map(mapRef.current, { zoomControl: false, attributionControl: false }).setView([lat, lng], 16);
      
      const theme = document.body.getAttribute('data-theme') || 'light';
      const tileUrl = theme === 'dark' 
        ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
        : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

      // @ts-ignore
      L.tileLayer(tileUrl, { maxZoom: 20 }).addTo(leafletInstance.current);
      
      // Accuracy Circle
      // @ts-ignore
      accuracyCircle.current = L.circle([lat, lng], {
        radius: accuracy || 0,
        color: 'var(--color-primary)',
        fillColor: 'var(--color-primary)',
        fillOpacity: 0.05,
        weight: 1,
        dashArray: '5, 5'
      }).addTo(leafletInstance.current);

      // @ts-ignore
      const primaryIcon = L.divIcon({ 
        className: 'live-marker animate-pulse-primary', 
        html: `<div style="width: 100%; height: 100%; border-radius: 50%; background: var(--color-primary); border: 3px solid white; box-shadow: 0 0 15px var(--color-primary);"></div>`,
        iconSize: [24, 24] 
      });
      // @ts-ignore
      marker1.current = L.marker([lat, lng], { icon: primaryIcon, zIndexOffset: 1000 }).addTo(leafletInstance.current);

      if (secondaryLat && secondaryLng) {
        // @ts-ignore
        const secondaryIcon = L.divIcon({ 
          className: 'live-marker', 
          html: `<div style="width: 100%; height: 100%; border-radius: 50%; background: var(--color-error); border: 3px solid white; box-shadow: 0 0 15px var(--color-error);"></div>`,
          iconSize: [24, 24] 
        });
        // @ts-ignore
        marker2.current = L.marker([secondaryLat, secondaryLng], { icon: secondaryIcon }).addTo(leafletInstance.current);
      }
    }

    if (leafletInstance.current) {
      if (marker1.current) marker1.current.setLatLng([lat, lng]);
      
      if (accuracyCircle.current) {
         accuracyCircle.current.setLatLng([lat, lng]);
         if (accuracy) accuracyCircle.current.setRadius(accuracy);
      }
      
      if (secondaryLat && secondaryLng) {
        if (!marker2.current) {
          // @ts-ignore
          const secondaryIcon = L.divIcon({ 
            className: 'live-marker', 
            html: `<div style="width: 100%; height: 100%; border-radius: 50%; background: var(--color-error); border: 3px solid white; box-shadow: 0 0 15px var(--color-error);"></div>`,
            iconSize: [24, 24] 
          });
          // @ts-ignore
          marker2.current = L.marker([secondaryLat, secondaryLng], { icon: secondaryIcon }).addTo(leafletInstance.current);
        } else {
          marker2.current.setLatLng([secondaryLat, secondaryLng]);
        }
        
        if (showRoute) {
          if (polyline.current) polyline.current.remove();
          // @ts-ignore
          polyline.current = L.polyline([[lat, lng], [secondaryLat, secondaryLng]], { 
            color: 'var(--color-primary)', 
            weight: 5, 
            dashArray: '10, 15', 
            opacity: 0.8,
            lineCap: 'round'
          }).addTo(leafletInstance.current);
          
          try {
             leafletInstance.current.fitBounds(polyline.current.getBounds(), { padding: [80, 80] });
          } catch(e) { /* ignore bounds error on init */ }
        }
      } else {
         // Smooth pan only if distance is significant to avoid jitter
         const currentCenter = leafletInstance.current.getCenter();
         const dist = calculateDistance(currentCenter.lat, currentCenter.lng, lat, lng);
         // @ts-ignore
         if (parseFloat(dist) > 0.0001) { // Very rough small distance check
             leafletInstance.current.setView([lat, lng]);
         }
      }
    }
  }, [lat, lng, accuracy, secondaryLat, secondaryLng, showRoute]);

  return <div ref={mapRef} className="h-full w-full rounded-[var(--radius-card)] overflow-hidden border border-subtle bg-surface-alt" />;
};

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

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c;
  return d > 1 ? d.toFixed(1) + ' km' : (d * 1000).toFixed(0) + ' m';
}

/**
 * MAIN APP COMPONENT
 */

export default function App() {
  const [view, setView] = useState<ViewState>('LOGIN');
  const [user, setUser] = useState<User | null>(null);
  const [trips, setTrips] = useState<Trip[]>(MOCK_TRIPS);
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
  const [activeBooking, setActiveBooking] = useState<Booking | null>(null);
  const [authMode, setAuthMode] = useState<'LOGIN' | 'SIGNUP'>('LOGIN');
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [bookingMessage, setBookingMessage] = useState('');
  const [activityTab, setActivityTab] = useState<'OFFERS' | 'BOOKINGS'>('BOOKINGS');
  
  // Payment specific state
  const [paymentMethod, setPaymentMethod] = useState<'UPI' | 'CARD' | 'NET_BANKING' | 'CASH' | null>(null);
  const [processingPayment, setProcessingPayment] = useState(false);

  // GPS & Live Tracking State
  const watchId = useRef<number | null>(null);
  const realtimeChannel = useRef<any>(null);
  const [gpsStatus, setGpsStatus] = useState<'SEARCHING' | 'ACTIVE' | 'ERROR'>('SEARCHING');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Post Ride state
  const [postFrom, setPostFrom] = useState('');
  const [postTo, setPostTo] = useState('');
  const [suggestedPrice, setSuggestedPrice] = useState<number>(150);

  // Driver KYC State
  const [kycForm, setKycForm] = useState({
    fullName: '',
    dob: '',
    gender: 'Male',
    address: '',
    rcNumber: ''
  });
  
  const [kycFiles, setKycFiles] = useState<{
    aadhaarFront: File | null,
    aadhaarBack: File | null,
    selfie: File | null,
    dlFront: File | null,
    dlBack: File | null,
    rcCard: File | null,
    vehiclePhoto: File | null
  }>({
    aadhaarFront: null,
    aadhaarBack: null,
    selfie: null,
    dlFront: null,
    dlBack: null,
    rcCard: null,
    vehiclePhoto: null
  });

  const [kycSubmitting, setKycSubmitting] = useState(false);

  // Initial Sync
  useEffect(() => {
    // Theme sync
    const savedTheme = localStorage.getItem('poolpal_theme') as 'light' | 'dark' | null;
    if (savedTheme) {
      setTheme(savedTheme);
      document.body.setAttribute('data-theme', savedTheme);
    } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setTheme('dark');
      document.body.setAttribute('data-theme', 'dark');
    }

    // Auth sync
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

  // Wake Lock for Live Tracking
  useEffect(() => {
    let wakeLock: any = null;
    const requestWakeLock = async () => {
      if (view === 'LIVE_TRACKING' && 'wakeLock' in navigator) {
        try {
          // @ts-ignore
          wakeLock = await navigator.wakeLock.request('screen');
          console.log('Wake Lock is active');
        } catch (err: any) {
          console.error(`Wake Lock Error: ${err.name}, ${err.message}`);
        }
      }
    };
    
    requestWakeLock();
    
    return () => {
      if (wakeLock) wakeLock.release().then(() => console.log('Wake Lock released'));
    };
  }, [view]);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    document.body.setAttribute('data-theme', newTheme);
    localStorage.setItem('poolpal_theme', newTheme);
  };

  const handlePay = async () => {
    if (!paymentMethod || !selectedTrip || !user) return;
    setProcessingPayment(true);

    const booking: Booking = {
      id: 'pay-' + Math.random().toString(36).substr(2, 9),
      tripId: selectedTrip.id,
      userId: user.id,
      amount: selectedTrip.pricePerSeat,
      perPersonAmount: selectedTrip.pricePerSeat,
      method: paymentMethod,
      status: (paymentMethod === 'UPI' || paymentMethod === 'CARD' || paymentMethod === 'NET_BANKING') ? 'PAID' : 'PENDING',
      timestamp: Date.now(),
      transactionId: 'TXN' + Math.random().toString(36).toUpperCase().substr(2, 6),
      from: selectedTrip.from,
      to: selectedTrip.to,
      ownerName: selectedTrip.ownerName,
      message: bookingMessage
    };

    try {
      await savePaymentToFirebase(booking);
      setActiveBooking(booking);
      
      // Update local trips state to include our request with ACCEPTED status for immediate Live Tracking in this demo
      setTrips(prev => prev.map(t => t.id === selectedTrip.id ? {
        ...t,
        requests: [...t.requests, {
          id: 'req-' + Date.now(),
          userId: user.id,
          userName: user.name,
          userAvatar: user.avatar,
          message: bookingMessage,
          status: RequestStatus.ACCEPTED // Auto-accept for demo purposes so live tracking works immediately
        }]
      } : t));

      setTimeout(() => {
        setProcessingPayment(false);
        setView('RECEIPT');
      }, 1500);
    } catch (err) {
      console.error("Payment failed", err);
      setProcessingPayment(false);
    }
  };

  // Real-time tracking logic with Enhanced GPS
  useEffect(() => {
    const isLive = view === 'LIVE_TRACKING' && selectedTrip;
    
    if (isLive && user) {
      setGpsStatus('SEARCHING');
      
      // 1. Setup Supabase Channel for Broadcasting
      const channelId = `trip_room_${selectedTrip.id}`;
      realtimeChannel.current = supabase.channel(channelId);
      
      realtimeChannel.current
        .on('broadcast', { event: 'location_update' }, ({ payload }: any) => {
          // Update local state when we receive a peer's location
          setTrips(currentTrips => currentTrips.map(t => {
            if (t.id === selectedTrip.id) {
              if (payload.userId === t.ownerId) {
                // Update driver location
                return { ...t, driverLocation: payload.location };
              } else {
                // Update specific rider location
                return {
                  ...t,
                  requests: t.requests.map(r => r.userId === payload.userId ? { ...r, userLocation: payload.location } : r)
                };
              }
            }
            return t;
          }));
        })
        .subscribe((status: string) => {
          if (status === 'SUBSCRIBED') {
             console.log("Connected to Live Trip Room");
          }
        });

      // 2. Setup Native GPS Tracking
      if (navigator.geolocation) {
        watchId.current = navigator.geolocation.watchPosition(
          (pos) => {
            setGpsStatus('ACTIVE');
            const loc: LiveLocation = {
              lat: pos.coords.latitude,
              lng: pos.coords.longitude,
              accuracy: pos.coords.accuracy,
              heading: pos.coords.heading,
              speed: pos.coords.speed,
              timestamp: Date.now()
            };

            // Update local user state immediately
            setUser(prev => prev ? { ...prev, currentLocation: loc } : null);

            // Broadcast to peers
            if (realtimeChannel.current) {
              realtimeChannel.current.send({
                type: 'broadcast',
                event: 'location_update',
                payload: { userId: user.id, location: loc }
              });
            }
          },
          (err) => {
            console.error("Geo Error", err);
            setGpsStatus('ERROR');
          },
          { 
            enableHighAccuracy: true, 
            timeout: 5000, 
            maximumAge: 0 
          }
        );
      } else {
        setGpsStatus('ERROR');
        alert("Geolocation is not supported by this browser.");
      }
    } else {
       // Cleanup if leaving view
       if (watchId.current !== null) navigator.geolocation.clearWatch(watchId.current);
       if (realtimeChannel.current) realtimeChannel.current.unsubscribe();
       setGpsStatus('SEARCHING');
    }

    return () => {
      if (watchId.current !== null) navigator.geolocation.clearWatch(watchId.current);
      if (realtimeChannel.current) realtimeChannel.current.unsubscribe();
    };
  }, [view, selectedTrip?.id, user?.id]);

  useEffect(() => {
    if (postFrom && postTo) {
      suggestTripPrice(postFrom, postTo, 'CAR').then(setSuggestedPrice);
    }
  }, [postFrom, postTo]);

  const handleGuestLogin = () => {
    const guestProfile: User = { 
      id: 'guest-' + Math.random().toString(36).substr(2, 9),
      name: 'Guest Explorer', 
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=Guest`, 
      rating: 5, 
      tripsCount: 0, 
      isOnboarded: true, 
      isVerified: false, 
      driverVerificationStatus: 'NONE', 
      co2Saved: 0, 
      moneySaved: 0, 
      balance: 100 
    };
    setUser(guestProfile);
    localStorage.setItem('poolpal_user', JSON.stringify(guestProfile));
    setView('HOME');
  };

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
          const mockProfile: User = { 
            id: data.user.id,
            name: email.split('@')[0], 
            avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`, 
            rating: 5, 
            tripsCount: 12, 
            isOnboarded: true, 
            isVerified: true, 
            driverVerificationStatus: 'NONE',
            co2Saved: 4.5, 
            moneySaved: 1200, 
            balance: 450 
          };
          setUser(mockProfile);
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

  const handleOnboarding = (name: string) => {
    const newUser: User = { 
      id: user?.id || 'temp-' + Date.now(), 
      name, 
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`, 
      rating: 5, 
      tripsCount: 0, 
      isOnboarded: true, 
      isVerified: false, 
      driverVerificationStatus: 'NONE', 
      co2Saved: 0, 
      moneySaved: 0, 
      balance: 0 
    };
    setUser(newUser);
    localStorage.setItem('poolpal_user', JSON.stringify(newUser));
    setView('ID_VERIFY');
  };

  const handleKYCSubmit = async () => {
    if (!user) return;
    
    // Basic validation
    if (!kycForm.fullName || !kycForm.dob || !kycForm.address || !kycForm.rcNumber) {
      alert("Please fill all text fields.");
      return;
    }
    if (!kycFiles.aadhaarFront || !kycFiles.aadhaarBack || !kycFiles.selfie || !kycFiles.dlFront || !kycFiles.dlBack || !kycFiles.rcCard || !kycFiles.vehiclePhoto) {
      alert("Please upload all required documents.");
      return;
    }

    setKycSubmitting(true);

    try {
      // 1. Upload all files concurrently
      const uploadPromises = [
        kycService.uploadFile(user.id, kycFiles.aadhaarFront, 'aadhaar_front'),
        kycService.uploadFile(user.id, kycFiles.aadhaarBack, 'aadhaar_back'),
        kycService.uploadFile(user.id, kycFiles.selfie, 'selfie'),
        kycService.uploadFile(user.id, kycFiles.dlFront, 'dl_front'),
        kycService.uploadFile(user.id, kycFiles.dlBack, 'dl_back'),
        kycService.uploadFile(user.id, kycFiles.rcCard, 'rc_smartcard'),
        kycService.uploadFile(user.id, kycFiles.vehiclePhoto, 'vehicle_photo'),
      ];

      const [
        aadhaarFrontUrl, aadhaarBackUrl, selfieUrl, 
        dlFrontUrl, dlBackUrl, rcUrl, vehiclePhotoUrl
      ] = await Promise.all(uploadPromises);

      // 2. Prepare Data for DB
      const dbPayload = {
        user_id: user.id,
        full_name: kycForm.fullName,
        dob: kycForm.dob,
        gender: kycForm.gender,
        address: kycForm.address,
        aadhaar_front_url: aadhaarFrontUrl,
        aadhaar_back_url: aadhaarBackUrl,
        dl_front_url: dlFrontUrl,
        dl_back_url: dlBackUrl,
        rc_url: rcUrl,
        vehicle_photo_url: vehiclePhotoUrl,
        selfie_url: selfieUrl,
        status: 'pending'
      };

      // 3. Insert into driver_kyc table
      await kycService.submitDriverKYC(dbPayload);

      // 4. Update local user state
      const updatedUser: User = {
        ...user,
        driverVerificationStatus: 'PENDING'
      };
      setUser(updatedUser);
      localStorage.setItem('poolpal_user', JSON.stringify(updatedUser));

      alert("Driver KYC Submitted. Verification Under Review.");
      setView('PROFILE');
    } catch (err: any) {
      console.error("KYC Error", err);
      alert("Failed to submit KYC. Please try again.");
    } finally {
      setKycSubmitting(false);
    }
  };

  const renderView = () => {
    switch(view) {
      case 'LOGIN':
        return (
          <div className="min-h-screen flex flex-col items-center justify-center p-8 animate-in fade-in">
            <div className="w-20 h-20 bg-[var(--color-primary)] rounded-[28px] flex items-center justify-center shadow-2xl mb-8 transform -rotate-3">
              <Icons.Car className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-4xl font-black italic uppercase text-main mb-2">RIDEva</h1>
            <p className="text-muted text-[9px] font-black uppercase tracking-[0.4em] mb-12">Community Mobility</p>
            <form onSubmit={handleEmailAuth} className="w-full space-y-4">
              <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="Email Address" className="w-full bg-surface-alt p-5 rounded-[24px] font-bold text-main border border-subtle outline-none focus:border-[var(--color-primary)]" required />
              <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" placeholder="Password" className="w-full bg-surface-alt p-5 rounded-[24px] font-bold text-main border border-subtle outline-none focus:border-[var(--color-primary)]" required />
              {error && <p className="text-rose-500 text-[10px] font-bold uppercase text-center">{error}</p>}
              <button disabled={loading} className="w-full bg-[var(--color-primary)] text-white py-5 rounded-[24px] font-black text-xs uppercase tracking-widest shadow-xl shadow-[var(--color-primary)]/20">
                {loading ? 'Processing...' : (authMode === 'LOGIN' ? 'Enter Dashboard' : 'Create Account')}
              </button>
            </form>

            <div className="w-full pt-6 flex flex-col items-center gap-4">
              <button onClick={handleGuestLogin} className="w-full bg-surface-alt text-main py-5 rounded-[24px] font-black text-xs uppercase tracking-widest border border-subtle hover:bg-[var(--color-primary)]/5 transition-all shadow-md">
                Continue as Guest
              </button>
              <button onClick={() => setAuthMode(authMode === 'LOGIN' ? 'SIGNUP' : 'LOGIN')} className="text-muted text-[10px] font-black uppercase tracking-widest">
                {authMode === 'LOGIN' ? "Don't have an account? Sign Up" : "Already have an account? Login"}
              </button>
            </div>
          </div>
        );

      case 'ONBOARDING_PROFILE':
        return (
          <div className="p-8 space-y-8 animate-in slide-in-from-right-8">
            <h2 className="text-3xl font-black italic uppercase text-main">Your Profile</h2>
            <form onSubmit={(e) => { e.preventDefault(); handleOnboarding((e.currentTarget.elements.namedItem('name') as HTMLInputElement).value); }} className="space-y-6">
              <input name="name" placeholder="Full Legal Name" className="w-full bg-surface-alt p-5 rounded-[24px] font-bold text-main border border-subtle outline-none" required />
              <button className="w-full bg-[var(--color-primary)] text-white py-6 rounded-[30px] font-black text-xs uppercase tracking-widest shadow-2xl">Continue</button>
            </form>
          </div>
        );

      case 'ID_VERIFY':
        return (
          <div className="p-8 space-y-8 animate-in slide-in-from-right-8">
            <div className="w-16 h-16 bg-[var(--color-primary)]/10 rounded-2xl flex items-center justify-center text-[var(--color-primary)] mb-4">
              <Icons.Shield className="w-8 h-8" />
            </div>
            <h2 className="text-3xl font-black italic uppercase text-main">Trust & Safety</h2>
            <p className="text-muted text-sm leading-relaxed font-medium">To join our community in Kerala, we need a basic ID verification. This ensures security for all poolers.</p>
            <div className="border-2 border-dashed border-subtle rounded-[40px] p-12 text-center bg-surface-alt cursor-pointer hover:border-[var(--color-primary)]/50 transition-all">
               <Icons.Plus className="w-10 h-10 text-muted mx-auto mb-4" />
               <p className="text-[10px] font-black uppercase text-muted tracking-widest">Upload Aadhaar / Passport</p>
            </div>
            <button onClick={() => { setUser(prev => prev ? {...prev, isVerified: true} : null); setView('HOME'); }} className="w-full bg-[var(--color-primary)] text-white py-6 rounded-[30px] font-black text-xs uppercase tracking-widest shadow-xl">Complete Verification</button>
          </div>
        );

      case 'DRIVER_DOCS':
        return (
          <div className="p-8 space-y-8 animate-in slide-in-from-bottom-8 pb-32">
            <button onClick={() => setView('PROFILE')} className="text-muted text-[10px] font-black uppercase tracking-widest hover:text-main">← Back to Profile</button>
            
            <div className="space-y-2">
              <h2 className="text-3xl font-black italic uppercase text-main tracking-tighter">Driver KYC</h2>
              <p className="text-muted text-xs font-medium">Complete verification to start offering rides.</p>
            </div>
            
            <div className="space-y-10">
              {/* 1. Personal Details */}
              <div className="space-y-4">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-[var(--color-primary)]">Personal Details</h3>
                <div className="space-y-3">
                  <input 
                    value={kycForm.fullName} 
                    onChange={e => setKycForm({...kycForm, fullName: e.target.value})} 
                    placeholder="Full Legal Name" 
                    className="w-full bg-surface-alt p-5 rounded-[24px] font-bold text-main border border-subtle outline-none focus:border-[var(--color-primary)]" 
                  />
                  <div className="flex gap-4">
                    <input 
                      type="date"
                      value={kycForm.dob} 
                      onChange={e => setKycForm({...kycForm, dob: e.target.value})} 
                      className="w-full bg-surface-alt p-5 rounded-[24px] font-bold text-main border border-subtle outline-none focus:border-[var(--color-primary)]" 
                    />
                    <select 
                      value={kycForm.gender} 
                      onChange={e => setKycForm({...kycForm, gender: e.target.value})} 
                      className="w-full bg-surface-alt p-5 rounded-[24px] font-bold text-main border border-subtle outline-none focus:border-[var(--color-primary)]"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <textarea 
                    value={kycForm.address} 
                    onChange={e => setKycForm({...kycForm, address: e.target.value})} 
                    placeholder="Permanent Address" 
                    rows={3}
                    className="w-full bg-surface-alt p-5 rounded-[24px] font-bold text-main border border-subtle outline-none focus:border-[var(--color-primary)] resize-none" 
                  />
                </div>
              </div>

              {/* 2. Aadhaar Upload */}
              <div className="space-y-4">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-[var(--color-primary)]">Aadhaar Card</h3>
                <div className="grid grid-cols-2 gap-4">
                  <FileUploadField 
                    label="Front Side" 
                    icon={<Icons.Shield className="w-4 h-4" />} 
                    selectedFile={kycFiles.aadhaarFront}
                    onFileSelect={(file) => setKycFiles({...kycFiles, aadhaarFront: file})} 
                  />
                  <FileUploadField 
                    label="Back Side" 
                    icon={<Icons.Shield className="w-4 h-4" />} 
                    selectedFile={kycFiles.aadhaarBack}
                    onFileSelect={(file) => setKycFiles({...kycFiles, aadhaarBack: file})} 
                  />
                </div>
              </div>

              {/* 3. Selfie */}
              <div className="space-y-4">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-[var(--color-primary)]">Profile Verification</h3>
                <FileUploadField 
                  label="Take a Selfie" 
                  icon={<Icons.User className="w-4 h-4" />} 
                  selectedFile={kycFiles.selfie}
                  onFileSelect={(file) => setKycFiles({...kycFiles, selfie: file})} 
                />
              </div>

              {/* 4. Driving License */}
              <div className="space-y-4">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-[var(--color-primary)]">Driving License</h3>
                <div className="grid grid-cols-2 gap-4">
                  <FileUploadField 
                    label="DL Front" 
                    icon={<Icons.Car className="w-4 h-4" />} 
                    selectedFile={kycFiles.dlFront}
                    onFileSelect={(file) => setKycFiles({...kycFiles, dlFront: file})} 
                  />
                  <FileUploadField 
                    label="DL Back" 
                    icon={<Icons.Car className="w-4 h-4" />} 
                    selectedFile={kycFiles.dlBack}
                    onFileSelect={(file) => setKycFiles({...kycFiles, dlBack: file})} 
                  />
                </div>
              </div>

              {/* 5. RC Upload */}
              <div className="space-y-4">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-[var(--color-primary)]">Vehicle Details</h3>
                <input 
                  value={kycForm.rcNumber} 
                  onChange={e => setKycForm({...kycForm, rcNumber: e.target.value})} 
                  placeholder="Vehicle Registration Number" 
                  className="w-full bg-surface-alt p-5 rounded-[24px] font-bold text-main border border-subtle outline-none focus:border-[var(--color-primary)]" 
                />
                <div className="grid grid-cols-2 gap-4">
                  <FileUploadField 
                    label="RC Smartcard" 
                    icon={<Icons.Car className="w-4 h-4" />} 
                    selectedFile={kycFiles.rcCard}
                    onFileSelect={(file) => setKycFiles({...kycFiles, rcCard: file})} 
                  />
                  <FileUploadField 
                    label="Vehicle Photo" 
                    icon={<Icons.Car className="w-4 h-4" />} 
                    selectedFile={kycFiles.vehiclePhoto}
                    onFileSelect={(file) => setKycFiles({...kycFiles, vehiclePhoto: file})} 
                  />
                </div>
              </div>

              <button 
                onClick={handleKYCSubmit}
                disabled={kycSubmitting}
                className="w-full bg-[var(--color-primary)] text-white py-6 rounded-[30px] font-black text-xs uppercase tracking-widest shadow-2xl flex items-center justify-center gap-3"
              >
                {kycSubmitting ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Submit for Review'}
              </button>
            </div>
          </div>
        );

      case 'CUSTOMER_KYC':
        return (
          user ? <CustomerKYC user={user} onBack={() => setView('PROFILE')} onSuccess={() => setView('PROFILE')} /> : null
        );

      case 'HOME':
        return (
          <div className="p-8 space-y-8 animate-in fade-in">
            <div className="bg-surface p-8 rounded-[40px] border border-subtle card-shadow relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-5">
                <Icons.Leaf className="w-24 h-24 text-[var(--color-primary)]" />
              </div>
              <h3 className="text-[var(--color-primary)] text-[10px] font-black uppercase tracking-[0.3em] mb-6">Impact Score</h3>
              <div className="grid grid-cols-2 gap-8 relative z-10">
                <div><p className="text-4xl font-black italic text-main">{user?.co2Saved}kg</p><p className="text-[9px] font-bold text-muted uppercase">CO2 Offset</p></div>
                <div><p className="text-4xl font-black italic text-[var(--color-primary)]">₹{user?.moneySaved}</p><p className="text-[9px] font-bold text-muted uppercase">Fuel Saved</p></div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <button onClick={() => setView('SEARCH')} className="bg-surface p-8 rounded-[40px] border border-subtle card-shadow flex flex-col items-center gap-4 active:scale-95 transition-all">
                <div className="bg-[var(--color-primary)]/10 p-4 rounded-2xl text-[var(--color-primary)]"><Icons.Search /></div>
                <span className="font-black text-[10px] uppercase text-main">Find a Ride</span>
              </button>
              <button onClick={() => setView('POST')} className="bg-surface p-8 rounded-[40px] border border-subtle card-shadow flex flex-col items-center gap-4 active:scale-95 transition-all">
                <div className="bg-[var(--color-primary)]/10 p-4 rounded-2xl text-[var(--color-primary)]"><Icons.Plus /></div>
                <span className="font-black text-[10px] uppercase text-main">Offer a Ride</span>
              </button>
            </div>
          </div>
        );

      case 'SEARCH':
        return (
          <div className="p-8 space-y-8 animate-in slide-in-from-right-8">
            <h2 className="text-3xl font-black italic uppercase text-main">Active Pools</h2>
            <div className="space-y-4">
              {trips.filter(t => t.status === TripStatus.OPEN).map(trip => (
                <div key={trip.id} onClick={() => { setSelectedTrip(trip); setView('TRIP_DETAIL'); }} className="bg-surface p-6 rounded-[32px] border border-subtle card-shadow flex justify-between items-center active:scale-[0.98] transition-all group">
                  <div className="flex items-center gap-4">
                    <img src={trip.ownerAvatar} className="w-14 h-14 rounded-2xl border border-subtle shadow-xl group-hover:border-[var(--color-primary)]/50 transition-all" />
                    <div className="space-y-1">
                      <p className="text-xs font-black text-main uppercase flex items-center gap-2">
                        {trip.ownerName}
                        <span className="bg-[var(--color-primary)]/10 text-[var(--color-primary)] text-[8px] font-black uppercase px-2 py-0.5 rounded">
                          ★ {trip.ownerRating}
                        </span>
                      </p>
                      <div className="flex items-center gap-2 text-muted">
                        <Icons.Check className="w-2.5 h-2.5 text-[var(--color-primary)]" />
                        <span className="text-[9px] font-bold uppercase">{trip.ownerTripsCount || 0} Rides Done</span>
                      </div>
                      <p className="text-[9px] font-bold text-muted max-w-[150px] truncate">{trip.from.split(',')[0]} → {trip.to.split(',')[0]}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-black text-[var(--color-primary)]">₹{trip.pricePerSeat}</p>
                    <p className="text-[8px] font-bold text-muted uppercase">{trip.availableSeats} Seats Left</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'TRIP_DETAIL':
        return selectedTrip && (
          <div className="p-8 space-y-8 animate-in slide-in-from-bottom-8">
            <button onClick={() => setView('SEARCH')} className="text-muted text-[10px] font-black uppercase trackingest flex items-center gap-2">← Explore More</button>
            <div className="bg-surface p-8 rounded-[48px] border border-subtle card-shadow space-y-8">
              <div className="h-48 rounded-[var(--radius-card)] overflow-hidden">
                <MapContainer lat={8.5471} lng={76.8831} />
              </div>
              <div className="flex items-center gap-5">
                <img src={selectedTrip.ownerAvatar} className="w-20 h-20 rounded-[28px] border-2 border-[var(--color-primary)]" />
                <div>
                  <h3 className="text-xl font-black uppercase text-main">{selectedTrip.ownerName}</h3>
                  <div className="flex items-center gap-3 mt-1 text-muted">
                    <p className="text-[10px] font-black text-[var(--color-primary)] uppercase">★ {selectedTrip.ownerRating} Rating</p>
                    <p className="text-[10px] font-black uppercase">• {selectedTrip.ownerTripsCount || 0} Rides</p>
                  </div>
                </div>
              </div>
              <div className="bg-surface-alt p-6 rounded-3xl space-y-4 border border-subtle">
                <div><p className="text-[8px] font-black uppercase text-muted mb-1">Route</p><p className="text-sm font-bold text-main uppercase italic">{selectedTrip.from} → {selectedTrip.to}</p></div>
              </div>
              <button onClick={() => setView('PAYMENT')} className="w-full bg-[var(--color-primary)] text-white py-6 rounded-[30px] font-black text-xs uppercase tracking-widest shadow-2xl">Confirm & Pay (₹{selectedTrip.pricePerSeat})</button>
            </div>
          </div>
        );

      case 'PAYMENT':
        if (!selectedTrip || !user) return <div className="p-8 text-center text-muted">Loading payment details...</div>;
        return (
          <div className="p-8 space-y-8 animate-in slide-in-from-bottom-8">
            <div className="flex justify-between items-center">
              <button onClick={() => setView('TRIP_DETAIL')} className="text-muted text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:text-main transition-colors">← Back</button>
              <h2 className="text-2xl font-black italic uppercase tracking-tighter text-main">Checkout</h2>
            </div>
            
            <div className="bg-surface p-8 rounded-[40px] border border-subtle card-shadow space-y-4">
              <div className="flex justify-between items-center border-b border-subtle pb-4">
                <span className="text-xs text-main font-bold">Contribution Amount</span>
                <span className="text-2xl font-black text-[var(--color-primary)]">₹{selectedTrip.pricePerSeat}</span>
              </div>
              <p className="text-[8px] font-bold text-muted uppercase">Booking ride from {selectedTrip.ownerName}</p>
            </div>

            <div className="space-y-3">
              <p className="text-[10px] font-black uppercase tracking-widest text-muted ml-4">Select Method</p>
              {[
                { id: 'UPI', icon: <Icons.Wallet />, label: 'UPI Transfer', sub: 'Instant & Secure' },
                { id: 'CARD', icon: <Icons.Shield />, label: 'Credit / Debit Card', sub: 'Visa, Master, RuPay' },
                { id: 'CASH', icon: <Icons.User />, label: 'Pay in Person', sub: 'At the pickup point' }
              ].map(opt => (
                <button 
                  key={opt.id}
                  onClick={() => setPaymentMethod(opt.id as any)}
                  className={`w-full p-6 rounded-[32px] border flex items-center gap-4 transition-all active:scale-[0.98] ${paymentMethod === opt.id ? 'bg-[var(--color-primary)]/10 border-[var(--color-primary)]' : 'bg-surface border-subtle'}`}
                >
                  <div className="w-10 h-10 bg-surface-alt rounded-2xl flex items-center justify-center text-[var(--color-primary)]">{opt.icon}</div>
                  <div className="text-left">
                    <p className="text-main font-black text-xs uppercase tracking-widest">{opt.label}</p>
                    <p className="text-[8px] font-bold text-muted uppercase">{opt.sub}</p>
                  </div>
                </button>
              ))}
            </div>

            <button 
              disabled={!paymentMethod || processingPayment}
              onClick={handlePay}
              className={`w-full py-6 rounded-[30px] font-black text-xs uppercase tracking-widest shadow-2xl transition-all flex items-center justify-center gap-3 ${paymentMethod && !processingPayment ? 'bg-[var(--color-primary)] text-white' : 'bg-surface-alt text-muted cursor-not-allowed'}`}
            >
              {processingPayment ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : `Confirm & Pay ₹${selectedTrip.pricePerSeat}`}
            </button>
          </div>
        );

      case 'RECEIPT':
        if (!activeBooking) return <div className="p-8 text-center text-muted">Receipt not found.</div>;
        return (
          <div className="p-8 min-h-[80vh] flex flex-col justify-center animate-in slide-in-from-bottom-8">
            <div className="bg-main p-1 rounded-[48px] shadow-2xl relative">
              <div className="bg-surface p-8 rounded-[44px] space-y-8 overflow-hidden">
                <div className="flex justify-between items-start border-b border-subtle pb-6">
                  <div className="flex items-center gap-3">
                    <div className="bg-[var(--color-primary)] p-2 rounded-xl text-white"><Icons.Car /></div>
                    <span className="font-black text-xl italic uppercase tracking-tighter text-main">RIDEva</span>
                  </div>
                  <div className="text-right">
                    <p className="text-[8px] font-black uppercase text-muted tracking-widest">Transaction</p>
                    <p className="text-[10px] font-black text-main uppercase">{activeBooking.transactionId}</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex flex-col gap-1">
                    <p className="text-[8px] font-black uppercase text-muted tracking-widest">Route</p>
                    <p className="text-sm font-bold text-main uppercase italic">{activeBooking.from.split(',')[0]} → {activeBooking.to.split(',')[0]}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-[8px] font-black uppercase text-muted tracking-widest">Paid</p>
                      <p className="text-xl font-black italic text-[var(--color-primary)]">₹{activeBooking.amount}</p>
                    </div>
                    <div>
                      <p className="text-[8px] font-black uppercase text-muted tracking-widest">Method</p>
                      <p className="text-[10px] font-black text-main uppercase">{activeBooking.method}</p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-center py-4 border-t border-subtle">
                   <div className="bg-white p-2 rounded-xl shadow-inner border border-slate-100">
                      <img src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${activeBooking.transactionId}`} alt="QR" className="w-20 h-20 opacity-90 mix-blend-multiply" />
                   </div>
                </div>
              </div>
              {/* Ticket visual notches */}
              <div className="absolute left-0 top-[60%] -translate-y-1/2 w-6 h-12 bg-app rounded-r-full -ml-3 border-r border-subtle" />
              <div className="absolute right-0 top-[60%] -translate-y-1/2 w-6 h-12 bg-app rounded-l-full -mr-3 border-l border-subtle" />
            </div>
            <button onClick={() => setView('HOME')} className="mt-10 w-full bg-[var(--color-primary)] text-white py-6 rounded-[30px] font-black text-xs uppercase tracking-widest shadow-2xl transition-all">Back to Home</button>
          </div>
        );

      case 'POST':
        return (
          <div className="p-8 space-y-8 animate-in slide-in-from-bottom-8">
            <h2 className="text-3xl font-black italic uppercase text-main">Offer a Ride</h2>
            <div className="bg-surface p-8 rounded-[48px] border border-subtle card-shadow space-y-6">
              <form onSubmit={(e) => { e.preventDefault(); setView('HOME'); }} className="space-y-6">
                <LocationInput label="Pickup Point" placeholder="Search major junction..." value={postFrom} onChange={setPostFrom} />
                <LocationInput label="Destination" placeholder="Where are you heading?" value={postTo} onChange={setPostTo} />
                <div className="bg-surface-alt p-6 rounded-[32px] border border-subtle">
                   <p className="text-[8px] font-black uppercase text-[var(--color-primary)] mb-2 tracking-widest">Recommended Seat Cost</p>
                   <div className="flex justify-between items-center">
                      <span className="text-2xl font-black italic text-white">₹{suggestedPrice}</span>
                      <span className="text-[9px] font-bold text-muted uppercase">Per Person</span>
                   </div>
                </div>
                <button className="w-full bg-[var(--color-primary)] text-white py-6 rounded-[30px] font-black text-xs uppercase tracking-widest shadow-2xl">Publish Ride</button>
              </form>
            </div>
          </div>
        );

      case 'ACTIVITY':
        return (
          <div className="p-8 space-y-8 animate-in fade-in">
            <h2 className="text-3xl font-black italic uppercase text-main">My Trips</h2>
            <div className="flex bg-surface-alt p-1 rounded-2xl border border-subtle">
              <button onClick={() => setActivityTab('OFFERS')} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activityTab === 'OFFERS' ? 'bg-[var(--color-primary)] text-white shadow-lg' : 'text-muted'}`}>My Offers</button>
              <button onClick={() => setActivityTab('BOOKINGS')} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activityTab === 'BOOKINGS' ? 'bg-[var(--color-primary)] text-white shadow-lg' : 'text-muted'}`}>My Bookings</button>
            </div>
            <div className="space-y-4">
              {activityTab === 'BOOKINGS' ? (
                trips.filter(t => t.requests.some(r => r.userId === user?.id)).map(trip => (
                  <div key={trip.id} className="bg-surface p-6 rounded-[32px] border border-subtle flex justify-between items-center card-shadow">
                    <div className="flex gap-4 items-center">
                      <div className="w-10 h-10 rounded-xl bg-[var(--color-primary)]/10 text-[var(--color-primary)] flex items-center justify-center"><Icons.Car /></div>
                      <div>
                        <p className="text-[10px] font-black text-main uppercase">{trip.from.split(',')[0]} → {trip.to.split(',')[0]}</p>
                        <p className="text-[8px] font-bold text-muted uppercase">{trip.date}</p>
                      </div>
                    </div>
                    <button onClick={() => { setSelectedTrip(trip); setView('LIVE_TRACKING'); }} className="text-[9px] font-black text-[var(--color-primary)] uppercase">Track Live</button>
                  </div>
                ))
              ) : (
                <div className="text-center py-20 opacity-30 text-main"><Icons.History className="mx-auto mb-4" /><p className="text-[10px] font-black uppercase">No active offers</p></div>
              )}
            </div>
          </div>
        );

      case 'PROFILE':
        return (
          <div className="p-8 space-y-12 animate-in fade-in pb-32">
            <div className="text-center space-y-6">
              <div className="relative w-32 h-32 mx-auto">
                 <img src={user?.avatar} className="w-32 h-32 rounded-[48px] border-4 border-[var(--color-primary)]/20 shadow-2xl" />
              </div>
              <div>
                <h2 className="text-3xl font-black italic uppercase text-main tracking-tighter">{user?.name}</h2>
                <div className="flex items-center justify-center gap-2 mt-2">
                   <button onClick={toggleTheme} className="bg-surface-alt text-main px-4 py-2 rounded-full text-[10px] font-black uppercase border border-subtle flex items-center gap-2">
                     {theme === 'light' ? '🌙 Dark Mode' : '☀️ Light Mode'}
                   </button>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
               {/* Identity Verification */}
               <div className="bg-surface p-8 rounded-[40px] border border-subtle card-shadow space-y-6">
                  <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--color-primary)]">Identity Verification</h3>
                  <button onClick={() => setView('CUSTOMER_KYC')} className="w-full bg-surface-alt text-main py-4 rounded-2xl font-black text-[10px] uppercase border border-subtle tracking-widest flex items-center justify-center gap-2">
                     <Icons.Shield className="w-3 h-3" /> Verify ID
                  </button>
               </div>

               {/* Driver Verification */}
               <div className="bg-surface p-8 rounded-[40px] border border-subtle card-shadow space-y-6">
                  <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--color-primary)]">Driver Verification</h3>
                  <button onClick={() => setView('DRIVER_DOCS')} className="w-full bg-surface-alt text-main py-4 rounded-2xl font-black text-[10px] uppercase border border-subtle tracking-widest flex items-center justify-center gap-2">
                     <Icons.Plus className="w-3 h-3" /> Provide Docs
                  </button>
               </div>
            </div>

            <button onClick={() => authService.signOut()} className="w-full bg-rose-500/10 text-rose-500 py-5 rounded-[24px] font-black text-[10px] uppercase border border-rose-500/20 tracking-widest transition-all">Sign Out</button>
          </div>
        );

      case 'LIVE_TRACKING':
        if (!selectedTrip || !user) return null;
        const currentLiveTrip = trips.find(t => t.id === selectedTrip.id);
        const isDriver = user.id === currentLiveTrip?.ownerId;
        const riderRequest = currentLiveTrip?.requests.find(r => r.status === RequestStatus.ACCEPTED || r.status === RequestStatus.PENDING); // Include PENDING for demo visibility
        const peerLocation = isDriver ? riderRequest?.userLocation : currentLiveTrip?.driverLocation;
        const myLocation = user.currentLocation || { lat: 8.5471, lng: 76.8831, timestamp: Date.now() };

        return (
          <div className="h-screen relative flex flex-col animate-in slide-in-from-right-8 overflow-hidden bg-app">
             <div className="absolute top-8 left-8 right-8 z-[1000] flex justify-between items-center pointer-events-none">
                <button onClick={() => setView('ACTIVITY')} className="bg-surface px-6 py-4 rounded-2xl text-main shadow-2xl border border-subtle active:scale-95 transition-all text-[10px] font-black uppercase tracking-widest pointer-events-auto">← Exit</button>
                <div className="bg-surface px-6 py-4 rounded-3xl border border-subtle flex items-center gap-3 shadow-2xl pointer-events-auto backdrop-blur-md bg-opacity-90">
                   <div className={`w-3 h-3 rounded-full ${gpsStatus === 'ACTIVE' ? 'bg-[var(--color-success)] animate-pulse' : gpsStatus === 'ERROR' ? 'bg-[var(--color-error)]' : 'bg-orange-400 animate-bounce'}`}></div>
                   <div className="flex flex-col">
                     <p className="text-[10px] font-black uppercase text-main tracking-widest leading-none">
                       {gpsStatus === 'ACTIVE' ? 'GPS Active' : gpsStatus === 'SEARCHING' ? 'Locating...' : 'GPS Off'}
                     </p>
                     {myLocation.speed && gpsStatus === 'ACTIVE' && (
                        <p className="text-[8px] font-bold text-[var(--color-primary)] uppercase leading-none mt-1">
                          {Math.round(myLocation.speed * 3.6)} km/h
                        </p>
                     )}
                   </div>
                </div>
             </div>
             
             <div className="flex-1 relative z-0">
               <MapContainer lat={myLocation.lat} lng={myLocation.lng} accuracy={myLocation.accuracy} secondaryLat={peerLocation?.lat} secondaryLng={peerLocation?.lng} showRoute={!!peerLocation} />
             </div>
             
             <div className="absolute bottom-10 left-8 right-8 z-[1000]">
                <div className="bg-surface/95 backdrop-blur-3xl border border-subtle p-8 rounded-[40px] shadow-2xl space-y-6">
                   <div className="flex justify-between items-center">
                      <div className="flex items-center gap-4">
                        <img src={isDriver ? riderRequest?.userAvatar : currentLiveTrip?.ownerAvatar} className="w-14 h-14 rounded-2xl border-2 border-[var(--color-primary)]" />
                        <div><p className="text-[10px] font-black uppercase text-muted mb-1">{isDriver ? 'Passenger' : 'Driver'}</p><p className="text-xs font-black text-main uppercase tracking-tight">{isDriver ? (riderRequest?.userName || 'Waiting...') : currentLiveTrip?.ownerName}</p></div>
                      </div>
                      <div className="text-right"><p className="text-[10px] font-black uppercase text-[var(--color-primary)] mb-1">Distance</p><p className="text-lg font-black italic text-main tracking-widest">{peerLocation ? calculateDistance(myLocation.lat, myLocation.lng, peerLocation.lat, peerLocation.lng) : '...'}</p></div>
                   </div>
                   <div className="flex gap-4">
                      <button className="flex-1 bg-surface-alt p-4 rounded-2xl flex items-center justify-center gap-2 text-[10px] font-black uppercase text-main border border-subtle hover:bg-[var(--color-primary)]/10 active:scale-95 transition-all"><Icons.Phone className="w-3 h-3" /> Call</button>
                      <button className="flex-1 bg-[var(--color-primary)] p-4 rounded-2xl flex items-center justify-center gap-2 text-[10px] font-black uppercase text-white shadow-xl shadow-[var(--color-primary)]/20 active:scale-95 transition-all"><Icons.Message className="w-3 h-3" /> Chat</button>
                   </div>
                </div>
             </div>
          </div>
        );

      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-app text-main max-w-xl mx-auto flex flex-col shadow-2xl relative overflow-hidden transition-colors duration-300">
      {view !== 'LOGIN' && view !== 'ONBOARDING_PROFILE' && view !== 'LIVE_TRACKING' && (
        <header className="px-8 py-6 flex justify-between items-center border-b border-subtle sticky top-0 bg-surface/90 backdrop-blur-xl z-50">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setView('HOME')}>
            <div className="bg-[var(--color-primary)] p-2 rounded-xl text-white shadow-lg"><Icons.Car /></div>
            <span className="font-black text-xl italic uppercase tracking-tighter text-main">RIDEva</span>
          </div>
          <button onClick={() => setView('PROFILE')} className="w-10 h-10 rounded-2xl overflow-hidden border-2 border-[var(--color-primary)]/20 active:scale-95 transition-all shadow-md">
            <img src={user?.avatar} className="w-full h-full object-cover" />
          </button>
        </header>
      )}
      <main className={`flex-1 overflow-y-auto custom-scroll ${view === 'LIVE_TRACKING' ? '' : 'pb-32'}`}>{renderView()}</main>
      {view !== 'LOGIN' && view !== 'ONBOARDING_PROFILE' && view !== 'PAYMENT' && view !== 'RECEIPT' && view !== 'LIVE_TRACKING' && (
        <nav className="fixed bottom-10 left-1/2 -translate-x-1/2 w-[90%] max-w-sm pointer-events-none z-50">
          <div className="bg-nav-bg backdrop-blur-3xl border border-subtle shadow-2xl rounded-[40px] px-8 py-5 flex justify-between items-center pointer-events-auto">
            <button onClick={() => setView('HOME')} className={`transition-all p-2 rounded-xl ${view === 'HOME' ? 'text-[var(--color-primary)] bg-[var(--color-primary)]/10 scale-110' : 'text-muted hover:text-main'}`}><Icons.Home /></button>
            <button onClick={() => setView('SEARCH')} className={`transition-all p-2 rounded-xl ${view === 'SEARCH' ? 'text-[var(--color-primary)] bg-[var(--color-primary)]/10 scale-110' : 'text-muted hover:text-main'}`}><Icons.Search /></button>
            <button onClick={() => setView('ACTIVITY')} className={`transition-all p-2 rounded-xl ${view === 'ACTIVITY' ? 'text-[var(--color-primary)] bg-[var(--color-primary)]/10 scale-110' : 'text-muted hover:text-main'}`}><Icons.History /></button>
            <button onClick={() => setView('PROFILE')} className={`transition-all p-2 rounded-xl ${view === 'PROFILE' ? 'text-[var(--color-primary)] bg-[var(--color-primary)]/10 scale-110' : 'text-muted hover:text-main'}`}><Icons.User /></button>
          </div>
        </nav>
      )}
    </div>
  );
}
