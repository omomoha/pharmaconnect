import { Stack } from 'expo-router';
import { AuthProvider } from '../src/contexts/AuthContext';

export default function RootLayout() {
  return (
    <AuthProvider>
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: '#059669' },
          headerTintColor: '#fff',
          headerTitleStyle: { fontWeight: 'bold' },
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="login" options={{ title: 'Sign In' }} />
        <Stack.Screen name="register" options={{ title: 'Create Account' }} />
        <Stack.Screen name="pharmacy-onboarding" options={{ title: 'Pharmacy Setup' }} />
        <Stack.Screen name="delivery-onboarding" options={{ title: 'Delivery Setup' }} />
        <Stack.Screen name="pharmacy-detail" options={{ title: 'Pharmacy' }} />
        <Stack.Screen name="order-detail" options={{ title: 'Order Details' }} />
        <Stack.Screen name="chat" options={{ title: 'Chat' }} />
        <Stack.Screen name="checkout" options={{ title: 'Checkout' }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
    </AuthProvider>
  );
}
