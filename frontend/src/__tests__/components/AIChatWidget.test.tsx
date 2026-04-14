import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AIChatWidget from '@/components/ai/AIChatWidget';
import { aiService } from '@/lib/services';

jest.mock('@/lib/services', () => ({
  aiService: {
    chatWithAssistant: jest.fn(),
  },
}));

const mockedChat = aiService.chatWithAssistant as jest.MockedFunction<typeof aiService.chatWithAssistant>;

describe('AIChatWidget', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render the floating toggle button', () => {
    render(<AIChatWidget />);
    const button = screen.getByLabelText('Open AI chat assistant');
    expect(button).toBeInTheDocument();
  });

  it('should not show chat panel when closed', () => {
    render(<AIChatWidget />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('should open chat panel when toggle button is clicked', async () => {
    render(<AIChatWidget />);

    fireEvent.click(screen.getByLabelText('Open AI chat assistant'));

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('PharmaConnect AI')).toBeInTheDocument();
  });

  it('should close chat panel when close button is clicked', async () => {
    render(<AIChatWidget />);

    fireEvent.click(screen.getByLabelText('Open AI chat assistant'));
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText('Close AI chat'));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('should close chat panel on Escape key', async () => {
    render(<AIChatWidget />);

    fireEvent.click(screen.getByLabelText('Open AI chat assistant'));
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('should show suggested prompts when chat is empty', async () => {
    render(<AIChatWidget />);

    fireEvent.click(screen.getByLabelText('Open AI chat assistant'));

    expect(screen.getByText('How can I help you?')).toBeInTheDocument();
    expect(screen.getByText('What can I take for a headache?')).toBeInTheDocument();
    expect(screen.getByText('Best OTC cold & flu remedies?')).toBeInTheDocument();
  });

  it('should show disclaimer in header', async () => {
    render(<AIChatWidget />);

    fireEvent.click(screen.getByLabelText('Open AI chat assistant'));

    expect(screen.getByText(/Not a substitute for professional medical advice/)).toBeInTheDocument();
  });

  it('should send a message when form is submitted', async () => {
    mockedChat.mockResolvedValue({
      success: true,
      data: {
        response: 'Take paracetamol for headaches.',
        conversationContinued: true,
        disclaimers: [],
      },
    });

    render(<AIChatWidget />);
    fireEvent.click(screen.getByLabelText('Open AI chat assistant'));

    const input = screen.getByLabelText('Type your message');
    fireEvent.change(input, { target: { value: 'What helps headaches?' } });
    fireEvent.submit(input.closest('form')!);

    await waitFor(() => {
      expect(mockedChat).toHaveBeenCalledWith('What helps headaches?', []);
      expect(screen.getByText('Take paracetamol for headaches.')).toBeInTheDocument();
    });
  });

  it('should send message when clicking suggested prompt', async () => {
    mockedChat.mockResolvedValue({
      success: true,
      data: {
        response: 'You can try paracetamol 500mg.',
        conversationContinued: true,
        disclaimers: [],
      },
    });

    render(<AIChatWidget />);
    fireEvent.click(screen.getByLabelText('Open AI chat assistant'));
    fireEvent.click(screen.getByText('What can I take for a headache?'));

    await waitFor(() => {
      expect(mockedChat).toHaveBeenCalledWith('What can I take for a headache?', []);
    });
  });

  it('should show loading indicator while waiting for response', async () => {
    mockedChat.mockImplementation(() => new Promise(() => {})); // Never resolves

    render(<AIChatWidget />);
    fireEvent.click(screen.getByLabelText('Open AI chat assistant'));

    const input = screen.getByLabelText('Type your message');
    fireEvent.change(input, { target: { value: 'test' } });
    fireEvent.submit(input.closest('form')!);

    await waitFor(() => {
      expect(screen.getByLabelText('AI is typing')).toBeInTheDocument();
    });
  });

  it('should show error when API call fails', async () => {
    mockedChat.mockResolvedValue({
      success: false,
      error: { code: 'ERR', message: 'Service unavailable' },
    });

    render(<AIChatWidget />);
    fireEvent.click(screen.getByLabelText('Open AI chat assistant'));

    const input = screen.getByLabelText('Type your message');
    fireEvent.change(input, { target: { value: 'test' } });
    fireEvent.submit(input.closest('form')!);

    await waitFor(() => {
      expect(screen.getByText('Service unavailable')).toBeInTheDocument();
    });
  });

  it('should show disclaimers from AI response', async () => {
    mockedChat.mockResolvedValue({
      success: true,
      data: {
        response: 'Take vitamin C.',
        conversationContinued: true,
        disclaimers: ['Consult your doctor before taking any medication.'],
      },
    });

    render(<AIChatWidget />);
    fireEvent.click(screen.getByLabelText('Open AI chat assistant'));

    const input = screen.getByLabelText('Type your message');
    fireEvent.change(input, { target: { value: 'cold remedies' } });
    fireEvent.submit(input.closest('form')!);

    await waitFor(() => {
      expect(screen.getByText(/Consult your doctor before taking any medication/)).toBeInTheDocument();
    });
  });

  it('should clear conversation when clear button is clicked', async () => {
    mockedChat.mockResolvedValue({
      success: true,
      data: { response: 'Test response', conversationContinued: true, disclaimers: [] },
    });

    render(<AIChatWidget />);
    fireEvent.click(screen.getByLabelText('Open AI chat assistant'));

    const input = screen.getByLabelText('Type your message');
    fireEvent.change(input, { target: { value: 'test' } });
    fireEvent.submit(input.closest('form')!);

    await waitFor(() => {
      expect(screen.getByText('Test response')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByLabelText('Clear conversation'));

    expect(screen.queryByText('Test response')).not.toBeInTheDocument();
    expect(screen.getByText('How can I help you?')).toBeInTheDocument();
  });

  it('should not send empty messages', () => {
    render(<AIChatWidget />);
    fireEvent.click(screen.getByLabelText('Open AI chat assistant'));

    const sendButton = screen.getByLabelText('Send message');
    expect(sendButton).toBeDisabled();
  });

  it('should disable input while loading', async () => {
    mockedChat.mockImplementation(() => new Promise(() => {}));

    render(<AIChatWidget />);
    fireEvent.click(screen.getByLabelText('Open AI chat assistant'));

    const input = screen.getByLabelText('Type your message');
    fireEvent.change(input, { target: { value: 'test' } });
    fireEvent.submit(input.closest('form')!);

    await waitFor(() => {
      expect(input).toBeDisabled();
    });
  });

  it('should have proper ARIA attributes', () => {
    render(<AIChatWidget />);

    const toggleBtn = screen.getByLabelText('Open AI chat assistant');
    expect(toggleBtn).toHaveAttribute('aria-expanded', 'false');
    expect(toggleBtn).toHaveAttribute('aria-controls', 'ai-chat-panel');

    fireEvent.click(toggleBtn);

    const closeBtn = screen.getByLabelText('Close AI chat');
    expect(closeBtn).toHaveAttribute('aria-expanded', 'true');

    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-label', 'AI Chat Assistant');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
  });

  it('should handle exception from API gracefully', async () => {
    mockedChat.mockRejectedValue(new Error('Network failure'));

    render(<AIChatWidget />);
    fireEvent.click(screen.getByLabelText('Open AI chat assistant'));

    const input = screen.getByLabelText('Type your message');
    fireEvent.change(input, { target: { value: 'test' } });
    fireEvent.submit(input.closest('form')!);

    await waitFor(() => {
      expect(screen.getByText('Network failure')).toBeInTheDocument();
    });
  });

  it('should dismiss error when dismiss button is clicked', async () => {
    mockedChat.mockResolvedValue({
      success: false,
      error: { code: 'ERR', message: 'Some error' },
    });

    render(<AIChatWidget />);
    fireEvent.click(screen.getByLabelText('Open AI chat assistant'));

    const input = screen.getByLabelText('Type your message');
    fireEvent.change(input, { target: { value: 'test' } });
    fireEvent.submit(input.closest('form')!);

    await waitFor(() => {
      expect(screen.getByText('Some error')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByLabelText('Dismiss error'));
    expect(screen.queryByText('Some error')).not.toBeInTheDocument();
  });
});
