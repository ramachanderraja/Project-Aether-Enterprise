import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Input } from './Input';

describe('Input', () => {
  it('renders input element', () => {
    render(<Input />);
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('renders label when provided', () => {
    render(<Input label="Email" />);
    expect(screen.getByText('Email')).toBeInTheDocument();
  });

  it('renders helper text when provided', () => {
    render(<Input helperText="Enter your email address" />);
    expect(screen.getByText('Enter your email address')).toBeInTheDocument();
  });

  it('renders error message when error is provided', () => {
    render(<Input error="This field is required" />);
    expect(screen.getByText('This field is required')).toBeInTheDocument();
  });

  it('applies error styling when error is present', () => {
    render(<Input error="Error" />);
    const input = screen.getByRole('textbox');
    expect(input).toHaveClass('border-red-300');
  });

  it('does not show helper text when error is present', () => {
    render(<Input error="Error" helperText="Helper" />);
    expect(screen.queryByText('Helper')).not.toBeInTheDocument();
    expect(screen.getByText('Error')).toBeInTheDocument();
  });

  it('handles onChange events', () => {
    const handleChange = vi.fn();
    render(<Input onChange={handleChange} />);

    fireEvent.change(screen.getByRole('textbox'), {
      target: { value: 'test' },
    });

    expect(handleChange).toHaveBeenCalled();
  });

  it('accepts value prop', () => {
    render(<Input value="test value" onChange={() => {}} />);
    expect(screen.getByRole('textbox')).toHaveValue('test value');
  });

  it('applies placeholder', () => {
    render(<Input placeholder="Enter text" />);
    expect(screen.getByPlaceholderText('Enter text')).toBeInTheDocument();
  });

  it('can be disabled', () => {
    render(<Input disabled />);
    expect(screen.getByRole('textbox')).toBeDisabled();
  });

  it('renders left icon when provided', () => {
    const LeftIcon = () => <span data-testid="left-icon">🔍</span>;
    render(<Input leftIcon={<LeftIcon />} />);
    expect(screen.getByTestId('left-icon')).toBeInTheDocument();
  });

  it('renders right icon when provided', () => {
    const RightIcon = () => <span data-testid="right-icon">✓</span>;
    render(<Input rightIcon={<RightIcon />} />);
    expect(screen.getByTestId('right-icon')).toBeInTheDocument();
  });

  it('applies left padding when left icon is present', () => {
    const LeftIcon = () => <span>🔍</span>;
    render(<Input leftIcon={<LeftIcon />} />);
    expect(screen.getByRole('textbox')).toHaveClass('pl-10');
  });

  it('applies right padding when right icon is present', () => {
    const RightIcon = () => <span>✓</span>;
    render(<Input rightIcon={<RightIcon />} />);
    expect(screen.getByRole('textbox')).toHaveClass('pr-10');
  });

  it('applies custom className', () => {
    render(<Input className="custom-class" />);
    expect(screen.getByRole('textbox')).toHaveClass('custom-class');
  });

  it('forwards ref correctly', () => {
    const ref = vi.fn();
    render(<Input ref={ref} />);
    expect(ref).toHaveBeenCalled();
  });

  it('supports different input types', () => {
    const { rerender } = render(<Input type="email" />);
    expect(screen.getByRole('textbox')).toHaveAttribute('type', 'email');

    rerender(<Input type="password" />);
    // Password inputs don't have textbox role
    expect(document.querySelector('input[type="password"]')).toBeInTheDocument();
  });
});
