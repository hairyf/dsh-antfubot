import type { AntfuFlowSettings } from './types'
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises'
import { homedir } from 'node:os'
import { dirname, join } from 'node:path'
import process from 'node:process'
import { DEFAULT_SETTINGS } from './types'

/**
 * Absolute path of this plugin's settings file.
 *
 * It lives under the active DSH profile so two profiles can act as different
 * GitHub accounts. `DSH_PROFILE_DIR` is set for profile-launched harnesses;
 * without a profile the user-level DSH home is used.
 */
export function settingsPath(): string {
  const profileDir = process.env.DSH_PROFILE_DIR
  const root = profileDir && profileDir.length > 0
    ? profileDir
    : join(process.env.DSH_HOME ?? join(homedir(), '.dsh'))
  return join(root, 'antfubot', 'settings.json')
}

function normalize(raw: unknown): AntfuFlowSettings {
  if (raw === null || typeof raw !== 'object')
    return DEFAULT_SETTINGS
  const value = raw as Partial<AntfuFlowSettings>
  return {
    githubAccount: typeof value.githubAccount === 'string' ? value.githubAccount.trim() : '',
  }
}

/** Read settings, falling back to defaults on a missing or corrupt file. */
export async function readSettings(): Promise<AntfuFlowSettings> {
  try {
    const text = await readFile(settingsPath(), 'utf8')
    return normalize(JSON.parse(text))
  }
  catch {
    return DEFAULT_SETTINGS
  }
}

/** Merge a patch into the stored settings and persist it atomically. */
export async function writeSettings(patch: Partial<AntfuFlowSettings>): Promise<AntfuFlowSettings> {
  const next = { ...await readSettings(), ...patch }
  const file = settingsPath()
  await mkdir(dirname(file), { recursive: true })
  const tmp = `${file}.${process.pid}.tmp`
  await writeFile(tmp, `${JSON.stringify(next, null, 2)}\n`, 'utf8')
  await rename(tmp, file)
  return next
}
