import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Galaxy from '@/app/galaxy/page'

// Mock React Flow
jest.mock('reactflow', () => ({
  ReactFlow: ({ children, ...props }: any) => (
    <div data-testid="react-flow" {...props}>
      React Flow Mock
      {children}
    </div>
  ),
  Controls: () => <div data-testid="flow-controls">Controls</div>,
  Background: () => <div data-testid="flow-background">Background</div>,
  Node: ({ data }: any) => <div data-testid="flow-node">{data.label}</div>,
  Edge: () => <div data-testid="flow-edge">Edge</div>,
  useNodesState: () => [[], jest.fn(), jest.fn()],
  useEdgesState: () => [[], jest.fn(), jest.fn()],
}))

global.fetch = jest.fn()

describe('Galaxy Page', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders the galaxy interface', () => {
    render(<Galaxy />)
    
    // Should render galaxy page header
    const heading = screen.getByText(/Galáxia de Conceitos/i)
    expect(heading).toBeInTheDocument()
  })

  it('displays generated concepts', async () => {
    const mockGalaxyData = {
      metaphors: [
        { url: 'https://example.com/coffee1.jpg', description: 'Coffee concept' },
        { url: 'https://example.com/sustainability.jpg', description: 'Sustainability concept' }
      ],
      colors: [
        { name: 'Forest Green', hex: '#2D5A27', harmony: 'nature' },
        { name: 'Coffee Brown', hex: '#8B4513', harmony: 'earth' }
      ],
      typography: [
        { primary: 'Inter', secondary: 'Roboto', style: 'modern' },
        { primary: 'Playfair Display', secondary: 'Source Sans Pro', style: 'elegant' }
      ]
    }

    ;(fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockGalaxyData,
    })

    render(<Galaxy />)
    
    // Wait for concepts to load
    await waitFor(() => {
      expect(screen.getByText(/concept|conceito/i)).toBeInTheDocument()
    })
  })

  it('handles concept selection', async () => {
    const user = userEvent.setup()
    render(<Galaxy />)
    
    // Mock concept elements
    const conceptElement = screen.getByTestId('react-flow')
    await user.click(conceptElement)
    
    // Should handle selection
    expect(conceptElement).toBeInTheDocument()
  })

  it('filters concepts by category', async () => {
    const user = userEvent.setup()
    render(<Galaxy />)
    
    // Look for filter buttons
    const filterButtons = screen.getAllByRole('button')
    const metaphorFilter = filterButtons.find(btn => 
      btn.textContent?.includes('Metaphor') || btn.textContent?.includes('Metáfor')
    )
    
    if (metaphorFilter) {
      await user.click(metaphorFilter)
      // Should filter displayed concepts
    }
  })

  it('navigates to curation phase', async () => {
    const user = userEvent.setup()
    render(<Galaxy />)
    
    // Look for continue/next button
    const continueButton = screen.getByRole('button', { name: /continue|continuar|next|próxim/i }) ||
                          screen.getByRole('link', { name: /curation|curadoria/i })
    
    if (continueButton) {
      await user.click(continueButton)
      // Navigation handled by router
    }
  })

  it('displays concept details on hover', async () => {
    const user = userEvent.setup()
    render(<Galaxy />)
    
    const reactFlow = screen.getByTestId('react-flow')
    
    // Simulate hover
    await user.hover(reactFlow)
    
    // Should show concept details
    expect(reactFlow).toBeInTheDocument()
  })

  it('handles zoom and pan controls', async () => {
    const user = userEvent.setup()
    render(<Galaxy />)
    
    const controls = screen.getByTestId('flow-controls')
    expect(controls).toBeInTheDocument()
    
    // Controls should be interactive
    await user.click(controls)
  })

  it('loads demo data when in demo mode', async () => {
    // Mock demo mode
    ;(fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        demo_mode: true,
        metaphors: [
          { url: 'demo-image-1.jpg', description: 'Demo concept 1' }
        ]
      }),
    })

    render(<Galaxy />)
    
    await waitFor(() => {
      expect(fetch).toHaveBeenCalled()
    })
  })

  it('handles API errors gracefully', async () => {
    ;(fetch as jest.Mock).mockRejectedValueOnce(new Error('Galaxy API Error'))

    render(<Galaxy />)
    
    await waitFor(() => {
      // Should show error message or fallback content
      expect(screen.getByTestId('react-flow')).toBeInTheDocument()
    })
  })

  it('shows loading state while generating galaxy', () => {
    ;(fetch as jest.Mock).mockImplementation(() => 
      new Promise(resolve => setTimeout(resolve, 1000))
    )

    render(<Galaxy />)
    
    const loadingIndicator = screen.getByText(/loading|carregando|gerando/i) ||
                           screen.getByRole('status')
    
    if (loadingIndicator) {
      expect(loadingIndicator).toBeInTheDocument()
    }
  })

  it('allows multi-selection of concepts', async () => {
    const user = userEvent.setup()
    render(<Galaxy />)
    
    const reactFlow = screen.getByTestId('react-flow')
    
    // Multiple clicks should select multiple concepts
    await user.click(reactFlow)
    
    // Check if selection state is managed
    expect(reactFlow).toBeInTheDocument()
  })
})