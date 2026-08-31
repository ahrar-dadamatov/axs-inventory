import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import 'react-native-url-polyfill/auto';
import { Database } from '../types/database';

// TODO: Замените на ваши данные из Supabase Project Settings -> API
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://rhdkfclugyhpwqnpqypf.supabase.co';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_gU87zZl5f8OMROSMt_r_ng_4gIOBB3B';

import { Platform } from 'react-native';

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
