import { render, screen } from '@testing-library/react'
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from '@/components/ui/card'

describe('Card Components', () => {
  describe('Card', () => {
    it('renders card container', () => {
      render(
        <Card data-testid="card">
          <div>Card content</div>
        </Card>
      )
      
      const card = screen.getByTestId('card')
      expect(card).toBeInTheDocument()
      expect(card).toHaveClass('rounded-lg', 'border', 'bg-card')
    })

    it('applies custom className', () => {
      render(
        <Card className="custom-card" data-testid="card">
          Content
        </Card>
      )
      
      const card = screen.getByTestId('card')
      expect(card).toHaveClass('custom-card')
    })
  })

  describe('CardHeader', () => {
    it('renders card header', () => {
      render(
        <Card>
          <CardHeader data-testid="header">
            <CardTitle>Title</CardTitle>
          </CardHeader>
        </Card>
      )
      
      const header = screen.getByTestId('header')
      expect(header).toBeInTheDocument()
      expect(header).toHaveClass('flex', 'flex-col', 'space-y-1.5', 'p-6')
    })
  })

  describe('CardTitle', () => {
    it('renders card title', () => {
      render(
        <Card>
          <CardHeader>
            <CardTitle>Test Title</CardTitle>
          </CardHeader>
        </Card>
      )
      
      const title = screen.getByText('Test Title')
      expect(title).toBeInTheDocument()
      expect(title).toHaveClass('text-2xl', 'font-semibold')
    })
  })

  describe('CardDescription', () => {
    it('renders card description', () => {
      render(
        <Card>
          <CardHeader>
            <CardDescription>Test description</CardDescription>
          </CardHeader>
        </Card>
      )
      
      const description = screen.getByText('Test description')
      expect(description).toBeInTheDocument()
      expect(description).toHaveClass('text-sm', 'text-muted-foreground')
    })
  })

  describe('CardContent', () => {
    it('renders card content', () => {
      render(
        <Card>
          <CardContent data-testid="content">
            <p>Card content here</p>
          </CardContent>
        </Card>
      )
      
      const content = screen.getByTestId('content')
      expect(content).toBeInTheDocument()
      expect(content).toHaveClass('p-6', 'pt-0')
    })
  })

  describe('Complete Card', () => {
    it('renders complete card structure', () => {
      render(
        <Card>
          <CardHeader>
            <CardTitle>Brand Analysis</CardTitle>
            <CardDescription>AI-powered brand insights</CardDescription>
          </CardHeader>
          <CardContent>
            <p>Detailed analysis content goes here</p>
          </CardContent>
        </Card>
      )
      
      expect(screen.getByText('Brand Analysis')).toBeInTheDocument()
      expect(screen.getByText('AI-powered brand insights')).toBeInTheDocument()
      expect(screen.getByText('Detailed analysis content goes here')).toBeInTheDocument()
    })

    it('supports nested content', () => {
      render(
        <Card>
          <CardHeader>
            <CardTitle>Project Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div>
              <h3>Keywords</h3>
              <ul>
                <li>sustainable</li>
                <li>premium</li>
                <li>modern</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      )
      
      expect(screen.getByText('Keywords')).toBeInTheDocument()
      expect(screen.getByText('sustainable')).toBeInTheDocument()
      expect(screen.getByText('premium')).toBeInTheDocument()
      expect(screen.getByText('modern')).toBeInTheDocument()
    })
  })
})