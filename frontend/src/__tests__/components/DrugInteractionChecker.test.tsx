import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import DrugInteractionChecker from '@/components/ai/DrugInteractionChecker';
import { aiService } from '@/lib/services';

jest.mock('@/lib/services', () => ({
  aiService: {
    checkDrugInteractions: jest.fn(),
  },
}));

const mockedCheck = aiService.checkDrugInteractions as jest.MockedFunction<typeof aiService.checkDrugInteractions>;

describe('DrugInteractionChecker', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render the component', () => {
    render(<DrugInteractionChecker />);
    expect(screen.getByText('Drug Interaction Checker')).toBeInTheDocument();
    expect(screen.getByText(/Medical Disclaimer/)).toBeInTheDocument();
  });

  it('should show common drug quick-add buttons', () => {
    render(<DrugInteractionChecker />);
    expect(screen.getByText('+ Paracetamol')).toBeInTheDocument();
    expect(screen.getByText('+ Ibuprofen')).toBeInTheDocument();
    expect(screen.getByText('+ Aspirin')).toBeInTheDocument();
  });

  it('should add a drug when typing and submitting', () => {
    render(<DrugInteractionChecker />);

    const input = screen.getByPlaceholderText('Type a drug name...');
    fireEvent.change(input, { target: { value: 'Amoxicillin' } });
    fireEvent.submit(input.closest('form')!);

    expect(screen.getByText('Amoxicillin')).toBeInTheDocument();
    expect(input).toHaveValue('');
  });

  it('should add a drug when clicking quick-add button', () => {
    render(<DrugInteractionChecker />);

    fireEvent.click(screen.getByText('+ Paracetamol'));

    expect(screen.getByText('Paracetamol')).toBeInTheDocument();
    // Quick-add button should disappear for added drug
    expect(screen.queryByText('+ Paracetamol')).not.toBeInTheDocument();
  });

  it('should prevent duplicate drugs (case-insensitive)', () => {
    render(<DrugInteractionChecker />);

    fireEvent.click(screen.getByText('+ Paracetamol'));

    const input = screen.getByPlaceholderText('Type a drug name...');
    fireEvent.change(input, { target: { value: 'paracetamol' } });
    fireEvent.submit(input.closest('form')!);

    expect(screen.getByText('Already added')).toBeInTheDocument();
  });

  it('should enforce maximum 10 drugs', () => {
    render(<DrugInteractionChecker />);

    // Add 10 drugs
    for (let i = 0; i < 10; i++) {
      const input = screen.getByPlaceholderText('Type a drug name...');
      fireEvent.change(input, { target: { value: `Drug${i}` } });
      fireEvent.submit(input.closest('form')!);
    }

    // Try adding 11th
    const input = screen.getByPlaceholderText('Type a drug name...');
    fireEvent.change(input, { target: { value: 'Drug10' } });
    fireEvent.submit(input.closest('form')!);

    expect(screen.getByText('Maximum 10 drugs')).toBeInTheDocument();
  });

  it('should remove a drug when remove button is clicked', () => {
    render(<DrugInteractionChecker />);

    fireEvent.click(screen.getByText('+ Paracetamol'));
    expect(screen.getByText('Paracetamol')).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText('Remove Paracetamol'));
    // The drug tag should be gone, quick-add should reappear
    expect(screen.getByText('+ Paracetamol')).toBeInTheDocument();
  });

  it('should require at least 2 drugs to check', () => {
    render(<DrugInteractionChecker />);

    fireEvent.click(screen.getByText('+ Paracetamol'));

    const checkButton = screen.getByText('Check Interactions');
    expect(checkButton).toBeDisabled();
  });

  it('should show error when checking with fewer than 2 drugs manually', async () => {
    render(<DrugInteractionChecker />);

    // The check button should be disabled with < 2 drugs
    fireEvent.click(screen.getByText('+ Paracetamol'));
    expect(screen.getByText('Check Interactions')).toBeDisabled();
  });

  it('should check interactions and show safe result', async () => {
    mockedCheck.mockResolvedValue({
      success: true,
      data: {
        drugs: ['Paracetamol', 'Vitamin C'],
        interactions: [],
        warnings: [],
        safe: true,
      },
    });

    render(<DrugInteractionChecker />);

    fireEvent.click(screen.getByText('+ Paracetamol'));
    fireEvent.click(screen.getByText('+ Vitamin C'));
    fireEvent.click(screen.getByText('Check Interactions'));

    await waitFor(() => {
      expect(screen.getByText(/This combination appears safe/)).toBeInTheDocument();
      expect(screen.getByText(/No significant interactions found/)).toBeInTheDocument();
    });
  });

  it('should check interactions and show unsafe result with interactions', async () => {
    mockedCheck.mockResolvedValue({
      success: true,
      data: {
        drugs: ['Ibuprofen', 'Aspirin'],
        interactions: [{
          drug1: 'Ibuprofen',
          drug2: 'Aspirin',
          severity: 'moderate',
          description: 'Both are NSAIDs and may increase bleeding risk.',
          recommendation: 'Avoid taking together.',
        }],
        warnings: ['Consult your doctor.'],
        safe: false,
      },
    });

    render(<DrugInteractionChecker />);

    fireEvent.click(screen.getByText('+ Ibuprofen'));
    fireEvent.click(screen.getByText('+ Aspirin'));
    fireEvent.click(screen.getByText('Check Interactions'));

    await waitFor(() => {
      expect(screen.getByText(/Potential interactions detected/)).toBeInTheDocument();
      expect(screen.getByText('Ibuprofen + Aspirin')).toBeInTheDocument();
      expect(screen.getByText('Moderate')).toBeInTheDocument();
      expect(screen.getByText(/Both are NSAIDs/)).toBeInTheDocument();
      expect(screen.getByText(/Avoid taking together/)).toBeInTheDocument();
    });
  });

  it('should show warnings from results', async () => {
    mockedCheck.mockResolvedValue({
      success: true,
      data: {
        drugs: ['Drug1', 'Drug2'],
        interactions: [],
        warnings: ['Please check dosage.'],
        safe: true,
      },
    });

    render(<DrugInteractionChecker />);

    const input = screen.getByPlaceholderText('Type a drug name...');
    fireEvent.change(input, { target: { value: 'Drug1' } });
    fireEvent.submit(input.closest('form')!);
    fireEvent.change(input, { target: { value: 'Drug2' } });
    fireEvent.submit(input.closest('form')!);
    fireEvent.click(screen.getByText('Check Interactions'));

    await waitFor(() => {
      expect(screen.getByText(/Please check dosage/)).toBeInTheDocument();
    });
  });

  it('should show severe interaction with correct styling', async () => {
    mockedCheck.mockResolvedValue({
      success: true,
      data: {
        drugs: ['DrugA', 'DrugB'],
        interactions: [{
          drug1: 'DrugA',
          drug2: 'DrugB',
          severity: 'severe',
          description: 'Dangerous combination.',
          recommendation: 'Do not take together.',
        }],
        warnings: [],
        safe: false,
      },
    });

    render(<DrugInteractionChecker />);

    const input = screen.getByPlaceholderText('Type a drug name...');
    fireEvent.change(input, { target: { value: 'DrugA' } });
    fireEvent.submit(input.closest('form')!);
    fireEvent.change(input, { target: { value: 'DrugB' } });
    fireEvent.submit(input.closest('form')!);
    fireEvent.click(screen.getByText('Check Interactions'));

    await waitFor(() => {
      expect(screen.getByText('Severe')).toBeInTheDocument();
      expect(screen.getByText('DrugA + DrugB')).toBeInTheDocument();
    });
  });

  it('should handle API error', async () => {
    mockedCheck.mockResolvedValue({
      success: false,
      error: { code: 'ERR', message: 'Server error' },
    });

    render(<DrugInteractionChecker />);

    fireEvent.click(screen.getByText('+ Paracetamol'));
    fireEvent.click(screen.getByText('+ Ibuprofen'));
    fireEvent.click(screen.getByText('Check Interactions'));

    await waitFor(() => {
      expect(screen.getByText('Server error')).toBeInTheDocument();
    });
  });

  it('should handle API exception', async () => {
    mockedCheck.mockRejectedValue(new Error('Network error'));

    render(<DrugInteractionChecker />);

    fireEvent.click(screen.getByText('+ Paracetamol'));
    fireEvent.click(screen.getByText('+ Ibuprofen'));
    fireEvent.click(screen.getByText('Check Interactions'));

    await waitFor(() => {
      expect(screen.getByText('Network error')).toBeInTheDocument();
    });
  });

  it('should clear all drugs and results', async () => {
    mockedCheck.mockResolvedValue({
      success: true,
      data: { drugs: ['Paracetamol', 'Aspirin'], interactions: [], warnings: [], safe: true },
    });

    render(<DrugInteractionChecker />);

    fireEvent.click(screen.getByText('+ Paracetamol'));
    fireEvent.click(screen.getByText('+ Aspirin'));
    fireEvent.click(screen.getByText('Check Interactions'));

    await waitFor(() => {
      expect(screen.getByText(/This combination appears safe/)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Clear All'));

    expect(screen.queryByText('Results')).not.toBeInTheDocument();
    expect(screen.getByText('+ Paracetamol')).toBeInTheDocument();
    expect(screen.getByText('+ Aspirin')).toBeInTheDocument();
  });

  it('should not submit empty drug name', () => {
    render(<DrugInteractionChecker />);

    const input = screen.getByPlaceholderText('Type a drug name...');
    fireEvent.submit(input.closest('form')!);

    expect(screen.queryByText('Selected')).not.toBeInTheDocument();
  });
});
