import { Composition } from "remotion";
import { CaseVideo } from "./CaseVideo";
import "./fonts";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="CasoDBCooper"
        component={CaseVideo}
        durationInFrames={2135}
        fps={30}
        width={1080}
        height={1920}
      />
    </>
  );
};
