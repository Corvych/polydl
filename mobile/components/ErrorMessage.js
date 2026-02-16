import React from "react";

import { View, Text, StyleSheet } from "react-native";
import colors from "../constants/colors";

export default function ErrorMessage({ message }) {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
  text: {
    color: colors.danger,
    fontSize: 16,
  },
});
