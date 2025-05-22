import React from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Image, Platform, SafeAreaView } from 'react-native';
import { StackScreenProps } from '@react-navigation/stack';
import ejerciciosData from './ejercicios.json'; 
import { useTheme } from '../../themecontext';

type RootStackParamList = {
  Zonas: undefined;
  Ejercicios: {
    zona: {
      id: string;
      nombre: string;
    };
  };
};

type EjerciciosScreenProps = StackScreenProps<RootStackParamList, 'Ejercicios'>;

export default function EjerciciosScreen({ route, navigation }: EjerciciosScreenProps) {
  const { zona } = route.params;
  const { theme } = useTheme(); 
  const isDarkMode = theme === 'Oscuro';

  const ejercicios = ejerciciosData.filter((ejercicio) => ejercicio.zonaId === zona.id);

  const handleEjercicioPress = (ejercicio: any) => {
    console.log('Navegar al detalle del ejercicio:', ejercicio);
  };

  return (
    <SafeAreaView
      style={[
        styles.container,
        { backgroundColor: isDarkMode ? '#121212' : '#ffffff' }, 
      ]}
    >
      <Text
        style={[
          styles.title,
          { color: isDarkMode ? '#ffffff' : '#000000' },
        ]}
      >
        {zona.nombre}
      </Text>
      <FlatList
        data={ejercicios}
        key={2}
        numColumns={2} 
        columnWrapperStyle={styles.columnWrapper} 
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.card,
              { backgroundColor: isDarkMode ? '#333333' : '#f0f0f0' },
            ]}
            onPress={() => handleEjercicioPress(item)}
          >
            <Image source={{ uri: item.imagen }} style={styles.image} />
            <Text
              style={[
                styles.cardTitle,
                { color: isDarkMode ? '#ffffff' : '#000000' },
              ]}
            >
              {item.nombre}
            </Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <Text
            style={[
              styles.emptyMessage,
              { color: isDarkMode ? '#bbbbbb' : '#555555' }, 
            ]}
          >
            No hay ejercicios disponibles
          </Text>
        }
        contentContainerStyle={styles.listContainer} 
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20, 
    paddingTop: Platform.OS === 'android' ? 40 : 20, 
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    marginLeft: 20,
    textAlign: 'left',
  },
  columnWrapper: {
    justifyContent: 'space-between', 
    marginLeft: 10,
    marginRight: 10,
  },
  card: {
    flex: 1,
    margin: 8, 
    borderRadius: 8,
    alignItems: 'center',
    overflow: 'hidden', 
  },
  image: {
    width: '100%',
    height: 150, 
    borderRadius: 8,
  },
  cardTitle: {
    position: 'absolute', 
    bottom: 10, 
    left: 10, 
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    paddingHorizontal: 8, 
    borderRadius: 4, 
  },
  listContainer: {
    paddingBottom: 20, 
  },
  emptyMessage: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 20,
  },
});