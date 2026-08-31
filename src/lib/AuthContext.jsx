import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { appData } from '@/api/localClient';

const AuthContext = createContext();

const STORAGE_KEYS = ['atomos_local_auth_user'];
const TOKEN_KEYS = ['atomos_local_auth_token'];

const readStoredUser = () => {
  for (const key of STORAGE_KEYS) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object' && parsed.username) {
        return parsed;
      }
    } catch {
      // ignore invalid localStorage payloads and keep checking other keys
    }
  }
  return null;
};

const readStoredToken = () => {
  for (const key of TOKEN_KEYS) {
    const token = localStorage.getItem(key);
    if (token) return token;
  }
  return null;
};

const clearAuthStorage = () => {
  STORAGE_KEYS.forEach((key) => localStorage.removeItem(key));
  TOKEN_KEYS.forEach((key) => localStorage.removeItem(key));
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(false);
  const [isLoadingPublicSettings, setIsLoadingPublicSettings] = useState(false);
  const [authError, setAuthError] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [appPublicSettings, setAppPublicSettings] = useState({ id: 'local-atomos-app', public_settings: {} });

  const syncAuthState = useCallback((nextUser = null) => {
    const storedUser = nextUser ?? readStoredUser();
    const storedToken = readStoredToken();
    const authenticated = Boolean(storedUser || storedToken);

    setUser(storedUser || null);
    setIsAuthenticated(authenticated);
    setAuthChecked(true);
    setAuthError(null);
    return authenticated;
  }, []);

  const checkUserAuth = useCallback(async () => {
    setIsLoadingAuth(true);
    try {
      const storedUser = readStoredUser();
      const storedToken = readStoredToken();

      if (storedUser) {
        setUser(storedUser);
        setIsAuthenticated(true);
        setAuthError(null);
        return true;
      }

      if (storedToken) {
        const me = await appData.auth.me();
        setUser(me || null);
        setIsAuthenticated(Boolean(me));
        setAuthError(null);
        return Boolean(me);
      }

      setUser(null);
      setIsAuthenticated(false);
      setAuthError(null);
      return false;
    } catch (error) {
      setUser(null);
      setIsAuthenticated(false);
      setAuthError(error || { type: 'auth_failed' });
      return false;
    } finally {
      setIsLoadingAuth(false);
      setAuthChecked(true);
    }
  }, []);

  const checkAppState = useCallback(async () => {
    await checkUserAuth();
  }, [checkUserAuth]);

  useEffect(() => {
    checkAppState();
  }, [checkAppState]);

  const logout = () => {
    clearAuthStorage();
    setUser(null);
    setIsAuthenticated(false);
    setAuthError(null);
    setAuthChecked(true);
  };

  const navigateToLogin = () => {
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated,
      isLoadingAuth,
      isLoadingPublicSettings,
      authError,
      appPublicSettings,
      authChecked,
      logout,
      navigateToLogin,
      checkAppState,
      checkUserAuth,
      syncAuthState
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};