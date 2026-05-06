import { forwardRef } from "react";
import { cn } from "../utils/cn";

export const Card = forwardRef(({ className, children, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn("glass-panel glass-card-hover rounded-2xl overflow-hidden p-4 sm:p-6", className)}
      {...props}
    >
      {children}
    </div>
  );
});
Card.displayName = "Card";

export const CardHeader = ({ className, ...props }) => (
  <div className={cn("px-6 py-5 border-b border-slate-100", className)} {...props} />
);

export const CardTitle = ({ className, ...props }) => (
  <h3 className={cn("text-lg font-semibold leading-6 text-slate-900", className)} {...props} />
);

export const CardContent = ({ className, ...props }) => (
  <div className={cn("p-6", className)} {...props} />
);
