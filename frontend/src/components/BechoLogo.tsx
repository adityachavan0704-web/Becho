interface BechoLogoProps {
  /** Icon size in pixels (the square icon only) */
  size?: number
  /** Whether to show the wordmark "Becho" next to the icon */
  showWordmark?: boolean
  /** Additional className for the wrapper */
  className?: string
}

/**
 * Becho brand logo — orange rounded square with "b" + play arrow icon,
 * optionally with the "Becho" wordmark beside it.
 *
 * Matches the official Becho brand: #E8611C orange, white letterform.
 */
export default function BechoLogo({ size = 40, showWordmark = true, className = "" }: BechoLogoProps) {
  return (
    <div className={`flex items-center gap-3 ${className}`} style={{ lineHeight: 1 }}>
      {/* Icon */}
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        xmlns="http://www.w3.org/2000/svg"
        style={{ flexShrink: 0, borderRadius: `${size * 0.18}px` }}
      >
        {/* Orange background */}
        <rect width="100" height="100" rx="20" ry="20" fill="#E8611C" />

        {/* White "b" letterform: vertical stem + bowl */}
        <path
          d="
            M 24 14
            A 7 7 0 0 1 38 14
            L 38 43
            A 23 23 0 1 1 38 74
            L 38 86
            A 7 7 0 0 1 24 86
            Z
          "
          fill="white"
        />
        {/* Counter (inner hole of the bowl) */}
        <circle cx="56" cy="64" r="13" fill="#E8611C" />

        {/* Play/arrow triangle — small, top-right of the b */}
        <polygon points="62,18 77,27 62,36" fill="white" />
      </svg>

      {/* Wordmark */}
      {showWordmark && (
        <span
          style={{
            fontFamily: "'Inter', system-ui, sans-serif",
            fontWeight: 800,
            fontSize: size * 0.7,
            letterSpacing: "-0.03em",
            color: "#ffffff",
            lineHeight: 1,
          }}
        >
          Becho
          <span style={{ color: "#E8611C" }}>.</span>
        </span>
      )}
    </div>
  )
}
