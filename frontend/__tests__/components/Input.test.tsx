import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Input } from '@/components/ui/input'

describe('Input Component', () => {
  it('renders input field', () => {
    render(<Input placeholder="Enter text" />)
    
    const input = screen.getByPlaceholderText('Enter text')
    expect(input).toBeInTheDocument()
  })

  it('handles text input', async () => {
    const user = userEvent.setup()
    render(<Input placeholder="Type here" />)
    
    const input = screen.getByPlaceholderText('Type here')
    await user.type(input, 'Hello world')
    
    expect(input).toHaveValue('Hello world')
  })

  it('handles controlled input', () => {
    const handleChange = jest.fn()
    render(<Input value="controlled" onChange={handleChange} />)
    
    const input = screen.getByDisplayValue('controlled')
    expect(input).toHaveValue('controlled')
    
    fireEvent.change(input, { target: { value: 'new value' } })
    expect(handleChange).toHaveBeenCalled()
  })

  it('can be disabled', () => {
    render(<Input disabled placeholder="Disabled input" />)
    
    const input = screen.getByPlaceholderText('Disabled input')
    expect(input).toBeDisabled()
  })

  it('supports different input types', () => {
    const { rerender } = render(<Input type="text" />)
    let input = screen.getByRole('textbox')
    expect(input).toHaveAttribute('type', 'text')

    rerender(<Input type="email" />)
    input = screen.getByRole('textbox')
    expect(input).toHaveAttribute('type', 'email')

    rerender(<Input type="password" />)
    input = screen.getByLabelText('', { selector: 'input[type="password"]' })
    expect(input).toHaveAttribute('type', 'password')
  })

  it('forwards ref correctly', () => {
    const ref = jest.fn()
    render(<Input ref={ref} />)
    
    expect(ref).toHaveBeenCalled()
  })

  it('applies custom className', () => {
    render(<Input className="custom-class" data-testid="input" />)
    
    const input = screen.getByTestId('input')
    expect(input).toHaveClass('custom-class')
  })

  it('handles focus and blur events', async () => {
    const handleFocus = jest.fn()
    const handleBlur = jest.fn()
    const user = userEvent.setup()
    
    render(<Input onFocus={handleFocus} onBlur={handleBlur} />)
    
    const input = screen.getByRole('textbox')
    
    await user.click(input)
    expect(handleFocus).toHaveBeenCalled()
    
    await user.tab()
    expect(handleBlur).toHaveBeenCalled()
  })
})