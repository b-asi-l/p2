
export enum VehicleType {
  CAR = 'CAR',
  BIKE = 'BIKE'
}

export enum TripStatus {
  OPEN = 'OPEN',
  FULL = 'FULL',
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
  vehicle?: string;
  rating: number;
  tripsCount: number;
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

export interface Trip {
  id: string;
  ownerId: string;
  ownerName: string;
  ownerAvatar: string;
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

export type ViewState = 'HOME' | 'SEARCH' | 'POST' | 'MY_TRIPS' | 'PROFILE';
