import { cn } from "@/lib/utils";
import logoUrl from "@/assets/Logo.png";
import { BRAND } from "@/lib/brand";

interface LogoProps {
  className?: string;
  showWordmark?: boolean;
  size?: number;
}

export function Logo({ className, showWordmark = true, size = 32 }: LogoProps) {
  return (
    <span className={cn("flex items-center gap-2", className)}>
      <img
        src={logoUrl}
        alt={`${BRAND.name} logo`}
        width={size}
        height={size}
        className="rounded-lg object-cover"
        style={{ width: size, height: size }}
      />
      {showWordmark && <span className="text-lg font-semibold tracking-tight">{BRAND.name}</span>}
    </span>
  );
}
