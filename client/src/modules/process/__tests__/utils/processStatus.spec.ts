import { describe, expect, it } from 'vitest'
import {
  PROCESS_STATUS_DOT,
  PROCESS_STATUS_LABELS,
  PROCESS_STATUS_TEXT,
} from '../../utils/processStatus'

describe('process status maps', () => {
  it('defines labels, dot classes, and text classes for every process status', () => {
    for (const status of ['R', 'S', 'D', 'Z', 'T', 'I', '?'] as const) {
      expect(PROCESS_STATUS_LABELS[status]).toBeTruthy()
      expect(PROCESS_STATUS_DOT[status]).toContain('bg-')
      expect(PROCESS_STATUS_TEXT[status]).toContain('text-')
    }
  })

  it('uses semantic classes for active, warning, and destructive states', () => {
    expect(PROCESS_STATUS_DOT.R).toContain('bg-success')
    expect(PROCESS_STATUS_DOT.D).toBe('bg-warning')
    expect(PROCESS_STATUS_DOT.Z).toBe('bg-destructive')
    expect(PROCESS_STATUS_TEXT.R).toBe('text-success')
    expect(PROCESS_STATUS_TEXT.Z).toBe('text-destructive')
  })
})
