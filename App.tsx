
import React, { useState, useEffect } from 'react';
import { 
  ViewState, 
  Trip, 
  VehicleType, 
  TripStatus, 
  RequestStatus, 
  JoinRequest 
} from './types';
import { Icons, MOCK_USER, MOCK_TRIPS } from './constants';
import { generateTripDescription, getRideAdvice } from './services/geminiService';

// --- Components ---

const Header = ({ currentView, onViewChange }: { currentView: ViewState, onViewChange: (v: ViewState) => void }) => (
  <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200 px-4 py-3">
    <div className="max-w-6xl mx-auto flex justify-between items-center">
      <div 
        className="flex items-center gap-2 cursor-pointer" 
        onClick={() => onViewChange('HOME')}
      >
        <div className="bg-indigo-600 p-2 rounded-xl text-white shadow-lg shadow-indigo-200">
          <Icons.Car />
        </div>
        <span className="font-bold text-xl tracking-tight text-slate-900">PoolPal</span>
      </div>
      
      <nav className="hidden md:flex items-center gap-6">
        <button 
          onClick={() => onViewChange('SEARCH')} 
          className={`text-sm font-medium transition-colors ${currentView === 'SEARCH' ? 'text-indigo-600' : 'text-slate-600 hover:text-indigo-600'}`}
        >
          Find a Ride
        </button>
        <button 
          onClick={() => onViewChange('POST')} 
          className={`text-sm font-medium transition-colors ${currentView === 'POST' ? 'text-indigo-600' : 'text-slate-600 hover:text-indigo-600'}`}
        >
          Post a Ride
        </button>
        <button 
          onClick={() => onViewChange('MY_TRIPS')} 
          className={`text-sm font-medium transition-colors ${currentView === 'MY_TRIPS' ? 'text-indigo-600' : 'text-slate-600 hover:text-indigo-600'}`}
        >
          My Journeys
        </button>
      </nav>

      <div className="flex items-center gap-4">
        <button 
          onClick={() => onViewChange('PROFILE')}
          className="w-10 h-10 rounded-full border-2 border-slate-100 overflow-hidden hover:border-indigo-400 transition-colors"
        >
          <img src={MOCK_USER.avatar} alt="Profile" className="w-full h-full object-cover" />
        </button>
      </div>
    </div>
  </header>
);

const BottomNav = ({ currentView, onViewChange }: { currentView: ViewState, onViewChange: (v: ViewState) => void }) => (
  <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-6 py-3 flex justify-between items-center z-50">
    <button onClick={() => onViewChange('HOME')} className={`flex flex-col items-center gap-1 ${currentView === 'HOME' ? 'text-indigo-600' : 'text-slate-400'}`}>
      <Icons.Home />
      <span className="text-[10px] font-medium">Home</span>
    </button>
    <button onClick={() => onViewChange('SEARCH')} className={`flex flex-col items-center gap-1 ${currentView === 'SEARCH' ? 'text-indigo-600' : 'text-slate-400'}`}>
      <Icons.Search />
      <span className="text-[10px] font-medium">Find</span>
    </button>
    <button onClick={() => onViewChange('POST')} className={`flex flex-col items-center gap-1 ${currentView === 'POST' ? 'text-indigo-600' : 'text-slate-400'}`}>
      <Icons.Plus />
      <span className="text-[10px] font-medium">Post</span>
    </button>
    <button onClick={() => onViewChange('MY_TRIPS')} className={`flex flex-col items-center gap-1 ${currentView === 'MY_TRIPS' ? 'text-indigo-600' : 'text-slate-400'}`}>
      <Icons.Trips />
      <span className="text-[10px] font-medium">My Rides</span>
    </button>
  </nav>
);

// Fix: Use React.FC to properly handle standard props like 'key' in JSX and ensure type safety
const TripCard: React.FC<{ trip: Trip, onJoin: (id: string) => void, isOwner: boolean }> = ({ trip, onJoin, isOwner }) => {
  const [showDetails, setShowDetails] = useState(false);

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 hover:shadow-md transition-shadow relative group">
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-3">
          <img src={trip.ownerAvatar} className="w-10 h-10 rounded-full object-cover border border-slate-100" />
          <div>
            <h4 className="font-semibold text-slate-900 leading-tight">{trip.ownerName}</h4>
            <div className="flex items-center gap-1">
              <Icons.Star />
              <span className="text-xs text-slate-500 font-medium">4.8 • {trip.vehicleModel}</span>
            </div>
          </div>
        </div>
        <div className={`px-3 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase ${trip.vehicleType === VehicleType.CAR ? 'bg-blue-50 text-blue-600' : 'bg-orange-50 text-orange-600'}`}>
          {trip.vehicleType}
        </div>
      </div>

      <div className="space-y-3 mb-4">
        <div className="flex gap-3">
          <div className="flex flex-col items-center gap-1 py-1">
            <div className="w-2.5 h-2.5 rounded-full border-2 border-indigo-500 bg-white"></div>
            <div className="w-0.5 h-full bg-slate-100"></div>
            <div className="w-2.5 h-2.5 rounded-full bg-indigo-500"></div>
          </div>
          <div className="flex-1 space-y-3">
            <div>
              <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-widest">From</p>
              <p className="text-sm text-slate-800 font-medium">{trip.from}</p>
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-widest">To</p>
              <p className="text-sm text-slate-800 font-medium">{trip.to}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between py-3 border-t border-slate-50 mb-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 text-slate-500">
            <Icons.Calendar />
            <span className="text-xs">{trip.date}</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-500">
            <Icons.Clock />
            <span className="text-xs">{trip.time}</span>
          </div>
        </div>
        <div className="text-right">
          <p className="text-[10px] text-slate-400 font-bold uppercase">Price</p>
          <p className="text-lg font-bold text-indigo-600">${trip.pricePerSeat}</p>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-slate-500">
          {trip.availableSeats} {trip.availableSeats === 1 ? 'seat' : 'seats'} left
        </span>
        <div className="flex gap-2">
          {!isOwner && trip.status === TripStatus.OPEN && (
            <button 
              onClick={() => onJoin(trip.id)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-4 py-2 rounded-lg shadow-sm transition-colors"
            >
              Request to Join
            </button>
          )}
          {isOwner && (
            <div className="text-xs font-bold text-slate-400 border border-slate-100 px-3 py-2 rounded-lg bg-slate-50">
              Managing Trip
            </div>
          )}
        </div>
      </div>
      
      {trip.description && (
        <p className="mt-4 text-xs text-slate-500 italic line-clamp-2">
          "{trip.description}"
        </p>
      )}
    </div>
  );
};

// --- Main App Layouts ---

export default function App() {
  const [view, setView] = useState<ViewState>('HOME');
  const [trips, setTrips] = useState<Trip[]>(MOCK_TRIPS);
  const [userRequests, setUserRequests] = useState<JoinRequest[]>([]);
  const [searchQuery, setSearchQuery] = useState({ from: '', to: '' });
  const [isPosting, setIsPosting] = useState(false);
  const [advice, setAdvice] = useState<string[]>([]);

  // Load advice for the search query using Gemini
  useEffect(() => {
    if (searchQuery.from && searchQuery.to) {
      const fetchAdvice = async () => {
        const tips = await getRideAdvice(searchQuery.from, searchQuery.to);
        setAdvice(tips);
      };
      fetchAdvice();
    }
  }, [searchQuery.from, searchQuery.to]);

  const handlePostTrip = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsPosting(true);
    const formData = new FormData(e.currentTarget);
    
    const from = formData.get('from') as string;
    const to = formData.get('to') as string;
    const vehicleType = formData.get('vehicleType') as VehicleType;
    const vehicleModel = formData.get('vehicleModel') as string;

    // AI generated description
    const description = await generateTripDescription(from, to, vehicleModel);

    const newTrip: Trip = {
      id: `t-${Date.now()}`,
      ownerId: MOCK_USER.id,
      ownerName: MOCK_USER.name,
      ownerAvatar: MOCK_USER.avatar,
      from,
      to,
      date: formData.get('date') as string,
      time: formData.get('time') as string,
      vehicleType,
      vehicleModel,
      totalSeats: parseInt(formData.get('seats') as string),
      availableSeats: parseInt(formData.get('seats') as string),
      pricePerSeat: parseInt(formData.get('price') as string),
      status: TripStatus.OPEN,
      description: description,
      requests: []
    };

    setTrips([newTrip, ...trips]);
    setIsPosting(false);
    setView('MY_TRIPS');
  };

  const handleJoinRequest = (tripId: string) => {
    const newRequest: JoinRequest = {
      id: `r-${Date.now()}`,
      tripId,
      userId: MOCK_USER.id,
      userName: MOCK_USER.name,
      userAvatar: MOCK_USER.avatar,
      status: RequestStatus.PENDING,
      message: "Hey! I'd like to join your ride.",
      timestamp: Date.now()
    };

    setTrips(trips.map(t => {
      if (t.id === tripId) {
        return { ...t, requests: [...t.requests, newRequest] };
      }
      return t;
    }));

    setUserRequests([...userRequests, newRequest]);
    alert("Request sent successfully!");
  };

  const handleRequestAction = (tripId: string, requestId: string, action: 'ACCEPT' | 'REJECT') => {
    setTrips(trips.map(t => {
      if (t.id === tripId) {
        const newRequests = t.requests.map(r => {
          if (r.id === requestId) {
            return { ...r, status: action === 'ACCEPT' ? RequestStatus.ACCEPTED : RequestStatus.REJECTED };
          }
          return r;
        });
        
        let availableSeats = t.availableSeats;
        if (action === 'ACCEPT') {
          availableSeats = Math.max(0, availableSeats - 1);
        }

        return { 
          ...t, 
          requests: newRequests,
          availableSeats,
          status: availableSeats === 0 ? TripStatus.FULL : t.status
        };
      }
      return t;
    }));
  };

  const renderHome = () => (
    <div className="space-y-12 py-6">
      <section className="text-center px-4 max-w-4xl mx-auto">
        <h1 className="text-4xl md:text-6xl font-extrabold text-slate-900 tracking-tight mb-6">
          The smarter way to <span className="text-indigo-600">commute together.</span>
        </h1>
        <p className="text-lg text-slate-500 mb-8 max-w-2xl mx-auto">
          Share your journey, split the costs, and meet new people. PoolPal connects car and bike owners with travelers heading the same way.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button 
            onClick={() => setView('SEARCH')}
            className="bg-indigo-600 text-white font-bold py-4 px-8 rounded-2xl shadow-xl shadow-indigo-200 hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
          >
            <Icons.Search /> Find a Ride
          </button>
          <button 
            onClick={() => setView('POST')}
            className="bg-white text-indigo-600 border-2 border-indigo-50 px-8 py-4 rounded-2xl font-bold hover:bg-indigo-50 transition-all flex items-center justify-center gap-2"
          >
            <Icons.Plus /> Post a Ride
          </button>
        </div>
      </section>

      <section className="px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-slate-900">Recommended Rides</h2>
            <button onClick={() => setView('SEARCH')} className="text-indigo-600 font-semibold text-sm">View all</button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Fix: Explicitly type 'trip' as 'Trip' to ensure compatibility with TripCard props */}
            {trips.slice(0, 3).map((trip: Trip) => (
              <TripCard 
                key={trip.id} 
                trip={trip} 
                onJoin={handleJoinRequest} 
                isOwner={trip.ownerId === MOCK_USER.id} 
              />
            ))}
          </div>
        </div>
      </section>

      <section className="bg-indigo-600 py-16 px-4 rounded-[40px] text-white overflow-hidden relative">
        <div className="absolute top-0 right-0 p-12 opacity-10">
          <Icons.Car />
        </div>
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 bg-white/20 px-4 py-2 rounded-full mb-6 backdrop-blur-sm">
            <Icons.Sparkles />
            <span className="text-sm font-bold">Powered by Gemini AI</span>
          </div>
          <h2 className="text-3xl font-bold mb-6">Smart Trip Optimization</h2>
          <p className="text-indigo-100 text-lg mb-8">
            Our AI helps you craft the perfect ride description and suggests fair pricing based on your route and vehicle type.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white/10 p-6 rounded-2xl backdrop-blur-sm">
              <h3 className="font-bold text-xl mb-2">Cost Sharing</h3>
              <p className="text-sm text-indigo-100 opacity-80">Reduce travel expenses by up to 75% on every trip.</p>
            </div>
            <div className="bg-white/10 p-6 rounded-2xl backdrop-blur-sm">
              <h3 className="font-bold text-xl mb-2">Eco-Friendly</h3>
              <p className="text-sm text-indigo-100 opacity-80">Lower carbon footprint by filling empty seats.</p>
            </div>
            <div className="bg-white/10 p-6 rounded-2xl backdrop-blur-sm">
              <h3 className="font-bold text-xl mb-2">Safe Community</h3>
              <p className="text-sm text-indigo-100 opacity-80">Verified profiles and community-driven ratings.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );

  const renderSearch = () => (
    <div className="max-w-6xl mx-auto py-8 px-4 space-y-8">
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
        <h2 className="text-2xl font-bold mb-6 text-slate-900 flex items-center gap-2">
          <Icons.Search /> Where are you heading?
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="space-y-1">
            <label className="text-[10px] uppercase font-bold text-slate-400 tracking-widest ml-1">From</label>
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"><Icons.Location /></div>
              <input 
                type="text" 
                placeholder="Starting city/hub" 
                className="w-full bg-slate-50 border-0 rounded-2xl py-4 pl-12 pr-4 text-sm focus:ring-2 focus:ring-indigo-500 transition-all"
                value={searchQuery.from}
                onChange={(e) => setSearchQuery({...searchQuery, from: e.target.value})}
              />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] uppercase font-bold text-slate-400 tracking-widest ml-1">To</label>
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"><Icons.Location /></div>
              <input 
                type="text" 
                placeholder="Destination" 
                className="w-full bg-slate-50 border-0 rounded-2xl py-4 pl-12 pr-4 text-sm focus:ring-2 focus:ring-indigo-500 transition-all"
                value={searchQuery.to}
                onChange={(e) => setSearchQuery({...searchQuery, to: e.target.value})}
              />
            </div>
          </div>
          <div className="flex items-end">
            <button className="w-full bg-indigo-600 text-white font-bold py-4 rounded-2xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100">
              Search Trips
            </button>
          </div>
        </div>

        {advice.length > 0 && (
          <div className="mt-6 p-4 bg-indigo-50 rounded-2xl border border-indigo-100">
            <h4 className="text-sm font-bold text-indigo-600 mb-3 flex items-center gap-2">
              <Icons.Sparkles /> Local Insights for your Route
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {advice.map((tip, idx) => (
                <div key={idx} className="bg-white/60 p-3 rounded-xl text-xs text-indigo-800 font-medium">
                  {tip}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {trips
          .filter(t => 
            t.from.toLowerCase().includes(searchQuery.from.toLowerCase()) && 
            t.to.toLowerCase().includes(searchQuery.to.toLowerCase())
          )
          // Fix: Explicitly type 'trip' as 'Trip' to ensure compatibility with TripCard props
          .map((trip: Trip) => (
            <TripCard 
              key={trip.id} 
              trip={trip} 
              onJoin={handleJoinRequest} 
              isOwner={trip.ownerId === MOCK_USER.id} 
            />
          ))}
        {trips.length === 0 && (
          <div className="col-span-full py-20 text-center">
            <p className="text-slate-400 font-medium">No trips found matching your criteria.</p>
          </div>
        )}
      </div>
    </div>
  );

  const renderPost = () => (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100">
        <div className="mb-8">
          <h2 className="text-3xl font-extrabold text-slate-900">Post a Ride</h2>
          <p className="text-slate-500">Fill empty seats and earn while you travel.</p>
        </div>

        <form onSubmit={handlePostTrip} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase ml-1">Vehicle Type</label>
              <select name="vehicleType" className="w-full bg-slate-50 border-0 rounded-xl p-4 text-sm focus:ring-2 focus:ring-indigo-500">
                <option value={VehicleType.CAR}>Car</option>
                <option value={VehicleType.BIKE}>Bike</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase ml-1">Vehicle Model</label>
              <input name="vehicleModel" type="text" placeholder="e.g. Tesla Model 3" className="w-full bg-slate-50 border-0 rounded-xl p-4 text-sm focus:ring-2 focus:ring-indigo-500" required />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase ml-1">Route Details</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input name="from" type="text" placeholder="From (Starting point)" className="w-full bg-slate-50 border-0 rounded-xl p-4 text-sm focus:ring-2 focus:ring-indigo-500" required />
              <input name="to" type="text" placeholder="To (Destination)" className="w-full bg-slate-50 border-0 rounded-xl p-4 text-sm focus:ring-2 focus:ring-indigo-500" required />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase ml-1">Date</label>
              <input name="date" type="date" className="w-full bg-slate-50 border-0 rounded-xl p-4 text-sm focus:ring-2 focus:ring-indigo-500" required />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase ml-1">Time</label>
              <input name="time" type="time" className="w-full bg-slate-50 border-0 rounded-xl p-4 text-sm focus:ring-2 focus:ring-indigo-500" required />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase ml-1">Available Seats</label>
              <input name="seats" type="number" min="1" max="6" className="w-full bg-slate-50 border-0 rounded-xl p-4 text-sm focus:ring-2 focus:ring-indigo-500" required />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase ml-1">Price per Seat ($)</label>
              <input name="price" type="number" min="1" className="w-full bg-slate-50 border-0 rounded-xl p-4 text-sm focus:ring-2 focus:ring-indigo-500" required />
            </div>
          </div>

          <div className="pt-4">
            <button 
              type="submit" 
              disabled={isPosting}
              className={`w-full bg-indigo-600 text-white font-bold py-4 rounded-2xl shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 ${isPosting ? 'opacity-70 cursor-wait' : ''}`}
            >
              {isPosting ? 'Crafting your trip with AI...' : 'Post Trip'}
            </button>
            <p className="text-center text-[10px] text-slate-400 mt-4 uppercase tracking-widest font-bold">
              AI will automatically generate a trip description for you
            </p>
          </div>
        </form>
      </div>
    </div>
  );

  const renderMyTrips = () => {
    const myOwnedTrips = trips.filter(t => t.ownerId === MOCK_USER.id);
    const myPendingRequests = trips.flatMap(t => t.requests).filter(r => r.userId === MOCK_USER.id);

    return (
      <div className="max-w-6xl mx-auto py-8 px-4 space-y-12">
        <section>
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-slate-900">Rides You're Offering</h2>
            <div className="bg-indigo-50 text-indigo-600 px-4 py-1.5 rounded-full text-sm font-bold">
              {myOwnedTrips.length} Active
            </div>
          </div>
          
          {myOwnedTrips.length === 0 ? (
            <div className="bg-white border-2 border-dashed border-slate-200 p-12 rounded-3xl text-center">
              <p className="text-slate-400 font-medium mb-4">You haven't posted any rides yet.</p>
              <button onClick={() => setView('POST')} className="text-indigo-600 font-bold hover:underline">Create a ride now →</button>
            </div>
          ) : (
            <div className="space-y-6">
              {myOwnedTrips.map(trip => (
                <div key={trip.id} className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-4">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${trip.vehicleType === VehicleType.CAR ? 'bg-blue-50 text-blue-600' : 'bg-orange-50 text-orange-600'}`}>
                          {trip.vehicleType === VehicleType.CAR ? <Icons.Car /> : <Icons.Bike />}
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-900">{trip.from} to {trip.to}</h4>
                          <p className="text-xs text-slate-500">{trip.date} at {trip.time} • {trip.availableSeats} seats left</p>
                        </div>
                      </div>
                      
                      {trip.requests.length > 0 && (
                        <div className="space-y-3 pt-4 border-t border-slate-50">
                          <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Join Requests ({trip.requests.length})</h5>
                          {trip.requests.map(req => (
                            <div key={req.id} className="flex items-center justify-between bg-slate-50 p-3 rounded-2xl">
                              <div className="flex items-center gap-3">
                                <img src={req.userAvatar} className="w-8 h-8 rounded-full" />
                                <div>
                                  <p className="text-xs font-bold text-slate-800">{req.userName}</p>
                                  <p className="text-[10px] text-slate-500 italic">"{req.message}"</p>
                                </div>
                              </div>
                              <div className="flex gap-2">
                                {req.status === RequestStatus.PENDING ? (
                                  <>
                                    <button 
                                      onClick={() => handleRequestAction(trip.id, req.id, 'ACCEPT')}
                                      className="bg-green-600 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg hover:bg-green-700 transition-colors"
                                    >
                                      Accept
                                    </button>
                                    <button 
                                      onClick={() => handleRequestAction(trip.id, req.id, 'REJECT')}
                                      className="bg-red-50 text-red-600 text-[10px] font-bold px-3 py-1.5 rounded-lg hover:bg-red-100 transition-colors"
                                    >
                                      Reject
                                    </button>
                                  </>
                                ) : (
                                  <span className={`text-[10px] font-bold uppercase px-3 py-1.5 rounded-lg ${req.status === RequestStatus.ACCEPTED ? 'text-green-600 bg-green-50' : 'text-red-600 bg-red-50'}`}>
                                    {req.status}
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section>
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-slate-900">Your Bookings</h2>
          </div>
          {myPendingRequests.length === 0 ? (
            <div className="bg-white border-2 border-dashed border-slate-200 p-12 rounded-3xl text-center">
              <p className="text-slate-400 font-medium">You haven't requested to join any rides.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {myPendingRequests.map(req => {
                const trip = trips.find(t => t.id === req.tripId);
                if (!trip) return null;
                return (
                  <div key={req.id} className="bg-white border border-slate-100 p-4 rounded-2xl flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">{trip.from} → {trip.to}</h4>
                      <p className="text-[10px] text-slate-500">{trip.date} • {trip.ownerName}</p>
                    </div>
                    <span className={`text-[10px] font-bold uppercase px-3 py-1.5 rounded-lg ${
                      req.status === RequestStatus.ACCEPTED ? 'text-green-600 bg-green-50' : 
                      req.status === RequestStatus.REJECTED ? 'text-red-600 bg-red-50' : 
                      'text-indigo-600 bg-indigo-50'
                    }`}>
                      {req.status}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    );
  };

  const renderProfile = () => (
    <div className="max-w-4xl mx-auto py-12 px-4">
      <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 text-center">
        <div className="relative inline-block mb-6">
          <img src={MOCK_USER.avatar} className="w-32 h-32 rounded-full border-4 border-indigo-50 object-cover" />
          <div className="absolute bottom-1 right-1 bg-green-500 w-6 h-6 rounded-full border-4 border-white"></div>
        </div>
        <h2 className="text-3xl font-extrabold text-slate-900">{MOCK_USER.name}</h2>
        <p className="text-slate-500 mb-6">{MOCK_USER.vehicle}</p>
        
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-slate-50 p-4 rounded-2xl">
            <p className="text-2xl font-bold text-indigo-600">{MOCK_USER.rating}</p>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Rating</p>
          </div>
          <div className="bg-slate-50 p-4 rounded-2xl">
            <p className="text-2xl font-bold text-indigo-600">{MOCK_USER.tripsCount}</p>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Trips</p>
          </div>
          <div className="bg-slate-50 p-4 rounded-2xl">
            <p className="text-2xl font-bold text-indigo-600">Level 4</p>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Loyalty</p>
          </div>
        </div>

        <div className="space-y-3 text-left">
          <button className="w-full flex items-center justify-between p-4 rounded-2xl bg-slate-50 hover:bg-slate-100 transition-colors">
            <span className="font-semibold text-slate-700">Account Settings</span>
            <span className="text-slate-300">→</span>
          </button>
          <button className="w-full flex items-center justify-between p-4 rounded-2xl bg-slate-50 hover:bg-slate-100 transition-colors">
            <span className="font-semibold text-slate-700">Payment Methods</span>
            <span className="text-slate-300">→</span>
          </button>
          <button className="w-full flex items-center justify-between p-4 rounded-2xl bg-slate-50 hover:bg-slate-100 transition-colors">
            <span className="font-semibold text-slate-700">Environmental Impact</span>
            <div className="flex items-center gap-2">
              <span className="text-xs text-green-600 font-bold">12kg CO2 saved</span>
              <span className="text-slate-300">→</span>
            </div>
          </button>
        </div>

        <button className="mt-8 text-red-500 font-bold hover:underline">Sign Out</button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen pb-20 md:pb-0">
      <Header currentView={view} onViewChange={setView} />
      
      <main className="animate-in fade-in duration-500">
        {view === 'HOME' && renderHome()}
        {view === 'SEARCH' && renderSearch()}
        {view === 'POST' && renderPost()}
        {view === 'MY_TRIPS' && renderMyTrips()}
        {view === 'PROFILE' && renderProfile()}
      </main>

      <BottomNav currentView={view} onViewChange={setView} />
      
      {/* Background Decor */}
      <div className="fixed -z-10 top-0 left-0 w-full h-full pointer-events-none opacity-50 overflow-hidden">
        <div className="absolute top-[10%] -left-20 w-80 h-80 bg-indigo-100 rounded-full blur-[100px]"></div>
        <div className="absolute bottom-[20%] -right-20 w-80 h-80 bg-blue-100 rounded-full blur-[100px]"></div>
      </div>
    </div>
  );
}
