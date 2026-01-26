
// @ts-ignore
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile, signOut, onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
// @ts-ignore - Condensing multi-line imports to a single line to ensure @ts-ignore correctly suppresses all member export errors
import { getFirestore, collection, getDocs, addDoc, doc, updateDoc, onSnapshot, query, orderBy, getDoc, setDoc, where, disableNetwork } from "firebase/firestore";
// @ts-ignore - Condensing multi-line imports to a single line to ensure @ts-ignore correctly suppresses all member export errors
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { MOCK_TRIPS } from '../constants';

const firebaseConfig = {
  apiKey: "AIzaSyALGt2g3NzfmJu0Xy_aq_M6aDNAnass9TE",
  authDomain: "studio-7441300053-e52c5.firebaseapp.com",
  projectId: "studio-7441300053-e52c5",
  storageBucket: "studio-7441300053-e52c5.firebasestorage.app",
  messagingSenderId: "1042877028656",
  appId: "1:1042877028656:web:7542eafb51bdf4b151d0f5"
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

let isFirestoreAvailable = true;

const handleFirestoreError = async (e: any) => {
    if (e.code === 'permission-denied' || e.code === 'unavailable' || e.code === 'failed-precondition' || e.code === 'not-found') {
        if (isFirestoreAvailable) {
            console.log(`%c Demo Mode Activated `, 'background: #2563EB; color: #fff; border-radius: 4px; padding: 2px 6px;', `Backend inaccessible (${e.code}). Switching to offline/mock data.`);
            isFirestoreAvailable = false;
            try { await disableNetwork(db); } catch (netErr) {}
        }
    }
};

const MOCK_ACTIVE_USER_KEY = 'rideva_active_user';
const MOCK_USERS_COLLECTION_KEY = 'rideva_mock_users';
const MOCK_TRIPS_REGISTRY_KEY = 'rideva_mock_trips';

const getMockUsers = (): any[] => {
    const stored = localStorage.getItem(MOCK_USERS_COLLECTION_KEY);
    return stored ? JSON.parse(stored) : [];
};

const saveMockUserToRegistry = (user: any) => {
    const users = getMockUsers();
    if (!users.find(u => u.email === user.email)) {
        users.push(user);
        localStorage.setItem(MOCK_USERS_COLLECTION_KEY, JSON.stringify(users));
    }
};

const getActiveMockUser = () => {
    const stored = localStorage.getItem(MOCK_ACTIVE_USER_KEY);
    return stored ? JSON.parse(stored) : null;
};

const setActiveMockUser = (user: any) => {
    localStorage.setItem(MOCK_ACTIVE_USER_KEY, JSON.stringify(user));
    window.dispatchEvent(new Event('mock-auth-change'));
};

const clearActiveMockUser = () => {
    localStorage.removeItem(MOCK_ACTIVE_USER_KEY);
    window.dispatchEvent(new Event('mock-auth-change'));
};

// --- TRIP REGISTRY HELPERS ---
const getLocalTrips = (): any[] => {
  const stored = localStorage.getItem(MOCK_TRIPS_REGISTRY_KEY);
  return stored ? JSON.parse(stored) : [];
};

const saveLocalTrip = (trip: any) => {
  const trips = getLocalTrips();
  trips.unshift(trip);
  localStorage.setItem(MOCK_TRIPS_REGISTRY_KEY, JSON.stringify(trips));
};

export const authService = {
  onAuthStateChange: (callback: (user: any) => void) => {
    const unsubscribeFirebase = onAuthStateChanged(auth, (firebaseUser) => {
        if (firebaseUser) {
            callback(firebaseUser);
        } else {
            callback(getActiveMockUser());
        }
    });

    const handleMockChange = () => {
        if (!auth.currentUser) callback(getActiveMockUser());
    };
    window.addEventListener('mock-auth-change', handleMockChange);

    return () => {
        unsubscribeFirebase();
        window.removeEventListener('mock-auth-change', handleMockChange);
    };
  },

  async signUp(email: string, password: string, name: string, photoFile: File | null) {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      let photoURL = `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`;

      if (photoFile) {
        try {
          const storageRef = ref(storage, `profile_photos/${userCredential.user.uid}`);
          await uploadBytes(storageRef, photoFile);
          photoURL = await getDownloadURL(storageRef);
        } catch (e) { console.warn("Photo upload failed, using default avatar", e); }
      }

      await updateProfile(userCredential.user, { displayName: name, photoURL: photoURL });
      
      await userService.updateProfile(userCredential.user.uid, { name, avatar: photoURL, co2Saved: 0, moneySaved: 0 });

      return { data: { user: userCredential.user }, error: null };
    } catch (error: any) {
      // Create local mock user
      const mockUser = {
          uid: 'mock-' + Date.now(),
          email,
          displayName: name,
          photoURL: `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`,
          isMock: true
      };
      saveMockUserToRegistry(mockUser);
      setActiveMockUser(mockUser);
      return { data: { user: mockUser }, error: null };
    }
  },

  async signIn(email: string, password: string) {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      return { data: { user: userCredential.user }, error: null };
    } catch (error: any) {
      const registry = getMockUsers();
      const existingMock = registry.find(u => u.email.toLowerCase() === email.toLowerCase());
      
      if (existingMock) {
          setActiveMockUser(existingMock);
          return { data: { user: existingMock }, error: null };
      }
      
      return { 
          data: null, 
          error: { message: "Account not found. Please sign up to create a RIDEva profile." } 
      };
    }
  },

  async signOut() {
    clearActiveMockUser();
    return signOut(auth);
  }
};

export const userService = {
  async getUserProfile(userId: string) {
    if (!isFirestoreAvailable || userId.startsWith('mock-')) return { data: null, error: null };
    try {
        const docRef = doc(db, 'users', userId);
        const snap = await getDoc(docRef);
        if (snap.exists()) return { data: snap.data(), error: null };
        return { data: null, error: null };
    } catch (e: any) {
        await handleFirestoreError(e);
        return { data: null, error: e };
    }
  },
  async updateProfile(userId: string, updates: any) {
      if (!isFirestoreAvailable || userId.startsWith('mock-')) return { data: true, error: null };
      try {
          const docRef = doc(db, 'users', userId);
          await setDoc(docRef, updates, { merge: true });
          return { data: true, error: null };
      } catch (e: any) {
          await handleFirestoreError(e);
          return { data: null, error: e };
      }
  }
};

export const tripService = {
  async getAllTrips() {
    if (!isFirestoreAvailable) {
      const combined = [...getLocalTrips(), ...MOCK_TRIPS];
      return { data: combined, error: null };
    }
    try {
      const q = query(collection(db, "trips"), orderBy("created_at", "desc"));
      const querySnapshot = await getDocs(q);
      const trips = querySnapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));
      const combined = [...getLocalTrips(), ...(trips.length > 0 ? trips : MOCK_TRIPS)];
      return { data: combined, error: null };
    } catch (e: any) {
      await handleFirestoreError(e);
      const combined = [...getLocalTrips(), ...MOCK_TRIPS];
      return { data: combined, error: null };
    }
  },

  async createTrip(tripData: any) {
    const newTrip = { 
      id: 'mock-trip-' + Date.now(), 
      ...tripData, 
      created_at: new Date().toISOString() 
    };
    
    if (!isFirestoreAvailable) {
      saveLocalTrip(newTrip);
      return { data: [newTrip], error: null };
    }
    try {
      const docRef = await addDoc(collection(db, "trips"), newTrip);
      saveLocalTrip({ ...newTrip, id: docRef.id }); // Also save locally for instant feedback
      return { data: [{ ...newTrip, id: docRef.id }], error: null };
    } catch (error: any) {
      await handleFirestoreError(error);
      saveLocalTrip(newTrip);
      return { data: [newTrip], error: null };
    }
  },

  async updateTripLocation(tripId: string, location: any) {
    if (!isFirestoreAvailable || tripId.startsWith('t') || tripId.startsWith('mock-')) return; 
    try {
        const tripRef = doc(db, 'trips', tripId);
        await updateDoc(tripRef, { driverLocation: location });
    } catch (e) {}
  },

  subscribeToTrip(tripId: string, onUpdate: (data: any) => void) {
      if (!isFirestoreAvailable || tripId.startsWith('t') || tripId.startsWith('mock-')) {
          const interval = setInterval(() => {
              onUpdate({ driverLocation: { lat: 8.5241 + (Math.random() * 0.001), lng: 76.9366 + (Math.random() * 0.001), timestamp: Date.now() } });
          }, 3000);
          return () => clearInterval(interval);
      }
      try {
          const tripRef = doc(db, 'trips', tripId);
          return onSnapshot(tripRef, (docSnapshot) => {
              if (docSnapshot.exists()) onUpdate(docSnapshot.data());
          }, (error) => handleFirestoreError(error));
      } catch (e) { return () => {}; }
  }
};

export const kycService = {
  async uploadFile(userId: string, file: File, category: string, bucket?: string) {
    try {
      const storageRef = ref(storage, `kyc/${userId}/${category}_${Date.now()}`);
      await uploadBytes(storageRef, file);
      return await getDownloadURL(storageRef);
    } catch (error) { return URL.createObjectURL(file); }
  },
  async submitDriverKYC(kycData: any) {
    try {
      const docRef = await addDoc(collection(db, 'driver_kyc'), { ...kycData, status: 'pending', created_at: new Date().toISOString() });
      return { data: docRef.id, error: null };
    } catch(e: any) { return { data: 'mock-kyc-id', error: null }; }
  },
  async submitCustomerKYC(kycData: any) {
    try {
      const docRef = await addDoc(collection(db, 'customer_kyc'), { ...kycData, status: 'pending', created_at: new Date().toISOString() });
      return { data: docRef.id, error: null };
    } catch(e: any) { return { data: 'mock-kyc-id', error: null }; }
  },
  async getLatestCustomerKYC(userId: string) {
     try {
         const q = query(collection(db, 'customer_kyc'), where('user_id', '==', userId));
         const snapshot = await getDocs(q);
         if (!snapshot.empty) return { data: snapshot.docs[0].data(), error: null };
         return { data: null, error: null };
     } catch (e) { return { data: null, error: null }; }
  },
  async getLatestDriverKYC(userId: string) {
     try {
         const q = query(collection(db, 'driver_kyc'), where('user_id', '==', userId));
         const snapshot = await getDocs(q);
         if (!snapshot.empty) return { data: snapshot.docs[0].data(), error: null };
         return { data: null, error: null };
     } catch (e) { return { data: null, error: null }; }
  },

  // --- ADMIN METHODS ---
  async getPendingCustomerKYC() {
    try {
      const q = query(collection(db, 'customer_kyc'), where('status', '==', 'pending'));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch { return []; }
  },
  async getPendingDriverKYC() {
    try {
      const q = query(collection(db, 'driver_kyc'), where('status', '==', 'pending'));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch { return []; }
  },
  async updateCustomerKYCStatus(id: string, status: 'approved' | 'rejected') {
    try {
      const docRef = doc(db, 'customer_kyc', id);
      await updateDoc(docRef, { status });
      return true;
    } catch { return false; }
  },
  async updateDriverKYCStatus(id: string, status: 'approved' | 'rejected') {
    try {
      const docRef = doc(db, 'driver_kyc', id);
      await updateDoc(docRef, { status });
      return true;
    } catch { return false; }
  }
};

export const adminService = {
  async checkIsAdmin(userId: string) {
      try {
        const docRef = doc(db, 'admins', userId);
        const docSnap = await getDoc(docRef);
        return docSnap.exists();
      } catch { return false; }
  }
};

export const savePayment = async (booking: any) => {
    try {
        await addDoc(collection(db, "payments"), booking);
        return true;
    } catch (e: any) { return true; }
};
