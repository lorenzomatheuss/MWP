import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRouter, useSearchParams } from 'next/navigation';
import BrandKitPage from '@/app/brand-kit/page';

// Mock Next.js router and search params
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useSearchParams: jest.fn(),
}));

// Mock fetch globally
global.fetch = jest.fn();

// Mock URL.createObjectURL and URL.revokeObjectURL
Object.defineProperty(URL, 'createObjectURL', {
  writable: true,
  value: jest.fn(() => 'blob:mock-url'),
});

Object.defineProperty(URL, 'revokeObjectURL', {
  writable: true,
  value: jest.fn(),
});

// Mock document.createElement and appendChild for download functionality
const mockLink = {
  href: '',
  download: '',
  click: jest.fn(),
};

const originalCreateElement = document.createElement;
document.createElement = jest.fn((tagName) => {
  if (tagName === 'a') {
    return mockLink as any;
  }
  return originalCreateElement.call(document, tagName);
});

const mockAppendChild = jest.fn();
const mockRemoveChild = jest.fn();
document.body.appendChild = mockAppendChild;
document.body.removeChild = mockRemoveChild;

describe('BrandKitPage', () => {
  const mockRouter = {
    push: jest.fn(),
    back: jest.fn(),
    refresh: jest.fn(),
  };

  const mockSearchParams = {
    get: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    (useSearchParams as jest.Mock).mockReturnValue(mockSearchParams);
    
    // Default search params
    mockSearchParams.get.mockImplementation((key: string) => {
      switch (key) {
        case 'projectId': return 'test-project-123';
        case 'briefId': return 'test-brief-123';
        case 'brandName': return 'Test Brand';
        case 'curatedAssets': return '[]';
        default: return null;
      }
    });
  });

  it('renders loading state initially', async () => {
    // Mock fetch to delay response
    (global.fetch as jest.Mock).mockImplementation(() => 
      new Promise(resolve => setTimeout(resolve, 100))
    );

    render(<BrandKitPage />);

    expect(screen.getByText('Gerando seu Kit de Marca')).toBeInTheDocument();
    expect(screen.getByText('Compilando todos os elementos e criando diretrizes...')).toBeInTheDocument();
  });

  it('renders brand kit page with example data when API fails', async () => {
    // Mock fetch to fail
    (global.fetch as jest.Mock).mockRejectedValue(new Error('API Error'));

    // Mock window.alert
    window.alert = jest.fn();

    render(<BrandKitPage />);

    await waitFor(() => {
      expect(screen.getByText('Test Brand')).toBeInTheDocument();
    });

    expect(screen.getByText('Kit de Marca Completo •')).toBeInTheDocument();
    expect(screen.getByText('Baixar Kit Completo')).toBeInTheDocument();
  });

  it('renders navigation tabs correctly', async () => {
    (global.fetch as jest.Mock).mockRejectedValue(new Error('API Error'));
    window.alert = jest.fn();

    render(<BrandKitPage />);

    await waitFor(() => {
      expect(screen.getByText('Visão Geral')).toBeInTheDocument();
    });

    expect(screen.getByText('Diretrizes')).toBeInTheDocument();
    expect(screen.getByText('Aplicações')).toBeInTheDocument();
  });

  it('switches between tabs correctly', async () => {
    (global.fetch as jest.Mock).mockRejectedValue(new Error('API Error'));
    window.alert = jest.fn();
    const user = userEvent.setup();

    render(<BrandKitPage />);

    await waitFor(() => {
      expect(screen.getByText('Paleta de Cores')).toBeInTheDocument();
    });

    // Click on Guidelines tab
    const guidelinesTab = screen.getByText('Diretrizes');
    await user.click(guidelinesTab);

    // Should show guidelines content
    await waitFor(() => {
      expect(screen.getByText('Cover')).toBeInTheDocument();
    });

    // Click on Applications tab
    const applicationsTab = screen.getByText('Aplicações');
    await user.click(applicationsTab);

    // Should show applications content
    await waitFor(() => {
      expect(screen.getByText('Aplicações em Desenvolvimento')).toBeInTheDocument();
    });
  });

  it('handles back button click', async () => {
    (global.fetch as jest.Mock).mockRejectedValue(new Error('API Error'));
    window.alert = jest.fn();
    const user = userEvent.setup();

    render(<BrandKitPage />);

    await waitFor(() => {
      expect(screen.getByText('Test Brand')).toBeInTheDocument();
    });

    const backButton = screen.getByText('Voltar');
    await user.click(backButton);

    expect(mockRouter.back).toHaveBeenCalledTimes(1);
  });

  it('handles download button click', async () => {
    (global.fetch as jest.Mock).mockRejectedValue(new Error('API Error'));
    window.alert = jest.fn();
    const user = userEvent.setup();

    render(<BrandKitPage />);

    await waitFor(() => {
      expect(screen.getByText('Test Brand')).toBeInTheDocument();
    });

    const downloadButton = screen.getByText('Baixar Kit Completo');
    await user.click(downloadButton);

    // Should show downloading state
    await waitFor(() => {
      expect(screen.getByText('Preparando Download...')).toBeInTheDocument();
    });

    // Wait for download to complete
    await waitFor(() => {
      expect(screen.getByText('Baixar Kit Completo')).toBeInTheDocument();
    }, { timeout: 1000 });

    // Check if download methods were called
    expect(mockLink.click).toHaveBeenCalled();
    expect(mockAppendChild).toHaveBeenCalled();
    expect(mockRemoveChild).toHaveBeenCalled();
  });

  it('displays color palette correctly', async () => {
    (global.fetch as jest.Mock).mockRejectedValue(new Error('API Error'));
    window.alert = jest.fn();

    render(<BrandKitPage />);

    await waitFor(() => {
      expect(screen.getByText('Paleta de Cores')).toBeInTheDocument();
    });

    // Should display colors
    expect(screen.getByText('Primary')).toBeInTheDocument();
    expect(screen.getByText('Secondary')).toBeInTheDocument();
    expect(screen.getByText('#2F855A')).toBeInTheDocument();
    expect(screen.getByText('#68D391')).toBeInTheDocument();
  });

  it('displays typography section correctly', async () => {
    (global.fetch as jest.Mock).mockRejectedValue(new Error('API Error'));
    window.alert = jest.fn();

    render(<BrandKitPage />);

    await waitFor(() => {
      expect(screen.getByText('Tipografia')).toBeInTheDocument();
    });

    expect(screen.getByText('Montserrat')).toBeInTheDocument();
    expect(screen.getByText('Open Sans')).toBeInTheDocument();
    expect(screen.getByText('Títulos e Cabeçalhos')).toBeInTheDocument();
    expect(screen.getByText('Corpo e Parágrafos')).toBeInTheDocument();
  });

  it('displays logos section correctly', async () => {
    (global.fetch as jest.Mock).mockRejectedValue(new Error('API Error'));
    window.alert = jest.fn();

    render(<BrandKitPage />);

    await waitFor(() => {
      expect(screen.getByText('Logótipos')).toBeInTheDocument();
    });

    expect(screen.getByText('2 variações geradas')).toBeInTheDocument();
  });

  it('handles missing search params gracefully', async () => {
    mockSearchParams.get.mockReturnValue(null);
    (global.fetch as jest.Mock).mockRejectedValue(new Error('API Error'));

    render(<BrandKitPage />);

    // Should still render but with default values
    await waitFor(() => {
      expect(screen.getByText('Minha Marca')).toBeInTheDocument();
    });
  });

  it('handles malformed curatedAssets param', async () => {
    mockSearchParams.get.mockImplementation((key: string) => {
      if (key === 'curatedAssets') return 'invalid-json';
      if (key === 'brandName') return 'Test Brand';
      return 'test-value';
    });

    (global.fetch as jest.Mock).mockRejectedValue(new Error('API Error'));
    window.alert = jest.fn();
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

    render(<BrandKitPage />);

    await waitFor(() => {
      expect(screen.getByText('Test Brand')).toBeInTheDocument();
    });

    expect(consoleSpy).toHaveBeenCalledWith('Erro ao parsear assets curados:', expect.any(SyntaxError));
    
    consoleSpy.mockRestore();
  });

  it('shows applications in development message', async () => {
    (global.fetch as jest.Mock).mockRejectedValue(new Error('API Error'));
    window.alert = jest.fn();
    const user = userEvent.setup();

    render(<BrandKitPage />);

    await waitFor(() => {
      expect(screen.getByText('Test Brand')).toBeInTheDocument();
    });

    // Click on Applications tab
    const applicationsTab = screen.getByText('Aplicações');
    await user.click(applicationsTab);

    await waitFor(() => {
      expect(screen.getByText('Aplicações em Desenvolvimento')).toBeInTheDocument();
    });

    expect(screen.getByText('Mockups de cartão de visita, papel timbrado e redes sociais serão gerados em breve.')).toBeInTheDocument();
    expect(screen.getByText('Solicitar Aplicações Personalizadas')).toBeInTheDocument();
  });

  it('generates brand kit successfully with API response', async () => {
    const mockBrandKit = {
      brand_name: 'API Brand',
      guidelines_pdf: 'mock-pdf-data',
      assets_package: {
        logos: [{ format: 'PNG', url: 'mock-logo-url' }],
        colors: [{ name: 'Blue', hex: '#0000FF', rgb: 'RGB(0, 0, 255)' }],
        fonts: [{ name: 'Arial', weights: ['Regular', 'Bold'] }],
        mockups: []
      },
      presentation_deck: 'mock-deck',
      guidelines_pages: {
        cover: 'mock-cover-url',
        logo_usage: 'mock-usage-url',
        color_palette: 'mock-palette-url',
        typography: 'mock-typography-url',
        applications: 'mock-apps-url'
      }
    };

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockBrandKit)
    });

    render(<BrandKitPage />);

    await waitFor(() => {
      expect(screen.getByText('API Brand')).toBeInTheDocument();
    });

    expect(screen.getByText('Blue')).toBeInTheDocument();
    expect(screen.getByText('#0000FF')).toBeInTheDocument();
    expect(screen.getByText('Arial')).toBeInTheDocument();
  });

  it('renders responsive design elements', async () => {
    (global.fetch as jest.Mock).mockRejectedValue(new Error('API Error'));
    window.alert = jest.fn();

    render(<BrandKitPage />);

    await waitFor(() => {
      expect(screen.getByText('Test Brand')).toBeInTheDocument();
    });

    // Check for responsive classes
    const backButton = screen.getByText('Voltar').parentElement;
    expect(backButton).toHaveClass('flex-shrink-0');

    const header = screen.getByText('Fase 4: Kit de Marca Completo');
    expect(header).toHaveClass('text-lg', 'sm:text-xl', 'lg:text-2xl');
  });
});