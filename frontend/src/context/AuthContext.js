import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';
import { API_URLS } from '../config';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (token && userData) {
      setUser(JSON.parse(userData));
      // Set the default Authorization header for all axios requests
      axios.defaults.headers.common['Authorization'] = `Token ${token}`;
      console.log('Token set in axios defaults:', token);
    } else {
      // Clear the Authorization header if no token exists
      delete axios.defaults.headers.common['Authorization'];
      console.log('No token found, Authorization header cleared');
    }
    
    setLoading(false);
  }, []);

  const login = async (username, password) => {
    try {
      // const response = await axios.post('http://localhost:8000/api/login/', { username, password });
      // with:
      const response = await axios.post(API_URLS.login, { username, password });
      const { token, user_id, username: uname, email } = response.data;
      
      const userData = { id: user_id, username: uname, email };
      
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(userData));
      
      axios.defaults.headers.common['Authorization'] = `Token ${token}`;
      
      setUser(userData);
      return true;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const register = async (userData) => {
    try {
      console.log('Sending registration data:', userData);
      const response = await axios.post(API_URLS.register, userData);
      const { token, user_id, username, email } = response.data;
      
      const user = { id: user_id, username, email };
      
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      
      axios.defaults.headers.common['Authorization'] = `Token ${token}`;
      
      setUser(user);
      return true;
    } catch (error) {
      console.error('Registration error:', error);
      // Add this to see the actual error response from the server
      if (error.response) {
        console.error('Server error response:', error.response.data);
      }
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};