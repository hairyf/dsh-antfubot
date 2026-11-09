import type { ParsedInput } from '../types'

/**
 * Split a command's raw input into a leading keyword and the remainder.
 *
 * The registry hands over everything after the command name verbatim, so this
 * owns the whole grammar: the optional leading sub-action, then the arguments.
 */
export function parseInput(rawInput: string): ParsedInput {
  const text = rawInput.trim()
  if (text.length === 0)
    return { action: undefined, rest: '', words: [] }
  const parts = text.split(/\s+/)
  return {
    action: parts[0].toLowerCase(),
    rest: text.slice(parts[0].length).trim(),
    words: parts,
  }
}

/**
 * Parse `1,2,4-6` style row selections into a flat sorted list of row numbers.
 *
 * Returns `undefined` when any token is not a positive integer or range, so a
 * typo refuses the whole apply instead of silently acting on a subset.
 */
export function parseSelection(input: string): number[] | undefined {
  const text = input.trim()
  if (text.length === 0)
    return undefined

  const rows = new Set<number>()
  for (const token of text.split(/[,\s]+/).filter(Boolean)) {
    const range = /^(\d+)-(\d+)$/.exec(token)
    if (range) {
      const start = Number(range[1])
      const end = Number(range[2])
      if (start < 1 || end < start || end > 500)
        return undefined
      for (let row = start; row <= end; row++)
        rows.add(row)
      continue
    }
    const single = /^(\d+)$/.exec(token)
    if (!single)
      return undefined
    const row = Number(single[1])
    if (row < 1 || row > 500)
      return undefined
    rows.add(row)
  }
  return rows.size > 0 ? [...rows].sort((a, b) => a - b) : undefined
}
