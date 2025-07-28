import { render, screen } from '@testing-library/react';
import RootLayout, { metadata } from '@/app/layout';

// Mock do Next.js font
jest.mock('next/font/google', () => ({
  Inter: () => ({
    className: 'mocked-inter-font'
  })
}));

describe('RootLayout', () => {
  it('renders children correctly', () => {
    const testContent = 'Test page content';
    
    render(
      <RootLayout>
        <div>{testContent}</div>
      </RootLayout>
    );
    
    expect(screen.getByText(testContent)).toBeInTheDocument();
  });

  it('includes proper HTML structure', () => {
    render(
      <RootLayout>
        <div>Content</div>
      </RootLayout>
    );
    
    const htmlElement = document.querySelector('html');
    const bodyElement = document.querySelector('body');
    
    expect(htmlElement).toHaveAttribute('lang', 'en');
    expect(bodyElement).toHaveClass('mocked-inter-font');
  });

  it('applies Inter font className to body', () => {
    render(
      <RootLayout>
        <div>Content</div>
      </RootLayout>
    );
    
    const bodyElement = document.querySelector('body');
    expect(bodyElement).toHaveClass('mocked-inter-font');
  });

  it('renders without crashing with different children', () => {
    const complexChildren = (
      <div>
        <header>Header</header>
        <main>Main content</main>
        <footer>Footer</footer>
      </div>
    );
    
    expect(() => {
      render(
        <RootLayout>
          {complexChildren}
        </RootLayout>
      );
    }).not.toThrow();
  });

  it('handles empty children', () => {
    expect(() => {
      render(
        <RootLayout>
          {null}
        </RootLayout>
      );
    }).not.toThrow();
  });
});

describe('Layout metadata', () => {
  it('has correct metadata configuration', () => {
    expect(metadata).toBeDefined();
    expect(metadata.title).toBe('5º Elemento');
    expect(metadata.description).toBe('4 elementos criam a identidade. O 5º cria domínio de mercado.');
  });

  it('has proper metadata structure', () => {
    expect(typeof metadata.title).toBe('string');
    expect(typeof metadata.description).toBe('string');
    expect(metadata.title.length).toBeGreaterThan(0);
    expect(metadata.description.length).toBeGreaterThan(0);
  });
});