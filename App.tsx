
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  ViewState, 
  Trip, 
  VehicleType, 
  TripStatus, 
  RequestStatus, 
  JoinRequest, 
  Notification, 
  User, 
  Transaction 
} from './types';
import { Icons, MOCK_USER, MOCK_TRIPS } from './constants';
import { 
  generateTripDescription, 
  getRideAdvice, 
  suggestTripPrice, 
  getLiveCopilotUpdate 
} from './services/geminiService';

// --- Comprehensive Kerala Location Database ---
const KERALA_LOCATIONS = [
  // Kochi / Ernakulam
  "Infopark, Kochi", "Technopark, Trivandrum", "SmartCity, Kochi", "Vyttila Hub, Kochi", 
  "Kakkanad, Kochi", "Edappally, Kochi", "Marine Drive, Kochi", "Lulu Mall, Kochi",
  "Aluva Metro Station", "Fort Kochi", "Cherai Beach", "Panampilly Nagar, Kochi",
  "Kalamassery, Kochi", "Nedumbassery (Airport)", "Angamaly, Kochi",
  // Trivandrum
  "East Fort, Trivandrum", "Kazhakkoottam, Trivandrum", "Kowdiar, Trivandrum", 
  "Vizhinjam, Trivandrum", "Pattom, Trivandrum", "Statue, Trivandrum",
  "Technocity, Pallippuram", "Varkala Cliff", "Neyyattinkara",
  // Kozhikode
  "Hilite Mall, Kozhikode", "Mananchira Square, Kozhikode", "Beach Road, Kozhikode",
  "Pantheerankavu, Kozhikode", "Thamarassery, Kozhikode", "Ramanattukara",
  // Thrissur
  "Swaraj Round, Thrissur", "Guruvayur Temple", "Chavakkad, Thrissur", 
  "Wadakkanchery", "Kodungallur", "Athirappilly Falls",
  // Other Districts
  "Munnar, Idukki", "Thodupuzha, Idukki", "Adimali, Idukki", "Thekkady, Idukki",
  "Wayanad (Kalpetta)", "Sulthan Bathery, Wayanad", "Mananthavady, Wayanad",
  "Baker Junction, Kottayam", "Kumarakom, Kottayam", "Pala, Kottayam", "Changanassery",
  "Alappuzha Beach", "Kuttanad, Alappuzha", "Cherthala, Alappuzha", "Kayamkulam",
  "Ashtamudi, Kollam", "Chinnakada, Kollam", "Karunagappally, Kollam", "Beach Road, Kollam",
  "Palakkad Town", "Ottapalam, Palakkad", "Mannarkkad, Palakkad",
  "Manjeri, Malappuram", "Tirur, Malappuram", "Perinthalmanna, Malappuram",
  "Thalassery, Kannur", "Payyannur, Kannur", "Kannur Town",
  "Kanhangad, Kasaragod", "Kasaragod Town", "Nilambur, Malappuram",
  "Adoor, Pathanamthitta", "Thiruvalla, Pathanamthitta", "Sabari Hills"
];

// --- Helper Components ---

const Badge = ({ children, color = 'indigo' }: { children: React.ReactNode, color?: string }) => {
  const colors: Record<string, string> = {
    indigo: 'bg-indigo-50 text-indigo-700 border-indigo-100',
    green: 'bg-green-50 text-green-700 border-green-100',
    red: 'bg-red-50 text-red-700 border-red-100',
    yellow: 'bg-yellow-50 text-yellow-700 border-yellow-100',
    slate: 'bg-slate-50 text-slate-600 border-slate-100',
  };
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${colors[color]}`}>
      {children}
    </span>
  );
};

/**
 * Enhanced Location Input with Autocomplete & Keyboard Support
 */
const LocationInput = ({ 
  value, 
  onChange, 
  placeholder, 
  icon, 
  onBlur,
  name 
}: { 
  value: string, 
  onChange: (val: string) => void, 
  placeholder: string, 
  icon: React.ReactNode,
  onBlur?: () => void,
  name?: string
}) => {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const suggestionRef = useRef<HTMLDivElement>(null);

  const suggestions = useMemo(() => {
    if (!value || value.length < 1) return [];
    const query = value.toLowerCase();
    
    // Logic: Starts with gets priority, then includes
    const filtered = KERALA_LOCATIONS.filter(loc => 
      loc.toLowerCase().includes(query)
    );

    return filtered.sort((a, b) => {
      const aStarts = a.toLowerCase().startsWith(query);
      const bStarts = b.toLowerCase().startsWith(query);
      if (aStarts && !bStarts) return -1;
      if (!aStarts && bStarts) return 1;
      return a.localeCompare(b);
    }).slice(0, 6);
  }, [value]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev < suggestions.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev > 0 ? prev - 1 : 0));
    } else if (e.key === 'Enter' && selectedIndex >= 0) {
      e.preventDefault();
      onChange(suggestions[selectedIndex]);
      setShowSuggestions(false);
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  return (
    <div className="relative group w-full">
      <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors z-10">
        {icon}
      </div>
      <input 
        name={name}
        type="text" 
        autoComplete="off"
        placeholder={placeholder} 
        className="w-full bg-white border-2 border-slate-200 rounded-3xl py-5 pl-14 pr-6 outline-none font-[1000] text-slate-900 placeholder:text-slate-300 focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all text-base md:text-lg shadow-sm"
        value={value}
        onKeyDown={handleKeyDown}
        onChange={(e) => {
          onChange(e.target.value);
          setShowSuggestions(true);
          setSelectedIndex(-1);
        }}
        onFocus={() => setShowSuggestions(true)}
        onBlur={() => {
          setTimeout(() => {
            setShowSuggestions(false);
            if (onBlur) onBlur();
          }, 200);
        }}
      />
      {showSuggestions && suggestions.length > 0 && (
        <div 
          ref={suggestionRef}
          className="absolute top-full left-0 right-0 mt-3 bg-white/95 backdrop-blur-xl rounded-[32px] shadow-2xl border-2 border-indigo-50 overflow-hidden z-[100] animate-in fade-in slide-in-from-top-4 duration-300"
        >
          <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] px-2">Kerala Locations</p>
            <span className="text-[8px] font-bold text-slate-300 uppercase">Use Arrows to Navigate</span>
          </div>
          <div className="max-h-[300px] overflow-y-auto custom-scroll">
            {suggestions.map((loc, idx) => (
              <button
                key={idx}
                type="button"
                onMouseEnter={() => setSelectedIndex(idx)}
                onMouseDown={() => {
                  onChange(loc);
                  setShowSuggestions(false);
                }}
                className={`w-full text-left px-6 py-5 transition-all flex items-center gap-4 border-b border-slate-50 last:border-0 ${
                  selectedIndex === idx ? 'bg-indigo-600 text-white pl-10' : 'hover:bg-indigo-50 text-slate-800'
                }`}
              >
                <div className={`${selectedIndex === idx ? 'text-white' : 'text-indigo-600'} transition-colors`}>
                  <Icons.Location className="w-5 h-5" />
                </div>
                <span className="text-base font-black tracking-tight">{loc}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const Header = ({ 
  currentView, 
  onViewChange, 
  unreadCount,
  user
}: { 
  currentView: ViewState, 
  onViewChange: (v: ViewState) => void,
  unreadCount: number,
  user: User
}) => (
  <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-xl border-b border-slate-200 px-4 py-3">
    <div className="max-w-6xl mx-auto flex justify-between items-center">
      <div 
        className="flex items-center gap-2 cursor-pointer group" 
        onClick={() => onViewChange('HOME')}
      >
        <div className="bg-indigo-600 p-2 rounded-xl text-white shadow-lg shadow-indigo-200 group-hover:scale-110 transition-transform">
          <Icons.Car />
        </div>
        <span className="font-black text-xl tracking-tighter text-slate-900">PoolPal <span className="text-indigo-600 uppercase italic">Kerala</span></span>
      </div>
      
      <nav className="hidden md:flex items-center gap-8">
        {[
          { id: 'SEARCH', label: 'Explore' },
          { id: 'POST', label: 'Offer Ride' },
          { id: 'MY_TRIPS', label: 'My Journeys' }
        ].map((item) => (
          <button 
            key={item.id}
            onClick={() => onViewChange(item.id as ViewState)} 
            className={`text-xs font-black uppercase tracking-widest transition-all relative py-1 ${
              currentView === item.id 
                ? 'text-indigo-600' 
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            {item.label}
            {currentView === item.id && (
              <span className="absolute -bottom-1 left-0 w-full h-0.5 bg-indigo-600 rounded-full animate-in fade-in zoom-in" />
            )}
          </button>
        ))}
      </nav>

      <div className="flex items-center gap-2">
        <button 
          onClick={() => onViewChange('NOTIFICATIONS')}
          className="relative p-2.5 text-slate-500 hover:bg-slate-100 rounded-2xl transition-all active:scale-95"
        >
          <Icons.Bell />
          {unreadCount > 0 && (
            <span className="absolute top-2 right-2 bg-red-500 text-white text-[9px] font-black w-4 h-4 flex items-center justify-center rounded-full border-2 border-white shadow-sm animate-bounce">
              {unreadCount}
            </span>
          )}
        </button>
        <button 
          onClick={() => onViewChange('PROFILE')}
          className="w-10 h-10 rounded-2xl border-2 border-slate-100 overflow-hidden hover:border-indigo-500 transition-all p-0.5 bg-white shadow-sm active:scale-95"
        >
          <img src={user.avatar} alt="Profile" className="w-full h-full object-cover rounded-[14px]" />
        </button>
      </div>
    </div>
  </header>
);

const BottomNav = ({ currentView, onViewChange }: { currentView: ViewState, onViewChange: (v: ViewState) => void }) => (
  <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-xl border-t border-slate-200 px-6 py-3 flex justify-between items-center z-50 rounded-t-[32px] shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)]">
    {[
      { id: 'HOME', icon: <Icons.Home />, label: 'Home' },
      { id: 'SEARCH', icon: <Icons.Search />, label: 'Find' },
      { id: 'POST', icon: <Icons.Plus />, label: 'Offer' },
      { id: 'MY_TRIPS', icon: <Icons.Trips />, label: 'Activity' }
    ].map(item => (
      <button 
        key={item.id}
        onClick={() => onViewChange(item.id as ViewState)} 
        className={`flex flex-col items-center gap-1 transition-all ${currentView === item.id ? 'text-indigo-600 scale-110' : 'text-slate-400'}`}
      >
        <div className={`${currentView === item.id ? 'bg-indigo-50 p-2 rounded-xl' : ''}`}>{item.icon}</div>
        <span className="text-[9px] font-black uppercase tracking-widest">{item.label}</span>
      </button>
    ))}
  </nav>
);

const TripCard: React.FC<{ 
  trip: Trip, 
  onJoin: (id: string, message: string) => void, 
  onCancel: (id: string) => void,
  onTrack?: (id: string) => void,
  isOwner: boolean,
  alreadyRequested?: boolean
}> = ({ trip, onJoin, onCancel, onTrack, isOwner, alreadyRequested }) => {
  const [isRequesting, setIsRequesting] = useState(false);
  const [requestMessage, setRequestMessage] = useState("Hi! Heading your way in Kerala, would love to join the ride!");

  const handleSendRequest = () => {
    onJoin(trip.id, requestMessage);
    setIsRequesting(false);
  };

  const statusColors = {
    [TripStatus.OPEN]: 'indigo',
    [TripStatus.FULL]: 'slate',
    [TripStatus.STARTED]: 'green',
    [TripStatus.COMPLETED]: 'slate',
    [TripStatus.CANCELLED]: 'red',
  };

  return (
    <div className={`bg-white rounded-[40px] p-8 shadow-sm border border-slate-100 hover:shadow-2xl hover:shadow-indigo-500/5 transition-all relative group overflow-hidden ${trip.status === TripStatus.CANCELLED ? 'opacity-60 grayscale' : ''}`}>
      <div className="flex justify-between items-start mb-6">
        <div className="flex items-center gap-4">
          <div className="relative">
            <img src={trip.ownerAvatar} className="w-16 h-16 rounded-[24px] object-cover border-4 border-slate-50 shadow-sm" />
            <div className="absolute -bottom-1 -right-1 bg-white p-1 rounded-lg shadow-sm">
              <Icons.Star />
            </div>
          </div>
          <div>
            <h4 className="font-[1000] text-slate-900 tracking-tight leading-none mb-2 text-lg">{trip.ownerName}</h4>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter bg-slate-100 px-2 py-0.5 rounded-md">
                {trip.ownerTripsCount} Logs
              </span>
              <span className="text-[10px] font-bold text-yellow-600">{trip.ownerRating} ★</span>
            </div>
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <Badge color={statusColors[trip.status]}>{trip.status}</Badge>
          {trip.status === TripStatus.STARTED && (
            <div className="flex items-center gap-1">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              <span className="text-[9px] font-black text-green-600 uppercase tracking-widest">Live Trip</span>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-4 mb-6 relative px-2">
        <div className="absolute left-[13px] top-[14px] bottom-[14px] w-1 bg-gradient-to-b from-indigo-500 via-indigo-100 to-indigo-500 rounded-full" />
        
        <div className="flex items-start gap-6 pl-1">
          <div className="w-7 h-7 rounded-full bg-white border-4 border-indigo-600 flex-shrink-0 z-10 shadow-sm" />
          <div className="flex-1 -mt-1">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] mb-1">Origin</p>
            <p className="text-base font-black text-slate-900 leading-tight">{trip.from}</p>
          </div>
        </div>

        <div className="flex items-start gap-6 pl-1">
          <div className="w-7 h-7 rounded-full bg-indigo-600 border-4 border-indigo-100 flex-shrink-0 z-10 shadow-md" />
          <div className="flex-1 -mt-1">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] mb-1">Destination</p>
            <p className="text-base font-black text-slate-900 leading-tight">{trip.to}</p>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between p-5 bg-slate-50 rounded-[28px] border border-slate-100 mb-6">
        <div className="flex gap-6">
          <div className="text-center">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Start</p>
            <p className="text-xs font-[1000] text-slate-900">{trip.time}</p>
          </div>
          <div className="w-px h-8 bg-slate-200" />
          <div className="text-center">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Vehicle</p>
            <p className="text-xs font-[1000] text-slate-900 truncate max-w-[90px]">{trip.vehicleModel}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-0.5">Fare</p>
          <p className="text-2xl font-[1000] text-slate-900">₹{trip.pricePerSeat.toFixed(0)}</p>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {!isOwner && (
          <div className="flex items-center justify-between px-1">
            <span className="text-[10px] font-[1000] text-slate-500 uppercase tracking-widest">
              {trip.status === TripStatus.OPEN ? `${trip.availableSeats} Seats Left` : 'Full'}
            </span>
            {trip.status === TripStatus.STARTED ? (
              <button 
                onClick={() => onTrack?.(trip.id)}
                className="bg-green-600 hover:bg-green-700 text-white text-[10px] font-black px-8 py-3.5 rounded-2xl shadow-xl shadow-green-100 transition-all hover:scale-105 active:scale-95 flex items-center gap-2 uppercase tracking-widest"
              >
                <Icons.Map className="w-4 h-4" /> Track Now
              </button>
            ) : alreadyRequested ? (
              <Badge color="slate">Requested</Badge>
            ) : trip.status === TripStatus.OPEN && !isRequesting && (
              <button 
                onClick={() => setIsRequesting(true)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-[1000] px-8 py-3.5 rounded-2xl shadow-xl shadow-indigo-100 transition-all hover:scale-105 active:scale-95 uppercase tracking-widest"
              >
                Book Pool
              </button>
            )}
          </div>
        )}

        {isOwner && (
          <div className="flex items-center justify-between">
            {trip.status === TripStatus.STARTED ? (
              <button 
                onClick={() => onTrack?.(trip.id)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-black px-8 py-3.5 rounded-2xl shadow-xl shadow-indigo-100 transition-all hover:scale-105 active:scale-95 flex items-center gap-2 uppercase tracking-widest"
              >
                <Icons.Map className="w-4 h-4" /> Live Hub
              </button>
            ) : (
              <Badge color="indigo">Your Trip</Badge>
            )}
            {trip.status === TripStatus.OPEN && (
              <button 
                onClick={() => onCancel(trip.id)}
                className="text-[10px] font-black text-red-400 hover:text-red-600 transition-colors uppercase tracking-[0.2em]"
              >
                Cancel
              </button>
            )}
          </div>
        )}

        {isRequesting && (
          <div className="bg-slate-50 p-5 rounded-[28px] border-2 border-indigo-100 mt-2 animate-in zoom-in-95 duration-200">
            <p className="text-[10px] font-[1000] text-indigo-600 uppercase mb-3 tracking-widest">Message to Host</p>
            <textarea 
              autoFocus
              className="w-full bg-white border-2 border-slate-100 rounded-2xl p-4 text-sm text-slate-900 placeholder:text-slate-300 outline-none resize-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-600 font-black transition-all"
              rows={2}
              value={requestMessage}
              onChange={(e) => setRequestMessage(e.target.value)}
              placeholder="E.g. I am at the main gate..."
            />
            <div className="flex justify-end gap-3 mt-4">
              <button onClick={() => setIsRequesting(false)} className="text-[10px] font-black text-slate-400 px-5 py-2 hover:bg-slate-200 rounded-xl transition-all uppercase">Back</button>
              <button onClick={handleSendRequest} className="bg-indigo-600 text-white text-[10px] font-black px-6 py-2.5 rounded-xl shadow-lg uppercase tracking-widest">Request</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// --- Main App ---

export default function App() {
  const [view, setView] = useState<ViewState>('HOME');
  const [user, setUser] = useState<User>({ ...MOCK_USER, transactions: [] });
  const [trips, setTrips] = useState<Trip[]>(MOCK_TRIPS);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [searchQuery, setSearchQuery] = useState({ from: '', to: '' });
  const [isPosting, setIsPosting] = useState(false);
  const [isSuggestingPrice, setIsSuggestingPrice] = useState(false);
  const [advice, setAdvice] = useState<string[]>([]);
  const [myTripsTab, setMyTripsTab] = useState<'offering' | 'booked'>('offering');
  const [suggestedPrice, setSuggestedPrice] = useState<number | null>(null);
  const [trackingTripId, setTrackingTripId] = useState<string | null>(null);

  const [postFrom, setPostFrom] = useState('');
  const [postTo, setPostTo] = useState('');

  const unreadCount = useMemo(() => notifications.filter(n => !n.isRead).length, [notifications]);

  const [liveProgress, setLiveProgress] = useState(15);
  const [copilotMsg, setCopilotMsg] = useState("Live Tracking Initialized in Kerala. Gemini Co-pilot standing by.");
  const [groundingChunks, setGroundingChunks] = useState<any[]>([]);

  useEffect(() => {
    let interval: any;
    if (view === 'LIVE_TRACKING') {
      interval = setInterval(() => {
        setLiveProgress(prev => (prev >= 100 ? 15 : prev + 0.5));
      }, 5000);
    }
    return () => clearInterval(interval);
  }, [view]);

  useEffect(() => {
    if (view === 'LIVE_TRACKING' && trackingTripId) {
      const trip = trips.find(t => t.id === trackingTripId);
      if (trip) {
        getLiveCopilotUpdate(trip.from, trip.to, liveProgress).then((res: any) => {
          setCopilotMsg(res.text);
          setGroundingChunks(res.grounding || []);
        });
      }
    }
  }, [liveProgress, view, trackingTripId, trips]);

  const addNotification = (title: string, message: string, type: 'INFO' | 'SUCCESS' | 'WARNING' = 'INFO') => {
    const newNotif: Notification = {
      id: `n-${Date.now()}`,
      userId: user.id,
      title,
      message,
      type,
      isRead: false,
      timestamp: Date.now()
    };
    setNotifications(prev => [newNotif, ...prev]);
  };

  const addTransaction = (amount: number, type: 'CREDIT' | 'DEBIT', desc: string) => {
    const tx: Transaction = {
      id: `tx-${Date.now()}`,
      amount,
      type,
      description: desc,
      timestamp: Date.now()
    };
    setUser(prev => ({
      ...prev,
      balance: type === 'CREDIT' ? prev.balance + amount : prev.balance - amount,
      transactions: [tx, ...prev.transactions]
    }));
  };

  const handlePostTrip = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsPosting(true);
    const formData = new FormData(e.currentTarget);
    const from = postFrom;
    const to = postTo;
    const vehicleType = formData.get('vehicleType') as VehicleType;
    const vehicleModel = formData.get('vehicleModel') as string;
    const description = await generateTripDescription(from, to, vehicleModel);

    const newTrip: Trip = {
      id: `t-${Date.now()}`,
      ownerId: user.id,
      ownerName: user.name,
      ownerAvatar: user.avatar,
      ownerRating: user.rating,
      ownerTripsCount: user.tripsCount,
      from,
      to,
      date: formData.get('date') as string,
      time: formData.get('time') as string,
      vehicleType,
      vehicleModel,
      totalSeats: parseInt(formData.get('seats') as string),
      availableSeats: parseInt(formData.get('seats') as string),
      pricePerSeat: parseFloat(formData.get('price') as string),
      status: TripStatus.OPEN,
      description,
      requests: []
    };

    setTrips(prev => [newTrip, ...prev]);
    setIsPosting(false);
    setView('MY_TRIPS');
    setMyTripsTab('offering');
    addNotification('Ride Published', `Your trip from ${from} to ${to} is now accepting requests!`, 'SUCCESS');
  };

  const handleJoinRequest = (tripId: string, message: string) => {
    const trip = trips.find(t => t.id === tripId);
    if (!trip) return;
    const newRequest: JoinRequest = {
      id: `r-${Date.now()}`,
      tripId,
      userId: user.id,
      userName: user.name,
      userAvatar: user.avatar,
      status: RequestStatus.PENDING,
      message,
      timestamp: Date.now()
    };
    setTrips(prev => prev.map(t => t.id === tripId ? { ...t, requests: [...t.requests, newRequest] } : t));
    addNotification('Request Pending', `Request sent to ${trip.ownerName}. Await confirmation.`, 'INFO');
  };

  const handleRequestAction = (tripId: string, requestId: string, action: 'ACCEPT' | 'REJECT') => {
    setTrips(prev => prev.map(t => {
      if (t.id === tripId) {
        const reqs = t.requests.map(r => r.id === requestId ? { ...r, status: action === 'ACCEPT' ? RequestStatus.ACCEPTED : RequestStatus.REJECTED } : r);
        const available = action === 'ACCEPT' ? Math.max(0, t.availableSeats - 1) : t.availableSeats;
        if (action === 'ACCEPT') addNotification('Rider Added', `You've accepted a new rider for your Kerala ride!`, 'SUCCESS');
        return { ...t, requests: reqs, availableSeats: available, status: available === 0 ? TripStatus.FULL : t.status };
      }
      return t;
    }));
  };

  const handleTripLifecycle = (tripId: string, nextStatus: TripStatus) => {
    const trip = trips.find(t => t.id === tripId);
    if (!trip) return;
    if (nextStatus === TripStatus.COMPLETED) {
      const confirmedRiders = trip.requests.filter(r => r.status === RequestStatus.ACCEPTED).length;
      const totalEarnings = confirmedRiders * trip.pricePerSeat;
      if (totalEarnings > 0) addTransaction(totalEarnings, 'CREDIT', `Ride Completion: ${trip.from} to ${trip.to}`);
      addNotification('Trip Completed', confirmedRiders > 0 ? `Well done! You earned ₹${totalEarnings.toFixed(2)}.` : 'Trip finished with no riders.', 'SUCCESS');
      setUser(prev => ({ ...prev, tripsCount: prev.tripsCount + 1 }));
    } else if (nextStatus === TripStatus.STARTED) {
      addNotification('Trip Started', 'Have a safe journey through Kerala! Your passengers have been notified.', 'INFO');
    }
    setTrips(prev => prev.map(t => t.id === tripId ? { ...t, status: nextStatus } : t));
  };

  const handleCancelTrip = (tripId: string) => {
    setTrips(prev => prev.map(t => t.id === tripId ? { ...t, status: TripStatus.CANCELLED } : t));
    addNotification('Ride Cancelled', 'You have cancelled your ride offering.', 'WARNING');
  };

  const handleTrackRide = (id: string) => {
    setTrackingTripId(id);
    setView('LIVE_TRACKING');
    setLiveProgress(15);
  };

  const handlePriceSuggestion = async (from: string, to: string, vehicleType: string) => {
    if (from && to && vehicleType) {
      setIsSuggestingPrice(true);
      try {
        const price = await suggestTripPrice(from, to, vehicleType);
        setSuggestedPrice(price);
      } catch (error) {
        console.error("AI Price Suggestion failed:", error);
      } finally {
        setIsSuggestingPrice(false);
      }
    }
  };

  const renderLiveTracking = () => {
    const trip = trips.find(t => t.id === trackingTripId);
    if (!trip) return null;

    return (
      <div className="h-[calc(100vh-64px)] w-full flex flex-col md:flex-row overflow-hidden bg-slate-950 text-white animate-in zoom-in-95 duration-500">
        <div className="flex-1 relative bg-slate-900 overflow-hidden">
          <div className="absolute inset-0 opacity-20 pointer-events-none">
            <svg className="w-full h-full" viewBox="0 0 800 600">
              <path d="M 100 500 Q 200 400 400 300 T 700 100" fill="none" stroke="white" strokeWidth="4" strokeDasharray="10 10" />
              <path id="route" d="M 100 500 Q 200 400 400 300 T 700 100" fill="none" stroke="#4f46e5" strokeWidth="6" />
            </svg>
          </div>

          <div 
            className="absolute transition-all duration-1000 ease-in-out z-20"
            style={{ 
              left: `${12.5 + (liveProgress * 0.75)}%`, 
              top: `${83.3 - (liveProgress * 0.66)}%`,
              transform: 'translate(-50%, -50%)'
            }}
          >
            <div className="relative">
              <div className="absolute inset-0 bg-indigo-500 blur-xl opacity-50 animate-pulse rounded-full" />
              <div className="bg-indigo-600 p-4 rounded-[20px] shadow-[0_0_40px_rgba(79,70,229,0.8)] border-2 border-white/20">
                <Icons.Car className="w-7 h-7 text-white" />
              </div>
              <div className="absolute -top-12 left-1/2 -translate-x-1/2 whitespace-nowrap bg-white text-slate-900 px-4 py-1.5 rounded-full text-[10px] font-[1000] shadow-2xl uppercase tracking-widest border-2 border-indigo-500">
                {trip.ownerName}
              </div>
            </div>
          </div>

          <div className="absolute top-[30%] left-[40%] text-slate-500 animate-pulse">
            <Icons.Location className="inline w-5 h-5 mr-2" />
            <span className="text-[10px] font-black uppercase tracking-[0.3em]">Kochi Backwaters (Live)</span>
          </div>

          <div className="absolute top-6 left-6 right-6 flex justify-between items-center pointer-events-none">
            <div className="bg-slate-900/80 backdrop-blur-xl p-8 rounded-[40px] border border-white/10 pointer-events-auto shadow-2xl">
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] mb-2">ETA to destination</p>
               <p className="text-4xl font-[1000] tracking-tighter text-white italic">{Math.ceil(45 - (liveProgress * 0.4))} <span className="text-xl">MINS</span></p>
               <p className="text-xs font-black text-indigo-400 mt-2 uppercase tracking-widest flex items-center gap-2"><span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-ping" /> Kerala Hub Traffic: Low</p>
            </div>
            <div className="pointer-events-auto flex flex-col gap-4">
               <button className="bg-red-500 text-white p-5 rounded-[24px] shadow-2xl shadow-red-500/30 hover:scale-110 active:scale-95 transition-all">
                 <Icons.Shield className="w-7 h-7" />
               </button>
               <button onClick={() => setView('MY_TRIPS')} className="bg-slate-800 text-white p-5 rounded-[24px] backdrop-blur-md border border-white/10 hover:scale-110 transition-all shadow-2xl">
                 <Icons.ArrowRight className="w-7 h-7 rotate-180" />
               </button>
            </div>
          </div>
        </div>

        <div className="w-full md:w-[450px] bg-slate-900/50 backdrop-blur-3xl border-l border-white/5 flex flex-col p-10 space-y-10 overflow-y-auto custom-scroll">
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <h3 className="text-3xl font-[1000] tracking-tight text-white uppercase italic">Live Feed</h3>
              <Badge color="green">Active</Badge>
            </div>
            <p className="text-slate-400 text-base font-black uppercase tracking-widest">{trip.from} <span className="text-indigo-500 mx-2">→</span> {trip.to}</p>
          </div>

          <div className="bg-indigo-600/10 border-2 border-indigo-500/20 rounded-[48px] p-8 relative overflow-hidden group shadow-2xl shadow-indigo-500/5">
            <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-125 transition-transform duration-700"><Icons.Sparkles className="w-10 h-10"/></div>
            <div className="relative z-10 space-y-5">
              <div className="flex items-center gap-3">
                <div className="bg-indigo-600 p-2 rounded-xl text-white shadow-lg"><Icons.Sparkles className="w-4 h-4"/></div>
                <span className="text-[10px] font-black uppercase tracking-[0.4em] text-indigo-400">Gemini Kerala Copilot</span>
              </div>
              <p className="text-base font-black leading-relaxed text-indigo-50 italic">
                "{copilotMsg}"
              </p>
              
              {groundingChunks.length > 0 && (
                <div className="flex flex-col gap-3 pt-3">
                  <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Grounding Citations</p>
                  {groundingChunks.map((chunk, idx) => chunk.maps && (
                    <a 
                      key={idx} 
                      href={chunk.maps.uri} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-xs font-black text-indigo-300 hover:text-white underline flex items-center gap-2 transition-colors group/link bg-white/5 p-3 rounded-2xl border border-white/5"
                    >
                      <Icons.Location className="w-4 h-4 group-hover/link:animate-bounce" /> {chunk.maps.title}
                    </a>
                  ))}
                </div>
              )}

              <div className="pt-4 flex flex-wrap gap-3">
                 <span className="bg-indigo-500/20 text-[9px] px-3 py-1.5 rounded-xl border border-indigo-500/30 text-indigo-100 font-black uppercase tracking-widest">NH66: LIVE</span>
                 <span className="bg-white/5 text-[9px] px-3 py-1.5 rounded-xl border border-white/10 text-slate-300 font-black uppercase tracking-widest">METRO: CLEAR</span>
              </div>
            </div>
          </div>

          <div className="space-y-8">
            <h4 className="text-[11px] font-[1000] text-slate-500 uppercase tracking-[0.5em]">Riders on Board</h4>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-6 bg-white/5 rounded-[32px] border-2 border-white/5 hover:border-indigo-500/30 transition-all duration-300 group shadow-sm">
                 <div className="flex items-center gap-5">
                   <img src={trip.ownerAvatar} className="w-14 h-14 rounded-[20px] border-2 border-white/10 object-cover group-hover:scale-110 transition-transform" />
                   <div>
                     <p className="text-base font-[1000] text-white italic">{trip.ownerName}</p>
                     <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{trip.vehicleModel}</p>
                   </div>
                 </div>
                 <button className="bg-indigo-600/20 text-indigo-400 p-3 rounded-2xl border border-indigo-500/20 hover:bg-indigo-600/40 transition-all"><Icons.Bell className="w-5 h-5"/></button>
              </div>
              {trip.requests.filter(r => r.status === RequestStatus.ACCEPTED).map(r => (
                <div key={r.id} className="flex items-center justify-between p-6 bg-white/5 rounded-[32px] border-2 border-white/5 group hover:border-white/10 transition-all shadow-sm">
                   <div className="flex items-center gap-5">
                     <img src={r.userAvatar} className="w-14 h-14 rounded-[20px] border-2 border-white/10 object-cover group-hover:scale-110 transition-transform" />
                     <div>
                       <p className="text-base font-[1000] text-white italic">{r.userName}</p>
                       <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Passenger Pool</p>
                     </div>
                   </div>
                   <button className="bg-white/5 text-slate-500 p-3 rounded-2xl border border-white/10 hover:bg-white/10 transition-all"><Icons.Bell className="w-5 h-5"/></button>
                </div>
              ))}
            </div>
          </div>

          <button 
            className="w-full py-6 rounded-[32px] border-2 border-white/10 text-[11px] font-[1000] text-white uppercase tracking-[0.4em] hover:bg-white/10 transition-all mt-auto active:scale-95 shadow-2xl italic"
            onClick={() => setView('MY_TRIPS')}
          >
            Leave Tracking View
          </button>
        </div>
      </div>
    );
  };

  const renderHome = () => (
    <div className="max-w-6xl mx-auto py-12 px-4 space-y-20">
      <section className="relative text-center space-y-10 py-16">
        <div className="inline-flex items-center gap-3 bg-indigo-50 border-2 border-indigo-100 px-6 py-3 rounded-3xl mb-4 animate-in fade-in slide-in-from-top-4 duration-1000 shadow-sm">
          <Icons.Sparkles className="text-indigo-600 w-5 h-5" />
          <span className="text-[11px] font-[1000] text-indigo-600 uppercase tracking-[0.3em]">God's Own Country Mobility</span>
        </div>
        <h1 className="text-7xl md:text-9xl font-[1000] text-slate-900 tracking-tighter leading-[0.85] animate-in fade-in slide-in-from-bottom-6 duration-700 uppercase italic">
          Pool Kerala.<br /><span className="text-indigo-600">Save Daily.</span>
        </h1>
        <p className="text-slate-600 max-w-2xl mx-auto text-xl md:text-2xl font-black leading-relaxed animate-in fade-in slide-in-from-bottom-10 duration-1000 italic opacity-80">
          Sharing rides through our scenic bypasses and city hubs. Split costs, reduce traffic, and grow our Kerala community.
        </p>
        <div className="flex flex-wrap justify-center gap-6 pt-6 animate-in fade-in slide-in-from-bottom-12 duration-1000">
          <button onClick={() => setView('SEARCH')} className="bg-indigo-600 text-white px-12 py-6 rounded-[32px] font-[1000] text-xl shadow-[0_25px_50px_-12px_rgba(79,70,229,0.3)] hover:scale-105 active:scale-95 transition-all uppercase tracking-widest italic">Find a Pool</button>
          <button onClick={() => setView('POST')} className="bg-white text-slate-900 border-2 border-slate-100 px-12 py-6 rounded-[32px] font-[1000] text-xl hover:bg-slate-50 transition-all hover:border-indigo-600 active:scale-95 uppercase tracking-widest italic shadow-sm">Offer a ride</button>
        </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
        <div 
          onClick={() => setView('WALLET')}
          className="bg-white p-12 rounded-[56px] border border-slate-100 shadow-sm group hover:border-indigo-600 transition-all cursor-pointer relative overflow-hidden"
        >
          <div className="relative z-10">
            <h3 className="font-black text-slate-400 uppercase tracking-[0.4em] text-[11px] mb-6">Your Mallu Wallet</h3>
            <p className="text-6xl font-[1000] text-slate-900 tracking-tighter">₹{user.balance.toFixed(0)}</p>
            <div className="mt-10 flex items-center gap-3 text-indigo-600 font-[1000] text-xs uppercase tracking-widest group-hover:translate-x-2 transition-transform italic">
              View Transactions <Icons.ArrowRight />
            </div>
          </div>
          <div className="absolute top-0 right-0 p-12 opacity-5 group-hover:scale-150 transition-transform duration-1000"><Icons.Wallet className="w-24 h-24"/></div>
        </div>

        <div className="bg-slate-900 p-12 rounded-[56px] text-white relative overflow-hidden shadow-2xl group">
          <div className="relative z-10">
            <h3 className="font-black text-slate-500 uppercase tracking-[0.4em] text-[11px] mb-6">Commuter Class</h3>
            <p className="text-6xl font-[1000] tracking-tighter mb-4 text-white italic">Elite <span className="text-indigo-400">Pioneer</span></p>
            <div className="w-full bg-white/10 h-3 rounded-full mt-8 overflow-hidden">
              <div className="bg-indigo-500 h-full rounded-full w-[85%] group-hover:w-[88%] transition-all duration-1000" />
            </div>
            <p className="text-[10px] font-black uppercase tracking-[0.4em] mt-6 opacity-50 text-slate-400">85% to Mallu Legend Class</p>
          </div>
          <div className="absolute -bottom-10 -right-10 p-12 opacity-5 scale-[3] rotate-12"><Icons.Star className="text-white"/></div>
        </div>

        <div className="bg-indigo-600 p-12 rounded-[56px] text-white relative overflow-hidden shadow-xl shadow-indigo-100 group">
          <div className="relative z-10">
            <h3 className="font-black text-indigo-200 uppercase tracking-[0.4em] text-[11px] mb-6">Green Contribution</h3>
            <p className="text-7xl font-[1000] tracking-tighter text-white">215<span className="text-3xl text-indigo-300 ml-2 italic">KG</span></p>
            <p className="text-xs font-black mt-6 opacity-95 text-white uppercase tracking-[0.3em] italic">You've saved 8 coconut trees this month.</p>
          </div>
          <div className="absolute bottom-0 right-0 p-10 opacity-10 group-hover:scale-150 transition-transform duration-700"><Icons.Sparkles className="w-20 h-20"/></div>
        </div>
      </section>

      <section className="space-y-12">
        <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-6">
          <div className="space-y-2">
            <h2 className="text-5xl font-[1000] text-slate-900 tracking-tight uppercase italic">Kerala Bypass Feeds</h2>
            <p className="text-slate-500 font-black uppercase text-xs tracking-[0.3em]">Recommended ride clusters near you.</p>
          </div>
          <button onClick={() => setView('SEARCH')} className="text-indigo-600 font-[1000] text-sm hover:underline uppercase tracking-[0.3em] italic">Explore All Kerala Hubs</button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {trips.slice(0, 3).map(t => (
            <TripCard 
              key={t.id} 
              trip={t} 
              onJoin={handleJoinRequest} 
              onCancel={handleCancelTrip} 
              onTrack={handleTrackRide}
              isOwner={t.ownerId === user.id}
              alreadyRequested={t.requests.some(r => r.userId === user.id)}
            />
          ))}
        </div>
      </section>
    </div>
  );

  const renderSearch = () => {
    const filteredTrips = trips.filter(t => 
      t.status === TripStatus.OPEN && 
      (t.from.toLowerCase().includes(searchQuery.from.toLowerCase()) || !searchQuery.from) &&
      (t.to.toLowerCase().includes(searchQuery.to.toLowerCase()) || !searchQuery.to)
    );

    return (
      <div className="max-w-6xl mx-auto py-12 px-4 space-y-12 min-h-[85vh]">
        <div className="bg-white p-10 md:p-16 rounded-[64px] shadow-sm border border-slate-100 space-y-12">
          <h2 className="text-5xl font-[1000] text-slate-900 tracking-tight text-center md:text-left uppercase italic">Explore God's Own Routes</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <div className="space-y-4">
              <label className="text-[11px] font-[1000] text-slate-400 uppercase tracking-[0.4em] ml-8">Origin Hub</label>
              <LocationInput 
                placeholder="E.g. Kakkanad or Technopark" 
                icon={<Icons.Location className="w-6 h-6"/>}
                value={searchQuery.from}
                onChange={(val) => setSearchQuery(prev => ({ ...prev, from: val }))}
              />
            </div>
            <div className="space-y-4">
              <label className="text-[11px] font-[1000] text-slate-400 uppercase tracking-[0.4em] ml-8">Destination Hub</label>
              <LocationInput 
                placeholder="E.g. Swaraj Round" 
                icon={<Icons.Location className="w-6 h-6"/>}
                value={searchQuery.to}
                onChange={(val) => setSearchQuery(prev => ({ ...prev, to: val }))}
              />
            </div>
          </div>
          {searchQuery.from && searchQuery.to && (
            <button 
              onClick={async () => {
                const tips = await getRideAdvice(searchQuery.from, searchQuery.to);
                setAdvice(tips);
              }}
              className="bg-indigo-600 text-white font-[1000] text-xs uppercase tracking-[0.3em] px-10 py-5 rounded-[24px] flex items-center gap-3 mx-auto md:mx-0 transition-all active:scale-95 shadow-2xl italic"
            >
              <Icons.Sparkles className="w-5 h-5" /> {advice.length > 0 ? 'Update Travel Intelligence' : 'Get Kerala Travel Advice'}
            </button>
          )}
          {advice.length > 0 && (
            <div className="bg-indigo-50/50 p-10 rounded-[48px] border-2 border-indigo-100 flex flex-col gap-5 animate-in fade-in zoom-in-95 duration-500">
              <div className="flex items-center gap-3 mb-2">
                 <div className="bg-indigo-600 p-2.5 rounded-2xl text-white shadow-xl shadow-indigo-200"><Icons.Sparkles className="w-5 h-5"/></div>
                 <p className="text-[11px] font-[1000] text-indigo-700 uppercase tracking-[0.4em]">Gemini AI Commute Intelligence</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {advice.map((tip, i) => (
                  <div key={i} className="bg-white p-6 rounded-3xl shadow-sm border border-indigo-50 hover:shadow-md transition-shadow group">
                    <div className="w-2 h-2 rounded-full bg-indigo-600 mb-4 group-hover:scale-150 transition-transform" />
                    <p className="text-sm font-black text-slate-800 leading-relaxed italic">"{tip}"</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {filteredTrips.length === 0 ? (
            <div className="col-span-full py-32 text-center opacity-30 italic text-slate-600 font-[1000] text-2xl uppercase tracking-[0.3em]">No bypass activity detected.</div>
          ) : (
            filteredTrips.map(t => (
              <TripCard 
                key={t.id} 
                trip={t} 
                onJoin={handleJoinRequest} 
                onCancel={handleCancelTrip} 
                onTrack={handleTrackRide}
                isOwner={t.ownerId === user.id}
                alreadyRequested={t.requests.some(r => r.userId === user.id)}
              />
            ))
          )}
        </div>
      </div>
    );
  };

  const renderNotifications = () => (
    <div className="max-w-3xl mx-auto py-12 px-4 space-y-12 min-h-[85vh]">
      <div className="flex justify-between items-end">
        <h2 className="text-5xl font-[1000] text-slate-900 tracking-tight uppercase italic">Recent Pings</h2>
        <button 
          onClick={() => setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))}
          className="text-[11px] font-black text-indigo-600 uppercase tracking-[0.4em] hover:text-indigo-800 transition-colors italic underline underline-offset-8"
        >
          Clear Unread
        </button>
      </div>
      <div className="space-y-8">
        {notifications.length === 0 ? (
          <div className="p-32 text-center bg-white rounded-[64px] border-4 border-dashed border-slate-100 opacity-40 italic text-slate-600 font-[1000] text-xl uppercase tracking-widest">
            Nothing in the feed.
          </div>
        ) : (
          notifications.map(n => (
            <div 
              key={n.id} 
              className={`p-10 rounded-[48px] border-2 transition-all flex items-start gap-8 ${
                n.isRead ? 'bg-white border-slate-100 opacity-60' : 'bg-white border-indigo-200 shadow-2xl shadow-indigo-100/20 scale-105'
              }`}
            >
              <div className={`p-5 rounded-[28px] shadow-sm ${
                n.type === 'SUCCESS' ? 'bg-green-50 text-green-600' : 
                n.type === 'WARNING' ? 'bg-red-50 text-red-600' : 'bg-indigo-50 text-indigo-600'
              }`}>
                {n.type === 'SUCCESS' ? '✓' : n.type === 'WARNING' ? '!' : 'i'}
              </div>
              <div className="flex-1">
                <h4 className="font-[1000] text-slate-900 text-xl mb-2 italic uppercase tracking-tight">{n.title}</h4>
                <p className="text-base font-bold text-slate-600 leading-relaxed italic">"{n.message}"</p>
                <p className="text-[10px] font-black text-slate-400 uppercase mt-6 tracking-[0.4em] italic">{new Date(n.timestamp).toLocaleTimeString()}</p>
              </div>
              {!n.isRead && <div className="w-4 h-4 rounded-full bg-indigo-600 mt-5 animate-pulse shadow-[0_0_15px_rgba(79,70,229,1)]" />}
            </div>
          ))
        )}
      </div>
    </div>
  );

  const renderWallet = () => (
    <div className="max-w-5xl mx-auto py-12 px-4 space-y-12 min-h-[85vh]">
      <div className="flex items-center gap-6">
        <button onClick={() => setView('HOME')} className="p-5 hover:bg-slate-200 bg-slate-100 rounded-[28px] transition-all active:scale-95 shadow-sm">
          <Icons.ArrowRight className="rotate-180 text-slate-900 w-6 h-6" />
        </button>
        <h2 className="text-5xl font-[1000] text-slate-900 uppercase italic">Mallu Wallet</h2>
      </div>

      <div className="bg-gradient-to-br from-indigo-700 via-indigo-800 to-slate-900 p-16 md:p-24 rounded-[72px] text-white shadow-2xl relative overflow-hidden group">
        <div className="relative z-10">
          <p className="text-[11px] font-black uppercase tracking-[0.5em] opacity-80 mb-6 text-white">Your Available Pool Balance</p>
          <p className="text-9xl font-[1000] tracking-tighter mb-16 text-white italic">₹{user.balance.toFixed(0)}</p>
          <div className="flex flex-wrap gap-6">
            <button className="bg-white text-indigo-800 px-12 py-6 rounded-[32px] font-[1000] text-base shadow-2xl active:scale-95 transition-all hover:bg-indigo-50 uppercase tracking-widest italic">Request Payout</button>
            <button className="bg-indigo-600/30 backdrop-blur-2xl text-white px-12 py-6 rounded-[32px] font-[1000] text-base border-2 border-white/20 active:scale-95 transition-all hover:bg-indigo-600/50 uppercase tracking-widest italic">Recharge</button>
          </div>
        </div>
        <div className="absolute -top-20 -right-20 p-24 opacity-10 scale-[5] group-hover:rotate-[25deg] transition-transform duration-[2000ms] pointer-events-none"><Icons.Wallet className="text-white"/></div>
      </div>

      <div className="space-y-10">
        <h3 className="text-3xl font-[1000] text-slate-900 uppercase tracking-tight italic">Audit Log</h3>
        <div className="bg-white rounded-[56px] border-2 border-slate-50 shadow-sm overflow-hidden">
          {user.transactions.length === 0 ? (
            <div className="p-32 text-center opacity-30 italic text-slate-600 font-[1000] text-2xl uppercase tracking-[0.3em]">No logs yet.</div>
          ) : (
            <div className="divide-y-2 divide-slate-50">
              {user.transactions.map(tx => (
                <div key={tx.id} className="p-12 flex items-center justify-between hover:bg-slate-50 transition-all group">
                  <div className="flex items-center gap-10">
                    <div className={`p-6 rounded-[32px] shadow-lg transition-transform group-hover:scale-110 ${tx.type === 'CREDIT' ? 'bg-green-50 text-green-600 shadow-green-100' : 'bg-red-50 text-red-600 shadow-red-100'}`}>
                      {tx.type === 'CREDIT' ? '+' : '-'}
                    </div>
                    <div>
                      <p className="font-[1000] text-slate-900 text-2xl mb-2 italic uppercase tracking-tight">{tx.description}</p>
                      <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.4em] italic">{new Date(tx.timestamp).toLocaleString()}</p>
                    </div>
                  </div>
                  <p className={`text-4xl font-[1000] italic ${tx.type === 'CREDIT' ? 'text-green-600' : 'text-red-600'}`}>
                    {tx.type === 'CREDIT' ? '+' : '-'}₹{tx.amount.toFixed(0)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderMyTrips = () => {
    const offering = trips.filter(t => t.ownerId === user.id);
    const booked = trips.filter(t => t.requests.some(r => r.userId === user.id));

    return (
      <div className="max-w-6xl mx-auto py-12 px-4 space-y-12 min-h-[85vh]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-10">
          <h2 className="text-6xl font-[1000] text-slate-900 tracking-tighter uppercase italic">Kerala Logs</h2>
          <div className="bg-slate-200 p-2.5 rounded-[40px] flex gap-3 shadow-inner">
            <button 
              onClick={() => setMyTripsTab('offering')} 
              className={`px-14 py-5 rounded-[32px] text-xs font-[1000] uppercase tracking-widest transition-all ${myTripsTab === 'offering' ? 'bg-white text-indigo-800 shadow-2xl' : 'text-slate-500'}`}
            >
              Driving
            </button>
            <button 
              onClick={() => setMyTripsTab('booked')} 
              className={`px-14 py-5 rounded-[32px] text-xs font-[1000] uppercase tracking-widest transition-all ${myTripsTab === 'booked' ? 'bg-white text-indigo-800 shadow-2xl' : 'text-slate-500'}`}
            >
              Passenger
            </button>
          </div>
        </div>

        {myTripsTab === 'offering' && (
          <div className="space-y-12 animate-in fade-in slide-in-from-left-8 duration-700">
            {offering.length === 0 && (
              <div className="bg-white border-4 border-dashed border-slate-100 p-32 rounded-[72px] text-center opacity-40 italic text-slate-600 font-[1000] text-2xl uppercase tracking-[0.3em]">
                You haven't offered any bypass runs.
              </div>
            )}
            {offering.map(t => (
              <div key={t.id} className={`bg-white rounded-[64px] p-12 md:p-16 border border-slate-100 shadow-sm relative overflow-hidden group ${t.status === TripStatus.CANCELLED ? 'opacity-50 grayscale' : ''}`}>
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-12 mb-16">
                  <div className="flex items-center gap-10">
                    <div className="bg-indigo-600 p-8 rounded-[40px] text-white shadow-[0_25px_60px_-15px_rgba(79,70,229,0.4)] transition-transform group-hover:scale-110"><Icons.Car className="w-10 h-10"/></div>
                    <div>
                      <h4 className="font-[1000] text-4xl tracking-tighter mb-3 text-slate-900 uppercase italic">{t.from} <span className="text-slate-300 mx-3">→</span> {t.to}</h4>
                      <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.5em] italic">{t.date} @ {t.time} • {t.vehicleModel}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-5">
                    <Badge color={t.status === TripStatus.STARTED ? 'green' : 'indigo'}>{t.status}</Badge>
                    <div className="flex gap-4">
                      {t.status === TripStatus.OPEN && (
                        <button onClick={() => handleTripLifecycle(t.id, TripStatus.STARTED)} className="bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-black px-10 py-5 rounded-[24px] shadow-2xl shadow-indigo-100 active:scale-95 transition-all uppercase tracking-[0.3em] italic">Start Hub Log</button>
                      )}
                      {t.status === TripStatus.STARTED && (
                        <div className="flex gap-4">
                          <button onClick={() => handleTrackRide(t.id)} className="bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-black px-10 py-5 rounded-[24px] shadow-2xl active:scale-95 transition-all flex items-center gap-3 uppercase tracking-[0.3em] italic">
                             <Icons.Map className="w-5 h-5"/> Track
                          </button>
                          <button onClick={() => handleTripLifecycle(t.id, TripStatus.COMPLETED)} className="bg-green-600 hover:bg-green-700 text-white text-[11px] font-black px-10 py-5 rounded-[24px] shadow-2xl active:scale-95 transition-all uppercase tracking-[0.3em] italic">End</button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-10 pt-16 border-t-2 border-slate-50">
                  <div className="flex justify-between items-center px-6">
                    <h5 className="text-[11px] font-[1000] text-slate-400 uppercase tracking-[0.5em] italic">Cluster Pool ({t.requests.length} Requests)</h5>
                    {t.availableSeats > 0 && <span className="text-[11px] font-[1000] text-indigo-700 uppercase tracking-[0.4em] italic">{t.availableSeats} Slot Open</span>}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {t.requests.length === 0 && <p className="text-lg text-slate-400 italic font-black px-6 uppercase tracking-widest opacity-40">Awaiting your first bypass partner...</p>}
                    {t.requests.map(r => (
                      <div key={r.id} className="group flex items-center justify-between p-10 bg-slate-50 rounded-[48px] border-2 border-transparent hover:border-indigo-200 hover:bg-white transition-all duration-500 shadow-sm">
                        <div className="flex items-center gap-8">
                          <img src={r.userAvatar} className="w-20 h-20 rounded-[32px] object-cover border-4 border-white shadow-xl group-hover:scale-110 transition-transform duration-500" />
                          <div>
                            <p className="text-xl font-[1000] text-slate-900 mb-2 italic uppercase">{r.userName}</p>
                            <p className="text-xs text-slate-500 font-black italic opacity-80 leading-relaxed max-w-[200px]">"{r.message}"</p>
                          </div>
                        </div>
                        <div className="flex gap-4">
                          {r.status === RequestStatus.PENDING ? (
                            <>
                              <button onClick={() => handleRequestAction(t.id, r.id, 'ACCEPT')} className="bg-indigo-600 text-white text-[11px] font-black px-8 py-4 rounded-2xl shadow-xl hover:bg-indigo-700 transition-all uppercase tracking-widest italic">Confirm</button>
                              <button onClick={() => handleRequestAction(t.id, r.id, 'REJECT')} className="text-slate-400 text-[11px] font-black px-8 py-4 hover:bg-red-50 hover:text-red-500 rounded-2xl transition-all uppercase tracking-widest">Ignore</button>
                            </>
                          ) : (
                            <Badge color={r.status === RequestStatus.ACCEPTED ? 'green' : 'red'}>{r.status}</Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {myTripsTab === 'booked' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 animate-in fade-in slide-in-from-right-8 duration-700 pb-32">
            {booked.length === 0 && (
              <div className="col-span-full bg-white border-4 border-dashed border-slate-100 p-32 rounded-[72px] text-center opacity-40 italic text-slate-600 font-[1000] text-2xl uppercase tracking-[0.3em]">
                Explore the Kerala hubs to find your run.
              </div>
            )}
            {booked.map(t => {
              const myReq = t.requests.find(r => r.userId === user.id);
              return (
                <div key={t.id} className="bg-white rounded-[72px] p-12 border border-slate-100 shadow-sm relative overflow-hidden group hover:shadow-2xl hover:-translate-y-3 transition-all duration-700">
                  <div className="flex justify-between items-start mb-12">
                    <div className="flex items-center gap-8">
                      <img src={t.ownerAvatar} className="w-24 h-24 rounded-[40px] border-4 border-slate-50 shadow-2xl object-cover group-hover:rotate-6 transition-transform duration-700" />
                      <div>
                        <h4 className="font-[1000] text-slate-900 tracking-tight text-3xl mb-2 italic uppercase">{t.ownerName}</h4>
                        <div className="flex items-center gap-3"><div className="bg-yellow-100 p-1.5 rounded-xl shadow-sm"><Icons.Star className="w-5 h-5 text-yellow-600"/></div><span className="text-[11px] font-[1000] text-yellow-700 uppercase tracking-[0.4em] italic">{t.ownerRating} SCORE</span></div>
                      </div>
                    </div>
                    <Badge color={myReq?.status === RequestStatus.ACCEPTED ? 'green' : 'slate'}>{myReq?.status}</Badge>
                  </div>
                  <div className="space-y-10">
                    <div className="flex flex-col gap-3">
                       <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.5em] italic">Bypass Cluster Run</p>
                       <p className="text-2xl font-[1000] text-slate-900 leading-tight italic uppercase tracking-tighter">{t.from} <span className="text-indigo-500 mx-2">→</span> {t.to}</p>
                    </div>
                    <div className="flex justify-between items-center border-t-2 border-slate-50 pt-10">
                      <div className="flex flex-wrap gap-4">
                        <span className="flex items-center gap-3 bg-slate-50 px-5 py-3 rounded-2xl text-[11px] font-black text-slate-600 uppercase tracking-widest italic shadow-sm"><Icons.Calendar className="w-4 h-4"/> {t.date}</span>
                        <span className="flex items-center gap-3 bg-slate-50 px-5 py-3 rounded-2xl text-[11px] font-black text-slate-600 uppercase tracking-widest italic shadow-sm"><Icons.Clock className="w-4 h-4"/> {t.time}</span>
                      </div>
                      <p className="text-4xl font-[1000] text-indigo-700 italic">₹{t.pricePerSeat.toFixed(0)}</p>
                    </div>
                  </div>
                  {t.status === TripStatus.STARTED && (
                    <div className="mt-12 flex gap-5">
                      <button 
                        onClick={() => handleTrackRide(t.id)}
                        className="flex-1 p-6 bg-green-600 text-white rounded-[32px] text-center text-[11px] font-[1000] uppercase tracking-[0.4em] animate-pulse flex items-center justify-center gap-4 shadow-2xl shadow-green-200 italic"
                      >
                         <Icons.Map className="w-6 h-6" /> Live bypass run
                      </button>
                    </div>
                  )}
                  {t.status === TripStatus.COMPLETED && (
                    <div className="mt-12 p-6 bg-slate-50 text-slate-500 rounded-[32px] text-center text-[11px] font-[1000] uppercase tracking-[0.4em] italic opacity-60">Log Finalized</div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  const renderPost = () => (
    <div className="max-w-5xl mx-auto py-12 px-4 pb-64">
      <div className="bg-white rounded-[80px] p-12 md:p-24 shadow-sm border border-slate-100 space-y-16">
        <div className="space-y-4 text-center md:text-left">
          <h2 className="text-7xl font-[1000] text-slate-900 tracking-tighter uppercase italic">Host a run.</h2>
          <p className="text-slate-500 text-2xl font-black italic opacity-80">List your Kerala bypass run and cluster with partners.</p>
        </div>
        <form onSubmit={handlePostTrip} className="space-y-12">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div className="space-y-5">
              <label className="text-[11px] uppercase font-[1000] text-slate-400 tracking-[0.5em] ml-10">Machine Class</label>
              <div className="relative">
                <select 
                  name="vehicleType" 
                  className="w-full bg-white border-2 border-slate-200 rounded-[40px] p-7 outline-none font-[1000] text-slate-900 focus:ring-8 focus:ring-indigo-500/5 focus:border-indigo-600 transition-all appearance-none cursor-pointer text-xl italic" 
                  defaultValue={VehicleType.CAR}
                >
                  <option value={VehicleType.CAR} className="text-slate-900 font-bold uppercase">🚙 Professional Car</option>
                  <option value={VehicleType.BIKE} className="text-slate-900 font-bold uppercase">🏍️ Sports Bike</option>
                </select>
                <div className="absolute right-10 top-1/2 -translate-y-1/2 pointer-events-none text-indigo-500 text-xl font-black">
                  ▼
                </div>
              </div>
            </div>
            <div className="space-y-5">
              <label className="text-[11px] uppercase font-[1000] text-slate-400 tracking-[0.5em] ml-10">Machine Spec</label>
              <input 
                name="vehicleModel" 
                type="text" 
                placeholder="E.g. Virtus or Duke 390" 
                className="w-full bg-white border-2 border-slate-200 rounded-[40px] p-7 outline-none font-[1000] text-slate-900 placeholder:text-slate-200 focus:ring-8 focus:ring-indigo-500/5 focus:border-indigo-600 transition-all text-xl italic" 
                required 
              />
            </div>
          </div>
          <div className="space-y-5">
            <label className="text-[11px] uppercase font-[1000] text-slate-400 tracking-[0.5em] ml-10 italic">Kerala Hub Run</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <LocationInput 
                placeholder="Starting Hub" 
                icon={<Icons.Location className="w-7 h-7"/>}
                value={postFrom}
                onChange={setPostFrom}
                onBlur={() => handlePriceSuggestion(postFrom, postTo, VehicleType.CAR)}
              />
              <LocationInput 
                placeholder="Target Hub" 
                icon={<Icons.Location className="w-7 h-7"/>}
                value={postTo}
                onChange={setPostTo}
                onBlur={() => handlePriceSuggestion(postFrom, postTo, VehicleType.CAR)}
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            <div className="space-y-5">
              <label className="text-[11px] uppercase font-[1000] text-slate-400 tracking-[0.5em] ml-10">Run Date</label>
              <input 
                name="date" 
                type="date" 
                className="w-full bg-white border-2 border-slate-200 rounded-[40px] p-7 outline-none font-[1000] text-slate-900 focus:ring-8 focus:ring-indigo-500/5 focus:border-indigo-600 transition-all text-xl italic" 
                required 
              />
            </div>
            <div className="space-y-5">
              <label className="text-[11px] uppercase font-[1000] text-slate-400 tracking-[0.5em] ml-10">Launch Time</label>
              <input 
                name="time" 
                type="time" 
                className="w-full bg-white border-2 border-slate-200 rounded-[40px] p-7 outline-none font-[1000] text-slate-900 focus:ring-8 focus:ring-indigo-500/5 focus:border-indigo-600 transition-all text-xl italic" 
                required 
              />
            </div>
            <div className="space-y-5">
              <label className="text-[11px] uppercase font-[1000] text-slate-400 tracking-[0.5em] ml-10">Slot Capacity</label>
              <input 
                name="seats" 
                type="number" 
                min="1" 
                max="10" 
                placeholder="Total Slots" 
                className="w-full bg-white border-2 border-slate-200 rounded-[40px] p-7 outline-none font-[1000] text-slate-900 placeholder:text-slate-200 focus:ring-8 focus:ring-indigo-500/5 focus:border-indigo-600 transition-all text-xl italic" 
                required 
              />
            </div>
          </div>
          <div className="space-y-5">
            <label className="text-[11px] uppercase font-[1000] text-slate-400 tracking-[0.5em] ml-10 flex justify-between items-center italic">
              Contribution per seat (₹)
              {isSuggestingPrice && <span className="animate-pulse text-indigo-700 font-[1000]">AI CALCULATING...</span>}
              {!isSuggestingPrice && suggestedPrice && <span className="text-indigo-700 font-[1000]">AI RECOMMENDS ₹{suggestedPrice.toFixed(0)}</span>}
            </label>
            <input 
              name="price" 
              type="number" 
              step="1" 
              placeholder="0.00" 
              className="w-full bg-white border-2 border-slate-200 rounded-[40px] p-10 outline-none font-[1000] text-6xl text-indigo-700 placeholder:text-indigo-100 focus:ring-8 focus:ring-indigo-500/5 focus:border-indigo-600 transition-all shadow-inner italic" 
              required 
            />
          </div>
          <button type="submit" disabled={isPosting} className="w-full bg-slate-900 text-white font-[1000] py-10 rounded-[48px] text-3xl shadow-2xl hover:bg-slate-800 transition-all active:scale-95 disabled:opacity-50 uppercase tracking-[0.3em] italic">
            {isPosting ? 'Mapping Kerala Bypass...' : 'Publish bypass run'}
          </button>
        </form>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen pb-24 md:pb-0 bg-slate-50/50 selection:bg-indigo-100 selection:text-indigo-900 font-sans">
      {view !== 'LIVE_TRACKING' && <Header currentView={view} onViewChange={setView} unreadCount={unreadCount} user={user} />}
      
      <main className={`animate-in fade-in zoom-in-95 duration-700 ${view === 'LIVE_TRACKING' ? '' : 'slide-in-from-bottom-8'}`}>
        {view === 'HOME' && renderHome()}
        {view === 'SEARCH' && renderSearch()}
        {view === 'POST' && renderPost()}
        {view === 'MY_TRIPS' && renderMyTrips()}
        {view === 'NOTIFICATIONS' && renderNotifications()}
        {view === 'WALLET' && renderWallet()}
        {view === 'LIVE_TRACKING' && renderLiveTracking()}
        {view === 'PROFILE' && (
          <div className="max-w-6xl mx-auto py-24 px-4 space-y-20 text-center pb-48">
            <div className="bg-white rounded-[100px] p-16 md:p-32 border border-slate-100 shadow-sm relative overflow-hidden group">
              <div className="relative z-10">
                <div className="relative inline-block mb-16">
                  <img src={user.avatar} className="w-64 h-64 rounded-[80px] mx-auto border-[12px] border-slate-50 shadow-2xl object-cover group-hover:scale-105 transition-transform duration-700" />
                  <div className="absolute -bottom-8 -right-8 bg-indigo-700 text-white px-8 py-4 rounded-3xl text-[11px] font-[1000] shadow-2xl uppercase tracking-[0.4em] italic">Mallu Elite Lvl 8</div>
                </div>
                <h2 className="text-8xl font-[1000] text-slate-900 tracking-tighter mb-6 uppercase italic leading-none">{user.name}</h2>
                <p className="text-slate-500 font-black mb-20 uppercase tracking-[0.5em] text-base italic opacity-70">PoolPal Kerala Partner since 2021</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 max-w-3xl mx-auto">
                  <div onClick={() => setView('WALLET')} className="bg-indigo-700 rounded-[64px] p-14 text-white text-left shadow-2xl shadow-indigo-200 cursor-pointer hover:scale-105 transition-all group/card relative overflow-hidden">
                    <p className="text-[11px] font-black uppercase tracking-[0.5em] opacity-80 mb-6 text-white">Hub Credit</p>
                    <p className="text-7xl font-[1000] tracking-tighter text-white italic leading-none">₹{user.balance.toFixed(0)}</p>
                    <div className="mt-10 flex items-center gap-3 text-white font-[1000] text-xs uppercase opacity-0 group-hover/card:opacity-100 transition-opacity italic">Manage Credit Cluster →</div>
                    <Icons.Wallet className="absolute -bottom-10 -right-10 w-48 h-48 opacity-10 rotate-12" />
                  </div>
                  <div className="bg-slate-900 rounded-[64px] p-14 text-white text-left flex flex-col justify-between shadow-2xl relative overflow-hidden">
                    <div className="space-y-8 relative z-10">
                      <div className="flex justify-between items-end border-b-2 border-white/10 pb-6">
                        <span className="text-[11px] font-black text-slate-400 uppercase tracking-[0.4em]">Runs logged</span>
                        <span className="text-5xl font-[1000] tracking-tighter text-white italic leading-none">{user.tripsCount}</span>
                      </div>
                      <div className="flex justify-between items-end">
                        <span className="text-[11px] font-black text-slate-400 uppercase tracking-[0.4em]">Bypass score</span>
                        <span className="text-5xl font-[1000] tracking-tighter text-white italic leading-none">{user.rating} ★</span>
                      </div>
                    </div>
                    <Icons.Sparkles className="absolute -top-10 -left-10 w-48 h-48 opacity-5" />
                  </div>
                </div>
              </div>
              <div className="absolute -bottom-20 -right-20 p-24 opacity-[0.03] pointer-events-none scale-150 rotate-12 transition-transform duration-[3000ms] group-hover:rotate-90 group-hover:scale-[2]"><Icons.Sparkles className="text-indigo-600 w-64 h-64"/></div>
            </div>
            <button className="text-red-400 font-black text-base uppercase tracking-[0.6em] hover:text-red-600 transition-all decoration-[6px] underline-offset-[16px] hover:underline italic">Revoke bypass session</button>
          </div>
        )}
      </main>

      {view !== 'LIVE_TRACKING' && <BottomNav currentView={view} onViewChange={setView} />}
      
      {/* Dynamic Background Decor */}
      {view !== 'LIVE_TRACKING' && (
        <div className="fixed -z-10 top-0 left-0 w-full h-full pointer-events-none overflow-hidden opacity-30">
          <div className="absolute top-[10%] -left-[10%] w-[80%] h-[70%] bg-indigo-200/40 blur-[180px] rounded-full animate-pulse duration-[12000ms]"></div>
          <div className="absolute bottom-[10%] -right-[15%] w-[70%] h-[60%] bg-blue-200/30 blur-[160px] rounded-full"></div>
          <div className="absolute top-[45%] right-[15%] w-[40%] h-[40%] bg-teal-100/20 blur-[140px] rounded-full"></div>
        </div>
      )}
    </div>
  );
}
