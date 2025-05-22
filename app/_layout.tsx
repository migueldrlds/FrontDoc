import { Stack } from 'expo-router';
import { ThemeProvider } from './themecontext';
import { AuthProvider } from './authContext';

export default function Layout() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Stack
          screenOptions={{
            headerShown: false,
          }}
          initialRouteName="index"
        >
          <Stack.Screen name="index" />
        </Stack>
      </AuthProvider>
    </ThemeProvider>
  );
}