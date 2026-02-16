import React, { useEffect, useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
} from "react-native";
import { format } from "date-fns";
import { AntDesign } from "@expo/vector-icons";

import colors from "../constants/colors";
import DeadlineCard from "../components/DeadlineCard";
import FloatingButton from "../components/FloatingButton";
import Loader from "../components/Loader";
import ErrorMessage from "../components/ErrorMessage";
import api from "../services/api";

export default function DashboardScreen() {
  const [deadlines, setDeadlines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const now = new Date();

  const activeDeadlines = useMemo(
    () =>
      deadlines.filter(
        (d) => !d.is_completed && new Date(d.ts_due) >= now
      ),
    [deadlines]
  );

  const expiredDeadlines = useMemo(
    () =>
      deadlines.filter(
        (d) => !d.is_completed && new Date(d.ts_due) < now
      ),
    [deadlines]
  );

  useEffect(() => {
    fetchDeadlines();
  }, []);

  const fetchDeadlines = async () => {
    try {
      const res = await api.get("/deadlines");
      setDeadlines(res.data);
    } catch (err) {
      setError("Failed to load deadlines");
    } finally {
      setLoading(false);
    }
  };

  const toggleComplete = async (deadline) => {
    const updated = deadlines.map((d) =>
      d.id === deadline.id
        ? { ...d, is_completed: !d.is_completed }
        : d
    );

    setDeadlines(updated);

    try {
      await api.put(`/deadlines/${deadline.id}`, {
        is_completed: !deadline.is_completed,
      });
    } catch {
      fetchDeadlines(); // revert on failure
    }
  };

  if (loading) return <Loader />;
  if (error) return <ErrorMessage message={error} />;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Dashboard</Text>
      <Text style={styles.subtitle}>
        {format(new Date(), "EEEE, MMM d yyyy")}
      </Text>

      <Text style={styles.sectionTitle}>Upcoming</Text>

      <FlatList
        data={activeDeadlines}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <DeadlineCard
            deadline={item}
            onComplete={() => toggleComplete(item)}
          />
        )}
      />

      {expiredDeadlines.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>Expired</Text>
          <FlatList
            data={expiredDeadlines}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <DeadlineCard
                deadline={item}
                expired
                onComplete={() => toggleComplete(item)}
              />
            )}
          />
        </>
      )}

      <FloatingButton onPress={() => console.log("Create new")} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: colors.textPrimary,
  },
  subtitle: {
    color: colors.textSecondary,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginVertical: 15,
    color: colors.textPrimary,
  },
});
