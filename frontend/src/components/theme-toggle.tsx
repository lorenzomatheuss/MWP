"use client"

import * as React from "react"
import { Moon, Sun, Monitor } from "lucide-react"
import { useTheme } from "@/components/theme-provider"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function ThemeToggle() {
  const { setTheme, theme } = useTheme()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-10 w-10 px-0 hover:bg-accent/10 transition-all duration-300 border border-border/20"
        >
          <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Alternar tema</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="end" 
        className="bg-card/95 backdrop-blur-xl border-border/20 shadow-2xl"
      >
        <DropdownMenuItem 
          onClick={() => setTheme("light")}
          className="cursor-pointer hover:bg-accent/10 transition-colors"
        >
          <Sun className="mr-2 h-4 w-4" />
          <span>Claro</span>
          {theme === "light" && (
            <div className="ml-auto h-2 w-2 rounded-full bg-primary" />
          )}
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => setTheme("dark")}
          className="cursor-pointer hover:bg-accent/10 transition-colors"
        >
          <Moon className="mr-2 h-4 w-4" />
          <span>Escuro</span>
          {theme === "dark" && (
            <div className="ml-auto h-2 w-2 rounded-full bg-primary" />
          )}
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => setTheme("system")}
          className="cursor-pointer hover:bg-accent/10 transition-colors"
        >
          <Monitor className="mr-2 h-4 w-4" />
          <span>Sistema</span>
          {theme === "system" && (
            <div className="ml-auto h-2 w-2 rounded-full bg-primary" />
          )}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}