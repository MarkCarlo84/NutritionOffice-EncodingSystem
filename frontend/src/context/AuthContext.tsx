import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { API_BASE_URL } from '../config/api';
import axios from 'axios';

const TOKEN_KEY = 'nutrition_office_token';

interface User {
  id: number;
  name: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  setAuthFromToken: (token: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setTokenState] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY));
  const [loading, setLoading] = useState(true);

  const setAuthFromToken = useCallback(async (t: string) => {
    localStorage.setItem(TOKEN_KEY, t);
    setTokenState(t);
    try {
      const { data } = await axios.get(`${API_BASE_URL}/api/user`, {
        headers: { Authorization: `Bearer ${t}` },
      });
      setUser(data);
    } catch {
      localStorage.removeItem(TOKEN_KEY);
      setTokenState(null);
      setUser(null);
    }
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const { data } = await axios.post(`${API_BASE_URL}/api/login`, { email, password });
    await setAuthFromToken(data.token);
  }, [setAuthFromToken]);

  const logout = useCallback(() => {
    const t = localStorage.getItem(TOKEN_KEY);
    if (t) {
      axios.post(`${API_BASE_URL}/api/logout`, {}, { headers: { Authorization: `Bearer ${t}` } }).catch(() => {});
    }
    localStorage.removeItem(TOKEN_KEY);
    setTokenState(null);
    setUser(null);
  }, []);

  useEffect(() => {
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }
    setAuthFromToken(token).finally(() => setLoading(false));
  }, [token, setAuthFromToken]);

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, setAuthFromToken }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}
