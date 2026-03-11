import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { router } from "expo-router"
import AppInput from "../components/AppInput"
import AppButton from '../components/AppButton';
import colors from '../constants/colors';
import { useAuth } from '../context/AuthProvider'

const LoginScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();

  const { login } = useAuth();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    if (!username || !password) {
      setError('Please fill all fields');
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      const result = await login(username, password);

      if (result.success) {
        router.replace('/(app)');
      } else {
        setError(result.error || 'Login failed');
      }
    } catch (err) {
      setError('Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.wrapper}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.iconCircle}>
            <Text style={styles.iconText}>👤</Text>
          </View>
          <Text style={styles.title}>Welcome back</Text>
        </View>

        {/* Error */}
        {error !== '' && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* Username */}
        <AppInput
          placeholder="Username"
          autoCapitalize="none"
          value={username}
          onChangeText={setUsername}
        />

        {/* Password */}
        <AppInput
          placeholder="Password"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        {/* Button */}
        <AppButton
          title="Sign In"
          onPress={handleSubmit}
          activeOpacity={0.8}
          loading={isLoading}
        />

        {/* Register link */}
        <TouchableOpacity
        onPress={() =>
            router.push("/register")
        }
        >
        <Text style={styles.registerText}>
            Don’t have an account? <Text style={styles.registerLink}>Sign Up</Text>
        </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

export default LoginScreen;

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: colors.surface
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24
  },
  header: {
    alignItems: 'center',
    marginBottom: 40
  },
  iconCircle: {
    width: 70,
    height: 70,
    borderRadius: 20,
    backgroundColor: colors.primary, 
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16
  },
  iconText: {
    fontSize: 32,
    color: '#fff'
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text 
  },
  subtitle: {
    marginTop: 6,
    color: '#777'
  },
  errorBox: {
    backgroundColor: '#fee2e2',
    padding: 12,
    borderRadius: 10,
    marginBottom: 16
  },
  errorText: {
    color: '#dc2626'
  },
  registerText: {
    textAlign: 'center',
    marginTop: 20,
    color: '#666'
  },
  registerLink: {
    color: colors.primary, 
    fontWeight: '600'
  }
});

