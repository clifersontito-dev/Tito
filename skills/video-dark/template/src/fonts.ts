import { loadFont as loadElite } from "@remotion/google-fonts/SpecialElite";
import { loadFont as loadOswald } from "@remotion/google-fonts/Oswald";

export const { fontFamily: typeFont } = loadElite("normal", { weights: ["400"], subsets: ["latin"] });
export const { fontFamily: headFont } = loadOswald("normal", { weights: ["500", "700"], subsets: ["latin"] });
