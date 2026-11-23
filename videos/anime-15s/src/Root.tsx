import { Composition } from "remotion";
import { AnimeTrailer } from "./AnimeTrailer";
import "./fonts";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="AnimeTrailer"
        component={AnimeTrailer}
        durationInFrames={450}
        fps={30}
        width={1080}
        height={1920}
      />
    </>
  );
};
