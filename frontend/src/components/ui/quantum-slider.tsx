'use client'

import React from 'react'
import { cn } from '@/lib/utils'

interface QuantumSliderProps {
  label: string
  leftLabel: string
  rightLabel: string
  value: number
  onChange: (value: number) => void
  className?: string
  color?: 'gold' | 'cyan' | 'purple' | 'pink'
}

export const QuantumSlider: React.FC<QuantumSliderProps> = ({
  label,
  leftLabel,
  rightLabel,
  value,
  onChange,
  className,
  color = 'gold'
}) => {
  const colorClasses = {
    gold: 'from-brand-gold to-brand-gold-light',
    cyan: 'from-brand-neon-cyan to-brand-quantum-blue',
    purple: 'from-brand-neon-purple to-brand-neon-pink',
    pink: 'from-brand-neon-pink to-brand-gold'
  }

  const glowColors = {
    gold: 'shadow-[0_0_20px_rgba(255,215,0,0.5)]',
    cyan: 'shadow-[0_0_20px_rgba(0,255,255,0.5)]',
    purple: 'shadow-[0_0_20px_rgba(138,43,226,0.5)]',
    pink: 'shadow-[0_0_20px_rgba(255,105,180,0.5)]'
  }

  return (
    <div className={cn('space-y-4 p-6 rounded-2xl bg-brand-glass-white backdrop-blur-quantum border border-brand-glass-white hover:border-brand-neon-cyan transition-all duration-500', className)}>
      <h4 className="font-heading font-bold text-center text-lg text-foreground">
        {label}
      </h4>
      
      <div className="relative">
        <div className="flex justify-between text-sm text-muted-foreground mb-4 font-sans">
          <span className="font-medium">{leftLabel}</span>
          <span className="font-medium">{rightLabel}</span>
        </div>
        
        <div className="relative h-3 rounded-full bg-card/50 backdrop-blur-sm overflow-hidden">
          {/* Background gradient track */}
          <div className="absolute inset-0 bg-gradient-to-r from-brand-glass-white via-transparent to-brand-glass-white opacity-50" />
          
          {/* Animated progress */}
          <div 
            className={cn(
              'absolute left-0 top-0 h-full rounded-full transition-all duration-300',
              `bg-gradient-to-r ${colorClasses[color]}`,
              glowColors[color]
            )}
            style={{ width: `${value}%` }}
          >
            {/* Shimmer effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-holographic-shimmer" />
          </div>
          
          {/* Quantum particles along the track */}
          <div className="absolute inset-0 flex items-center">
            {Array.from({ length: 5 }, (_, i) => (
              <div
                key={i}
                className="w-1 h-1 rounded-full bg-white/60 animate-pulse"
                style={{
                  left: `${(i + 1) * 18}%`,
                  animationDelay: `${i * 0.2}s`
                }}
              />
            ))}
          </div>
        </div>
        
        {/* Interactive slider input */}
        <input
          type="range"
          min="0"
          max="100"
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
        
        {/* Quantum slider thumb */}
        <div 
          className={cn(
            'absolute top-1/2 w-6 h-6 rounded-full transform -translate-y-1/2 -translate-x-1/2 transition-all duration-300 cursor-pointer',
            `bg-gradient-to-br ${colorClasses[color]}`,
            glowColors[color],
            'border-2 border-white/20 hover:scale-110 hover:border-white/40'
          )}
          style={{ left: `${value}%` }}
        >
          {/* Inner glow */}
          <div className="absolute inset-1 rounded-full bg-white/20 animate-pulse" />
          
          {/* Orbiting particles */}
          <div className="absolute inset-0 animate-spin" style={{ animationDuration: '4s' }}>
            <div className="absolute -top-1 -left-1 w-2 h-2 rounded-full bg-white/60" />
          </div>
        </div>
      </div>
      
      {/* Value display */}
      <div className="flex justify-center mt-4">
        <div className={cn(
          'px-4 py-2 rounded-xl font-heading font-bold text-sm',
          `bg-gradient-to-r ${colorClasses[color]} text-black`,
          'shadow-lg backdrop-blur-sm'
        )}>
          {value}%
        </div>
      </div>
      
      {/* Quantum field visualization */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl">
        <div className="absolute top-2 left-2 w-1 h-1 bg-brand-gold rounded-full animate-particle-drift opacity-60" />
        <div className="absolute bottom-4 right-6 w-1 h-1 bg-brand-neon-cyan rounded-full animate-particle-drift opacity-40" style={{ animationDelay: '1s' }} />
        <div className="absolute top-8 right-4 w-1 h-1 bg-brand-neon-purple rounded-full animate-particle-drift opacity-50" style={{ animationDelay: '2s' }} />
      </div>
    </div>
  )
}

export default QuantumSlider