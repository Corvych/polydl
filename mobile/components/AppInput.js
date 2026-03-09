import React from "react";
import { View, Text, TextInput, StyleSheet } from "react-native";
import colors from "../constants/colors";

export default function AppInput({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry = false,
  editable = true,
  style,
}) {
  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}

      <TextInput
        style={[styles.input, !editable && styles.disabled, style]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        secureTextEntry={secureTextEntry}
        editable={editable}
        placeholderTextColor="#999"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    marginBottom: 16,
  },
  label: {
    marginBottom: 6,
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    color: "#ddd",
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
  },
  disabled: {
    backgroundColor: "#f3f4f6",
    color: "#999",
  },
});
