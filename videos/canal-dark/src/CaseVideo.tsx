import { Audio } from "@remotion/media";
import { AbsoluteFill, Sequence, staticFile, useVideoConfig } from "remotion";
import { Caption, Fade, FilmLook, Label, Photo } from "./fx";
import { CaseClosed, Clip, CrewAndNote, DateCard, Demands, EndCard, Jump, ManAndTicket, NoSign, RouteMap } from "./scenes";
import timings from "./timings.json";

export const CaseVideo: React.FC = () => {
  const { fps, durationInFrames } = useVideoConfig();
  const L = timings.lines;
  // cada cena começa um pouco antes da sua fala e vai até a próxima
  const start = (i: number) => (i === 0 ? 0 : Math.round((L[i].start - 0.25) * fps));
  const len = (i: number) => (i === L.length - 1 ? durationInFrames : start(i + 1)) - start(i);

  const scene = (i: number) => {
    const d = len(i);
    switch (i) {
      case 0: return <DateCard />;
      case 1: return <ManAndTicket durationInFrames={d} />;
      case 2: return <CrewAndNote durationInFrames={d} />;
      case 3: return <Demands />;
      case 4: {
        const h = Math.floor(d / 2);
        return (
          <>
            <Sequence name="Rádio da polícia" durationInFrames={h}><Clip src="clip-radio.mp4" durationInFrames={h} label="SEATTLE-TACOMA" /></Sequence>
            <Sequence name="Viatura" from={h} durationInFrames={d - h}><Clip src="clip-viatura.mp4" durationInFrames={d - h} /></Sequence>
          </>
        );
      }
      case 5: return <RouteMap durationInFrames={d} />;
      case 6: return <Jump durationInFrames={d} />;
      case 7: return (<><Clip src="clip-interrogatorio.mp4" durationInFrames={d} /><Label text="+800 SUSPEITOS" top={240} size={80} color="#ff4a4a" /></>);
      case 8: return (<><Photo src="money.jpg" durationInFrames={d} fit="contain" zoomFrom={1.05} zoomTo={1.4} filter="sepia(0.3) contrast(1.1) brightness(0.85)" /><Label text="1980 · US$ 5.800 · RIO COLUMBIA" top={240} size={50} /></>);
      case 9: return <NoSign durationInFrames={d} />;
      case 10: return <CaseClosed durationInFrames={d} />;
      default: return <EndCard durationInFrames={d} />;
    }
  };

  return (
    <AbsoluteFill style={{ background: "black" }}>
      {L.map((line, i) => (
        <Sequence key={i} name={`Cena ${i + 1}`} from={start(i)} durationInFrames={len(i)}>
          <Fade durationInFrames={len(i)}>{scene(i)}</Fade>
        </Sequence>
      ))}
      <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(0,0,0,0) 58%, rgba(0,0,0,0.85) 78%, rgba(0,0,0,0.9) 100%)" }} />
      {L.map((line, i) => (
        <Sequence key={`c${i}`} name={`Legenda ${i + 1}`} from={Math.round(line.start * fps)} durationInFrames={Math.round((line.dur + 0.4) * fps)}>
          <Caption text={line.text} durationInFrames={Math.round(line.dur * fps)} />
        </Sequence>
      ))}
      <FilmLook />
      <Audio src={staticFile("narracao.wav")} />
      <Audio src={staticFile("drone.wav")} volume={0.35} />
    </AbsoluteFill>
  );
};
