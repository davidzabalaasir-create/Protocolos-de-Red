import { describe, expect, it } from 'vitest'
import { PROTOCOLS } from './protocols'
import { REF_CARDS, REF_TABLES } from './reference'
import { translate } from '../i18n'

describe('CCNA reference', () => {
  it('card ids are unique and belong to a table', () => {
    const ids = REF_CARDS.map((c) => c.id)
    expect(new Set(ids).size).toBe(ids.length)
    const tables = new Set(REF_TABLES.map((t) => t.id))
    for (const c of REF_CARDS) expect(tables.has(c.topic), c.id).toBe(true)
  })

  it('every linked lesson exists', () => {
    for (const t of REF_TABLES)
      for (const r of t.rows) {
        if (r.lesson) expect(PROTOCOLS.some((p) => p.id === r.lesson), `${t.id}: ${r.lesson}`).toBe(true)
      }
  })

  it('questions have their placeholders filled', () => {
    for (const c of REF_CARDS) {
      const q = translate('es', c.q, c.v)
      expect(q, c.id).not.toMatch(/\{\w+\}/)
    }
  })

  it('every Spanish string is translated to English', () => {
    // Spanish give-aways: accents or common Spanish words
    const SPANISH = /[áéíóúñ¿¡«»]|\b(de|del|la|el|los|las|y|una?|qué|cuál|cuántos|quién|por|para|sin|con|usa|todos|clase|capa|red|datos|enlace|puerto|salto|hosts?)\b/i
    const missing = new Set<string>()
    const check = (s: string) => {
      if (SPANISH.test(s) && translate('en', s) === s) missing.add(s)
    }
    for (const t of REF_TABLES) {
      check(t.title)
      t.cols.forEach(check)
      if (t.note) check(t.note)
      for (const r of t.rows) r.c.forEach(check)
    }
    for (const c of REF_CARDS) {
      check(c.q)
      check(c.a)
    }
    expect([...missing]).toEqual([])
  })
})
