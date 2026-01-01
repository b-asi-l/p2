
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

export enum UserRole {
  RIDER = 'RIDER',
  DRIVER = 'DRIVER',
  BOTH = 'BOTH'
}

export enum IDType {
  AADHAR = 'Aadhar Card',
  PAN = 'PAN Card',
  VOTER = 'Voter ID',
  DRIVING_LICENSE = 'Driving License'
}

export enum Gender {
  MALE = 'Male',
  FEMALE = 'Female',
  OTHER = 'Other'
}

export interface JoinRequest {
  id: string;
  tripId: string;
  userId: string;
  userName: string;
  userAvatar: string;
  status: RequestStatus;
  timestamp: number;
}

export interface User {
  id: string;
  name: string;
  avatar: string;
  rating: number;
  tripsCount: number;
  balance: number;
  isGuest: boolean;
  isOnboarded: boolean;
  co2Saved: number;
  moneySaved: number;
  role: UserRole;
  language: string;
  phoneNumber?: string;
  email?: string;
  address?: string;
  idType?: IDType;
  idNumber?: string;
  gender?: Gender;
  vehiclePreference?: VehicleType;
}

// Added missing Trip interface to satisfy imports and provide proper typing for trip objects
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
  vehicleModel: string;
  vehiclePlate: string;
  totalSeats: number;
  availableSeats: number;
  pricePerSeat: number;
  status: TripStatus;
  description: string;
  requests: JoinRequest[];
  currentLat?: number;
  currentLng?: number;
}

export type ViewState = 
  | 'LOGIN' 
  | 'ONBOARDING_LANG' 
  | 'ONBOARDING_PROFILE' 
  | 'HOME' 
  | 'SEARCH' 
  | 'TRIP_DETAIL' 
  | 'POST' 
  | 'ACTIVITY' 
  | 'PROFILE' 
  | 'LIVE_TRACKING' 
  | 'CHAT' 
  | 'PAYMENT';
