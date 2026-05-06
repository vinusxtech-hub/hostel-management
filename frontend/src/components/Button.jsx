import { forwardRef } from "react";
import { cn } from "../utils/cn";
import { Loader2 } from "lucide-react";

export const Button = forwardRef(({ className, variant = "primary", size = "md", isLoading, children, ...props }, ref) => {
  const baseStyles = "inline-flex items-center justify-center rounded-xl font-medium transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none hover:-translate-y-0.5 active:translate-y-0 active:scale-95";
  
  const variants = {
    primary: "bg-gradient-to-r from-primary-600 to-indigo-600 text-white hover:from-primary-500 hover:to-indigo-500 shadow-md hover:shadow-lg shadow-primary-500/30",
    secondary: "bg-white/70 backdrop-blur-sm text-slate-700 border border-slate-200 hover:bg-white hover:border-slate-300 shadow-sm",
    danger: "bg-gradient-to-r from-red-600 to-rose-600 text-white hover:from-red-500 hover:to-rose-500 shadow-md hover:shadow-lg shadow-red-500/30",
    ghost: "text-slate-600 hover:bg-primary-50 hover:text-primary-600",
  };

  const sizes = {
    sm: "h-8 px-3 text-sm",
    md: "h-10 px-4 py-2",
    lg: "h-12 px-6 text-lg",
  };

  return (
    <button
      ref={ref}
      className={cn(baseStyles, variants[variant], sizes[size], className)}
      disabled={isLoading || props.disabled}
      {...props}
    >
      {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      {children}
    </button>
  );
});
Button.displayName = "Button";
