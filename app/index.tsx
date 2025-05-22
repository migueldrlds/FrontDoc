import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, StatusBar, Image, SafeAreaView } from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useNavigation, Href } from 'expo-router';
import 'react-native-gesture-handler'; // Importa primero
import { useTheme } from '@/app/themecontext';

export default function Index() {
  const router = useRouter();
  const navigation = useNavigation();
  const { theme } = useTheme(); // Obtener el tema actual (claro/oscuro)

  // Ocultar el encabezado de la página
  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: false,
    });
  }, [navigation]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: 'black' }]}>
      {/* Barra de estado */}
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      {/* Video de fondo */}
      <Video
        source={require('../assets/videos/vid.mp4')}
        style={styles.backgroundVideo}
        rate={1.0}
        volume={1.0}
        isMuted={true}
        resizeMode={ResizeMode.COVER}
        shouldPlay
        isLooping
      />

      {/* Logo */}
      <View style={styles.logoContainer}>
        <Image
          source={require('../assets/images/logo.png')}
          style={styles.logo}
        />
      </View>

      {/* Degradado siempre negro */}
      <LinearGradient
        colors={['transparent', 'rgba(0, 0, 0, 0.8)']}
        style={styles.overlay}
      />

      {/* Contenido */}
      <View style={styles.content}>
        <View style={styles.textContainer}>
          <Text style={[styles.title, { color: '#fff' }]}>Fit Gimnasio Macroplaza</Text>
          <Text style={[styles.subtitle, { color: '#d3d3d3' }]}>
            Tu espacio para el bienestar. Te queremos FIT.
          </Text>
        </View>

        {/* Botones */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.joinButton, { backgroundColor: '#fff' }]}
            onPress={() => router.push('/register' as any)}
          >
            <Text style={[styles.joinButtonText, { color: '#000' }]}>Regístrate</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.loginButton, { borderColor: '#fff' }]}
            onPress={() => router.push('/login' as any)}
          >
            <Text style={[styles.loginButtonText, { color: '#fff' }]}>Iniciar sesión</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundVideo: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
  },
  logoContainer: {
    position: 'absolute', 
    top: 50,
    left: 20,
    zIndex: 1,
  },
  logo: {
    width: 80,
    height: 80,
    resizeMode: 'contain',
    tintColor: '#fff', 
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
  content: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingBottom: 50,
  },
  textContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'left',
  },
  subtitle: {
    fontSize: 18,
    textAlign: 'left',
    marginTop: 10,
    opacity: 0.8,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginTop: 20,
    paddingHorizontal: 20,
  },
  joinButton: {
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 25,
    marginRight: 10,
  },
  joinButtonText: {
    fontSize: 16,
  },
  loginButton: {
    borderWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 25,
  },
  loginButtonText: {
    fontSize: 16,
    color: '#fff',
  },
});