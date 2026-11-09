import { defineEventHandler, readBody } from 'h3'
import { writeSettings } from '../../settings'

/**
 * Persist one settings patch.
 *
 * Only `githubAccount` is accepted: an unknown field must not become a
 * silently stored value the command handlers never read.
 */
export default defineEventHandler(async (event) => {
  const body = await readBody<{ githubAccount?: unknown }>(event)
  const raw = body?.githubAccount
  if (raw !== undefined && typeof raw !== 'string')
    return { error: 'githubAccount must be a string' }
  if (typeof raw === 'string' && raw.length > 0 && !/^[\w.-]+$/.test(raw))
    return { error: 'githubAccount must be a GitHub login' }
  const settings = await writeSettings({ githubAccount: typeof raw === 'string' ? raw : '' })
  return { settings }
})
