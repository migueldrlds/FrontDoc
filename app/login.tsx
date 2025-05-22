import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  StatusBar,
  Image,
  useColorScheme,
  Alert,
} from 'react-native';
import { useNavigation, useFocusEffect, useRouter } from 'expo-router';
import { loginUser } from './api/api';
import { useAuth } from '@/app/authContext';

export default function LoginScreen() {
  const navigation = useNavigation();
  const colorScheme = useColorScheme();
  const router = useRouter();
  const isDarkMode = colorScheme === 'dark';
  const { signIn } = useAuth();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');

  useFocusEffect(
    React.useCallback(() => {
      navigation.setOptions({
        headerShown: false,
        headerBackTitle: 'Atrás',
      });
    }, [navigation])
  );

  const handleLogin = async () => {
    try {
      if (!identifier.trim() || !password.trim()) {
        alert('Por favor ingresa todos los campos');
        return;
      }

      // Validar el formato del identificador
      const isEmail = identifier.includes('@');
      const isUserID = /^\d+$/.test(identifier);

      if (!isEmail && !isUserID) {
        alert('Por favor ingresa un correo electrónico válido o un ID de usuario (números)');
        return;
      }

      // Validar contraseña (mínimo 6 caracteres)
      if (password.length < 6) {
        alert('La contraseña debe tener al menos 6 caracteres');
        return;
      }
      
      // Si es un UserID, intentamos buscar por ese campo
      const loginData = {
        identifier: isUserID ? identifier.trim() : identifier.trim(),
        password: password
      };

      console.log('Datos enviados:', loginData);

      // Usar la función loginUser en lugar de fetch directo
      try {
        const data = await loginUser(loginData.identifier, loginData.password);
        
        console.log('Respuesta exitosa:', data);
        
        await signIn({
          user: data.user,
          jwt: data.jwt
        });
        
        router.push('/home');
      } catch (error: any) {
        if (error.message === 'Invalid identifier or password') {
          alert('Usuario o contraseña incorrectos. Por favor verifica tus credenciales.');
        } else {
          throw error;
        }
      }
      
    } catch (error) {
      console.error('Error completo:', error);
      
      if (error instanceof TypeError && error.message.includes('Network request failed')) {
        alert('Error de conexión: Verifica tu conexión a internet y que el servidor esté accesible');
      } else {
        alert('Error al iniciar sesión: ' + (error instanceof Error ? error.message : 'Error desconocido'));
      }
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: isDarkMode ? '#121212' : '#fff' }]}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />

      <View style={styles.logoContainer}>
        <Image
          source={require('../assets/images/logo.png')}
          style={[styles.logo, { tintColor: isDarkMode ? '#fff' : '#000' }]}
        />
      </View>

      <Text style={[styles.mainText, { color: isDarkMode ? '#fff' : '#000' }]}>
        Ingresa tus credenciales para iniciar sesión.
      </Text>

      <View style={styles.inputContainer}>
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: isDarkMode ? '#333' : '#f9f9f9',
              borderColor: isDarkMode ? '#555' : '#ccc',
              color: isDarkMode ? '#fff' : '#000',
            },
          ]}
          placeholder="Correo electrónico o ID de usuario"
          placeholderTextColor={isDarkMode ? '#888' : '#999'}
          value={identifier}
          onChangeText={setIdentifier}
          keyboardType={/^\d+$/.test(identifier) ? 'numeric' : 'email-address'}
          autoCapitalize="none"
        />
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: isDarkMode ? '#333' : '#f9f9f9',
              borderColor: isDarkMode ? '#555' : '#ccc',
              color: isDarkMode ? '#fff' : '#000',
            },
          ]}
          placeholder="Contraseña"
          placeholderTextColor={isDarkMode ? '#888' : '#999'}
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />
      </View>

      {/* Botón de iniciar sesión */}
      <TouchableOpacity
        style={[
          styles.continueButton,
          { backgroundColor: isDarkMode ? '#fff' : '#000' },
        ]}
        onPress={handleLogin}
      >
        <Text
          style={[
            styles.continueButtonText,
            { color: isDarkMode ? '#000' : '#fff' },
          ]}
        >
          Iniciar sesión
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
  },
  logoContainer: {
    marginBottom: 20,
  },
  logo: {
    width: 100,
    height: 100,
    resizeMode: 'contain',
  },
  mainText: {
    fontSize: 26,
    fontWeight: 'bold',
    fontFamily: 'System',
    textAlign: 'left',
    marginBottom: 20,
  },
  inputContainer: {
    width: '100%',
    marginBottom: 20,
  },
  input: {
    width: '100%',
    height: 50,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 15,
    fontSize: 16,
    fontFamily: 'System',
  },
  continueButton: {
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 30,
    alignItems: 'center',
    alignSelf: 'flex-start',
    width: '100%',
  },
  continueButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: 'System',
  },
});