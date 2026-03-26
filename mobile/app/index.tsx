import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.hero}>
        <Text style={styles.logo}>💊 PharmaConnect</Text>
        <Text style={styles.tagline}>
          Your Trusted Online Pharmacy Marketplace
        </Text>
        <Text style={styles.subtitle}>
          Find pharmacies near you, order OTC medications, and get them delivered to your door.
        </Text>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => router.push('/login')}
        >
          <Text style={styles.primaryButtonText}>Sign In</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => router.push('/register')}
        >
          <Text style={styles.secondaryButtonText}>Create Account</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.features}>
        <FeatureItem icon="🔍" title="Search" description="Find pharmacies near you" />
        <FeatureItem icon="🛒" title="Order" description="Browse & buy OTC drugs" />
        <FeatureItem icon="🚚" title="Deliver" description="Track your delivery live" />
      </View>
    </View>
  );
}

function FeatureItem({ icon, title, description }: { icon: string; title: string; description: string }) {
  return (
    <View style={styles.featureItem}>
      <Text style={styles.featureIcon}>{icon}</Text>
      <Text style={styles.featureTitle}>{title}</Text>
      <Text style={styles.featureDescription}>{description}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 24 },
  hero: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 60 },
  logo: { fontSize: 32, fontWeight: 'bold', color: '#059669', marginBottom: 12 },
  tagline: { fontSize: 20, fontWeight: '600', color: '#111827', textAlign: 'center', marginBottom: 8 },
  subtitle: { fontSize: 14, color: '#6B7280', textAlign: 'center', paddingHorizontal: 20 },
  actions: { gap: 12, marginBottom: 40 },
  primaryButton: { backgroundColor: '#059669', paddingVertical: 16, borderRadius: 12, alignItems: 'center' },
  primaryButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  secondaryButton: { borderWidth: 2, borderColor: '#059669', paddingVertical: 16, borderRadius: 12, alignItems: 'center' },
  secondaryButtonText: { color: '#059669', fontSize: 16, fontWeight: '600' },
  features: { flexDirection: 'row', justifyContent: 'space-around', paddingBottom: 40 },
  featureItem: { alignItems: 'center', flex: 1 },
  featureIcon: { fontSize: 28, marginBottom: 4 },
  featureTitle: { fontSize: 14, fontWeight: '600', color: '#111827' },
  featureDescription: { fontSize: 11, color: '#6B7280', textAlign: 'center' },
});
