import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const skeletonVariants = cva("animate-pulse bg-muted", {
  variants: {
    variant: {
      default: "rounded-md",
      circular: "rounded-full",
      rectangular: "rounded-none",
      rounded: "rounded-lg",
    },
    size: {
      default: "",
      sm: "h-4",
      md: "h-8",
      lg: "h-12",
      xl: "h-16",
    },
  },
  defaultVariants: {
    variant: "default",
    size: "default",
  },
})

interface SkeletonProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof skeletonVariants> {}

const Skeleton = React.forwardRef<HTMLDivElement, SkeletonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(skeletonVariants({ variant, size }), className)}
        {...props}
      />
    )
  }
)
Skeleton.displayName = "Skeleton"

const SkeletonCard = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn("rounded-lg border bg-card p-6 shadow-sm", className)}
      {...props}
    >
      <div className="space-y-3">
        <Skeleton className="h-4 w-1/4" />
        <Skeleton className="h-8 w-1/2" />
        <Skeleton className="h-3 w-3/4" />
      </div>
    </div>
  )
})
SkeletonCard.displayName = "SkeletonCard"

const SkeletonStat = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn("rounded-lg border bg-card p-6 shadow-sm", className)}
      {...props}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-2 flex-1">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-8 w-16" />
        </div>
        <Skeleton className="h-11 w-11" variant="rounded" />
      </div>
    </div>
  )
})
SkeletonStat.displayName = "SkeletonStat"

interface SkeletonTableProps extends React.HTMLAttributes<HTMLDivElement> {
  rows?: number
}

const SkeletonTable = React.forwardRef<HTMLDivElement, SkeletonTableProps>(
  ({ className, rows = 5, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("rounded-lg border bg-card", className)}
        {...props}
      >
        <div className="border-b p-4">
          <Skeleton className="h-5 w-32" />
        </div>
        <div className="divide-y">
          {Array.from({ length: rows }).map((_, i) => (
            <div key={i} className="p-4 flex items-center gap-4">
              <Skeleton className="h-10 w-10" variant="circular" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-3 w-1/2" />
              </div>
              <Skeleton className="h-9 w-20" variant="rounded" />
            </div>
          ))}
        </div>
      </div>
    )
  }
)
SkeletonTable.displayName = "SkeletonTable"

interface SkeletonListProps extends React.HTMLAttributes<HTMLDivElement> {
  items?: number
}

const SkeletonList = React.forwardRef<HTMLDivElement, SkeletonListProps>(
  ({ className, items = 3, ...props }, ref) => {
    return (
      <div ref={ref} className={cn("space-y-3", className)} {...props}>
        {Array.from({ length: items }).map((_, i) => (
          <div key={i} className="rounded-lg border bg-card p-4">
            <div className="flex items-start gap-3">
              <Skeleton className="h-12 w-12" variant="rounded" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }
)
SkeletonList.displayName = "SkeletonList"

export {
  Skeleton,
  SkeletonCard,
  SkeletonStat,
  SkeletonTable,
  SkeletonList,
  skeletonVariants,
}
