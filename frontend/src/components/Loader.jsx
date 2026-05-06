import { Loader2 } from "lucide-react";

export const Loader = ({ size = "md", text = "Loading..." }) => {
  const sizeMap = {
    sm: "w-4 h-4",
    md: "w-8 h-8",
    lg: "w-12 h-12"
  };

  return (
    <div className="flex flex-col items-center justify-center gap-2">
      <Loader2 className={`${sizeMap[size]} animate-spin text-primary-600`} />
      {text && <p className="text-sm text-slate-600">{text}</p>}
    </div>
  );
};
