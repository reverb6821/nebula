export function formatBytesDecimal(bytes: number, decimals = 1): string {
  if (!isFinite(bytes)) return '–'
  if (bytes < 1000) return `${Math.round(bytes)} byte`
  const units = ['kB', 'MB', 'GB', 'TB']
  let v = bytes / 1000
  let i = 0
  while (v >= 1000 && i < units.length - 1) { v /= 1000; i++ }
  return `${v.toLocaleString('it-IT', { maximumFractionDigits: decimals, minimumFractionDigits: decimals })} ${units[i]}`
}

export function formatRateBinary(bytesPerSec: number, decimals = 1): string {
  if (!isFinite(bytesPerSec) || bytesPerSec < 1) return '0 byte/s'
  if (bytesPerSec < 1024) return `${Math.round(bytesPerSec)} byte/s`
  const units = ['KiB/s', 'MiB/s', 'GiB/s']
  let v = bytesPerSec / 1024
  let i = 0
  while (v >= 1024 && i < units.length - 1) { v /= 1024; i++ }
  return `${v.toLocaleString('it-IT', { maximumFractionDigits: decimals, minimumFractionDigits: decimals })} ${units[i]}`
}

export function formatPercent(v: number, decimals = 1): string {
  return `${v.toLocaleString('it-IT', { maximumFractionDigits: decimals, minimumFractionDigits: decimals })}%`
}

export function formatTemp(c: number | null): string {
  return c === null ? '– °C' : `${c.toLocaleString('it-IT', { maximumFractionDigits: 0 })} °C`
}

export function formatWatts(w: number | null): string {
  return w === null ? '– W' : `${w.toLocaleString('it-IT', { maximumFractionDigits: 1 })} W`
}