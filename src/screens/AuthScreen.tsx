import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useAuthStore } from '../store/authStore';

export default function AuthScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { signIn, loading, error, clearError } = useAuthStore();

  const handleSignIn = async () => {
    if (!email || !password) return;
    await signIn(email, password);
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-gray-950"
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
      >
        <View className="flex-1 justify-center px-6">
          {/* Logo / Title */}
          <View className="items-center mb-10">
            <Text className="text-white text-4xl font-bold tracking-tight">
              TestSnipe
            </Text>
            <Text className="text-gray-400 text-base mt-2">
              Sign in to your account
            </Text>
          </View>

          {/* Error banner */}
          {error ? (
            <View className="bg-red-900/50 border border-red-500 rounded-xl p-4 mb-6">
              <Text className="text-red-300 text-sm">{error}</Text>
              <TouchableOpacity onPress={clearError} className="mt-1">
                <Text className="text-red-400 text-xs">Dismiss</Text>
              </TouchableOpacity>
            </View>
          ) : null}

          {/* Email */}
          <View className="mb-4">
            <Text className="text-gray-400 text-sm mb-2">Email</Text>
            <TextInput
              className="bg-gray-800 text-white rounded-xl px-4 py-3 text-base border border-gray-700"
              placeholder="you@example.com"
              placeholderTextColor="#6b7280"
              value={email}
              onChangeText={v => {
                clearError();
                setEmail(v);
              }}
              autoCapitalize="none"
              keyboardType="email-address"
              autoCorrect={false}
              returnKeyType="next"
            />
          </View>

          {/* Password */}
          <View className="mb-6">
            <Text className="text-gray-400 text-sm mb-2">Password</Text>
            <TextInput
              className="bg-gray-800 text-white rounded-xl px-4 py-3 text-base border border-gray-700"
              placeholder="••••••••"
              placeholderTextColor="#6b7280"
              value={password}
              onChangeText={v => {
                clearError();
                setPassword(v);
              }}
              secureTextEntry
              returnKeyType="done"
              onSubmitEditing={handleSignIn}
            />
          </View>

          {/* Submit */}
          <TouchableOpacity
            className={`rounded-xl py-4 items-center ${loading || !email || !password ? 'bg-indigo-800' : 'bg-indigo-600'}`}
            onPress={handleSignIn}
            disabled={loading || !email || !password}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="text-white font-semibold text-base">
                Sign In
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
