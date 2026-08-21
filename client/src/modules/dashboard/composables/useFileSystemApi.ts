import { runCmd } from '@/composables/useNeutralinoCmd'
import type { FsEntry } from '@/types/resources'

// Filesystem "non reali" da escludere dalla tabella (tmpfs, mount di
// sistema, squashfs dei pacchetti snap, ecc.) — stessa logica di `df -h`
// quando usato interattivamente da un umano che vuole vedere solo i dischi.
const FS_BLOCKLIST = new Set([
  'tmpfs', 'devtmpfs', 'proc', 'sysfs', 'cgroup', 'cgroup2', 'pstore', 'bpf',
  'tracefs', 'debugfs', 'mqueue', 'hugetlbfs', 'devpts', 'securityfs', 'autofs',
  'binfmt_misc', 'configfs', 'fusectl', 'overlay', 'squashfs', 'efivarfs', 'ramfs',
])

export async function listFilesystems(): Promise<FsEntry[]> {
  const { stdout, exitCode } = await runCmd(
    'df -B1 --output=source,target,fstype,size,avail,used 2>/dev/null',
  )
  if (exitCode !== 0 || !stdout.trim()) return []

  const lines = stdout.trim().split('\n').slice(1) // salta l'header di df

  return lines
    .map((line): FsEntry | null => {
      // NB: se un mountpoint contiene spazi, questo split lo spezza in modo
      // scorretto — limite noto dello split su whitespace dell'output di df.
      const cols = line.trim().split(/\s+/)
      if (cols.length < 6) return null

      const [source, target, fsType, sizeStr, availStr, usedStr] = cols
      if (!source || !fsType || FS_BLOCKLIST.has(fsType)) return null

      const totalBytes = parseInt(sizeStr ?? '0', 10) || 0
      const availBytes = parseInt(availStr ?? '0', 10) || 0
      const usedBytes = parseInt(usedStr ?? '0', 10) || 0
      if (totalBytes === 0) return null

      return {
        device: source,
        mount: target ?? '?',
        fsType,
        totalBytes,
        availBytes,
        usedBytes,
        usedPercent: (usedBytes / totalBytes) * 100,
      }
    })
    .filter((e): e is FsEntry => e !== null)
}