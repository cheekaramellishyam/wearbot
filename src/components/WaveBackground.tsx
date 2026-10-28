import React, { useMemo } from "react";

interface WaveBackgroundProps {
  className?: string;
  /** Controls overall opacity of the wave lines (default: 0.9) */
  intensity?: number;
  /** Height or position mode: "bottom" for anchoring to bottom, "cover" for covering whole container */
  mode?: "bottom" | "cover";
  /** Whether to render background color #dddddd fill inside the SVG (default: false, parent handles bg) */
  showBgFill?: boolean;
}

export function WaveBackground({
  className = "",
  intensity = 0.95,
  mode = "bottom",
  showBgFill = false,
}: WaveBackgroundProps) {
  // Pre-calculate the multi-ribbon spline paths
  const { ribbon1, ribbon2, ribbon3 } = useMemo(() => {
    const width = 1440;

    // Ribbon 1: The undulating crest-and-trough wave (left arch, center dip, right arch)
    const count1 = 28;
    const r1: Array<{ d: string; opacity: number }> = [];
    for (let i = 0; i < count1; i++) {
      const t = i / (count1 - 1);
      const y0 = 360 + t * 90;
      const cp1x = 180 + t * 40;
      const cp1y = 170 + t * 70;
      const cp2x = 360 + t * 20;
      const cp2y = 390 + t * 60;
      const mx = 520 + t * 40;
      const my = 440 + t * 45;
      const cp3x = 680 + t * 30;
      const cp3y = 470 + t * 40;
      const cp4x = 1040 + t * 40;
      const cp4y = 180 + t * 70;
      const yEnd = 340 + t * 110;
      const d = `M 0 ${y0.toFixed(1)} C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${mx.toFixed(1)} ${my.toFixed(1)} C ${cp3x.toFixed(1)} ${cp3y.toFixed(1)}, ${cp4x.toFixed(1)} ${cp4y.toFixed(1)}, ${width} ${yEnd.toFixed(1)}`;
      const opacity = Number((0.14 + 0.24 * (1 - Math.abs(t - 0.5) * 1.5)).toFixed(3));
      r1.push({ d, opacity });
    }

    // Ribbon 2: The sweeping diagonal wave crossing through the center
    const count2 = 26;
    const r2: Array<{ d: string; opacity: number }> = [];
    for (let i = 0; i < count2; i++) {
      const t = i / (count2 - 1);
      const y0 = 160 + t * 130;
      const cp1x = 220 + t * 50;
      const cp1y = 410 + t * 40;
      const cp2x = 450 + t * 30;
      const cp2y = 460 + t * 30;
      const mx = 660 + t * 30;
      const my = 430 + t * 35;
      const cp3x = 880 - t * 40;
      const cp3y = 380 + t * 50;
      const cp4x = 1180 + t * 40;
      const cp4y = 230 + t * 80;
      const yEnd = 240 + t * 120;
      const d = `M 0 ${y0.toFixed(1)} C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${mx.toFixed(1)} ${my.toFixed(1)} C ${cp3x.toFixed(1)} ${cp3y.toFixed(1)}, ${cp4x.toFixed(1)} ${cp4y.toFixed(1)}, ${width} ${yEnd.toFixed(1)}`;
      const opacity = Number((0.12 + 0.22 * (1 - Math.abs(t - 0.5) * 1.4)).toFixed(3));
      r2.push({ d, opacity });
    }

    // Ribbon 3: The flowing lower base mesh
    const count3 = 20;
    const r3: Array<{ d: string; opacity: number }> = [];
    for (let i = 0; i < count3; i++) {
      const t = i / (count3 - 1);
      const y0 = 420 + t * 80;
      const cp1x = 300 + t * 40;
      const cp1y = 470 + t * 30;
      const cp2x = 650 + t * 30;
      const cp2y = 490 + t * 20;
      const mx = 820 + t * 30;
      const my = 460 + t * 25;
      const cp3x = 1050 + t * 20;
      const cp3y = 430 + t * 30;
      const cp4x = 1260 + t * 30;
      const cp4y = 410 + t * 40;
      const yEnd = 430 + t * 70;
      const d = `M 0 ${y0.toFixed(1)} C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${mx.toFixed(1)} ${my.toFixed(1)} C ${cp3x.toFixed(1)} ${cp3y.toFixed(1)}, ${cp4x.toFixed(1)} ${cp4y.toFixed(1)}, ${width} ${yEnd.toFixed(1)}`;
      const opacity = Number((0.09 + 0.16 * (1 - Math.abs(t - 0.5) * 1.6)).toFixed(3));
      r3.push({ d, opacity });
    }

    return { ribbon1: r1, ribbon2: r2, ribbon3: r3 };
  }, []);

  return (
    <div
      className={`pointer-events-none select-none overflow-hidden ${
        mode === "bottom"
          ? "absolute inset-x-0 bottom-0 h-48 sm:h-60 md:h-72 lg:h-[340px]"
          : "absolute inset-0 h-full w-full"
      } ${className}`}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 1440 600"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="none"
        className="h-full w-full"
      >
        <defs>
          {/* Subtle shading gradients for 3D depth between folds */}
          <linearGradient id="wave-shade-left" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#222222" stopOpacity="0.06" />
            <stop offset="60%" stopColor="#222222" stopOpacity="0.02" />
            <stop offset="100%" stopColor="#222222" stopOpacity="0" />
          </linearGradient>

          <linearGradient id="wave-shade-center" x1="40%" y1="100%" x2="60%" y2="0%">
            <stop offset="0%" stopColor="#1a1a1a" stopOpacity="0.08" />
            <stop offset="100%" stopColor="#1a1a1a" stopOpacity="0" />
          </linearGradient>

          <linearGradient id="wave-shade-right" x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#222222" stopOpacity="0.05" />
            <stop offset="100%" stopColor="#222222" stopOpacity="0" />
          </linearGradient>
        </defs>

        {showBgFill && (
          <rect width="100%" height="100%" fill="#dddddd" />
        )}

        {/* Ambient shadow zones giving 3D depth to the ribbon folds */}
        <path
          d="M 0 450 Q 240 280, 520 480 Q 700 560, 950 420 Q 1200 240, 1440 450 L 1440 600 L 0 600 Z"
          fill="url(#wave-shade-center)"
        />
        <path
          d="M 0 350 C 220 200, 360 410, 520 470 L 520 600 L 0 600 Z"
          fill="url(#wave-shade-left)"
        />
        <path
          d="M 680 470 C 1040 220, 1260 260, 1440 450 L 1440 600 L 680 600 Z"
          fill="url(#wave-shade-right)"
        />

        {/* Ribbon 3: Lower base flow */}
        <g stroke="#262626" strokeWidth="0.85">
          {ribbon3.map((item, idx) => (
            <path
              key={`r3-${idx}`}
              d={item.d}
              opacity={item.opacity * intensity}
            />
          ))}
        </g>

        {/* Ribbon 2: Sweeping diagonal crossing wave */}
        <g stroke="#2c2c2c" strokeWidth="0.95">
          {ribbon2.map((item, idx) => (
            <path
              key={`r2-${idx}`}
              d={item.d}
              opacity={item.opacity * intensity}
            />
          ))}
        </g>

        {/* Ribbon 1: Primary undulating wave ribbon */}
        <g stroke="#222222" strokeWidth="1.05">
          {ribbon1.map((item, idx) => (
            <path
              key={`r1-${idx}`}
              d={item.d}
              opacity={item.opacity * intensity}
            />
          ))}
        </g>
      </svg>
    </div>
  );
}
