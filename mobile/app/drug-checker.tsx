import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { aiService, type DrugInteraction, type DrugInteractionCheckResult } from '../src/services/ai.service';

export default function DrugCheckerScreen() {
  const router = useRouter();
  const [drugs, setDrugs] = useState<string[]>([]);
  const [currentInput, setCurrentInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<DrugInteractionCheckResult | null>(null);

  const addDrug = () => {
    const trimmedInput = currentInput.trim();
    if (trimmedInput && !drugs.includes(trimmedInput)) {
      setDrugs([...drugs, trimmedInput]);
      setCurrentInput('');
    }
  };

  const removeDrug = (drug: string) => {
    setDrugs(drugs.filter((d) => d !== drug));
  };

  const checkInteractions = async () => {
    if (drugs.length < 2) {
      alert('Please add at least 2 drugs to check interactions.');
      return;
    }

    setLoading(true);
    try {
      const response = await aiService.checkDrugInteractions(drugs);
      if (response.success && response.data) {
        setResults(response.data);
      } else {
        alert('Failed to check interactions. Please try again.');
      }
    } catch (error) {
      console.error('Error checking interactions:', error);
      alert('An error occurred. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (severity: 'mild' | 'moderate' | 'severe') => {
    switch (severity) {
      case 'severe':
        return '#EF4444';
      case 'moderate':
        return '#F59E0B';
      case 'mild':
      default:
        return '#3B82F6';
    }
  };

  const getSeverityBgColor = (severity: 'mild' | 'moderate' | 'severe') => {
    switch (severity) {
      case 'severe':
        return '#FEE2E2';
      case 'moderate':
        return '#FEF3C7';
      case 'mild':
      default:
        return '#DBEAFE';
    }
  };

  const renderInteractionCard = ({ item }: { item: DrugInteraction }) => (
    <View style={[styles.interactionCard, { borderLeftColor: getSeverityColor(item.severity), borderLeftWidth: 4 }]}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
        <View
          style={[
            styles.severityBadge,
            { backgroundColor: getSeverityBgColor(item.severity) },
          ]}
        >
          <Text
            style={[
              styles.severityText,
              { color: getSeverityColor(item.severity) },
            ]}
          >
            {item.severity.charAt(0).toUpperCase() + item.severity.slice(1)}
          </Text>
        </View>
      </View>
      <Text style={styles.interactionDrugs}>
        {item.drug1} + {item.drug2}
      </Text>
      <Text style={styles.interactionDescription}>{item.description}</Text>
      <View style={styles.recommendationBox}>
        <Text style={styles.recommendationLabel}>Recommendation:</Text>
        <Text style={styles.recommendationText}>{item.recommendation}</Text>
      </View>
    </View>
  );

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Drug Checker</Text>
        <View style={{ width: 50 }} />
      </View>

      {/* Medical Disclaimer Banner */}
      <View style={styles.disclaimerBanner}>
        <Text style={styles.disclaimerText}>
          ⚠️ This tool checks for known interactions only and is not medical advice. Consult a doctor.
        </Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Input Section */}
        <View style={styles.inputSection}>
          <Text style={styles.sectionTitle}>Add Drugs</Text>
          <View style={styles.inputRow}>
            <TextInput
              style={styles.drugInput}
              placeholder="Enter drug name..."
              placeholderTextColor="#9CA3AF"
              value={currentInput}
              onChangeText={setCurrentInput}
            />
            <TouchableOpacity style={styles.addButton} onPress={addDrug}>
              <Text style={styles.addButtonText}>Add</Text>
            </TouchableOpacity>
          </View>

          {/* Drug Tags */}
          <View style={styles.tagsContainer}>
            {drugs.map((drug, index) => (
              <View key={index} style={styles.tag}>
                <Text style={styles.tagText}>{drug}</Text>
                <TouchableOpacity onPress={() => removeDrug(drug)}>
                  <Text style={styles.tagRemove}>×</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>

          {/* Check Button */}
          <TouchableOpacity
            style={[
              styles.checkButton,
              (drugs.length < 2 || loading) && styles.checkButtonDisabled,
            ]}
            onPress={checkInteractions}
            disabled={drugs.length < 2 || loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.checkButtonText}>Check Interactions</Text>
            )}
          </TouchableOpacity>

          {drugs.length < 2 && drugs.length > 0 && (
            <Text style={styles.helperText}>
              Add {2 - drugs.length} more drug{2 - drugs.length === 1 ? '' : 's'} to check
            </Text>
          )}
        </View>

        {/* Results Section */}
        {results && (
          <View style={styles.resultsSection}>
            <View
              style={[
                styles.statusBox,
                {
                  backgroundColor: results.safe ? '#ECFDF5' : '#FEE2E2',
                  borderColor: results.safe ? '#059669' : '#EF4444',
                },
              ]}
            >
              <Text
                style={[
                  styles.statusText,
                  {
                    color: results.safe ? '#059669' : '#EF4444',
                  },
                ]}
              >
                {results.safe
                  ? '✓ No dangerous interactions found'
                  : '⚠ Interactions detected'}
              </Text>
            </View>

            {/* Warnings */}
            {results.warnings.length > 0 && (
              <View style={styles.warningsBox}>
                <Text style={styles.warningsTitle}>General Warnings:</Text>
                {results.warnings.map((warning, index) => (
                  <Text key={index} style={styles.warningItem}>
                    • {warning}
                  </Text>
                ))}
              </View>
            )}

            {/* Interactions List */}
            {results.interactions.length > 0 && (
              <View>
                <Text style={styles.sectionTitle}>Interactions Detected</Text>
                <FlatList
                  data={results.interactions}
                  renderItem={renderInteractionCard}
                  keyExtractor={(_, index) => index.toString()}
                  scrollEnabled={false}
                />
              </View>
            )}

            {results.interactions.length === 0 && results.safe && (
              <View style={styles.safetyMessage}>
                <Text style={styles.safetyMessageText}>
                  Great! The drugs you selected don't have known serious interactions. However, always consult with a healthcare provider.
                </Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    backgroundColor: '#059669',
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
  },
  backButton: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  disclaimerBanner: {
    backgroundColor: '#FEF3C7',
    borderBottomWidth: 1,
    borderBottomColor: '#FDE68A',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  disclaimerText: {
    fontSize: 12,
    color: '#B45309',
    lineHeight: 18,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  inputSection: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 12,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  drugInput: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#111827',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  addButton: {
    backgroundColor: '#059669',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    justifyContent: 'center',
  },
  addButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  tag: {
    backgroundColor: '#ECFDF5',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: '#059669',
  },
  tagText: {
    color: '#059669',
    fontSize: 13,
    fontWeight: '600',
  },
  tagRemove: {
    color: '#059669',
    fontSize: 18,
    fontWeight: '600',
  },
  checkButton: {
    backgroundColor: '#059669',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  checkButtonDisabled: {
    opacity: 0.5,
  },
  checkButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  helperText: {
    color: '#6B7280',
    fontSize: 12,
    marginTop: 8,
    textAlign: 'center',
  },
  resultsSection: {
    marginBottom: 20,
  },
  statusBox: {
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
  },
  warningsBox: {
    backgroundColor: '#FEF3C7',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
  },
  warningsTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#B45309',
    marginBottom: 8,
  },
  warningItem: {
    fontSize: 12,
    color: '#92400E',
    marginBottom: 4,
    lineHeight: 18,
  },
  interactionCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  severityBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  severityText: {
    fontSize: 12,
    fontWeight: '600',
  },
  interactionDrugs: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  interactionDescription: {
    fontSize: 13,
    color: '#4B5563',
    lineHeight: 19,
    marginBottom: 10,
  },
  recommendationBox: {
    backgroundColor: '#F3F4F6',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  recommendationLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  recommendationText: {
    fontSize: 12,
    color: '#4B5563',
    lineHeight: 18,
  },
  safetyMessage: {
    backgroundColor: '#ECFDF5',
    borderRadius: 8,
    padding: 12,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#059669',
  },
  safetyMessageText: {
    color: '#059669',
    fontSize: 13,
    lineHeight: 20,
  },
});
