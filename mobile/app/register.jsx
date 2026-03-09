import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import colors from "../constants/colors";
// import useAuth from "../hooks/useAuth";

const RegisterScreen = () => {
//   const { register } = useAuth();
  const params = useLocalSearchParams();
  const inviteCodeFromUrl = params?.code || "";

  const [formData, setFormData] = useState({
    name: "",
    surname: "",
    username: "",
    password: "",
    invite_code: inviteCodeFromUrl,
  });

  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Update invite code if it changes
  useEffect(() => {
    if (inviteCodeFromUrl) {
      setFormData((prev) => ({ ...prev, invite_code: inviteCodeFromUrl }));
    }
  }, [inviteCodeFromUrl]);

  const handleSubmit = async () => {
    setError("");
    setIsLoading(true);

    try {
      const result = await register(formData);
      if (result.success) {
        router.replace("/main/home");
      } else {
        setError(result.error || "Registration failed");
      }
    } catch (err) {
      setError("Registration failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.wrapper}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.iconCircle}>
            <Text style={styles.iconText}>👤</Text>
          </View>
          <Text style={styles.title}>Register</Text>
          <Text style={styles.subtitle}>Create your account</Text>
        </View>

        {/* Error */}
        {error !== "" && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* Name & Surname */}
        <TextInput
          style={[styles.input]}
          placeholder="First Name"
          value={formData.name}
          onChangeText={(text) => setFormData({ ...formData, name: text })}
        />
        <TextInput
          style={[styles.input]}
          placeholder="Last Name"
          value={formData.surname}
          onChangeText={(text) =>
            setFormData({ ...formData, surname: text })
          }
        />

        {/* Username */}
        <TextInput
          style={styles.input}
          placeholder="Username"
          value={formData.username}
          onChangeText={(text) =>
            setFormData({ ...formData, username: text })
          }
        />

        {/* Password */}
        <TextInput
          style={styles.input}
          placeholder="Password"
          secureTextEntry
          value={formData.password}
          onChangeText={(text) =>
            setFormData({ ...formData, password: text })
          }
        />

        {/* Invite Code */}
          <TextInput
            style={styles.input}
            placeholder="Invite Code"
            value={formData.invite_code}
            onChangeText={(text) =>
              !inviteCodeFromUrl &&
              setFormData({ ...formData, invite_code: text })
            }
            editable={!inviteCodeFromUrl}
          />

        {/* Submit Button */}
        <TouchableOpacity
          style={[styles.button, isLoading && styles.buttonDisabled]}
          onPress={handleSubmit}
          activeOpacity={0.8}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Sign Up →</Text>
          )}
        </TouchableOpacity>

        {/* Already have account */}
        <TouchableOpacity
          onPress={() =>
            router.push(
              inviteCodeFromUrl
                ? `/login?code=${inviteCodeFromUrl}`
                : "/login"
            )
          }
          style={{ marginTop: 16 }}
        >
          <Text style={styles.loginText}>
            Already have an account?{" "}
            <Text style={styles.loginLink}>Sign In</Text>
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default RegisterScreen;

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: colors.surface
  },
  container: {
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 60,
    alignItems: "center",
  },
  header: {
    alignItems: "center",
    marginBottom: 32,
  },
  iconCircle: {
    width: 70,
    height: 70,
    borderRadius: 20,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  iconText: {
    fontSize: 32,
    color: "#fff",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#111",
  },
  subtitle: {
    marginTop: 6,
    color: "#777",
  },
  errorBox: {
    backgroundColor: "#fee2e2",
    padding: 12,
    borderRadius: 10,
    marginBottom: 16,
    width: "100%",
  },
  errorText: {
    color: "#dc2626",
  },
  row: {
    flexDirection: "row",
    width: "100%",
    marginBottom: 16,
  },
  hintText: {
    fontSize: 12,
    color: "#777",
    marginTop: 4,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  loginText: {
    color: "#666",
    fontSize: 14,
    textAlign: "center",
  },
  loginLink: {
    color: "",
    fontWeight: "600",
  },
});
