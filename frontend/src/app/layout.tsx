import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import '@/styles/mobile-optimizations.css'
import { ThemeProvider } from '@/components/theme-provider'
import { ErrorNotification } from '@/components/ui/error-notification'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: '5º Elemento - Plataforma Premium de Branding',
  description: '4 elementos criam a identidade. O 5º cria domínio de mercado. Plataforma premium para agências e consultores de branding.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          defaultTheme="dark"
          storageKey="quintoelemento-theme"
        >
          {children}
          <ErrorNotification />
        </ThemeProvider>
      </body>
    </html>
  )
}