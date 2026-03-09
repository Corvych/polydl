import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch user profile using the stored token
  const fetchUserProfile = async () => {
    try {
      const res = await api.get('/profile');
      setUser(res.data);
    } catch (error) {
      console.error('Failed to fetch profile', error);
      await logout(); // Token invalid → log out
    }
  };

  // Initialize auth state on app start
  useEffect(() => {
    const initAuth = async () => {
      try {
        const storedToken = await AsyncStorage.getItem('token');
        if (storedToken) {
          setToken(storedToken);
          // Set token in API headers if needed
          api.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
          await fetchUserProfile();
        }
      } catch (err) {
        console.error('Error initializing auth', err);
      } finally {
        setLoading(false);
      }
    };
    initAuth();
  }, []);

  // Login function
  const login = async (username, password) => {
    try {
      const response = await api.post('/auth/login', { username, password });
      const { token: newToken } = response.data;

      await AsyncStorage.setItem('token', newToken);
      setToken(newToken);
      api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;

      await fetchUserProfile();
      return { success: true };
    } catch (error) {
      console.error('Login failed', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Login failed',
      };
    }
  };

  // Register function
  const register = async (data) => {
    try {
      const response = await api.post('/auth/register', data);
      if (response.data.token) {
        const newToken = response.data.token;
        await AsyncStorage.setItem('token', newToken);
        setToken(newToken);
        api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
        await fetchUserProfile();
      }
      return { success: true };
    } catch (error) {
      console.error('Registration failed', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Registration failed',
      };
    }
  };

  // Logout function
  const logout = async () => {
    await AsyncStorage.removeItem('token');
    setToken(null);
    setUser(null);
    delete api.defaults.headers.common['Authorization'];
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        register,
        logout,
        loading,
        fetchUserProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook for convenience
export const useAuth = () => useContext(AuthContext);
