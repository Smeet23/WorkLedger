"use client"

import * as React from "react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface ConfirmationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  confirmText?: string
  cancelText?: string
  onConfirm: () => void
  onCancel?: () => void
  variant?: "default" | "destructive"
  loading?: boolean
}

export function ConfirmationDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmText = "Confirm",
  cancelText = "Cancel",
  onConfirm,
  onCancel,
  variant = "default",
  loading = false,
}: ConfirmationDialogProps) {
  const handleConfirm = () => {
    onConfirm()
    onOpenChange(false)
  }

  const handleCancel = () => {
    onCancel?.()
    onOpenChange(false)
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleCancel} disabled={loading}>
            {cancelText}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={loading}
            className={cn(
              variant === "destructive" &&
                buttonVariants({ variant: "destructive" })
            )}
          >
            {loading ? "Please wait..." : confirmText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

// Hook for managing confirmation dialog state
interface UseConfirmationOptions {
  title: string
  description: string
  confirmText?: string
  cancelText?: string
  variant?: "default" | "destructive"
}

interface UseConfirmationReturn {
  confirm: () => Promise<boolean>
  ConfirmDialog: React.FC
}

export function useConfirmation(
  options: UseConfirmationOptions
): UseConfirmationReturn {
  const [open, setOpen] = React.useState(false)
  const [loading, setLoading] = React.useState(false)
  const resolveRef = React.useRef<(value: boolean) => void>()

  const confirm = React.useCallback(() => {
    setOpen(true)
    return new Promise<boolean>((resolve) => {
      resolveRef.current = resolve
    })
  }, [])

  const handleConfirm = React.useCallback(() => {
    resolveRef.current?.(true)
    setOpen(false)
  }, [])

  const handleCancel = React.useCallback(() => {
    resolveRef.current?.(false)
    setOpen(false)
  }, [])

  const ConfirmDialog = React.useCallback(
    () => (
      <ConfirmationDialog
        open={open}
        onOpenChange={setOpen}
        title={options.title}
        description={options.description}
        confirmText={options.confirmText}
        cancelText={options.cancelText}
        variant={options.variant}
        loading={loading}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
    ),
    [open, loading, options, handleConfirm, handleCancel]
  )

  return { confirm, ConfirmDialog }
}
