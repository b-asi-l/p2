
import React from 'react';

export const KERALA_LOCATIONS = [
  "Technopark, Trivandrum",
  "Infopark, Kochi",
  "Cyberpark, Kozhikode",
  "Vyttila Hub, Kochi",
  "Alappuzha Backwaters",
  "Munnar Town",
  "Varkala Beach",
  "Wayanad Kalpetta",
  "Kumarakom",
  "Kovalam",
  "Thrissur Swaraj Round",
  "Palakkad Fort",
  "Kottayam Railway Station",
  "Idukki Painavu",
  "Malappuram Town",
  "Kannur Fort",
  "Kasaragod Town"
];

export const Icons = {
  Logo: (props: any) => (
    <div className={`relative flex items-center justify-center overflow-hidden rounded-[24%] bg-white shadow-xl ${props.className}`}>
      {/* Background Gradient Ring */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#16A34A] via-[#FACC15] to-[#EA580C] p-[2px]">
        <div className="w-full h-full bg-white rounded-[22%]" />
      </div>
      
      <div className="relative z-10 flex flex-col items-center justify-center w-full h-full">
        <div className="flex items-end gap-1 mb-1">
          {/* Green Car Representation */}
          <div className="text-[#16A34A] drop-shadow-sm">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
               <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.15-3.42c.12-.35.45-.58.82-.58h10.06c.37 0 .7.23.82.58L19 11H5z"/>
            </svg>
          </div>
          {/* Orange Bike Representation */}
          <div className="text-[#EA580C] drop-shadow-sm">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M15.5 5.5c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zM5 20c-2.8 0-5-2.2-5-5s2.2-5 5-5 5 2.2 5 5-2.2 5-5 5zm0-8c-1.7 0-3 1.3-3 3s1.3 3 3 3 3-1.3 3-3-1.3-3-3-3zm13.5 8c-2.8 0-5-2.2-5-5s2.2-5 5-5 5 2.2 5 5-2.2 5-5 5zm0-8c-1.7 0-3 1.3-3 3s1.3 3 3 3 3-1.3 3-3-1.3-3-3-3zm-3.7-4.4c-.6-.7-1.5-1.1-2.4-1.1H9c-.6 0-1 .4-1 1s.4 1 1 1h3.1l1.4 1.7-5 2.1c-.5.2-.8.7-.8 1.2v1.5c0 .6.4 1 1 1s1-.4 1-1v-1l4.1-1.7 2.4 2.8c.4.4 1 .5 1.4.2.5-.2.7-.7.5-1.2l-2.1-5.1z"/>
            </svg>
          </div>
        </div>
        <span className="text-[9px] font-[900] italic tracking-tight text-[#16A34A] uppercase leading-none">RIDEva</span>
      </div>
    </div>
  ),
  Car: (props: any) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><path d="M9 17h6"/><circle cx="17" cy="17" r="2"/></svg>
  ),
  Bike: (props: any) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" {...props}><circle cx="18.5" cy="17.5" r="3.5"/><circle cx="5.5" cy="17.5" r="3.5"/><circle cx="15" cy="5" r="1"/><path d="M12 17.5V14l-3-3 4-3 2 3h2"/></svg>
  ),
  Location: (props: any) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
  ),
  Search: (props: any) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" {...props}><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
  ),
  Plus: (props: any) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M5 12h14"/><path d="M12 5v14"/></svg>
  ),
  Home: (props: any) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
  ),
  History: (props: any) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M12 8v4l3 3"/><circle cx="12" cy="12" r="10"/></svg>
  ),
  Clock: (props: any) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" {...props}><circle cx="12" cy="12" r="10"/><polyline points="12 12 12 7 12 12 15 15"/></svg>
  ),
  User: (props: any) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
  ),
  Leaf: (props: any) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8a8 8 0 0 1-10 10Z"/><path d="M11 20c-1.2 0-2 0-2 0"/><path d="M9 11c.6.6 1.3.6 2 0"/></svg>
  ),
  Shield: (props: any) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
  ),
  Check: (props: any) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" {...props}><polyline points="20 6 9 17 4 12"/></svg>
  ),
  Wallet: (props: any) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" {...props}><rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/></svg>
  ),
  MessageCircle: (props: any) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/></svg>
  )
};

export const MOCK_TRIPS: any[] = [
  {
    id: 't1',
    ownerId: 'u2',
    ownerName: 'Arjun',
    ownerAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Arjun',
    ownerRating: 4.8,
    ownerPhone: '+91 98470 12345',
    ownerTripsCount: 142,
    from: 'Technopark, Trivandrum',
    to: 'Kollam Civil Station',
    date: 'Today',
    time: '05:30 PM',
    vehicleType: 'CAR',
    vehicleModel: 'Maruti Ciaz',
    vehiclePlate: 'KL-01-CB-1234',
    totalSeats: 3,
    availableSeats: 2,
    pricePerSeat: 220,
    status: 'OPEN',
    description: 'Techie commute. AC, peaceful ride. Sharing fuel costs.',
    requests: [],
    currentLat: 8.5471,
    currentLng: 76.8831
  },
  {
    id: 't2',
    ownerId: 'u3',
    ownerName: 'Laya',
    ownerAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Laya',
    ownerRating: 4.9,
    ownerPhone: '+91 85920 67890',
    ownerTripsCount: 89,
    from: 'Infopark, Kochi',
    to: 'Thrissur Town',
    date: 'Tomorrow',
    time: '09:00 AM',
    vehicleType: 'BIKE',
    vehicleModel: 'Royal Enfield Meteor',
    vehiclePlate: 'KL-08-BW-4567',
    totalSeats: 1,
    availableSeats: 1,
    pricePerSeat: 150,
    status: 'OPEN',
    description: 'Heading home for weekend. Safe ride with helmet.',
    requests: [],
    currentLat: 9.9922,
    currentLng: 76.3501
  }
];
