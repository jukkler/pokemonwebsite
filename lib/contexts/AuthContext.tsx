'use client';

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';
import { fetchJson } from '@/lib/fetchJson';

export interface AdminSessionState {
  isAdmin: boolean;
  username: string | null;
}

interface AuthContextValue extends AdminSessionState {
  setSession: (session: AdminSessionState) => void;
  refreshSession: () => Promise<AdminSessionState>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

interface AuthProviderProps {
  children: React.ReactNode;
  initialSession: AdminSessionState;
}

export function AuthProvider({ children, initialSession }: AuthProviderProps) {
  const [session, setSessionState] = useState(initialSession);

  const setSession = useCallback((nextSession: AdminSessionState) => {
    setSessionState(nextSession);
  }, []);

  const refreshSession = useCallback(async () => {
    const result = await fetchJson<{ isAdmin?: boolean; username?: string | null }>(
      '/api/auth/status',
    );
    const nextSession = {
      isAdmin: Boolean(result.isAdmin),
      username: result.username ?? null,
    };
    setSessionState(nextSession);
    return nextSession;
  }, []);

  const value = useMemo<AuthContextValue>(() => ({
    ...session,
    setSession,
    refreshSession,
  }), [refreshSession, session, setSession]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth muss innerhalb des AuthProvider verwendet werden');
  }
  return context;
}
