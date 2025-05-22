import { Stack } from 'expo-router';
import { useTheme } from '../../themecontext';

export default function SubSettingsLayout() {
  const { theme } = useTheme();
  const isDarkMode = theme === 'Oscuro';

  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerStyle: {
          backgroundColor: isDarkMode ? '#1a1a1a' : '#ffffff',
        },
        headerTintColor: isDarkMode ? '#fff' : '#000',
      }}
    >
      <Stack.Screen 
        name="profile" 
        options={{
          title: 'Mi Perfil',
          headerTitleStyle: {
            fontWeight: '600',
          },
        }}
      />
      <Stack.Screen 
        name="membership" 
        options={{
          title: 'Membresía',
          headerTitleStyle: {
            fontWeight: '600',
          },
        }}
      />
    </Stack>
  );
}
