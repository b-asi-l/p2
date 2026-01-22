
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

  async signInWithPhone(phone: string) {
    const { data, error } = await supabase.auth.signInWithOtp({
      phone: phone,
    });
    return { data, error };
  },

  async verifyPhoneOtp(phone: string, token: string) {
    const { data, error } = await supabase.auth.verifyOtp({
      phone,
      token,
      type: 'sms',
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
