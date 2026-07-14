type LogoProps = {
  className?: string
}

export function Logo({ className }: LogoProps) {
  return (
    <svg
      id="logo"
      className={className}
      viewBox="0 0 64 64"
      role="img"
      aria-label="myPronunciationClass"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="1.2" />
      <path
        d="M4 32 C12 18 22 18 32 32 C42 46 52 46 60 32"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
    </svg>
  )
}
