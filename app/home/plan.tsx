import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Button, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { BarCodeScanner } from 'expo-barcode-scanner';
import { useTheme } from '../themecontext';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import { useAuth } from '../authContext';
import { router } from 'expo-router';

// URL de la API - cámbialo según el entorno
const API_URL = 'http://201.171.25.219:1338';

// Modo debug para ver más información y diagnosticar problemas
const DEBUG_MODE = true;

// Token del médico (puedes moverlo a un archivo seguro si lo deseas)
const TOKEN_MEDICO = "cbde2ceea36cd25b97cf9039c37974a3ad5253c81928ab6cf188148df16e8cd404a369cdf90d81174ec1acd8276e0bea125c696d9335ff79be7a0b94ad492009d66195b65b4d5f24406788b31a822486091f167e0f84734bb25c523f168a8a697557f388e0f5c45fb1eb1a3fab509cc14f57a298ecc08d30075aeca686345541";

export default function PlanScreen() {
  const { theme } = useTheme(); 
  const isDarkMode = theme === 'Oscuro'; 
  const { user } = useAuth();
  // Obtener token de autenticación (ajusta esto según tu estructura de datos)
  // @ts-ignore - Ignoramos el error de tipo ya que la estructura exacta puede variar
  const token = user?.token || (user as any)?.token || '';
  
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<string[]>([]);
  const [lastScannedData, setLastScannedData] = useState<string>('');

  // Función de log para debugging
  const logDebug = (message: string) => {
    if (DEBUG_MODE) {
      console.log(`[QR SCANNER] ${message}`);
      setDebugInfo(prev => [...prev, message].slice(-10)); // Mantener solo los últimos 10 logs
    }
  };

  useEffect(() => {
    const getBarCodeScannerPermissions = async () => {
      const { status } = await BarCodeScanner.requestPermissionsAsync();
      logDebug(`Permiso de cámara: ${status}`);
      setHasPermission(status === 'granted');
    };

    logDebug('Inicializando escáner de QR');
    getBarCodeScannerPermissions();
    activateKeepAwakeAsync();
    return () => {
      logDebug('Limpieza del escáner');
      deactivateKeepAwake(); 
    };
  }, []);

  // Función para asociar QR con paciente usando documentId
  async function asociarQRconPaciente(documentIdQR: string, pacienteId: number) {
    try {
      const response = await fetch(`${API_URL}/api/qraccesses/${documentIdQR}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${TOKEN_MEDICO}`
        },
        body: JSON.stringify({
          data: {
            confirmado: true,
            paciente: pacienteId
          }
        })
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error?.message || 'Error al asociar QR');
      }
      return data;
    } catch (error: any) {
      throw error;
    }
  }

  const extraerDocumentId = (codigo: string): string | null => {
    // Si el QR es un JSON con documentId
    try {
      const jsonData = JSON.parse(codigo);
      if (jsonData && jsonData.documentId) {
        return jsonData.documentId;
      }
    } catch (e) {
      // No es JSON
    }
    // Si el QR es el documentId directamente (24 caracteres alfanuméricos)
    if (/^[a-z0-9]{24}$/i.test(codigo)) {
      return codigo;
    }
    // Si el QR contiene el documentId en el texto
    const match = codigo.match(/[a-z0-9]{24}/i);
    if (match) {
      return match[0];
    }
    return null;
  };

  const handleBarCodeScanned = async ({ type, data }: { type: string; data: string }) => {
    try {
      setScanned(true);
      setLastScannedData(data);
      logDebug(`QR escaneado - Tipo: ${type}, Datos: ${data}`);
      logDebug(`Contenido real del QR escaneado: ${data}`);

      // Paso 1: Buscar el documentId usando el código numérico
      const codigoNumerico = data;
      setLoading(true);
      let documentIdQR = null;
      try {
        const response = await fetch(`${API_URL}/api/qraccesses?filters[codigo]=${codigoNumerico}`);
        const qrData = await response.json();
        documentIdQR = qrData.data?.[0]?.documentId;
      } catch (e) {
        setLoading(false);
        Alert.alert('Error', 'No se pudo buscar el documentId en la API');
        setScanned(false);
        return;
      }

      if (!documentIdQR) {
        setLoading(false);
        Alert.alert('Error', 'No se encontró un QR válido para ese código');
        setScanned(false);
        return;
      }

      // Paso 2: Asociar QR con paciente (usuario autenticado)
      const pacienteId = user?.id;
      if (!pacienteId) {
        setLoading(false);
        Alert.alert('Error', 'No se encontró el ID del paciente autenticado.');
        setScanned(false);
        return;
      }

      try {
        await asociarQRconPaciente(documentIdQR, pacienteId);
        Alert.alert('¡Listo!', 'El QR ha sido asociado correctamente al paciente.');
      } catch (error: any) {
        Alert.alert('Error', error.message || 'No se pudo asociar el QR');
      } finally {
        setLoading(false);
      }
    } catch (error: any) {
      logDebug(`Error en el manejo del QR: ${error.message}`);
      Alert.alert('Error', `Error al procesar el QR: ${error.message}`);
      setScanned(false);
    }
  };

  if (hasPermission === null) {
    return (
      <View style={[styles.container, { backgroundColor: isDarkMode ? '#121212' : '#F0F0F0' }]}>
        <Text style={{ color: isDarkMode ? '#FFFFFF' : '#000000' }}>Solicitando permiso de cámara...</Text>
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <View style={[styles.container, { backgroundColor: isDarkMode ? '#121212' : '#F0F0F0' }]}>
        <Text style={{ color: isDarkMode ? '#FFFFFF' : '#000000' }}>Sin acceso a la cámara</Text>
        <Button title="Solicitar Permiso" onPress={() => BarCodeScanner.requestPermissionsAsync()} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: isDarkMode ? '#121212' : '#F0F0F0' }]}>
      <BarCodeScanner
        onBarCodeScanned={scanned ? undefined : handleBarCodeScanned}
        style={StyleSheet.absoluteFillObject}
      />
      
      {/* Overlay con instrucciones */}
      <View style={[styles.scanOverlay, { backgroundColor: isDarkMode ? 'rgba(0,0,0,0.7)' : 'rgba(255,255,255,0.7)' }]}>
        <Text style={{ color: isDarkMode ? '#FFFFFF' : '#000000', fontSize: 18, fontWeight: 'bold', marginBottom: 10 }}>
          Escanea el código QR del expediente
        </Text>
        <Text style={{ color: isDarkMode ? '#E0E0E0' : '#444444', textAlign: 'center', marginHorizontal: 20 }}>
          Coloca el código QR dentro del área de escaneo para acceder a tu expediente médico
        </Text>
      </View>
      
      {/* Cuadro de enfoque para el QR */}
      <View style={styles.focusFrame} />
      
      {loading && (
        <View style={[styles.loadingOverlay, { backgroundColor: isDarkMode ? 'rgba(0,0,0,0.8)' : 'rgba(255,255,255,0.8)' }]}>
          <ActivityIndicator size="large" color="#25d366" />
          <Text style={{ color: isDarkMode ? '#FFFFFF' : '#000000', marginTop: 10 }}>Validando código QR...</Text>
        </View>
      )}
      
      {error && (
        <View style={[styles.errorContainer, { backgroundColor: isDarkMode ? '#300' : '#fee' }]}>
          <Text style={{ color: isDarkMode ? '#ff6b6b' : '#d32f2f' }}>{error}</Text>
        </View>
      )}
      
      {scanned && !loading && (
        <View style={styles.overlay}>
          <Button title="Escanear de nuevo" onPress={() => {
            setScanned(false);
            setError(null);
          }} />
        </View>
      )}

      {/* Panel de depuración */}
      {DEBUG_MODE && (
        <View style={[styles.debugPanel, { backgroundColor: isDarkMode ? 'rgba(0,0,0,0.9)' : 'rgba(255,255,255,0.9)' }]}>
          <Text style={{ color: isDarkMode ? '#FFFFFF' : '#000000', fontWeight: 'bold' }}>Información de Depuración</Text>
          <Text style={{ color: isDarkMode ? '#FFFFFF' : '#000000', marginBottom: 5 }}>
            Último QR: {lastScannedData ? lastScannedData.substring(0, 30) : 'Ninguno'}
          </Text>
          <ScrollView style={styles.debugScroll}>
            {debugInfo.map((log, index) => (
              <Text key={index} style={{ color: isDarkMode ? '#FFFFFF' : '#000000', fontSize: 12 }}>
                {log}
              </Text>
            ))}
          </ScrollView>
          <Button 
            title="Limpiar Logs" 
            onPress={() => {
              setDebugInfo([]);
              setLastScannedData('');
            }} 
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlay: {
    position: 'absolute',
    bottom: 50,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  scanOverlay: {
    position: 'absolute',
    top: 60,
    left: 20,
    right: 20,
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
  },
  focusFrame: {
    width: 250,
    height: 250,
    borderWidth: 2,
    borderColor: '#25d366',
    borderRadius: 20,
    backgroundColor: 'transparent',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  errorContainer: {
    position: 'absolute',
    bottom: 100,
    left: 20,
    right: 20,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  debugPanel: {
    position: 'absolute',
    bottom: 120,
    left: 10,
    right: 10,
    padding: 10,
    borderRadius: 8,
    maxHeight: 200,
  },
  debugScroll: {
    maxHeight: 120,
    marginVertical: 5,
  }
});