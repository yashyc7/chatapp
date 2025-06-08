import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';
import { API_URLS } from '../config';
import { auth, googleProvider } from '../../firebase';
import { 
  signInWithPopup, 
  signInWithRedirect, 
  getRedirectResult 
} from 'firebase/auth';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    initializeUser();
  }, []);

  // Add useEffect to handle redirect result
  useEffect(() => {
    const handleRedirectSignIn = async () => {
      try {
        const result = await getRedirectResult(auth);
        if (result) {
          const firebaseToken = await result.user.getIdToken();
          await handleFirebaseToken(result.user, firebaseToken);
        }
      } catch (error) {
        console.error('Redirect sign-in error:', error);
      }
    };

    handleRedirectSignIn();
  }, []);

  const initializeUser = () => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');

    if (token && userData) {
      setUser(JSON.parse(userData));
      axios.defaults.headers.common['Authorization'] = `Token ${token}`;
      console.log('Token set in axios defaults:', token);
    } else {
      clearAxiosAuthHeader();
      console.log('No token found, Authorization header cleared');
    }

    setLoading(false);
  };

  const clearAxiosAuthHeader = () => {
    delete axios.defaults.headers.common['Authorization'];
  };

  const login = async (username, password) => {
    try {
      // Clear any old Authorization headers before login
      clearAxiosAuthHeader();

      const response = await axios.post(
        API_URLS.login,
        { username, password },
        {
          headers: { 'Content-Type': 'application/json' },
        }
      );

      const { token, user_id, username: uname, email } = response.data;
      const userData = { id: user_id, username: uname, email };

      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(userData));

      axios.defaults.headers.common['Authorization'] = `Token ${token}`;

      setUser(userData);
      return true;
    } catch (error) {
      console.error('Login error:', error);
      if (error.response) {
        console.error('Server error response:', error.response.data);
      }
      return false;
    }
  };

  // Separate the token handling logic
  const handleFirebaseToken = async (firebaseUser, firebaseToken) => {
    try {
      const response = await axios.post(
        API_URLS.googleLogin,
        {
          firebase_token: firebaseToken,
          display_name: firebaseUser.displayName || '',
          photo_url: firebaseUser.photoURL || '',
        },
        { headers: { 'Content-Type': 'application/json' } }
      );

      const { token, user_id, username, email, photo_url } = response.data;
      const userData = { id: user_id, username, email, photo_url };

      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(userData));

      axios.defaults.headers.common['Authorization'] = `Token ${token}`;
      setUser(userData);
      return true;
    } catch (error) {
      console.error('Firebase token handling error:', error);
      return false;
    }
  };

  const googleLogin = async () => {
    try {
      clearAxiosAuthHeader();
      
      if (process.env.NODE_ENV === 'development') {
        // Use popup for development
        const result = await signInWithPopup(auth, googleProvider);
        const firebaseToken = await result.user.getIdToken();
        return await handleFirebaseToken(result.user, firebaseToken);
      } else {
        // Use redirect for production
        await signInWithRedirect(auth, googleProvider);
        return true; // The redirect will happen here
      }
    } catch (error) {
      console.error('Google login error:', error);
      return false;
    }
  };

  const register = async userData => {
    try {
      const response = await axios.post(API_URLS.register, userData, {
        headers: { 'Content-Type': 'application/json' },
      });

      const { token, user_id, username, email } = response.data;
      const user = { id: user_id, username, email };

      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));

      axios.defaults.headers.common['Authorization'] = `Token ${token}`;

      setUser(user);
      return true;
    } catch (error) {
      console.error('Registration error:', error);
      if (error.response) {
        console.error('Server error response:', error.response.data);
      }
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    clearAxiosAuthHeader();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, googleLogin, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
