import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"
import { Card } from "@/components/ui/card"
import { TrendingUp, TrendingDown, Minus, type LucideIcon } from "lucide-react"

const statCardVariants = cva(
  "relative overflow-hidden transition-all duration-200 hover:shadow-md min-h-[132px]",
  {
    variants: {
      variant: {
        default: "",
        gradient: "bg-gradient-to-br",
        bordered: "border-2",
      },
      colorScheme: {
        blue: "",
        green: "",
        purple: "",
        orange: "",
        pink: "",
        gray: "",
      },
    },
    compoundVariants: [
      // Gradient variants
      { variant: "gradient", colorScheme: "blue", className: "from-blue-500/5 to-blue-500/10" },
      { variant: "gradient", colorScheme: "green", className: "from-green-500/5 to-green-500/10" },
      { variant: "gradient", colorScheme: "purple", className: "from-purple-500/5 to-purple-500/10" },
      { variant: "gradient", colorScheme: "orange", className: "from-orange-500/5 to-orange-500/10" },
      { variant: "gradient", colorScheme: "pink", className: "from-pink-500/5 to-pink-500/10" },
      { variant: "gradient", colorScheme: "gray", className: "from-gray-500/5 to-gray-500/10" },
      // Bordered variants
      { variant: "bordered", colorScheme: "blue", className: "border-blue-200 bg-blue-50/50" },
      { variant: "bordered", colorScheme: "green", className: "border-green-200 bg-green-50/50" },
      { variant: "bordered", colorScheme: "purple", className: "border-purple-200 bg-purple-50/50" },
      { variant: "bordered", colorScheme: "orange", className: "border-orange-200 bg-orange-50/50" },
      { variant: "bordered", colorScheme: "pink", className: "border-pink-200 bg-pink-50/50" },
      { variant: "bordered", colorScheme: "gray", className: "border-gray-200 bg-gray-50/50" },
    ],
    defaultVariants: {
      variant: "default",
      colorScheme: "blue",
    },
  }
)

const iconVariants = cva("rounded-lg p-3", {
  variants: {
    colorScheme: {
      blue: "bg-blue-500/10 text-blue-600",
      green: "bg-green-500/10 text-green-600",
      purple: "bg-purple-500/10 text-purple-600",
      orange: "bg-orange-500/10 text-orange-600",
      pink: "bg-pink-500/10 text-pink-600",
      gray: "bg-gray-500/10 text-gray-600",
    },
  },
  defaultVariants: {
    colorScheme: "blue",
  },
})

const trendVariants = cva("flex items-center gap-1 text-sm font-medium", {
  variants: {
    direction: {
      up: "text-green-600",
      down: "text-red-600",
      neutral: "text-gray-600",
    },
  },
  defaultVariants: {
    direction: "neutral",
  },
})

interface StatCardProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "color">,
    VariantProps<typeof statCardVariants> {
  title: string
  value: string | number
  icon?: LucideIcon
  description?: string
  trend?: {
    value: number
    label?: string
    direction?: "up" | "down" | "neutral"
  }
}

const StatCard = React.forwardRef<HTMLDivElement, StatCardProps>(
  (
    {
      title,
      value,
      icon: Icon,
      description,
      trend,
      variant,
      colorScheme,
      className,
      ...props
    },
    ref
  ) => {
    const getTrendDirection = () => {
      if (!trend) return "neutral"
      return trend.direction || (trend.value > 0 ? "up" : trend.value < 0 ? "down" : "neutral")
    }

    const getTrendIcon = () => {
      const direction = getTrendDirection()
      if (direction === "up") return <TrendingUp className="h-4 w-4" />
      if (direction === "down") return <TrendingDown className="h-4 w-4" />
      return <Minus className="h-4 w-4" />
    }

    return (
      <Card
        ref={ref}
        className={cn(statCardVariants({ variant, colorScheme }), className)}
        {...props}
      >
        <div className="p-6 h-full">
          <div className="flex items-start justify-between">
            <div className="space-y-1 flex-1">
              <p className="text-sm font-medium text-muted-foreground">{title}</p>
              <div className="flex items-baseline gap-2">
                <p className="text-3xl font-bold tracking-tight">{value}</p>
                {trend && (
                  <span className={cn(trendVariants({ direction: getTrendDirection() }))}>
                    {getTrendIcon()}
                    <span>{Math.abs(trend.value)}%</span>
                  </span>
                )}
              </div>
              {description && (
                <p className="text-xs text-muted-foreground">{description}</p>
              )}
              {trend?.label && (
                <p className="text-xs text-muted-foreground">{trend.label}</p>
              )}
            </div>

            {Icon && (
              <div className={cn(iconVariants({ colorScheme }))}>
                <Icon className="h-5 w-5" />
              </div>
            )}
          </div>
        </div>

        {/* Decorative gradient overlay */}
        {variant === "gradient" && (
          <div className="absolute inset-0 bg-gradient-to-br from-white/50 to-transparent pointer-events-none" />
        )}
      </Card>
    )
  }
)
StatCard.displayName = "StatCard"

export { StatCard, statCardVariants, iconVariants, trendVariants }
