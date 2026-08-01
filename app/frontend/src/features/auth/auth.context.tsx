import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  type ReactNode,
} from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from './auth.service';
import type { AuthContextType, User, LoginCredentials, SignupCredentials } from './auth.types';

const TOKEN_KEY = 'synapse_token';

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  // Session restoration on mount
  useEffect(() => {
    const restoreSession = async () => {
      const storedToken = localStorage.getItem(TOKEN_KEY);

      // Step 1-2: No token → remain unauthenticated
      if (!storedToken) {
        setIsLoading(false);
        return;
      }

      try {
        // Step 3: Token exists → validate with GET /api/auth/me
        setToken(storedToken);
        const currentUser = await authService.getMe();
        // Step 4: Success → restore session
        setUser(currentUser);
      } catch {
        // Step 5: Failure → clear token, remain unauthenticated
        localStorage.removeItem(TOKEN_KEY);
        setToken(null);
      } finally {
        setIsLoading(false);
      }
    };

    restoreSession();
  }, []);

  const login = useCallback(async (credentials: LoginCredentials) => {
    const response = await authService.login(credentials);
    localStorage.setItem(TOKEN_KEY, response.token);
    setToken(response.token);
    setUser(response.user);
  }, []);

  const signup = useCallback(async (credentials: SignupCredentials) => {
    const response = await authService.signup(credentials);
    localStorage.setItem(TOKEN_KEY, response.token);
    setToken(response.token);
    setUser(response.user);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setUser(null);
    navigate('/login');
  }, [navigate]);

  const value = useMemo<AuthContextType>(
    () => ({
      user,
      token,
      isAuthenticated: !!user,
      isLoading,
      login,
      signup,
      logout,
    }),
    [user, token, isLoading, login, signup, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
