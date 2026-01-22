
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

export interface User {
  id: string;
  name: string;
  avatar: string;
  rating: number;
  tripsCount: number;
  isOnboarded: boolean;
  co2Saved: number;
  moneySaved: number;
  balance: number;
}

export interface Trip {
  id: string;
  ownerId: string;
  ownerName: string;
  ownerAvatar: string;
  ownerRating: number;
  from: string;
  to: string;
  date: string;
  time: string;
  vehicleType: VehicleType;
  pricePerSeat: number;
  availableSeats: number;
  status: TripStatus;
}

// Added Booking interface to resolve export errors
export interface Booking {
  id: string;
  tripId: string;
  userId: string;
  amount: number;
  perPersonAmount: number;
  method: 'UPI' | 'CASH';
  status: 'PAID' | 'PENDING';
  timestamp: number;
  transactionId: string;
  from: string;
  to: string;
}

export type ViewState = 
  | 'LOGIN' 
  | 'HOME' 
  | 'SEARCH' 
  | 'TRIP_DETAIL' 
  | 'POST' 
  | 'ACTIVITY' 
  | 'PROFILE' 
  | 'ONBOARDING_PROFILE';