
import { cn } from "@/lib/utils"
import Image from "next/image"

interface LogoProps extends React.HTMLAttributes<HTMLDivElement> {
  /** "dark" for dark backgrounds (white text), "light" for light backgrounds (dark text) */
  variant?: "dark" | "light"
  /** Horizontal compact layout for navbars and headers */
  compact?: boolean
  /** Show "ECOGRAFÍA NEUROMUSCULOESQUELÉTICA" subtitle */
  showSubtitle?: boolean
  iconClassName?: string
}

export function Logo({
  className,
  variant = "dark",
  compact = false,
  showSubtitle = false,
  iconClassName,
  ...props
}: LogoProps) {
  if (compact) {
    return (
      <div className={cn("flex items-center gap-2", className)} {...props}>
        <Image
          src="/logos/raulmoralescolor.png"
          alt="Dr. Raúl Morales"
          width={120}
          height={48}
          className={cn("h-8 w-auto object-contain", iconClassName)}
          priority
        />
      </div>
    )
  }

  return (
    <div className={cn("flex flex-col items-center", className)} {...props}>
      <Image
        src="/logos/raulmoralescolor.png"
        alt="Dr. Raúl Morales – Ecografía Neuromusculoesquelética Intervencionista"
        width={280}
        height={140}
        className={cn("w-auto object-contain", iconClassName)}
        priority
      />
      {showSubtitle && (
        <p
          className={cn(
            "text-[10px] text-center font-medium tracking-wider mt-2 opacity-80 uppercase",
            variant === "dark" ? "text-gray-300" : "text-gray-500 dark:text-gray-400"
          )}
        >
          Ecografía Neuromusculoesquelética
        </p>
      )}
    </div>
  )
}
