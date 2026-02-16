import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { format } from "date-fns";
import { AntDesign } from "@expo/vector-icons";
import colors from "../constants/colors";

export default function DeadlineCard({
  deadline,
  onComplete,
  expired = false,
}) {
  return (
    <View
      style={[
        styles.card,
        expired && { backgroundColor: "#f3f4f6" },
      ]}
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
        ]}
      >
        {deadline.name}
      </Text>

      <Text style={styles.date}>
        {format(new Date(deadline.ts_due), "MMM d, HH:mm")}
      </Text>

      {!expired && (
        <TouchableOpacity
          style={styles.button}
          onPress={onComplete}
        >
          <Text style={styles.buttonText}>
            {deadline.is_completed ? "Undo" : "Done"}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
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
    color: colors.gray,
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
  buttonText: {
    color: "white",
    fontWeight: "bold",
  },
});
