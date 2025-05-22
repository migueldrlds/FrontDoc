import axios from 'axios';
import NetInfo from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Tokens API
const API_TOKEN_PACIENTE = "be7b67deaedba33f7faaa655fcc119def81e8bb2f83136e7b67036f1d81af15368f9d40f0bb2819f3c9a2d4fc48b8f4643f5202d4c8fdb1603c133d0486dbe2ab79974f499c43419c1dee9d0def03e43d67d2cf8a606cf2cc524a267dd840eca01da25304e2724da71ea5948093cb4b111923e58feec838a857c5f7ea2da7965";
const API_TOKEN_MEDICO = "cbde2ceea36cd25b97cf9039c37974a3ad5253c81928ab6cf188148df16e8cd404a369cdf90d81174ec1acd8276e0bea125c696d9335ff79be7a0b94ad492009d66195b65b4d5f24406788b31a822486091f167e0f84734bb25c523f168a8a697557f388e0f5c45fb1eb1a3fab509cc14f57a298ecc08d30075aeca686345541";

// IP fija del backend
const BACKEND_IP = '201.171.25.219';

// Función para obtener la URL base del API
const getApiUrl = async () => {
  return `http://${BACKEND_IP}:1338/api`;
};

// Crear el cliente axios con la URL base
const API_URL = `http://${BACKEND_IP}:1338/api`;

console.log('API URL configurada:', API_URL);

const api = axios.create({
  baseURL: API_URL,
});

// Interceptor para configurar los headers de autorización
api.interceptors.request.use(async (config) => {
  // Obtener el rol del usuario (médico o paciente)
  const userRole = await AsyncStorage.getItem('userRole');
  
  // Asignar el token correspondiente según el rol
  if (userRole === 'medico') {
    config.headers.Authorization = `Bearer ${API_TOKEN_MEDICO}`;
  } else {
    config.headers.Authorization = `Bearer ${API_TOKEN_PACIENTE}`;
  }
  
  return config;
});

// Registrar usuario (paciente o médico)
export const registerUser = async (username, email, password, role = 'paciente') => {
  try {
    const response = await api.post('/auth/local/register', {
      username,
      email,
      password,
      role,
    });
    
    // Guardar el rol del usuario
    await AsyncStorage.setItem('userRole', role);
    
    return response.data;
  } catch (error) {
    console.error('Error registering user:', error.response?.data || error.message);
    throw error.response?.data || error.message;
  }
};

// Iniciar sesión
export const loginUser = async (identifier, password, role = 'paciente') => {
  try {
    const response = await api.post('/auth/local', {
      identifier,
      password,
    });
    
    // Guardar el rol del usuario
    await AsyncStorage.setItem('userRole', role);
    
    return response.data;
  } catch (error) {
    console.error('Error logging in:', error.response?.data || error.message);
    throw error.response?.data || error.message;
  }
};

// Obtener datos del usuario
export const getUser = async (jwt) => {
  try {
    const response = await api.get('/users/me', {
      headers: {
        Authorization: `Bearer ${jwt}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching user data:', error.response?.data || error.message);
    throw error.response?.data || error.message;
  }
};

// API para médicos
export const getMedicoData = async () => {
  try {
    const response = await api.get('/medicos');
    return response.data;
  } catch (error) {
    console.error('Error obteniendo datos médicos:', error.response?.data || error.message);
    throw error.response?.data || error.message;
  }
};

// API para pacientes
export const getPacienteData = async () => {
  try {
    const response = await api.get('/pacientes');
    return response.data;
  } catch (error) {
    console.error('Error obteniendo datos de pacientes:', error.response?.data || error.message);
    throw error.response?.data || error.message;
  }
};

export default api;
