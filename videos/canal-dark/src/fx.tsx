import { AbsoluteFill, Easing, Img, interpolate, random, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { headFont, typeFont } from "./fonts";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

// Granulação de filme + vinheta + leve tremulação de luz
export const FilmLook: React.FC = () => {
  const frame = useCurrentFrame();
  const flicker = 0.04 + random(`fl${frame}`) * 0.05;
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <svg width="100%" height="100%" style={{ position: "absolute", opacity: 0.22, mixBlendMode: "overlay" }}>
        <filter id="grain">
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves={2} seed={frame % 50} />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#grain)" />
      </svg>
      <AbsoluteFill style={{ background: "black", opacity: flicker }} />
      <AbsoluteFill
        style={{ background: "radial-gradient(ellipse at center, rgba(0,0,0,0) 45%, rgba(0,0,0,0.85) 100%)" }}
      />
    </AbsoluteFill>
  );
};

// Foto com efeito Ken Burns sobre um fundo desfocado da própria foto
export const Photo: React.FC<{
  src: string;
  durationInFrames: number;
  fit?: "cover" | "contain";
  zoomFrom?: number;
  zoomTo?: number;
  panFrom?: string;
  panTo?: string;
  filter?: string;
}> = ({ src, durationInFrames, fit = "contain", zoomFrom = 1, zoomTo = 1.15, panFrom = "0px 0px", panTo = "0px 0px", filter = "grayscale(0.6) sepia(0.35) contrast(1.15) brightness(0.85)" }) => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background: "#050505", overflow: "hidden" }}>
      <Img
        src={staticFile(src)}
        style={{ position: "absolute", width: "100%", height: "100%", objectFit: "cover", filter: `blur(40px) brightness(0.35) ${filter}`, scale: "1.2" }}
      />
      <Img
        src={staticFile(src)}
        style={{
          position: "absolute",
          width: "100%",
          height: "100%",
          objectFit: fit,
          filter,
          scale: `${interpolate(frame, [0, durationInFrames], [zoomFrom, zoomTo], clamp)}`,
          translate: interpolate(frame, [0, durationInFrames], [panFrom, panTo], clamp),
        }}
      />
    </AbsoluteFill>
  );
};

// Fade de entrada/saída para cada cena
export const Fade: React.FC<{ durationInFrames: number; children: React.ReactNode }> = ({ durationInFrames, children }) => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill
      style={{ opacity: interpolate(frame, [0, 8, durationInFrames - 6, durationInFrames], [0, 1, 1, 0], clamp) }}
    >
      {children}
    </AbsoluteFill>
  );
};

// Rótulo estilo arquivo/ficha (ex.: data, local)
export const Label: React.FC<{ text: string; top?: number; delay?: number; color?: string; size?: number }> = ({
  text,
  top = 260,
  delay = 0,
  color = "#e8e2d0",
  size = 64,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const chars = Math.floor(interpolate(frame, [delay, delay + text.length * 1.6], [0, text.length], clamp));
  return (
    <div
      style={{
        position: "absolute",
        top,
        left: 80,
        right: 80,
        textAlign: "center",
        fontFamily: typeFont,
        fontSize: size,
        color,
        letterSpacing: 4,
        textShadow: "0 0 18px rgba(0,0,0,0.9), 0 2px 4px #000",
      }}
    >
      {text.slice(0, chars)}
      <span style={{ opacity: frame % fps < fps / 2 ? 1 : 0 }}>▌</span>
    </div>
  );
};

// Carimbo vermelho batendo na tela
export const Stamp: React.FC<{ text: string; at: number; top?: number; rotate?: number }> = ({ text, at, top = 1050, rotate = -12 }) => {
  const frame = useCurrentFrame();
  return (
    <div
      style={{
        position: "absolute",
        top,
        left: 0,
        right: 0,
        display: "flex",
        justifyContent: "center",
        opacity: interpolate(frame, [at, at + 2], [0, 1], clamp),
        scale: interpolate(frame, [at, at + 5], [2.4, 1], { ...clamp, easing: Easing.in(Easing.quad), output: "perceptual-scale" }),
        rotate: `${rotate}deg`,
      }}
    >
      <div
        style={{
          fontFamily: headFont,
          fontWeight: 700,
          fontSize: 80,
          whiteSpace: "nowrap",
          color: "#d41f1f",
          border: "10px solid #d41f1f",
          padding: "10px 36px",
          letterSpacing: 6,
          background: "rgba(0,0,0,0.35)",
          textShadow: "0 0 12px rgba(212,31,31,0.5)",
        }}
      >
        {text}
      </div>
    </div>
  );
};

// Legenda sincronizada com a voz: cada palavra acende no tempo exato em que é falada
export type Word = { w: string; start: number; end: number };
export const Caption: React.FC<{ words: Word[]; lineStart: number }> = ({ words, lineStart }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = lineStart + frame / fps;
  return (
    <div
      style={{
        position: "absolute",
        bottom: 300,
        left: 80,
        right: 80,
        textAlign: "center",
        fontFamily: headFont,
        fontWeight: 700,
        fontSize: 62,
        lineHeight: 1.25,
        textTransform: "uppercase",
      }}
    >
      {words.map((w, i) => {
        const speaking = t >= w.start && t < (words[i + 1]?.start ?? w.end + 0.3);
        const said = t >= w.start;
        return (
          <span
            key={i}
            style={{
              display: "inline-block",
              marginRight: 16,
              color: speaking ? "#ff3b3b" : said ? "#ffffff" : "rgba(255,255,255,0.25)",
              scale: speaking ? "1.08" : "1",
              textShadow: "0 4px 12px #000, 0 0 3px #000",
            }}
          >
            {w.w}
          </span>
        );
      })}
    </div>
  );
};
