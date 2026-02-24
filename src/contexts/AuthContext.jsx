import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAccount, useSignMessage, useDisconnect } from 'wagmi';
import api from '../services/api';
import { connectWallet } from '../services/blockchain';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const { signMessageAsync } = useSignMessage();
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('token'));
  const [loading, setLoading] = useState(false);
  const [authAddress, setAuthAddress] = useState(() => localStorage.getItem('auth_address'));

  // When wallet connects, auto-authenticate with backend
  const authenticateWallet = useCallback(async (addr) => {
    if (!addr) return;
    // If already authenticated for this address, just fetch profile
    const storedAddr = localStorage.getItem('auth_address');
    const storedToken = localStorage.getItem('token');
    if (storedAddr?.toLowerCase() === addr.toLowerCase() && storedToken) {
      try {
        const res = await api.get('/auth/me');
        setUser(res.data.user || res.data);
        setToken(storedToken);
        setAuthAddress(addr);
        return;
      } catch {
        // Token expired, re-auth
        localStorage.removeItem('token');
        localStorage.removeItem('auth_address');
      }
    }

    setLoading(true);
    try {
      const message = `MERT Token - Cüzdan Bağla: ${addr} - ${Date.now()}`;
      const signature = await signMessageAsync({ message });
      const res = await connectWallet(message, signature);
      const { token: jwt, user: u } = res.data;
      if (jwt) {
        localStorage.setItem('token', jwt);
        localStorage.setItem('auth_address', addr);
        setToken(jwt);
        setAuthAddress(addr);
        setUser(u || { wallet_address: addr });
      } else {
        // Backend may not return JWT on wallet connect, try fetching profile
        setUser(u || { wallet_address: addr });
        setAuthAddress(addr);
      }
    } catch (err) {
      console.error('Wallet auth failed:', err);
      // Still set basic user info even if backend auth fails
      setUser({ wallet_address: addr });
      setAuthAddress(addr);
    } finally {
      setLoading(false);
    }
  }, [signMessageAsync]);

  // Watch for wallet connection changes
  useEffect(() => {
    if (isConnected && address) {
      // Only re-auth if address changed
      if (authAddress?.toLowerCase() !== address.toLowerCase()) {
        authenticateWallet(address);
      } else if (!user && token) {
        // Restore session
        api.get('/auth/me')
          .then(res => setUser(res.data.user || res.data))
          .catch(() => {
            localStorage.removeItem('token');
            setToken(null);
          });
      }
    } else if (!isConnected) {
      // Wallet disconnected
      setUser(null);
      setToken(null);
      setAuthAddress(null);
      localStorage.removeItem('token');
      localStorage.removeItem('auth_address');
    }
  }, [isConnected, address]);

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('auth_address');
    setToken(null);
    setUser(null);
    setAuthAddress(null);
    disconnect();
  };

  const refreshUser = async () => {
    if (!token) return;
    try {
      const res = await api.get('/auth/me');
      setUser(res.data.user || res.data);
    } catch {}
  };

  return (
    <AuthContext.Provider value={{
      user,
      token,
      loading,
      logout,
      refreshUser,
      isAuthenticated: isConnected && !!address,
      isAdmin: user?.is_admin === 1,
      walletAddress: address,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
