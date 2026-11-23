import { Video } from "@remotion/media";
import { AbsoluteFill, Easing, interpolate, random, Sequence, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { headFont, typeFont } from "./fonts";
import { Label, Photo, Stamp } from "./fx";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

export const Clip: React.FC<{ src: string; durationInFrames: number; label?: string }> = ({ src, durationInFrames, label }) => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background: "black", overflow: "hidden" }}>
      <Video
        src={staticFile(src)}
        muted
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          filter: "sepia(0.35) contrast(1.2) brightness(0.8)",
          scale: `${interpolate(frame, [0, durationInFrames], [1.05, 1.18], clamp)}`,
        }}
      />
      {label ? <Label text={label} top={240} size={56} /> : null}
    </AbsoluteFill>
  );
};

export const DateCard: React.FC = () => (
  <AbsoluteFill style={{ background: "#070707" }}>
    <Label text="24 · NOV · 1971" top={820} size={110} />
    <Label text="PORTLAND, OREGON — EUA" top={980} size={50} delay={22} color="#b8ad92" />
  </AbsoluteFill>
);

export const ManAndTicket: React.FC<{ durationInFrames: number }> = ({ durationInFrames }) => {
  const half = Math.floor(durationInFrames * 0.45);
  return (
    <AbsoluteFill>
      <Sequence name="Retrato falado" durationInFrames={half}>
        <Photo src="sketch.jpg" durationInFrames={half} fit="contain" zoomFrom={1.05} zoomTo={1.25} />
        <Label text="RETRATO FALADO — FBI" top={240} size={52} />
      </Sequence>
      <Sequence name="Passagem" from={half} durationInFrames={durationInFrames - half}>
        <Photo src="ticket.jpg" durationInFrames={durationInFrames - half} fit="cover" zoomFrom={1.1} zoomTo={1.35} panFrom="250px 0px" panTo="-150px 0px" />
        <Label text='PASSAGEIRO: "DAN COOPER"' top={240} size={52} />
      </Sequence>
    </AbsoluteFill>
  );
};

export const CrewAndNote: React.FC<{ durationInFrames: number }> = ({ durationInFrames }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const at = 1.6 * fps;
  return (
    <AbsoluteFill>
      <Photo src="crew.jpg" durationInFrames={durationInFrames} fit="cover" zoomFrom={1.0} zoomTo={1.2} panFrom="-200px 0px" panTo="100px 0px" />
      <Label text="TRIPULAÇÃO DO VOO 305" top={240} size={52} />
      <div
        style={{
          position: "absolute",
          top: 700,
          left: 140,
          right: 140,
          padding: "50px 40px",
          background: "#efe6cf",
          boxShadow: "0 30px 60px rgba(0,0,0,0.8)",
          fontFamily: typeFont,
          fontSize: 58,
          lineHeight: 1.3,
          color: "#1a1a1a",
          rotate: "-4deg",
          opacity: interpolate(frame, [at, at + 6], [0, 1], clamp),
          translate: interpolate(frame, [at, at + 12], ["0px 120px", "0px 0px"], { ...clamp, easing: Easing.bezier(0.16, 1, 0.3, 1) }),
        }}
      >
        "TENHO UMA BOMBA NA MINHA MALETA."
      </div>
    </AbsoluteFill>
  );
};

export const Demands: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const amount = Math.floor(interpolate(frame, [0, 1.4 * fps], [0, 200000], { ...clamp, easing: Easing.out(Easing.cubic) }));
  return (
    <AbsoluteFill style={{ background: "radial-gradient(circle at 50% 45%, #1c1508, #050505 70%)" }}>
      <div style={{ position: "absolute", top: 260, left: 0, right: 0, textAlign: "center", fontFamily: typeFont, fontSize: 56, color: "#b8ad92", letterSpacing: 4 }}>
        EXIGÊNCIAS
      </div>
      <div style={{ position: "absolute", top: 640, left: 0, right: 0, textAlign: "center", fontFamily: headFont, fontWeight: 700, fontSize: 170, color: "#7fbf6a", textShadow: "0 0 40px rgba(127,191,106,0.35)" }}>
        US$ {amount.toLocaleString("pt-BR")}
      </div>
      <div
        style={{
          position: "absolute",
          top: 900,
          left: 0,
          right: 0,
          textAlign: "center",
          fontFamily: headFont,
          fontWeight: 700,
          fontSize: 100,
          color: "#e8e2d0",
          opacity: interpolate(frame, [1.6 * fps, 2 * fps], [0, 1], clamp),
        }}
      >
        + 4 PARAQUEDAS
      </div>
    </AbsoluteFill>
  );
};

// Mapa desenhado: Seattle -> sul, com o ponto provável do salto
export const RouteMap: React.FC<{ durationInFrames: number }> = ({ durationInFrames }) => {
  const frame = useCurrentFrame();
  const p = interpolate(frame, [10, durationInFrames * 0.75], [0, 1], { ...clamp, easing: Easing.inOut(Easing.quad) });
  const pts: [number, number][] = [[560, 420], [520, 700], [470, 980], [430, 1260]];
  const seg = p * (pts.length - 1);
  const k = Math.min(Math.floor(seg), pts.length - 2);
  const t = seg - k;
  const px = pts[k][0] + (pts[k + 1][0] - pts[k][0]) * t;
  const py = pts[k][1] + (pts[k + 1][1] - pts[k][1]) * t;
  const jump = { x: 490, y: 860 };
  const showJump = p > 0.5;
  return (
    <AbsoluteFill style={{ background: "#0a0d0a" }}>
      <svg width={1080} height={1920}>
        {/* grade de mapa */}
        {new Array(20).fill(0).map((_, i) => (
          <line key={`h${i}`} x1={0} x2={1080} y1={i * 100} y2={i * 100} stroke="#1b241b" strokeWidth={2} />
        ))}
        {new Array(11).fill(0).map((_, i) => (
          <line key={`v${i}`} y1={0} y2={1920} x1={i * 100} x2={i * 100} stroke="#1b241b" strokeWidth={2} />
        ))}
        {/* floresta */}
        {new Array(140).fill(0).map((_, i) => {
          const x = 250 + random(`tx${i}`) * 560;
          const y = 650 + random(`ty${i}`) * 520;
          return <path key={i} d={`M${x} ${y - 22} L${x - 12} ${y + 6} L${x + 12} ${y + 6} Z`} fill="#1f3a22" opacity={0.85} />;
        })}
        <polyline points={pts.map((q) => q.join(",")).join(" ")} fill="none" stroke="#3a3a3a" strokeWidth={6} strokeDasharray="18 14" />
        <polyline
          points={[...pts.slice(0, k + 1), [px, py]].map((q) => q.join(",")).join(" ")}
          fill="none"
          stroke="#d41f1f"
          strokeWidth={8}
        />
        <circle cx={pts[0][0]} cy={pts[0][1]} r={14} fill="#e8e2d0" />
        <text x={pts[0][0] + 30} y={pts[0][1] + 14} fill="#e8e2d0" fontFamily={typeFont} fontSize={48}>SEATTLE</text>
        <text x={pts[3][0] + 30} y={pts[3][1] + 14} fill="#777" fontFamily={typeFont} fontSize={40}>→ RENO / MÉXICO</text>
        <text x={300} y={1230} fill="#4f7a52" fontFamily={typeFont} fontSize={40}>FLORESTAS DE WASHINGTON</text>
        {/* avião */}
        <g transform={`translate(${px} ${py}) rotate(${190})`}>
          <path d="M0 -40 L8 -10 L40 4 L40 12 L8 4 L6 28 L16 36 L16 42 L0 38 L-16 42 L-16 36 L-6 28 L-8 4 L-40 12 L-40 4 L-8 -10 Z" fill="#e8e2d0" />
        </g>
        {showJump ? (
          <g opacity={interpolate(frame, [durationInFrames * 0.45, durationInFrames * 0.5], [0, 1], clamp)}>
            <circle cx={jump.x} cy={jump.y} r={40 + 20 * Math.abs(Math.sin(frame / 5))} fill="none" stroke="#d41f1f" strokeWidth={5} />
            <text x={jump.x - 420} y={jump.y + 14} fill="#ff4a4a" fontFamily={headFont} fontWeight={700} fontSize={50}>SALTO?</text>
          </g>
        ) : null}
      </svg>
      <Label text="22h — ESCADA TRASEIRA ABERTA" top={240} size={52} delay={Math.floor(durationInFrames * 0.45)} />
    </AbsoluteFill>
  );
};

// Noite, chuva, uma silhueta de paraquedas sumindo no escuro
export const Jump: React.FC<{ durationInFrames: number }> = ({ durationInFrames }) => {
  const frame = useCurrentFrame();
  const lightning = frame % 70 > 40 && frame % 70 < 44 ? 0.55 : 0;
  const fall = interpolate(frame, [0, durationInFrames], [0, 1], clamp);
  return (
    <AbsoluteFill style={{ background: "linear-gradient(180deg, #0b0f16, #030406)" }}>
      <AbsoluteFill style={{ background: "#cfd8ff", opacity: lightning }} />
      {/* silhueta */}
      <svg width={1080} height={1920} style={{ position: "absolute" }}>
        <g
          transform={`translate(540 ${interpolate(fall, [0, 1], [500, 1150])}) scale(${interpolate(fall, [0, 1], [1.4, 0.35])})`}
          opacity={interpolate(fall, [0.6, 1], [1, 0], clamp)}
        >
          <path d="M-160 0 Q0 -140 160 0 Q80 -20 0 -18 Q-80 -20 -160 0 Z" fill="#000" stroke="#2c3442" strokeWidth={3} />
          <line x1={-150} y1={0} x2={0} y2={170} stroke="#2c3442" strokeWidth={3} />
          <line x1={150} y1={0} x2={0} y2={170} stroke="#2c3442" strokeWidth={3} />
          <line x1={-60} y1={-14} x2={0} y2={170} stroke="#2c3442" strokeWidth={2} />
          <line x1={60} y1={-14} x2={0} y2={170} stroke="#2c3442" strokeWidth={2} />
          <circle cx={0} cy={180} r={14} fill="#000" />
          <path d="M-14 192 L14 192 L18 250 L6 300 L-6 300 L-18 250 Z" fill="#000" />
        </g>
        {/* chuva */}
        {new Array(160).fill(0).map((_, i) => {
          const x = random(`rx${i}`) * 1200 - 60;
          const sp = 40 + random(`rs${i}`) * 30;
          const y = ((frame * sp + random(`ry${i}`) * 2000) % 2100) - 100;
          return <line key={i} x1={x} y1={y} x2={x - 12} y2={y + 60} stroke="#8fa3c7" strokeWidth={2} opacity={0.35} />;
        })}
      </svg>
      <Label text="10.000 PÉS · CHUVA · ESCURIDÃO" top={240} size={50} />
    </AbsoluteFill>
  );
};

export const NoSign: React.FC<{ durationInFrames: number }> = ({ durationInFrames }) => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background: "black" }}>
      <AbsoluteFill style={{ opacity: interpolate(frame, [0, durationInFrames], [0.7, 0], clamp) }}>
        <Photo src="sketch.jpg" durationInFrames={durationInFrames} zoomFrom={1.3} zoomTo={1.6} filter="grayscale(1) contrast(1.4) brightness(0.6)" />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export const CaseClosed: React.FC<{ durationInFrames: number }> = ({ durationInFrames }) => {
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill>
      <Photo src="poster.jpg" durationInFrames={durationInFrames} fit="contain" zoomFrom={1.0} zoomTo={1.12} filter="grayscale(1) contrast(1.2) brightness(0.8)" />
      <Stamp text="CASO SUSPENSO · 2016" at={Math.floor(2.2 * fps)} top={860} />
    </AbsoluteFill>
  );
};

export const EndCard: React.FC<{ durationInFrames: number }> = ({ durationInFrames }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill style={{ background: "black" }}>
      <AbsoluteFill style={{ opacity: 0.45 }}>
        <Photo src="sketch.jpg" durationInFrames={durationInFrames} zoomFrom={1.1} zoomTo={1.2} filter="grayscale(1) contrast(1.3) brightness(0.55)" />
      </AbsoluteFill>
      <div
        style={{
          position: "absolute",
          top: 560,
          left: 0,
          right: 0,
          textAlign: "center",
          fontFamily: headFont,
          fontWeight: 700,
          fontSize: 150,
          whiteSpace: "nowrap",
          color: "#fff",
          letterSpacing: 6,
          textShadow: "0 0 40px #000",
          opacity: interpolate(frame, [0, 10], [0, 1], clamp),
        }}
      >
        D.B. COOPER
      </div>
      <div
        style={{
          position: "absolute",
          top: 790,
          left: 0,
          right: 0,
          textAlign: "center",
          fontFamily: typeFont,
          fontSize: 70,
          color: "#ff3b3b",
          opacity: interpolate(frame, [1.2 * fps, 1.8 * fps], [0, 1], clamp),
        }}
      >
        QUEM ERA ELE?
      </div>
      <AbsoluteFill style={{ background: "black", opacity: interpolate(frame, [durationInFrames - 20, durationInFrames], [0, 1], clamp) }} />
    </AbsoluteFill>
  );
};
