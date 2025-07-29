import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-heading font-medium ring-offset-background transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 relative overflow-visible transform-gpu",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90 shadow-quantum hover:shadow-neon-cyan hover:-translate-y-1",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-lg hover:shadow-red-500/25",
        outline:
          "border-2 border-brand-glass-white bg-transparent backdrop-blur-quantum hover:bg-brand-glass-white hover:border-brand-neon-cyan text-foreground hover:text-brand-neon-cyan transition-all duration-500",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80 backdrop-blur-quantum",
        ghost: "hover:bg-brand-glass-white hover:text-brand-neon-cyan backdrop-blur-sm transition-all duration-300",
        link: "text-primary underline-offset-4 hover:underline hover:text-brand-neon-cyan",
        quantum: "bg-quantum-gradient text-black font-bold shadow-quantum hover:shadow-neon-purple hover:scale-105 before:absolute before:inset-0 before:bg-holographic before:opacity-0 hover:before:opacity-20 before:transition-opacity before:duration-300",
        neon: "bg-transparent border-2 border-brand-neon-cyan text-brand-neon-cyan hover:bg-brand-neon-cyan hover:text-black shadow-neon-cyan hover:shadow-neon-purple transition-all duration-300",
        glass: "bg-brand-glass-white backdrop-blur-quantum border border-brand-glass-white text-foreground hover:bg-opacity-20 hover:border-brand-neon-cyan shadow-glass",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }