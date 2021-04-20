export function clampTo8bit(a: any) {
  return a < 0 ? 0 : a > 255 ? 255 : a;
}
