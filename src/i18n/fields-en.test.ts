import { describe, expect, it } from 'vitest'
import { PROTOCOLS } from '../data/protocols'
import { decodePacket } from '../lib/decode'
import { fieldText } from './fields-en'

// Spanish give-aways: accented letters or common function words. Quoted text is real wire
// content (e.g. "220 Servidor FTP listo") and is left as the program sent it.
const SPANISH = /[áéíóúñ¿¡«»]|\b(de|del|la|el|los|las|sin|con|para|una?|petición|respuesta|cifrad[oa]s?|tipo|longitud|clave|datos|mensaje|nombre|ninguno)\b/i
const unquoted = (s: string) =>
  s
    .replace(/"[^"]*"/g, '""')
    .replace(/'[^']*'/g, "''")
    .replace(/([0-9a-f]{2}:){5}[0-9a-f]{2}/g, 'MAC')
    .replace(/\b[A-Z0-9_-]{2,}\b/g, 'X')

describe('inspector in English', () => {
  it('translates every decoded layer, field name and value', () => {
    const left = new Set<string>()
    for (const p of PROTOCOLS)
      for (const pk of p.packets) {
        const frame = decodePacket(pk, { full: true })
        for (const l of frame.layers) {
          for (const s of [l.name, ...l.fields.flatMap((f) => [f.name, f.value])]) {
            const en = fieldText('en', s)
            if (SPANISH.test(unquoted(en))) left.add(en)
          }
        }
      }
    expect([...left]).toEqual([])
  })

  it('leaves Spanish untouched', () => {
    expect(fieldText('es', 'Tipo de mensaje')).toBe('Tipo de mensaje')
    expect(fieldText('en', 'Tipo de mensaje')).toBe('Message type')
    expect(fieldText('en', 'longitud 12, tipo 1, flags 0x04, stream 1')).toBe('length 12, type 1, flags 0x04, stream 1')
  })
})
