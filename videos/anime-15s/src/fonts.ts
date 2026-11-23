import { loadFont as loadBangers } from "@remotion/google-fonts/Bangers";
import { loadFont as loadDela } from "@remotion/google-fonts/DelaGothicOne";

export const { fontFamily: titleFont } = loadBangers("normal", {
  weights: ["400"],
  subsets: ["latin"],
});
export const { fontFamily: kanjiFont } = loadDela("normal", {
  weights: ["400"],
});
