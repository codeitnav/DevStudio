import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Input } from '../Input';

describe('Input', () => {
  it('renders basic input', () => {
    render(<Input placeholder="Enter text" />);
    
    const input = screen.getByRole('textbox');
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute('placeholder', 'Enter text');
  });

  it('renders with label', () => {
    render(<Input label="Email Address" />);
    
    const label = screen.getByText('Email Address');
    const input = screen.getByRole('textbox');
    
    expect(label).toBeInTheDocument();
    expect(label).toHaveAttribute('for', input.id);
  });

  it('shows required indicator when required', () => {
    render(<Input label="Email" required />);
    
    const requiredIndicator = screen.getByLabelText('required');
    expect(requiredIndicator).toBeInTheDocument();
    expect(requiredIndicator).toHaveTextContent('*');
    
    const input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('required');
  });

  it('displays error message', () => {
    render(<Input label="Email" error="Email is required" />);
    
    const errorMessage = screen.getByRole('alert');
    expect(errorMessage).toBeInTheDocument();
    expect(errorMessage).toHaveTextContent('Email is required');
    
    const input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveClass('border-red-500');
  });

  it('displays helper text', () => {
    render(<Input label="Password" helperText="Must be at least 8 characters" />);
    
    const helperText = screen.getByText('Must be at least 8 characters');
    expect(helperText).toBeInTheDocument();
    expect(helperText).toHaveClass('text-gray-500');
  });

  it('prioritizes error over helper text', () => {
    render(
      <Input 
        label="Email" 
        error="Email is required" 
        helperText="Enter your email address" 
      />
    );
    
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.queryByText('Enter your email address')).not.toBeInTheDocument();
  });

  it('handles input changes', () => {
    const handleChange = vi.fn();
    render(<Input onChange={handleChange} />);
    
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'test@example.com' } });
    
    expect(handleChange).toHaveBeenCalledTimes(1);
    expect(input).toHaveValue('test@example.com');
  });

  it('forwards ref correctly', () => {
    const ref = React.createRef<HTMLInputElement>();
    render(<Input ref={ref} />);
    
    expect(ref.current).toBeInstanceOf(HTMLInputElement);
  });

  it('applies custom className', () => {
    render(<Input className="custom-input" />);
    
    const input = screen.getByRole('textbox');
    expect(input).toHaveClass('custom-input');
  });

  it('uses provided id', () => {
    render(<Input id="custom-id" label="Custom Input" />);
    
    const input = screen.getByRole('textbox');
    const label = screen.getByText('Custom Input');
    
    expect(input).toHaveAttribute('id', 'custom-id');
    expect(label).toHaveAttribute('for', 'custom-id');
  });

  it('generates unique id when not provided', () => {
    const { rerender } = render(<Input label="Input 1" />);
    const input1 = screen.getByRole('textbox');
    const id1 = input1.id;
    
    rerender(<Input label="Input 2" />);
    const input2 = screen.getByRole('textbox');
    const id2 = input2.id;
    
    expect(id1).not.toBe(id2);
    expect(id1).toMatch(/^input-/);
    expect(id2).toMatch(/^input-/);
  });

  it('sets up proper aria-describedby relationships', () => {
    render(
      <Input 
        label="Email" 
        error="Email is required" 
        helperText="Enter your email" 
      />
    );
    
    const input = screen.getByRole('textbox');
    const errorMessage = screen.getByRole('alert');
    
    expect(input).toHaveAttribute('aria-describedby', errorMessage.id);
  });

  it('combines multiple aria-describedby values', () => {
    render(
      <Input 
        label="Email" 
        helperText="Enter your email" 
        aria-describedby="external-description"
      />
    );
    
    const input = screen.getByRole('textbox');
    const describedBy = input.getAttribute('aria-describedby');
    
    expect(describedBy).toContain('external-description');
    expect(describedBy).toContain('helper');
  });

  it('handles disabled state', () => {
    render(<Input disabled />);
    
    const input = screen.getByRole('textbox');
    expect(input).toBeDisabled();
    expect(input).toHaveClass('disabled:cursor-not-allowed', 'disabled:bg-gray-50');
  });

  it('supports different input types', () => {
    const { rerender } = render(<Input type="email" />);
    expect(screen.getByRole('textbox')).toHaveAttribute('type', 'email');
    
    rerender(<Input type="password" />);
    expect(screen.getByDisplayValue('')).toHaveAttribute('type', 'password');
    
    rerender(<Input type="number" />);
    expect(screen.getByRole('spinbutton')).toHaveAttribute('type', 'number');
  });

  it('has proper focus styles', () => {
    render(<Input />);
    
    const input = screen.getByRole('textbox');
    expect(input).toHaveClass('focus:border-blue-500', 'focus:ring-blue-500');
  });

  it('has error focus styles when error is present', () => {
    render(<Input error="Error message" />);
    
    const input = screen.getByRole('textbox');
    expect(input).toHaveClass('focus:border-red-500', 'focus:ring-red-500');
  });

  it('forwards all HTML input props', () => {
    render(
      <Input 
        placeholder="Enter text"
        maxLength={100}
        autoComplete="email"
        data-testid="test-input"
      />
    );
    
    const input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('placeholder', 'Enter text');
    expect(input).toHaveAttribute('maxlength', '100');
    expect(input).toHaveAttribute('autocomplete', 'email');
    expect(input).toHaveAttribute('data-testid', 'test-input');
  });
});