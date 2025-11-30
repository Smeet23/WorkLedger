"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

const formFieldVariants = cva("space-y-2", {
  variants: {
    variant: {
      default: "",
      inline: "flex items-center space-y-0 space-x-3",
    },
  },
  defaultVariants: {
    variant: "default",
  },
})

const formLabelVariants = cva("text-sm font-medium leading-none", {
  variants: {
    required: {
      true: "after:content-['*'] after:ml-0.5 after:text-red-500",
      false: "",
    },
  },
  defaultVariants: {
    required: false,
  },
})

const formErrorVariants = cva("text-sm font-medium text-destructive", {
  variants: {
    variant: {
      default: "",
      subtle: "text-xs",
    },
  },
  defaultVariants: {
    variant: "default",
  },
})

const formDescriptionVariants = cva("text-sm text-muted-foreground", {
  variants: {
    variant: {
      default: "",
      subtle: "text-xs",
    },
  },
  defaultVariants: {
    variant: "default",
  },
})

// Context for form field state
interface FormFieldContextValue {
  id: string
  error?: string
  disabled?: boolean
}

const FormFieldContext = React.createContext<FormFieldContextValue | null>(null)

function useFormField() {
  const context = React.useContext(FormFieldContext)
  if (!context) {
    throw new Error("useFormField must be used within a FormField")
  }
  return context
}

// Form Field Root
interface FormFieldProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof formFieldVariants> {
  name: string
  error?: string
  disabled?: boolean
}

const FormField = React.forwardRef<HTMLDivElement, FormFieldProps>(
  ({ className, variant, name, error, disabled, children, ...props }, ref) => {
    const id = React.useId()
    const fieldId = `${name}-${id}`

    return (
      <FormFieldContext.Provider value={{ id: fieldId, error, disabled }}>
        <div
          ref={ref}
          className={cn(formFieldVariants({ variant }), className)}
          {...props}
        >
          {children}
        </div>
      </FormFieldContext.Provider>
    )
  }
)
FormField.displayName = "FormField"

// Form Label
interface FormLabelProps
  extends React.ComponentPropsWithoutRef<typeof Label>,
    VariantProps<typeof formLabelVariants> {}

const FormLabel = React.forwardRef<
  React.ElementRef<typeof Label>,
  FormLabelProps
>(({ className, required, ...props }, ref) => {
  const { id, error } = useFormField()

  return (
    <Label
      ref={ref}
      htmlFor={id}
      className={cn(
        formLabelVariants({ required }),
        error && "text-destructive",
        className
      )}
      {...props}
    />
  )
})
FormLabel.displayName = "FormLabel"

// Form Input
interface FormInputProps extends React.ComponentPropsWithoutRef<typeof Input> {}

const FormInput = React.forwardRef<
  React.ElementRef<typeof Input>,
  FormInputProps
>(({ className, ...props }, ref) => {
  const { id, error, disabled } = useFormField()

  return (
    <Input
      ref={ref}
      id={id}
      disabled={disabled}
      aria-invalid={!!error}
      aria-describedby={error ? `${id}-error` : undefined}
      className={cn(error && "border-destructive", className)}
      {...props}
    />
  )
})
FormInput.displayName = "FormInput"

// Form Textarea
interface FormTextareaProps
  extends React.ComponentPropsWithoutRef<typeof Textarea> {}

const FormTextarea = React.forwardRef<
  React.ElementRef<typeof Textarea>,
  FormTextareaProps
>(({ className, ...props }, ref) => {
  const { id, error, disabled } = useFormField()

  return (
    <Textarea
      ref={ref}
      id={id}
      disabled={disabled}
      aria-invalid={!!error}
      aria-describedby={error ? `${id}-error` : undefined}
      className={cn(error && "border-destructive", className)}
      {...props}
    />
  )
})
FormTextarea.displayName = "FormTextarea"

// Form Error Message
interface FormErrorProps
  extends React.HTMLAttributes<HTMLParagraphElement>,
    VariantProps<typeof formErrorVariants> {}

const FormError = React.forwardRef<HTMLParagraphElement, FormErrorProps>(
  ({ className, variant, children, ...props }, ref) => {
    const { id, error } = useFormField()

    if (!error && !children) return null

    return (
      <p
        ref={ref}
        id={`${id}-error`}
        className={cn(formErrorVariants({ variant }), className)}
        {...props}
      >
        {error || children}
      </p>
    )
  }
)
FormError.displayName = "FormError"

// Form Description
interface FormDescriptionProps
  extends React.HTMLAttributes<HTMLParagraphElement>,
    VariantProps<typeof formDescriptionVariants> {}

const FormDescription = React.forwardRef<
  HTMLParagraphElement,
  FormDescriptionProps
>(({ className, variant, ...props }, ref) => {
  const { id } = useFormField()

  return (
    <p
      ref={ref}
      id={`${id}-description`}
      className={cn(formDescriptionVariants({ variant }), className)}
      {...props}
    />
  )
})
FormDescription.displayName = "FormDescription"

export {
  FormField,
  FormLabel,
  FormInput,
  FormTextarea,
  FormError,
  FormDescription,
  useFormField,
  formFieldVariants,
  formLabelVariants,
  formErrorVariants,
  formDescriptionVariants,
}
