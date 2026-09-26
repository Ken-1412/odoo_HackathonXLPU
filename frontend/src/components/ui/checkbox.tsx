import * as React from "react"
import { cn } from "@/lib/utils"
import { Check } from "lucide-react"

export interface CheckboxProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, id, checked: controlledChecked, defaultChecked, onChange, ...props }, ref) => {
    const [checked, setChecked] = React.useState(controlledChecked ?? defaultChecked ?? false);

    React.useEffect(() => {
      if (controlledChecked !== undefined) {
        setChecked(controlledChecked);
      }
    }, [controlledChecked]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (controlledChecked === undefined) {
        setChecked(e.target.checked);
      }
      onChange?.(e);
    };

    return (
      <div className="relative flex items-center">
        <input
          type="checkbox"
          id={id}
          ref={ref}
          checked={checked}
          onChange={handleChange}
          className="peer sr-only"
          {...props}
        />
        <div
          data-state={checked ? "checked" : "unchecked"}
          onClick={() => {
            const input = document.getElementById(id || "") as HTMLInputElement | null;
            if (input) {
              input.click();
            }
          }}
          className={cn(
            "h-4 w-4 shrink-0 rounded-sm border border-surface-300 bg-transparent ring-offset-background cursor-pointer focus-within:ring-2 focus-within:ring-brand-900 focus-within:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 flex items-center justify-center transition-colors",
            className
          )}
        >
          {checked && <Check className="h-3.5 w-3.5 text-current stroke-[3]" />}
        </div>
      </div>
    )
  }
)
Checkbox.displayName = "Checkbox"

export { Checkbox }
