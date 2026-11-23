import { AbsoluteFill, Easing, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { titleFont } from "../fonts";

const Eye: React.FC<{ flip?: boolean }> = ({ flip }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const open = interpolate(frame, [0.5 * fps, 1.1 * fps], [0.05, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.2, 1.4, 0.4, 1),
  });
  const glow = 0.6 + 0.4 * Math.sin(frame / 4);
  return (
    <svg width={420} height={260} viewBox="0 0 420 260" style={{ scale: flip ? "-1 1" : "1 1" }}>
      <defs>
        <radialGradient id="iris" cx="50%" cy="45%" r="55%">
          <stop offset="0%" stopColor="#fff6a8" />
          <stop offset="35%" stopColor="#ffb21e" />
          <stop offset="80%" stopColor="#c2260f" />
          <stop offset="100%" stopColor="#3a0605" />
        </radialGradient>
        <clipPath id={`lid${flip ? "r" : "l"}`}>
          <path d="M20 150 Q 200 20 400 120 Q 220 250 20 150 Z" />
        </clipPath>
      </defs>
      <g style={{ scale: `1 ${open}`, transformOrigin: "210px 140px" }}>
        <g clipPath={`url(#lid${flip ? "r" : "l"})`}>
          <rect width="420" height="260" fill="#f7f3ff" />
          <circle cx="215" cy="140" r="92" fill="url(#iris)" />
          <ellipse cx="215" cy="140" rx="18" ry="58" fill="#120202" />
          <circle cx="250" cy="100" r="22" fill="white" opacity={0.95} />
          <circle cx="180" cy="175" r="9" fill="white" opacity={0.8} />
          <circle cx="215" cy="140" r="92" fill="none" stroke="#ff6a00" strokeWidth={6} opacity={glow} />
        </g>
        <path d="M10 150 Q 200 0 410 115" stroke="#0a0a14" strokeWidth={20} fill="none" strokeLinecap="round" />
      </g>
    </svg>
  );
};

export const Eyes: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const zoom = interpolate(frame, [0, 3.5 * fps], [1, 1.12]);
  return (
    <AbsoluteFill style={{ background: "#05040c", justifyContent: "center", alignItems: "center" }}>
      {/* faixa do rosto */}
      <div
        style={{
          width: 1080,
          height: 520,
          background: "linear-gradient(180deg, #f2c6a8, #e2a98a)",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          gap: 60,
          scale: `${zoom}`,
          boxShadow: "0 0 0 6px #000",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* franja de cabelo */}
        <div
          style={{
            position: "absolute",
            top: -40,
            left: 0,
            right: 0,
            height: 150,
            background: "#1c1d3a",
            clipPath:
              "polygon(0 0,100% 0,100% 60%,92% 100%,84% 55%,74% 95%,64% 50%,54% 100%,45% 52%,35% 96%,25% 50%,15% 100%,7% 55%,0 85%)",
          }}
        />
        <Eye />
        <Eye flip />
      </div>
      <div
        style={{
          position: "absolute",
          bottom: 300,
          left: 90,
          right: 90,
          textAlign: "center",
          fontFamily: titleFont,
          fontSize: 100,
          color: "#ffd24a",
          textShadow: "0 0 30px #ff5a00, 5px 5px 0 #000",
          opacity: interpolate(frame, [1.3 * fps, 1.9 * fps], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
        }}
      >
        ...um poder despertou.
      </div>
    </AbsoluteFill>
  );
};
