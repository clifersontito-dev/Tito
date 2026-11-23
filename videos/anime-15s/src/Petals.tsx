import { AbsoluteFill, random, useCurrentFrame, useVideoConfig } from "remotion";

// Pétalas de sakura caindo (gerado por template, não editável uma a uma)
export const Petals: React.FC<{ count?: number; seed?: string }> = ({
  count = 28,
  seed = "petal",
}) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      {new Array(count).fill(0).map((_, i) => {
        const x0 = random(`${seed}-x-${i}`) * width;
        const speed = 2 + random(`${seed}-s-${i}`) * 4;
        const size = 14 + random(`${seed}-z-${i}`) * 22;
        const offset = random(`${seed}-o-${i}`) * height;
        const y = ((frame * speed + offset) % (height + 100)) - 50;
        const x = x0 + Math.sin((frame + i * 20) / 25) * 60;
        const rot = frame * (3 + i % 4) + i * 40;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x,
              top: y,
              width: size,
              height: size * 0.7,
              background: "linear-gradient(135deg, #ffd1e3, #ff8fb8)",
              borderRadius: "70% 0 70% 0",
              rotate: `${rot}deg`,
              opacity: 0.85,
              boxShadow: "0 0 8px rgba(255,160,200,0.6)",
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};
