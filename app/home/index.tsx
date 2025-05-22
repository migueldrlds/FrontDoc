import React, { useState, useEffect, useRef } from 'react';
import { useTheme } from '@/app/themecontext';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  Image,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  Platform,
  StatusBar,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Modal,
  Animated,
  Easing,
  Dimensions,
  TouchableWithoutFeedback,
  LayoutRectangle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import zonasData from './ZONAS/zonas.json';
import ejerciciosData from './ZONAS/ejercicios.json';
import entrenadoresData from './ZONAS/entrenadores.json';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import { useAuth } from '@/app/authContext';
import { Ionicons, FontAwesome5, MaterialIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';

interface Medico {
  id: number;
  nombre: string;
  apellidos: string;
  curp: string;
  correo_profesional: string;
  telefono: string;
  direccion_consultorio: string;
  foto_perfil: any[];
  cedula_profesional: string;
  matricula_sanitaria: string;
  especialidad: string;
  anios_experiencia: number;
  institucion_actual: string;
  user: {
    id: number;
  };
}

interface Consulta {
  id: number;
  documentId: string;
  fecha_consulta: string;
  diagnostico: string;
  receta: string;
  observaciones: string;
  estudios_recomendados: string;
  archivos_adjuntos: any[];
  motivo_consulta: string | null;
  tipo_consulta: string | null;
  createdAt: string;
  updatedAt: string;
  publishedAt: string;
  paciente: {
    id: number;
  };
  medico: Medico;
}

interface Estudio {
  id: number;
  tipo: string;
  fecha: string;
  resultado: string;
  paciente: {
    id: number;
  };
}

interface Vacuna {
  id: number;
  fecha: string;
  nombre: string;
  dosis: string;
  lote: string;
  via_administracion: string;
  sitio_aplicacion: string;
  observaciones: string;
  paciente: {
    id: number;
  };
}

interface QRAccess {
  id: number;
  fecha: string;
  confirmado: boolean;
  expirado: boolean;
  paciente: {
    id: number;
  };
  medico: Medico;
}

interface Paciente {
  id: number;
  nombre: string;
  apellidos: string;
  fecha_nacimiento: string;
  edad: number;
  genero: 'Masculino' | 'Femenino' | 'Otro';
  curp: string;
  direccion: string;
  telefono_contacto: string;
  contacto_emergencia: string;
  correo_electronico: string;
  foto: any[];
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
  acepta_compartir_datos: boolean;
  user: {
    id: number;
  };
  vacunas: Vacuna[];
  estudios: Estudio[];
  consultas: Consulta[];
  qraccesses: QRAccess[];
}

type IndexProps = {
  navigation: NavigationProp<any>;
};

export default function Index({ navigation }: IndexProps) {
  const { theme } = useTheme();
  const { user } = useAuth();
  const isDarkMode = theme === 'Oscuro';
  const [searchText, setSearchText] = useState('');
  const [filteredResults, setFilteredResults] = useState({
    zonas: zonasData.zonas,
    ejercicios: ejerciciosData,
    entrenadores: entrenadoresData.entrenadores
  });
  const [pacienteData, setPacienteData] = useState<Paciente | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedSection, setSelectedSection] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [pressPosition, setPressPosition] = useState({ x: 0, y: 0 });
  const [cardLayout, setCardLayout] = useState<LayoutRectangle | null>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const contentFadeAnim = useRef(new Animated.Value(0)).current;
  const fadeInText = useRef(new Animated.Value(0)).current;
  const fadeInCards = useRef(new Animated.Value(0)).current;
  const fadeInLargeCard = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    navigation.setOptions({
      headerShown: false,
    });
  }, [navigation]);

  const handleSearch = (text: string) => {
    setSearchText(text);
    const searchLower = text.toLowerCase();

    if (text === '') {
      setFilteredResults({
        zonas: zonasData.zonas,
        ejercicios: ejerciciosData,
        entrenadores: entrenadoresData.entrenadores
      });
    } else {
      const filteredZonas = zonasData.zonas.filter(
        (zona) =>
          zona.nombre.toLowerCase().includes(searchLower) ||
          zona.descripcion.toLowerCase().includes(searchLower)
      );

      const filteredEjercicios = ejerciciosData.filter(
        (ejercicio) =>
          ejercicio.nombre.toLowerCase().includes(searchLower) ||
          ejercicio.descripcion.toLowerCase().includes(searchLower) ||
          ejercicio.duracion.toLowerCase().includes(searchLower)
      );

      const filteredEntrenadores = entrenadoresData.entrenadores.filter(
        (entrenador) =>
          entrenador.nombre.toLowerCase().includes(searchLower) ||
          entrenador.descripcion.toLowerCase().includes(searchLower) ||
          entrenador.especialidad.toLowerCase().includes(searchLower)
      );

      setFilteredResults({
        zonas: filteredZonas,
        ejercicios: filteredEjercicios,
        entrenadores: filteredEntrenadores
      });
    }
  };

  const handleEntrenadoresPress = () => {
    navigation.navigate('Entrenadores');  
  };

  const handlePDCortesiaPress = () => {
    navigation.navigate('PaseDeCortesia');
  };

  const fetchPacienteData = async () => {
    try {
      setLoading(true);
      
      if (!user?.id) {
        console.log('No hay usuario logueado');
        setLoading(false);
        setRefreshing(false);
        return;
      }
      
      // URL simplificada para obtener las consultas con la información del médico
      const response = await fetch(
        `http://201.171.25.219:1338/api/pacientes?populate[consultas][populate]=medico`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer be7b67deaedba33f7faaa655fcc119def81e8bb2f83136e7b67036f1d81af15368f9d40f0bb2819f3c9a2d4fc48b8f4643f5202d4c8fdb1603c133d0486dbe2ab79974f499c43419c1dee9d0def03e43d67d2cf8a606cf2cc524a267dd840eca01da25304e2724da71ea5948093cb4b111923e58feec838a857c5f7ea2da7965'
          }
        }
      );
      
      console.log('API response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('API data received:', JSON.stringify(data).slice(0, 300) + '...');
        
        if (data.data && data.data.length > 0) {
          // Filtramos el paciente por usuario si es necesario
          let pacienteFiltered = data.data[0];
          if (user?.id) {
            pacienteFiltered = data.data.find((p: any) => p.user && p.user.id === user.id) || data.data[0];
          }
          
          setPacienteData(pacienteFiltered);
          console.log('Patient data set:', pacienteFiltered.nombre);
          
          // Registra datos de la consulta para depuración
          if (pacienteFiltered.consultas && pacienteFiltered.consultas.length > 0) {
            const lastConsult = pacienteFiltered.consultas[pacienteFiltered.consultas.length - 1];
            console.log('Última consulta ID:', lastConsult.id);
            console.log('Fecha consulta:', lastConsult.fecha_consulta);
            console.log('Médico de la última consulta:', JSON.stringify(lastConsult.medico));
          }
        } else {
          console.log('No se encontró paciente para este usuario');
          setPacienteData(null);
        }
      } else {
        const errorData = await response.json();
        console.error('API response error:', response.status, errorData);
      }
    } catch (error) {
      console.error('Error fetching patient data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchPacienteData();
  }, [user]);

  useEffect(() => {
    const animateSequence = () => {
      Animated.sequence([
        // Animar el texto de bienvenida
        Animated.timing(fadeInText, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
          easing: Easing.bezier(0.4, 0, 0.2, 1),
        }),
        // Animar las tarjetas
        Animated.parallel([
          Animated.timing(fadeInCards, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
            easing: Easing.bezier(0.4, 0, 0.2, 1),
          }),
          Animated.timing(translateY, {
            toValue: 0,
            duration: 600,
            useNativeDriver: true,
            easing: Easing.bezier(0.4, 0, 0.2, 1),
          }),
        ]),
        // Animar la tarjeta grande
        Animated.timing(fadeInLargeCard, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
          easing: Easing.bezier(0.4, 0, 0.2, 1),
        }),
      ]).start();
    };

    animateSequence();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchPacienteData();
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const capitalizeFirstLetter = (text: string | undefined | null): string => {
    if (!text || typeof text !== 'string') return '';
    return text.charAt(0).toUpperCase() + text.slice(1);
  };

  const handleConsultasPress = () => {
    navigation.navigate('Consultas', { paciente: pacienteData });
  };

  const handleEstudiosPress = () => {
    navigation.navigate('Estudios', { paciente: pacienteData });
  };

  const handlePerfilMedicoPress = () => {
    navigation.navigate('subsettings/profile');
  };

  const animateModal = (visible: boolean) => {
    if (visible) {
      setModalVisible(true);
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          easing: Easing.bezier(0.4, 0, 0.2, 1),
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 300,
          easing: Easing.bezier(0.4, 0, 0.2, 1),
          useNativeDriver: true,
        }),
        Animated.timing(contentFadeAnim, {
          toValue: 1,
          duration: 200,
          delay: 100,
          useNativeDriver: true,
        })
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          easing: Easing.bezier(0.4, 0, 0.2, 1),
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.8,
          duration: 200,
          easing: Easing.bezier(0.4, 0, 0.2, 1),
          useNativeDriver: true,
        }),
        Animated.timing(contentFadeAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        })
      ]).start(() => {
        setModalVisible(false);
        setSelectedSection(null);
      });
    }
  };

  const handleCardPress = (section: string, layout: LayoutRectangle) => {
    setSelectedSection(section);
    setCardLayout(layout);
    animateModal(true);
  };

  const closeModal = () => {
    animateModal(false);
  };

  const renderModalContent = () => {
    switch (selectedSection) {
      case 'ultima_consulta':
        return (
          <View style={styles.modalContent}>
            <View style={[styles.expedienteHeader, {
              borderBottomColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
            }]}>
              <View style={styles.expedienteHeaderTop}>
                <View style={[styles.expedienteLogo, {
                  backgroundColor: isDarkMode ? 'rgba(66, 153, 225, 0.15)' : 'rgba(43, 108, 176, 0.1)'
                }]}>
                  <FontAwesome5 name="file-medical-alt" size={24} color={isDarkMode ? "#4299e1" : "#2b6cb0"} />
                </View>
                <View style={styles.expedienteTitle}>
                  <Text style={[styles.modalTitle, { 
                    color: isDarkMode ? '#FFFFFF' : '#000000',
                    textAlign: 'left',
                    marginBottom: 4
                  }]}>
                    Expediente Médico
                  </Text>
                  <Text style={[styles.expedienteSubtitle, {
                    color: isDarkMode ? '#A0AEC0' : '#718096'
                  }]}>
                    CONSULTA MÉDICA #{pacienteData?.consultas[pacienteData.consultas.length - 1].documentId?.slice(0,8).toUpperCase() || ''}
                  </Text>
                </View>
              </View>

              <View style={[styles.expedienteBadge, {
                backgroundColor: isDarkMode ? 'rgba(66, 153, 225, 0.15)' : 'rgba(43, 108, 176, 0.1)'
              }]}>
                <Text style={[styles.expedienteBadgeText, {
                  color: isDarkMode ? '#4299E1' : '#2B6CB0'
                }]}>
                  {pacienteData?.consultas && pacienteData.consultas.length > 0 ? 
                    formatDate(pacienteData.consultas[pacienteData.consultas.length - 1].fecha_consulta) : ''}
                </Text>
              </View>
            </View>

            {pacienteData?.consultas && pacienteData.consultas.length > 0 && (
              <View>
                <View style={[styles.expedienteSection, {
                  borderBottomColor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'
                }]}>
                  <View style={[styles.expedienteSectionHeader, {
                    borderBottomColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
                  }]}>
                    <FontAwesome5 name="user-md" size={16} color={isDarkMode ? "#4299e1" : "#2b6cb0"} />
                    <Text style={[styles.expedienteSectionTitle, {
                      color: isDarkMode ? '#E2E8F0' : '#2D3748'
                    }]}>Información del médico</Text>
                  </View>
                  <View style={styles.expedienteSectionContent}>
                    <View style={[styles.expedienteRow, {
                      borderBottomColor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)'
                    }]}>
                      <Text style={[styles.expedienteLabel, {
                        color: isDarkMode ? '#A0AEC0' : '#718096'
                      }]}>Médico tratante</Text>
                      <Text style={[styles.expedienteValue, {
                        color: isDarkMode ? '#FFFFFF' : '#2D3748'
                      }]}>
                        {(() => {
                          const ultimaConsulta = pacienteData.consultas[pacienteData.consultas.length - 1];
                          return ultimaConsulta.medico && 
                            typeof ultimaConsulta.medico === 'object' && 
                            ultimaConsulta.medico.nombre ? 
                            `Dr. ${capitalizeFirstLetter(ultimaConsulta.medico.nombre)} ${capitalizeFirstLetter(ultimaConsulta.medico.apellidos || '')}` :
                            'Médico no especificado';
                        })()}
                      </Text>
                    </View>
                    <View style={[styles.expedienteRow, {
                      borderBottomColor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)'
                    }]}>
                      <Text style={[styles.expedienteLabel, {
                        color: isDarkMode ? '#A0AEC0' : '#718096'
                      }]}>Especialidad</Text>
                      <Text style={[styles.expedienteValue, {
                        color: isDarkMode ? '#FFFFFF' : '#2D3748'
                      }]}>
                        {capitalizeFirstLetter(pacienteData.consultas[pacienteData.consultas.length - 1].medico?.especialidad || 'No especificada')}
                      </Text>
                    </View>
                    <View style={[styles.expedienteRow, {
                      borderBottomColor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)'
                    }]}>
                      <Text style={[styles.expedienteLabel, {
                        color: isDarkMode ? '#A0AEC0' : '#718096'
                      }]}>Cédula profesional</Text>
                      <Text style={[styles.expedienteValue, {
                        color: isDarkMode ? '#FFFFFF' : '#2D3748'
                      }]}>
                        {pacienteData.consultas[pacienteData.consultas.length - 1].medico?.cedula_profesional || 'No registrada'}
                      </Text>
                    </View>
                  </View>
                </View>
                
                <View style={[styles.expedienteSection, {
                  borderBottomColor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'
                }]}>
                  <View style={[styles.expedienteSectionHeader, {
                    borderBottomColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
                  }]}>
                    <FontAwesome5 name="clipboard-list" size={16} color={isDarkMode ? "#4299e1" : "#2b6cb0"} />
                    <Text style={[styles.expedienteSectionTitle, {
                      color: isDarkMode ? '#E2E8F0' : '#2D3748'
                    }]}>Detalles de la consulta</Text>
                  </View>
                  <View style={styles.expedienteSectionContent}>
                    <View style={[styles.expedienteRow, {
                      borderBottomColor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)'
                    }]}>
                      <Text style={[styles.expedienteLabel, {
                        color: isDarkMode ? '#A0AEC0' : '#718096'
                      }]}>Tipo de consulta</Text>
                      <Text style={[styles.expedienteValue, {
                        color: isDarkMode ? '#FFFFFF' : '#2D3748'
                      }]}>
                        {capitalizeFirstLetter(pacienteData.consultas[pacienteData.consultas.length - 1].tipo_consulta || 'Consulta regular')}
                      </Text>
                    </View>

                    {pacienteData.consultas[pacienteData.consultas.length - 1].motivo_consulta && (
                      <View style={[styles.expedienteRow, {
                        borderBottomColor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)'
                      }]}>
                        <Text style={[styles.expedienteLabel, {
                          color: isDarkMode ? '#A0AEC0' : '#718096'
                        }]}>Motivo</Text>
                        <Text style={[styles.expedienteValue, {
                          color: isDarkMode ? '#FFFFFF' : '#2D3748'
                        }]}>
                          {capitalizeFirstLetter(pacienteData.consultas[pacienteData.consultas.length - 1].motivo_consulta)}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>

                <View style={[styles.expedienteSection, {
                  borderBottomColor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'
                }]}>
                  <View style={[styles.expedienteSectionHeader, {
                    borderBottomColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
                  }]}>
                    <FontAwesome5 name="heartbeat" size={16} color={isDarkMode ? "#4299e1" : "#2b6cb0"} />
                    <Text style={[styles.expedienteSectionTitle, {
                      color: isDarkMode ? '#E2E8F0' : '#2D3748'
                    }]}>Diagnóstico clínico</Text>
                  </View>
                  <View style={styles.expedienteSectionContent}>
                    <View style={[styles.expedienteDiagnosisBox, {
                      backgroundColor: isDarkMode ? 'rgba(66, 153, 225, 0.08)' : 'rgba(43, 108, 176, 0.05)',
                      borderLeftColor: isDarkMode ? '#4299E1' : '#2B6CB0'
                    }]}>
                      <Text style={[styles.expedienteDiagnosisText, {
                        color: isDarkMode ? '#E2E8F0' : '#2D3748'
                      }]}>
                        {capitalizeFirstLetter(pacienteData.consultas[pacienteData.consultas.length - 1].diagnostico)}
                      </Text>
                    </View>
                  </View>
                </View>

                <View style={[styles.expedienteSection, {
                  borderBottomColor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'
                }]}>
                  <View style={[styles.expedienteSectionHeader, {
                    borderBottomColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
                  }]}>
                    <FontAwesome5 name="prescription-bottle-alt" size={16} color={isDarkMode ? "#4299e1" : "#2b6cb0"} />
                    <Text style={[styles.expedienteSectionTitle, {
                      color: isDarkMode ? '#E2E8F0' : '#2D3748'
                    }]}>Receta médica</Text>
                  </View>
                  <View style={styles.expedienteSectionContent}>
                    <View style={[styles.expedienteTextBox, {
                      backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)'
                    }]}>
                      <Text style={[styles.expedienteTextContent, {
                        color: isDarkMode ? '#E2E8F0' : '#2D3748'
                      }]}>
                        {capitalizeFirstLetter(pacienteData.consultas[pacienteData.consultas.length - 1].receta || 'No se emitió receta médica')}
                      </Text>
                    </View>
                  </View>
                </View>

                <View style={[styles.expedienteSection, {
                  borderBottomColor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'
                }]}>
                  <View style={[styles.expedienteSectionHeader, {
                    borderBottomColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
                  }]}>
                    <FontAwesome5 name="notes-medical" size={16} color={isDarkMode ? "#4299e1" : "#2b6cb0"} />
                    <Text style={[styles.expedienteSectionTitle, {
                      color: isDarkMode ? '#E2E8F0' : '#2D3748'
                    }]}>Observaciones</Text>
                  </View>
                  <View style={styles.expedienteSectionContent}>
                    <View style={[styles.expedienteTextBox, {
                      backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)'
                    }]}>
                      <Text style={[styles.expedienteTextContent, {
                        color: isDarkMode ? '#E2E8F0' : '#2D3748'
                      }]}>
                        {capitalizeFirstLetter(pacienteData.consultas[pacienteData.consultas.length - 1].observaciones || 'No hay observaciones adicionales')}
                      </Text>
                    </View>
                  </View>
                </View>

                <View style={[styles.expedienteSection, {
                  borderBottomColor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'
                }]}>
                  <View style={[styles.expedienteSectionHeader, {
                    borderBottomColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
                  }]}>
                    <FontAwesome5 name="vial" size={16} color={isDarkMode ? "#4299e1" : "#2b6cb0"} />
                    <Text style={[styles.expedienteSectionTitle, {
                      color: isDarkMode ? '#E2E8F0' : '#2D3748'
                    }]}>Estudios recomendados</Text>
                  </View>
                  <View style={styles.expedienteSectionContent}>
                    <View style={[styles.expedienteTextBox, {
                      backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)'
                    }]}>
                      <Text style={[styles.expedienteTextContent, {
                        color: isDarkMode ? '#E2E8F0' : '#2D3748'
                      }]}>
                        {capitalizeFirstLetter(pacienteData.consultas[pacienteData.consultas.length - 1].estudios_recomendados || 'No se recomendaron estudios')}
                      </Text>
                    </View>
                  </View>
                </View>

                <View style={[styles.expedienteSection, { 
                  borderBottomWidth: 0, 
                  marginBottom: 20,
                  borderBottomColor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'
                }]}>
                  <View style={[styles.expedienteSectionHeader, {
                    borderBottomColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
                  }]}>
                    <FontAwesome5 name="paperclip" size={16} color={isDarkMode ? "#4299e1" : "#2b6cb0"} />
                    <Text style={[styles.expedienteSectionTitle, {
                      color: isDarkMode ? '#E2E8F0' : '#2D3748'
                    }]}>Archivos adjuntos</Text>
                  </View>
                  <View style={styles.expedienteSectionContent}>
                    {pacienteData.consultas[pacienteData.consultas.length - 1].archivos_adjuntos && 
                    pacienteData.consultas[pacienteData.consultas.length - 1].archivos_adjuntos.length > 0 ? (
                      pacienteData.consultas[pacienteData.consultas.length - 1].archivos_adjuntos.map((archivo, index) => (
                        <View key={index} style={[styles.expedienteAttachment, {
                          backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)'
                        }]}>
                          <FontAwesome5 name="file-medical" size={14} color={isDarkMode ? "#4299e1" : "#2b6cb0"} />
                          <Text style={[styles.expedienteAttachmentText, {
                            color: isDarkMode ? '#E2E8F0' : '#2D3748'
                          }]}>
                            {archivo.name || `Archivo adjunto ${index + 1}`}
                          </Text>
                        </View>
                      ))
                    ) : (
                      <Text style={[styles.expedienteTextContent, {
                        color: isDarkMode ? '#E2E8F0' : '#2D3748'
                      }]}>
                        No hay archivos adjuntos
                      </Text>
                    )}
                  </View>
                </View>
              </View>
            )}
          </View>
        );
      case 'personal':
        return (
          <View style={styles.modalContent}>
            <View style={[styles.expedienteHeader, {
              borderBottomColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
            }]}>  
              <View style={styles.expedienteHeaderTop}>
                <View style={[styles.expedienteLogo, {
                  backgroundColor: isDarkMode ? 'rgba(66, 153, 225, 0.15)' : 'rgba(43, 108, 176, 0.1)'
                }]}>  
                  <FontAwesome5 name="user-md" size={24} color={isDarkMode ? "#4299e1" : "#2b6cb0"} />
                </View>
                <View style={styles.expedienteTitle}>
                  <Text style={[styles.modalTitle, { 
                    color: isDarkMode ? '#FFFFFF' : '#000000',
                    textAlign: 'left',
                    marginBottom: 4
                  }]}>Información Personal</Text>
                  <Text style={[styles.expedienteSubtitle, {
                    color: isDarkMode ? '#A0AEC0' : '#718096'
                  }]}>Datos generales del paciente</Text>
                </View>
              </View>
            </View>
            {pacienteData ? (
              <View>
                <View style={[styles.expedienteSection, {
                  borderBottomColor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'
                }]}>  
                  <View style={[styles.expedienteSectionHeader, {
                    borderBottomColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
                  }]}>  
                    <FontAwesome5 name="id-card" size={16} color={isDarkMode ? "#4299e1" : "#2b6cb0"} />
                    <Text style={[styles.expedienteSectionTitle, {
                      color: isDarkMode ? '#E2E8F0' : '#2D3748'
                    }]}>Datos generales</Text>
                  </View>
                  <View style={styles.expedienteSectionContent}>
                    <View style={styles.expedienteRow}>
                      <Text style={[styles.expedienteLabel, { color: isDarkMode ? '#A0AEC0' : '#718096' }]}>Nombre</Text>
                      <Text style={[styles.expedienteValue, { color: isDarkMode ? '#FFFFFF' : '#2D3748' }]}>{capitalizeFirstLetter(pacienteData.nombre)} {capitalizeFirstLetter(pacienteData.apellidos)}</Text>
                    </View>
                    <View style={styles.expedienteRow}>
                      <Text style={[styles.expedienteLabel, { color: isDarkMode ? '#A0AEC0' : '#718096' }]}>Edad</Text>
                      <Text style={[styles.expedienteValue, { color: isDarkMode ? '#FFFFFF' : '#2D3748' }]}>{pacienteData.edad} años</Text>
                    </View>
                    <View style={styles.expedienteRow}>
                      <Text style={[styles.expedienteLabel, { color: isDarkMode ? '#A0AEC0' : '#718096' }]}>Género</Text>
                      <Text style={[styles.expedienteValue, { color: isDarkMode ? '#FFFFFF' : '#2D3748' }]}>{capitalizeFirstLetter(pacienteData.genero)}</Text>
                    </View>
                  </View>
                </View>
                <View style={[styles.expedienteSection, {
                  borderBottomColor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'
                }]}>  
                  <View style={[styles.expedienteSectionHeader, {
                    borderBottomColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
                  }]}>  
                    <FontAwesome5 name="address-card" size={16} color={isDarkMode ? "#4299e1" : "#2b6cb0"} />
                    <Text style={[styles.expedienteSectionTitle, {
                      color: isDarkMode ? '#E2E8F0' : '#2D3748'
                    }]}>Identificación</Text>
                  </View>
                  <View style={styles.expedienteSectionContent}>
                    <View style={styles.expedienteRow}>
                      <Text style={[styles.expedienteLabel, { color: isDarkMode ? '#A0AEC0' : '#718096' }]}>CURP</Text>
                      <Text style={[styles.expedienteValue, { color: isDarkMode ? '#FFFFFF' : '#2D3748' }]}>{pacienteData.curp}</Text>
                    </View>
                    <View style={styles.expedienteRow}>
                      <Text style={[styles.expedienteLabel, { color: isDarkMode ? '#A0AEC0' : '#718096' }]}>Tipo de sangre</Text>
                      <Text style={[styles.expedienteValue, { color: isDarkMode ? '#FFFFFF' : '#2D3748' }]}>{pacienteData.tipo_sangre}</Text>
                    </View>
                  </View>
                </View>
                <View style={[styles.expedienteSection, { borderBottomWidth: 0, marginBottom: 0 }]}>  
                  <View style={[styles.expedienteSectionHeader, {
                    borderBottomColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
                  }]}>  
                    <FontAwesome5 name="share-alt" size={16} color={isDarkMode ? "#4299e1" : "#2b6cb0"} />
                    <Text style={[styles.expedienteSectionTitle, {
                      color: isDarkMode ? '#E2E8F0' : '#2D3748'
                    }]}>Privacidad</Text>
                  </View>
                  <View style={styles.expedienteSectionContent}>
                    <View style={styles.expedienteRow}>
                      <Text style={[styles.expedienteLabel, { color: isDarkMode ? '#A0AEC0' : '#718096' }]}>Compartir datos</Text>
                      <Text style={[styles.expedienteValue, { color: isDarkMode ? '#FFFFFF' : '#2D3748' }]}>{pacienteData.acepta_compartir_datos ? 'Sí' : 'No'}</Text>
                    </View>
                  </View>
                </View>
              </View>
            ) : null}
          </View>
        );
      case 'contacto':
        return (
          <View style={styles.modalContent}>
            <Text style={[styles.modalTitle, { color: isDarkMode ? '#FFFFFF' : '#000000' }]}>
              Información de Contacto
            </Text>
            {pacienteData && (
              <View style={styles.dataContainer}>
                <View style={[styles.dataRow, { borderBottomColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)' }]}>
                  <Text style={[styles.dataLabel, { color: isDarkMode ? '#B3B3B3' : '#666666' }]}>Teléfono</Text>
                  <Text style={[styles.dataValue, { color: isDarkMode ? '#FFFFFF' : '#000000' }]}>
                    {pacienteData.telefono_contacto}
                  </Text>
                </View>
                <View style={[styles.dataRow, { borderBottomColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)' }]}>
                  <Text style={[styles.dataLabel, { color: isDarkMode ? '#B3B3B3' : '#666666' }]}>Email</Text>
                  <Text style={[styles.dataValue, { color: isDarkMode ? '#FFFFFF' : '#000000' }]}>
                    {pacienteData.correo_electronico}
                  </Text>
                </View>
                <View style={[styles.dataRow, { borderBottomColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)' }]}>
                  <Text style={[styles.dataLabel, { color: isDarkMode ? '#B3B3B3' : '#666666' }]}>Dirección</Text>
                  <Text style={[styles.dataValue, { color: isDarkMode ? '#FFFFFF' : '#000000' }]}>
                    {pacienteData.direccion}
                  </Text>
                </View>
                <View style={[styles.dataRow, { borderBottomColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)' }]}>
                  <Text style={[styles.dataLabel, { color: isDarkMode ? '#B3B3B3' : '#666666' }]}>Contacto emergencia</Text>
                  <Text style={[styles.dataValue, { color: isDarkMode ? '#FFFFFF' : '#000000' }]}>
                    {pacienteData.contacto_emergencia}
                  </Text>
                </View>
            </View>
          )}
          </View>
        );
      case 'medico':
        return (
          <View style={styles.modalContent}>
            <Text style={[styles.modalTitle, { color: isDarkMode ? '#FFFFFF' : '#000000' }]}>
              Historial Médico
              </Text>
            {pacienteData && (
              <View style={styles.dataContainer}>
                <View style={[styles.dataRow, { borderBottomColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)' }]}>
                  <Text style={[styles.dataLabel, { color: isDarkMode ? '#B3B3B3' : '#666666' }]}>Alergias</Text>
                  <Text style={[styles.dataValue, { color: isDarkMode ? '#FFFFFF' : '#000000' }]}>
                    {capitalizeFirstLetter(pacienteData.alergias) || 'No especificado'}
                      </Text>
                </View>
                <View style={[styles.dataRow, { borderBottomColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)' }]}>
                  <Text style={[styles.dataLabel, { color: isDarkMode ? '#B3B3B3' : '#666666' }]}>Enfermedades crónicas</Text>
                  <Text style={[styles.dataValue, { color: isDarkMode ? '#FFFFFF' : '#000000' }]}>
                    {capitalizeFirstLetter(pacienteData.enfermedades_cronicas) || 'No especificado'}
                  </Text>
                </View>
                <View style={[styles.dataRow, { borderBottomColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)' }]}>
                  <Text style={[styles.dataLabel, { color: isDarkMode ? '#B3B3B3' : '#666666' }]}>Medicamentos</Text>
                  <Text style={[styles.dataValue, { color: isDarkMode ? '#FFFFFF' : '#000000' }]}>
                    {capitalizeFirstLetter(pacienteData.medicamentos_actuales) || 'No especificado'}
                  </Text>
                </View>
                <View style={[styles.dataRow, { borderBottomColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)' }]}>
                  <Text style={[styles.dataLabel, { color: isDarkMode ? '#B3B3B3' : '#666666' }]}>Discapacidad</Text>
                  <Text style={[styles.dataValue, { color: isDarkMode ? '#FFFFFF' : '#000000' }]}>
                    {capitalizeFirstLetter(pacienteData.discapacidad) || 'No especificado'}
                  </Text>
                </View>
                <View style={[styles.dataRow, { borderBottomColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)' }]}>
                  <Text style={[styles.dataLabel, { color: isDarkMode ? '#B3B3B3' : '#666666' }]}>Intervenciones previas</Text>
                  <Text style={[styles.dataValue, { color: isDarkMode ? '#FFFFFF' : '#000000' }]}>
                    {capitalizeFirstLetter(pacienteData.intervenciones_previas) || 'No especificado'}
                  </Text>
                </View>
                <View style={[styles.dataRow, { borderBottomColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)' }]}>
                  <Text style={[styles.dataLabel, { color: isDarkMode ? '#B3B3B3' : '#666666' }]}>Antecedentes familiares</Text>
                  <Text style={[styles.dataValue, { color: isDarkMode ? '#FFFFFF' : '#000000' }]}>
                    {capitalizeFirstLetter(pacienteData.antecedentes_familiares) || 'No especificado'}
                  </Text>
                </View>
                <View style={[styles.dataRow, { borderBottomColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)' }]}>
                  <Text style={[styles.dataLabel, { color: isDarkMode ? '#B3B3B3' : '#666666' }]}>Última consulta</Text>
                  <Text style={[styles.dataValue, { color: isDarkMode ? '#FFFFFF' : '#000000' }]}>
                    {pacienteData.ultima_consulta ? formatDate(pacienteData.ultima_consulta) : 'No disponible'}
                  </Text>
                </View>
            </View>
          )}
          </View>
        );
      case 'preferencias':
        return (
          <View style={styles.modalContent}>
            <Text style={[styles.modalTitle, { color: isDarkMode ? '#FFFFFF' : '#000000' }]}>
              Preferencias Médicas
            </Text>
            {pacienteData && (
              <View style={styles.dataContainer}>
                <View style={[styles.dataRow, { borderBottomColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)' }]}>
                  <Text style={[styles.dataLabel, { color: isDarkMode ? '#B3B3B3' : '#666666' }]}>Médico de cabecera</Text>
                  <Text style={[styles.dataValue, { color: isDarkMode ? '#FFFFFF' : '#000000' }]}>
                    Dr. {capitalizeFirstLetter(pacienteData.medico_cabecera)}
                  </Text>
                </View>
                <View style={[styles.dataRow, { borderBottomColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)' }]}>
                  <Text style={[styles.dataLabel, { color: isDarkMode ? '#B3B3B3' : '#666666' }]}>Hospital de preferencia</Text>
                  <Text style={[styles.dataValue, { color: isDarkMode ? '#FFFFFF' : '#000000' }]}>
                    {capitalizeFirstLetter(pacienteData.hospital_preferencia)}
                  </Text>
                </View>
              </View>
            )}
          </View>
        );
      default:
        return null;
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) {
      return "¡Buenos días";
    } else if (hour >= 12 && hour < 19) {
      return "¡Buenas tardes";
    } else {
      return "¡Buenas noches";
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: isDarkMode ? '#121212' : '#ffffff' }]}>
        <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={isDarkMode ? "#FFFFFF" : "#2D3748"} />
          <Text style={[styles.loadingText, { color: isDarkMode ? '#FFFFFF' : '#2D3748' }]}>
            Cargando tu información médica...
              </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDarkMode ? '#121212' : '#ffffff' }]}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
              <ScrollView 
        style={styles.scrollView}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#2D3748"]}
            tintColor={isDarkMode ? "#FFFFFF" : "#2D3748"}
          />
        }
      >
        <Animated.View style={[
          styles.welcomeContainer,
          {
            opacity: fadeInText,
          }
        ]}>
          <Text style={[styles.welcomeText, { color: isDarkMode ? '#FFFFFF' : '#000000' }]}>
            {getGreeting()}!
          </Text>
          <Text style={[styles.nameText, { color: isDarkMode ? '#FFFFFF' : '#000000' }]}>
            {pacienteData ? `${capitalizeFirstLetter(pacienteData.nombre)}` : user?.username ? capitalizeFirstLetter(user.username) : ''}
          </Text>
        </Animated.View>

        <View style={styles.contentContainer}>
          {pacienteData?.consultas && pacienteData.consultas.length > 0 && (
            <Animated.View style={{ opacity: fadeInLargeCard }}>
              <Text style={[styles.sectionTitle, { 
                color: isDarkMode ? '#FFFFFF' : '#2D3748', 
                marginBottom: 8,
                marginTop: 0,
                marginLeft: 4,
                fontSize: 24,
                fontWeight: '600',
                textAlign: 'left',
                paddingBottom: 0,
                borderBottomWidth: 0
              }]}>
                Última Consulta
              </Text>
                  <TouchableOpacity
                style={[styles.largeCard, { 
                  backgroundColor: '#2C5282',
                  padding: 0,
                  overflow: 'hidden'
                }]}
                onPress={(event) => {
                  event.currentTarget.measure((x, y, width, height, pageX, pageY) => {
                    handleCardPress('ultima_consulta', { x: pageX, y: pageY, width, height });
                  });
                }}
              >
                <View style={{
                  flexDirection: 'row',
                  borderLeftWidth: 6,
                  borderLeftColor: '#1A365D',
                }}>
                  <View style={[styles.largeCardContent, {
                    padding: 16,
                    paddingLeft: 14
                  }]}>
                    <Text style={[styles.lastConsultDate, { 
                      color: '#FFFFFF', 
                      opacity: 0.85,
                      fontSize: 14,
                      marginBottom: 10,
                      backgroundColor: 'rgba(0,0,0,0.15)',
                      paddingHorizontal: 10,
                      paddingVertical: 4,
                      borderRadius: 12,
                      alignSelf: 'flex-start'
                    }]}>
                      {formatDate(pacienteData.consultas[pacienteData.consultas.length - 1].fecha_consulta)}
                      </Text>
                    
                    <Text style={[styles.lastConsultDiagnosis, { 
                      color: '#FFFFFF', 
                      opacity: 1, 
                      fontSize: 18, 
                      fontWeight: '600', 
                      marginBottom: 12,
                      letterSpacing: 0.2
                    }]}>
                      {capitalizeFirstLetter(pacienteData.consultas[pacienteData.consultas.length - 1].diagnostico)}
              </Text>
                    
                    <View style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      marginTop: 6,
                      backgroundColor: 'rgba(0,0,0,0.12)',
                      paddingHorizontal: 10,
                      paddingVertical: 8,
                      borderRadius: 8
                    }}>
                      <FontAwesome5 name="user-md" size={14} color="#FFFFFF" style={{marginRight: 6}} />
        <View>
                        <Text style={[styles.lastConsultDoctor, { 
                          color: '#FFFFFF', 
                          opacity: 0.95,
                          fontSize: 15,
                          fontWeight: '500'
                        }]}>
                          {(() => {
                            const ultimaConsulta = pacienteData.consultas[pacienteData.consultas.length - 1];
                            return ultimaConsulta.medico && 
                              typeof ultimaConsulta.medico === 'object' && 
                              ultimaConsulta.medico.nombre ? 
                              `Dr. ${capitalizeFirstLetter(ultimaConsulta.medico.nombre)} ${capitalizeFirstLetter(ultimaConsulta.medico.apellidos || '')}` :
                              'Médico no especificado';
                          })()}
          </Text>
                        <Text style={[styles.lastConsultSpecialty, { 
                          color: '#FFFFFF', 
                          opacity: 0.85,
                          fontSize: 13,
                          marginTop: 1,
                          fontStyle: 'italic' 
                        }]}>
                          {capitalizeFirstLetter(pacienteData.consultas[pacienteData.consultas.length - 1].medico?.especialidad || 'Especialidad no especificada')}
                  </Text>
                      </View>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            </Animated.View>
          )}

          <Animated.View style={[
            styles.cardsGrid,
            {
              opacity: fadeInCards,
              transform: [{ translateY }]
            }
          ]}>
            <View style={styles.cardRow}>
              <TouchableOpacity
                style={[styles.simpleCard, { backgroundColor: '#2D3748' }]}
                onPress={(event) => {
                  event.currentTarget.measure((x, y, width, height, pageX, pageY) => {
                    handleCardPress('personal', { x: pageX, y: pageY, width, height });
                  });
                }}
              >
                <View style={styles.simpleCardContent}>
                  <FontAwesome5 name="user-md" size={28} color="#FFFFFF" />
                  <Text style={[styles.simpleCardTitle, { color: '#FFFFFF' }]}>Información Personal</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.simpleCard, { 
                  backgroundColor: '#FFFFFF',
                  borderWidth: 1,
                  borderColor: 'rgba(45, 55, 72, 0.2)'
                }]}
                onPress={(event) => {
                  event.currentTarget.measure((x, y, width, height, pageX, pageY) => {
                    handleCardPress('contacto', { x: pageX, y: pageY, width, height });
                  });
                }}
              >
                <View style={styles.simpleCardContent}>
                  <Ionicons name="call" size={28} color="#2D3748" />
                  <Text style={[styles.simpleCardTitle, { color: '#2D3748' }]}>Contacto</Text>
                </View>
              </TouchableOpacity>
            </View>

            <View style={styles.cardRow}>
              <TouchableOpacity
                style={[styles.simpleCard, { backgroundColor: '#4A5568' }]}
                onPress={(event) => {
                  event.currentTarget.measure((x, y, width, height, pageX, pageY) => {
                    handleCardPress('medico', { x: pageX, y: pageY, width, height });
                  });
                }}
              >
                <View style={styles.simpleCardContent}>
                  <FontAwesome5 name="heartbeat" size={28} color="#FFFFFF" />
                  <Text style={[styles.simpleCardTitle, { color: '#FFFFFF' }]}>Historial Médico</Text>
                </View>
              </TouchableOpacity>

            <TouchableOpacity
                style={[styles.simpleCard, { 
                  backgroundColor: '#FFFFFF',
                  borderWidth: 1,
                  borderColor: 'rgba(45, 55, 72, 0.2)'
                }]}
                onPress={(event) => {
                  event.currentTarget.measure((x, y, width, height, pageX, pageY) => {
                    handleCardPress('preferencias', { x: pageX, y: pageY, width, height });
                  });
                }}
              >
                <View style={styles.simpleCardContent}>
                  <MaterialIcons name="medical-services" size={28} color="#2D3748" />
                  <Text style={[styles.simpleCardTitle, { color: '#2D3748' }]}>Preferencias</Text>
                </View>
              </TouchableOpacity>
            </View>
          </Animated.View>

          <Animated.View style={{ opacity: fadeInLargeCard }}>
            <TouchableOpacity
              style={[styles.largeCard, { backgroundColor: '#1A365D' }]}
              onPress={handleConsultasPress}
            >
              <View style={styles.largeCardContent}>
                <Text style={[styles.largeCardTitle, { color: '#FFFFFF' }]}>Consultas Médicas</Text>
                <Text style={[styles.largeCardDescription, { color: '#FFFFFF', opacity: 0.8 }]}>
                  Accede a tu historial completo de consultas y mantén un seguimiento de tu salud
                </Text>
              </View>
            </TouchableOpacity>
          </Animated.View>
          </View>

        <Modal
          transparent={true}
          visible={modalVisible}
          onRequestClose={closeModal}
        >
          <TouchableWithoutFeedback onPress={closeModal}>
            <Animated.View 
              style={[
                styles.modalContainer,
                {
                  opacity: fadeAnim,
                  backgroundColor: isDarkMode ? 'rgba(0, 0, 0, 0.5)' : 'rgba(0, 0, 0, 0.3)',
                }
              ]}
            >
              <BlurView
                intensity={isDarkMode ? 50 : 30}
                style={[
                  StyleSheet.absoluteFill,
                  { backgroundColor: isDarkMode ? 'rgba(0, 0, 0, 0.7)' : 'rgba(0, 0, 0, 0.4)' }
                ]}
                tint="dark"
              />
              <TouchableWithoutFeedback>
                <View style={styles.modalWrapper}>
                  <Animated.View
                    style={[
                      styles.modalView,
                      {
                        backgroundColor: isDarkMode ? 'rgba(23, 25, 35, 0.98)' : 'rgba(255, 255, 255, 0.98)',
                        transform: [
                          { scale: scaleAnim },
                          {
                            translateY: cardLayout ? 
                              Animated.multiply(
                                Animated.subtract(1, scaleAnim),
                                cardLayout.y - (Dimensions.get('window').height / 2) + (cardLayout.height / 2)
                              ) as any : 0
                          },
                          {
                            translateX: cardLayout ? 
                              Animated.multiply(
                                Animated.subtract(1, scaleAnim),
                                cardLayout.x - (Dimensions.get('window').width / 2) + (cardLayout.width / 2)
                              ) as any : 0
                          }
                        ]
                      }
                    ]}
                  >
                    <Animated.ScrollView 
                      style={[
                        styles.modalScroll,
                        {
                          opacity: contentFadeAnim
                        }
                      ]}
                      contentContainerStyle={{ flexGrow: 1, paddingBottom: 32 }}
                      showsVerticalScrollIndicator={true}
                    >
                      {renderModalContent()}
                    </Animated.ScrollView>
                  </Animated.View>
                  <Animated.View style={[styles.closeButtonContainer, { opacity: fadeAnim }]}>
          <TouchableOpacity
                      style={styles.closeButton}
                      onPress={closeModal}
                    >
                      <View style={[
                        styles.closeButtonCircle, 
                        { 
                          backgroundColor: isDarkMode 
                            ? 'rgba(70, 70, 70, 0.8)' 
                            : 'rgba(120, 120, 120, 0.8)'
                        }
                      ]}>
                        <Ionicons name="close" size={32} color="#FFFFFF" />
                      </View>
          </TouchableOpacity>
                  </Animated.View>
        </View>
              </TouchableWithoutFeedback>
            </Animated.View>
          </TouchableWithoutFeedback>
        </Modal>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? 40 : 0,
  },
  searchBar: {
    marginHorizontal: 20,
    marginVertical: 10,
  },
  searchInput: {
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 10,
    fontSize: 16,
  },
  sectionTitle: {
    fontSize: 30,
    fontWeight: 'bold',
    marginVertical: 10,
    marginHorizontal: 20,
  },
  zoneCard: {
    borderRadius: 10,
    marginBottom: 0, 
    overflow: 'hidden', 
  },
  zoneImage: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  gradientOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1,
  },
  zoneTitle: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    right: 10,
    fontSize: 14,
    fontWeight: 'bold',
    lineHeight: 18,
    color: '#fff',
    zIndex: 2,
  },
  carouselContent: {
    paddingVertical: 10,
    paddingHorizontal: 10,
  },
  trainerButton: {
    alignItems: 'center',
    marginVertical: 20,
  },
  trainerImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  trainerButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 10,
  },
  courtesyPassButton: {
    backgroundColor: '#F36C21',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: 'center',
    marginHorizontal: 20,
    marginTop: 20,
  },
  courtesyPassText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  noResultsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 50,
  },
  noResultsText: {
    fontSize: 16,
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  welcomeContainer: {
    paddingHorizontal: 20,
    paddingVertical: 32,
    paddingBottom: 16,
    marginBottom: -16,
  },
  welcomeText: {
    fontSize: 36,
    fontWeight: '400',
    letterSpacing: -0.5,
  },
  nameText: {
    fontSize: 42,
    fontWeight: '400',
    marginTop: 8,
    letterSpacing: -0.5,
  },
  summaryCard: {
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  card: {
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  regularCardHeader: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  regularCardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 12,
    textAlign: 'center',
  },
  cardDescription: {
    fontSize: 14,
    marginBottom: 16,
  },
  summaryContent: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  summaryItem: {
    marginBottom: 10,
  },
  summaryLabel: {
    fontSize: 14,
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  listItem: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  listItemContent: {
    flex: 1,
  },
  listItemTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  listItemSubtitle: {
    fontSize: 14,
    marginBottom: 2,
  },
  listItemDoctor: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 4,
  },
  listItemResult: {
    fontSize: 14,
    marginTop: 4,
  },
  cardAction: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 10,
  },
  cardActionText: {
    fontSize: 14,
    fontWeight: '600',
    marginRight: 4,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    paddingVertical: 16,
    fontStyle: 'italic',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  dataContainer: {
    marginTop: 8,
  },
  dataRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(150, 150, 150, 0.2)',
  },
  dataLabel: {
    fontSize: 16,
    flex: 1,
    fontWeight: '500',
  },
  dataValue: {
    fontSize: 16,
    flex: 1.2,
    textAlign: 'right',
    fontWeight: '400',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalView: {
    margin: 20,
    borderRadius: 28,
    padding: 24,
    paddingTop: 20,
    width: '90%',
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  closeButtonContainer: {
    width: '100%',
    alignItems: 'center',
    marginTop: 20,
  },
  closeButton: {
    alignItems: 'center',
  },
  closeButtonCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalScroll: {
    // maxHeight: '100%',
  },
  modalContent: {
    paddingHorizontal: 4,
    paddingBottom: 24,
  },
  modalTitle: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 24,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  modalWrapper: {
    alignItems: 'center',
    width: '100%',
  },
  contentContainer: {
    flex: 1,
    padding: 16,
  },
  cardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  cardsGrid: {
    marginBottom: 16,
    marginTop: 24,
  },
  simpleCard: {
    width: '48%',
    aspectRatio: 1,
    borderRadius: 16,
    padding: 16,
    justifyContent: 'center',
  },
  simpleCardContent: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  simpleCardTitle: {
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
  },
  largeCard: {
    width: '100%',
    borderRadius: 16,
    marginTop: 8,
    padding: 20,
  },
  largeCardContent: {
    flex: 1,
  },
  largeCardTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
  },
  largeCardDescription: {
    fontSize: 14,
    opacity: 0.9,
  },
  lastConsultInfo: {
    marginTop: 12,
  },
  lastConsultDate: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  lastConsultDoctor: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  lastConsultSpecialty: {
    fontSize: 14,
    marginBottom: 8,
    fontStyle: 'italic',
  },
  lastConsultType: {
    fontSize: 14,
    marginBottom: 8,
    fontStyle: 'italic',
  },
  lastConsultDiagnosis: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 4,
  },
  lastConsultReason: {
    fontSize: 14,
    lineHeight: 20,
    fontStyle: 'italic',
  },
  expedienteHeader: {
    paddingBottom: 16,
    borderBottomWidth: 1,
    marginBottom: 20,
  },
  expedienteHeaderTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  expedienteLogo: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
    marginRight: 12,
  },
  expedienteTitle: {
    flex: 1,
  },
  expedienteSubtitle: {
    fontSize: 14,
    letterSpacing: 0.5,
    fontWeight: '500',
  },
  expedienteBadge: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    alignSelf: 'flex-start',
    marginTop: 6,
  },
  expedienteBadgeText: {
    fontSize: 13,
    fontWeight: '600',
  },
  expedienteBody: {
    flex: 1,
  },
  expedienteSection: {
    marginBottom: 24,
    borderBottomWidth: 1,
    paddingBottom: 16,
  },
  expedienteSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
  },
  expedienteSectionTitle: {
    fontSize: 17,
    fontWeight: '600',
    marginLeft: 10,
  },
  expedienteSectionContent: {
    paddingHorizontal: 4,
  },
  expedienteRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  expedienteLabel: {
    fontSize: 15,
    fontWeight: '500',
    flex: 1,
  },
  expedienteValue: {
    fontSize: 15,
    textAlign: 'right',
    flex: 1.5,
    fontWeight: '400',
  },
  expedienteDiagnosisBox: {
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 3,
    marginVertical: 6,
  },
  expedienteDiagnosisText: {
    fontSize: 16,
    fontWeight: '500',
    lineHeight: 22,
  },
  expedienteTextBox: {
    padding: 12,
    borderRadius: 8,
    marginVertical: 6,
  },
  expedienteTextContent: {
    fontSize: 15,
    lineHeight: 22,
  },
  expedienteAttachment: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 6,
    marginVertical: 4,
  },
  expedienteAttachmentText: {
    marginLeft: 8,
    fontSize: 14,
  },
});