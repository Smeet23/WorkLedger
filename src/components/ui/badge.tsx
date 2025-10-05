import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground hover:bg-primary/80 shadow-sm",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80 shadow-sm",
        outline: "text-foreground border-border hover:bg-accent",
        success:
          "border-transparent bg-success text-success-foreground hover:bg-success/80 shadow-sm",
        warning:
          "border-transparent bg-warning text-warning-foreground hover:bg-warning/80 shadow-sm",
        error:
          "border-transparent bg-error text-error-foreground hover:bg-error/80 shadow-sm",
        info:
          "border-transparent bg-info text-info-foreground hover:bg-info/80 shadow-sm",
        // Soft variants with light backgrounds
        "success-soft":
          "border-transparent bg-success-light text-success hover:bg-success-light/80",
        "warning-soft":
          "border-transparent bg-warning-light text-warning hover:bg-warning-light/80",
        "error-soft":
          "border-transparent bg-error-light text-error hover:bg-error-light/80",
        "info-soft":
          "border-transparent bg-info-light text-info hover:bg-info-light/80",
      },
      size: {
        default: "px-2.5 py-0.5 text-xs",
        sm: "px-2 py-0.5 text-[10px]",
        lg: "px-3 py-1 text-sm",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  dot?: boolean
}

function Badge({ className, variant, size, dot, children, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant, size }), className)} {...props}>
      {dot && <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-current" />}
      {children}
    </div>
  )
}

export { Badge, badgeVariants }