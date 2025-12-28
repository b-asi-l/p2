
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

export interface Transaction {
  id: string;
  type: 'CREDIT' | 'DEBIT';
  amount: number;
  description: string;
  timestamp: number;
}

export interface User {
  id: string;
  name: string;
  avatar: string;
  vehicle?: string;
  rating: number;
  tripsCount: number;
  balance: number;
  transactions: Transaction[];
}

export interface JoinRequest {
  id: string;
  tripId: string;
  userId: string;
  userName: string;
  userAvatar: string;
  status: RequestStatus;
  message: string;
  timestamp: number;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'INFO' | 'SUCCESS' | 'WARNING';
  isRead: boolean;
  timestamp: number;
}

export interface Trip {
  id: string;
  ownerId: string;
  ownerName: string;
  ownerAvatar: string;
  ownerRating: number;
  ownerTripsCount: number;
  from: string;
  to: string;
  date: string;
  time: string;
  vehicleType: VehicleType;
  vehicleModel: string;
  totalSeats: number;
  availableSeats: number;
  pricePerSeat: number;
  status: TripStatus;
  description: string;
  requests: JoinRequest[];
}

export type ViewState = 'HOME' | 'SEARCH' | 'POST' | 'MY_TRIPS' | 'PROFILE' | 'NOTIFICATIONS' | 'WALLET' | 'LIVE_TRACKING';
