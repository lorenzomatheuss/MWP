import * as React from "react"

import { cn } from "@/lib/utils"

const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    variant?: 'default' | 'glass' | 'quantum' | 'neon' | 'morphing'
  }
>(({ className, variant = 'default', ...props }, ref) => {
  const variants = {
    default: "rounded-xl border bg-card text-card-foreground shadow-sm",
    glass: "rounded-xl bg-brand-glass-white backdrop-blur-quantum border border-brand-glass-white text-card-foreground shadow-glass hover:border-brand-neon-cyan transition-all duration-500",
    quantum: "rounded-xl bg-gradient-to-br from-card to-card/50 text-card-foreground shadow-quantum border border-brand-gold/20 hover:border-brand-gold/40 transition-all duration-300",
    neon: "rounded-xl bg-card/80 backdrop-blur-quantum text-card-foreground border-2 border-brand-neon-cyan shadow-neon-cyan hover:shadow-neon-purple transition-all duration-300",
    morphing: "rounded-xl bg-card text-card-foreground shadow-lg animate-morphing-glow hover:scale-105 transition-transform duration-300"
  }
  
  return (
    <div
      ref={ref}
      className={cn(
        variants[variant],
        "transform-gpu",
        className
      )}
      {...props}
    />
  )
})
Card.displayName = "Card"

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div 
    ref={ref} 
    className={cn(
      "flex flex-col space-y-2 p-6 relative z-10", 
      className
    )} 
    {...props} 
  />
))
CardHeader.displayName = "CardHeader"

const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      "text-2xl font-heading font-semibold leading-none tracking-tight text-foreground",
      className
    )}
    {...props}
  />
))
CardTitle.displayName = "CardTitle"

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn(
      "text-sm text-muted-foreground/80 font-sans leading-relaxed", 
      className
    )}
    {...props}
  />
))
CardDescription.displayName = "CardDescription"

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div 
    ref={ref} 
    className={cn(
      "p-6 pt-0 relative z-10", 
      className
    )} 
    {...props} 
  />
))
CardContent.displayName = "CardContent"

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("flex items-center p-6 pt-0", className)} {...props} />
))
CardFooter.displayName = "CardFooter"

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }