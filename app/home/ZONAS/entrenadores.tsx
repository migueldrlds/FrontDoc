import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, FlatList, Image, TouchableOpacity, SafeAreaView, Platform, Dimensions } from 'react-native';
import { useTheme } from '../../themecontext';
import entrenadoresData from './entrenadores.json';

interface Entrenador {
  id: string;
  nombre: string;
  especialidad: string;
  descripcion: string;
  imagen: string;
}

export default function Entrenadores() {
  const { theme } = useTheme(); 
  const isDarkMode = theme === 'Oscuro';

  const [trainers, setTrainers] = useState<Entrenador[]>([]);
  
  const screenWidth = Dimensions.get('window').width;
  const cardSize = (screenWidth - 60) / 2; 

  useEffect(() => {
    const shuffledTrainers = [...entrenadoresData.entrenadores].sort(() => 0.5 - Math.random());
    setTrainers(shuffledTrainers);
  }, []);

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
        Entrenadores
      </Text>
      <FlatList
        data={trainers}
        key={2}
        numColumns={2} 
        columnWrapperStyle={styles.columnWrapper} 
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.card,
              { 
                backgroundColor: isDarkMode ? '#333333' : '#f0f0f0',
                width: cardSize,
                height: cardSize
              },
            ]}
          >
            <Image 
              source={{ uri: item.imagen }} 
              style={[styles.image, { height: cardSize }]} 
            />
            <View
              style={[
                styles.overlay,
                { backgroundColor: isDarkMode ? 'rgba(0, 0, 0, 0.7)' : 'rgba(0, 0, 0, 0.5)' },
              ]}
            >
              <Text style={[styles.cardTitle, { color: isDarkMode ? '#ffffff' : '#ffffff' }]}>
                {item.nombre}
              </Text>
              <Text
                style={[
                  styles.cardSpecialty,
                  { color: isDarkMode ? '#bbbbbb' : '#dddddd' },
                ]}
              >
                {item.especialidad}
              </Text>
            </View>
          </TouchableOpacity>
        )}
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
    marginHorizontal: 10,
  },
  card: {
    margin: 8,
    borderRadius: 8,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    resizeMode: 'cover',
  },
  overlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 10,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  cardSpecialty: {
    fontSize: 14,
    marginTop: 4,
  },
  listContainer: {
    paddingBottom: 20,
  },
});