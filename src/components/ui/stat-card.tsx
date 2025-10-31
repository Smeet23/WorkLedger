import * as React from "react"
import { cn } from "@/lib/utils"
import { Card } from "@/components/ui/card"
import { TrendingUp, TrendingDown, Minus, type LucideIcon } from "lucide-react"

interface StatCardProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string
  value: string | number
  icon?: LucideIcon
  description?: string
  trend?: {
    value: number
    label?: string
    direction?: "up" | "down" | "neutral"
  }
  variant?: "default" | "gradient" | "bordered"
  color?: "blue" | "green" | "purple" | "orange" | "pink" | "gray"
}

const colorClasses = {
  blue: {
    icon: "bg-blue-500/10 text-blue-600",
    trend: "text-blue-600",
    gradient: "from-blue-500/5 to-blue-500/10",
    border: "border-blue-200 bg-blue-50/50",
  },
  green: {
    icon: "bg-green-500/10 text-green-600",
    trend: "text-green-600",
    gradient: "from-green-500/5 to-green-500/10",
    border: "border-green-200 bg-green-50/50",
  },
  purple: {
    icon: "bg-purple-500/10 text-purple-600",
    trend: "text-purple-600",
    gradient: "from-purple-500/5 to-purple-500/10",
    border: "border-purple-200 bg-purple-50/50",
  },
  orange: {
    icon: "bg-orange-500/10 text-orange-600",
    trend: "text-orange-600",
    gradient: "from-orange-500/5 to-orange-500/10",
    border: "border-orange-200 bg-orange-50/50",
  },
  pink: {
    icon: "bg-pink-500/10 text-pink-600",
    trend: "text-pink-600",
    gradient: "from-pink-500/5 to-pink-500/10",
    border: "border-pink-200 bg-pink-50/50",
  },
  gray: {
    icon: "bg-gray-500/10 text-gray-600",
    trend: "text-gray-600",
    gradient: "from-gray-500/5 to-gray-500/10",
    border: "border-gray-200 bg-gray-50/50",
  },
}

export function StatCard({
  title,
  value,
  icon: Icon,
  description,
  trend,
  variant = "default",
  color = "blue",
  className,
  ...props
}: StatCardProps) {
  const colors = colorClasses[color]

  const getTrendIcon = () => {
    if (!trend) return null
    const direction = trend.direction || (trend.value > 0 ? "up" : trend.value < 0 ? "down" : "neutral")

    if (direction === "up") return <TrendingUp className="h-4 w-4" />
    if (direction === "down") return <TrendingDown className="h-4 w-4" />
    return <Minus className="h-4 w-4" />
  }

  const getTrendColor = () => {
    if (!trend) return ""
    const direction = trend.direction || (trend.value > 0 ? "up" : trend.value < 0 ? "down" : "neutral")

    if (direction === "up") return "text-green-600"
    if (direction === "down") return "text-red-600"
    return "text-gray-600"
  }

  return (
    <Card
      className={cn(
        "relative overflow-hidden transition-all duration-200 hover:shadow-md min-h-[132px]",
        variant === "gradient" && `bg-gradient-to-br ${colors.gradient}`,
        variant === "bordered" && `border-2 ${colors.border}`,
        className
      )}
      {...props}
    >
      <div className="p-6 h-full">
        <div className="flex items-start justify-between">
          <div className="space-y-1 flex-1">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <div className="flex items-baseline gap-2">
              <p className="text-3xl font-bold tracking-tight">{value}</p>
              {trend && (
                <span className={cn("flex items-center gap-1 text-sm font-medium", getTrendColor())}>
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
            <div className={cn("rounded-lg p-3", colors.icon)}>
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
