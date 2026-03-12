import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { format } from "date-fns";
import { AntDesign } from "@expo/vector-icons";
import colors from "../constants/colors";

export default function DeadlineCard({
  deadline,
  onComplete,
  expired = false,
  urgency = 'normal',
}) {
  const getGradientColors = () => {
    if (expired) {
      return ['#374151', '#1f2937']; // Muted gray to dark gray
    }

    if (deadline.is_completed) {
      return ['#334155', '#0f172a']; // Muted slate to darkest slate
    }

    switch (urgency) {
      case 'critical': // < 1 day - muted red to black
        return ['#991b1b', '#000000']; // Dark red (less saturated) to black
      case 'warning': // < 1 week - muted orange to black
        return ['#9a3412', '#000000']; // Dark orange/rust (less saturated) to black
      case 'normal': // > 1 week - muted green to black
        return ['#166534', '#000000']; // Dark green (less saturated) to black
      default:
        return [colors.surface, '#000000'];
    }
  };

  const gradientColors = getGradientColors();

  return (
    <LinearGradient
      colors={gradientColors}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={styles.card}
    >
      <View style={styles.header}>
        <Text style={styles.subject}>
          {deadline.subject?.name || "Personal"}
        </Text>

        {deadline.is_completed && (
          <AntDesign name="checkcircle" size={18} color={colors.primary} />
        )}
      </View>

      <Text
        style={[
          styles.name,
          deadline.is_completed && styles.completed,
          { color: '#ffffff' }, // White text for better contrast
        ]}
      >
        {deadline.name}
      </Text>

      <Text style={[styles.date, { color: '#ffffff' }]}>
        {format(new Date(deadline.ts_due), "MMM d, HH:mm")}
      </Text>

      {!expired && (
        <TouchableOpacity
          style={styles.transparentButton}
          onPress={onComplete}
        >
          <Text style={[styles.buttonText, { color: '#ffffff' }]}>
            {deadline.is_completed ? "Undo" : "Done"}
          </Text>
        </TouchableOpacity>
      )}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  subject: {
    fontSize: 12,
    color: '#d1d5db', // Light gray for subject
    fontWeight: "bold",
  },
  name: {
    fontSize: 18,
    fontWeight: "bold",
    marginVertical: 10,
  },
  completed: {
    textDecorationLine: "line-through",
    color: colors.gray,
  },
  date: {
    color: colors.textSecondary,
    marginBottom: 10,
  },
  button: {
    backgroundColor: colors.primary,
    padding: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  transparentButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)', // 80% transparent white
    padding: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  buttonText: {
    color: "white",
    fontWeight: "bold",
  },
});
