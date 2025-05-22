// app/register.tsx
import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  StatusBar,
  Linking,
  Image,
  useColorScheme,
  Alert,
} from 'react-native';
import { v4 as uuidv4 } from 'uuid'; // Generador de UUIDs
import { useNavigation, useFocusEffect } from 'expo-router';
import 'react-native-get-random-values'; // Import necesario para crypto.getRandomValues

import { registerUser } from './api/api'; // Asegúrate de tener esta función correctamente configurada
import { useAuth } from '@/app/authContext';

export default function RegisterScreen() {
  const navigation = useNavigation();
  const colorScheme = useColorScheme(); // Detectar el esquema de color del sistema (claro u oscuro)
  const { signIn } = useAuth();

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Ocultar el encabezado y personalizar el botón "Atrás"
  useFocusEffect(
    React.useCallback(() => {
      navigation.setOptions({
        headerShown: false, // Oculta el encabezado de la página
        headerBackTitle: 'Atrás', // Cambia el texto del botón "Atrás"
      });
    }, [navigation])
  );

  const handleRegister = async () => {
    try {
      // Validación de campos
      if (!username.trim() || !email.trim() || !password.trim()) {
        alert('Por favor completa todos los campos');
        return;
      }

      // Validación básica de email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        alert('Por favor ingresa un email válido');
        return;
      }

      console.log('Enviando datos:', { username, email, password });

      try {
        // Usar la función registerUser de api.js en lugar de fetch directo
        const data = await registerUser(username, email, password);
        
        console.log('Respuesta:', data);

        // Verificar que tenemos los datos necesarios
        if (!data.user || !data.jwt) {
          throw new Error('Respuesta incompleta del servidor');
        }

        // Iniciar sesión con los datos recibidos
        await signIn({
          user: data.user,
          jwt: data.jwt
        });

        alert('Registro exitoso');
        navigation.navigate('login' as never);
      } catch (error: any) {
        // Manejo de errores específicos de registro
        if (error.error?.message.includes('Email already exists')) {
          alert('Este correo electrónico ya está registrado');
        } else if (error.error?.message.includes('Username already exists')) {
          alert('Este nombre de usuario ya está registrado');
        } else {
          throw error;
        }
      }
    } catch (error) {
      console.error('Error completo:', error);
      alert('Error al registrar: ' + (error instanceof Error ? error.message : 'Error desconocido'));
    }
  };

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colorScheme === 'dark' ? '#121212' : '#fff' },
      ]}
    >
      {/* Cambia la barra de estado según el tema */}
      <StatusBar
        barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'}
      />

      {/* Logo PNG */}
      <View style={styles.logoContainer}>
        <Image
          source={require('../assets/images/logo.png')}
          style={[
            styles.logo,
            { tintColor: colorScheme === 'dark' ? '#fff' : '#000' },
          ]}
        />
      </View>

      {/* Texto de bienvenida */}
      <Text
        style={[
          styles.mainText,
          { color: colorScheme === 'dark' ? '#fff' : '#000' },
        ]}
      >
        Crea tu cuenta para comenzar.
      </Text>

      {/* Campos de entrada */}
      <View style={styles.inputContainer}>
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor:
                colorScheme === 'dark' ? '#333' : '#f9f9f9',
              borderColor: colorScheme === 'dark' ? '#555' : '#ccc',
              color: colorScheme === 'dark' ? '#fff' : '#000',
            },
          ]}
          placeholder="Nombre de usuario*"
          placeholderTextColor={colorScheme === 'dark' ? '#888' : '#999'}
          value={username}
          onChangeText={setUsername}
        />
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor:
                colorScheme === 'dark' ? '#333' : '#f9f9f9',
              borderColor: colorScheme === 'dark' ? '#555' : '#ccc',
              color: colorScheme === 'dark' ? '#fff' : '#000',
            },
          ]}
          placeholder="Correo electrónico*"
          placeholderTextColor={colorScheme === 'dark' ? '#888' : '#999'}
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor:
                colorScheme === 'dark' ? '#333' : '#f9f9f9',
              borderColor: colorScheme === 'dark' ? '#555' : '#ccc',
              color: colorScheme === 'dark' ? '#fff' : '#000',
            },
          ]}
          placeholder="Contraseña*"
          placeholderTextColor={colorScheme === 'dark' ? '#888' : '#999'}
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />
      </View>

      {/* Términos y condiciones */}
      <Text
        style={[
          styles.termsText,
          { color: colorScheme === 'dark' ? '#bbb' : '#666' },
        ]}
      >
        Al continuar, acepto la{' '}
        <Text
          style={[
            styles.linkText,
            { color: colorScheme === 'dark' ? '#fff' : '#000' },
          ]}
          onPress={() => Linking.openURL('https://www.politicadeprivacidad.com')}
        >
          Política de privacidad
        </Text>{' '}
        y{' '}
        <Text
          style={[
            styles.linkText,
            { color: colorScheme === 'dark' ? '#fff' : '#000' },
          ]}
          onPress={() => Linking.openURL('https://www.terminosycondiciones.com')}
        >
          Términos de uso
        </Text>.
      </Text>

      {/* Botón de registro */}
      <TouchableOpacity
        style={[
          styles.continueButton,
          { backgroundColor: colorScheme === 'dark' ? '#fff' : '#000' },
        ]}
        onPress={handleRegister}
      >
        <Text
          style={[
            styles.continueButtonText,
            { color: colorScheme === 'dark' ? '#000' : '#fff' },
          ]}
        >
          Registrarse
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
  termsText: {
    fontSize: 14,
    fontFamily: 'System',
    textAlign: 'left',
    marginBottom: 20,
  },
  linkText: {
    textDecorationLine: 'underline',
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