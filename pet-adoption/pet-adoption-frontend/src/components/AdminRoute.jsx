import { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthProvider';

const AdminRoute = ({ children }) => {
  const { user } = useContext(AuthContext);
  return user?.role === 'Admin' ? children : <Navigate to="/" replace />;
};

export default AdminRoute;