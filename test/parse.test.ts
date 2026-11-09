import { describe, expect, it } from 'vitest'
import { parseInput, parseSelection } from '../src/commands/parse'
import { parseAuthStatus } from '../src/gh'

describe('parseInput', () => {
  it('returns an undefined action for empty input', () => {
    expect(parseInput('   ')).toEqual({ action: undefined, rest: '', words: [] })
  })

  it('lowers the leading keyword and keeps the remainder verbatim', () => {
    expect(parseInput('FOCUS router rewrite')).toEqual({
      action: 'focus',
      rest: 'router rewrite',
      words: ['FOCUS', 'router', 'rewrite'],
    })
  })

  it('treats a bare keyword as an action with no arguments', () => {
    expect(parseInput('update')).toEqual({ action: 'update', rest: '', words: ['update'] })
  })
})

describe('parseSelection', () => {
  it('expands ranges and sorts the result', () => {
    expect(parseSelection('4-6,1,2')).toEqual([1, 2, 4, 5, 6])
  })

  it('accepts whitespace separated rows', () => {
    expect(parseSelection('3 1')).toEqual([1, 3])
  })

  it('rejects an empty selection', () => {
    expect(parseSelection('  ')).toBeUndefined()
  })

  it('rejects a reversed or malformed range instead of guessing', () => {
    expect(parseSelection('6-4')).toBeUndefined()
    expect(parseSelection('1,x')).toBeUndefined()
    expect(parseSelection('0')).toBeUndefined()
  })
})

describe('parseAuthStatus', () => {
  it('reads every account and marks the active one', () => {
    const output = [
      'github.com',
      '  ✓ Logged in to github.com account hairyf (keyring)',
      '  - Active account: true',
      '  ✓ Logged in to github.com account antfubot (keyring)',
      '  - Active account: false',
    ].join('\n')

    expect(parseAuthStatus(output)).toEqual([
      { login: 'hairyf', host: 'github.com', active: true },
      { login: 'antfubot', host: 'github.com', active: false },
    ])
  })

  it('returns nothing for output without accounts', () => {
    expect(parseAuthStatus('You are not logged into any GitHub hosts.')).toEqual([])
  })
})
