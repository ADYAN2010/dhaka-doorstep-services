import { Sparkles } from "lucide-react";

type Props = {
  className?: string;
  showWordmark?: boolean;
};

export function Logo({ className = "", showWordmark = true }: Props) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <span className="relative inline-flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-primary shadow-glow">
        <Sparkles className="h-5 w-5 text-primary-foreground" />
      </span>
      {showWordmark && (
        <span className="text-lg font-bold tracking-tight text-foreground">
          Sheba<span className="text-primary">bd</span>
        </span>
      )}
    </span>
  );
}
