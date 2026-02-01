import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Card, CardHeader, CardContent } from './Card';

describe('Card', () => {
  it('renders children correctly', () => {
    render(<Card>Card content</Card>);
    expect(screen.getByText('Card content')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(<Card className="custom-class">Content</Card>);
    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('has default styling', () => {
    const { container } = render(<Card>Content</Card>);
    const card = container.firstChild;
    expect(card).toHaveClass('bg-white');
    expect(card).toHaveClass('rounded-xl');
    expect(card).toHaveClass('border');
    expect(card).toHaveClass('border-secondary-200');
    expect(card).toHaveClass('p-4');
  });
});

describe('CardHeader', () => {
  it('renders title correctly', () => {
    render(<CardHeader title="Test Title" />);
    expect(screen.getByText('Test Title')).toBeInTheDocument();
  });

  it('renders subtitle when provided', () => {
    render(<CardHeader title="Title" subtitle="Subtitle text" />);
    expect(screen.getByText('Subtitle text')).toBeInTheDocument();
  });

  it('renders action when provided', () => {
    render(
      <CardHeader
        title="Title"
        action={<button>Action</button>}
      />
    );
    expect(screen.getByText('Action')).toBeInTheDocument();
  });

  it('applies correct title styling', () => {
    render(<CardHeader title="Title" />);
    const title = screen.getByText('Title');
    expect(title).toHaveClass('text-lg');
    expect(title).toHaveClass('font-semibold');
  });

  it('applies correct subtitle styling', () => {
    render(<CardHeader title="Title" subtitle="Subtitle" />);
    const subtitle = screen.getByText('Subtitle');
    expect(subtitle).toHaveClass('text-sm');
    expect(subtitle).toHaveClass('text-secondary-500');
  });
});

describe('CardContent', () => {
  it('renders children correctly', () => {
    render(<CardContent>Content here</CardContent>);
    expect(screen.getByText('Content here')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(<CardContent className="custom-class">Content</CardContent>);
    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('has default styling', () => {
    const { container } = render(<CardContent>Content</CardContent>);
    expect(container.firstChild).toHaveClass('text-secondary-600');
  });
});

describe('Card with CardHeader and CardContent', () => {
  it('renders complete card structure', () => {
    render(
      <Card>
        <CardHeader title="Card Title" subtitle="Card subtitle" />
        <CardContent>Card body content</CardContent>
      </Card>
    );

    expect(screen.getByText('Card Title')).toBeInTheDocument();
    expect(screen.getByText('Card subtitle')).toBeInTheDocument();
    expect(screen.getByText('Card body content')).toBeInTheDocument();
  });
});
