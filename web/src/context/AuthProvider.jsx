import { useState, useEffect } from 'react';
import { AuthContext } from './AuthContext';
import api from '../services/api';

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchUserProfile = async () => {
        try {
            const res = await api.get('/profile');
            setUser(res.data);
        } catch (error) {
            console.error("Failed to fetch profile", error);
            localStorage.removeItem('token');
            setUser(null);
        }
    };

    useEffect(() => {
        const handleLogout = () => {
            console.log("Session expired or invalid, logging out...");
            logout();
        };

        window.addEventListener('auth:logout', handleLogout);

        const init = async () => {
            const token = localStorage.getItem('token');
            if (token) {
                await fetchUserProfile();
            }
            setLoading(false);
        };
        init();

        return () => {
            window.removeEventListener('auth:logout', handleLogout);
        };
    }, []);

    const login = async (username, password) => {
        try {
            const response = await api.post('/auth/login', { username, password });
            const { token } = response.data;
            localStorage.setItem('token', token);

            await fetchUserProfile();
            return { success: true };
        } catch (error) {
            console.error("Login failed", error);
            return { success: false, error: error.response?.data?.error || "Login failed" };
        }
    };

    const register = async (data) => {
        try {
            await api.post('/auth/register', data);
            // If registration returns specific data or auto-login, handle here.
            // For now, assuming user needs to login after register or register returns success.
            return { success: true };
        } catch (error) {
            console.error("Registration failed", error);
            return { success: false, error: error.response?.data?.error || "Registration failed" };
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, login, register, logout, loading, fetchUserProfile }}>
            {children}
        </AuthContext.Provider>
    );
};
