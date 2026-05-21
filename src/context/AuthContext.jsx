import { createContext, useContext, useState } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [auth, setAuth] = useState(() => {
        const token = localStorage.getItem('token');
        const username = localStorage.getItem('username');
        const roles = JSON.parse(localStorage.getItem('roles') || '[]');
        return token ? { token, username, roles } : null;
    });

    const login = (data) => {
        // data = { token, username, roles } from /api/auth/login
        localStorage.setItem('token', data.token);
        localStorage.setItem('username', data.username);
        localStorage.setItem('roles', JSON.stringify(data.roles));
        sessionStorage.setItem('activeSession', 'true');
        setAuth(data);
    };

    const logout = () => {
        localStorage.clear();
        sessionStorage.clear();
        setAuth(null);
    };

    // roles from backend are ["ADMIN"], ["NURSE"] etc — no ROLE_ prefix stored
    const hasRole = (role) => auth?.roles?.includes(role);

    return (
        <AuthContext.Provider value={{ auth, login, logout, hasRole }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);