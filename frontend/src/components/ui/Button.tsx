import * as React from "react"
import { motion } from "framer-motion"
import type { HTMLMotionProps } from "framer-motion"
import { cn } from "../../lib/utils"

export interface ButtonProps extends HTMLMotionProps<"button"> {
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
  size?: "default" | "sm" | "lg" | "icon"
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", ...props }, ref) => {
    const baseStyles =
      "inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-medium ring-offset-background transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 cursor-pointer"

    const variants = {
      default:
        "bg-[#00fcb5] text-black hover:bg-[#26ffbe] shadow-[0_0_20px_rgba(0,252,181,0.25)] hover:shadow-[0_0_35px_rgba(0,252,181,0.5)] font-semibold",
      destructive:
        "bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-sm",
      outline:
        "border border-white/15 bg-transparent text-white hover:border-[#00fcb5]/60 hover:text-[#00fcb5] hover:shadow-[0_0_20px_rgba(0,252,181,0.12)]",
      secondary:
        "bg-zinc-800 text-zinc-100 hover:bg-zinc-700",
      ghost:
        "hover:bg-zinc-800/70 text-zinc-300 hover:text-white",
      link:
        "text-[#00fcb5] underline-offset-4 hover:underline",
    }

    const sizes = {
      default: "h-11 px-5 py-2",
      sm: "h-9 rounded-lg px-4 text-xs",
      lg: "h-12 rounded-xl px-8 text-sm",
      icon: "h-11 w-11",
    }

    return (
      <motion.button
        ref={ref}
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.96 }}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button }
