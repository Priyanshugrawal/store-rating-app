// Shared by the 3D scenes and the 2D store tiles so a store keeps the same colour everywhere.
export const SIGNAGE = ['#2F5BEA', '#F2542D', '#14A37F', '#FF9F1C', '#2BB3C0', '#8A5CF6', '#E35D8F'];

export function hashString(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i += 1) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
export const colorForName = (name) => SIGNAGE[hashString(name) % SIGNAGE.length];
