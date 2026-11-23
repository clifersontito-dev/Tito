import { AbsoluteFill, Easing, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { Petals } from "../Petals";
import { titleFont } from "../fonts";

export const TitleCard: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill
      style={{
        background: "radial-gradient(circle at 50% 40%, #2b1660 0%, #0c0620 70%)",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Petals seed="title" count={34} />
      {/* faixa de pincel */}
      <div
        style={{
          position: "absolute",
          top: 760,
          height: 300,
          left: 0,
          width: 1080,
          background: "linear-gradient(90deg, #ff2d6f, #ff7a1a)",
          clipPath: "polygon(0 18%, 100% 0, 97% 82%, 2% 100%)",
          scale: `${interpolate(frame, [0, 0.5 * fps], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.bezier(0.16, 1, 0.3, 1),
          })} 1`,
          transformOrigin: "left center",
        }}
      />
      <div
        style={{
          position: "absolute",
          top: 815,
          left: 90,
          right: 90,
          textAlign: "center",
          fontFamily: titleFont,
          fontSize: 190,
          lineHeight: 0.95,
          color: "white",
          WebkitTextStroke: "8px #120022",
          paintOrder: "stroke fill",
          textShadow: "8px 8px 0 #120022",
          scale: interpolate(frame, [0.3 * fps, 0.8 * fps], [0.6, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.bezier(0.2, 1.6, 0.4, 1),
            output: "perceptual-scale",
          }),
          opacity: interpolate(frame, [0.3 * fps, 0.5 * fps], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
        }}
      >
        O DESPERTAR
      </div>
      <div
        style={{
          position: "absolute",
          top: 1140,
          left: 90,
          right: 90,
          textAlign: "center",
          fontFamily: titleFont,
          fontSize: 70,
          letterSpacing: 8,
          color: "#ffd1e3",
          opacity: interpolate(frame, [1.2 * fps, 1.8 * fps], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
        }}
      >
        EPISÓDIO 1 · EM BREVE
      </div>
      {/* fade final */}
      <AbsoluteFill
        style={{
          background: "black",
          opacity: interpolate(frame, [3.8 * fps, 4.5 * fps], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
        }}
      />
    </AbsoluteFill>
  );
};
