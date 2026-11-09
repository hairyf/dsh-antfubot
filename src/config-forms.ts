import type { AntfubotConfig } from './config'

/** Default used when a caller has no config yet (tests, first composition). */
export const DEFAULT_CONFIG: AntfubotConfig = { githubAccount: '' }

/** Narrow whatever the loader handed us into a usable Config. */
export function normalizeConfig(raw: unknown): AntfubotConfig {
  if (raw === null || typeof raw !== 'object')
    return DEFAULT_CONFIG
  const value = raw as Partial<AntfubotConfig>
  return {
    githubAccount: typeof value.githubAccount === 'string' ? value.githubAccount.trim() : '',
  }
}
