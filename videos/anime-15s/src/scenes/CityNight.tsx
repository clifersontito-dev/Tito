import { AbsoluteFill, Easing, interpolate, random, useCurrentFrame, useVideoConfig } from "remotion";
import { Petals } from "../Petals";
import { titleFont } from "../fonts";

const Buildings: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ translate: `0px ${interpolate(frame, [0, 90], [40, 0])}px` }}>
      {new Array(12).fill(0).map((_, i) => {
        const w = 70 + random(`bw${i}`) * 90;
        const h = 400 + random(`bh${i}`) * 700;
        const left = i * 92 - 20;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              bottom: 0,
              left,
              width: w,
              height: h,
              background: "#0b0d24",
              borderTop: "3px solid #2a2f6a",
              backgroundImage:
                "repeating-linear-gradient(0deg, transparent 0 34px, rgba(255,214,120,0.55) 34px 44px), repeating-linear-gradient(90deg, #0b0d24 0 14px, transparent 14px 28px)",
              opacity: 0.95,
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};

const Caption: React.FC<{ text: string }> = ({ text }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <div
      style={{
        position: "absolute",
        top: 260,
        left: 90,
        right: 90,
        textAlign: "center",
        fontFamily: titleFont,
        fontSize: 96,
        lineHeight: 1.05,
        color: "white",
        letterSpacing: 3,
        textShadow: "0 0 24px #7b6cff, 4px 4px 0 #1b1440",
        opacity: interpolate(frame, [0.4 * fps, 1.2 * fps], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        }),
        translate: interpolate(frame, [0.4 * fps, 1.2 * fps], ["0px 40px", "0px 0px"], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: Easing.bezier(0.16, 1, 0.3, 1),
        }),
      }}
    >
      {text}
    </div>
  );
};

export const CityNight: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background: "linear-gradient(180deg, #120a3a 0%, #3b1d6e 55%, #c2457a 100%)" }}>
      {/* estrelas */}
      {new Array(60).fill(0).map((_, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: random(`sx${i}`) * 1080,
            top: random(`sy${i}`) * 1000,
            width: 4,
            height: 4,
            borderRadius: 4,
            background: "white",
            opacity: 0.4 + 0.6 * Math.abs(Math.sin((frame + i * 13) / 12)),
          }}
        />
      ))}
      {/* lua */}
      <div
        style={{
          position: "absolute",
          left: 540 - 230,
          top: interpolate(frame, [0, 90], [760, 640]),
          width: 460,
          height: 460,
          borderRadius: "50%",
          background: "radial-gradient(circle at 40% 40%, #fffaf0, #ffd9e8 60%, #f4a6c8)",
          boxShadow: "0 0 140px 40px rgba(255,190,220,0.5)",
        }}
      />
      <Buildings />
      <Petals seed="city" />
      <Caption text="Numa cidade que nunca dorme..." />
    </AbsoluteFill>
  );
};
