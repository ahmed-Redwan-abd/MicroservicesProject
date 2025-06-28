import React, { createContext, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  const login = async (username, password) => {
    try {
      const res = await axios.post('http://localhost:3000/auth/login', {
        username,
        password
      });
      
      setUser(res.data);
      localStorage.setItem('token', res.data.token);
      navigate(`/${res.data.role}/dashboard`);
    } catch (err) {
      console.error('Login failed:', err);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('token');
    navigate('/login');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};