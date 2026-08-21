export const CPU_COLORS = [
  '#ef4444', '#f97316', '#eab308', '#22c55e',
  '#10b981', '#3b82f6', '#0ea5e9', '#8b5cf6',
  '#a855f7', '#ec4899', '#fb923c', '#facc15',
]

export function cpuColor(i: number): string {
  return CPU_COLORS[i % CPU_COLORS.length]!
}