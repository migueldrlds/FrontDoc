import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, Dimensions, ActivityIndicator } from 'react-native';
import { Avatar } from 'react-native-elements';
import { useAuth } from '../../authContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface Paciente {
  id: number;
  documentId: string;
  nombre: string;
  apellidos: string;
  fecha_nacimiento: string;
  edad: number;
  genero: string;
  curp: string;
  direccion: string;
  telefono_contacto: string;
  contacto_emergencia: string;
  correo_electronico: string;
  tipo_sangre: string;
  alergias: string;
  enfermedades_cronicas: string;
  antecedentes_familiares: string;
  intervenciones_previas: string;
  medicamentos_actuales: string;
  discapacidad: string;
  ultima_consulta: string;
  hospital_preferencia: string;
  medico_cabecera: string;
}

interface StrapiUser {
  id: number;
  username: string;
  email: string;
  blocked: boolean;
  Genero?: string;
  birthdate?: string;
  createdAt: string;
  UserID?: string;
  documentId?: string;
  apellidos?: string;
  phone?: string;
  plan?: string;
  provider: string;
  confirmed: boolean;
}

export default function Profile() {
  const { user, userRole } = useAuth() as { user: StrapiUser | null, userRole: string | null };
  const [pacienteData, setPacienteData] = useState<Paciente | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPacienteData = async () => {
      if (!user?.id) return;
      
      try {
        setLoading(true);
        
        // Intentamos primero con el documentId del usuario si existe
        if (user.documentId) {
          try {
            const directResponse = await fetch(
              `http://201.171.99.158:1337/api/pacientes/${user.documentId}`,
              {
                method: 'GET',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': 'Bearer be7b67deaedba33f7faaa655fcc119def81e8bb2f83136e7b67036f1d81af15368f9d40f0bb2819f3c9a2d4fc48b8f4643f5202d4c8fdb1603c133d0486dbe2ab79974f499c43419c1dee9d0def03e43d67d2cf8a606cf2cc524a267dd840eca01da25304e2724da71ea5948093cb4b111923e58feec838a857c5f7ea2da7965'
                }
              }
            );
            
            if (directResponse.ok) {
              const directData = await directResponse.json();
              if (directData.data) {
                setPacienteData(directData.data);
                setLoading(false);
                return;
              }
            }
          } catch (directError) {
            console.error('Error with direct fetch:', directError);
          }
        }
        
        // Si no funciona con documentId, intentamos con el filtro por user.id
        try {
          const response = await fetch(
            `http://201.171.99.158:1337/api/pacientes?filters[user][id]=${user.id}&populate=*`,
            {
              method: 'GET',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer be7b67deaedba33f7faaa655fcc119def81e8bb2f83136e7b67036f1d81af15368f9d40f0bb2819f3c9a2d4fc48b8f4643f5202d4c8fdb1603c133d0486dbe2ab79974f499c43419c1dee9d0def03e43d67d2cf8a606cf2cc524a267dd840eca01da25304e2724da71ea5948093cb4b111923e58feec838a857c5f7ea2da7965'
              }
            }
          );
          
          if (response.ok) {
            const data = await response.json();
            if (data.data && data.data.length > 0) {
              setPacienteData(data.data[0]);
              setLoading(false);
              return;
            }
          }
        } catch (filterError) {
          console.error('Error with filter fetch:', filterError);
        }
        
        // No usamos el paciente de ejemplo, simplemente dejamos pacienteData como null
        setPacienteData(null);
        
      } catch (error) {
        console.error('Error fetching patient data:', error);
        setPacienteData(null);
      } finally {
        setLoading(false);
      }
    };
    
    fetchPacienteData();
  }, [user]);

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      timeZone: 'UTC',
    });
  };

  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.noUserText}>No hay información de usuario disponible</Text>
      </SafeAreaView>
    );
  }

  const windowHeight = Dimensions.get('window').height;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={[styles.scrollContent, { paddingBottom: windowHeight * 0.2 }]}>
        {/* Header */}
        <View style={styles.profileHeader}>
          <Avatar
            size={80}
            rounded
            icon={{ name: 'user', type: 'font-awesome' }}
            containerStyle={styles.avatar}
          />
          <Text style={styles.headerTitle}>
            {pacienteData ? `${pacienteData.nombre} ${pacienteData.apellidos}` : user.username}
          </Text>
          <Text style={styles.subText}>
            {pacienteData ? pacienteData.genero : user.Genero}
          </Text>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#FFF" />
            <Text style={styles.loadingText}>Cargando tu información médica...</Text>
          </View>
        ) : pacienteData ? (
          <>
            {/* Información personal */}
            <View style={styles.card}>
              <Text style={styles.title}>Tu información personal</Text>
              <Text style={styles.description}>Tus datos básicos de identificación</Text>
              <View style={styles.line} />
              <View style={styles.optionRow}>
                <Text style={styles.optionTitle}>Nombre completo:</Text>
                <Text style={styles.optionValue}>{pacienteData?.nombre} {pacienteData?.apellidos}</Text>
              </View>
              <View style={styles.optionRow}>
                <Text style={styles.optionTitle}>Fecha de nacimiento:</Text>
                <Text style={styles.optionValue}>{pacienteData?.fecha_nacimiento ? formatDate(pacienteData.fecha_nacimiento) : '-'}</Text>
              </View>
              <View style={styles.optionRow}>
                <Text style={styles.optionTitle}>Edad:</Text>
                <Text style={styles.optionValue}>{pacienteData?.edad} años</Text>
              </View>
              <View style={styles.optionRow}>
                <Text style={styles.optionTitle}>Género:</Text>
                <Text style={styles.optionValue}>{pacienteData?.genero}</Text>
              </View>
              <View style={styles.optionRow}>
                <Text style={styles.optionTitle}>CURP:</Text>
                <Text style={styles.optionValue}>{pacienteData?.curp}</Text>
              </View>
            </View>

            {/* Información de contacto */}
            <View style={styles.card}>
              <Text style={styles.title}>Tu información de contacto</Text>
              <Text style={styles.description}>Tus datos para mantenernos en comunicación</Text>
              <View style={styles.line} />
              <View style={styles.optionRow}>
                <Text style={styles.optionTitle}>Dirección:</Text>
                <Text style={styles.optionValue}>{pacienteData?.direccion}</Text>
              </View>
              <View style={styles.optionRow}>
                <Text style={styles.optionTitle}>Tu teléfono:</Text>
                <Text style={styles.optionValue}>{pacienteData?.telefono_contacto}</Text>
              </View>
              <View style={styles.optionRow}>
                <Text style={styles.optionTitle}>Contacto emergencia:</Text>
                <Text style={styles.optionValue}>{pacienteData?.contacto_emergencia}</Text>
              </View>
              <View style={styles.optionRow}>
                <Text style={styles.optionTitle}>Tu email:</Text>
                <Text style={styles.optionValue}>{pacienteData?.correo_electronico}</Text>
              </View>
            </View>

            {/* Información médica */}
            <View style={styles.card}>
              <Text style={styles.title}>Tu información médica</Text>
              <Text style={styles.description}>Información relevante sobre tu salud</Text>
              <View style={styles.line} />
              <View style={styles.optionRow}>
                <Text style={styles.optionTitle}>Tu tipo de sangre:</Text>
                <Text style={styles.optionValue}>{pacienteData?.tipo_sangre}</Text>
              </View>
              <View style={styles.optionRow}>
                <Text style={styles.optionTitle}>Tus alergias:</Text>
                <Text style={styles.optionValue}>{pacienteData?.alergias || 'Ninguna'}</Text>
              </View>
              <View style={styles.optionRow}>
                <Text style={styles.optionTitle}>Enfermedades crónicas:</Text>
                <Text style={styles.optionValue}>{pacienteData?.enfermedades_cronicas || 'Ninguna'}</Text>
              </View>
              <View style={styles.optionRow}>
                <Text style={styles.optionTitle}>Medicamentos actuales:</Text>
                <Text style={styles.optionValue}>{pacienteData?.medicamentos_actuales || 'Ninguno'}</Text>
              </View>
              <View style={styles.optionRow}>
                <Text style={styles.optionTitle}>Discapacidad:</Text>
                <Text style={styles.optionValue}>{pacienteData?.discapacidad || 'Ninguna'}</Text>
              </View>
            </View>

            {/* Antecedentes médicos */}
            <View style={styles.card}>
              <Text style={styles.title}>Tus antecedentes médicos</Text>
              <Text style={styles.description}>Tu historial médico relevante</Text>
              <View style={styles.line} />
              <View style={styles.optionRow}>
                <Text style={styles.optionTitle}>Antecedentes familiares:</Text>
                <Text style={styles.optionValue}>{pacienteData?.antecedentes_familiares || 'Ninguno'}</Text>
              </View>
              <View style={styles.optionRow}>
                <Text style={styles.optionTitle}>Intervenciones previas:</Text>
                <Text style={styles.optionValue}>{pacienteData?.intervenciones_previas || 'Ninguna'}</Text>
              </View>
              <View style={styles.optionRow}>
                <Text style={styles.optionTitle}>Tu última consulta:</Text>
                <Text style={styles.optionValue}>{pacienteData?.ultima_consulta ? formatDate(pacienteData.ultima_consulta) : '-'}</Text>
              </View>
            </View>

            {/* Información de servicio */}
            <View style={styles.card}>
              <Text style={styles.title}>Tus preferencias médicas</Text>
              <Text style={styles.description}>Información sobre tus preferencias de atención</Text>
              <View style={styles.line} />
              <View style={styles.optionRow}>
                <Text style={styles.optionTitle}>Hospital preferido:</Text>
                <Text style={styles.optionValue}>{pacienteData?.hospital_preferencia}</Text>
              </View>
              <View style={styles.optionRow}>
                <Text style={styles.optionTitle}>Tu médico de cabecera:</Text>
                <Text style={styles.optionValue}>{pacienteData?.medico_cabecera}</Text>
              </View>
            </View>
          </>
        ) : (
          <View style={styles.noDataContainer}>
            <Text style={styles.noDataText}>No se encontraron datos médicos asociados a tu cuenta</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212', // Fondo oscuro
    paddingHorizontal: 1,
    paddingTop: 30,
  },
  scrollContent: {
    paddingBottom: 50,
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  avatar: {
    backgroundColor: '#232329',
    marginBottom: 10,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
    textAlign: 'center',
    marginTop: 10,
  },
  subText: {
    fontSize: 16,
    color: '#B3B3B3',
    marginBottom: 8,
    textAlign: 'center',
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
    backgroundColor: '#1E1E1E', // Fondo de tarjeta oscuro
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: 'System',
  },
  description: {
    fontSize: 14,
    marginVertical: 10,
    color: '#B3B3B3',
    fontFamily: 'System',
  },
  line: {
    borderBottomWidth: 1,
    borderBottomColor: '#222', // Separador oscuro
    marginVertical: 6,
  },
  optionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  optionTitle: {
    flex: 1,
    fontSize: 16,
    color: '#B3B3B3', // Color texto secundario
    fontFamily: 'System',
  },
  optionValue: {
    flex: 1,
    fontSize: 16,
    color: '#FFFFFF', // Color texto principal
    fontFamily: 'System',
    textAlign: 'right',
  },
  noUserText: {
    fontSize: 18,
    color: '#FFFFFF',
    textAlign: 'center',
    marginTop: 40,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  loadingText: {
    color: '#FFFFFF',
    marginTop: 10,
    fontSize: 16,
  },
  noDataContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  noDataText: {
    color: '#FFFFFF',
    fontSize: 16,
  }
});
