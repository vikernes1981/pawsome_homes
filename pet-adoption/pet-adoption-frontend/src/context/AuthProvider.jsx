import React, { createContext, useEffect, useState, useCallback } from 'react';
import { toast } from 'react-toastify';

export const AuthContext = createContext();

/**
 * Enterprise-grade AuthProvider
 * Features: Proper state management, token handling, persistence, error handling
 */
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  /**
   * Decode JWT token safely
   */
  const decodeToken = useCallback((token) => {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      
      // Check if token is expired
      if (payload.exp && payload.exp * 1000 < Date.now()) {
        console.log('Token expired');
        return null;
      }
      
      return payload;
    } catch (error) {
      console.error('Error decoding token:', error);
      return null;
    }
  }, []);

  /**
   * Login function - handles both user data and tokens
   */
  const login = useCallback((userData, tokens) => {
    try {
      console.log('AuthProvider login called with:', { userData, tokens });

      // Handle different parameter formats
      if (typeof userData === 'string') {
        // Old format: login(token)
        const token = userData;
        localStorage.setItem('authToken', token);
        
        const decoded = decodeToken(token);
        if (decoded) {
          localStorage.setItem('userId', decoded.userId);
          setUser({ ...decoded, _id: decoded.userId });
          setIsAuthenticated(true);
        }
      } else if (userData && tokens) {
        // New format: login(user, tokens)
        const { accessToken, refreshToken } = tokens;
        
        // Store tokens
        localStorage.setItem('authToken', accessToken);
        if (refreshToken) {
          localStorage.setItem('refreshToken', refreshToken);
        }
        
        // Store user ID
        if (userData.id) {
          localStorage.setItem('userId', userData.id);
        }
        
        // Set user state with complete user data
        setUser({
          ...userData,
          _id: userData.id || userData._id
        });
        setIsAuthenticated(true);
        
        console.log('User logged in successfully:', userData);
      } else {
        throw new Error('Invalid login parameters');
      }
    } catch (error) {
      console.error('Login error in AuthProvider:', error);
      toast.error('Login failed. Please try again.');
    }
  }, [decodeToken]);

  /**
   * Logout function - cleans up all stored data
   */
  const logout = useCallback(async () => {
    try {
      // Clear all stored auth data
      localStorage.removeItem('authToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('userId');
      
      // Reset state
      setUser(null);
      setIsAuthenticated(false);
      
      console.log('User logged out successfully');
      
      // Optional: Call backend logout endpoint
      // try {
      //   await apiClient.post('/auth/logout');
      // } catch (error) {
      //   console.error('Backend logout failed:', error);
      // }
      
    } catch (error) {
      console.error('Logout error:', error);
      throw error; // Re-throw so components can handle it
    }
  }, []);

  /**
   * Check if user is authenticated
   */
  const checkAuth = useCallback(async () => {
    try {
      const token = localStorage.getItem('authToken');
      const userId = localStorage.getItem('userId');
      
      if (!token) {
        setLoading(false);
        return;
      }

      // Decode and validate token
      const decoded = decodeToken(token);
      if (!decoded) {
        // Token is invalid or expired
        await logout();
        setLoading(false);
        return;
      }

      // Set user data from token and localStorage
      const userData = {
        ...decoded,
        _id: decoded.userId || userId,
        id: decoded.userId || userId
      };

      setUser(userData);
      setIsAuthenticated(true);
      
      console.log('Auth restored from localStorage:', userData);
      
    } catch (error) {
      console.error('Auth check failed:', error);
      await logout();
    } finally {
      setLoading(false);
    }
  }, [decodeToken, logout]);

  /**
   * Get current auth token
   */
  const getToken = useCallback(() => {
    return localStorage.getItem('authToken');
  }, []);

  /**
   * Check if user has specific role
   */
  const hasRole = useCallback((role) => {
    if (!user) return false;
    return user.role?.toLowerCase() === role.toLowerCase();
  }, [user]);

  /**
   * Check if user is admin
   */
  const isAdmin = useCallback(() => {
    return hasRole('admin') || hasRole('super_admin');
  }, [hasRole]);

  // Initialize auth state on mount
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Context value
  const contextValue = {
    // State
    user,
    loading,
    isAuthenticated,
    
    // Methods
    login,
    logout,
    getToken,
    hasRole,
    isAdmin,
    checkAuth,
    
    // Computed values
    isLoggedIn: isAuthenticated && !!user,
    userName: user?.username || user?.email?.split('@')[0] || 'User',
    userRole: user?.role || 'user'
  };

  // Debug logging (remove in production)
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('AuthProvider State Updated:', {
        user: user ? { id: user.id, email: user.email, role: user.role } : null,
        isAuthenticated,
        loading
      });
    }
  }, [user, isAuthenticated, loading]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;