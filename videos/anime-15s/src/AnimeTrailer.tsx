import { AbsoluteFill, Sequence, useVideoConfig } from "remotion";
import { CityNight } from "./scenes/CityNight";
import { Eyes } from "./scenes/Eyes";
import { PowerUp } from "./scenes/PowerUp";
import { TitleCard } from "./scenes/TitleCard";

export const AnimeTrailer: React.FC = () => {
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill style={{ background: "black" }}>
      <Sequence name="Cidade à noite" durationInFrames={3 * fps}>
        <CityNight />
      </Sequence>
      <Sequence name="Olhos" from={3 * fps} durationInFrames={3.5 * fps}>
        <Eyes />
      </Sequence>
      <Sequence name="Poder" from={6.5 * fps} durationInFrames={4 * fps}>
        <PowerUp />
      </Sequence>
      <Sequence name="Título" from={10.5 * fps} durationInFrames={4.5 * fps}>
        <TitleCard />
      </Sequence>
    </AbsoluteFill>
  );
};
