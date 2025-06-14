import React, { createContext, useEffect, useState } from 'react';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null); // Will contain { email, role, ... }

  const login = (token) => {
    localStorage.setItem('authToken', token);
    const decoded = decodeToken(token);
    if (decoded) {
      localStorage.setItem('userId', decoded.userId);
      setUser({ ...decoded, _id: decoded.userId });
    }
  };

  const logout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userId');
    setUser(null);
  };

  const decodeToken = (token) => {
    try {
      return JSON.parse(atob(token.split('.')[1]));
    } catch {
      return null;
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (token) {
      const decoded = decodeToken(token);
      if (decoded) {
        localStorage.setItem('userId', decoded.userId);
        setUser({ ...decoded, _id: decoded.userId });
      }
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;
