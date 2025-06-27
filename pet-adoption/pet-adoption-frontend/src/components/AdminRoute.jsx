import { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthProvider';

const AdminRoute = ({ children }) => {
  const { user, loading } = useContext(AuthContext);
  
  // Show loading while user data is being fetched
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }
  
  // Check both 'admin' and 'Admin' to handle case variations
  const isAdmin = ['admin', 'super_admin'].includes(user?.role?.toLowerCase());
  
  return isAdmin ? children : <Navigate to="/" replace />;
};

export default AdminRoute;