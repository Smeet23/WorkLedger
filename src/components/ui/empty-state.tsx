import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { type LucideIcon } from "lucide-react"

const emptyStateVariants = cva(
  "flex flex-col items-center justify-center text-center",
  {
    variants: {
      variant: {
        default: "py-16 px-4",
        compact: "py-8 px-4",
        inline: "py-4 px-2",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

const emptyStateIconVariants = cva("mb-4 rounded-full bg-muted p-4", {
  variants: {
    variant: {
      default: "[&>svg]:h-12 [&>svg]:w-12",
      compact: "[&>svg]:h-8 [&>svg]:w-8",
      inline: "[&>svg]:h-6 [&>svg]:w-6 p-2 mb-2",
    },
  },
  defaultVariants: {
    variant: "default",
  },
})

const emptyStateTitleVariants = cva("font-semibold text-foreground", {
  variants: {
    variant: {
      default: "text-lg",
      compact: "text-base",
      inline: "text-sm",
    },
  },
  defaultVariants: {
    variant: "default",
  },
})

const emptyStateDescriptionVariants = cva(
  "text-muted-foreground max-w-sm mt-2",
  {
    variants: {
      variant: {
        default: "text-sm",
        compact: "text-xs",
        inline: "text-xs max-w-xs",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

interface EmptyStateProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof emptyStateVariants> {
  icon?: LucideIcon
  title: string
  description?: string
  action?: {
    label: string
    onClick?: () => void
    href?: string
  }
}

const EmptyState = React.forwardRef<HTMLDivElement, EmptyStateProps>(
  (
    { icon: Icon, title, description, action, variant, className, ...props },
    ref
  ) => {
    return (
      <div
        ref={ref}
        className={cn(emptyStateVariants({ variant }), className)}
        {...props}
      >
        {Icon && (
          <div className={cn(emptyStateIconVariants({ variant }))}>
            <Icon className="text-muted-foreground" />
          </div>
        )}

        <h3 className={cn(emptyStateTitleVariants({ variant }))}>{title}</h3>

        {description && (
          <p className={cn(emptyStateDescriptionVariants({ variant }))}>
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
              <Button onClick={action.onClick}>{action.label}</Button>
            )}
          </div>
        )}
      </div>
    )
  }
)
EmptyState.displayName = "EmptyState"

export {
  EmptyState,
  emptyStateVariants,
  emptyStateIconVariants,
  emptyStateTitleVariants,
  emptyStateDescriptionVariants,
}
