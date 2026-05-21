import React from 'react';
import { NavigationContainer, LinkingOptions } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AppStackParamList, AuthStackParamList } from '../types';
import { useAuthStore } from '../store/authStore';
import ItemsListScreen from '../screens/ItemsListScreen';
import ItemDetailScreen from '../screens/ItemDetailScreen';
import AuthScreen from '../screens/AuthScreen';

const AppStack = createNativeStackNavigator<AppStackParamList>();
const AuthStack = createNativeStackNavigator<AuthStackParamList>();

// Always register the linking config so cold-start deep links are captured
// by the OS and queued until the navigator is ready.
const linking: LinkingOptions<AppStackParamList> = {
  prefixes: ['tectsoft-rn://'],
  config: {
    screens: {
      ItemsList: '',
      ItemDetail: 'item/:itemId',
    },
  },
};

function AppNavigator() {
  return (
    <AppStack.Navigator screenOptions={{ headerShown: false }}>
      <AppStack.Screen name="ItemsList" component={ItemsListScreen} />
      <AppStack.Screen name="ItemDetail" component={ItemDetailScreen} />
    </AppStack.Navigator>
  );
}

function AuthNavigator() {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack.Screen name="SignIn" component={AuthScreen} />
    </AuthStack.Navigator>
  );
}

export default function RootNavigator() {
  const { session, initialized } = useAuthStore();

  if (!initialized) {
    return null;
  }

  return (
    // Pass linking always — NavigationContainer queues the deep link URL
    // internally and navigates once the correct screen is mounted.
    <NavigationContainer linking={linking}>
      {session ? <AppNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
}
