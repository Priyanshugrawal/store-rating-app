import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import * as authService from '../services/authService';
import { tokenStore } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(Boolean(tokenStore.get()));
  const [sessionMessage, setSessionMessage] = useState('');

  // Restore the session when the page loads
  useEffect(() => {
    if (!tokenStore.get()) return undefined;
    let cancelled = false;
    authService
      .me()
      .then(({ data }) => !cancelled && setUser(data.user))
      .catch(() => tokenStore.clear())
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  // The API layer fires this when the token is expired/invalid
  useEffect(() => {
    const onExpired = (e) => {
      setUser(null);
      setSessionMessage(e.detail || 'Your session has expired. Please log in again.');
    };
    window.addEventListener('auth:expired', onExpired);
    return () => window.removeEventListener('auth:expired', onExpired);
  }, []);

  const startSession = useCallback(({ data }) => {
    tokenStore.set(data.token);
    setUser(data.user);
    setSessionMessage('');
    return data.user;
  }, []);

  const login = useCallback((creds) => authService.login(creds).then(startSession), [startSession]);
  const register = useCallback((values) => authService.register(values).then(startSession), [startSession]);
  // Re-read the account (e.g. after opening a store the role becomes Store Owner)
  const refreshUser = useCallback(() => authService.me().then(({ data }) => setUser(data.user)).catch(() => {}), []);
  const logout = useCallback(() => {
    tokenStore.clear();
    setUser(null);
    setSessionMessage('');
  }, []);

  const value = useMemo(
    () => ({ user, loading, sessionMessage, login, register, logout, refreshUser }),
    [user, loading, sessionMessage, login, register, logout, refreshUser]
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
