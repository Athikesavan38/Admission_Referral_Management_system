import { createContext, useContext, useState, useEffect, useRef } from 'react';
import client from '../api/client';
import { useNotificationCenter } from './NotificationContext';

const AuthContext = createContext(null);

function decodeToken(token) {
  try {
    const payload = token.split('.')[1];
    const padded = payload + '='.repeat((4 - payload.length % 4) % 4);
    return JSON.parse(atob(padded));
  } catch { return null; }
}

function isTokenExpired(token) {
  const decoded = decodeToken(token);
  if (!decoded?.exp) return true;
  return decoded.exp * 1000 < Date.now();
}

function loadToken() {
  const token = localStorage.getItem('token');
  if (!token || isTokenExpired(token)) {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    return null;
  }
  return token;
}

function loadUser() {
  const token = localStorage.getItem('token');
  if (!token || isTokenExpired(token)) return null;
  try { return JSON.parse(localStorage.getItem('user')); }
  catch { return null; }
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(loadToken);
  const [user, setUser]   = useState(loadUser);
  const esRef = useRef(null);
  const { pushFromSSE } = useNotificationCenter();

  // Connect SSE when token is available
  useEffect(() => {
    if (!token || !user) return;

    function connect() {
      const sseBase = import.meta.env.VITE_SSE_URL || `${window.location.origin}/api`;
      const es = new EventSource(`${sseBase}/events?token=${token}`);
      esRef.current = es;

      es.onmessage = (e) => {
        try {
          const data = JSON.parse(e.data);
          if (data.type && data.type !== 'connected') {
            pushFromSSE(data, user.role);
          }
        } catch { /* ignore */ }
      };

      es.onerror = () => {
        es.close();
        // Reconnect after 5s
        setTimeout(connect, 5000);
      };
    }

    connect();

    return () => {
      esRef.current?.close();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  // Verify token with backend on mount and refresh user profile
  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    if (!storedToken || isTokenExpired(storedToken)) return;

    client.get('/auth/me').then(({ data }) => {
      // Refresh cached user profile with latest server data
      const freshUser = {
        _id:            data._id || data.userId,
        name:           data.name,
        email:          data.email,
        role:           data.role,
        referralId:     data.referralId || null,
        credits:        data.credits || 0,
        totalReferrals: data.totalReferrals || 0,
      };
      setUser(freshUser);
      localStorage.setItem('user', JSON.stringify(freshUser));
    }).catch(() => {
      // Token rejected by server — clear silently
      setToken(null);
      setUser(null);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function login(newToken, newUser) {
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem('token', newToken);
    localStorage.setItem('user', JSON.stringify(newUser));
  }

  function logout() {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  }

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
