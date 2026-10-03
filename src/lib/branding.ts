/** Turns a school's brand colour into the shades the app's `brand-*` classes use. */
const HEX = /^#[0-9a-fA-F]{6}$/;
export const validColour = (c: string | null | undefined): c is string => !!c && HEX.test(c);
const mix = (rgb: number[], to: number, t: number) => rgb.map((v) => Math.round(v + (to - v) * t));

export function brandVars(hex: string | null | undefined): string | null {
  if (!validColour(hex)) return null;
  const base = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
  const shades: Record<number, number[]> = {
    50: mix(base, 255, 0.93), 100: mix(base, 255, 0.85), 200: mix(base, 255, 0.7), 300: mix(base, 255, 0.5), 400: mix(base, 255, 0.28), 500: mix(base, 255, 0.1),
    600: base, 700: mix(base, 0, 0.14), 800: mix(base, 0, 0.3), 900: mix(base, 0, 0.45), 950: mix(base, 0, 0.62),
  };
  return Object.entries(shades).map(([k, v]) => `--brand-${k}:${v.join(" ")}`).join(";");
}
