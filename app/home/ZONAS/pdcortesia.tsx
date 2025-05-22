import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Platform,
  Dimensions,
} from "react-native";
import { useTheme } from "../../themecontext";

export default function PDCortesia() {
  const { theme } = useTheme();
  const isDarkMode = theme === "Oscuro";

  const [nombre, setNombre] = useState("");
  const [apellido, setApellido] = useState("");
  const [telefono, setTelefono] = useState("");
  const [email, setEmail] = useState("");
  const [procedencia, setProcedencia] = useState("");
  const [referido, setReferido] = useState("");
  const [asesorTelefono, setAsesorTelefono] = useState("");

  const handleSubmit = () => {
    console.log({
      nombre,
      apellido,
      telefono,
      email,
      procedencia,
      referido,
      asesorTelefono,
    });
  };

  const windowHeight = Dimensions.get("window").height;

  return (
    <SafeAreaView
      style={[
        styles.container,
        { backgroundColor: isDarkMode ? "#121212" : "#F9F9F9" },
      ]}
    >
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: windowHeight * 0.2 },
        ]}
      >
        <Text
          style={[
            styles.headerTitle,
            { color: isDarkMode ? "#FFFFFF" : "#222222" },
          ]}
        >
          Pase de Cortesía
        </Text>

        <View
          style={[styles.card, { backgroundColor: isDarkMode ? "#1E1E1E" : "#FFFFFF" }]}
        >
          <Text style={[styles.title, { color: isDarkMode ? "#FFFFFF" : "#000" }]}>
            Información Personal
          </Text>
          <View style={styles.line} />

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Nombre</Text>
            <TextInput
              placeholder="Ingresa tu nombre"
              placeholderTextColor={isDarkMode ? "#AAA" : "#888"}
              value={nombre}
              onChangeText={setNombre}
              style={[
                styles.input,
                { backgroundColor: isDarkMode ? "#333" : "#FFFFFF" },
              ]}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Apellido</Text>
            <TextInput
              placeholder="Ingresa tu apellido"
              placeholderTextColor={isDarkMode ? "#AAA" : "#888"}
              value={apellido}
              onChangeText={setApellido}
              style={[
                styles.input,
                { backgroundColor: isDarkMode ? "#333" : "#FFFFFF" },
              ]}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Número de teléfono</Text>
            <TextInput
              placeholder="Ingresa tu teléfono"
              placeholderTextColor={isDarkMode ? "#AAA" : "#888"}
              value={telefono}
              onChangeText={setTelefono}
              keyboardType="phone-pad"
              style={[
                styles.input,
                { backgroundColor: isDarkMode ? "#333" : "#FFFFFF" },
              ]}
            />
          </View>
        </View>

        <View
          style={[styles.card, { backgroundColor: isDarkMode ? "#1E1E1E" : "#FFFFFF" }]}
        >
          <Text style={[styles.title, { color: isDarkMode ? "#FFFFFF" : "#000" }]}>
            Información de Contacto
          </Text>
          <View style={styles.line} />

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Correo Electrónico</Text>
            <TextInput
              placeholder="correo@ejemplo.com"
              placeholderTextColor={isDarkMode ? "#AAA" : "#888"}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              style={[
                styles.input,
                { backgroundColor: isDarkMode ? "#333" : "#FFFFFF" },
              ]}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Procedencia</Text>
            <TextInput
              placeholder="Evento, Amigo, etc."
              placeholderTextColor={isDarkMode ? "#AAA" : "#888"}
              value={procedencia}
              onChangeText={setProcedencia}
              style={[
                styles.input,
                { backgroundColor: isDarkMode ? "#333" : "#FFFFFF" },
              ]}
            />
          </View>
        </View>

        <View
          style={[styles.card, { backgroundColor: isDarkMode ? "#1E1E1E" : "#FFFFFF" }]}
        >
          <Text style={[styles.title, { color: isDarkMode ? "#FFFFFF" : "#000" }]}>
            Información del Referido
          </Text>
          <View style={styles.line} />

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Referido</Text>
            <TextInput
              placeholder="Nombre del referido"
              placeholderTextColor={isDarkMode ? "#AAA" : "#888"}
              value={referido}
              onChangeText={setReferido}
              style={[
                styles.input,
                { backgroundColor: isDarkMode ? "#333" : "#FFFFFF" },
              ]}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Teléfono del Asesor</Text>
            <TextInput
              placeholder="Teléfono del asesor"
              placeholderTextColor={isDarkMode ? "#AAA" : "#888"}
              value={asesorTelefono}
              onChangeText={setAsesorTelefono}
              keyboardType="phone-pad"
              style={[
                styles.input,
                { backgroundColor: isDarkMode ? "#333" : "#FFFFFF" },
              ]}
            />
          </View>
        </View>

       
        <TouchableOpacity
          style={[
            styles.button,
            { backgroundColor: isDarkMode ? "#1E90FF" : "#007BFF" },
          ]}
          onPress={handleSubmit}
        >
          <Text style={styles.buttonText}>Enviar</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: Platform.OS === "android" ? 40 : 20,
  },
  scrollContent: {
    paddingHorizontal: 10,
  },
  headerTitle: {
    
    fontSize: 26,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "left",
  },
  card: {
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 5,
  },
  title: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 10,
  },
  line: {
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
    marginVertical: 10,
  },
  inputGroup: {
    marginBottom: 15,
  },
  label: {
    fontSize: 14,
    marginBottom: 5,
    color: "#666",
  },
  input: {
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 14,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  button: {
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: "center",
    marginTop: 10,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },
});