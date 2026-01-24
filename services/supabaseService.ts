
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://mdtxmgdmpntpcvjgilpp.supabase.co';
const supabaseAnonKey = 'sb_publishable_bm3LmPD6xB17xfkrYBx9qA_lEQcsZCn';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const authService = {
  async signUp(email: string, password: string) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });
    return { data, error };
  },

  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { data, error };
  },

  async signOut() {
    return await supabase.auth.signOut();
  },

  async getSession() {
    return await supabase.auth.getSession();
  }
};

export const tripService = {
  async getAllTrips() {
    const { data, error } = await supabase
      .from('trips')
      .select('*')
      .order('created_at', { ascending: false });
    return { data, error };
  },

  async createTrip(tripData: any) {
    const { data, error } = await supabase
      .from('trips')
      .insert([tripData])
      .select();
    return { data, error };
  }
};

export const kycService = {
  async uploadFile(userId: string, file: File, category: string, bucket: string = 'kyc-driver') {
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}/${category}_${Date.now()}.${fileExt}`;

    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(fileName, file);

    if (error) throw error;

    // Get the public URL
    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(fileName);

    return publicUrl;
  },

  async submitDriverKYC(kycData: any) {
    const { data, error } = await supabase
      .from('driver_kyc')
      .insert([kycData])
      .select();
    
    if (error) throw error;
    return data;
  },

  async submitCustomerKYC(kycData: any) {
    const { data, error } = await supabase
      .from('customer_kyc')
      .insert([kycData])
      .select();
    
    if (error) throw error;
    return data;
  }
};
