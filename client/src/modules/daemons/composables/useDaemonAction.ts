import { runCmd } from '@/composables/useNeutralinoCmd'
import type { Daemon, DaemonStatus, DaemonEnabled } from '@/types/daemon'

// ─── Platform detection ───────────────────────────────────────────────────────

function isWindows(): boolean {
  return window.NL_OS === 'Windows'
}

// ─── Linux parsers ────────────────────────────────────────────────────────────

interface SystemctlUnit {
  unit: string
  description: string
  active: string
  sub: string
  load: string
}

function mapLinuxStatus(active: string, sub: string): DaemonStatus {
  if (active === 'active' && sub === 'running') return 'active'
  if (active === 'failed') return 'failed'
  if (active === 'inactive') return 'inactive'
  return 'unknown'
}

function parseLinuxDaemons(raw: string): Daemon[] {
  try {
    const units = JSON.parse(raw) as SystemctlUnit[]
    return units.map((u) => ({
      name: u.unit.replace('.service', ''),
      description: u.description,
      status: mapLinuxStatus(u.active, u.sub),
      enabled: 'unknown' as DaemonEnabled,
    }))
  } catch {
    return []
  }
}

async function enrichLinuxEnabled(daemons: Daemon[]): Promise<Daemon[]> {
  if (daemons.length === 0) return daemons

  const names = daemons.map((d) => `${d.name}.service`).join(' ')
  const { stdout } = await runCmd(
    `systemctl show ${names} --property=Id,UnitFileState --no-pager`,
  )

  const enabledMap: Record<string, DaemonEnabled> = {}
  const blocks = stdout.trim().split(/\n\n+/)

  for (const block of blocks) {
    const id = block.match(/^Id=(.+)$/m)?.[1]?.replace('.service', '')
    const state = block.match(/^UnitFileState=(.+)$/m)?.[1]
    if (id && state) {
      const mapped: DaemonEnabled =
        state === 'enabled' || state === 'disabled' || state === 'static'
          ? (state as DaemonEnabled)
          : 'unknown'
      enabledMap[id] = mapped
    }
  }

  return daemons.map((d) => ({ ...d, enabled: enabledMap[d.name] ?? 'unknown' }))
}

// ─── Windows parsers ──────────────────────────────────────────────────────────

interface WindowsService {
  Name: string
  DisplayName: string
  Status: number    // 4 = Running, 1 = Stopped
  StartType: number // 2 = Automatic, 3 = Manual, 4 = Disabled
}

function mapWindowsEnabled(startType: number): DaemonEnabled {
  if (startType === 2) return 'enabled'
  if (startType === 4) return 'disabled'
  return 'static' // Manual
}

function mapWindowsStatus(status: number): DaemonStatus {
  if (status === 4) return 'active'
  if (status === 1) return 'inactive'
  return 'unknown'
}

function parseWindowsServices(raw: string): Daemon[] {
  try {
    const services = JSON.parse(raw) as WindowsService[]
    return services.map((s) => ({
      name: s.Name,
      description: s.DisplayName,
      status: mapWindowsStatus(s.Status),
      enabled: mapWindowsEnabled(s.StartType),
    }))
  } catch {
    return []
  }
}

// ─── List ─────────────────────────────────────────────────────────────────────

export async function listDaemons(): Promise<Daemon[]> {
  if (isWindows()) {
    const { stdout } = await runCmd(
      `powershell -NoProfile -Command "Get-Service | Select-Object Name,DisplayName,Status,StartType | ConvertTo-Json -Compress"`,
    )
    return parseWindowsServices(stdout)
  }

  // list-unit-files mostra TUTTE le unit installate, anche quelle mai caricate
  const { stdout: filesOut } = await runCmd(
    'systemctl list-unit-files --type=service --output=json --no-pager',
  )

  // list-units per avere lo stato runtime (active/inactive/failed)
  const { stdout: unitsOut } = await runCmd(
    'systemctl list-units --type=service --all --output=json --no-pager',
  )

  // Mappa dello stato runtime indicizzata per nome
  const runtimeMap = new Map<string, { status: DaemonStatus }>()
  try {
    const units = JSON.parse(unitsOut) as Array<{
      unit: string
      active: string
      sub: string
    }>
    for (const u of units) {
      runtimeMap.set(u.unit, { status: mapLinuxStatus(u.active, u.sub) })
    }
  } catch { /* ignora errori di parsing */ }

  // Costruisci la lista completa da unit-files
  let daemons: Daemon[] = []
  try {
    const files = JSON.parse(filesOut) as Array<{
      unit_file: string
      state: string      // enabled, disabled, static, masked...
      preset: string
    }>

    daemons = files.map((f) => {
      const name = f.unit_file.replace('.service', '')
      const runtime = runtimeMap.get(f.unit_file)
      const enabled: DaemonEnabled =
        f.state === 'enabled' ? 'enabled'
        : f.state === 'disabled' ? 'disabled'
        : f.state === 'static' ? 'static'
        : 'unknown'

      return {
        name,
        description: '',          // non disponibile da unit-files
        status: runtime?.status ?? 'inactive',
        enabled,
      }
    })
  } catch {
    return []
  }

  // Arricchisci con le description tramite systemctl show (batch)
  // Limitato a 100 per non appesantire troppo
  const names = daemons.slice(0, 100).map((d) => `${d.name}.service`).join(' ')
  if (names) {
    try {
      const { stdout: showOut } = await runCmd(
        `systemctl show ${names} --property=Id,Description --no-pager`,
      )
      const blocks = showOut.trim().split(/\n\n+/)
      const descMap = new Map<string, string>()
      for (const block of blocks) {
        const id = block.match(/^Id=(.+)$/m)?.[1]?.replace('.service', '')
        const desc = block.match(/^Description=(.+)$/m)?.[1]
        if (id && desc) descMap.set(id, desc)
      }
      daemons = daemons.map((d) => ({
        ...d,
        description: descMap.get(d.name) ?? d.name,
      }))
    } catch { /* descrizioni opzionali */ }
  }

  return daemons
}
// ─── Privileged exec ──────────────────────────────────────────────────────────
// pkexec/powershell possono fallire (prompt polkit annullato, permessi
// negati, nessun polkit agent attivo...) senza che questo sia mai stato
// controllato: runCmd tornava comunque una Promise risolta e lo store
// segnava l'azione come riuscita anche a comando fallito. Risultato: "stop"
// che in UI sembra funzionare ma il demone resta attivo.
async function runPrivileged(cmd: string): Promise<void> {
  const { exitCode, stderr } = await runCmd(cmd)
  if (exitCode !== 0) {
    throw new Error(stderr.trim() || `Comando fallito (exit code ${exitCode})`)
  }
}

// ─── Start / Stop ─────────────────────────────────────────────────────────────

export async function startDaemon(name: string): Promise<void> {
  if (isWindows()) {
    return runPrivileged(
      `powershell -NoProfile -Command "Start-Service -Name '${name}'"`,
    )
  }
  return runPrivileged(`pkexec systemctl start ${name}.service`)
}

export async function stopDaemon(name: string): Promise<void> {
  if (isWindows()) {
    return runPrivileged(
      `powershell -NoProfile -Command "Stop-Service -Name '${name}' -Force"`,
    )
  }
  return runPrivileged(`pkexec systemctl stop ${name}.service`)
}

export async function restartDaemon(name: string): Promise<void> {
  if (isWindows()) {
    return runPrivileged(
      `powershell -NoProfile -Command "Restart-Service -Name '${name}' -Force"`,
    )
  }
  return runPrivileged(`pkexec systemctl restart ${name}.service`)
}

// ─── Enable / Disable (boot autostart) ───────────────────────────────────────

export async function enableDaemon(name: string): Promise<void> {
  if (isWindows()) {
    return runPrivileged(
      `powershell -NoProfile -Command "Set-Service -Name '${name}' -StartupType Automatic"`,
    )
  }
  return runPrivileged(`pkexec systemctl enable ${name}.service`)
}

export async function disableDaemon(name: string): Promise<void> {
  if (isWindows()) {
    return runPrivileged(
      `powershell -NoProfile -Command "Set-Service -Name '${name}' -StartupType Disabled"`,
    )
  }
  return runPrivileged(`pkexec systemctl disable ${name}.service`)
}