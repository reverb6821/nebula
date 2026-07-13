import { describe, expect, it } from 'vitest'
import { cn } from '@/lib/utils'

describe('cn utility', () => {
  it('dovrebbe unire stringhe di classi semplici', () => {
    const result = cn('bg-red-500', 'text-white')
    expect(result).toBe('bg-red-500 text-white')
  })

  it('dovrebbe ignorare i valori condizionali falsi (boolean, null, undefined)', () => {
    const isHovered = false
    const isActive = true
    
    const result = cn(
      'p-4',
      isHovered && 'bg-blue-500',
      isActive && 'text-black',
      null,
      undefined
    )
    
    expect(result).toBe('p-4 text-black')
  })

  it('dovrebbe risolvere correttamente i conflitti di Tailwind usando twMerge', () => {
    // twMerge deve far prevalere l'ultima classe inserita in caso di conflitto sullo stesso modificatore
    const result = cn('px-2 py-1', 'p-4')
    expect(result).toBe('p-4')
  })

  it('dovrebbe gestire array e oggetti di classi (grazie a clsx)', () => {
    const result = cn(
      ['shadow-sm', 'rounded'],
      { 'border-red-500': true, 'hidden': false }
    )
    expect(result).toBe('shadow-sm rounded border-red-500')
  })

  it('dovrebbe restituire una stringa vuota se non vengono passati argomenti', () => {
    const result = cn()
    expect(result).toBe('')
  })
})