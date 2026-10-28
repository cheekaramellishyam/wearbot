interface WardrobeHangerLogoProps {
  className?: string;
}

export function WardrobeHangerLogo({
  className = "h-5 sm:h-6 md:h-7 w-auto text-foreground",
}: WardrobeHangerLogoProps) {
  return (
    <svg
      viewBox="0 0 144 48"
      className={`${className} select-none transition-transform duration-150 group-hover:scale-105 shrink-0`}
      aria-hidden="true"
      focusable="false"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Hook & Neck Loop */}
      <path
        d="
          M 68, 8
          C 68, 4, 71, 2, 75, 2
          C 79, 2, 82, 4.5, 80, 9
          C 78, 13, 73, 15, 72, 18
          C 72, 21, 76, 22.5, 77, 20
          C 78, 18, 76, 16.5, 74, 17
        "
        fill="none"
        stroke="currentColor"
        strokeWidth="2.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Left Shoulder curving down and framing W */}
      <path
        d="
          M 72, 18
          C 52, 22, 28, 27, 14, 33
          C 7, 36, 4, 39, 6, 43
        "
        fill="none"
        stroke="currentColor"
        strokeWidth="2.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Right Shoulder curving down and framing E */}
      <path
        d="
          M 77, 18.5
          C 92, 22, 116, 27, 130, 33
          C 137, 36, 140, 39, 138, 43
        "
        fill="none"
        stroke="currentColor"
        strokeWidth="2.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* WARDROBE text filling the gap completely as the base of the hanger */}
      <text
        x="72"
        y="43"
        textAnchor="middle"
        style={{
          fontFamily: '"Times New Roman", Times, "Liberation Serif", serif',
          fontSize: "16.5px",
          fontWeight: 700,
          letterSpacing: "2.1px",
          fill: "currentColor",
        }}
      >
        WARDROBE
      </text>
    </svg>
  );
}
