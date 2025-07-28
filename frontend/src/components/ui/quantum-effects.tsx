'use client'

import React, { useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'

interface QuantumParticlesProps {
  className?: string
  particleCount?: number
  colors?: string[]
}

export const QuantumParticles: React.FC<QuantumParticlesProps> = ({
  className,
  particleCount = 50,
  colors = ['#FFD700', '#00FFFF', '#8A2BE2', '#FF69B4']
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  
  useEffect(() => {
    // SSR safety check
    if (typeof window === 'undefined') return
    const canvas = canvasRef.current
    if (!canvas || typeof window === 'undefined') return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const resizeCanvas = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }

    resizeCanvas()
    window.addEventListener('resize', resizeCanvas)

    const particles: Array<{
      x: number
      y: number
      vx: number
      vy: number
      size: number
      color: string
      alpha: number
      trail: Array<{ x: number; y: number; alpha: number }>
    }> = []

    // Create particles
    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        size: Math.random() * 3 + 1,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: Math.random() * 0.5 + 0.1,
        trail: []
      })
    }

    const animate = () => {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.05)'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      particles.forEach((particle) => {
        // Update position
        particle.x += particle.vx
        particle.y += particle.vy

        // Bounce off edges
        if (particle.x < 0 || particle.x > canvas.width) particle.vx *= -1
        if (particle.y < 0 || particle.y > canvas.height) particle.vy *= -1

        // Add to trail
        particle.trail.push({ x: particle.x, y: particle.y, alpha: particle.alpha })
        if (particle.trail.length > 10) particle.trail.shift()

        // Draw trail
        particle.trail.forEach((point, index) => {
          const trailAlpha = (index / particle.trail.length) * point.alpha
          ctx.beginPath()
          ctx.arc(point.x, point.y, particle.size * (index / particle.trail.length), 0, Math.PI * 2)
          ctx.fillStyle = `${particle.color}${Math.floor(trailAlpha * 255).toString(16).padStart(2, '0')}`
          ctx.fill()
        })

        // Draw particle
        ctx.beginPath()
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2)
        ctx.fillStyle = `${particle.color}${Math.floor(particle.alpha * 255).toString(16).padStart(2, '0')}`
        ctx.fill()

        // Add glow effect
        ctx.shadowBlur = 20
        ctx.shadowColor = particle.color
        ctx.fill()
        ctx.shadowBlur = 0
      })

      requestAnimationFrame(animate)
    }

    animate()

    return () => {
      window.removeEventListener('resize', resizeCanvas)
    }
  }, [particleCount, colors])

  // SSR safety check
  if (typeof window === 'undefined') {
    return <div className={cn('fixed inset-0 pointer-events-none z-0', className)} />
  }

  return (
    <canvas
      ref={canvasRef}
      className={cn('fixed inset-0 pointer-events-none z-0', className)}
      style={{ mixBlendMode: 'screen' }}
    />
  )
}

interface NeuralNetworkProps {
  className?: string
  nodeCount?: number
}

export const NeuralNetwork: React.FC<NeuralNetworkProps> = ({
  className,
  nodeCount = 20
}) => {
  const svgRef = useRef<SVGSVGElement>(null)
  
  useEffect(() => {
    // SSR safety check
    if (typeof window === 'undefined') return
    const svg = svgRef.current
    if (!svg) return

    const nodes: Array<{ x: number; y: number; connections: number[] }> = []
    const width = 800
    const height = 600

    // Create nodes
    for (let i = 0; i < nodeCount; i++) {
      nodes.push({
        x: Math.random() * width,
        y: Math.random() * height,
        connections: []
      })
    }

    // Create connections
    nodes.forEach((node, index) => {
      const connectionCount = Math.floor(Math.random() * 3) + 1
      for (let i = 0; i < connectionCount; i++) {
        const targetIndex = Math.floor(Math.random() * nodes.length)
        if (targetIndex !== index && !node.connections.includes(targetIndex)) {
          node.connections.push(targetIndex)
        }
      }
    })

    // Animate connections
    const animateConnections = () => {
      const lines = svg.querySelectorAll('.neural-line')
      lines.forEach((line, index) => {
        setTimeout(() => {
          line.classList.add('animate-data-stream')
        }, index * 100)
      })
    }

    animateConnections()
    const interval = setInterval(animateConnections, 5000)

    return () => clearInterval(interval)
  }, [nodeCount])

  // SSR safety check
  if (typeof window === 'undefined') {
    return <div className={cn('absolute inset-0 w-full h-full opacity-20', className)} />
  }

  return (
    <svg
      ref={svgRef}
      viewBox="0 0 800 600"
      className={cn('absolute inset-0 w-full h-full opacity-20', className)}
    >
      <defs>
        <linearGradient id="neuralGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFD700" stopOpacity="0.6" />
          <stop offset="50%" stopColor="#00FFFF" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#8A2BE2" stopOpacity="0.6" />
        </linearGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
          <feMerge> 
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
      
      {/* Render connections */}
      {Array.from({ length: 20 }, (_, i) => (
        <line
          key={i}
          x1={Math.random() * 800}
          y1={Math.random() * 600}
          x2={Math.random() * 800}
          y2={Math.random() * 600}
          stroke="url(#neuralGradient)"
          strokeWidth="1"
          className="neural-line opacity-60"
          filter="url(#glow)"
        />
      ))}
      
      {/* Render nodes */}
      {Array.from({ length: 20 }, (_, i) => (
        <circle
          key={i}
          cx={Math.random() * 800}
          cy={Math.random() * 600}
          r="3"
          fill="url(#neuralGradient)"
          className="animate-neon-pulse"
          filter="url(#glow)"
        />
      ))}
    </svg>
  )
}

interface HolographicTextProps {
  children: React.ReactNode
  className?: string
  glitch?: boolean
}

export const HolographicText: React.FC<HolographicTextProps> = ({
  children,
  className,
  glitch = false
}) => {
  return (
    <span
      className={cn(
        'relative font-display font-bold bg-quantum-gradient bg-clip-text text-transparent animate-holographic-shimmer',
        glitch && 'hover:animate-glitch',
        className
      )}
      style={{
        backgroundSize: '200% 200%',
        textShadow: '0 0 10px rgba(255, 215, 0, 0.5), 0 0 20px rgba(0, 255, 255, 0.3), 0 0 30px rgba(138, 43, 226, 0.2)'
      }}
    >
      {children}
      {glitch && (
        <>
          <span
            className="absolute inset-0 bg-quantum-gradient bg-clip-text text-transparent opacity-50"
            style={{ transform: 'translate(-2px, 0)', filter: 'hue-rotate(90deg)' }}
          >
            {children}
          </span>
          <span
            className="absolute inset-0 bg-quantum-gradient bg-clip-text text-transparent opacity-30"
            style={{ transform: 'translate(2px, 0)', filter: 'hue-rotate(180deg)' }}
          >
            {children}
          </span>
        </>
      )}
    </span>
  )
}

interface QuantumButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'quantum' | 'neon' | 'glass'
  size?: 'sm' | 'md' | 'lg'
  children: React.ReactNode
}

export const QuantumButton: React.FC<QuantumButtonProps> = ({
  variant = 'quantum',
  size = 'md',
  className,
  children,
  ...props
}) => {
  const variants = {
    default: 'bg-primary text-primary-foreground hover:bg-primary/90',
    quantum: 'bg-quantum-gradient text-black font-bold shadow-quantum hover:shadow-neon-purple hover:scale-105 relative overflow-hidden',
    neon: 'bg-transparent border-2 border-brand-neon-cyan text-brand-neon-cyan hover:bg-brand-neon-cyan hover:text-black shadow-neon-cyan hover:shadow-neon-purple',
    glass: 'bg-brand-glass-white backdrop-blur-quantum border border-brand-glass-white text-foreground hover:bg-opacity-20 hover:border-brand-neon-cyan shadow-glass'
  }

  const sizes = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg'
  }

  return (
    <button
      className={cn(
        'inline-flex items-center justify-center rounded-xl font-heading font-medium transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 transform-gpu',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {variant === 'quantum' && (
        <div className="absolute inset-0 bg-holographic opacity-0 hover:opacity-20 transition-opacity duration-300" />
      )}
      <span className="relative z-10">{children}</span>
    </button>
  )
}

interface DataStreamProps {
  className?: string
  lineCount?: number
}

export const DataStream: React.FC<DataStreamProps> = ({
  className,
  lineCount = 10
}) => {
  return (
    <div className={cn('absolute inset-0 overflow-hidden pointer-events-none', className)}>
      {Array.from({ length: lineCount }, (_, i) => (
        <div
          key={i}
          className="absolute h-px bg-gradient-to-r from-transparent via-brand-neon-cyan to-transparent animate-data-stream opacity-30"
          style={{
            top: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 3}s`,
            animationDuration: `${3 + Math.random() * 2}s`
          }}
        />
      ))}
    </div>
  )
}

const QuantumEffects = {
  QuantumParticles,
  NeuralNetwork,
  HolographicText,
  QuantumButton,
  DataStream
}

export default QuantumEffects