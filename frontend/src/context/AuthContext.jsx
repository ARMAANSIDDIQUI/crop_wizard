import React, { createContext, useContext, useEffect, useState } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [token, setToken] = useState(null);
    const [role, setRole] = useState('user');
    const [loading, setLoading] = useState(true);

    // Hydrate auth state from localStorage on first load
    useEffect(() => {
        const storedToken = localStorage.getItem('token');
        const storedRole = localStorage.getItem('role');
        if (storedToken) {
            setToken(storedToken);
            setRole(storedRole || 'user');
        }
        setLoading(false);
    }, []);

    const login = (jwt, userRole = 'user') => {
        localStorage.setItem('token', jwt);
        localStorage.setItem('role', userRole);
        setToken(jwt);
        setRole(userRole);
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        setToken(null);
        setRole('user');
    };

    const value = {
        token,
        role,
        isAuthenticated: Boolean(token),
        loading,
        login,
        logout,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const ctx = useContext(AuthContext);
    if (!ctx) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return ctx;
};
