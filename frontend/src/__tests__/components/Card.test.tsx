import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/Card';

describe('Card Components', () => {
  describe('Card', () => {
    it('renders children', () => {
      render(<Card>Card Content</Card>);
      expect(screen.getByText('Card Content')).toBeInTheDocument();
    });

    it('applies default classes', () => {
      const { container } = render(<Card>Content</Card>);
      expect(container.firstChild).toHaveClass('bg-white', 'rounded-lg', 'border');
    });

    it('accepts additional className', () => {
      const { container } = render(<Card className="p-4">Content</Card>);
      expect(container.firstChild).toHaveClass('p-4');
    });
  });

  describe('CardHeader', () => {
    it('renders children', () => {
      render(<CardHeader>Header</CardHeader>);
      expect(screen.getByText('Header')).toBeInTheDocument();
    });

    it('has border-bottom styling', () => {
      const { container } = render(<CardHeader>Header</CardHeader>);
      expect(container.firstChild).toHaveClass('border-b', 'border-gray-200');
    });
  });

  describe('CardContent', () => {
    it('renders children', () => {
      render(<CardContent>Body</CardContent>);
      expect(screen.getByText('Body')).toBeInTheDocument();
    });

    it('has padding', () => {
      const { container } = render(<CardContent>Body</CardContent>);
      expect(container.firstChild).toHaveClass('px-6', 'py-4');
    });
  });

  describe('CardFooter', () => {
    it('renders children', () => {
      render(<CardFooter>Footer</CardFooter>);
      expect(screen.getByText('Footer')).toBeInTheDocument();
    });

    it('has border-top and background', () => {
      const { container } = render(<CardFooter>Footer</CardFooter>);
      expect(container.firstChild).toHaveClass('border-t', 'bg-gray-50');
    });
  });

  it('composes Card with all sub-components', () => {
    render(
      <Card>
        <CardHeader>Title</CardHeader>
        <CardContent>Description</CardContent>
        <CardFooter>Actions</CardFooter>
      </Card>
    );
    expect(screen.getByText('Title')).toBeInTheDocument();
    expect(screen.getByText('Description')).toBeInTheDocument();
    expect(screen.getByText('Actions')).toBeInTheDocument();
  });
});
