import { describe, expect, it } from 'vitest'
import { formatUptime, parseSystemSummary, splitSummaryRecords } from '../useSystemSummary'

const DELIM = '@@NEBULA_SUMMARY@@'
const END = '@@NEBULA_SUMMARY_END@@'

describe('useSystemSummary helpers', () => {
  it('parseSystemSummary legge utente, uptime e load a 1 minuto', () => {
    const raw = `giuseppe\n${DELIM}\n21706.42 250000.1\n${DELIM}\n1.51 1.48 1.37 2/1500 12345\n`
    expect(parseSystemSummary(raw)).toEqual({ user: 'giuseppe', uptimeSeconds: 21706.42, load1: 1.51 })
  })

  it('parseSystemSummary restituisce null senza dati', () => {
    expect(parseSystemSummary('')).toBeNull()
  })

  it('splitSummaryRecords tiene nel buffer il record incompleto', () => {
    const { records, rest } = splitSummaryRecords(`a${END}b${END}c`)
    expect(records).toEqual(['a', 'b'])
    expect(rest).toBe('c')
  })

  it('formatUptime mostra i giorni solo quando servono', () => {
    expect(formatUptime(6 * 3600 + 60)).toBe('6h 01m')
    expect(formatUptime(2 * 86_400 + 3 * 3600 + 5 * 60)).toBe('2d 3h 05m')
  })
})
