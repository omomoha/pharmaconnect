'use client';

import React, { useState } from 'react';
import { aiService } from '@/lib/services';
import type { DrugInteractionCheckResult, DrugInteraction } from '@/lib/services/ai.service';
import Button from '@/components/ui/Button';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';

const COMMON_DRUGS = [
  'Paracetamol', 'Ibuprofen', 'Aspirin', 'Vitamin C',
  'Cetirizine', 'Omeprazole', 'Loratadine', 'Antacid',
];

export default function DrugInteractionChecker() {
  const [drugs, setDrugs] = useState<string[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<DrugInteractionCheckResult | null>(null);

  const handleAddDrug = (drugName?: string) => {
    const trimmed = (drugName || input).trim();
    if (!trimmed) return;
    if (drugs.some(d => d.toLowerCase() === trimmed.toLowerCase())) {
      setError('Already added');
      return;
    }
    if (drugs.length >= 10) {
      setError('Maximum 10 drugs');
      return;
    }
    setDrugs([...drugs, trimmed]);
    setInput('');
    setError(null);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleAddDrug();
  };

  const handleRemoveDrug = (index: number) => {
    setDrugs(drugs.filter((_, i) => i !== index));
    setResults(null);
  };

  const handleCheckInteractions = async () => {
    if (drugs.length < 2) {
      setError('Add at least 2 drugs to check interactions');
      return;
    }
    setError(null);
    setIsLoading(true);
    try {
      const response = await aiService.checkDrugInteractions(drugs);
      if (response.success && response.data) {
        setResults(response.data);
      } else {
        setError(response.error?.message || 'Failed to check. Please try again.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const getSeverityConfig = (severity: DrugInteraction['severity']) => {
    switch (severity) {
      case 'severe': return { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-900', badge: 'badge-red', icon: '🔴' };
      case 'moderate': return { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-900', badge: 'badge-amber', icon: '🟡' };
      case 'mild': return { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-900', badge: 'badge-blue', icon: '🔵' };
      default: return { bg: 'bg-gray-50', border: 'border-gray-200', text: 'text-gray-900', badge: 'badge', icon: '⚪' };
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-50 rounded-xl flex items-center justify-center">
              <span className="text-lg">⚠️</span>
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Drug Interaction Checker</h2>
              <p className="text-xs text-gray-500">AI-powered safety check for medication combinations</p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-5">
          {/* Disclaimer */}
          <div className="bg-amber-50/80 border border-amber-100 rounded-xl p-3">
            <p className="text-[11px] text-amber-700 leading-relaxed">
              <span className="font-semibold">Medical Disclaimer:</span> This tool provides general information only and is not a substitute for professional medical advice. Always consult your healthcare provider.
            </p>
          </div>

          {/* Quick Add */}
          <div>
            <p className="text-xs font-medium text-gray-500 mb-2">Quick add common OTC drugs:</p>
            <div className="flex flex-wrap gap-1.5">
              {COMMON_DRUGS.filter(d => !drugs.some(added => added.toLowerCase() === d.toLowerCase())).map((drug) => (
                <button
                  key={drug}
                  onClick={() => handleAddDrug(drug)}
                  className="px-2.5 py-1 text-xs bg-gray-50 hover:bg-primary-50 border border-gray-200 hover:border-primary-300 text-gray-700 hover:text-primary-700 rounded-lg transition-all"
                  disabled={isLoading}
                >
                  + {drug}
                </button>
              ))}
            </div>
          </div>

          {/* Input */}
          <form onSubmit={handleFormSubmit} className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => { setInput(e.target.value); setError(null); }}
              placeholder="Type a drug name..."
              className="input-modern flex-1"
              disabled={isLoading}
            />
            <Button type="submit" variant="primary" size="sm" disabled={!input.trim() || isLoading}>
              Add
            </Button>
          </form>

          {/* Selected Drugs */}
          {drugs.length > 0 && (
            <div>
              <p className="text-xs font-medium text-gray-500 mb-2">
                Selected ({drugs.length}/10):
              </p>
              <div className="flex flex-wrap gap-2">
                {drugs.map((drug, index) => (
                  <div key={index} className="flex items-center gap-1.5 bg-primary-50 text-primary-800 pl-3 pr-1.5 py-1.5 rounded-lg text-sm border border-primary-100">
                    <span className="font-medium">{drug}</span>
                    <button
                      onClick={() => handleRemoveDrug(index)}
                      className="w-5 h-5 flex items-center justify-center hover:bg-primary-200 rounded-md transition-colors"
                      aria-label={`Remove ${drug}`}
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-100 rounded-xl p-3">
              <p className="text-xs text-red-600">{error}</p>
            </div>
          )}

          {/* Check Button */}
          <div className="flex gap-2">
            <Button onClick={handleCheckInteractions} variant="primary" size="sm" isLoading={isLoading} disabled={drugs.length < 2}>
              Check Interactions
            </Button>
            {drugs.length > 0 && (
              <Button onClick={() => { setDrugs([]); setResults(null); setError(null); }} variant="ghost" size="sm">
                Clear All
              </Button>
            )}
          </div>

          {/* Results */}
          {results && (
            <div className="space-y-4 pt-4 border-t border-gray-100">
              <h3 className="font-semibold text-gray-900 text-sm">Results</h3>

              {/* Safety Status */}
              {results.safe !== undefined && (
                <div className={`rounded-xl p-4 flex items-start gap-3 ${results.safe ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                  <span className="text-xl mt-0.5">{results.safe ? '✅' : '⚠️'}</span>
                  <p className={`text-sm font-medium ${results.safe ? 'text-green-800' : 'text-red-800'}`}>
                    {results.safe
                      ? 'This combination appears safe based on our analysis.'
                      : 'Potential interactions detected. Please consult your pharmacist or doctor.'}
                  </p>
                </div>
              )}

              {/* Warnings */}
              {results.warnings && results.warnings.length > 0 && (
                <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
                  <p className="text-xs font-semibold text-amber-800 mb-2">Warnings:</p>
                  <ul className="text-xs text-amber-700 space-y-1">
                    {results.warnings.map((w, i) => (<li key={i}>• {w}</li>))}
                  </ul>
                </div>
              )}

              {/* Interactions */}
              {results.interactions.length === 0 ? (
                <div className="bg-green-50 border border-green-100 rounded-xl p-4 flex items-center gap-3">
                  <span className="text-lg">✅</span>
                  <p className="text-sm text-green-800">No significant interactions found.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {results.interactions.map((interaction, index) => {
                    const config = getSeverityConfig(interaction.severity);
                    return (
                      <div key={index} className={`${config.bg} border ${config.border} rounded-xl p-4`}>
                        <div className="flex items-start gap-3">
                          <span className="text-sm mt-0.5">{config.icon}</span>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1.5">
                              <p className="font-semibold text-sm">
                                {interaction.drug1} + {interaction.drug2}
                              </p>
                              <span className={`${config.badge} text-[10px]`}>
                                {interaction.severity.charAt(0).toUpperCase() + interaction.severity.slice(1)}
                              </span>
                            </div>
                            <p className="text-xs leading-relaxed">{interaction.description}</p>
                            {interaction.recommendation && (
                              <p className="text-xs font-medium mt-2 opacity-80">
                                Recommendation: {interaction.recommendation}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
