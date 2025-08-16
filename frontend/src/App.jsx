  import React, { useState, useEffect } from 'react';
  import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
  import Login from './components/Login';
  import Register from './components/Register';
  import ChatLayout from './components/ChatLayout';
  import { AuthProvider } from './context/AuthContext';

  function App() {
    return (
      
        <Router>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route
              path="/chat/*"
              element={
                <PrivateRoute>
                  <ChatLayout />
                </PrivateRoute>
              }
            />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
      </AuthProvider>
        </Router>
     
    );
  }

  // Private route component
  function PrivateRoute({ children }) {
    const token = localStorage.getItem('token');

    if (!token) {
      return <Navigate to="/login" replace />;
    }

    return children;
  }

  export default App;
