import * as React from "react"
import * as ProgressPrimitive from "@radix-ui/react-progress"

interface ProgressProps
  extends React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root> {
  indeterminate?: boolean;
}

import { cn } from "@/lib/utils"

function Progress({
  className,
  value,
  indeterminate = false,
  ...props
}: ProgressProps) {
  return (
    <ProgressPrimitive.Root
      data-slot="progress"
      className={cn(
        "bg-zinc-900/20 relative h-2 w-full overflow-hidden rounded-full dark:bg-zinc-50/20",
        className
      )}
      {...props}
    >
      <ProgressPrimitive.Indicator
        data-slot="progress-indicator"
        className={cn(
          "bg-zinc-900 h-full w-full flex-1 transition-all dark:bg-zinc-50",
          indeterminate && "animate-progress origin-left"
        )}
        style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
      />
    </ProgressPrimitive.Root>
  )
}

export { Progress }
