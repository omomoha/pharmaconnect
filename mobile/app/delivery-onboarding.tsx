import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import { useAuth } from '../src/contexts/AuthContext';
import { apiClient } from '../src/lib/api';
import storage from '@react-native-firebase/storage';

type Step = 1 | 2 | 3;

interface DocumentFile {
  uri: string;
  name: string;
  type: string;
  downloadUrl?: string;
  uploading?: boolean;
  progress?: number;
}

export default function DeliveryOnboardingScreen() {
  const { user } = useAuth();
  const [step, setStep] = useState<Step>(1);
  const [loading, setLoading] = useState(false);

  // Step 1: Business Info
  const [businessName, setBusinessName] = useState('');
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [ownerName, setOwnerName] = useState('');

  // Step 2: Documents
  const [cacNumber, setCacNumber] = useState('');
  const [cacDoc, setCacDoc] = useState<DocumentFile | null>(null);
  const [ownerIdDoc, setOwnerIdDoc] = useState<DocumentFile | null>(null);
  const [vehicleDoc, setVehicleDoc] = useState<DocumentFile | null>(null);

  // Step 3: Pricing
  const [baseFee, setBaseFee] = useState('500');
  const [perKmFee, setPerKmFee] = useState('100');

  const pickDocument = async (
    setter: (doc: DocumentFile) => void,
    storagePath: string
  ) => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/jpeg', 'image/png'],
        copyToCacheDirectory: true,
      });

      if (result.canceled || !result.assets?.[0]) return;

      const file = result.assets[0];
      const doc: DocumentFile = {
        uri: file.uri,
        name: file.name || 'document',
        type: file.mimeType || 'application/pdf',
        uploading: true,
        progress: 0,
      };
      setter(doc);

      const ref = storage().ref(storagePath);
      const task = ref.putFile(file.uri);

      task.on('state_changed', (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        setter({ ...doc, progress, uploading: true });
      });

      await task;
      const downloadUrl = await ref.getDownloadURL();
      setter({ ...doc, downloadUrl, uploading: false, progress: 100 });
    } catch (error) {
      Alert.alert('Upload Failed', 'Could not upload the document. Please try again.');
      setter(null as any);
    }
  };

  const validateStep1 = () => {
    if (!businessName.trim() || !address.trim() || !city.trim() || !state.trim() || !phoneNumber.trim() || !ownerName.trim()) {
      Alert.alert('Missing Fields', 'Please fill in all required business information.');
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    if (!cacNumber.trim()) {
      Alert.alert('Missing Fields', 'Please enter your CAC registration number.');
      return false;
    }
    if (!cacDoc?.downloadUrl || !ownerIdDoc?.downloadUrl || !vehicleDoc?.downloadUrl) {
      Alert.alert('Missing Documents', 'All three documents are required for approval.');
      return false;
    }
    return true;
  };

  const handleNext = () => {
    if (step === 1 && validateStep1()) setStep(2);
    else if (step === 2 && validateStep2()) setStep(3);
  };

  const handleSubmit = async () => {
    const base = parseFloat(baseFee);
    const perKm = parseFloat(perKmFee);
    if (isNaN(base) || isNaN(perKm) || base <= 0 || perKm <= 0) {
      Alert.alert('Invalid Pricing', 'Please enter valid delivery fee amounts.');
      return;
    }

    setLoading(true);
    try {
      const response = await apiClient.post('/delivery/providers/register', {
        businessName: businessName.trim(),
        description: description.trim(),
        address: address.trim(),
        city: city.trim(),
        state: state.trim(),
        phone: phoneNumber.trim(),
        ownerName: ownerName.trim(),
        cacNumber: cacNumber.trim(),
        cacDocUrl: cacDoc?.downloadUrl,
        ownerIdDocUrl: ownerIdDoc?.downloadUrl,
        vehicleDocUrl: vehicleDoc?.downloadUrl,
        baseFee: base,
        perKmFee: perKm,
      });

      if (response.success) {
        Alert.alert(
          'Registration Submitted!',
          'Your delivery business registration is under review. This typically takes 1-3 business days. You\'ll be notified once approved.',
          [{ text: 'Continue', onPress: () => router.replace('/(tabs)') }]
        );
      } else {
        Alert.alert('Error', response.error?.message || 'Registration failed. Please try again.');
      }
    } catch (error) {
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderDocUpload = (
    label: string,
    doc: DocumentFile | null,
    onPick: () => void
  ) => (
    <View style={styles.docItem}>
      <Text style={styles.docLabel}>{label}</Text>
      {doc ? (
        <View style={styles.docUploaded}>
          {doc.uploading ? (
            <View style={styles.docProgress}>
              <ActivityIndicator size="small" color="#059669" />
              <Text style={styles.docProgressText}>
                Uploading... {Math.round(doc.progress || 0)}%
              </Text>
            </View>
          ) : (
            <View style={styles.docSuccess}>
              <Text style={styles.docSuccessText}>Uploaded: {doc.name}</Text>
              <TouchableOpacity onPress={onPick}>
                <Text style={styles.docReplace}>Replace</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      ) : (
        <TouchableOpacity style={styles.docPickButton} onPress={onPick}>
          <Text style={styles.docPickText}>Select File (PDF, JPG, PNG)</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Progress indicator */}
      <View style={styles.progressBar}>
        {[1, 2, 3].map((s) => (
          <View
            key={s}
            style={[
              styles.progressStep,
              s <= step && styles.progressStepActive,
            ]}
          />
        ))}
      </View>
      <Text style={styles.stepLabel}>
        Step {step} of 3:{' '}
        {step === 1 ? 'Business Info' : step === 2 ? 'Documents' : 'Pricing'}
      </Text>

      {step === 1 && (
        <View style={styles.form}>
          <Text style={styles.sectionTitle}>Delivery Business Information</Text>
          <TextInput
            style={styles.input}
            placeholder="Business Name *"
            value={businessName}
            onChangeText={setBusinessName}
          />
          <TextInput
            style={styles.input}
            placeholder="Owner Full Name *"
            value={ownerName}
            onChangeText={setOwnerName}
          />
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Business Description (optional)"
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={3}
          />
          <TextInput
            style={styles.input}
            placeholder="Business Address *"
            value={address}
            onChangeText={setAddress}
          />
          <View style={styles.row}>
            <TextInput
              style={[styles.input, styles.halfInput]}
              placeholder="City *"
              value={city}
              onChangeText={setCity}
            />
            <TextInput
              style={[styles.input, styles.halfInput]}
              placeholder="State *"
              value={state}
              onChangeText={setState}
            />
          </View>
          <TextInput
            style={styles.input}
            placeholder="Phone Number *"
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            keyboardType="phone-pad"
          />
        </View>
      )}

      {step === 2 && (
        <View style={styles.form}>
          <Text style={styles.sectionTitle}>Required Documents</Text>
          <View style={styles.warningBox}>
            <Text style={styles.warningText}>
              All three documents are required for approval. Accepted formats: PDF, JPG, PNG (max 10MB).
            </Text>
          </View>

          <TextInput
            style={styles.input}
            placeholder="CAC Registration Number *"
            value={cacNumber}
            onChangeText={setCacNumber}
          />
          {renderDocUpload('CAC Certificate *', cacDoc, () =>
            pickDocument(setCacDoc, `delivery/${user?.uid}/cac`)
          )}

          {renderDocUpload("Owner's Government ID *", ownerIdDoc, () =>
            pickDocument(setOwnerIdDoc, `delivery/${user?.uid}/owner-id`)
          )}

          {renderDocUpload('Vehicle Registration / Insurance *', vehicleDoc, () =>
            pickDocument(setVehicleDoc, `delivery/${user?.uid}/vehicle`)
          )}
        </View>
      )}

      {step === 3 && (
        <View style={styles.form}>
          <Text style={styles.sectionTitle}>Delivery Pricing</Text>
          <Text style={styles.pricingNote}>
            Set your delivery fees. Customers will see these when choosing a delivery provider.
          </Text>

          <View style={styles.feeRow}>
            <Text style={styles.feeLabel}>Base Delivery Fee</Text>
            <View style={styles.feeInputWrap}>
              <Text style={styles.currencySymbol}>NGN</Text>
              <TextInput
                style={styles.feeInput}
                value={baseFee}
                onChangeText={setBaseFee}
                keyboardType="numeric"
                placeholder="500"
              />
            </View>
          </View>

          <View style={styles.feeRow}>
            <Text style={styles.feeLabel}>Per Kilometer Fee</Text>
            <View style={styles.feeInputWrap}>
              <Text style={styles.currencySymbol}>NGN</Text>
              <TextInput
                style={styles.feeInput}
                value={perKmFee}
                onChangeText={setPerKmFee}
                keyboardType="numeric"
                placeholder="100"
              />
            </View>
          </View>

          <View style={styles.exampleBox}>
            <Text style={styles.exampleTitle}>Example Calculation</Text>
            <Text style={styles.exampleText}>
              A 5km delivery would cost: NGN {(parseFloat(baseFee || '0') + parseFloat(perKmFee || '0') * 5).toLocaleString()}
            </Text>
          </View>
        </View>
      )}

      {/* Navigation Buttons */}
      <View style={styles.navRow}>
        {step > 1 && (
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => setStep((step - 1) as Step)}
          >
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>
        )}
        {step < 3 ? (
          <TouchableOpacity
            style={[styles.nextButton, step === 1 && { flex: 1 }]}
            onPress={handleNext}
          >
            <Text style={styles.nextButtonText}>Next</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.nextButton, loading && styles.buttonDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.nextButtonText}>Submit Registration</Text>
            )}
          </TouchableOpacity>
        )}
      </View>

      <TouchableOpacity
        style={styles.skipButton}
        onPress={() => router.replace('/(tabs)')}
      >
        <Text style={styles.skipText}>Skip for now</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { padding: 24, paddingBottom: 60 },
  progressBar: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  progressStep: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E5E7EB',
  },
  progressStepActive: { backgroundColor: '#059669' },
  stepLabel: { fontSize: 13, color: '#6B7280', marginBottom: 20 },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', color: '#111827', marginBottom: 16 },
  form: { gap: 14 },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    backgroundColor: '#F9FAFB',
  },
  textArea: { height: 80, textAlignVertical: 'top' },
  row: { flexDirection: 'row', gap: 12 },
  halfInput: { flex: 1 },
  warningBox: {
    backgroundColor: '#FEF3C7',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#FBBF24',
  },
  warningText: { fontSize: 13, color: '#92400E' },
  pricingNote: { fontSize: 14, color: '#6B7280', marginBottom: 8 },
  feeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  feeLabel: { fontSize: 15, fontWeight: '500', color: '#374151', flex: 1 },
  feeInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 10,
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 12,
  },
  currencySymbol: { fontSize: 14, color: '#6B7280', fontWeight: '600', marginRight: 4 },
  feeInput: { fontSize: 16, paddingVertical: 10, width: 80, textAlign: 'right' },
  exampleBox: {
    backgroundColor: '#EFF6FF',
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    marginTop: 8,
  },
  exampleTitle: { fontSize: 13, fontWeight: '600', color: '#1E40AF', marginBottom: 4 },
  exampleText: { fontSize: 14, color: '#1E40AF' },
  docItem: { marginBottom: 4 },
  docLabel: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 6 },
  docPickButton: {
    borderWidth: 2,
    borderColor: '#D1D5DB',
    borderStyle: 'dashed',
    borderRadius: 10,
    padding: 16,
    alignItems: 'center',
  },
  docPickText: { color: '#6B7280', fontSize: 14 },
  docUploaded: { paddingVertical: 4 },
  docProgress: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  docProgressText: { color: '#6B7280', fontSize: 13 },
  docSuccess: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ECFDF5',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  docSuccessText: { color: '#065F46', fontSize: 13, flex: 1 },
  docReplace: { color: '#059669', fontWeight: '600', fontSize: 13 },
  navRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  backButton: {
    flex: 1,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  backButtonText: { color: '#374151', fontSize: 16, fontWeight: '600' },
  nextButton: {
    flex: 2,
    backgroundColor: '#059669',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  nextButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  buttonDisabled: { opacity: 0.6 },
  skipButton: { alignItems: 'center', marginTop: 16 },
  skipText: { color: '#9CA3AF', fontSize: 14 },
});
