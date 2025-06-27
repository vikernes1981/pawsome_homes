import React, { useState, useEffect, useContext } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthProvider';
import { FaSpinner, FaExclamationTriangle, FaLock } from 'react-icons/fa';

const ProtectedRoute = ({ 
  children, 
  requiredRoles = [], 
  fallbackPath = '/login',
  showUnauthorized = true 
}) => {
  const { user, isAuthenticated, loading, logout } = useContext(AuthContext);
  const [tokenValidation, setTokenValidation] = useState({
    isValidating: true,
    isValid: false,
    error: null
  });
  const location = useLocation();

  // Validate token on mount and when token changes
  useEffect(() => {
    const validateToken = async () => {
      setTokenValidation({ isValidating: true, isValid: false, error: null });

      try {
        const token = localStorage.getItem('authToken');
        
        if (!token) {
          setTokenValidation({ 
            isValidating: false, 
            isValid: false, 
            error: 'No authentication token found' 
          });
          return;
        }

        // Check if token is expired (basic JWT validation)
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          const currentTime = Date.now() / 1000;
          
          if (payload.exp && payload.exp < currentTime) {
            localStorage.removeItem('authToken');
            localStorage.removeItem('user');
            setTokenValidation({ 
              isValidating: false, 
              isValid: false, 
              error: 'Token has expired' 
            });
            
            // Call logout to clean up auth state
            if (logout) {
              logout();
            }
            return;
          }
        } catch (jwtError) {
          console.warn('Token is not a valid JWT:', jwtError);
          // Continue with server validation for non-JWT tokens
        }

        // Optional: Validate token with server
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
        
        try {
          const response = await fetch(`${apiUrl}/auth/validate`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });

          if (response.ok) {
            const data = await response.json();
            setTokenValidation({ 
              isValidating: false, 
              isValid: true, 
              error: null 
            });
          } else if (response.status === 401) {
            // Token is invalid, clear it
            localStorage.removeItem('authToken');
            localStorage.removeItem('user');
            setTokenValidation({ 
              isValidating: false, 
              isValid: false, 
              error: 'Invalid or expired token' 
            });
            
            if (logout) {
              logout();
            }
          } else {
            // Server error, but token might still be valid
            console.warn('Token validation failed with server error');
            setTokenValidation({ 
              isValidating: false, 
              isValid: !!token, // Assume valid if token exists
              error: null 
            });
          }
        } catch (networkError) {
          // Network error, assume token is valid if it exists
          console.warn('Network error during token validation:', networkError);
          setTokenValidation({ 
            isValidating: false, 
            isValid: !!token,
            error: null 
          });
        }

      } catch (error) {
        console.error('Token validation error:', error);
        setTokenValidation({ 
          isValidating: false, 
          isValid: false, 
          error: 'Token validation failed' 
        });
      }
    };

    validateToken();
  }, [logout]);

  // Check if user has required roles
  const hasRequiredRole = (userRoles, requiredRoles) => {
    if (!requiredRoles || requiredRoles.length === 0) return true;
    if (!userRoles || userRoles.length === 0) return false;
    
    return requiredRoles.some(role => userRoles.includes(role));
  };

  // Loading state
  if (loading || tokenValidation.isValidating) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <FaSpinner className="animate-spin text-4xl text-green-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-700 mb-2">Authenticating</h2>
          <p className="text-gray-500">Please wait while we verify your credentials...</p>
        </div>
      </div>
    );
  }

  // Not authenticated
  if (!isAuthenticated || !tokenValidation.isValid) {
    // Store the attempted location for redirect after login
    const from = location.pathname + location.search;
    localStorage.setItem('redirectAfterLogin', from);

    return <Navigate to={fallbackPath} replace state={{ from }} />;
  }

  // Check role-based authorization
  if (requiredRoles.length > 0 && !hasRequiredRole(user?.role || [], requiredRoles)) {
    if (!showUnauthorized) {
      return <Navigate to="/" replace />;
    }

    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="max-w-md mx-auto bg-white rounded-2xl shadow-xl p-8 text-center">
          <FaExclamationTriangle className="text-4xl text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Access Denied</h2>
          <p className="text-gray-600 mb-6">
            You don't have the required permissions to access this page.
          </p>
          <div className="space-y-3">
            {requiredRoles.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-700">
                  <strong>Required roles:</strong> {requiredRoles.join(', ')}
                </p>
                <p className="text-sm text-red-600 mt-1">
                  <strong>Your role:</strong> {user?.role || 'No role assigned'}
                </p>
              </div>
            )}
            <button
              onClick={() => window.history.back()}
              className="w-full bg-gray-600 text-white py-3 rounded-xl font-semibold hover:bg-gray-700 transition-colors"
            >
              Go Back
            </button>
            <button
              onClick={() => window.location.href = '/'}
              className="w-full bg-green-600 text-white py-3 rounded-xl font-semibold hover:bg-green-700 transition-colors"
            >
              Go to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  // User is authenticated and authorized
  return children;
};

// Higher-order component for easier usage with specific roles
export const withRoleProtection = (requiredRoles) => (Component) => {
  return (props) => (
    <ProtectedRoute requiredRoles={requiredRoles}>
      <Component {...props} />
    </ProtectedRoute>
  );
};

// Specific route components for common roles
export const AdminRoute = ({ children }) => (
  <ProtectedRoute requiredRoles={['admin', 'super_admin']}>
    {children}
  </ProtectedRoute>
);

export const SuperAdminRoute = ({ children }) => (
  <ProtectedRoute requiredRoles={['super_admin']}>
    {children}
  </ProtectedRoute>
);

export const StaffRoute = ({ children }) => (
  <ProtectedRoute requiredRoles={['staff', 'admin', 'super_admin']}>
    {children}
  </ProtectedRoute>
);

// Component to show different content based on user roles
export const RoleBasedComponent = ({ 
  allowedRoles = [], 
  fallback = null, 
  children 
}) => {
  const { user, isAuthenticated } = useContext(AuthContext);
  
  if (!isAuthenticated) {
    return fallback;
  }

  const userRoles = Array.isArray(user?.role) ? user.role : [user?.role].filter(Boolean);
  const hasAccess = allowedRoles.length === 0 || allowedRoles.some(role => userRoles.includes(role));
  
  return hasAccess ? children : fallback;
};

// Hook for checking permissions
export const usePermissions = () => {
  const { user, isAuthenticated } = useContext(AuthContext);
  
  const hasRole = (requiredRoles) => {
    if (!isAuthenticated || !user) return false;
    if (!requiredRoles || requiredRoles.length === 0) return true;
    
    const userRoles = Array.isArray(user.role) ? user.role : [user.role].filter(Boolean);
    return requiredRoles.some(role => userRoles.includes(role));
  };

  const isAdmin = () => hasRole(['admin', 'super_admin']);
  const isSuperAdmin = () => hasRole(['super_admin']);
  const isStaff = () => hasRole(['staff', 'admin', 'super_admin']);

  return {
    hasRole,
    isAdmin,
    isSuperAdmin,
    isStaff,
    userRoles: Array.isArray(user?.role) ? user.role : [user?.role].filter(Boolean)
  };
};

export default ProtectedRoute;