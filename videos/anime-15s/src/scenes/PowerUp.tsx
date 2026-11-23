import { AbsoluteFill, Easing, interpolate, random, useCurrentFrame, useVideoConfig } from "remotion";
import { kanjiFont, titleFont } from "../fonts";

export const PowerUp: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const slam = 1.2 * fps;
  const shake =
    frame > slam && frame < slam + 0.6 * fps
      ? (random(`sh${frame}`) - 0.5) * 40
      : 0;
  return (
    <AbsoluteFill
      style={{
        background: "radial-gradient(circle at 50% 55%, #fff3b0 0%, #ff9d00 18%, #b3160c 45%, #1a0303 80%)",
        translate: `${shake}px ${shake * 0.6}px`,
      }}
    >
      {/* linhas de velocidade */}
      <svg width={1080} height={1920} style={{ position: "absolute", rotate: `${frame * 0.6}deg` }}>
        {new Array(70).fill(0).map((_, i) => {
          const a = (i / 70) * Math.PI * 2;
          const inner = 260 + random(`r${i}-${Math.floor(frame / 2)}`) * 200;
          return (
            <line
              key={i}
              x1={540 + Math.cos(a) * inner}
              y1={1060 + Math.sin(a) * inner}
              x2={540 + Math.cos(a) * 1600}
              y2={1060 + Math.sin(a) * 1600}
              stroke={i % 3 === 0 ? "#fff" : "#2a0000"}
              strokeWidth={i % 3 === 0 ? 4 : 10}
              opacity={0.55}
            />
          );
        })}
      </svg>
      {/* aura pulsando */}
      {[0, 1, 2].map((k) => {
        const t = ((frame + k * 12) % 36) / 36;
        return (
          <div
            key={k}
            style={{
              position: "absolute",
              left: 540 - 200,
              top: 1060 - 200,
              width: 400,
              height: 400,
              borderRadius: "50%",
              border: "10px solid #fff6c2",
              scale: `${0.4 + t * 2.4}`,
              opacity: 1 - t,
              boxShadow: "0 0 60px #ffcf3a",
            }}
          />
        );
      })}
      {/* núcleo de energia */}
      <div
        style={{
          position: "absolute",
          left: 540 - 130,
          top: 1060 - 130,
          width: 260,
          height: 260,
          borderRadius: "50%",
          background: "radial-gradient(circle, #ffffff 0%, #fff1a0 50%, rgba(255,160,0,0) 72%)",
          scale: `${1 + 0.12 * Math.sin(frame / 2)}`,
        }}
      />
      {/* kanji 覚醒 = despertar */}
      <div
        style={{
          position: "absolute",
          top: 300,
          left: 0,
          right: 0,
          textAlign: "center",
          fontFamily: kanjiFont,
          fontSize: 300,
          color: "white",
          WebkitTextStroke: "10px #1a0000",
          paintOrder: "stroke fill",
          textShadow: "0 0 50px #ff3c00",
          scale: interpolate(frame, [slam - 6, slam], [3, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.in(Easing.quad),
            output: "perceptual-scale",
          }),
          opacity: interpolate(frame, [slam - 6, slam - 2], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
        }}
      >
        覚醒
      </div>
      <div
        style={{
          position: "absolute",
          bottom: 260,
          left: 0,
          right: 0,
          textAlign: "center",
          fontFamily: titleFont,
          fontSize: 88,
          color: "#fff",
          letterSpacing: 6,
          textShadow: "5px 5px 0 #000",
          opacity: interpolate(frame, [slam + 6, slam + 14], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
        }}
      >
        KAKUSEI · DESPERTAR
      </div>
      {/* flash branco no impacto */}
      <AbsoluteFill
        style={{
          background: "white",
          opacity: interpolate(frame, [slam, slam + 8], [0.9, 0], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
        }}
      />
    </AbsoluteFill>
  );
};
