import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type StartScreenType = 'index' | 'plan' | 'calendar';

const START_SCREEN_KEY = '@app_start_screen';

export function useStartScreen() {
  const [startScreen, setStartScreen] = useState<StartScreenType>('index');

  useEffect(() => {
    loadStartScreen();
  }, []);

  const loadStartScreen = async () => {
    try {
      const saved = await AsyncStorage.getItem(START_SCREEN_KEY);
      if (saved && isValidStartScreen(saved)) {
        setStartScreen(saved as StartScreenType);
      }
    } catch (error) {
      console.error('Error al cargar la pantalla de inicio:', error);
    }
  };

  const isValidStartScreen = (screen: string): screen is StartScreenType => {
    return ['index', 'plan', 'calendar'].includes(screen);
  };

  const updateStartScreen = async (newScreen: StartScreenType) => {
    try {
      await AsyncStorage.setItem(START_SCREEN_KEY, newScreen);
      setStartScreen(newScreen);
      
      console.log('Pantalla de inicio actualizada a:', newScreen);
    } catch (error) {
      console.error('Error al guardar la pantalla de inicio:', error);
    }
  };

  return {
    startScreen,
    updateStartScreen,
    isScreenSelected: (screen: StartScreenType) => startScreen === screen
  };
}