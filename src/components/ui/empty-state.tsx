import * as React from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { type LucideIcon } from "lucide-react"

interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  icon?: LucideIcon
  title: string
  description?: string
  action?: {
    label: string
    onClick?: () => void
    href?: string
  }
  variant?: "default" | "compact"
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  variant = "default",
  className,
  ...props
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center",
        variant === "default" ? "py-16 px-4" : "py-8 px-4",
        className
      )}
      {...props}
    >
      {Icon && (
        <div className="mb-4 rounded-full bg-muted p-4">
          <Icon className={cn(
            "text-muted-foreground",
            variant === "default" ? "h-12 w-12" : "h-8 w-8"
          )} />
        </div>
      )}

      <h3 className={cn(
        "font-semibold text-foreground",
        variant === "default" ? "text-lg" : "text-base"
      )}>
        {title}
      </h3>

      {description && (
        <p className={cn(
          "text-muted-foreground max-w-sm mt-2",
          variant === "default" ? "text-sm" : "text-xs"
        )}>
          {description}
        </p>
      )}

      {action && (
        <div className="mt-6">
          {action.href ? (
            <Button asChild>
              <a href={action.href}>{action.label}</a>
            </Button>
          ) : (
            <Button onClick={action.onClick}>
              {action.label}
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
