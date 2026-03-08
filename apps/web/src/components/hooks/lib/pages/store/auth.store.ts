import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface AuthUser { id: string; email: string; }

interface AuthState {
  token: string | null;
  user: AuthUser | null;
  isAuthenticated: boolean;
  setAuth:   (token: string, user: AuthUser) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token:           null,
      user:            null,
      isAuthenticated: false,
      setAuth:   (token, user) => set({ token, user, isAuthenticated: true }),
      clearAuth: ()            => set({ token: null, user: null, isAuthenticated: false }),
    }),
    {
      name: 'z10n-auth',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        token:           state.token,
        user:            state.user,
        isAuthenticated: !!state.token,
      }),
    },
  ),
);
