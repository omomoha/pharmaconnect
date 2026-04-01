'use client';

import { PageHeader } from '@/components/ui/PageHeader';
import { DrugInteractionChecker } from '@/components/ai/DrugInteractionChecker';

export default function DrugInteractionsPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Drug Interaction Checker"
        description="Check for potential interactions between your medications"
      />

      <div className="grid gap-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">
            How to Use This Tool
          </h3>
          <p className="text-blue-800 text-sm leading-relaxed">
            Enter the names of medications you're currently taking or planning to take.
            Our AI-powered checker will analyze potential interactions between your drugs
            and provide safety recommendations. Always consult with a healthcare professional
            before starting or stopping any medications.
          </p>
        </div>

        <DrugInteractionChecker />
      </div>
    </div>
  );
}
