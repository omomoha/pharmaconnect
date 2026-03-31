import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import TypingIndicator from '@/components/chat/TypingIndicator';

describe('TypingIndicator Component', () => {
  describe('rendering states', () => {
    it('should render when isTyping is true', () => {
      render(<TypingIndicator isTyping={true} userName="John" />);

      expect(screen.getByText(/is typing/i)).toBeInTheDocument();
    });

    it('should not render when isTyping is false', () => {
      const { container } = render(
        <TypingIndicator isTyping={false} userName="John" />
      );

      expect(container.firstChild).toBeNull();
    });

    it('should render null when isTyping is false', () => {
      const { container } = render(
        <TypingIndicator isTyping={false} userName="Alice" />
      );

      expect(container.firstChild).toBeNull();
    });

    it('should toggle visibility based on isTyping prop', () => {
      const { rerender, container } = render(
        <TypingIndicator isTyping={false} userName="Bob" />
      );

      expect(container.firstChild).toBeNull();

      rerender(<TypingIndicator isTyping={true} userName="Bob" />);

      expect(screen.getByText(/is typing/i)).toBeInTheDocument();

      rerender(<TypingIndicator isTyping={false} userName="Bob" />);

      expect(container.firstChild).toBeNull();
    });
  });

  describe('username display', () => {
    it('should display username from prop', () => {
      render(<TypingIndicator isTyping={true} userName="Alice" />);

      expect(screen.getByText('Alice')).toBeInTheDocument();
    });

    it('should display username with correct font weight', () => {
      render(<TypingIndicator isTyping={true} userName="Charlie" />);

      const usernameSpan = screen.getByText('Charlie');
      expect(usernameSpan).toHaveClass('font-medium');
    });

    it('should display different usernames', () => {
      const { rerender } = render(
        <TypingIndicator isTyping={true} userName="User1" />
      );

      expect(screen.getByText('User1')).toBeInTheDocument();

      rerender(<TypingIndicator isTyping={true} userName="User2" />);

      expect(screen.getByText('User2')).toBeInTheDocument();
      expect(screen.queryByText('User1')).not.toBeInTheDocument();
    });

    it('should handle usernames with special characters', () => {
      render(<TypingIndicator isTyping={true} userName="John@Pharmacy" />);

      expect(screen.getByText('John@Pharmacy')).toBeInTheDocument();
    });

    it('should handle long usernames', () => {
      const longName = 'VeryLongPharmacyNameThatMightBeAnIssue';
      render(<TypingIndicator isTyping={true} userName={longName} />);

      expect(screen.getByText(longName)).toBeInTheDocument();
    });
  });

  describe('text display', () => {
    it('should display "is typing..." text', () => {
      render(<TypingIndicator isTyping={true} userName="Jane" />);

      expect(screen.getByText(/is typing/i)).toBeInTheDocument();
    });

    it('should display full typing message with username', () => {
      render(<TypingIndicator isTyping={true} userName="Mary" />);

      expect(screen.getByText('Mary')).toBeInTheDocument();
      expect(screen.getByText(/is typing/)).toBeInTheDocument();
    });

    it('should have correct text styling', () => {
      render(<TypingIndicator isTyping={true} userName="David" />);

      const textElement = screen.getByText(/is typing/i);
      expect(textElement).toHaveClass('text-sm', 'text-gray-600');
    });
  });

  describe('animation dots', () => {
    it('should render three dots for animation', () => {
      render(<TypingIndicator isTyping={true} userName="Sam" />);

      const dots = document.querySelectorAll('.animate-bounce');
      expect(dots.length).toBe(3);
    });

    it('should render dots with correct classes', () => {
      render(<TypingIndicator isTyping={true} userName="Pat" />);

      const dots = document.querySelectorAll('.animate-bounce');
      dots.forEach((dot) => {
        expect(dot).toHaveClass('w-2', 'h-2', 'bg-gray-400', 'rounded-full');
      });
    });

    it('should have staggered animation delays on dots', () => {
      render(<TypingIndicator isTyping={true} userName="Lee" />);

      const dots = document.querySelectorAll('.animate-bounce');

      expect(dots[0]).toHaveStyle({ animationDelay: '0ms' });
      expect(dots[1]).toHaveStyle({ animationDelay: '150ms' });
      expect(dots[2]).toHaveStyle({ animationDelay: '300ms' });
    });

    it('should have different animation delays for each dot', () => {
      render(<TypingIndicator isTyping={true} userName="Rob" />);

      const dots = document.querySelectorAll('[style*="animation"]');
      const delays = Array.from(dots)
        .map((dot) => dot.getAttribute('style'))
        .filter((style) => style !== null);

      expect(delays.length).toBeGreaterThanOrEqual(3);
      expect(delays[0]).toContain('0ms');
      expect(delays[1]).toContain('150ms');
      expect(delays[2]).toContain('300ms');
    });

    it('should not render dots when isTyping is false', () => {
      render(<TypingIndicator isTyping={false} userName="Tim" />);

      const dots = document.querySelectorAll('.animate-bounce');
      expect(dots.length).toBe(0);
    });
  });

  describe('layout and structure', () => {
    it('should have flex layout for main container', () => {
      const { container } = render(
        <TypingIndicator isTyping={true} userName="Kate" />
      );

      const mainDiv = container.querySelector('.flex');
      expect(mainDiv).toHaveClass('flex', 'items-center', 'gap-2');
    });

    it('should have correct padding', () => {
      const { container } = render(
        <TypingIndicator isTyping={true} userName="Mike" />
      );

      const mainDiv = container.querySelector('.flex');
      expect(mainDiv).toHaveClass('py-2', 'px-4');
    });

    it('should have nested flex container for dots', () => {
      const { container } = render(
        <TypingIndicator isTyping={true} userName="Nick" />
      );

      const dotContainer = container.querySelector('.flex.gap-1');
      expect(dotContainer).toBeInTheDocument();
      expect(dotContainer).toHaveClass('flex', 'gap-1');
    });

    it('should render paragraph with correct styling', () => {
      render(<TypingIndicator isTyping={true} userName="Sara" />);

      const paragraph = screen.getByText(/is typing/).closest('p');
      expect(paragraph).toHaveClass('text-sm', 'text-gray-600');
    });

    it('should have proper spacing between dots and text', () => {
      const { container } = render(
        <TypingIndicator isTyping={true} userName="Tom" />
      );

      const mainDiv = container.querySelector('.flex');
      expect(mainDiv).toHaveClass('gap-2');
    });
  });

  describe('conditional rendering', () => {
    it('should only render when isTyping is explicitly true', () => {
      const { container } = render(
        <TypingIndicator isTyping={true} userName="Eva" />
      );

      expect(container.firstChild).not.toBeNull();
    });

    it('should return null when isTyping is false', () => {
      const { container } = render(
        <TypingIndicator isTyping={false} userName="Frank" />
      );

      expect(container.firstChild).toBeNull();
    });

    it('should handle rapid prop changes', () => {
      const { rerender, container } = render(
        <TypingIndicator isTyping={true} userName="Grace" />
      );

      expect(container.firstChild).not.toBeNull();

      rerender(<TypingIndicator isTyping={false} userName="Grace" />);
      expect(container.firstChild).toBeNull();

      rerender(<TypingIndicator isTyping={true} userName="Grace" />);
      expect(container.firstChild).not.toBeNull();

      rerender(<TypingIndicator isTyping={false} userName="Grace" />);
      expect(container.firstChild).toBeNull();
    });
  });

  describe('dot styling', () => {
    it('should render dots with gray background', () => {
      render(<TypingIndicator isTyping={true} userName="Henry" />);

      const dots = document.querySelectorAll('.bg-gray-400');
      expect(dots.length).toBe(3);
    });

    it('should render dots with border radius', () => {
      render(<TypingIndicator isTyping={true} userName="Iris" />);

      const dots = document.querySelectorAll('.rounded-full');
      expect(dots.length).toBe(3);
    });

    it('should render dots with correct size', () => {
      render(<TypingIndicator isTyping={true} userName="Jack" />);

      const dots = document.querySelectorAll('.w-2.h-2');
      expect(dots.length).toBe(3);
    });

    it('should have animate-bounce class on all dots', () => {
      render(<TypingIndicator isTyping={true} userName="Lisa" />);

      const dots = document.querySelectorAll('.animate-bounce');
      expect(dots.length).toBe(3);
      dots.forEach((dot) => {
        expect(dot).toHaveClass('animate-bounce');
      });
    });
  });

  describe('accessibility', () => {
    it('should have semantic text content', () => {
      render(<TypingIndicator isTyping={true} userName="Oscar" />);

      expect(screen.getByText('Oscar')).toBeInTheDocument();
      expect(screen.getByText(/is typing/)).toBeInTheDocument();
    });

    it('should be accessible to screen readers when visible', () => {
      render(<TypingIndicator isTyping={true} userName="Paula" />);

      const container = screen.getByText(/is typing/).closest('div');
      expect(container).toBeInTheDocument();
    });

    it('should not have accessibility issues with animation', () => {
      render(<TypingIndicator isTyping={true} userName="Quinn" />);

      // Verify that dots are not hidden from screen readers
      const dots = document.querySelectorAll('.animate-bounce');
      dots.forEach((dot) => {
        expect(dot.getAttribute('aria-hidden')).not.toBe('true');
      });
    });
  });

  describe('edge cases', () => {
    it('should handle empty username string', () => {
      render(<TypingIndicator isTyping={true} userName="" />);

      const text = screen.getByText(/is typing/);
      expect(text).toBeInTheDocument();
    });

    it('should handle username with whitespace', () => {
      render(<TypingIndicator isTyping={true} userName="   User Name   " />);

      expect(screen.getByText(/User Name/)).toBeInTheDocument();
    });

    it('should handle username with numbers', () => {
      render(<TypingIndicator isTyping={true} userName="User123" />);

      expect(screen.getByText('User123')).toBeInTheDocument();
    });

    it('should handle username with emoji', () => {
      render(<TypingIndicator isTyping={true} userName="User🏪" />);

      expect(screen.getByText('User🏪')).toBeInTheDocument();
    });

    it('should rerender without errors when all props change', () => {
      const { rerender } = render(
        <TypingIndicator isTyping={true} userName="User1" />
      );

      expect(screen.getByText('User1')).toBeInTheDocument();

      rerender(<TypingIndicator isTyping={true} userName="User2" />);

      expect(screen.queryByText('User1')).not.toBeInTheDocument();
      expect(screen.getByText('User2')).toBeInTheDocument();
    });
  });
});
