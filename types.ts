
export enum VehicleType {
  CAR = 'CAR',
  BIKE = 'BIKE'
}

export enum TripStatus {
  OPEN = 'OPEN',
  FULL = 'FULL',
  STARTED = 'STARTED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED'
}

export enum RequestStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED'
}

export type VerificationStatus = 'NONE' | 'PENDING' | 'VERIFIED' | 'REJECTED';

export interface LiveLocation {
  lat: number;
  lng: number;
  timestamp: number;
  accuracy?: number;
  heading?: number | null;
  speed?: number | null;
}

export interface JoinRequest {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  message: string;
  status: RequestStatus;
  userLocation?: LiveLocation;
}

export interface User {
  id: string;
  name: string;
  avatar: string;
  rating: number;
  tripsCount: number;
  isOnboarded: boolean;
  isVerified: boolean; 
  driverVerificationStatus: VerificationStatus; 
  co2Saved: number;
  moneySaved: number;
  balance: number;
  licenseNumber?: string;
  vehicleRC?: string;
  insurancePolicy?: string;
  currentLocation?: LiveLocation;
}

export interface Trip {
  id: string;
  ownerId: string;
  ownerName: string;
  ownerAvatar: string;
  ownerRating: number;
  ownerPhone?: string;
  ownerTripsCount?: number;
  ownerUpiId?: string;
  from: string;
  to: string;
  date: string;
  time: string;
  vehicleType: VehicleType;
  vehicleModel?: string;
  pricePerSeat: number;
  availableSeats: number;
  status: TripStatus;
  description?: string;
  requests: JoinRequest[];
  driverLocation?: LiveLocation;
}

export interface Booking {
  id: string;
  tripId: string;
  userId: string;
  amount: number;
  perPersonAmount: number;
  method: 'UPI' | 'CARD' | 'NET_BANKING' | 'CASH';
  status: 'PAID' | 'PENDING';
  timestamp: number;
  transactionId: string;
  from: string;
  to: string;
  ownerName: string;
  ownerPhone?: string;
  ownerAvatar?: string;
  message?: string;
}

export type ViewState = 
  | 'LOGIN' 
  | 'HOME' 
  | 'SEARCH' 
  | 'TRIP_DETAIL' 
  | 'POST' 
  | 'ACTIVITY' 
  | 'PROFILE' 
  | 'PAYMENT' 
  | 'RECEIPT' 
  | 'LIVE_TRACKING' 
  | 'CUSTOMER_KYC'
  | 'DRIVER_KYC'
  | 'ADMIN_PANEL'
  | 'CHAT';
