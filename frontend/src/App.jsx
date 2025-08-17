import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Login from './components/Login';
import Register from './components/Register';
import ChatLayout from './components/ChatLayout';
import { AuthProvider } from './context/AuthContext';
import { WebSocketProvider } from './context/WebSocketContext';
import { NotificationProvider } from './context/NotificationContext';

function App() {
  return (
    <Router>
      <AuthProvider>
        <WebSocketProvider>
          <NotificationProvider>
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

            {/* Toast notifications */}
            <ToastContainer
              position="top-right"
              autoClose={5000}
              hideProgressBar={false}
              newestOnTop
              closeOnClick
              rtl={false}
              pauseOnFocusLoss
              draggable
              pauseOnHover
              theme="colored"
            />
          </NotificationProvider>
        </WebSocketProvider>
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
