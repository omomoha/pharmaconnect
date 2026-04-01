'use client';

import React, { useState } from 'react';
import { aiService } from '@/lib/services';
import type {
  DrugInteractionCheckResult,
  DrugInteraction,
} from '@/lib/services/ai.service';
import Button from '@/components/ui/Button';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';

export default function DrugInteractionChecker() {
  const [drugs, setDrugs] = useState<string[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<DrugInteractionCheckResult | null>(
    null
  );

  const handleAddDrug = (e: React.FormEvent) => {
    e.preventDefault();

    const trimmed = input.trim();
    if (!trimmed) return;

    if (drugs.includes(trimmed.toLowerCase())) {
      setError('This drug is already in the list');
      return;
    }

    if (drugs.length >= 10) {
      setError('Maximum 10 drugs allowed');
      return;
    }

    setDrugs([...drugs, trimmed]);
    setInput('');
    setError(null);
  };

  const handleRemoveDrug = (index: number) => {
    setDrugs(drugs.filter((_, i) => i !== index));
    setResults(null);
  };

  const handleCheckInteractions = async () => {
    if (drugs.length < 2) {
      setError('Please add at least 2 drugs to check interactions');
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      const response = await aiService.checkDrugInteractions(drugs);

      if (response.success && response.data) {
        setResults(response.data);
      } else {
        setError(
          response.error?.message ||
            'Failed to check drug interactions. Please try again.'
        );
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      console.error('Drug interaction check error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const getSeverityColor = (severity: DrugInteraction['severity']) => {
    switch (severity) {
      case 'severe':
        return 'bg-red-50 border-red-200 text-red-900';
      case 'moderate':
        return 'bg-amber-50 border-amber-200 text-amber-900';
      case 'mild':
        return 'bg-blue-50 border-blue-200 text-blue-900';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-900';
    }
  };

  const getSeverityBadgeColor = (severity: DrugInteraction['severity']) => {
    switch (severity) {
      case 'severe':
        return 'bg-red-100 text-red-800';
      case 'moderate':
        return 'bg-amber-100 text-amber-800';
      case 'mild':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card>
      <CardHeader>
        <div>
          <h2 className="text-lg font-bold text-gray-900">
            Drug Interaction Checker
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Check for potential interactions between medications
          </p>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Disclaimer */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <p className="text-xs text-amber-800">
            <span className="font-semibold">Medical Disclaimer:</span> This tool
            provides general information about potential drug interactions and
            is not a substitute for professional medical advice. Always consult
            your healthcare provider or pharmacist before taking any medication.
          </p>
        </div>

        {/* Drug Input Form */}
        <form onSubmit={handleAddDrug} className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Add Drug Names
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => {
                  setInput(e.target.value);
                  setError(null);
                }}
                placeholder="Enter drug name (e.g., Paracetamol)"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600 text-sm"
                disabled={isLoading}
              />
              <Button
                type="submit"
                variant="primary"
                size="md"
                disabled={!input.trim() || isLoading}
              >
                Add
              </Button>
            </div>
          </div>
        </form>

        {/* Selected Drugs Tags */}
        {drugs.length > 0 && (
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Selected Drugs ({drugs.length}/10)
            </label>
            <div className="flex flex-wrap gap-2">
              {drugs.map((drug, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 bg-primary-100 text-primary-800 px-3 py-1 rounded-full text-sm"
                >
                  {drug}
                  <button
                    onClick={() => handleRemoveDrug(index)}
                    className="ml-1 hover:bg-primary-200 rounded-full p-0.5 transition-colors"
                    aria-label={`Remove ${drug}`}
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Check Button */}
        <div className="flex gap-3">
          <Button
            onClick={handleCheckInteractions}
            variant="primary"
            size="md"
            isLoading={isLoading}
            disabled={drugs.length < 2}
          >
            Check Interactions
          </Button>
          {drugs.length > 0 && (
            <Button
              onClick={() => {
                setDrugs([]);
                setResults(null);
                setError(null);
              }}
              variant="outline"
              size="md"
            >
              Clear All
            </Button>
          )}
        </div>

        {/* Results */}
        {results && (
          <div className="space-y-4">
            <div className="border-t border-gray-200 pt-4">
              <h3 className="font-semibold text-gray-900 mb-3">
                Interaction Results
              </h3>

              {/* Overall safety status */}
              {results.safe !== undefined && (
                <div className={`rounded-lg p-4 mb-3 ${results.safe ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                  <div className="flex gap-3">
                    <svg
                      className={`w-5 h-5 flex-shrink-0 mt-0.5 ${results.safe ? 'text-green-600' : 'text-red-600'}`}
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      {results.safe ? (
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      ) : (
                        <path
                          fillRule="evenodd"
                          d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                          clipRule="evenodd"
                        />
                      )}
                    </svg>
                    <p className={`text-sm font-medium ${results.safe ? 'text-green-800' : 'text-red-800'}`}>
                      {results.safe
                        ? 'This combination appears to be safe based on our analysis.'
                        : 'Potential interactions detected. Please consult your pharmacist or doctor.'}
                    </p>
                  </div>
                </div>
              )}

              {/* Warnings */}
              {results.warnings && results.warnings.length > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-3">
                  <p className="text-sm font-semibold text-amber-900 mb-1">Warnings:</p>
                  <ul className="text-sm text-amber-800 space-y-1">
                    {results.warnings.map((warning, i) => (
                      <li key={i}>• {warning}</li>
                    ))}
                  </ul>
                </div>
              )}

              {results.interactions.length === 0 ? (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex gap-3">
                    <svg
                      className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <p className="text-sm text-green-800">
                      No significant interactions found between the selected
                      drugs.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {results.interactions.map((interaction, index) => (
                    <div
                      key={index}
                      className={`border rounded-lg p-4 ${getSeverityColor(
                        interaction.severity
                      )}`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <p className="font-semibold">
                              {interaction.drug1} + {interaction.drug2}
                            </p>
                            <span
                              className={`text-xs font-medium px-2 py-1 rounded ${getSeverityBadgeColor(
                                interaction.severity
                              )}`}
                            >
                              {interaction.severity.charAt(0).toUpperCase() +
                                interaction.severity.slice(1)}
                            </span>
                          </div>
                          <p className="text-sm">{interaction.description}</p>
                          {interaction.recommendation && (
                            <p className="text-sm mt-2 font-medium">
                              Recommendation: {interaction.recommendation}
                            </p>
                          )}
                        </div>
                        {interaction.severity === 'severe' && (
                          <svg
                            className="w-5 h-5 flex-shrink-0 text-red-600 mt-0.5"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                              clipRule="evenodd"
                            />
                          </svg>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
