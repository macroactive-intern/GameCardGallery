import * as React from "react";

import { cn } from "@/lib/utils";

export type CheckboxProps = Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "onChange" | "type"
> & {
  onCheckedChange?: (checked: boolean) => void;
};

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, checked, onCheckedChange, ...props }, ref) => (
    <input
      checked={checked}
      className={cn(
        "h-4 w-4 rounded border border-primary text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      onChange={(event) => onCheckedChange?.(event.target.checked)}
      ref={ref}
      type="checkbox"
      {...props}
    />
  ),
);
Checkbox.displayName = "Checkbox";

export { Checkbox };
