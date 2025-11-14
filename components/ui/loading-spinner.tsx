"use client"

import { cn } from "@/lib/utils"
import { Loader2 } from "lucide-react"
import * as React from "react"

interface LoadingSpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string
  size?: number // Optional: specify size in pixels
}

const LoadingSpinner = React.forwardRef<HTMLDivElement, LoadingSpinnerProps>(
  ({ className, size = 24, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "flex items-center justify-center",
        className
      )}
      {...props}
    >
      <Loader2 size={size} className="animate-spin" />
    </div>
  )
)

LoadingSpinner.displayName = "LoadingSpinner"

export { LoadingSpinner } 