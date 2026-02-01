import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Badge } from './Badge';

describe('Badge', () => {
  it('renders children correctly', () => {
    render(<Badge>Active</Badge>);
    expect(screen.getByText('Active')).toBeInTheDocument();
  });

  it('renders with default variant', () => {
    render(<Badge>Default</Badge>);
    const badge = screen.getByText('Default');
    expect(badge).toHaveClass('bg-secondary-100');
    expect(badge).toHaveClass('text-secondary-800');
  });

  it('renders with success variant', () => {
    render(<Badge variant="success">Success</Badge>);
    const badge = screen.getByText('Success');
    expect(badge).toHaveClass('bg-green-100');
    expect(badge).toHaveClass('text-green-800');
  });

  it('renders with warning variant', () => {
    render(<Badge variant="warning">Warning</Badge>);
    const badge = screen.getByText('Warning');
    expect(badge).toHaveClass('bg-yellow-100');
    expect(badge).toHaveClass('text-yellow-800');
  });

  it('renders with danger variant', () => {
    render(<Badge variant="danger">Danger</Badge>);
    const badge = screen.getByText('Danger');
    expect(badge).toHaveClass('bg-red-100');
    expect(badge).toHaveClass('text-red-800');
  });

  it('renders with info variant', () => {
    render(<Badge variant="info">Info</Badge>);
    const badge = screen.getByText('Info');
    expect(badge).toHaveClass('bg-blue-100');
    expect(badge).toHaveClass('text-blue-800');
  });

  it('renders with purple variant', () => {
    render(<Badge variant="purple">Purple</Badge>);
    const badge = screen.getByText('Purple');
    expect(badge).toHaveClass('bg-purple-100');
    expect(badge).toHaveClass('text-purple-800');
  });

  it('renders with orange variant', () => {
    render(<Badge variant="orange">Orange</Badge>);
    const badge = screen.getByText('Orange');
    expect(badge).toHaveClass('bg-orange-100');
    expect(badge).toHaveClass('text-orange-800');
  });

  it('renders with small size by default', () => {
    render(<Badge>Small</Badge>);
    const badge = screen.getByText('Small');
    expect(badge).toHaveClass('px-2');
    expect(badge).toHaveClass('py-0.5');
    expect(badge).toHaveClass('text-xs');
  });

  it('renders with medium size', () => {
    render(<Badge size="md">Medium</Badge>);
    const badge = screen.getByText('Medium');
    expect(badge).toHaveClass('px-2.5');
    expect(badge).toHaveClass('text-sm');
  });

  it('renders with rounded corners by default', () => {
    render(<Badge>Rounded</Badge>);
    const badge = screen.getByText('Rounded');
    expect(badge).toHaveClass('rounded-full');
  });

  it('renders with regular rounded corners when rounded is false', () => {
    render(<Badge rounded={false}>Not Rounded</Badge>);
    const badge = screen.getByText('Not Rounded');
    expect(badge).toHaveClass('rounded');
    expect(badge).not.toHaveClass('rounded-full');
  });

  it('has inline-flex display', () => {
    render(<Badge>Inline</Badge>);
    const badge = screen.getByText('Inline');
    expect(badge).toHaveClass('inline-flex');
  });

  it('has font-medium styling', () => {
    render(<Badge>Medium Font</Badge>);
    const badge = screen.getByText('Medium Font');
    expect(badge).toHaveClass('font-medium');
  });
});
