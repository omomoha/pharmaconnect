import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';

type Role = 'customer' | 'pharmacy_admin' | 'delivery_admin';

export default function RegisterScreen() {
  const [role, setRole] = useState<Role>('customer');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    setLoading(true);
    // TODO: Firebase Auth createUserWithEmailAndPassword + backend profile setup
    console.log('Register:', { role, firstName, lastName, email, phone });
    setLoading(false);
  };

  const roles: { value: Role; label: string; icon: string }[] = [
    { value: 'customer', label: 'Shopper', icon: '🛒' },
    { value: 'pharmacy_admin', label: 'Pharmacy', icon: '💊' },
    { value: 'delivery_admin', label: 'Delivery', icon: '🚚' },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Create Account</Text>
      <Text style={styles.subtitle}>Join PharmaConnect today</Text>

      <Text style={styles.label}>I am a...</Text>
      <View style={styles.roleRow}>
        {roles.map((r) => (
          <TouchableOpacity
            key={r.value}
            style={[styles.roleCard, role === r.value && styles.roleCardActive]}
            onPress={() => setRole(r.value)}
          >
            <Text style={styles.roleIcon}>{r.icon}</Text>
            <Text style={[styles.roleLabel, role === r.value && styles.roleLabelActive]}>
              {r.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.form}>
        <View style={styles.nameRow}>
          <TextInput style={[styles.input, styles.halfInput]} placeholder="First name" value={firstName} onChangeText={setFirstName} />
          <TextInput style={[styles.input, styles.halfInput]} placeholder="Last name" value={lastName} onChangeText={setLastName} />
        </View>
        <TextInput style={styles.input} placeholder="Email address" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
        <TextInput style={styles.input} placeholder="Phone number" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
        <TextInput style={styles.input} placeholder="Password" value={password} onChangeText={setPassword} secureTextEntry />

        <TouchableOpacity style={styles.button} onPress={handleRegister} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Create Account</Text>}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { padding: 24, paddingBottom: 60 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#111827', marginBottom: 4 },
  subtitle: { fontSize: 14, color: '#6B7280', marginBottom: 24 },
  label: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8 },
  roleRow: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  roleCard: { flex: 1, borderWidth: 2, borderColor: '#E5E7EB', borderRadius: 12, padding: 16, alignItems: 'center' },
  roleCardActive: { borderColor: '#059669', backgroundColor: '#ECFDF5' },
  roleIcon: { fontSize: 24, marginBottom: 4 },
  roleLabel: { fontSize: 12, fontWeight: '600', color: '#6B7280' },
  roleLabelActive: { color: '#059669' },
  form: { gap: 16 },
  nameRow: { flexDirection: 'row', gap: 12 },
  halfInput: { flex: 1 },
  input: { borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 16 },
  button: { backgroundColor: '#059669', paddingVertical: 16, borderRadius: 12, alignItems: 'center', marginTop: 8 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
