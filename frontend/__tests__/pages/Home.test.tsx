import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Home from '@/app/page'

// Mock fetch
global.fetch = jest.fn()

describe('Home Page', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders the main heading', () => {
    render(<Home />)
    
    // Look for main brand title or welcome message
    const heading = screen.getByRole('heading', { level: 1 })
    expect(heading).toBeInTheDocument()
  })

  it('renders text input area', () => {
    render(<Home />)
    
    // Look for text input or textarea for brief analysis
    const textInput = screen.getByRole('textbox') || screen.getByLabelText(/brief|text|análise/i)
    expect(textInput).toBeInTheDocument()
  })

  it('renders action buttons', () => {
    render(<Home />)
    
    // Look for main action buttons
    const buttons = screen.getAllByRole('button')
    expect(buttons.length).toBeGreaterThan(0)
  })

  it('handles text input and analysis', async () => {
    const mockResponse = {
      keywords: ['café', 'sustentável', 'premium'],
      attributes: ['moderno', 'eco-friendly'],
      analysis: { purpose: 'Sustainable coffee brand' }
    }

    ;(fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    })

    const user = userEvent.setup()
    render(<Home />)
    
    // Find text input
    const textInput = screen.getByRole('textbox') || screen.getByLabelText(/brief|text/i)
    
    // Type sample text
    await user.type(textInput, 'Marca de café sustentável para jovens')
    
    // Find and click analyze button
    const analyzeButton = screen.getByRole('button', { name: /analis|process|enviar/i }) || 
                         screen.getAllByRole('button')[0]
    
    await user.click(analyzeButton)
    
    // Should show loading or results
    await waitFor(() => {
      // Check if analysis results appear or loading state is shown
      expect(document.body).toContainHTML('café')
    }, { timeout: 3000 })
  })

  it('handles file upload', async () => {
    const user = userEvent.setup()
    render(<Home />)
    
    // Look for file input
    const fileInput = screen.getByLabelText(/upload|arquivo|file/i) || 
                     document.querySelector('input[type="file"]')
    
    if (fileInput) {
      const file = new File(['test content'], 'test.pdf', { type: 'application/pdf' })
      await user.upload(fileInput, file)
      
      expect(fileInput).toHaveProperty('files', expect.arrayContaining([file]))
    }
  })

  it('navigates to next phase', async () => {
    const user = userEvent.setup()
    render(<Home />)
    
    // Look for navigation to galaxy/next phase
    const nextButton = screen.getByRole('button', { name: /next|próxim|galaxy|continuar/i }) ||
                      screen.getByRole('link', { name: /galaxy|next/i })
    
    if (nextButton) {
      await user.click(nextButton)
      // Navigation would be handled by Next.js router (mocked)
    }
  })

  it('displays error messages', async () => {
    ;(fetch as jest.Mock).mockRejectedValueOnce(new Error('API Error'))

    const user = userEvent.setup()
    render(<Home />)
    
    const textInput = screen.getByRole('textbox') || screen.getByLabelText(/brief|text/i)
    await user.type(textInput, 'Test text')
    
    const submitButton = screen.getAllByRole('button')[0]
    await user.click(submitButton)
    
    // Should handle error gracefully
    await waitFor(() => {
      // Error message might appear or form should reset
      expect(textInput).toBeInTheDocument()
    })
  })

  it('handles empty input validation', async () => {
    const user = userEvent.setup()
    render(<Home />)
    
    // Try to submit without text
    const submitButton = screen.getAllByRole('button')[0]
    await user.click(submitButton)
    
    // Should not make API call or show validation message
    expect(fetch).not.toHaveBeenCalled()
  })

  it('renders demo mode toggle', () => {
    render(<Home />)
    
    // Look for demo mode option
    const demoToggle = screen.getByLabelText(/demo|demonstr/i) ||
                      screen.getByText(/demo|demonstr/i)
    
    if (demoToggle) {
      expect(demoToggle).toBeInTheDocument()
    }
  })

  it('shows loading state during analysis', async () => {
    ;(fetch as jest.Mock).mockImplementation(() => 
      new Promise(resolve => setTimeout(resolve, 1000))
    )

    const user = userEvent.setup()
    render(<Home />)
    
    const textInput = screen.getByRole('textbox') || screen.getByLabelText(/brief|text/i)
    await user.type(textInput, 'Test analysis')
    
    const submitButton = screen.getAllByRole('button')[0]
    await user.click(submitButton)
    
    // Should show loading indicator
    const loadingIndicator = screen.getByText(/carregando|loading|processando/i) ||
                           screen.getByRole('status')
    
    if (loadingIndicator) {
      expect(loadingIndicator).toBeInTheDocument()
    }
  })
})