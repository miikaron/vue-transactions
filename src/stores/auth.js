import { defineStore } from 'pinia';
import { supabase } from '../clients/supabase';
import router from '../router';

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
  }),
  actions: {
    async login(email, password) {
      const { user, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      this.user = user;
      router.push('/home');
    },
    async register(email, password) {
      const { user, error } = await supabase.auth.signUp({ email, password });
      if (error) throw error;
      this.user = user;
      router.push('/home');
    },
    async logout() {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      this.user = null;
      router.push('/');
    },
    async fetchUser() {
      const { data, error } = await supabase.auth.getUser();
      if (error) {
        if (error.name == "AuthSessionMissingError") {
          console.log("User not logged in")
        }
        else {
          console.error('Error fetching user:', error);
        }
        return null;
      }
      this.user = data.user;
    },
  },
});