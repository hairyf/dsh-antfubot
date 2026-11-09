import type { Output } from 'tinyexec'
import type { AntfuFlowSettings } from './types'
import process from 'node:process'
import { x } from 'tinyexec'
import { readSettings } from './settings'

/** A gh CLI account as reported by `gh auth status`. */
export interface GhAccount {
  readonly login: string
  readonly active: boolean
  readonly host: string
}

/**
 * Parse `gh auth status` output into accounts.
 *
 * gh prints one block per host and one `✓ Logged in to <host> account <login>`
 * line per account, followed by `Active account: true` for the active one.
 * Unparseable output yields an empty list: a broken gh install must surface as
 * "no accounts", not crash the plugin.
 */
export function parseAuthStatus(output: string): GhAccount[] {
  const accounts: GhAccount[] = []
  let last: GhAccount | undefined

  for (const line of output.split(/\r?\n/)) {
    const login = /Logged in to (\S+) account (\S+)/.exec(line)
    if (login) {
      last = { login: login[2], host: login[1], active: false }
      accounts.push(last)
      continue
    }
    if (last && /Active account:\s*true/i.test(line)) {
      const index = accounts.indexOf(last)
      accounts[index] = { ...last, active: true }
      last = undefined
    }
  }
  return accounts
}

/** List gh CLI accounts without modifying the stored login. */
export async function listAccounts(): Promise<GhAccount[]> {
  const result = await x('gh', ['auth', 'status'], { throwOnError: false })
  return parseAuthStatus(`${result.stdout}\n${result.stderr}`)
}

/** Environment overrides for one scoped invocation; empty when unscoped. */
export async function scopedEnv(settings?: AntfuFlowSettings): Promise<Record<string, string>> {
  const resolved = settings ?? await readSettings()
  const login = resolved.githubAccount
  if (!login)
    return {}

  const token = await x('gh', ['auth', 'token', '--user', login], { throwOnError: false })
  const value = token.stdout.trim()
  if (token.exitCode !== 0 || value.length === 0)
    return {}

  // GH_TOKEN outranks gh's stored credentials for this process only: nothing is
  // written to gh's config, so the global active account is untouched.
  return { GH_TOKEN: value, GITHUB_TOKEN: value }
}

/** Run one gh invocation, scoped to the configured account when set. */
export async function gh(args: readonly string[], cwd?: string): Promise<Output> {
  const extra = await scopedEnv()
  return x('gh', [...args], {
    throwOnError: false,
    nodeOptions: {
      ...(cwd ? { cwd } : {}),
      ...(Object.keys(extra).length > 0 ? { env: { ...process.env, ...extra } } : {}),
    },
  })
}

/** Run one git invocation. Git keeps its own credentials; no gh scoping. */
export async function git(args: readonly string[], cwd?: string): Promise<Output> {
  return x('git', [...args], {
    throwOnError: false,
    nodeOptions: cwd ? { cwd } : {},
  })
}
