import { Tabs } from 'expo-router';
import { Text } from 'react-native';
import { useAuth } from '../../src/contexts/AuthContext';

function TabIcon({ name, focused }: { name: string; focused: boolean }) {
  const icons: Record<string, string> = {
    home: '🏠',
    pharmacies: '💊',
    orders: '📦',
    messages: '💬',
    profile: '👤',
  };
  return (
    <Text style={{ fontSize: 22, opacity: focused ? 1 : 0.5 }}>
      {icons[name] || '•'}
    </Text>
  );
}

export default function TabLayout() {
  const { profile } = useAuth();
  const role = profile?.role || 'customer';

  // Determine which tabs to show based on role
  const isCustomer = role === 'customer';
  const isPharmacy = role === 'pharmacy' || role === 'pharmacy_admin';
  const isDelivery = role === 'delivery_provider' || role === 'delivery_admin';
  const isAdmin = role === 'platform_admin' || role === 'admin' || role === 'support_admin';

  // Tab labels per role
  const homeTitle = isPharmacy ? 'Dashboard' : isDelivery ? 'Dashboard' : isAdmin ? 'Dashboard' : 'Home';
  const pharmaciesTitle = isAdmin ? 'Users' : 'Pharmacies';
  const ordersTitle = isDelivery ? 'Deliveries' : 'Orders';
  const messagesTitle = isAdmin ? 'Flags' : 'Messages';

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#059669',
        tabBarInactiveTintColor: '#9CA3AF',
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
        headerStyle: { backgroundColor: '#059669' },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: 'bold' },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: homeTitle,
          tabBarIcon: ({ focused }) => <TabIcon name="home" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="pharmacies"
        options={{
          title: pharmaciesTitle,
          tabBarIcon: ({ focused }) => <TabIcon name="pharmacies" focused={focused} />,
          // Hide for delivery providers
          href: isDelivery ? null : undefined,
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          title: ordersTitle,
          tabBarIcon: ({ focused }) => <TabIcon name="orders" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          title: messagesTitle,
          tabBarIcon: ({ focused }) => <TabIcon name="messages" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ focused }) => <TabIcon name="profile" focused={focused} />,
        }}
      />
    </Tabs>
  );
}
