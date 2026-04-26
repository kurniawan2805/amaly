import * as React from "react"

import { cn } from "@/lib/utils"

type ToggleGroupProps = React.HTMLAttributes<HTMLDivElement>

const ToggleGroup = React.forwardRef<HTMLDivElement, ToggleGroupProps>(({ className, ...props }, ref) => (
  <div
    className={cn("inline-flex rounded-xl border border-sage/15 bg-muted p-1", className)}
    ref={ref}
    role="group"
    {...props}
  />
))
ToggleGroup.displayName = "ToggleGroup"

type ToggleGroupItemProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  pressed?: boolean
}

const ToggleGroupItem = React.forwardRef<HTMLButtonElement, ToggleGroupItemProps>(
  ({ className, pressed = false, type = "button", ...props }, ref) => (
    <button
      aria-pressed={pressed}
      className={cn(
        "inline-flex h-10 min-w-0 flex-1 items-center justify-center gap-2 rounded-lg px-3 text-sm font-bold text-muted-foreground transition hover:bg-sage-pale/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        pressed && "bg-sage text-white shadow-soft hover:bg-sage",
        className,
      )}
      ref={ref}
      type={type}
      {...props}
    />
  ),
)
ToggleGroupItem.displayName = "ToggleGroupItem"

export { ToggleGroup, ToggleGroupItem }
