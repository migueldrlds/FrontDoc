import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

type User = {
  id: number;
  username: string;
  email: string;
  UserID: string;
  role: 'paciente' | 'medico';
  especialidad?: string;
  cedula?: string;
  historialMedico?: any[];
  // ... otros campos que necesites
};

type AuthContextType = {
  isAuthenticated: boolean;
  user: User | null;
  signIn: (response: { user: User; jwt: string }) => Promise<void>;
  signOut: () => Promise<void>;
  userRole: 'paciente' | 'medico' | null;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<'paciente' | 'medico' | null>(null);

  const signIn = async (response: { user: User; jwt: string }) => {
    try {
      if (!response.user || !response.jwt) {
        throw new Error('Datos de usuario incompletos');
      }
      
      // Guardar en AsyncStorage
      await AsyncStorage.setItem('user', JSON.stringify(response.user));
      await AsyncStorage.setItem('jwt', response.jwt);
      await AsyncStorage.setItem('userRole', response.user.role || 'paciente');
      
      // Actualizar el estado
      setUser(response.user);
      setUserRole(response.user.role as 'paciente' | 'medico' || 'paciente');
      setIsAuthenticated(true);
    } catch (error) {
      console.error('Error en signIn:', error);
      throw error;
    }
  };

  // Cargar usuario al iniciar la app
  useEffect(() => {
    const loadUser = async () => {
      try {
        const savedUser = await AsyncStorage.getItem('user');
        const savedRole = await AsyncStorage.getItem('userRole');
        
        if (savedUser) {
          const userData = JSON.parse(savedUser);
          setUser(userData);
          setUserRole(savedRole as 'paciente' | 'medico' || 'paciente');
          setIsAuthenticated(true);
        }
      } catch (error) {
        console.error('Error loading user:', error);
      }
    };

    loadUser();
  }, []);

  const signOut = async () => {
    await AsyncStorage.removeItem('user');
    await AsyncStorage.removeItem('jwt');
    await AsyncStorage.removeItem('userRole');
    setUser(null);
    setUserRole(null);
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, signIn, signOut, userRole }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
}