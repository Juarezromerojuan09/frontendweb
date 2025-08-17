import React, { createContext, useEffect, useState } from 'react';
import { loginService, logoutService } from '../services/auth';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [botNumber, setBotNumber] = useState('');

  // Cargar sesión si hay token (simple: confiar en token existente)
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;
    // En una fase posterior podríamos validar/decodificar token o cargar perfil
  }, []);

  const login = async ({ username, password }) => {
    const loggedUser = await loginService({ username, password });
    if (!loggedUser) throw new Error('Respuesta de login inválida');
    setUser({ username: loggedUser.username, role: loggedUser.role });
    setBotNumber(loggedUser.botNumber || '');
  };

  const logout = () => {
    logoutService();
    setUser(null);
    setBotNumber('');
  };

  return (
    <AuthContext.Provider value={{ user, botNumber, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => React.useContext(AuthContext);