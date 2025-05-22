import React, { useState } from 'react';
import { View, Text, Switch, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { useTheme } from '../themecontext'; // Usar el hook personalizado
import { useAuth } from '../authContext'; // Importar el AuthContext existente
import { useRouter } from 'expo-router'; // Ya que estás usando expo-router
import { useStartScreen, StartScreenType } from '../hooks/useStartScreen';
import { useNavigation } from '@react-navigation/native';

export default function PantallaConfiguracion() {
  const { theme, setTheme } = useTheme(); // Acceder al tema global usando el hook personalizado
  const isDarkMode = theme === 'Oscuro'; // Verificar si el tema global es oscuro
  const { signOut } = useAuth(); // Usar el método signOut de tu AuthContext
  const router = useRouter();
  const { startScreen, updateStartScreen } = useStartScreen();
  const navigation = useNavigation();

  // Obtener la altura de la ventana
  const windowHeight = Dimensions.get('window').height;

  // Estados para los switches de notificaciones
  const [isEventNotificationEnabled, setEventNotificationEnabled] = useState(true);
  const [isClosureNotificationEnabled, setClosureNotificationEnabled] = useState(false);
  
  // Definir colores de estilo para los switches (blanco y gris claro)
  const switchColors = (isEnabled: boolean) => ({
    trackColor: { false: '#767577', true: '#3A3A3A' }, // Gris oscuro cuando está activado
    thumbColor: isEnabled ? '#FFF' : '#F4F3F4', // Blanco para el botón
  });

  const handleLogout = async () => {
    try {
      await signOut();
      router.replace('/'); // Redirigir al usuario a la pantalla inicial
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDarkMode ? '#121212' : '#F0F0F3' }]}>
      <ScrollView contentContainerStyle={[styles.scrollContent, { paddingBottom: windowHeight * 0.2 }]}>

        {/* Título de configuración */}
        <Text style={[styles.headerTitle, { color: isDarkMode ? '#FFFFFF' : '#000' }]}>Configuración</Text>

        {/* Tarjeta para la sección "Tu cuenta" */}
        <View style={[styles.card, { backgroundColor: isDarkMode ? '#1E1E1E' : '#FFFFFF' }]}>
          <Text style={[styles.title, { color: isDarkMode ? '#FFFFFF' : '#000' }]}>Mi Perfil</Text>
          <Text style={[styles.description, { color: isDarkMode ? '#B3B3B3' : '#666' }]}>
            Consulta tu fecha de pago.
          </Text>
          <View style={styles.line} />
          <TouchableOpacity 
            onPress={() => {
              navigation.navigate('Profile');
            }}
          >
            <View style={styles.optionRow}>
              <Text style={[styles.optionTitle, { color: isDarkMode ? '#FFFFFF' : '#000' }]}>
                Mi Perfil
              </Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push('/home/subsettings/membership' as any)}>
            <View style={styles.optionRow}>
              <Text style={[styles.optionTitle, { color: isDarkMode ? '#FFFFFF' : '#000' }]}>Mi Membresía</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Tarjeta para configuraciones de notificaciones */}
        <View style={[styles.card, { backgroundColor: isDarkMode ? '#1E1E1E' : '#FFFFFF' }]}>
          <Text style={[styles.title, { color: isDarkMode ? '#FFFFFF' : '#000' }]}>Configuración de Notificaciones</Text>
          <Text style={[styles.description, { color: isDarkMode ? '#B3B3B3' : '#666' }]}>
            Administra tus preferencias de notificación.
          </Text>

          <View style={styles.line} />

          {/* Opción de anuncios de eventos */}
          <View style={styles.optionRow}>
            <View style={styles.textContainer}>
              <Text style={[styles.optionTitle, { color: isDarkMode ? '#FFFFFF' : '#000' }]}>Anuncios de Eventos</Text>
              <Text style={[styles.optionDescription, { color: isDarkMode ? '#B3B3B3' : '#666' }]}>
                Recibe notificaciones sobre eventos próximos.
              </Text>
            </View>
            <Switch
              value={isEventNotificationEnabled}
              onValueChange={setEventNotificationEnabled}
              trackColor={switchColors(isEventNotificationEnabled).trackColor}
              thumbColor={switchColors(isEventNotificationEnabled).thumbColor}
            />
          </View>

          <View style={styles.line} />

          {/* Opción de avisos de cierre */}
          <View style={styles.optionRow}>
            <View style={styles.textContainer}>
              <Text style={[styles.optionTitle, { color: isDarkMode ? '#FFFFFF' : '#000' }]}>Avisos de Cierre</Text>
              <Text style={[styles.optionDescription, { color: isDarkMode ? '#B3B3B3' : '#666' }]}>
                Recibe notificaciones sobre cierres importantes.
              </Text>
            </View>
            <Switch
              value={isClosureNotificationEnabled}
              onValueChange={setClosureNotificationEnabled}
              trackColor={switchColors(isClosureNotificationEnabled).trackColor}
              thumbColor={switchColors(isClosureNotificationEnabled).thumbColor}
            />
          </View>
        </View>

        {/* Tarjeta para la configuración de tema */}
        <View style={[styles.card, { backgroundColor: isDarkMode ? '#1E1E1E' : '#FFFFFF' }]}>
          <Text style={[styles.title, { color: isDarkMode ? '#FFFFFF' : '#000' }]}>Configuración de Tema</Text>
          <Text style={[styles.description, { color: isDarkMode ? '#B3B3B3' : '#666' }]}>
            Cambia el tema de la interfaz de usuario.
          </Text>

          <View style={styles.line} />

          {/* Opción para alternar entre Claro y Oscuro */}
          <View style={styles.optionRow}>
            <Text style={[styles.optionTitle, { color: isDarkMode ? '#FFFFFF' : '#000' }]}>
              {isDarkMode ? 'Modo Oscuro' : 'Modo Claro'}
            </Text>
            <Switch
              value={!isDarkMode}
              onValueChange={() => setTheme(isDarkMode ? 'Claro' : 'Oscuro')}
              trackColor={switchColors(!isDarkMode).trackColor}
              thumbColor={switchColors(!isDarkMode).thumbColor}
            />
          </View>

          <View style={styles.line} />

          {/* Opción de tema Predeterminado del Sistema */}
          <TouchableOpacity onPress={() => setTheme('Predeterminado')}>
            <View style={styles.optionRow}>
              <Text style={[styles.optionTitle, { color: isDarkMode ? '#FFFFFF' : '#000' }]}>
                Predeterminado del sistema
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Tarjeta para seleccionar la pantalla de inicio */}
        <View style={[styles.card, { backgroundColor: isDarkMode ? '#1E1E1E' : '#FFFFFF' }]}>
          <Text style={[styles.title, { color: isDarkMode ? '#FFFFFF' : '#000' }]}>Pantalla de Inicio</Text>
          <Text style={[styles.description, { color: isDarkMode ? '#B3B3B3' : '#666' }]}>
            Selecciona la pantalla que aparecerá al iniciar sesión.
          </Text>

          <View style={styles.line} />

          {/* Opción para seleccionar la pantalla 'Index' */}
          <View style={styles.optionRow}>
            <Text style={[styles.optionTitle, { color: isDarkMode ? '#FFFFFF' : '#000' }]}>Inicio</Text>
            <Switch
              value={startScreen === 'index'}
              onValueChange={() => {
                if (startScreen !== 'index') {
                  updateStartScreen('index');
                }
              }}
              trackColor={switchColors(startScreen === 'index').trackColor}
              thumbColor={switchColors(startScreen === 'index').thumbColor}
            />
          </View>

          <View style={styles.line} />

          {/* Opción para seleccionar la pantalla 'Plan' */}
          <View style={styles.optionRow}>
            <Text style={[styles.optionTitle, { color: isDarkMode ? '#FFFFFF' : '#000' }]}>Plan</Text>
            <Switch
              value={startScreen === 'plan'}
              onValueChange={() => {
                if (startScreen !== 'plan') {
                  updateStartScreen('plan');
                }
              }}
              trackColor={switchColors(startScreen === 'plan').trackColor}
              thumbColor={switchColors(startScreen === 'plan').thumbColor}
            />
          </View>

          <View style={styles.line} />

          {/* Opción para seleccionar la pantalla 'Calendar' */}
          <View style={styles.optionRow}>
            <Text style={[styles.optionTitle, { color: isDarkMode ? '#FFFFFF' : '#000' }]}>Calendario</Text>
            <Switch
              value={startScreen === 'calendar'}
              onValueChange={() => {
                if (startScreen !== 'calendar') {
                  updateStartScreen('calendar');
                }
              }}
              trackColor={switchColors(startScreen === 'calendar').trackColor}
              thumbColor={switchColors(startScreen === 'calendar').thumbColor}
            />
          </View>
        </View>

        {/* Tarjeta para Cerrar Sesión */}
        <View style={[styles.card, { backgroundColor: isDarkMode ? '#1E1E1E' : '#FFFFFF' }]}>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutText}>Cerrar sesión</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 1,
    paddingTop: 30,
  },
  scrollContent: {
    paddingBottom: 50, // Este valor se modificará dinámicamente con la altura de la ventana
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 20,
    paddingHorizontal: 20,
    marginTop: 20,
  },
  card: {
    borderRadius: 15,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 8,
    marginBottom: 20,
    marginHorizontal: 10,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    fontFamily: 'System',
  },
  description: {
    fontSize: 14,
    marginVertical: 10,
    fontFamily: 'System',
  },
  line: {
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    marginVertical: 6,
  },
  optionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 7,
  },
  textContainer: {
    flex: 1,
    paddingRight: 10,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '500',
    fontFamily: 'System',
  },
  optionDescription: {
    fontSize: 14,
    marginTop: 5,
    fontFamily: 'System',
  },
  logoutButton: {
    padding: 15,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
  },
  logoutText: {
    fontSize: 16,
    color: '#FF3B30',
    fontWeight: 'bold',
    textAlign: 'center',
  },
});