import { useCallback, useEffect, useMemo, useState } from 'react';
import { AuthContext } from './auth-context';
import { authApi } from '../api/endpoints';
import { onUnauthorized, tokenStore } from '../api/client';
import { decodeToken, isTokenExpired } from '../utils/jwt';

function readInitialToken() {
  const t = tokenStore.get();
  return t && !isTokenExpired(t) ? t : null;
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(readInitialToken);
  const [sessionNotice, setSessionNotice] = useState('');

  const user = useMemo(() => {
    if (!token) return null;
    const claims = decodeToken(token);
    if (!claims) return null;
    return {
      email: claims.sub,
      role: claims.role,
      permissions: claims.permissions || [],
      expiresAt: claims.exp * 1000,
    };
  }, [token]);

  const clearSession = useCallback((notice = '') => {
    tokenStore.clear();
    setToken(null);
    setSessionNotice(notice);
  }, []);

  useEffect(
    () =>
      onUnauthorized((status) => {
        // 401 = bad/expired token. A 403 with a still-valid token is a permission
        // problem, so only sign out on 403 if the token has actually expired.
        if (status === 401 || isTokenExpired(tokenStore.get() || '')) {
          clearSession('Your session expired. Please sign in again.');
        }
      }),
    [clearSession],
  );

  // Sign the user out automatically the moment their token expires.
  useEffect(() => {
    if (!user) return undefined;
    const ms = Math.min(user.expiresAt - Date.now(), 2 ** 31 - 1);
    const id = setTimeout(() => clearSession('Your session expired. Please sign in again.'), Math.max(ms, 0));
    return () => clearTimeout(id);
  }, [user, clearSession]);

  const login = useCallback(async (email, password) => {
    const res = await authApi.login(email, password);
    const jwt = res?.token;
    if (!jwt) throw new Error('Login failed: the server did not return a token.');
    tokenStore.set(jwt);
    setSessionNotice('');
    setToken(jwt);
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      /* the token is discarded locally regardless */
    }
    clearSession('');
  }, [clearSession]);

  const value = useMemo(
    () => ({ user, isAuthenticated: Boolean(user), login, logout, sessionNotice }),
    [user, login, logout, sessionNotice],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
