import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Textarea } from '@/components/ui/textarea';
import React from 'react';

// Mock do utils
jest.mock('@/lib/utils', () => ({
  cn: (...classes: string[]) => classes.filter(Boolean).join(' ')
}));

describe('Textarea', () => {
  it('renders correctly', () => {
    render(<Textarea />);
    
    const textarea = screen.getByRole('textbox');
    expect(textarea).toBeInTheDocument();
    expect(textarea.tagName).toBe('TEXTAREA');
  });

  it('applies default classes', () => {
    render(<Textarea />);
    
    const textarea = screen.getByRole('textbox');
    expect(textarea).toHaveClass('flex');
    expect(textarea).toHaveClass('min-h-[80px]');
    expect(textarea).toHaveClass('w-full');
    expect(textarea).toHaveClass('rounded-md');
  });

  it('accepts and displays placeholder text', () => {
    const placeholderText = 'Enter your message here...';
    render(<Textarea placeholder={placeholderText} />);
    
    const textarea = screen.getByPlaceholderText(placeholderText);
    expect(textarea).toBeInTheDocument();
  });

  it('accepts and displays value', () => {
    const testValue = 'This is test content';
    render(<Textarea value={testValue} onChange={() => {}} />);
    
    const textarea = screen.getByDisplayValue(testValue);
    expect(textarea).toBeInTheDocument();
  });

  it('handles onChange events', async () => {
    const user = userEvent.setup();
    const handleChange = jest.fn();
    
    render(<Textarea onChange={handleChange} />);
    
    const textarea = screen.getByRole('textbox');
    await user.type(textarea, 'Hello World');
    
    expect(handleChange).toHaveBeenCalled();
    expect(handleChange).toHaveBeenCalledTimes(11); // One for each character
  });

  it('forwards ref correctly', () => {
    const ref = React.createRef<HTMLTextAreaElement>();
    render(<Textarea ref={ref} />);
    
    expect(ref.current).toBeInstanceOf(HTMLTextAreaElement);
    expect(ref.current?.tagName).toBe('TEXTAREA');
  });

  it('applies custom className alongside default classes', () => {
    const customClass = 'custom-textarea-class';
    render(<Textarea className={customClass} />);
    
    const textarea = screen.getByRole('textbox');
    expect(textarea).toHaveClass(customClass);
    expect(textarea).toHaveClass('flex'); // Default class should still be there
  });

  it('supports disabled state', () => {
    render(<Textarea disabled />);
    
    const textarea = screen.getByRole('textbox');
    expect(textarea).toBeDisabled();
    expect(textarea).toHaveClass('disabled:cursor-not-allowed');
    expect(textarea).toHaveClass('disabled:opacity-50');
  });

  it('supports readonly state', () => {
    render(<Textarea readOnly />);
    
    const textarea = screen.getByRole('textbox');
    expect(textarea).toHaveAttribute('readonly');
  });

  it('supports required attribute', () => {
    render(<Textarea required />);
    
    const textarea = screen.getByRole('textbox');
    expect(textarea).toBeRequired();
  });

  it('supports maxLength attribute', () => {
    const maxLength = 100;
    render(<Textarea maxLength={maxLength} />);
    
    const textarea = screen.getByRole('textbox');
    expect(textarea).toHaveAttribute('maxlength', maxLength.toString());
  });

  it('supports rows attribute', () => {
    const rows = 5;
    render(<Textarea rows={rows} />);
    
    const textarea = screen.getByRole('textbox');
    expect(textarea).toHaveAttribute('rows', rows.toString());
  });

  it('supports cols attribute', () => {
    const cols = 50;
    render(<Textarea cols={cols} />);
    
    const textarea = screen.getByRole('textbox');
    expect(textarea).toHaveAttribute('cols', cols.toString());
  });

  it('handles focus and blur events', () => {
    const handleFocus = jest.fn();
    const handleBlur = jest.fn();
    
    render(<Textarea onFocus={handleFocus} onBlur={handleBlur} />);
    
    const textarea = screen.getByRole('textbox');
    
    fireEvent.focus(textarea);
    expect(handleFocus).toHaveBeenCalledTimes(1);
    
    fireEvent.blur(textarea);
    expect(handleBlur).toHaveBeenCalledTimes(1);
  });

  it('supports name attribute for forms', () => {
    const name = 'message';
    render(<Textarea name={name} />);
    
    const textarea = screen.getByRole('textbox');
    expect(textarea).toHaveAttribute('name', name);
  });

  it('supports id attribute', () => {
    const id = 'message-textarea';
    render(<Textarea id={id} />);
    
    const textarea = screen.getByRole('textbox');
    expect(textarea).toHaveAttribute('id', id);
  });

  it('supports data attributes', () => {
    const dataTestId = 'message-input';
    render(<Textarea data-testid={dataTestId} />);
    
    const textarea = screen.getByTestId(dataTestId);
    expect(textarea).toBeInTheDocument();
  });

  it('supports aria attributes for accessibility', () => {
    const ariaLabel = 'Message input field';
    const ariaDescribedBy = 'message-help-text';
    
    render(
      <Textarea 
        aria-label={ariaLabel}
        aria-describedby={ariaDescribedBy}
      />
    );
    
    const textarea = screen.getByRole('textbox');
    expect(textarea).toHaveAttribute('aria-label', ariaLabel);
    expect(textarea).toHaveAttribute('aria-describedby', ariaDescribedBy);
  });

  it('displays correct displayName', () => {
    expect(Textarea.displayName).toBe('Textarea');
  });

  it('has minimum height styling', () => {
    render(<Textarea />);
    
    const textarea = screen.getByRole('textbox');
    expect(textarea).toHaveClass('min-h-[80px]');
  });

  it('has focus styling classes', () => {
    render(<Textarea />);
    
    const textarea = screen.getByRole('textbox');
    expect(textarea).toHaveClass('focus-visible:outline-none');
    expect(textarea).toHaveClass('focus-visible:ring-2');
    expect(textarea).toHaveClass('focus-visible:ring-ring');
    expect(textarea).toHaveClass('focus-visible:ring-offset-2');
  });
});