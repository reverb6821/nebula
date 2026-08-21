import { runCmd } from '@/composables/useNeutralinoCmd'
import type { SensorsSnapshot } from '@/types/resources'

// ─── Dipendenze reali di questo file (non npm — pacchetti di sistema) ──────
// - `sensors -j` (pacchetto lm-sensors): temperatura CPU/GPU integrata.
//   Va eseguito `sensors-detect` una volta sul sistema perché esponga dati;
//   se lm-sensors non è installato, torniamo sempre null (nessun crash).
// - /sys/class/powercap/intel-rapl:0/energy_uj: potenza pacchetto CPU,
//   SOLO su CPU Intel con RAPL esposto dal kernel. Su AMD/ARM non esiste:
//   cpuPowerW resta null.
// - `nvidia-smi`: temperatura e potenza GPU, SOLO se hai una GPU NVIDIA con
//   driver proprietario installato. Per GPU AMD/Intel integrate la
//   temperatura arriva da lm-sensors (chip amdgpu/i915), ma non la potenza
//   (non c'è un equivalente RAPL-like universale per le GPU non-NVIDIA).

const D1 = '@@SENS_D1@@'
const D2 = '@@SENS_D2@@'

const CPU_CHIP_RE = /^(coretemp|k10temp|zenpower|cpu)/i
const CPU_LABEL_RE = /package|tdie|tctl/i
const GPU_CHIP_RE = /^(amdgpu|nouveau|radeon|i915)/i

function extractTemps(chip: Record<string, unknown>): number[] {
  const temps: number[] = []
  for (const key of Object.keys(chip)) {
    const entry = chip[key]
    if (entry && typeof entry === 'object') {
      for (const [field, value] of Object.entries(entry as Record<string, unknown>)) {
        if (/^temp\d*_input$/.test(field) && typeof value === 'number') {
          temps.push(value)
        }
      }
    }
  }
  return temps
}

function parseSensorsJson(raw: string): { cpuTempC: number | null; gpuTempC: number | null } {
  let cpuTempC: number | null = null
  let gpuTempC: number | null = null

  try {
    const data = JSON.parse(raw) as Record<string, Record<string, unknown>>
    for (const chipName of Object.keys(data)) {
      const chip = data[chipName]!

      if (CPU_CHIP_RE.test(chipName) && cpuTempC === null) {
        const packageLabel = Object.keys(chip).find((k) => CPU_LABEL_RE.test(k))
        if (packageLabel) {
          const temps = extractTemps({ [packageLabel]: chip[packageLabel] })
          if (temps.length) cpuTempC = temps[0]!
        }
        if (cpuTempC === null) {
          // Nessuna etichetta "Package"/"Tdie": media di tutti i core come stima
          const temps = extractTemps(chip)
          if (temps.length) cpuTempC = temps.reduce((a, b) => a + b, 0) / temps.length
        }
      }

      if (GPU_CHIP_RE.test(chipName) && gpuTempC === null) {
        const temps = extractTemps(chip)
        if (temps.length) gpuTempC = temps[0]!
      }
    }
  } catch {
    // `sensors` non installato, o output vuoto/non-JSON: entrambi restano null
  }

  return { cpuTempC, gpuTempC }
}

function parseNvidiaSmi(raw: string): { gpuTempC: number | null; gpuPowerW: number | null } {
  const line = raw.trim().split('\n')[0]
  if (!line) return { gpuTempC: null, gpuPowerW: null }

  const [tempStr, powerStr] = line.split(',').map((s) => s.trim())
  const gpuTempC = tempStr ? parseFloat(tempStr) : NaN
  const gpuPowerW = powerStr ? parseFloat(powerStr) : NaN

  return {
    gpuTempC: isNaN(gpuTempC) ? null : gpuTempC,
    gpuPowerW: isNaN(gpuPowerW) ? null : gpuPowerW,
  }
}

// Factory: tiene il campione RAPL precedente per calcolare la potenza come
// delta di energia / tempo (stesso principio del CPU% da /proc/stat).
// Il contatore energy_uj si azzera (wrap) al superamento di un tetto
// massimo: se il delta risulta negativo il campione viene scartato invece
// di mostrare un valore negativo privo di senso.
export function createSensorsSampler() {
  let prevEnergyUj: number | null = null
  let prevTimestamp = 0

  return async function sample(): Promise<SensorsSnapshot> {
    const { stdout } = await runCmd(
      `sensors -j 2>/dev/null; echo "${D1}"; ` +
      `cat /sys/class/powercap/intel-rapl:0/energy_uj 2>/dev/null; echo "${D2}"; ` +
      `nvidia-smi --query-gpu=temperature.gpu,power.draw --format=csv,noheader,nounits 2>/dev/null`,
    )

    const [sensorsRaw = '', raplRaw = '', nvidiaRaw = ''] = stdout.split(
      new RegExp(`${D1}|${D2}`),
    )

    const { cpuTempC, gpuTempC: sensorsGpuTemp } = parseSensorsJson(sensorsRaw)
    const nvidia = parseNvidiaSmi(nvidiaRaw)

    const now = Date.now()
    let cpuPowerW: number | null = null
    const energyUj = parseInt(raplRaw.trim(), 10)

    if (!isNaN(energyUj)) {
      if (prevEnergyUj !== null) {
        const dUj = energyUj - prevEnergyUj
        const dt = (now - prevTimestamp) / 1000
        if (dUj >= 0 && dt > 0) cpuPowerW = dUj / 1_000_000 / dt
      }
      prevEnergyUj = energyUj
      prevTimestamp = now
    }

    return {
      cpuTempC,
      gpuTempC: nvidia.gpuTempC ?? sensorsGpuTemp,
      cpuPowerW,
      gpuPowerW: nvidia.gpuPowerW,
    }
  }
}