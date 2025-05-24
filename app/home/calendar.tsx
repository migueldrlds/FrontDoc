import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity, TextInput, Image, Platform, Alert } from 'react-native';
import { useTheme } from '../themecontext';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { TextInputMask } from 'react-native-masked-text';
import { Picker } from '@react-native-picker/picker';
import * as FileSystem from 'expo-file-system';

type FormType = 'vacuna' | 'estudio' | 'consulta' | null;

type FileItem = {
  uri: string;
  name: string;
  type: string;
  isImage?: boolean;
};

const API_URL = 'http://201.171.25.219:1338';
const STRAPI_EMAIL = 'jose@gmail.com';
const STRAPI_PASSWORD = '12345678';

// Lista de vacunas permitidas por Strapi
const VACUNAS_PERMITIDAS = [
  'BCG', 
  'Hepatitis B', 
  'Pentavalente acelular', 
  'DTP', 
  'Rotavirus', 
  'Neumocócica conjugada', 
  'Neumocócica polisacárida', 
  'Influenza', 
  'Triple viral SRP', 
  'Doble viral SR', 
  'Hepatitis A', 
  'Varicela', 
  'VPH', 
  'COVID-19', 
  'Tétanos', 
  'Difteria', 
  'Tos ferina', 
  'Sarampión', 
  'Rubéola', 
  'Paperas', 
  'Poliomielitis', 
  'Meningocócica', 
  'Fiebre tifoidea', 
  'Fiebre amarilla', 
  'Herpes zóster', 
  'Haemophilus influenzae tipo b', 
  'Rabia', 
  'Virus sincitial respiratorio', 
  'Vacuna combinada hexavalente (cuando aplica)', 
  'Vacuna combinada Tdap (para adolescentes y embarazadas)'
];

// Lista de vías de administración comunes
const VIAS_ADMINISTRACION = [
  'Intramuscular',
  'Subcutánea',
  'Intradérmica',
  'Oral',
  'Nasal',
  'Intravenosa'
];

// Lista de dosis permitidas por Strapi
const DOSIS_PERMITIDAS = [
  'Primera dosis',
  'Segunda dosis',
  'Tercera dosis',
  'Refuerzo',
  'Dosis única',
  'Anual',
  'Esquema completo'
];

async function strapiLogin() {
  // Array de URLs alternativas para probar en caso de error
  const urls = [
    `${API_URL}/api/auth/local`,          // URL estándar
    `${API_URL.replace('http:', 'https:')}/api/auth/local`,  // Probar con HTTPS
    `${API_URL}/auth/local`,              // Sin prefijo /api
    'http://201.171.25.219/api/auth/local'  // Sin puerto
  ];
  
  let lastError: Error | null = null;
  
  // Intentar login con cada URL hasta que una funcione
  for (const url of urls) {
    try {
      console.log(`Intentando conectar a ${url}`);
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // timeout de 15 segundos
      
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: STRAPI_EMAIL, password: STRAPI_PASSWORD }),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      console.log('Respuesta de Strapi:', res.status);
      const responseText = await res.text();
      let data;
      
      try {
        data = JSON.parse(responseText);
      } catch (e: any) {
        console.error('Error al parsear respuesta:', responseText.substring(0, 200));
        throw new Error('Formato de respuesta inválido');
      }
      
      if (data && data.jwt) {
        console.log('Token JWT obtenido correctamente');
        console.log('URL exitosa para futura referencia:', url);
        return data.jwt;
      }
      
      // Si llegamos aquí, no obtuvimos JWT pero tampoco hubo error HTTP
      console.error('Error de autenticación:', data);
      lastError = new Error(data && data.error && data.error.message ? data.error.message : 'Credenciales incorrectas o servidor no disponible');
    } catch (e: any) {
      console.warn(`Error con URL ${url}:`, e.message);
      lastError = e;
      // Continuar con la siguiente URL
    }
  }
  
  // Si llegamos aquí, ninguna URL funcionó
  console.error('Todos los intentos de conexión fallaron');
  Alert.alert('Error de conexión', 
    lastError?.message || 'No se pudo conectar con el servidor. Verifica tu conexión a internet.');
  throw lastError || new Error('Error de conexión desconocido');
}

// Implementación del servicio de carga de archivos basada en la documentación web
const fileUploadService = {
  /**
   * Sube múltiples archivos al servidor Strapi con múltiples estrategias de fallback
   * @param {FileItem[]} files - Lista de archivos a subir
   * @param {string} jwt - Token JWT para autenticación
   * @returns {Promise<number[]>} - IDs de los archivos subidos
   */
  async uploadFiles(files: FileItem[], jwt: string): Promise<number[]> {
    if (!files || files.length === 0) {
      console.log('No hay archivos para subir');
      return [];
    }
    
    try {
      console.log('Iniciando proceso de subida directa...');
      
      // ESTRATEGIA 1: Intentar subida con opciones para evitar optimización
      try {
        // Crear FormData para la solicitud
        const formData = new FormData();
        
        // Agregar parámetro para deshabilitar optimización
        formData.append('options', JSON.stringify({
          optimize: false,
          quality: 80
        }));
        
        // Preparar cada archivo con nombres simples
        for (const file of files) {
          const extension = file.name?.split('.').pop() || 'jpg';
          const simpleName = `archivo_${Date.now()}.${extension}`;
          
          const fileInfo = {
            uri: Platform.OS === 'android' ? file.uri : file.uri.replace('file://', ''),
            name: simpleName,
            type: file.type || 'image/jpeg'
          };
          
          console.log(`Preparando archivo: ${simpleName}`);
          formData.append('files', fileInfo as any);
        }
        
        // Realizar la petición al servidor
        console.log('Intentando subida sin optimización');
        const response = await fetch(`${API_URL}/api/upload`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${jwt}`
          },
          body: formData
        });
        
        // Procesar la respuesta
        if (response.ok) {
          const data = await response.json();
          console.log('Archivos subidos exitosamente');
          return Array.isArray(data) ? data.map(file => file.id) : [];
        } else {
          console.warn('Primer intento fallido, respuesta no OK:', response.status);
        }
      } catch (error) {
        console.warn('Error en primer intento:', error);
      }
      
      // ESTRATEGIA 2: Intentar subidas individuales
      console.log('Intentando subida archivo por archivo...');
      const fileIds: number[] = [];
      
      for (const file of files) {
        try {
          // Nombre simple para el archivo
          const timestamp = Date.now();
          const simpleName = `foto_${timestamp}.jpg`;
          
          const singleFormData = new FormData();
          const fileInfo = {
            uri: Platform.OS === 'android' ? file.uri : file.uri.replace('file://', ''),
            name: simpleName,
            type: 'image/jpeg' // Forzar tipo JPEG
          };
          
          console.log(`Subiendo archivo individual: ${simpleName}`);
          singleFormData.append('files', fileInfo as any);
          
          // Prevenir bloqueos con timeout
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 30000);
          
          const response = await fetch(`${API_URL}/api/upload`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${jwt}`
            },
            body: singleFormData,
            signal: controller.signal
          });
          
          clearTimeout(timeoutId);
          
          if (response.ok) {
            const data = await response.json();
            if (Array.isArray(data) && data.length > 0 && data[0].id) {
              console.log(`Archivo subido, ID: ${data[0].id}`);
              fileIds.push(data[0].id);
            }
          } else {
            console.warn(`Error subiendo archivo individual: ${response.status}`);
          }
        } catch (fileError) {
          console.error('Error en subida individual:', fileError);
        }
        
        // Pausa entre subidas
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      if (fileIds.length > 0) {
        console.log(`Se subieron ${fileIds.length} archivos individualmente`);
        return fileIds;
      }
      
      // ESTRATEGIA 3: Probar una configuración mínima
      console.log('Intentando configuración mínima...');
      try {
        if (files.length > 0) {
          const file = files[0]; // Solo primer archivo
          const miniForm = new FormData();
          
          const miniFile = {
            uri: Platform.OS === 'android' ? file.uri : file.uri.replace('file://', ''),
            name: 'simple.jpg',
            type: 'image/jpeg'
          };
          
          miniForm.append('files', miniFile as any);
          
          const response = await fetch(`${API_URL}/api/upload`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${jwt}`
            },
            body: miniForm
          });
          
          if (response.ok) {
            const data = await response.json();
            console.log('Subida mínima exitosa');
            return Array.isArray(data) ? data.map(file => file.id) : [];
          }
        }
      } catch (error) {
        console.warn('Error en estrategia mínima:', error);
      }
      
      console.error('Todas las estrategias de subida fallaron');
      Alert.alert('Error', 'No se pudieron subir los archivos adjuntos. El problema podría estar en el servidor.');
      return [];
    } catch (error: any) {
      console.error('Error general en uploadFiles:', error.message);
      Alert.alert('Error', 'No se pudieron subir los archivos. Intente más tarde.');
      return [];
    }
  },
  
  /**
   * Sube un único archivo al servidor Strapi
   * @param {FileItem} file - Archivo a subir
   * @param {string} jwt - Token JWT para autenticación
   * @returns {Promise<number|null>} - ID del archivo subido o null en caso de error
   */
  async uploadFile(file: FileItem, jwt: string): Promise<number|null> {
    try {
      const fileIds = await this.uploadFiles([file], jwt);
      return fileIds.length > 0 ? fileIds[0] : null;
    } catch (error) {
      console.error('Error al subir archivo único:', error);
      return null;
    }
  },
  
  /**
   * Vincula archivos a una entrada existente con manejo de errores mejorado
   * @param {number[]} fileIds - IDs de los archivos a vincular
   * @param {number} entryId - ID de la entrada
   * @param {string} collectionType - Tipo de colección (vacuna, estudio, consulta)
   * @param {string} fieldName - Nombre del campo en la colección
   * @param {string} jwt - Token JWT para autenticación
   * @returns {Promise<boolean>} - true si los archivos fueron vinculados correctamente
   */
  async linkFilesToEntry(
    fileIds: number[], 
    entryId: number, 
    collectionType: string, 
    fieldName: string, 
    jwt: string
  ): Promise<boolean> {
    if (!fileIds.length || !entryId) {
      console.log('No hay archivos o ID de entrada para vincular');
      return false;
    }
    
    // Intentar múltiples veces con diferentes estrategias
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        console.log(`Intento ${attempt} de vincular archivos a la entrada ${entryId}`);
        
        // Crear payload para actualizar la entrada
        const payload = {
          data: {
            [fieldName]: fileIds
          }
        };
        
        console.log(`Archivos a vincular: ${fileIds.join(', ')}`);
        console.log(`Campo a utilizar: ${fieldName}`);
        
        // Determinar el endpoint correcto
        const endpoint = attempt === 1 
          ? `${API_URL}/api/${collectionType}s/${entryId}` 
          : attempt === 2 
            ? `${API_URL}/api/${collectionType}/${entryId}` 
            : `${API_URL}/${collectionType}s/${entryId}`;
            
        console.log(`Intentando con endpoint: ${endpoint}`);
        
        // Prevenir bloqueos con timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000);
        
        const response = await fetch(endpoint, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${jwt}`
          },
          body: JSON.stringify(payload),
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (response.ok) {
          console.log('Archivos vinculados exitosamente en intento', attempt);
          return true;
        } else {
          const errorText = await response.text();
          console.warn(`Error en intento ${attempt}:`, errorText);
          // Continuar con siguiente intento
        }
      } catch (error: any) {
        console.warn(`Error en intento ${attempt}:`, error.message);
        // Continuar con siguiente intento
      }
      
      // Esperar un poco antes del siguiente intento
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    console.error('Todos los intentos de vinculación fallaron');
    return false;
  },
  
  /**
   * Elimina un archivo del servidor Strapi
   * @param {number} fileId - ID del archivo a eliminar
   * @param {string} jwt - Token JWT para autenticación
   * @returns {Promise<boolean>} - true si el archivo fue eliminado correctamente
   */
  async deleteFile(fileId: number, jwt: string): Promise<boolean> {
    if (!fileId) return false;
    
    try {
      const response = await fetch(`${API_URL}/api/upload/files/${fileId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${jwt}`
        }
      });
      
      return response.ok;
    } catch (error) {
      console.error('Error al eliminar archivo:', error);
      return false;
    }
  },
  
  /**
   * Sube archivos y los vincula a una entrada con múltiples estrategias de fallback
   * @param {FileItem[]} files - Archivos a subir
   * @param {number} entryId - ID de la entrada
   * @param {string} collectionType - Tipo de colección (vacuna, estudio, consulta)
   * @param {string} fieldName - Nombre del campo en la colección
   * @param {string} jwt - Token JWT para autenticación
   * @returns {Promise<boolean>} - true si la operación fue exitosa
   */
  async uploadAndLinkFiles(
    files: FileItem[], 
    entryId: number, 
    collectionType: string, 
    fieldName: string, 
    jwt: string
  ): Promise<boolean> {
    if (!files.length) {
      console.log('No hay archivos para procesar');
      return true; // Consideramos éxito si no hay nada que hacer
    }
    
    try {
      console.log(`Procesando ${files.length} archivos para el registro ${entryId}`);
      
      // OPCIÓN 1: Intentar subida directa con todos los parámetros
      try {
        console.log('Intentando subida directa con vinculación automática...');
        
        // Crear FormData con todos los datos necesarios
        const formData = new FormData();
        
        // Añadir referencias
        const refValue = `api::${collectionType}.${collectionType}`;
        formData.append('ref', refValue);
        formData.append('refId', entryId.toString());
        formData.append('field', fieldName);
        
        console.log(`Referencia: ${refValue}, ID: ${entryId}, Campo: ${fieldName}`);
        
        // Deshabilitar optimización
        formData.append('options', JSON.stringify({
          optimize: false,
          quality: 70
        }));
        
        // Añadir archivos
        for (const file of files) {
          const simpleName = `archivo_${Date.now()}.jpg`;
          const fileInfo = {
            uri: Platform.OS === 'android' ? file.uri : file.uri.replace('file://', ''),
            name: simpleName,
            type: 'image/jpeg'
          };
          
          formData.append('files', fileInfo as any);
        }
        
        // Configurar timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000);
        
        // Realizar la petición
        const response = await fetch(`${API_URL}/api/upload`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${jwt}`
          },
          body: formData,
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (response.ok) {
          console.log('Subida y vinculación directa exitosa');
          return true;
        } else {
          console.warn('La vinculación directa falló, intentando proceso en dos pasos');
        }
      } catch (error) {
        console.warn('Error en subida directa:', error);
      }
      
      // OPCIÓN 2: Proceso en dos pasos - primero subir, luego vincular
      console.log('Iniciando proceso en dos pasos...');
      
      // Paso 1: Subir los archivos
      let fileIds: number[] = [];
      
      // Intentar primero la subida de todos los archivos
      fileIds = await this.uploadFiles(files, jwt);
      
      // Si falló la subida masiva, intentar subir solo un archivo
      if (fileIds.length === 0 && files.length > 0) {
        console.log('Intentando subir solo el primer archivo...');
        const firstFile = files[0];
        const firstFileId = await this.uploadFile(firstFile, jwt);
        if (firstFileId) {
          fileIds = [firstFileId];
        }
      }
      
      // Verificar si obtuvimos al menos un ID de archivo
      if (fileIds.length === 0) {
        console.error('No se pudo subir ningún archivo');
        return false;
      }
      
      console.log(`Se subieron ${fileIds.length} archivos con IDs: ${fileIds.join(', ')}`);
      
      // Paso 2: Vincular los archivos a la entrada
      const linked = await this.linkFilesToEntry(fileIds, entryId, collectionType, fieldName, jwt);
      
      if (linked) {
        console.log('Archivos vinculados correctamente');
        return true;
      } else {
        console.error('No se pudieron vincular los archivos');
        // Mostrar mensaje específico sobre la situación
        Alert.alert(
          'Información', 
          'Los archivos se subieron correctamente, pero no se pudieron vincular al registro. ' +
          'El registro se guardó correctamente.'
        );
        return false;
      }
    } catch (error) {
      console.error('Error en uploadAndLinkFiles:', error);
      Alert.alert(
        'Error',
        'Se produjo un error al procesar los archivos. El registro se guardó, pero los archivos no pudieron procesarse correctamente.'
      );
      return false;
    }
  }
};

// Función para convertir fecha de formato DD/MM/YYYY a YYYY-MM-DD (formato API)
const convertDateFormat = (date: string): string => {
  // Si no hay fecha o está vacía, usar la fecha actual
  if (!date || date.trim() === '') {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  
  const parts = date.split('/');
  if (parts.length !== 3) {
    // Si el formato no es correcto, usar la fecha actual
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  
  // Partes[0] = día, partes[1] = mes, partes[2] = año
  return `${parts[2]}-${parts[1]}-${parts[0]}`;
};

// Función para subir archivos usando expo-file-system (solución Stack Overflow)
const uploadExpoFileSystem = async (fileUri: string, jwt: string) => {
  try {
    console.log(`Intentando subir archivo con expo-file-system: ${fileUri}`);
    
    if (!fileUri) {
      console.log('No se proporcionó URI de archivo');
      return null;
    }
    
    // Asegurar que la URI sea válida
    const validUri = Platform.OS === 'ios' ? fileUri.replace('file://', '') : fileUri;
    console.log(`URI validada: ${validUri}`);
    
    // Usar el método uploadAsync de expo-file-system
    const uploadResult = await FileSystem.uploadAsync(
      `${API_URL}/api/upload`,
      validUri,
      {
        uploadType: FileSystem.FileSystemUploadType.MULTIPART,
        fieldName: 'files', // Importante: Strapi espera 'files'
        httpMethod: 'POST',
        headers: {
          'Authorization': `Bearer ${jwt}`
        }
      }
    );
    
    console.log(`Respuesta de la subida (status): ${uploadResult.status}`);
    
    // Verificar si la subida fue exitosa
    if (uploadResult.status >= 200 && uploadResult.status < 300) {
      console.log('Subida exitosa con expo-file-system');
      const responseData = JSON.parse(uploadResult.body);
      return responseData;
    } else {
      console.log(`Error en la subida: ${uploadResult.status}`);
      console.log(`Respuesta: ${uploadResult.body}`);
      return null;
    }
  } catch (error) {
    console.error('Error en uploadExpoFileSystem:', error);
    return null;
  }
};

// Versión modificada de uploadFilesSimple según solución de Stack Overflow más efectiva
const uploadFilesSimple = async (file: FileItem, jwt: string, entryId: number | null = null, collection: string | null = null, field: string | null = null) => {
  try {
    console.log(`Intentando método simple para: ${file.uri}`);
    
    // Crear FormData con estructura exacta que Strapi espera
    const formData = new FormData();
    
    // Validar URI
    const validUri = Platform.OS === 'ios' ? file.uri.replace('file://', '') : file.uri;
    
    // Nombre simple para evitar problemas
    const fileName = 'upload.jpg';
    
    // Crear objeto de archivo según solución de Stack Overflow
    const fileObj = {
      uri: validUri,
      name: fileName,
      type: 'image/jpeg', // Usar tipo fijo para evitar problemas
    } as any; // Usar 'as any' para evitar problemas de tipo con FormData
    
    // Agregar el archivo a FormData
    formData.append('files', fileObj);
    
    // Agregar referencias si están disponibles
    if (entryId && collection && field) {
      formData.append('refId', entryId.toString());
      formData.append('ref', collection);
      formData.append('field', field);
    }
    
    // IMPORTANTE: No especificar Content-Type, fetch lo añade automáticamente con boundary
    const response = await fetch(`${API_URL}/api/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${jwt}`
      },
      body: formData
    });
    
    console.log(`Respuesta de subida simple: ${response.status}`);
    
    if (response.ok) {
      const responseData = await response.json();
      console.log('Subida simple exitosa');
      return responseData;
    }
    
    console.log(`Error en subida simple: ${response.status}`);
    return null;
  } catch (error) {
    console.error('Error en uploadFilesSimple:', error);
    return null;
  }
};

// Función para vincular archivos subidos a una entrada específica
const linkFilesToEntry = async (files: any[], entryId: number, collectionType: string, fieldName: string, jwt: string) => {
  try {
    if (!files || files.length === 0 || !entryId || !collectionType || !fieldName) {
      console.log('Faltan datos para vincular archivos');
      return false;
    }

    // Obtener IDs de archivos
    const fileIds = files.map(file => file.id || (file[0] && file[0].id)).filter(Boolean);
    
    if (fileIds.length === 0) {
      console.log('No hay IDs de archivos válidos para vincular');
      return false;
    }

    // Formar el endpoint correcto para la actualización
    const endpoint = `${API_URL}/api/${collectionType}s/${entryId}`;
    
    // Preparar el payload para actualizar la entidad
    const payload = {
      data: {
        [fieldName]: fileIds
      }
    };

    console.log(`Vinculando archivos ${fileIds} a ${endpoint}, campo ${fieldName}`);

    // Realizar la petición PUT para actualizar la entidad
    const response = await fetch(endpoint, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${jwt}`
      },
      body: JSON.stringify(payload)
    });

    if (response.ok) {
      console.log('Archivos vinculados exitosamente');
      return true;
    } else {
      console.log(`Error al vincular archivos: ${response.status}`);
      return false;
    }
  } catch (error) {
    console.error('Error en linkFilesToEntry:', error);
    return false;
  }
};

// Estrategia multienfoque para subir archivos
const uploadFiles = async (files: FileItem[], jwt: string, entryId: number | null = null, collectionType: string | null = null, fieldName: string | null = null) => {
  console.log(`Iniciando uploadFiles con ${files ? files.length : 0} archivos`);
  console.log(`API URL: ${API_URL}, EntryId: ${entryId}, Colección: ${collectionType}, Campo: ${fieldName}`);
  
  if (!files || files.length === 0) {
    console.log('No hay archivos para subir');
    Alert.alert('Error', 'No se seleccionaron archivos para subir');
    return [];
  }
  
  // Determinar valores de referencia para Strapi
  let ref: string | null = null;
  if (collectionType) {
    ref = collectionType.includes('::') ? collectionType : `api::${collectionType}.${collectionType}`;
  }
  
  // Array para almacenar resultados de subidas
  const uploadedFiles = [];
  
  // Intentar cada método de subida para el primer archivo
  const file = files[0];
  console.log(`Procesando archivo: ${file.uri}`);
  
  // 1. Intentar método expo-file-system (más confiable según Stack Overflow)
  let result = await uploadExpoFileSystem(file.uri, jwt);
  
  // 2. Si falla, intentar método simple
  if (!result) {
    console.log('Método expo-file-system falló, intentando método simple');
    result = await uploadFilesSimple(file, jwt, entryId, ref, fieldName);
  }
  
  // 3. Si aún falla, probar base64 como último recurso
  if (!result) {
    console.log('Método simple falló, intentando método base64');
    result = await uploadBase64(file.uri, jwt);
  }
  
  // Verificar resultado final
  if (result) {
    console.log('Subida exitosa por algún método');
    uploadedFiles.push(result);
    
    // Si tenemos ID pero no se incluyó la referencia en la subida, vincular archivos manualmente
    if (entryId && collectionType && fieldName && !ref) {
      await linkFilesToEntry(uploadedFiles, entryId, collectionType, fieldName, jwt);
    }
  } else {
    console.warn('No se pudo subir el archivo por ningún método');
    Alert.alert('Error', 'No se pudo subir el archivo. Intente con una imagen más pequeña o simple.');
  }
  
  return uploadedFiles;
};

// Función para subir como base64 (alternativa si las otras fallan)
const uploadBase64 = async (fileUri: string, jwt: string) => {
  try {
    console.log(`Intentando subir como base64: ${fileUri}`);
    
    if (!fileUri) {
      console.log('No se proporcionó URI de archivo');
      return null;
    }
    
    // Leer archivo como base64
    const base64 = await FileSystem.readAsStringAsync(fileUri, {
      encoding: FileSystem.EncodingType.Base64
    });
    
    // Determinar tipo MIME basado en extensión
    let mimeType = 'image/jpeg'; // Predeterminado
    if (fileUri.endsWith('.png')) mimeType = 'image/png';
    else if (fileUri.endsWith('.gif')) mimeType = 'image/gif';
    
    // Crear formato base64 URL
    const base64Data = `data:${mimeType};base64,${base64}`;
    
    // Enviar a endpoint personalizado que maneje base64
    const response = await fetch(`${API_URL}/api/upload/base64`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${jwt}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ base64: base64Data })
    });
    
    if (response.ok) {
      console.log('Subida base64 exitosa');
      return await response.json();
    } else {
      console.log(`Error en subida base64: ${response.status}`);
      return null;
    }
  } catch (error) {
    console.error('Error en uploadBase64:', error);
    return null;
  }
};

export default function Registros() {
  const { theme } = useTheme();
  const isDarkMode = theme === 'Oscuro';
  const [formType, setFormType] = useState<FormType>(null);
  const [selectedDate, setSelectedDate] = useState('');

  // Estados para el formulario de vacunas
  const [vacunaData, setVacunaData] = useState({
    nombre: '',
    dosis: '',
    lote: '',
    via_administracion: '',
    sitio_aplicacion: '',
    observaciones: ''
  });

  // Estados para el formulario de estudios
  const [estudioData, setEstudioData] = useState({
    tipo: '',
    resultado: '',
    medico: ''
  });

  // Estados para el formulario de consultas
  const [consultaData, setConsultaData] = useState({
    medico: '',
    diagnostico: '',
    receta: '',
    observaciones: '',
    estudios_recomendados: ''
  });

  // Archivos adjuntos para cada formulario
  const [vacunaFiles, setVacunaFiles] = useState<FileItem[]>([]);
  const [estudioFiles, setEstudioFiles] = useState<FileItem[]>([]);
  const [consultaFiles, setConsultaFiles] = useState<FileItem[]>([]);

  // Añadir estado loading 
  const [loading, setLoading] = useState(false);

  // Funciones para adjuntar archivos y tomar fotos
  const handlePickFile = async (form: FormType) => {
    try {
      console.log("Iniciando selección de archivo...");
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
        multiple: true,
      });
      
      console.log("Resultado de la selección:", JSON.stringify(result, null, 2));
      
      if (!result.canceled && result.assets && result.assets.length > 0) {
        console.log(`Se seleccionaron ${result.assets.length} archivos`);
        
        const files = result.assets.map((asset) => {
          // Crear nombre de archivo si no existe
          const fileName = asset.name || `archivo_${Date.now()}.${asset.mimeType?.split('/')[1] || 'dat'}`;
          // Determinar tipo MIME
          const mimeType = asset.mimeType || 'application/octet-stream';
          // Verificar si es imagen
          const isImage = mimeType.startsWith('image/');
          
          console.log(`Archivo: ${fileName}, Tipo: ${mimeType}, URI: ${asset.uri.substring(0, 50)}...`);
          
          return {
            uri: asset.uri,
            name: fileName,
            type: mimeType,
            isImage,
          };
        });
        
        // Actualizar el estado correspondiente
        if (form === 'vacuna') {
          console.log(`Añadiendo ${files.length} archivos a vacunaFiles`);
          setVacunaFiles([...vacunaFiles, ...files]);
        } else if (form === 'estudio') {
          console.log(`Añadiendo ${files.length} archivos a estudioFiles`);
          setEstudioFiles([...estudioFiles, ...files]);
        } else if (form === 'consulta') {
          console.log(`Añadiendo ${files.length} archivos a consultaFiles`);
          setConsultaFiles([...consultaFiles, ...files]);
        }
      } else {
        console.log("No se seleccionaron archivos o se canceló la operación");
      }
    } catch (error) {
      console.error("Error al seleccionar archivos:", error);
      Alert.alert("Error", "No se pudieron seleccionar los archivos");
    }
  };

  const handleTakePhoto = async (form: FormType) => {
    try {
      console.log("Solicitando permisos de cámara...");
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      
      if (permission.status !== 'granted') {
        console.log("Permiso de cámara denegado:", permission);
        Alert.alert('Error', 'Para tomar fotos, necesitas conceder permisos de cámara.');
        return;
      }
      
      console.log("Permiso de cámara concedido, abriendo cámara...");
      const result = await ImagePicker.launchCameraAsync({
        quality: 0.7,
        allowsEditing: true,
        aspect: [4, 3],
      });
      
      console.log("Resultado de la cámara:", JSON.stringify(result, null, 2));
      
      if (!result.canceled && result.assets && result.assets.length > 0) {
        console.log(`Se tomó ${result.assets.length} foto(s)`);
        
        const files = result.assets.map((asset) => {
          // Generar nombre único para la foto con fecha
          const timestamp = new Date().toISOString().replace(/\D/g, '').slice(0, 14);
          const fileName = asset.fileName || `foto_${timestamp}.jpg`;
          // Tipo MIME
          const mimeType = asset.type || 'image/jpeg';
          
          console.log(`Foto: ${fileName}, Tipo: ${mimeType}, URI: ${asset.uri.substring(0, 50)}...`);
          
          return {
            uri: asset.uri,
            name: fileName,
            type: mimeType,
            isImage: true,
          };
        });
        
        // Actualizar el estado correspondiente
        if (form === 'vacuna') {
          console.log(`Añadiendo ${files.length} fotos a vacunaFiles`);
          setVacunaFiles([...vacunaFiles, ...files]);
        } else if (form === 'estudio') {
          console.log(`Añadiendo ${files.length} fotos a estudioFiles`);
          setEstudioFiles([...estudioFiles, ...files]);
        } else if (form === 'consulta') {
          console.log(`Añadiendo ${files.length} fotos a consultaFiles`);
          setConsultaFiles([...consultaFiles, ...files]);
        }
      } else {
        console.log("No se tomó ninguna foto o se canceló la operación");
      }
    } catch (error) {
      console.error("Error al tomar foto:", error);
      Alert.alert("Error", "No se pudo tomar la foto");
    }
  };

  const renderFiles = (files: FileItem[]) => (
    <View style={{ marginTop: 20, marginBottom: 16 }}>
      {files.length > 0 && (
        <Text style={{ color: isDarkMode ? '#fff' : '#333', fontWeight: 'bold', marginBottom: 12, fontSize: 18 }}>
          Archivos adjuntos:
          </Text>
      )}
      {files.map((file, idx) => (
        <View key={idx} style={styles.fileItem}>
          {file.isImage ? (
            <Image source={{ uri: file.uri }} style={{ width: 50, height: 50, borderRadius: 8, marginRight: 12 }} />
          ) : (
            <Ionicons name="document" size={32} color={isDarkMode ? '#fff' : '#0066CC'} style={{ marginRight: 12 }} />
          )}
          <Text style={{ color: isDarkMode ? '#fff' : '#333', flex: 1, fontSize: 16 }} numberOfLines={1}>{file.name}</Text>
        </View>
        ))}
      </View>
  );

  // Funciones para formulario de vacunas
  const renderVacunaForm = (
    isDarkMode: boolean, 
    commonFields: React.ReactNode, 
    vacunaData: {
      nombre: string;
      dosis: string;
      lote: string;
      via_administracion: string;
      sitio_aplicacion: string;
      observaciones: string;
    }, 
    setVacunaData: React.Dispatch<React.SetStateAction<{
      nombre: string;
      dosis: string;
      lote: string;
      via_administracion: string;
      sitio_aplicacion: string;
      observaciones: string;
    }>>, 
    vacunaFiles: FileItem[]
  ) => {
    return (
      <ScrollView style={styles.formContainer}>
        {commonFields}
        <View style={styles.formSection}>
          <Text style={[styles.sectionTitle, { color: isDarkMode ? '#FFFFFF' : '#333' }]}>
            Información de la Vacuna
          </Text>
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: isDarkMode ? '#FFFFFF' : '#333' }]}>Nombre de la vacuna</Text>
            <View style={[styles.pickerContainer, { backgroundColor: isDarkMode ? '#2C2C2C' : '#FFFFFF', borderColor: isDarkMode ? '#444' : '#E0E0E0' }]}>
              <Picker
                selectedValue={vacunaData.nombre}
                onValueChange={(value) => setVacunaData({...vacunaData, nombre: value})}
                style={[styles.picker, { color: isDarkMode ? '#FFFFFF' : '#333' }]}
                dropdownIconColor={isDarkMode ? '#FFFFFF' : '#333'}
              >
                <Picker.Item label="Selecciona la vacuna" value="" color={isDarkMode ? '#888' : '#666'} />
                {VACUNAS_PERMITIDAS.map((vacuna) => (
                  <Picker.Item key={vacuna} label={vacuna} value={vacuna} color={isDarkMode ? '#FFFFFF' : '#333'} />
                ))}
              </Picker>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: isDarkMode ? '#FFFFFF' : '#333' }]}>Dosis</Text>
            <View style={[styles.pickerContainer, { backgroundColor: isDarkMode ? '#2C2C2C' : '#FFFFFF', borderColor: isDarkMode ? '#444' : '#E0E0E0' }]}>
              <Picker
                selectedValue={vacunaData.dosis}
                onValueChange={(value) => setVacunaData({...vacunaData, dosis: value})}
                style={[styles.picker, { color: isDarkMode ? '#FFFFFF' : '#333' }]}
                dropdownIconColor={isDarkMode ? '#FFFFFF' : '#333'}
              >
                <Picker.Item label="Selecciona la dosis" value="" color={isDarkMode ? '#888' : '#666'} />
                {DOSIS_PERMITIDAS.map((dosis) => (
                  <Picker.Item key={dosis} label={dosis} value={dosis} color={isDarkMode ? '#FFFFFF' : '#333'} />
                ))}
              </Picker>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: isDarkMode ? '#FFFFFF' : '#333' }]}>Lote</Text>
            <TextInput
              style={[styles.input, { backgroundColor: isDarkMode ? '#2C2C2C' : '#FFFFFF', color: isDarkMode ? '#FFFFFF' : '#333' }]}
              value={vacunaData.lote}
              onChangeText={(text) => setVacunaData({...vacunaData, lote: text})}
              placeholder="Ingrese el lote"
              placeholderTextColor={isDarkMode ? '#888' : '#666'}
            />
          </View>
        </View>

        <View style={styles.formSection}>
          <Text style={[styles.sectionTitle, { color: isDarkMode ? '#FFFFFF' : '#333' }]}>
            Detalles de Aplicación
          </Text>
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: isDarkMode ? '#FFFFFF' : '#333' }]}>Vía de administración</Text>
            <View style={[styles.pickerContainer, { backgroundColor: isDarkMode ? '#2C2C2C' : '#FFFFFF' }]}>
              <Picker
                selectedValue={vacunaData.via_administracion}
                onValueChange={(value) => setVacunaData({...vacunaData, via_administracion: value})}
                style={[styles.picker, { color: isDarkMode ? '#FFFFFF' : '#333' }]}
                dropdownIconColor={isDarkMode ? '#FFFFFF' : '#333'}
              >
                <Picker.Item label="Selecciona la vía" value="" color={isDarkMode ? '#888' : '#666'} />
                {VIAS_ADMINISTRACION.map((via) => (
                  <Picker.Item key={via} label={via} value={via} color={isDarkMode ? '#FFFFFF' : '#333'} />
                ))}
              </Picker>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: isDarkMode ? '#FFFFFF' : '#333' }]}>Sitio de aplicación</Text>
            <TextInput
              style={[styles.input, { backgroundColor: isDarkMode ? '#2C2C2C' : '#FFFFFF', color: isDarkMode ? '#FFFFFF' : '#333' }]}
              value={vacunaData.sitio_aplicacion}
              onChangeText={(text) => setVacunaData({...vacunaData, sitio_aplicacion: text})}
              placeholder="Ingrese el sitio de aplicación"
              placeholderTextColor={isDarkMode ? '#888' : '#666'}
            />
          </View>
        </View>

        <View style={styles.formSection}>
          <Text style={[styles.sectionTitle, { color: isDarkMode ? '#FFFFFF' : '#333' }]}>
            Observaciones
          </Text>
          <View style={styles.inputGroup}>
            <TextInput
              style={[styles.input, styles.textArea, { backgroundColor: isDarkMode ? '#2C2C2C' : '#FFFFFF', color: isDarkMode ? '#FFFFFF' : '#333' }]}
              value={vacunaData.observaciones}
              onChangeText={(text) => setVacunaData({...vacunaData, observaciones: text})}
              placeholder="Ingrese observaciones adicionales"
              placeholderTextColor={isDarkMode ? '#888' : '#666'}
              multiline
              numberOfLines={4}
            />
          </View>
        </View>
      </ScrollView>
    );
  };

  // Dentro del componente principal, reemplazamos la función renderForm
  const renderForm = () => {
    if (!formType) return null;

    const commonFields = (
      <View style={styles.dateContainer}>
        <Text style={[styles.label, { color: isDarkMode ? '#FFFFFF' : '#2D3748', fontSize: 22 }]}>Fecha del registro</Text>
        <TextInputMask
          type={'datetime'}
          options={{ format: 'DD/MM/YYYY' }}
          value={selectedDate}
          onChangeText={setSelectedDate}
          style={[styles.input, { backgroundColor: isDarkMode ? '#2C2C2C' : '#FFFFFF', color: isDarkMode ? '#FFFFFF' : '#2D3748' }]}
          placeholder="dd/mm/aaaa"
          placeholderTextColor={isDarkMode ? '#888' : '#4A5568'}
          keyboardType="numeric"
        />
        
        <View style={{ marginTop: 20, marginBottom: 12 }}>
          <Text style={[styles.label, { color: isDarkMode ? '#FFFFFF' : '#2D3748', fontSize: 20 }]}>Documentación</Text>
        </View>
        
        <View style={{ flexDirection: 'column', gap: 16 }}>
          <TouchableOpacity 
            style={[styles.accessibleButton, { 
              backgroundColor: isDarkMode ? '#1A365D' : '#1A365D',
              borderColor: isDarkMode ? '#2D3748' : '#1A365D' 
            }]} 
            onPress={() => handlePickFile(formType)}
          >
            <Ionicons name="attach" size={24} color="#FFFFFF" />
            <Text style={[styles.accessibleButtonText, { color: '#FFFFFF' }]}>Adjuntar archivo</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.accessibleButton, { 
              backgroundColor: isDarkMode ? '#1A365D' : '#1A365D',
              borderColor: isDarkMode ? '#2D3748' : '#1A365D' 
            }]} 
            onPress={() => handleTakePhoto(formType)}
          >
            <Ionicons name="camera" size={24} color="#FFFFFF" />
            <Text style={[styles.accessibleButtonText, { color: '#FFFFFF' }]}>Tomar foto</Text>
          </TouchableOpacity>
        </View>
        
        {formType === 'vacuna' && renderFiles(vacunaFiles)}
        {formType === 'estudio' && renderFiles(estudioFiles)}
        {formType === 'consulta' && renderFiles(consultaFiles)}
      </View>
    );

    switch (formType) {
      case 'vacuna':
        return renderVacunaForm(isDarkMode, commonFields, vacunaData, setVacunaData, vacunaFiles);
      case 'estudio':
        return (
          <ScrollView style={styles.formContainer}>
            {commonFields}
            <View style={styles.formSection}>
              <Text style={[styles.sectionTitle, { color: isDarkMode ? '#FFFFFF' : '#333' }]}>
                Información del Estudio
              </Text>
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: isDarkMode ? '#FFFFFF' : '#333' }]}>Tipo de estudio</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: isDarkMode ? '#2C2C2C' : '#FFFFFF', color: isDarkMode ? '#FFFFFF' : '#333' }]}
                  value={estudioData.tipo}
                  onChangeText={(text) => setEstudioData({...estudioData, tipo: text})}
                  placeholder="Ingrese el tipo de estudio"
                  placeholderTextColor={isDarkMode ? '#888' : '#666'}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: isDarkMode ? '#FFFFFF' : '#333' }]}>Resultado</Text>
                <TextInput
                  style={[styles.input, styles.textArea, { backgroundColor: isDarkMode ? '#2C2C2C' : '#FFFFFF', color: isDarkMode ? '#FFFFFF' : '#333' }]}
                  value={estudioData.resultado}
                  onChangeText={(text) => setEstudioData({...estudioData, resultado: text})}
                  placeholder="Ingrese el resultado"
                  placeholderTextColor={isDarkMode ? '#888' : '#666'}
                  multiline
                  numberOfLines={4}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: isDarkMode ? '#FFFFFF' : '#333' }]}>Médico</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: isDarkMode ? '#2C2C2C' : '#FFFFFF', color: isDarkMode ? '#FFFFFF' : '#333' }]}
                  value={estudioData.medico}
                  onChangeText={(text) => setEstudioData({...estudioData, medico: text})}
                  placeholder="Ingrese el nombre del médico"
                  placeholderTextColor={isDarkMode ? '#888' : '#666'}
                />
              </View>
            </View>
          </ScrollView>
        );

      case 'consulta':
        return (
          <ScrollView style={styles.formContainer}>
            {commonFields}
            <View style={styles.formSection}>
              <Text style={[styles.sectionTitle, { color: isDarkMode ? '#FFFFFF' : '#333' }]}>
                Información de la Consulta
              </Text>
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: isDarkMode ? '#FFFFFF' : '#333' }]}>Médico</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: isDarkMode ? '#2C2C2C' : '#FFFFFF', color: isDarkMode ? '#FFFFFF' : '#333' }]}
                  value={consultaData.medico}
                  onChangeText={(text) => setConsultaData({...consultaData, medico: text})}
                  placeholder="Ingrese el nombre del médico"
                  placeholderTextColor={isDarkMode ? '#888' : '#666'}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: isDarkMode ? '#FFFFFF' : '#333' }]}>Diagnóstico</Text>
                <TextInput
                  style={[styles.input, styles.textArea, { backgroundColor: isDarkMode ? '#2C2C2C' : '#FFFFFF', color: isDarkMode ? '#FFFFFF' : '#333' }]}
                  value={consultaData.diagnostico}
                  onChangeText={(text) => setConsultaData({...consultaData, diagnostico: text})}
                  placeholder="Ingrese el diagnóstico"
                  placeholderTextColor={isDarkMode ? '#888' : '#666'}
                  multiline
                  numberOfLines={4}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: isDarkMode ? '#FFFFFF' : '#333' }]}>Receta</Text>
                <TextInput
                  style={[styles.input, styles.textArea, { backgroundColor: isDarkMode ? '#2C2C2C' : '#FFFFFF', color: isDarkMode ? '#FFFFFF' : '#333' }]}
                  value={consultaData.receta}
                  onChangeText={(text) => setConsultaData({...consultaData, receta: text})}
                  placeholder="Ingrese la receta"
                  placeholderTextColor={isDarkMode ? '#888' : '#666'}
                  multiline
                  numberOfLines={4}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: isDarkMode ? '#FFFFFF' : '#333' }]}>Observaciones</Text>
                <TextInput
                  style={[styles.input, styles.textArea, { backgroundColor: isDarkMode ? '#2C2C2C' : '#FFFFFF', color: isDarkMode ? '#FFFFFF' : '#333' }]}
                  value={consultaData.observaciones}
                  onChangeText={(text) => setConsultaData({...consultaData, observaciones: text})}
                  placeholder="Ingrese observaciones"
                  placeholderTextColor={isDarkMode ? '#888' : '#666'}
                  multiline
                  numberOfLines={4}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: isDarkMode ? '#FFFFFF' : '#333' }]}>Estudios recomendados</Text>
                <TextInput
                  style={[styles.input, styles.textArea, { backgroundColor: isDarkMode ? '#2C2C2C' : '#FFFFFF', color: isDarkMode ? '#FFFFFF' : '#333' }]}
                  value={consultaData.estudios_recomendados}
                  onChangeText={(text) => setConsultaData({...consultaData, estudios_recomendados: text})}
                  placeholder="Ingrese estudios recomendados"
                  placeholderTextColor={isDarkMode ? '#888' : '#666'}
                  multiline
                  numberOfLines={4}
                />
              </View>
            </View>
          </ScrollView>
        );
    }
  };

  // Nueva función para guardar el registro con validación y mejor manejo de errores
  const handleSubmit = async () => {
    try {
      // Mostrar indicador de carga
      setLoading(true);
      
      // Validar fecha
      if (!selectedDate || selectedDate.trim() === '') {
        // Fecha por defecto en formato DD/MM/YYYY
        const today = new Date();
        const day = String(today.getDate()).padStart(2, '0');
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const year = today.getFullYear();
        setSelectedDate(`${day}/${month}/${year}`);
      }

      let files: FileItem[] = [];
      let endpoint = '';
      let payload: Record<string, any> = {};
      let fieldName = '';
      
      // Convertir formato de fecha para la API
      const apiDate = convertDateFormat(selectedDate);
      
      if (formType === 'vacuna') {
        files = vacunaFiles;
        endpoint = '/api/vacunas';
        fieldName = 'archivo_adjunto';
        
        // Validar que se haya seleccionado una vacuna de la lista permitida
        if (!vacunaData.nombre || !VACUNAS_PERMITIDAS.includes(vacunaData.nombre)) {
          Alert.alert('Error', 'Por favor selecciona una vacuna de la lista');
          setLoading(false);
          return;
        }
        
        // Validar dosis
        if (!vacunaData.dosis || !DOSIS_PERMITIDAS.includes(vacunaData.dosis)) {
          Alert.alert('Error', 'Por favor selecciona una dosis válida de la lista');
          setLoading(false);
          return;
        }
        
        payload = {
          fecha: apiDate,
          nombre: vacunaData.nombre,
          dosis: vacunaData.dosis,
          lote: vacunaData.lote || 'No especificado',
          via_administracion: vacunaData.via_administracion || '',
          sitio_aplicacion: vacunaData.sitio_aplicacion || 'No especificado',
          observaciones: vacunaData.observaciones || 'Sin observaciones',
        };
      } else if (formType === 'estudio') {
        files = estudioFiles;
        endpoint = '/api/estudios';
        fieldName = 'documento_adjunto';
        
        // Validar campos obligatorios para estudios
        if (!estudioData.tipo || estudioData.tipo.trim() === '') {
          Alert.alert('Error', 'El tipo de estudio es obligatorio');
          setLoading(false);
          return;
        }
        
        payload = {
          fecha: apiDate,
          tipo: estudioData.tipo,
          resultado: estudioData.resultado || 'Pendiente',
          medico: estudioData.medico || '',
        };
      } else if (formType === 'consulta') {
        files = consultaFiles;
        endpoint = '/api/consultas';
        fieldName = 'archivos_adjuntos';
        
        // Validar campos obligatorios para consultas
        if (!consultaData.medico || consultaData.medico.trim() === '') {
          Alert.alert('Error', 'El nombre del médico es obligatorio');
          setLoading(false);
          return;
        }
        
        payload = {
          fecha_consulta: apiDate,
          medico: consultaData.medico,
          diagnostico: consultaData.diagnostico || '',
          receta: consultaData.receta || 'Sin receta',
          observaciones: consultaData.observaciones || 'Sin observaciones',
          estudios_recomendados: consultaData.estudios_recomendados || 'Ninguno',
        };
      } else {
        Alert.alert('Error', 'Por favor selecciona un tipo de registro');
        setLoading(false);
        return;
      }

      // Obtener token JWT
      console.log('Iniciando login con Strapi');
      const jwt = await strapiLogin();
      console.log('Login exitoso, JWT obtenido');

      // Primero crear el registro en Strapi
      console.log(`Creando registro en ${endpoint} con datos:`, payload);
      const res = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${jwt}`,
        },
        body: JSON.stringify({ data: payload }),
      });
      
      if (!res.ok) {
        const errorText = await res.text();
        console.error(`Error al crear registro (${res.status}):`, errorText);
        throw new Error(`Error al crear registro: ${res.status} ${res.statusText}`);
      }
      
      const responseData = await res.json();
      console.log('Registro creado:', responseData);
      
      // Extraer el ID del registro creado
      const entryId = responseData?.data?.id;
      if (!entryId) {
        throw new Error('No se pudo obtener el ID del registro creado');
      }
      
      console.log(`Registro creado con ID: ${entryId}`);
      
      // Si hay archivos adjuntos, subirlos
      if (files.length > 0) {
        console.log(`Subiendo ${files.length} archivos para ${formType} con ID ${entryId}`);
        
        try {
          // Primero intentar con nuestro servicio completo
          const strapiCollection = formType; // 'vacuna', 'estudio' o 'consulta'
          const success = await fileUploadService.uploadAndLinkFiles(
            files, 
            entryId, 
            strapiCollection, 
            fieldName, 
            jwt
          );
          
          if (success) {
            console.log(`✅ Archivos subidos y vinculados correctamente`);
          } else {
            console.warn('⚠️ Intentando método básico como última opción');
            
            // Como último recurso, intentar la subida básica
            const basicUploadSuccess = await uploadFilesSimple(files[0], jwt, entryId, strapiCollection, fieldName);
            
            if (basicUploadSuccess) {
              console.log('✅ Subida básica exitosa');
              Alert.alert(
                'Información', 
                'El registro se guardó correctamente. Se subió al menos un archivo, pero es posible que necesites vincularlos manualmente en el panel admin.'
              );
            } else {
              console.error('❌ Todos los métodos de subida fallaron');
              
              // Intentar el último recurso: base64
              if (files.length > 0) {
                console.log('Intentando último recurso: subida base64');
                const base64Success = await uploadBase64(files[0].uri, jwt);
                
                if (base64Success) {
                  console.log('✅ Subida base64 exitosa');
                  Alert.alert(
                    'Información', 
                    'El registro se guardó correctamente. Se subió un archivo usando un método alternativo.'
                  );
                } else {
                  Alert.alert(
                    'Advertencia', 
                    'El registro se guardó correctamente, pero no se pudieron subir los archivos adjuntos. Es posible que haya un problema en el servidor.'
                  );
                }
              } else {
                Alert.alert(
                  'Advertencia', 
                  'El registro se guardó correctamente, pero no se pudieron subir los archivos adjuntos. Es posible que haya un problema en el servidor.'
                );
              }
            }
          }
        } catch (uploadError) {
          console.error('Error al subir archivos:', uploadError);
          
          // Intentar método básico como último recurso
          console.warn('⚠️ Error en método principal, intentando subida básica');
          const strapiCollection = formType;
          const basicSuccess = await uploadFilesSimple(files[0], jwt, entryId, strapiCollection, fieldName);
          
          if (basicSuccess) {
            console.log('✅ Subida básica exitosa después de error');
            Alert.alert(
              'Información', 
              'El registro se guardó correctamente. Se subió un archivo, pero podría ser necesario vincularlos manualmente.'
            );
          } else {
            Alert.alert(
              'Advertencia', 
              'El registro se guardó correctamente, pero hubo un problema al subir los archivos adjuntos.'
            );
          }
        }
      }
      
      // Mostrar mensaje de éxito
      Alert.alert('¡Éxito!', 'Registro guardado correctamente');
      
      // Limpiar formulario
      setFormType(null);
      setVacunaFiles([]);
      setEstudioFiles([]);
      setConsultaFiles([]);
      setSelectedDate('');
      setVacunaData({
        nombre: '',
        dosis: '',
        lote: '',
        via_administracion: '',
        sitio_aplicacion: '',
        observaciones: ''
      });
      setEstudioData({
        tipo: '',
        resultado: '',
        medico: ''
      });
      setConsultaData({
        medico: '',
        diagnostico: '',
        receta: '',
        observaciones: '',
        estudios_recomendados: ''
      });
    } catch (error: any) {
      console.error('Error en handleSubmit:', error.message);
      Alert.alert('Error', `No se pudo guardar el registro: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Agregar nueva función para renderizar las instrucciones
  const renderInstructions = () => {
    const { theme } = useTheme();
    const isDarkMode = theme === 'Oscuro';
    
    return (
      <ScrollView style={styles.instructionsContainer}>
        <View style={[styles.instructionsCard, { 
          backgroundColor: isDarkMode ? 'rgba(45, 55, 72, 0.3)' : '#FFFFFF',
          borderLeftWidth: 8,
          borderLeftColor: '#1A365D'
        }]}>
          <View style={styles.instructionsHeader}>
            <Ionicons name="information-circle" size={32} color={isDarkMode ? '#4299E1' : '#1A365D'} />
            <Text style={[styles.instructionsTitle, { color: isDarkMode ? '#FFFFFF' : '#1A365D' }]}>
              Instrucciones de Uso
            </Text>
          </View>
          
          <View style={styles.instructionsContent}>
            <Text style={[styles.instructionsText, { color: isDarkMode ? '#E2E8F0' : '#2D3748' }]}>
              Esta sección te permite guardar registros médicos de tres tipos diferentes:
            </Text>
            
            <View style={styles.instructionStep}>
              <View style={[styles.instructionIcon, { backgroundColor: isDarkMode ? 'rgba(45, 55, 72, 0.5)' : 'rgba(26, 54, 93, 0.1)' }]}>
                <Text style={[styles.instructionNumber, { color: isDarkMode ? '#4299E1' : '#1A365D' }]}>1</Text>
              </View>
              <View style={styles.instructionStepContent}>
                <Text style={[styles.instructionStepTitle, { color: isDarkMode ? '#FFFFFF' : '#1A365D' }]}>
                  Selecciona el tipo de registro
                </Text>
                <Text style={[styles.instructionStepText, { color: isDarkMode ? '#E2E8F0' : '#4A5568' }]}>
                  Elige entre Vacuna, Estudio o Consulta usando las pestañas de arriba según lo que necesites registrar.
                </Text>
              </View>
            </View>
            
            <View style={styles.instructionStep}>
              <View style={[styles.instructionIcon, { backgroundColor: isDarkMode ? 'rgba(45, 55, 72, 0.5)' : 'rgba(26, 54, 93, 0.1)' }]}>
                <Text style={[styles.instructionNumber, { color: isDarkMode ? '#4299E1' : '#1A365D' }]}>2</Text>
              </View>
              <View style={styles.instructionStepContent}>
                <Text style={[styles.instructionStepTitle, { color: isDarkMode ? '#FFFFFF' : '#1A365D' }]}>
                  Completa el formulario
                </Text>
                <Text style={[styles.instructionStepText, { color: isDarkMode ? '#E2E8F0' : '#4A5568' }]}>
                  Rellena los campos solicitados. La fecha se registra automáticamente con la fecha actual si no la especificas.
                </Text>
              </View>
            </View>
            
            <View style={styles.instructionStep}>
              <View style={[styles.instructionIcon, { backgroundColor: isDarkMode ? 'rgba(45, 55, 72, 0.5)' : 'rgba(26, 54, 93, 0.1)' }]}>
                <Text style={[styles.instructionNumber, { color: isDarkMode ? '#4299E1' : '#1A365D' }]}>3</Text>
              </View>
              <View style={styles.instructionStepContent}>
                <Text style={[styles.instructionStepTitle, { color: isDarkMode ? '#FFFFFF' : '#1A365D' }]}>
                  Adjunta documentos (opcional)
                </Text>
                <Text style={[styles.instructionStepText, { color: isDarkMode ? '#E2E8F0' : '#4A5568' }]}>
                  Puedes añadir archivos desde tu dispositivo o tomar fotos con la cámara para incluirlas en el registro.
                </Text>
              </View>
            </View>
            
            <View style={styles.instructionStep}>
              <View style={[styles.instructionIcon, { backgroundColor: isDarkMode ? 'rgba(45, 55, 72, 0.5)' : 'rgba(26, 54, 93, 0.1)' }]}>
                <Text style={[styles.instructionNumber, { color: isDarkMode ? '#4299E1' : '#1A365D' }]}>4</Text>
              </View>
              <View style={styles.instructionStepContent}>
                <Text style={[styles.instructionStepTitle, { color: isDarkMode ? '#FFFFFF' : '#1A365D' }]}>
                  Guarda tu registro
                </Text>
                <Text style={[styles.instructionStepText, { color: isDarkMode ? '#E2E8F0' : '#4A5568' }]}>
                  Utiliza el botón "Guardar" que aparecerá en la parte inferior cuando hayas seleccionado un tipo de registro.
                </Text>
              </View>
            </View>
            
            <View style={[styles.instructionTip, { backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(26, 54, 93, 0.06)' }]}>
              <Ionicons name="bulb" size={24} color={isDarkMode ? '#4299E1' : '#1A365D'} style={{ marginRight: 10 }} />
              <Text style={[styles.instructionTipText, { color: isDarkMode ? '#E2E8F0' : '#4A5568' }]}>
                Todos tus registros se sincronizan con tu expediente médico y estarán disponibles para compartir con tu médico cuando lo necesites.
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    );
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: isDarkMode ? '#121212' : '#F0F0F0' }]}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: isDarkMode ? '#FFFFFF' : '#333' }]}>
            Aethrad
          </Text>
          <Text style={[styles.headerSubtitle, { color: isDarkMode ? '#E2E8F0' : '#4A5568' }]}>
            Tu historial en tu bolsillo
          </Text>
          {!formType && (
            <Text style={[styles.instructionText, { color: isDarkMode ? '#CBD5E0' : '#718096', marginTop: 12 }]}>
              Selecciona una opción para comenzar
            </Text>
          )}
        </View>

        {/* TABS */}
        <View style={styles.tabsContainer}>
          <TouchableOpacity 
            style={[
              styles.tab, 
              formType === 'vacuna' && styles.selectedTab, 
              { borderTopLeftRadius: 25, borderBottomLeftRadius: 25 }
            ]}
            onPress={() => setFormType('vacuna')}
          >
            <Ionicons 
              name="medical" 
              size={20} 
              color={formType === 'vacuna' ? '#FFFFFF' : '#666'} 
              style={styles.buttonIcon}
            />
            <Text style={[styles.tabText, formType === 'vacuna' && styles.selectedTabText]}>Vacuna</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tab, formType === 'estudio' && styles.selectedTab]}
            onPress={() => setFormType('estudio')}
          >
            <Ionicons 
              name="document-text" 
              size={20} 
              color={formType === 'estudio' ? '#FFFFFF' : '#666'} 
              style={styles.buttonIcon}
            />
            <Text style={[styles.tabText, formType === 'estudio' && styles.selectedTabText]}>Estudio</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tab, formType === 'consulta' && styles.selectedTab, { borderTopRightRadius: 25, borderBottomRightRadius: 25 }]}
            onPress={() => setFormType('consulta')}
          >
            <Ionicons 
              name="person" 
              size={20} 
              color={formType === 'consulta' ? '#FFFFFF' : '#666'} 
              style={styles.buttonIcon}
            />
            <Text style={[styles.tabText, formType === 'consulta' && styles.selectedTabText]}>Consulta</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.formWrapper}>
          {formType ? renderForm() : renderInstructions()}
        </View>

        {formType && (
          <View style={styles.floatingButtonContainer}>
            <TouchableOpacity 
              style={styles.submitButton}
              onPress={handleSubmit}
            >
              <Ionicons name="save" size={20} color="#FFFFFF" style={styles.buttonIcon} />
              <Text style={styles.submitButtonText}>Guardar</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Agregar indicador de carga global si está procesando */}
        {loading && (
          <View style={styles.loadingOverlay}>
            <View style={styles.loadingBox}>
              <Text style={styles.loadingText}>Guardando...</Text>
            </View>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    padding: 24,
  },
  header: {
    marginBottom: 28,
  },
  headerTitle: {
    fontSize: 36,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    fontSize: 20,
    marginTop: 6,
    fontWeight: '500',
  },
  instructionText: {
    fontSize: 16,
    fontWeight: '400',
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#E0E0E0',
    borderRadius: 28,
    overflow: 'hidden',
    marginBottom: 28,
    height: 60,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    backgroundColor: 'transparent',
  },
  selectedTab: {
    backgroundColor: '#1A365D',
  },
  tabText: {
    color: '#4A5568',
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 10,
  },
  selectedTabText: {
    color: '#FFFFFF',
  },
  buttonIcon: {
    marginRight: 6,
    fontSize: 22,
  },
  formContainer: {
    flex: 1,
  },
  formSection: {
    marginBottom: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 22,
  },
  label: {
    fontSize: 18,
    marginBottom: 10,
    fontWeight: '500',
  },
  input: {
    borderWidth: 1.5,
    borderColor: '#CCCCCC',
    borderRadius: 14,
    padding: 16,
    fontSize: 18,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    minHeight: 54,
  },
  textArea: {
    height: 140,
    textAlignVertical: 'top',
  },
  dateContainer: {
    marginBottom: 28,
  },
  formWrapper: {
    flex: 1,
    marginBottom: 100,
  },
  floatingButtonContainer: {
    position: 'absolute',
    bottom: 120,
    left: 24,
    right: 24,
    alignItems: 'center',
    zIndex: 10,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1A365D',
    padding: 18,
    borderRadius: 16,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 8,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  accessibleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderWidth: 0,
    minHeight: 60,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  accessibleButtonText: {
    fontWeight: 'bold',
    marginLeft: 12,
    fontSize: 18,
  },
  fileItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    padding: 10,
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#DDDDDD',
  },
  largeIcon: {
    fontSize: 28,
  },
  alertTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  alertMessage: {
    fontSize: 18,
    lineHeight: 24,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  loadingBox: {
    backgroundColor: '#FFF',
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 200,
  },
  loadingText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  pickerContainer: {
    borderWidth: 1.5,
    borderColor: '#CCCCCC',
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  picker: {
    height: 58,
    width: '100%',
    fontSize: 18,
  },
  instructionsContainer: {
    flex: 1,
    padding: 16,
  },
  instructionsCard: {
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  instructionsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  instructionsTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginLeft: 12,
  },
  instructionsContent: {
    marginBottom: 16,
  },
  instructionsText: {
    fontSize: 18,
    lineHeight: 26,
    marginBottom: 24,
  },
  instructionStep: {
    flexDirection: 'row',
    marginBottom: 24,
  },
  instructionIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    marginTop: 2,
  },
  instructionNumber: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  instructionStepContent: {
    flex: 1,
  },
  instructionStepTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  instructionStepText: {
    fontSize: 16,
    lineHeight: 22,
  },
  instructionTip: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  instructionTipText: {
    fontSize: 16,
    flex: 1,
    lineHeight: 22,
  },
});